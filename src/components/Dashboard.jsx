import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiPackage, FiDownload } from 'react-icons/fi';
import { AppContext } from '../App';
import CountUp from 'react-countup'; // Hisoblagich animatsiyasi uchun
import './Dashboard.css';

const Dashboard = () => {
  const { patients, appointments, medications, darkMode } = useContext(AppContext);

  // Bugungi uchrashuvlar
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);

  // So‘nggi uchrashuvlar (eng yangi 5 ta)
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Kam qoldiq dorilar (miqdori 20 dan kam)
  const lowStockMedications = medications.filter(m => m.quantity < 20);

  // Bemor nomini olish
  const getPatientName = (id) => {
    const p = patients.find(p => p.id === id);
    return p ? p.name : 'Noma’lum';
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
      <div className="page-header">
        <h1>Bosh Sahifa (Admin)</h1>
      </div>

      {/* Statistikalar */}
      <div className="stats-grid">
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <h3>Bemorlar</h3>
          <p>
            <CountUp
              end={patients.length}
              duration={2.5} // Animatsiya davomiyligi (sekundlarda)
              separator=" " // Raqamlarni formatlash (masalan, 1000 -> 1 000)
              suffix=" ta" // Oxiriga "ta" so‘zini qo‘shish
            />
          </p>
        </div>
        <div className="stat-card">
          <FiCalendar className="stat-icon" />
          <h3>Uchrashuvlar</h3>
          <p>
            <CountUp
              end={appointments.length}
              duration={2.5}
              separator=" "
              suffix=" ta"
            />
          </p>
        </div>
        <div className="stat-card">
          <FiPackage className="stat-icon" />
          <h3>Dorilar</h3>
          <p>
            <CountUp
              end={medications.length}
              duration={2.5}
              separator=" "
              suffix=" ta"
            />
          </p>
        </div>
      </div>

      {/* Tezkor Kirishlar */}
      <div className="quick-links">
        <h2>Tezkor Kirish</h2>
        <div className="links-grid">
          <Link to="/bemorlar" className="link-card">
            <FiUsers />
            <span>Yangi Bemor Qo‘shish</span>
          </Link>
          <Link to="/uchrashuvlar" className="link-card">
            <FiCalendar />
            <span>Yangi Uchrashuv</span>
          </Link>
          <Link to="/dorilar" className="link-card">
            <FiPackage />
            <span>Yangi Dori Qo‘shish</span>
          </Link>
        </div>
      </div>

      {/* Bugungi Uchrashuvlar */}
      <div className="today-appointments">
        <h2>Bugungi Uchrashuvlar</h2>
        {todayAppointments.length === 0 ? (
          <p>Bugun uchun uchrashuvlar yo‘q</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Vaqt</th>
                <th>Jarayon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{getPatientName(a.patientId)}</td>
                  <td>{a.time || '-'}</td>
                  <td>{a.procedure || '-'}</td>
                  <td>{a.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* So‘nggi Uchrashuvlar */}
      <div className="recent-appointments">
        <h2>So‘nggi Uchrashuvlar</h2>
        {recentAppointments.length === 0 ? (
          <p>Hali uchrashuvlar yo‘q</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana</th>
                <th>Vaqt</th>
                <th>Jarayon</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{getPatientName(a.patientId)}</td>
                  <td>{a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-'}</td>
                  <td>{a.time || '-'}</td>
                  <td>{a.procedure || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Kam Qoldiq Dorilar */}
      <div className="low-stock-medications">
        <h2>Kam Qoldiq Dorilar</h2>
        {lowStockMedications.length === 0 ? (
          <p>Kam qoldiq dorilar yo‘q</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Miqdori</th>
              </tr>
            </thead>
            <tbody>
              {lowStockMedications.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="low-stock">
                    <CountUp
                      end={m.quantity}
                      duration={2}
                      separator=" "
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tezkor Hisobot */}
      <div className="quick-report">
        <button onClick={exportQuickReport} className="btn-primary">
          <FiDownload /> Tezkor Hisobotni Yuklab Olish
        </button>
      </div>
    </div>
  );
};

export default Dashboard;