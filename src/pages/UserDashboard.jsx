import React, { useContext, useMemo, useState } from "react";
import { FiUser, FiCalendar, FiActivity, FiHeart, FiFilter } from "react-icons/fi";
import { AppContext } from "../App";
import "./UserDashboard.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const UserDashboard = () => {
  const { currentUser, appointments, billings } = useContext(AppContext);
  const [sortOrder, setSortOrder] = useState("desc"); // Uchrashuvlarni saralash uchun holat
  const [selectedAppointment, setSelectedAppointment] = useState(null); // Modal uchun tanlangan uchrashuv

  // Ma'lumotlarni filtrlash
  const userAppointments = useMemo(() => 
    appointments.filter(apt => apt.patientId === currentUser.id), [appointments, currentUser]
  );
  const userBillings = useMemo(() => 
    billings.filter(bill => bill.patientId === currentUser.id), [billings, currentUser]
  );

  // Statistikalar
  const totalAppointments = userAppointments.length;
  const totalCost = userBillings.reduce((sum, bill) => sum + bill.amount, 0);
  const treatmentsByMonth = useMemo(() => {
    const monthly = {};
    userAppointments.forEach(apt => {
      const month = new Date(apt.date).getMonth() + 1;
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly).map(([month, count]) => ({ month: `Oy ${month}`, count }));
  }, [userAppointments]);

  // Uchrashuvlarni saralash
  const sortedAppointments = useMemo(() => {
    return [...userAppointments].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [userAppointments, sortOrder]);

  // Modalni ochish/yopish
  const openModal = (appointment) => setSelectedAppointment(appointment);
  const closeModal = () => setSelectedAppointment(null);

  // Loading holati
  if (!currentUser) return <div className="loading">Ma'lumotlar yuklanmoqda...</div>;

  return (
    <div className="dashboard-container">
      {/* Sarlavha */}
      <div className="dashboard-header">
        <FiUser size={40} className="header-icon" />
        <div>
          <h2>{currentUser.name} - Shaxsiy Kabinet</h2>
          <p className="user-email">Email: {currentUser.email}</p>
        </div>
      </div>

      {/* Statistikalar */}
      <div className="stats-grid">
        <div className="stat-card">
          <FiCalendar size={32} />
          <h3>Jami Uchrashuvlar</h3>
          <p className="stat-value">{totalAppointments}</p>
        </div>
        <div className="stat-card">
          <FiActivity size={32} />
          <h3>Jami Xarajatlar</h3>
          <p className="stat-value">{totalCost.toLocaleString()} so'm</p>
        </div>
        <div className="stat-card">
          <FiHeart size={32} />
          <h3>Sog'lik Holati</h3>
          <p className="stat-value">Yaxshi</p>
        </div>
      </div>

      {/* Diagramma */}
      <div className="chart-section">
        <h3 className="section-title">Uchrashuvlar bo'yicha statistika (oylar bo'yicha)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={treatmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
              <XAxis dataKey="month" stroke="#2c3e50" fontSize={12} />
              <YAxis stroke="#2c3e50" fontSize={12} />
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #3498db' }} />
              <Legend />
              <Bar dataKey="count" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uchrashuvlar tarixi */}
      <div className="more-stats">
        <div className="history-header">
          <h4 className="section-title">Dental Tarix va Batafsil Ma'lumotlar</h4>
          <div className="sort-controls">
            <FiFilter size={20} />
            <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
              <option value="desc">Eng yangi</option>
              <option value="asc">Eng eski</option>
            </select>
          </div>
        </div>
        <ul className="history-list">
          {sortedAppointments.slice(-5).map(apt => (
            <li key={apt.id} className="history-item" onClick={() => openModal(apt)}>
              {new Date(apt.date).toLocaleDateString()}: {apt.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal oynasi */}
      {selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Uchrashuv tafsilotlari</h3>
            <p><strong>Sana:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            <p><strong>Tavsif:</strong> {selectedAppointment.description}</p>
            <button className="modal-close" onClick={closeModal}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;