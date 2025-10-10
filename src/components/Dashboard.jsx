import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiPackage, FiDownload, FiPlusCircle, FiUser } from 'react-icons/fi';
import { AppContext } from '../App';
import './Dashboard.css';

// Number Counter Component for Animation
const NumberCounter = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 60); // 60 FPS
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span className="number-counter">{count}</span>;
};

const Dashboard = () => {
  const { patients, appointments, medications, currentUser } = useContext(AppContext);

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);

  // Recent appointments (latest 5)
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Low stock medications (quantity < 20)
  const lowStockMedications = medications.filter(m => m.quantity < 20);

  // Get patient name
  const getPatientName = (id) => {
    const p = patients.find(p => p.id === id);
    return p ? p.name : 'Nomaʼlum';
  };

  // Export quick report
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
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bosh Sahifa</h1>
        <div className="header-right">
          <Link to="/foydalanuvchi" className="user-profile">
            <FiUser className="user-icon" />
            <span className="user-name">{currentUser?.name || 'Foydalanuvchi'}</span>
          </Link>
          <button onClick={exportQuickReport} className="export-btn">
            <FiDownload /> Hisobotni Yuklab Olish
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-stats">
        <div className="dashboard-card">
          <div className="dashboard-icon-box">
            <FiUsers className="dashboard-icon" />
          </div>
          <div className="dashboard-info">
            <h3>Bemorlar</h3>
            <p>
              <NumberCounter end={patients.length} /> ta
            </p>
          </div>
          <Link to="/bemorlar" className="dashboard-link">
            <FiPlusCircle />
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon-box">
            <FiCalendar className="dashboard-icon" />
          </div>
          <div className="dashboard-info">
            <h3>Uchrashuvlar</h3>
            <p>
              <NumberCounter end={appointments.length} /> ta
            </p>
          </div>
          <Link to="/uchrashuvlar" className="dashboard-link">
            <FiPlusCircle />
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon-box">
            <FiPackage className="dashboard-icon" />
          </div>
          <div className="dashboard-info">
            <h3>Dorilar</h3>
            <p>
              <NumberCounter end={medications.length} /> ta
            </p>
          </div>
          <Link to="/dorilar" className="dashboard-link">
            <FiPlusCircle />
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon-box">
            <FiCalendar className="dashboard-icon" />
          </div>
          <div className="dashboard-info">
            <h3>Bugungi Uchrashuvlar</h3>
            <p>
              <NumberCounter end={todayAppointments.length} /> ta
            </p>
          </div>
        </div>
      </div>

      {/* Two-column content */}
      <div className="dashboard-content">
        {/* Left column */}
        <div className="content-column">
          {/* Today's Appointments */}
          <div className="content-card">
            <div className="card-header">
              <h2>Bugungi Uchrashuvlar</h2>
              <span className="badge">
                <NumberCounter end={todayAppointments.length} />
              </span>
            </div>
            {todayAppointments.length === 0 ? (
              <p className="empty-state">Bugun uchun uchrashuvlar yoq</p>
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

          {/* Low Stock Medications */}
          <div className="content-card">
            <div className="card-header">
              <h2>Kam Qoldiq Dorilar</h2>
              <span className="badge">
                <NumberCounter end={lowStockMedications.length} />
              </span>
            </div>
            {lowStockMedications.length === 0 ? (
              <p className="empty-state">Kam qoldiq dorilar yoq</p>
            ) : (
              <div className="medications-list">
                {lowStockMedications.map(m => (
                  <div key={m.id} className="medication-item">
                    <span className="med-name">{m.name}</span>
                    <span className="med-quantity low">
                      <NumberCounter end={m.quantity} /> qoldi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="content-column">
          {/* Recent Appointments */}
          <div className="content-card">
            <div className="card-header">
              <h2>Songgi Uchrashuvlar</h2>
            </div>
            {recentAppointments.length === 0 ? (
              <p className="empty-state">Hali uchrashuvlar yoq</p>
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

          {/* Quick Actions */}
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