import React, { useContext, useMemo } from "react";
import { FiUser, FiCalendar, FiActivity } from "react-icons/fi";
import { AppContext } from "../App";
// Charting uchun Recharts kutubxonasini o'rnating: npm install recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const UserDashboard = () => {
  const { currentUser, appointments, patients, billings } = useContext(AppContext);

  // Joriy foydalanuvchiga tegishli ma'lumotlarni filtrlash
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

  if (!currentUser) return <div>Foydalanuvchi topilmadi</div>;

  return (
    <div className="user-dashboard">
      <div className="user-header">
        <FiUser size={32} />
        <h2>{currentUser.name} - Shaxsiy Kabinet</h2>
        <p>Email: {currentUser.email}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiCalendar />
          <h3>Jami Uchrashuvlar</h3>
          <p>{totalAppointments}</p>
        </div>
        <div className="stat-card">
          <FiActivity />
          <h3>Jami Xarajatlar</h3>
          <p>{totalCost} so'm</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Uchrashuvlar bo'yicha statistika (oylar bo'yicha)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={treatmentsByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Qo'shimcha chartlar: masalan, davolash turlari bo'yicha pie chart yoki boshqa */}
      <div className="more-stats">
        <h4>Davolash tarixi va batafsil ma'lumotlar</h4>
        <ul>
          {userAppointments.slice(-5).map(apt => (
            <li key={apt.id}>{apt.date}: {apt.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;