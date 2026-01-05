import React, { useState, useEffect, useRef } from "react";
import {
  FaQrcode,
  FaKey,
  FaCamera,
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaHistory,
  FaUsers,
  FaChartBar,
  FaSignInAlt,
  FaSignOutAlt,
  FaSearch,
  FaPlus,
  FaTrash,
  FaEdit,
  FaFilter,
  FaTimes,
  FaCheck,
  FaPrint,
  FaDownload,
  FaUserPlus,
  FaDatabase,
  FaMobileAlt,
  FaIdCard,
  FaCameraRetro,
  FaImage,
  FaSave,
  FaTimesCircle,
  FaArrowLeft,
  FaArrowRight
} from "react-icons/fa";
import "./Attendance.css";

const Attendance = () => {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('attendanceEmployees');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        name: "Dr. Ali Valiyev", 
        position: "Bosh shifokor", 
        pin: "0001",
        photo: null,
        joinDate: "2024-01-15"
      },
      { 
        id: 2, 
        name: "Hamshira Zuhra", 
        position: "Katta hamshira", 
        pin: "0002",
        photo: null,
        joinDate: "2024-02-10"
      },
      { 
        id: 3, 
        name: "Dr. Nodira Xasanova", 
        position: "Stomatolog", 
        pin: "0003",
        photo: null,
        joinDate: "2024-03-05"
      },
    ];
  });

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('attendanceRecords');
    return saved ? JSON.parse(saved) : [
      { id: 1, employeeId: 1, date: "2024-12-15", checkIn: "08:00", checkOut: "17:00", status: "full", method: "qr", photo: null },
      { id: 2, employeeId: 2, date: "2024-12-15", checkIn: "08:30", checkOut: "-", status: "late", method: "pin", photo: null },
    ];
  });

  const [activeTab, setActiveTab] = useState("checkin");
  const [scanMode, setScanMode] = useState("checkin");
  const [loginMethod, setLoginMethod] = useState("qr");
  const [pinInput, setPinInput] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFor, setPhotoFor] = useState(null); // {type: 'checkin/checkout', employeeId: id}
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoRef = useRef(null);
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Statistikalar
  const todayRecords = records.filter(r => r.date === today);
  const presentCount = todayRecords.filter(r => r.status !== "absent").length;
  const lateCount = todayRecords.filter(r => r.status === "late").length;
  const absentCount = employees.length - presentCount;

  // LocalStorage ga saqlash
  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    localStorage.setItem('attendanceEmployees', JSON.stringify(employees));
  }, [records, employees]);

  // Kamerani yoqish
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Kamera xatosi:', err);
      alert("Kamerani ishlatish uchun ruxsat bering!");
    }
  };

  // Rasm tushirish
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      
      const photoData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedPhoto(photoData);
      
      // Kamerani o'chirish
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      setTimeout(() => {
        setShowCamera(false);
        setShowPhotoModal(true);
      }, 500);
    }
  };

  // Rasmni saqlash
  const savePhoto = () => {
    if (capturedPhoto && photoFor) {
      if (photoFor.type === 'employee') {
        // Xodimning rasmini saqlash
        setEmployees(prev => prev.map(emp => 
          emp.id === photoFor.employeeId 
            ? { ...emp, photo: capturedPhoto }
            : emp
        ));
        alert("Xodim rasmi saqlandi!");
      } else if (photoFor.type === 'checkin' || photoFor.type === 'checkout') {
        // Kirish/chiqish rasmini saqlash
        const newRecord = {
          id: Date.now(),
          employeeId: photoFor.employeeId,
          date: today,
          checkIn: photoFor.type === 'checkin' ? now.toTimeString().split(' ')[0].substring(0, 5) : "",
          checkOut: photoFor.type === 'checkout' ? now.toTimeString().split(' ')[0].substring(0, 5) : "",
          status: photoFor.type === 'checkin' && now.toTimeString().split(' ')[0].substring(0, 5) > "08:00" ? "late" : "full",
          method: photoFor.method || "qr",
          photo: capturedPhoto,
          timestamp: now.toISOString()
        };
        
        setRecords(prev => [...prev, newRecord]);
        
        setCurrentEmployee({
          name: employees.find(e => e.id === photoFor.employeeId)?.name,
          time: now.toTimeString().split(' ')[0].substring(0, 5),
          action: photoFor.type === 'checkin' ? "Kirish" : "Chiqish",
          photo: capturedPhoto
        });
        
        alert(`✅ ${photoFor.type === 'checkin' ? 'Kirish' : 'Chiqish'} muvaffaqiyatli! Rasm saqlandi.`);
      }
      
      setCapturedPhoto(null);
      setShowPhotoModal(false);
      setPhotoFor(null);
    }
  };

  // QR kod skanerlash (simulyatsiya)
  const handleQRScan = () => {
    setPhotoFor({ 
      type: scanMode === 'checkin' ? 'checkin' : 'checkout', 
      employeeId: employees[Math.floor(Math.random() * employees.length)].id,
      method: 'qr'
    });
    setShowCamera(true);
    startCamera();
  };

  // PIN kod orqali kirish
  const handlePinLogin = () => {
    if (pinInput.length !== 4) {
      alert("PIN kod 4 xonali bo'lishi kerak!");
      return;
    }

    const employee = employees.find(emp => emp.pin === pinInput);
    if (employee) {
      setPhotoFor({ 
        type: scanMode === 'checkin' ? 'checkin' : 'checkout', 
        employeeId: employee.id,
        method: 'pin'
      });
      setShowCamera(true);
      startCamera();
      setPinInput("");
    } else {
      alert("❌ Noto'g'ri PIN kod!");
      setPinInput("");
    }
  };

  // Xodim qo'shish
  const addEmployee = () => {
    const name = prompt("Xodimning to'liq ismi:");
    if (!name) return;
    
    const position = prompt("Lavozimi:");
    if (!position) return;
    
    const newEmployee = {
      id: Date.now(),
      name: name,
      position: position,
      pin: String(employees.length + 1).padStart(4, '0'),
      photo: null,
      joinDate: today
    };
    
    setEmployees([...employees, newEmployee]);
    alert(`✅ ${name} qo'shildi!\nPIN: ${newEmployee.pin}`);
  };

  // Xodimga rasm yuklash
  const uploadEmployeePhoto = (employeeId) => {
    setPhotoFor({ type: 'employee', employeeId });
    setShowCamera(true);
    startCamera();
  };

  // Keypad raqamlari
  const pinButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"];

  // Status ranglari
  const getStatusInfo = (status) => {
    const statuses = {
      full: { text: "To'liq", color: "#10B981", bg: "#D1FAE5", icon: "✅" },
      late: { text: "Kechikkan", color: "#F59E0B", bg: "#FEF3C7", icon: "⏰" },
      early: { text: "Erta", color: "#3B82F6", bg: "#DBEAFE", icon: "⏱️" },
      absent: { text: "Kelmagan", color: "#EF4444", bg: "#FEE2E2", icon: "❌" }
    };
    return statuses[status] || statuses.full;
  };

  return (
    <div className="attendance-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <FaMobileAlt className="header-icon" />
          <h1>Smart Attendance</h1>
          <span className="subtitle">Avtomatik rasmli ish vaqti tizimi</span>
        </div>
        <div className="header-right">
          <div className="current-time">
            <FaClock />
            <span>{now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="current-date">
            <FaCalendarAlt />
            <span>{now.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="main-nav">
        <button 
          className={`nav-btn ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkin')}
        >
          <FaSignInAlt />
          <span>Kirish/Chiqish</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <FaUsers />
          <span>Xodimlar</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory />
          <span>Tarix</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FaChartBar />
          <span>Hisobotlar</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="">
        {/* Kirish/Chiqish tab */}
        {activeTab === 'checkin' && (
          <div className="checkin-section">
            <div className="mode-selector">
              <button 
                className={`mode-btn ${scanMode === 'checkin' ? 'active' : ''}`}
                onClick={() => setScanMode('checkin')}
              >
                <FaSignInAlt />
                <span>Kirish</span>
              </button>
              <button 
                className={`mode-btn ${scanMode === 'checkout' ? 'active' : ''}`}
                onClick={() => setScanMode('checkout')}
              >
                <FaSignOutAlt />
                <span>Chiqish</span>
              </button>
            </div>

            <div className="current-action">
              <h2>
                {scanMode === 'checkin' ? 'Ishga Kirish' : 'Ishdan Chiqish'}
              </h2>
              <p>Avtomatik rasm tushiriladi</p>
            </div>

            <div className="login-options">
              {/* QR Kod */}
              <div className={`login-card ${loginMethod === 'qr' ? 'active' : ''}`}>
                <div className="card-icon">
                  <FaQrcode />
                </div>
                <h3>QR Kod</h3>
                <p>QR kodni skanerlang</p>
                <button 
                  className="action-btn primary"
                  onClick={() => {
                    setLoginMethod('qr');
                    handleQRScan();
                  }}
                >
                  <FaQrcode /> QR Skanerlash
                </button>
              </div>

              {/* PIN Kod */}
              <div className={`login-card ${loginMethod === 'pin' ? 'active' : ''}`}>
                <div className="card-icon">
                  <FaKey />
                </div>
                <h3>PIN Kod</h3>
                <p>4 xonali maxsus kod</p>
                
                <div className="pin-display">
                  <div className="pin-dots">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`pin-dot ${i <= pinInput.length ? 'filled' : ''}`} />
                    ))}
                  </div>
                  <p className="pin-value">{pinInput}</p>
                </div>

                <div className="keypad">
                  {pinButtons.map((btn, idx) => (
                    <button
                      key={idx}
                      className={`keypad-btn ${btn === 'C' || btn === '⌫' ? 'special' : ''}`}
                      onClick={() => {
                        if (btn === 'C') setPinInput("");
                        else if (btn === '⌫') setPinInput(p => p.slice(0, -1));
                        else if (pinInput.length < 4) setPinInput(p => p + btn);
                      }}
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                <button 
                  className="action-btn secondary"
                  onClick={handlePinLogin}
                  disabled={pinInput.length !== 4}
                >
                  <FaSignInAlt /> Kirish & Rasm Tushirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Xodimlar tab */}
        {activeTab === 'employees' && (
          <div className="employees-section">
            <div className="section-header">
              <h2><FaUsers /> Xodimlar Ro'yxati</h2>
              <button className="add-btn" onClick={addEmployee}>
                <FaUserPlus /> Yangi Xodim
              </button>
            </div>

            <div className="search-box">
              <FaSearch />
              <input 
                type="text"
                placeholder="Xodim qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="employees-grid">
              {employees
                .filter(emp => 
                  emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  emp.pin.includes(searchTerm)
                )
                .map(emp => {
                  const empRecords = records.filter(r => r.employeeId === emp.id);
                  const todayRecord = empRecords.find(r => r.date === today);
                  
                  return (
                    <div key={emp.id} className="employee-card">
                      <div className="card-header">
                        <div className="employee-photo">
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} />
                          ) : (
                            <div className="photo-placeholder">
                              <FaUser />
                            </div>
                          )}
                          <button 
                            className="photo-btn"
                            onClick={() => uploadEmployeePhoto(emp.id)}
                            title="Rasm yuklash"
                          >
                            <FaCamera />
                          </button>
                        </div>
                        <div className="employee-info">
                          <h3>{emp.name}</h3>
                          <p className="position">{emp.position}</p>
                          <div className="employee-pin">
                            <FaIdCard /> PIN: {emp.pin}
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <div className="stats-row">
                          <div className="stat">
                            <span className="stat-value">{empRecords.length}</span>
                            <span className="stat-label">Kun</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">
                              {todayRecord ? (todayRecord.checkOut ? '✅' : '🔄') : '❌'}
                            </span>
                            <span className="stat-label">Bugun</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">{emp.joinDate}</span>
                            <span className="stat-label">Qo'shilgan</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <button 
                          className="action-btn small"
                          onClick={() => {
                            setActiveTab('checkin');
                            setScanMode('checkin');
                            setPhotoFor({ 
                              type: 'checkin', 
                              employeeId: emp.id,
                              method: 'manual'
                            });
                            setShowCamera(true);
                            startCamera();
                          }}
                        >
                          <FaSignInAlt /> Kirish
                        </button>
                        <button 
                          className="action-btn small"
                          onClick={() => {
                            setActiveTab('checkin');
                            setScanMode('checkout');
                            setPhotoFor({ 
                              type: 'checkout', 
                              employeeId: emp.id,
                              method: 'manual'
                            });
                            setShowCamera(true);
                            startCamera();
                          }}
                        >
                          <FaSignOutAlt /> Chiqish
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tarix tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <h2><FaHistory /> Ish Vaqti Tarixi</h2>
              <div className="filters">
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="filter-input"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-input"
                >
                  <option value="all">Barchasi</option>
                  <option value="full">To'liq</option>
                  <option value="late">Kechikkan</option>
                  <option value="early">Erta</option>
                  <option value="absent">Kelmagan</option>
                </select>
                <button 
                  className="clear-btn"
                  onClick={() => { setFilterDate(""); setFilterStatus("all"); }}
                >
                  <FaTimes /> Tozalash
                </button>
              </div>
            </div>

            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Sana</th>
                    <th>Kirish</th>
                    <th>Chiqish</th>
                    <th>Holat</th>
                    <th>Rasm</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .filter(rec => 
                      (!filterDate || rec.date === filterDate) &&
                      (filterStatus === 'all' || rec.status === filterStatus)
                    )
                    .slice(0, 20)
                    .map(rec => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      if (!emp) return null;
                      
                      const status = getStatusInfo(rec.status);
                      
                      return (
                        <tr key={rec.id}>
                          <td className="employee-cell">
                            <div className="avatar">
                              {emp.photo ? (
                                <img src={emp.photo} alt={emp.name} />
                              ) : (
                                <FaUser />
                              )}
                            </div>
                            <div>
                              <strong>{emp.name}</strong>
                              <small>{emp.position}</small>
                            </div>
                          </td>
                          <td>{rec.date}</td>
                          <td>
                            <span className={`time ${rec.checkIn > "08:00" ? 'late' : ''}`}>
                              {rec.checkIn}
                            </span>
                          </td>
                          <td>
                            <span className="time">{rec.checkOut || "-"}</span>
                          </td>
                          <td>
                            <span className="status-badge" style={{ 
                              background: status.bg, 
                              color: status.color 
                            }}>
                              {status.icon} {status.text}
                            </span>
                          </td>
                          <td>
                            {rec.photo ? (
                              <button 
                                className="view-photo-btn"
                                onClick={() => {
                                  setCapturedPhoto(rec.photo);
                                  setShowPhotoModal(true);
                                }}
                              >
                                <FaImage /> Ko'rish
                              </button>
                            ) : (
                              <span className="no-photo">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hisobotlar tab */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2><FaChartBar /> Hisobotlar</h2>
              <div className="report-actions">
                <button className="report-btn">
                  <FaPrint /> Chop etish
                </button>
                <button className="report-btn">
                  <FaDownload /> Yuklab olish
                </button>
              </div>
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon present">
                  <FaUsers />
                </div>
                <div className="stat-content">
                  <h3>{presentCount}</h3>
                  <p>Bugun Kelgan</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon late">
                  <FaClock />
                </div>
                <div className="stat-content">
                  <h3>{lateCount}</h3>
                  <p>Kechikkan</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon absent">
                  <FaTimes />
                </div>
                <div className="stat-content">
                  <h3>{absentCount}</h3>
                  <p>Kelmagan</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon total">
                  <FaDatabase />
                </div>
                <div className="stat-content">
                  <h3>{records.length}</h3>
                  <p>Jami Yozuvlar</p>
                </div>
              </div>
            </div>

            <div className="reports-grid">
              <div className="report-card">
                <h3>Kunlik Faollik</h3>
                <div className="report-content">
                  <p><strong>Bugun:</strong> {today}</p>
                  <p><strong>Jami kelgan:</strong> {presentCount} ta</p>
                  <p><strong>Kechikkanlar:</strong> {lateCount} ta</p>
                  <p><strong>Kelmaganlar:</strong> {absentCount} ta</p>
                </div>
              </div>
              
              <div className="report-card">
                <h3>Eng Faol Xodimlar</h3>
                <div className="report-content">
                  {employees
                    .map(emp => ({
                      ...emp,
                      count: records.filter(r => r.employeeId === emp.id).length
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map((emp, idx) => (
                      <div key={emp.id} className="top-employee">
                        <span className="rank">{idx + 1}.</span>
                        <span className="name">{emp.name}</span>
                        <span className="count">{emp.count} kun</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal">
          <div className="camera-content">
            <div className="camera-header">
              <h3>
                <FaCameraRetro /> {photoFor?.type === 'employee' ? 'Xodim rasmi' : 
                  photoFor?.type === 'checkin' ? 'Kirish rasmi' : 'Chiqish rasmi'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCamera(false);
                  if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                  }
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="camera-preview">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
              />
              <canvas ref={canvasRef} width="640" height="480" style={{display: 'none'}} />
            </div>
            
            <div className="camera-controls">
              <button 
                className="capture-btn"
                onClick={capturePhoto}
              >
                <FaCamera /> Rasm Tushirish
              </button>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCamera(false);
                  if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                  }
                }}
              >
                <FaTimes /> Bekor qilish
              </button>
            </div>
            
            <div className="camera-instructions">
              <p>📸 Yuzingizni kameraga to'g'ri yo'naltiring</p>
              <p>🌞 Yorug'lik yaxshi bo'lsin</p>
              <p>😊 Tabassim qiling</p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {showPhotoModal && capturedPhoto && (
        <div className="photo-modal">
          <div className="photo-content">
            <div className="photo-header">
              <h3>Rasmni Ko'rish</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPhotoModal(false);
                  setCapturedPhoto(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="photo-preview">
              <img src={capturedPhoto} alt="Captured" ref={photoRef} />
            </div>
            
            <div className="photo-actions">
              <button 
                className="save-btn"
                onClick={savePhoto}
              >
                <FaSave /> Saqlash
              </button>
              <button 
                className="retake-btn"
                onClick={() => {
                  setShowPhotoModal(false);
                  setShowCamera(true);
                  startCamera();
                }}
              >
                <FaCamera /> Qayta Tushirish
              </button>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowPhotoModal(false);
                  setCapturedPhoto(null);
                  setPhotoFor(null);
                }}
              >
                <FaTimesCircle /> Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <FaMobileAlt className="footer-icon" />
            <div>
              <h4>Smart Attendance System</h4>
              <p>Avtomatik rasmli ish vaqti monitoringi</p>
            </div>
          </div>
          
          <div className="footer-stats">
            <div className="footer-stat">
              <FaUsers />
              <span>{employees.length} xodim</span>
            </div>
            <div className="footer-stat">
              <FaDatabase />
              <span>{records.length} yozuv</span>
            </div>
            <div className="footer-stat">
              <FaCamera />
              <span>{records.filter(r => r.photo).length} rasm</span>
            </div>
          </div>
          
          <div className="footer-actions">
            <button 
              className="footer-btn"
              onClick={() => setActiveTab('checkin')}
            >
              <FaSignInAlt /> Kirish
            </button>
            <button 
              className="footer-btn"
              onClick={() => {
                const randomEmp = employees[Math.floor(Math.random() * employees.length)];
                setPhotoFor({ 
                  type: 'checkin', 
                  employeeId: randomEmp.id,
                  method: 'demo'
                });
                setShowCamera(true);
                startCamera();
              }}
            >
              <FaCamera /> Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Attendance;