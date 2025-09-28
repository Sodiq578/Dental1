import React, { useContext, useState } from "react";
import { AppContext } from "../App";
import "./LoggedInUsers.css";

const LoggedInUsers = () => {
  const { logins } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  // Statistik ma'lumotlarni hisoblash
  const totalLogins = logins.length;
  const todayLogins = logins.filter(login => {
    const loginDate = new Date(login.timestamp);
    const today = new Date();
    return loginDate.toDateString() === today.toDateString();
  }).length;

  const uniqueUsers = new Set(logins.map(login => login.email)).size;

  // Yangilash funksiyasi
  const handleRefresh = () => {
    setLoading(true);
    // Bu yerda yangilash logikasi bo'ladi
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Role'ga qarab badge stilini olish
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'role-badge role-admin';
      case 'staff': return 'role-badge role-staff';
      case 'patient': return 'role-badge role-patient';
      default: return 'role-badge';
    }
  };

  // Role'ni o'zbek tilida ko'rsatish
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'staff': return 'Xodim';
      case 'patient': return 'Bemor';
      default: return role;
    }
  };

  return (
    <div className={`kirgan-foydalanuvchilar ${loading ? 'yuklanmoqda' : ''}`}>
      <h2>Tizimga Kirgan Foydalanuvchilar</h2>
      
      <button className="yangilash-tugmasi" onClick={handleRefresh} disabled={loading}>
        ↻ Yangilash
      </button>

      {/* Statistik ma'lumotlar */}
      <div className="statistik-malumot">
        <div className="statistik-element">
          <span className="statistik-raqam">{totalLogins}</span>
          <span className="statistik-label">Jami Kirishlar</span>
        </div>
        <div className="statistik-element">
          <span className="statistik-raqam">{todayLogins}</span>
          <span className="statistik-label">Bugungi Kirishlar</span>
        </div>
        <div className="statistik-element">
          <span className="statistik-raqam">{uniqueUsers}</span>
          <span className="statistik-label">Noyob Foydalanuvchilar</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ism</th>
            <th>Elektron Pochta</th>
            <th>Rol</th>
            <th>Kirish Vaqti</th>
          </tr>
        </thead>
        <tbody>
          {logins.length > 0 ? (
            logins.map((login, index) => (
              <tr key={index}>
                <td data-label="Ism">{login.name}</td>
                <td data-label="Elektron Pochta">{login.email}</td>
                <td data-label="Rol">
                  <span className={getRoleBadgeClass(login.role)}>
                    {getRoleDisplayName(login.role)}
                  </span>
                </td>
                <td data-label="Kirish Vaqti" className="vaqt-korsatgich">
                  {new Date(login.timestamp).toLocaleString("uz-UZ", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Hech qanday kirish qayd etilmagan</td>
            </tr>
          )}
        </tbody>
      </table>

      {loading && <div className="yuklanmoqda"></div>}
    </div>
  );
};

export default LoggedInUsers;