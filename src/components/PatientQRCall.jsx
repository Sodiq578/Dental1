import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { 
  FiUser, 
  FiBell, 
  FiClock, 
  FiDownload, 
  FiPrinter, 
  FiCopy, 
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
  FiVolume2,
  FiStopCircle,
  FiPlay,
  FiPause,
  FiCalendar,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiSearch
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "./PatientQRCall.css";
const PatientQRCall = () => {
  const [patients, setPatients] = useState([
    { id: "PAT-001", name: "Ali Valiyev", room: "101", doctor: "Dr. Akmalov", status: "waiting", time: "14:30" },
    { id: "PAT-002", name: "Zarina Qodirova", room: "202", doctor: "Dr. Karimova", status: "in-progress", time: "14:45" },
    { id: "PAT-003", name: "Shavkat Ismoilov", room: "303", doctor: "Dr. Toshmatov", status: "waiting", time: "15:00" },
    { id: "PAT-004", name: "Nigora Sultonova", room: "404", doctor: "Dr. Nosirova", status: "completed", time: "13:30" },
    { id: "PAT-005", name: "Javohir Rasulov", room: "505", doctor: "Dr. Sharipov", status: "waiting", time: "15:15" },
  ]);

  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [qrSize, setQrSize] = useState(300);
  const [showHistory, setShowHistory] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("single"); // single or batch
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [notificationSound, setNotificationSound] = useState(true);
  const [announcementText, setAnnouncementText] = useState("");
  const [displayScreen, setDisplayScreen] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const callTimerRef = useRef(null);
  const notificationSoundRef = useRef(null);

  // Initialize call history
  useEffect(() => {
    const history = [
      { id: 1, patientId: "PAT-001", patientName: "Ali Valiyev", time: "2024-01-15 10:30", duration: "2:30", status: "completed" },
      { id: 2, patientId: "PAT-002", patientName: "Zarina Qodirova", time: "2024-01-15 11:15", duration: "1:45", status: "completed" },
      { id: 3, patientId: "PAT-003", patientName: "Shavkat Ismoilov", time: "2024-01-15 09:45", duration: "3:15", status: "completed" },
    ];
    setCallHistory(history);
  }, []);

  // Auto refresh timer
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshPatientList();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    if (viewMode === "single") {
      toast.info(`${patient.name} tanlandi`);
    }
  };

  const callPatient = (patient) => {
    if (!patient) return;
    
    setIsCalling(true);
    setCallDuration(0);
    
    // Start call timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Add to display screen
    setDisplayScreen(prev => [
      ...prev,
      {
        id: Date.now(),
        patient,
        time: new Date().toLocaleTimeString(),
        status: 'calling'
      }
    ]);

    // Play notification sound
    if (notificationSound) {
      // In real app, use actual sound file
      toast.success(`${patient.name} chaqirildi!`);
    }

    // Update patient status
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, status: 'in-progress' } : p
    ));

    // Add to call history
    const newHistory = {
      id: callHistory.length + 1,
      patientId: patient.id,
      patientName: patient.name,
      time: new Date().toLocaleString(),
      status: 'in-progress'
    };
    setCallHistory(prev => [newHistory, ...prev]);
  };

  const endCall = () => {
    if (!isCalling) return;
    
    clearInterval(callTimerRef.current);
    setIsCalling(false);
    setIsPaused(false);
    
    // Update patient status
    setPatients(prev => prev.map(p => 
      p.id === selectedPatient.id ? { ...p, status: 'completed' } : p
    ));

    // Update call history
    if (callHistory[0]) {
      setCallHistory(prev => prev.map((item, index) => 
        index === 0 ? { ...item, duration: formatTime(callDuration), status: 'completed' } : item
      ));
    }

    // Update display screen
    setDisplayScreen(prev => prev.map(item => 
      item.patient.id === selectedPatient.id ? { ...item, status: 'completed' } : item
    ));

    toast.success(`Chaqiruv yakunlandi. Davomiyligi: ${formatTime(callDuration)}`);
  };

  const pauseCall = () => {
    if (!isCalling) return;
    
    setIsPaused(!isPaused);
    if (!isPaused) {
      clearInterval(callTimerRef.current);
      toast.info("Chaqiruv pauzaga olindi");
    } else {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      toast.info("Chaqiruv davom ettirildi");
    }
  };

  const callMultiplePatients = () => {
    if (selectedPatients.length === 0) {
      toast.warning("Kamida bitta bemor tanlang!");
      return;
    }

    selectedPatients.forEach(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        callPatient(patient);
      }
    });

    toast.success(`${selectedPatients.length} ta bemor chaqirildi!`);
    setSelectedPatients([]);
  };

  const togglePatientSelection = (patientId) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${selectedPatient.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
    toast.success("QR kod yuklab olindi!");
  };

  const copyQRData = () => {
    const qrData = `CALL_PATIENT:${selectedPatient.id}|NAME:${selectedPatient.name}|ROOM:${selectedPatient.room}`;
    navigator.clipboard.writeText(qrData).then(() => {
      toast.success("QR ma'lumotlari nusxalandi!");
    });
  };

  const makeAnnouncement = () => {
    if (!announcementText.trim()) {
      toast.warning("E'lon matnini kiriting!");
      return;
    }

    toast.info(`E'lon: ${announcementText}`);
    setAnnouncementText("");
    
    // In real app, this would trigger audio announcement
    console.log("Announcement:", announcementText);
  };

  const refreshPatientList = () => {
    // Simulate API call
    toast.info("Bemorlar ro'yxati yangilandi");
  };

  const clearDisplayScreen = () => {
    setDisplayScreen([]);
    toast.info("Ekran tozalandi");
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.room.includes(searchQuery)
  );

  const waitingPatients = patients.filter(p => p.status === "waiting");
  const inProgressPatients = patients.filter(p => p.status === "in-progress");

  return (
    <div className="qr-call-system">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="system-header">
        <div className="header-left">
          <FiUser className="header-icon" />
          <div>
            <h1>Bemor Chaqirish Tizimi</h1>
            <p className="subtitle">QR kod orqali bemorlarni chaqirish va boshqarish</p>
          </div>
        </div>
        <div className="header-right">
          <div className="stats-container">
            <div className="stat-card">
              <span className="stat-number">{waitingPatients.length}</span>
              <span className="stat-label">Kutilmoqda</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{inProgressPatients.length}</span>
              <span className="stat-label">Jarayonda</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{patients.filter(p => p.status === "completed").length}</span>
              <span className="stat-label">Yakunlangan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Patient List */}
        <div className="left-panel">
          <div className="panel-header">
            <h2>Bemorlar Ro'yxati</h2>
            <div className="panel-controls">
              <div className="search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Bemor qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={refreshPatientList} className="btn-icon">
                <FiRefreshCw />
              </button>
            </div>
          </div>

          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
            >
              Bittadan
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'batch' ? 'active' : ''}`}
              onClick={() => setViewMode('batch')}
            >
              Guruhlab
            </button>
          </div>

          <div className="patients-list">
            {filteredPatients.map(patient => (
              <div 
                key={patient.id}
                className={`patient-card ${selectedPatient.id === patient.id ? 'selected' : ''} ${
                  viewMode === 'batch' && selectedPatients.includes(patient.id) ? 'batch-selected' : ''
                }`}
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="patient-info">
                  <div className="patient-id">{patient.id}</div>
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-details">
                    <span className="detail-item">
                      <FiMapPin /> {patient.room}
                    </span>
                    <span className="detail-item">
                      <FiUser /> {patient.doctor}
                    </span>
                    <span className="detail-item">
                      <FiClock /> {patient.time}
                    </span>
                  </div>
                </div>
                <div className="patient-actions">
                  <div className={`status-badge status-${patient.status}`}>
                    {patient.status === 'waiting' && 'Kutilmoqda'}
                    {patient.status === 'in-progress' && 'Jarayonda'}
                    {patient.status === 'completed' && 'Yakunlangan'}
                  </div>
                  {viewMode === 'batch' && (
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        togglePatientSelection(patient.id);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel - QR Code and Controls */}
        <div className="center-panel">
          <div className="qr-container">
            <div className="qr-header">
              <h3>QR Kod Generator</h3>
              <div className="qr-controls">
                <button onClick={downloadQRCode} className="btn-secondary">
                  <FiDownload /> Yuklab olish
                </button>
                <button onClick={copyQRData} className="btn-secondary">
                  <FiCopy /> Nusxa olish
                </button>
                <div className="size-control">
                  <span>Hajm:</span>
                  <input
                    type="range"
                    min="150"
                    max="500"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                  />
                  <span>{qrSize}px</span>
                </div>
              </div>
            </div>

            <div className="qr-display">
              <div className="qr-code-wrapper">
                <QRCode
                  id="qr-code-svg"
                  value={`CALL_PATIENT:${selectedPatient.id}|NAME:${selectedPatient.name}|ROOM:${selectedPatient.room}|TIME:${new Date().toISOString()}`}
                  size={qrSize}
                  level="H"
                />
                <div className="qr-overlay">
                  <div className="qr-patient-info">
                    <h4>{selectedPatient.name}</h4>
                    <p>{selectedPatient.id} • Xona: {selectedPatient.room}</p>
                    <p>Shifokor: {selectedPatient.doctor}</p>
                  </div>
                </div>
              </div>
              
              <div className="qr-data">
                <h4>QR Kod Ma'lumotlari:</h4>
                <code className="qr-code-text">
                  CALL_PATIENT:{selectedPatient.id}|NAME:{selectedPatient.name}|ROOM:{selectedPatient.room}
                </code>
              </div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="call-controls">
            <div className="call-info">
              <div className="current-patient">
                <h4>Joriy Bemor:</h4>
                <div className="patient-display">
                  <div className="patient-avatar">
                    <FiUser />
                  </div>
                  <div className="patient-details-display">
                    <div className="display-name">{selectedPatient.name}</div>
                    <div className="display-id">{selectedPatient.id} • Xona {selectedPatient.room}</div>
                  </div>
                </div>
              </div>
              
              {isCalling && (
                <div className="call-timer">
                  <FiClock />
                  <span className="timer-text">{formatTime(callDuration)}</span>
                  <div className="timer-status">
                    {isPaused ? 'Pauza' : 'Chaqiruv davom etmoqda'}
                  </div>
                </div>
              )}
            </div>

            <div className="call-buttons">
              <button
                onClick={() => callPatient(selectedPatient)}
                className={`btn-call ${isCalling ? 'btn-calling' : ''}`}
                disabled={isCalling && !isPaused}
              >
                <FiBell /> {isCalling ? 'Chaqiruv davom etmoqda' : 'Bemorni chaqirish'}
              </button>
              
              {isCalling && (
                <>
                  <button onClick={pauseCall} className="btn-pause">
                    {isPaused ? <FiPlay /> : <FiPause />}
                    {isPaused ? 'Davom ettirish' : 'Pauza'}
                  </button>
                  <button onClick={endCall} className="btn-end">
                    <FiStopCircle /> Yakunlash
                  </button>
                </>
              )}
              
              {viewMode === 'batch' && selectedPatients.length > 0 && (
                <button onClick={callMultiplePatients} className="btn-batch">
                  <FiBell /> {selectedPatients.length} ta bemorni chaqirish
                </button>
              )}
            </div>
          </div>

          {/* Announcement Section */}
          <div className="announcement-section">
            <h4>E'lon Qilish</h4>
            <div className="announcement-input">
              <input
                type="text"
                placeholder="E'lon matnini kiriting..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
              />
              <button onClick={makeAnnouncement} className="btn-announce">
                <FiVolume2 /> E'lon qilish
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Display Screen */}
        <div className="right-panel">
          <div className="panel-header">
            <h2>Ko'rsatish Ekrani</h2>
            <button onClick={clearDisplayScreen} className="btn-secondary">
              Ekranni tozalash
            </button>
          </div>

          <div className="display-screen">
            {displayScreen.length === 0 ? (
              <div className="empty-display">
                <FiAlertCircle />
                <p>Hozircha chaqiruvlar mavjud emas</p>
              </div>
            ) : (
              displayScreen.map(item => (
                <div key={item.id} className="display-item">
                  <div className="display-patient">
                    <div className="display-avatar">
                      <FiUser />
                    </div>
                    <div className="display-info">
                      <div className="display-name">{item.patient.name}</div>
                      <div className="display-id">{item.patient.id}</div>
                    </div>
                  </div>
                  <div className="display-details">
                    <span className="display-time">{item.time}</span>
                    <span className={`display-status status-${item.status}`}>
                      {item.status === 'calling' ? 'Chaqirilmoqda' : 'Yakunlandi'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="settings-section">
            <h4>Sozlamalar</h4>
            <div className="settings-options">
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={notificationSound}
                  onChange={(e) => setNotificationSound(e.target.checked)}
                />
                <span>Bildirishnoma tovushi</span>
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span>Avtomatik yangilash</span>
              </label>
              {autoRefresh && (
                <div className="refresh-control">
                  <span>Yangilash oraligi:</span>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  >
                    <option value="15">15 soniya</option>
                    <option value="30">30 soniya</option>
                    <option value="60">1 daqiqa</option>
                    <option value="300">5 daqiqa</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Call History */}
          <div className="history-section">
            <div className="history-header">
              <h4>Chaqiruvlar Tarixi</h4>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="btn-icon"
              >
                {showHistory ? <FiChevronRight /> : <FiChevronLeft />}
              </button>
            </div>
            
            {showHistory && (
              <div className="history-list">
                {callHistory.slice(0, 5).map(record => (
                  <div key={record.id} className="history-item">
                    <div className="history-info">
                      <div className="history-patient">{record.patientName}</div>
                      <div className="history-time">{record.time}</div>
                    </div>
                    <div className="history-duration">
                      {record.duration && <span>{record.duration}</span>}
                      <span className={`history-status status-${record.status}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientQRCall;