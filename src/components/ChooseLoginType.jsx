import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiShield, FiPhone, FiArrowRight } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import './ChooseLoginType.css'; // Login.css dan foydalanamiz

const ChooseLoginType = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="choose-login-page">
      <div className="dental-bg-pattern"></div>
      <div className="choose-login-container">
        <div className="choose-login-header">
          <div className="logo">
            <FaCrown className="logo-icon" />
            <span>DentCare Tizimi</span>
          </div>
          <h1 >Tizimga kirish</h1>
          <p>Qaysi rol bilan kirmoqchisiz?</p>
        </div>

        <div className="login-cards-grid">
          {/* 1. Foydalanuvchi (Bemor) Kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/user-login')}>
            <div className="card-icon">
              <FiUser size={48} />
            </div>
            <h3>Bemor / Foydalanuvchi</h3>
            <p>Shaxsiy kabinet, uchrashuvlar va tarixingizni boshqaring</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>

          {/* 2. Xodim Kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/staff-login')}>
            <div className="card-icon">
              <FiPhone size={48} />
            </div>
            <h3>Xodim</h3>
            <p>Bemorlarni ro'yxatga olish, uchrashuvlar va hisobotlar</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>

          {/* 3. Admin Kartasi */}
          <div className="login-card" onClick={() => handleNavigate('/admin-login')}>
            <div className="card-icon">
              <FiShield size={48} />
            </div>
            <h3>Administrator</h3>
            <p>Tizimni boshqarish, xodimlar va filiallar</p>
            <button className="card-btn">
              Kirish <FiArrowRight />
            </button>
          </div>
        </div>

        <div className="choose-login-footer">
          <p>DentCare Dental Klinika Tizimi © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default ChooseLoginType;