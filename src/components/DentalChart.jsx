import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/appContext";
import {
  FaTooth,
  FaPlus,
  FaTrash,
  FaSave,
  FaEdit,
  FaSearch,
  FaUser,
  FaCalendarAlt,
  FaStethoscope,
  FaNotesMedical,
  FaClipboardCheck,
  FaTeeth,
  FaTeethOpen,
  FaCrown,
  FaBrush, // FaToothbrush o'rniga
  FaSyringe,
  FaFileMedical,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaTimes,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaAngleLeft,
  FaAngleRight,
  FaLayerGroup,
  FaCube,
  FaExpand,
  FaCompress,
  FaPalette,
  FaPrint,
  FaShare,
  FaDownload,
  FaUpload,
  FaHistory,
  FaChartBar,
  FaCommentMedical,
  FaProcedures,
  FaPrescriptionBottleAlt,
  FaMinus,
  FaPhone
} from "react-icons/fa";
import './DentalChart.css';

const DentalChart = () => {
  const { 
    currentUser, 
    patients = [],
    dentalCharts, 
    updateDentalChart,
    addDocument,
    addNotification,
    addAuditLog
  } = useContext(AppContext);

  // Demo bemorlar (real loyihada contextdan keladi)
  const demoPatients = [
    {
      id: 1,
      name: "Hasan Alimov",
      age: 35,
      gender: "male",
      phone: "+998 90 123 45 67",
      lastVisit: "2025-01-15",
      nextAppointment: "2025-02-15",
      dentist: "Dr. Ali Valiyev"
    },
    {
      id: 2,
      name: "Zarina Nazarova",
      age: 28,
      gender: "female",
      phone: "+998 91 234 56 78",
      lastVisit: "2025-01-10",
      nextAppointment: "2025-02-10",
      dentist: "Dr. Ali Valiyev"
    },
    {
      id: 3,
      name: "Bekzod Rasulov",
      age: 45,
      gender: "male",
      phone: "+998 93 345 67 89",
      lastVisit: "2024-12-01",
      nextAppointment: "2025-01-30",
      dentist: "Dr. Ali Valiyev"
    },
    {
      id: 4,
      name: "Madina Xolmirzayeva",
      age: 31,
      gender: "female",
      phone: "+998 94 456 78 90",
      lastVisit: "2025-01-20",
      nextAppointment: "2025-02-20",
      dentist: "Dr. Ali Valiyev"
    }
  ];

  // Tish holatlari
  const toothConditions = {
    healthy: { name: "Sog'lom", color: "#10B981", icon: "😊" },
    cavity: { name: "Karies", color: "#EF4444", icon: "🦷" },
    filled: { name: "Plomba", color: "#3B82F6", icon: "⚫" },
    crown: { name: "Koronka", color: "#F59E0B", icon: "👑" },
    missing: { name: "Yo'q", color: "#6B7280", icon: "❌" },
    implant: { name: "Implant", color: "#8B5CF6", icon: "⭐" },
    rootCanal: { name: "Kanal davolash", color: "#EC4899", icon: "🌀" },
    wisdom: { name: "Aqil tishi", color: "#6366F1", icon: "🧠" },
    deciduous: { name: "Sut tishi", color: "#60A5FA", icon: "👶" }
  };

  // Tishlarni boshlang'ich holati
  const initialTeeth = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    condition: "healthy",
    notes: "",
    lastCheck: null,
    treatments: [],
    xray: null,
    sensitivity: false,
    painLevel: 0,
    position: getToothPosition(i + 1),
    quadrant: getQuadrant(i + 1),
    surface: getSurface(i + 1)
  }));

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [toothData, setToothData] = useState(initialTeeth);
  const [activeCondition, setActiveCondition] = useState("cavity");
  const [show3DView, setShow3DView] = useState(true);
  const [viewMode, setViewMode] = useState("full"); // full, upper, lower
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [currentTooth, setCurrentTooth] = useState(null);
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [chartHistory, setChartHistory] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showColorGuide, setShowColorGuide] = useState(true);
  const [selectedSurface, setSelectedSurface] = useState(null);

  // Tish pozitsiyalari
  function getToothPosition(number) {
    if (number <= 8) return "Upper Right";
    if (number <= 16) return "Upper Left";
    if (number <= 24) return "Lower Left";
    return "Lower Right";
  }

  function getQuadrant(number) {
    if (number <= 8) return 1;
    if (number <= 16) return 2;
    if (number <= 24) return 3;
    return 4;
  }

  function getSurface(number) {
    const surfaces = {
      1: ["Buccal", "Lingual", "Mesial", "Distal", "Occlusal"],
      2: ["Buccal", "Lingual", "Mesial", "Distal", "Occlusal"],
      3: ["Buccal", "Lingual", "Mesial", "Distal"],
      4: ["Buccal", "Lingual", "Mesial", "Distal", "Occlusal"],
      5: ["Buccal", "Lingual", "Mesial", "Distal", "Occlusal"],
      6: ["Buccal", "Lingual", "Mesial", "Distal", "Occlusal"],
      7: ["Buccal", "Lingual", "Mesial", "Distal"],
      8: ["Buccal", "Lingual"]
    };
    const toothType = number % 8 || 8;
    return surfaces[toothType] || ["Buccal", "Lingual"];
  }

  // Bemor tanlanganda
  useEffect(() => {
    if (selectedPatient) {
      // Load patient's dental chart
      const patientChart = dentalCharts?.find(chart => chart.patientId === selectedPatient.id);
      if (patientChart && patientChart.teeth) {
        setToothData(patientChart.teeth);
        setPatientNotes(patientChart.notes || "");
      } else {
        setToothData(initialTeeth);
        setPatientNotes("");
      }
      setChartHistory([]);
      addAuditLog({
        userId: currentUser?.id,
        userName: currentUser?.name,
        action: 'view_dental_chart',
        details: `Bemor tish kartasi ko'rilmoqda: ${selectedPatient.name}`
      });
    }
  }, [selectedPatient]);

  // Tish tanlash
  const handleToothClick = (tooth, event) => {
    if (event.ctrlKey || event.metaKey) {
      // Multiple selection with Ctrl/Cmd
      setSelectedTeeth(prev => 
        prev.includes(tooth.id) 
          ? prev.filter(id => id !== tooth.id)
          : [...prev, tooth.id]
      );
    } else {
      // Single selection
      setSelectedTeeth([tooth.id]);
    }
    
    if (event.detail === 2) {
      // Double click for treatment modal
      setCurrentTooth(tooth);
      setShowTreatmentModal(true);
    }
  };

  // Tish holatini o'zgartirish
  const applyConditionToSelectedTeeth = (condition) => {
    const updatedTeeth = toothData.map(tooth => {
      if (selectedTeeth.includes(tooth.id)) {
        return {
          ...tooth,
          condition,
          lastCheck: new Date().toISOString().split('T')[0],
          treatments: [
            ...tooth.treatments,
            {
              type: condition,
              date: new Date().toISOString().split('T')[0],
              doctor: currentUser?.name,
              notes: `Changed to ${toothConditions[condition].name}`
            }
          ]
        };
      }
      return tooth;
    });
    
    setToothData(updatedTeeth);
    
    // Add to history
    if (selectedPatient) {
      const historyEntry = {
        date: new Date().toISOString(),
        action: `Changed condition to ${toothConditions[condition].name}`,
        teeth: selectedTeeth,
        doctor: currentUser?.name
      };
      setChartHistory(prev => [historyEntry, ...prev]);
    }
    
    // Show notification
    addNotification({
      title: 'Tish holati yangilandi',
      message: `${selectedTeeth.length} ta tish holati ${toothConditions[condition].name} deb belgilandi`,
      type: 'info',
      read: false
    });
  };

  // Saqlash
  const saveChart = () => {
    if (!selectedPatient) {
      addNotification({
        title: 'Xatolik',
        message: 'Iltimos, avval bemor tanlang',
        type: 'error',
        read: false
      });
      return;
    }

    const chartData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      teeth: toothData,
      notes: patientNotes,
      lastUpdated: new Date().toISOString().split('T')[0],
      doctorName: currentUser?.name,
      history: chartHistory
    };

    updateDentalChart(selectedPatient.id, chartData);
    
    addNotification({
      title: 'Muvaffaqiyatli saqlandi',
      message: `${selectedPatient.name} bemorning tish kartasi saqlandi`,
      type: 'success',
      read: false
    });
    
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'save_dental_chart',
      details: `Tish kartasi saqlandi: ${selectedPatient.name}`
    });
  };

  // Yangi bemor qo'shish
  const handleAddNewPatient = () => {
    const newPatient = {
      id: Date.now(),
      name: "Yangi Bemor",
      age: 30,
      gender: "male",
      phone: "",
      lastVisit: new Date().toISOString().split('T')[0],
      nextAppointment: "",
      dentist: currentUser?.name
    };
    
    setSelectedPatient(newPatient);
    setToothData(initialTeeth);
    setPatientNotes("");
    
    addNotification({
      title: 'Yangi bemor',
      message: 'Yangi bemor tish kartasi yaratildi',
      type: 'info',
      read: false
    });
  };

  // Filtrlangan bemorlar
  const filteredPatients = (patients.length > 0 ? patients : demoPatients).filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  // Tishlarni render qilish
  const renderTooth3D = (tooth) => {
    const isSelected = selectedTeeth.includes(tooth.id);
    const condition = toothConditions[tooth.condition];
    const toothClass = `tooth-3d ${tooth.condition} ${isSelected ? 'selected' : ''} quadrant-${tooth.quadrant}`;
    
    return (
      <div
        key={tooth.id}
        className={toothClass}
        style={{
          '--tooth-color': condition.color,
          '--rotation': `${rotation}deg`,
          '--zoom': zoom,
          animationDelay: `${tooth.id * 0.05}s`
        }}
        onClick={(e) => handleToothClick(tooth, e)}
        title={`Tish ${tooth.number}: ${condition.name}`}
      >
        <div className="tooth-front">
          <div className="tooth-number">{tooth.number}</div>
          <div className="tooth-icon">{condition.icon}</div>
        </div>
        <div className="tooth-top"></div>
        <div className="tooth-right"></div>
        <div className="tooth-left"></div>
        <div className="tooth-back"></div>
        <div className="tooth-bottom"></div>
        
        {tooth.treatments.length > 0 && (
          <div className="tooth-badge">
            <FaClipboardCheck />
          </div>
        )}
        
        {tooth.sensitivity && (
          <div className="tooth-sensitivity">
            <FaSyringe />
          </div>
        )}
      </div>
    );
  };

  // Tishlarni guruhlash (yuqori/pastki, o'ng/chap)
  const renderTeethGrid = () => {
    const upperRight = toothData.filter(t => t.quadrant === 1);
    const upperLeft = toothData.filter(t => t.quadrant === 2);
    const lowerLeft = toothData.filter(t => t.quadrant === 3);
    const lowerRight = toothData.filter(t => t.quadrant === 4);

    return (
      <div className={`teeth-container ${viewMode} ${show3DView ? 'view-3d' : 'view-2d'}`}>
        {/* Yuqori jag' */}
        <div className="jaw-section upper-jaw">
          <div className="jaw-label">Yuqori Jag'</div>
          <div className="teeth-row">
            {upperRight.map(tooth => renderTooth3D(tooth)).reverse()}
            {upperLeft.map(tooth => renderTooth3D(tooth))}
          </div>
        </div>

        {/* Pastki jag' */}
        <div className="jaw-section lower-jaw">
          <div className="jaw-label">Pastki Jag'</div>
          <div className="teeth-row">
            {lowerRight.map(tooth => renderTooth3D(tooth)).reverse()}
            {lowerLeft.map(tooth => renderTooth3D(tooth))}
          </div>
        </div>

        {/* Markaziy chiziq */}
        <div className="center-line"></div>
      </div>
    );
  };

  // Tish statistikasi
  const getToothStats = () => {
    const stats = {};
    Object.keys(toothConditions).forEach(condition => {
      stats[condition] = toothData.filter(t => t.condition === condition).length;
    });
    return stats;
  };

  // Treatment modal
  const renderTreatmentModal = () => {
    if (!currentTooth || !showTreatmentModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowTreatmentModal(false)}>
        <div className="modal-content dental-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <FaTooth className="mr-2" />
              Tish {currentTooth.number} davolash
            </h3>
            <button onClick={() => setShowTreatmentModal(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="treatment-info">
              <div className="info-row">
                <span className="label">Joriy holat:</span>
                <span className={`status-badge ${currentTooth.condition}`}>
                  {toothConditions[currentTooth.condition].icon}
                  {toothConditions[currentTooth.condition].name}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Pozitsiya:</span>
                <span>{currentTooth.position}</span>
              </div>
              <div className="info-row">
                <span className="label">Oldingi davolashlar:</span>
                <span>{currentTooth.treatments.length} marta</span>
              </div>
            </div>

            <div className="treatment-options">
              <h4>Yangi holatni tanlang:</h4>
              <div className="condition-buttons">
                {Object.entries(toothConditions).map(([key, condition]) => (
                  <button
                    key={key}
                    className={`condition-btn ${currentTooth.condition === key ? 'active' : ''}`}
                    style={{ backgroundColor: condition.color }}
                    onClick={() => {
                      const updatedTeeth = toothData.map(t => 
                        t.id === currentTooth.id 
                          ? { ...t, condition: key }
                          : t
                      );
                      setToothData(updatedTeeth);
                    }}
                  >
                    {condition.icon} {condition.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="treatment-notes">
              <h4>
                <FaNotesMedical className="mr-2" />
                Qo'shimcha izohlar
              </h4>
              <textarea
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                placeholder="Davolash haqida qo'shimcha ma'lumotlar..."
                rows="4"
              />
            </div>

            <div className="treatment-surfaces">
              <h4>
                <FaBrush className="mr-2" /> {/* FaToothbrush o'rniga FaBrush */}
                Sirtlarni belgilang
              </h4>
              <div className="surface-buttons">
                {currentTooth.surface.map(surface => (
                  <button
                    key={surface}
                    className={`surface-btn ${selectedSurface === surface ? 'active' : ''}`}
                    onClick={() => setSelectedSurface(
                      selectedSurface === surface ? null : surface
                    )}
                  >
                    {surface}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn-secondary"
              onClick={() => setShowTreatmentModal(false)}
            >
              Bekor qilish
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                // Add treatment
                const treatment = {
                  type: currentTooth.condition,
                  date: new Date().toISOString().split('T')[0],
                  doctor: currentUser?.name,
                  notes: treatmentNotes,
                  surface: selectedSurface,
                  toothNumber: currentTooth.number
                };
                
                const updatedTeeth = toothData.map(t => 
                  t.id === currentTooth.id 
                    ? { 
                        ...t, 
                        treatments: [...t.treatments, treatment],
                        notes: treatmentNotes 
                      }
                    : t
                );
                
                setToothData(updatedTeeth);
                setShowTreatmentModal(false);
                setTreatmentNotes("");
                setSelectedSurface(null);
                
                addNotification({
                  title: 'Davolash qo\'shildi',
                  message: `Tish ${currentTooth.number} uchun davolash qaydi qo'shildi`,
                  type: 'success',
                  read: false
                });
              }}
            >
              <FaSave className="mr-2" />
              Saqlash
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dental-chart-container">
      <div className="dental-header">
        <div className="header-left">
          <h1>
            <FaTeeth className="header-icon" />
            Interaktiv Tish Kartasi
          </h1>
          <p className="subtitle">Bemorlarning tish holatini boshqarish va monitoring</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <FaUser />
            <span>Jami bemorlar: {filteredPatients.length}</span>
          </div>
          <div className="stat-item">
            <FaClipboardCheck />
            <span>Davolangan tishlar: {toothData.filter(t => t.treatments.length > 0).length}</span>
          </div>
        </div>
      </div>

      <div className="dental-layout">
        {/* Left Sidebar - Patients */}
        <div className="patients-sidebar">
          <div className="sidebar-header">
            <h3>
              <FaUser className="mr-2" />
              Bemorlar
            </h3>
            <button 
              className="btn-icon"
              onClick={handleAddNewPatient}
              title="Yangi bemor"
            >
              <FaPlus />
            </button>
          </div>

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Bemor qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="patients-list">
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                className={`patient-card ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="patient-avatar">
                  {patient.gender === 'male' ? '👨‍⚕️' : '👩‍⚕️'}
                </div>
                <div className="patient-info">
                  <h4>{patient.name}</h4>
                  <div className="patient-details">
                    <span className="detail">
                      <FaUser /> {patient.age} yosh
                    </span>
                    <span className="detail">
                      <FaCalendarAlt /> {patient.lastVisit}
                    </span>
                  </div>
                  {patient.nextAppointment && (
                    <div className="next-appointment">
                      <FaCalendarAlt className="calendar-icon" />
                      Keyingi uchrashuv: {patient.nextAppointment}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Dental Chart */}
        <div className="chart-main">
          {/* Toolbar */}
          <div className="chart-toolbar">
            <div className="toolbar-left">
              <button
                className={`view-toggle ${show3DView ? 'active' : ''}`}
                onClick={() => setShow3DView(!show3DView)}
                title={show3DView ? "2D ko'rinishga o'tish" : "3D ko'rinishga o'tish"}
              >
                {show3DView ? <FaCompress /> : <FaExpand />}
                {show3DView ? "2D Ko'rinish" : "3D Ko'rinish"}
              </button>
              
              <div className="view-controls">
                <button 
                  className={`view-mode ${viewMode === 'full' ? 'active' : ''}`}
                  onClick={() => setViewMode('full')}
                >
                  <FaTeeth /> Hammasi
                </button>
                <button 
                  className={`view-mode ${viewMode === 'upper' ? 'active' : ''}`}
                  onClick={() => setViewMode('upper')}
                >
                  <FaTeethOpen /> Yuqori
                </button>
                <button 
                  className={`view-mode ${viewMode === 'lower' ? 'active' : ''}`}
                  onClick={() => setViewMode('lower')}
                >
                  <FaTeethOpen style={{ transform: 'rotate(180deg)' }} /> Pastki
                </button>
              </div>

              <div className="zoom-controls">
                <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}>
                  <FaMinus />
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}>
                  <FaPlus />
                </button>
              </div>

              <button
                className="rotation-control"
                onClick={() => setRotation(prev => (prev + 45) % 360)}
                title="Aylantirish"
              >
                <FaLayerGroup /> Aylantirish
              </button>
            </div>

            <div className="toolbar-right">
              <button
                className={`btn-guide ${showColorGuide ? 'active' : ''}`}
                onClick={() => setShowColorGuide(!showColorGuide)}
              >
                <FaPalette /> Ranglar ko'rsatkichi
              </button>
              
              <button
                className="btn-history"
                onClick={() => setShowHistory(!showHistory)}
              >
                <FaHistory /> Tarix
              </button>

              <button className="btn-print" title="Chop etish">
                <FaPrint />
              </button>

              <button className="btn-save" onClick={saveChart}>
                <FaSave /> Saqlash
              </button>
            </div>
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="patient-header">
              <div className="patient-header-info">
                <div className="patient-main-info">
                  <h2>
                    {selectedPatient.gender === 'male' ? '👨‍⚕️' : '👩‍⚕️'}
                    {selectedPatient.name}
                  </h2>
                  <div className="patient-tags">
                    <span className="tag">
                      <FaUser /> {selectedPatient.age} yosh
                    </span>
                    <span className="tag">
                      <FaPhone /> {selectedPatient.phone}
                    </span>
                    <span className="tag">
                      <FaCalendarAlt /> Oxirgi tashrif: {selectedPatient.lastVisit}
                    </span>
                    <span className="tag doctor">
                      <FaStethoscope /> {selectedPatient.dentist}
                    </span>
                  </div>
                </div>
                
                <div className="patient-actions">
                  <button className="btn-action">
                    <FaCommentMedical /> Izoh qo'shish
                  </button>
                  <button className="btn-action">
                    <FaProcedures /> Davolash rejasi
                  </button>
                  <button className="btn-action">
                    <FaPrescriptionBottleAlt /> Retsept
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Chart Area */}
          <div className="chart-area">
            {/* Color Guide */}
            {showColorGuide && (
              <div className="color-guide">
                <h4>Tish holatlari:</h4>
                <div className="guide-items">
                  {Object.entries(toothConditions).map(([key, condition]) => (
                    <div key={key} className="guide-item">
                      <span 
                        className="color-box" 
                        style={{ backgroundColor: condition.color }}
                      />
                      <span className="condition-name">{condition.name}</span>
                      <span className="condition-count">
                        {getToothStats()[key]} ta
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dental Chart */}
            <div className="dental-chart-wrapper">
              {renderTeethGrid()}
            </div>

            {/* Condition Controls */}
            <div className="condition-controls">
              <h4>Tish holatini tanlang:</h4>
              <div className="condition-buttons-large">
                {Object.entries(toothConditions).map(([key, condition]) => (
                  <button
                    key={key}
                    className={`condition-btn-large ${activeCondition === key ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: condition.color,
                      borderColor: activeCondition === key ? '#000' : 'transparent'
                    }}
                    onClick={() => {
                      setActiveCondition(key);
                      applyConditionToSelectedTeeth(key);
                    }}
                    title={`Tanlangan tishlarni "${condition.name}" holatiga o'zgartirish`}
                  >
                    <span className="condition-icon">{condition.icon}</span>
                    <span className="condition-text">{condition.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Teeth Info */}
            {selectedTeeth.length > 0 && (
              <div className="selected-teeth-info">
                <h4>
                  <FaClipboardCheck className="mr-2" />
                  Tanlangan tishlar ({selectedTeeth.length} ta):
                </h4>
                <div className="selected-teeth-list">
                  {selectedTeeth.map(toothId => {
                    const tooth = toothData.find(t => t.id === toothId);
                    const condition = toothConditions[tooth.condition];
                    return (
                      <div key={toothId} className="selected-tooth">
                        <span className="tooth-number-badge" style={{ backgroundColor: condition.color }}>
                          {tooth.number}
                        </span>
                        <span className="tooth-info">
                          {tooth.position} • {condition.name}
                        </span>
                        <button
                          className="btn-tooth-details"
                          onClick={() => {
                            setCurrentTooth(tooth);
                            setShowTreatmentModal(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patient Notes */}
            <div className="patient-notes-section">
              <h4>
                <FaNotesMedical className="mr-2" />
                Bemor haqida qo'shimcha izohlar
              </h4>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Bemorning umumiy holati, allergiyalari, e'tibor qaratish kerak bo'lgan masalalar..."
                rows="3"
                className="notes-textarea"
              />
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon healthy">
                  <FaCheck />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{getToothStats().healthy}</div>
                  <div className="stat-label">Sog'lom tishlar</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon cavity">
                  <FaTooth />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{getToothStats().cavity}</div>
                  <div className="stat-label">Karies</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon filled">
                  <FaCrown />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{getToothStats().filled}</div>
                  <div className="stat-label">Plomba</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon missing">
                  <FaTimes />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{getToothStats().missing}</div>
                  <div className="stat-label">Yo'q tishlar</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - History & Details */}
        <div className={`history-sidebar ${showHistory ? 'visible' : ''}`}>
          <div className="history-header">
            <h3>
              <FaHistory className="mr-2" />
              Tish kartasi tarixi
            </h3>
            <button 
              className="btn-icon"
              onClick={() => setShowHistory(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          {selectedPatient ? (
            <div className="history-content">
              <div className="history-list">
                {chartHistory.length > 0 ? (
                  chartHistory.map((entry, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div className="history-action">
                        {entry.action}
                      </div>
                      <div className="history-teeth">
                        Tishlar: {entry.teeth.join(', ')}
                      </div>
                      <div className="history-doctor">
                        <FaUser className="mr-1" /> {entry.doctor}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-history">
                    <FaHistory className="empty-icon" />
                    <p>Hozircha tarix mavjud emas</p>
                  </div>
                )}
              </div>
              
              <div className="treatment-history">
                <h4>Davolash tarixi:</h4>
                {toothData
                  .filter(t => t.treatments.length > 0)
                  .map(tooth => (
                    <div key={tooth.id} className="tooth-treatment">
                      <strong>Tish {tooth.number}:</strong>
                      <ul>
                        {tooth.treatments.map((treatment, idx) => (
                          <li key={idx}>
                            {treatment.date} - {toothConditions[treatment.type]?.name}
                            {treatment.notes && `: ${treatment.notes}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="no-patient-selected">
              <FaUser className="empty-icon" />
              <p>Bemor tanlang</p>
              <p className="sub-text">Tish kartasi tarixini ko'rish uchun</p>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Modal */}
      {renderTreatmentModal()}

      {/* Footer */}
      <div className="dental-footer">
        <div className="footer-info">
          <p>
            <strong>Tish kartasi ID:</strong> {selectedPatient ? `DC-${selectedPatient.id}` : 'DC-0000'}
          </p>
          <p>
            <strong>Oxirgi yangilangan:</strong> {new Date().toLocaleDateString()}
          </p>
          <p>
            <strong>Doktor:</strong> {currentUser?.name || 'Dr. Ali Valiyev'}
          </p>
        </div>
        
        <div className="footer-actions">
          <button className="btn-footer">
            <FaDownload /> Eksport
          </button>
          <button className="btn-footer">
            <FaShare /> Ulashish
          </button>
          <button className="btn-footer">
            <FaChartBar /> Hisobot
          </button>
        </div>
      </div>
    </div>
  );
};

export default DentalChart;