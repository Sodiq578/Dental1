import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiPackage, FiDownload, FiPlusCircle } from 'react-icons/fi';
import { AppContext } from '../App';
import './Dashboard.css';

const Dashboard = () => {
  const { patients, appointments, medications, darkMode } = useContext(AppContext);

  // Bugungi uchrashuvlar
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);

  // So'nggi uchrashuvlar (eng yangi 5 ta)
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Kam qoldiq dorilar (miqdori 20 dan kam)
  const lowStockMedications = medications.filter(m => m.quantity < 20);

  // Bemor nomini olish
  const getPatientName = (id) => {
    const p = patients.find(p => p.id === id);
    return p ? p.name : 'Nomaʼlum';
  };

  // Tezkor hisobot eksporti
  const exportQuickReport = () => {
    const report = {
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      totalMedications: medications.length,
      todayAppointments: todayAppointments.length,
      lowStockMedications: lowStockMedications.length,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_report_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
      <div className="dashboard-header">
        <h1>Bosh Sahifa</h1>
        <button onClick={exportQuickReport} className="export-btn">
          <FiDownload /> Hisobotni Yuklab Olish
        </button>
      </div>

      {/* Statistikalar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-container">
            <FiUsers className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Bemorlar</h3>
            <p>{patients.length} ta</p>
          </div>
          <Link to="/bemorlar" className="stat-link">
            <FiPlusCircle />
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container">
            <FiCalendar className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Uchrashuvlar</h3>
            <p>{appointments.length} ta</p>
          </div>
          <Link to="/uchrashuvlar" className="stat-link">
            <FiPlusCircle />
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container">
            <FiPackage className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Dorilar</h3>
            <p>{medications.length} ta</p>
          </div>
          <Link to="/dorilar" className="stat-link">
            <FiPlusCircle />
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container">
            <FiCalendar className="stat-icon" />
          </div>
          <div className="stat-content">
            <h3>Bugungi Uchrashuvlar</h3>
            <p>{todayAppointments.length} ta</p>
          </div>
        </div>
      </div>

      {/* Ikki ustunli tarkib */}
      <div className="dashboard-content">
        {/* Chap ustun */}
        <div className="content-column">
          {/* Bugungi Uchrashuvlar */}
          <div className="content-card">
            <div className="card-header">
              <h2>Bugungi Uchrashuvlar</h2>
              <span className="badge">{todayAppointments.length}</span>
            </div>
            {todayAppointments.length === 0 ? (
              <p className="empty-state">Bugun uchun uchrashuvlar yo'q</p>
            ) : (
              <div className="appointments-list">
                {todayAppointments.map(a => (
                  <div key={a.id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{getPatientName(a.patientId)}</h4>
                      <p>{a.time} - {a.procedure}</p>
                    </div>
                    <span className={`status ${a.status === 'Bajarildi' ? 'completed' : 'pending'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kam Qoldiq Dorilar */}
          <div className="content-card">
            <div className="card-header">
              <h2>Kam Qoldiq Dorilar</h2>
              <span className="badge">{lowStockMedications.length}</span>
            </div>
            {lowStockMedications.length === 0 ? (
              <p className="empty-state">Kam qoldiq dorilar yo'q</p>
            ) : (
              <div className="medications-list">
                {lowStockMedications.map(m => (
                  <div key={m.id} className="medication-item">
                    <span className="med-name">{m.name}</span>
                    <span className="med-quantity low">{m.quantity} qoldi</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* O'ng ustun */}
        <div className="content-column">
          {/* So'nggi Uchrashuvlar */}
          <div className="content-card">
            <div className="card-header">
              <h2>So'nggi Uchrashuvlar</h2>
            </div>
            {recentAppointments.length === 0 ? (
              <p className="empty-state">Hali uchrashuvlar yo'q</p>
            ) : (
              <div className="recent-appointments-list">
                {recentAppointments.map(a => (
                  <div key={a.id} className="recent-appointment-item">
                    <div className="date-badge">
                      <span className="day">{new Date(a.date).getDate()}</span>
                      <span className="month">
                        {new Date(a.date).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <h4>{getPatientName(a.patientId)}</h4>
                      <p>{a.time} - {a.procedure}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tezkor Amallar */}
          <div className="content-card">
            <div className="card-header">
              <h2>Tezkor Amallar</h2>
            </div>
            <div className="quick-actions">
              <Link to="/bemorlar" className="action-btn">
                <FiUsers />
                <span>Yangi Bemor</span>
              </Link>
              <Link to="/uchrashuvlar" className="action-btn">
                <FiCalendar />
                <span>Yangi Uchrashuv</span>
              </Link>
              <Link to="/dorilar" className="action-btn">
                <FiPackage />
                <span>Yangi Dori</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;