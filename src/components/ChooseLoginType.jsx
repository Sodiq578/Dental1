import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiShield, FiPhone, FiArrowRight } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import './ChooseLoginType.css'; // Yangi to'liq CSS fayl

const ChooseLoginType = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="choose-login-page">
      {/* Fon pattern - dental tema uchun nozik to'lqinli effekt */}
      <div className="dental-bg-pattern"></div>

      <div className="choose-login-container">
        {/* Header qismi */}
        <div className="choose-login-header">
          <div className="logo">
            <FaCrown className="logo-icon" />
            <span>DentCare Tizimi</span>
          </div>
          <h1>Tizimga kirish</h1>
          <p>Qaysi rol bilan kirmoqchisiz?</p>
        </div>

        {/* Kartalar grid */}
        <div className="login-cards-grid">
          {/* Bemor kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/user-login')}>
            <div className="card-icon patient">
              <FiUser size={48} />
            </div>
            <h3>Bemor / Foydalanuvchi</h3>
            <p>Shaxsiy kabinet, uchrashuvlar va tarixingizni boshqaring</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>

          {/* Xodim kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/staff-login')}>
            <div className="card-icon staff">
              <FiPhone size={48} />
            </div>
            <h3>Xodim</h3>
            <p>Bemorlarni ro'yxatga olish, uchrashuvlar va hisobotlar</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>

          {/* Admin kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/admin-login')}>
            <div className="card-icon admin">
              <FiShield size={48} />
            </div>
            <h3>Administrator</h3>
            <p>Tizimni boshqarish, xodimlar va filiallar</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="choose-login-footer">
          <p>DentCare Dental Klinika Tizimi © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default ChooseLoginType;