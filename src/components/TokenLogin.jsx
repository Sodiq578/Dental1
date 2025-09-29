import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { FiKey, FiX, FiUser, FiClock } from 'react-icons/fi';
import './TokenLogin.css';

const TokenLogin = ({ isOpen, onClose, onLogin }) => {
  const { staff } = useContext(AppContext);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  // Modal ochilganda body ga overflow: hidden qo'shish
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Token kiritilishi shart');
      return;
    }

    // Find staff member with matching active token
    const staffMember = staff.find(s => 
      s.token === token && 
      s.tokenExpiry && 
      new Date() < new Date(s.tokenExpiry)
    );

    if (staffMember) {
      // Create temporary user object for staff login
      const tempUser = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: 'staff',
        staffData: staffMember,
        loginMethod: 'token'
      };
      
      onLogin(tempUser);
      setToken('');
      onClose();
    } else {
      setError('Noto‘g‘ri yoki muddati o‘tgan token');
    }
  };

  // Escape tugmasi bilan yopish
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="token-login-overlay" onClick={onClose}>
      <div className="token-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="token-login-header">
          <h2>
            <FiKey /> Token orqali kirish
          </h2>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="token-login-content">
          <div className="token-info">
            <FiUser className="token-user-icon" />
            <p>Xodim sifatida tizimga kirish uchun token kiriting</p>
            <div className="token-note">
              <FiClock className="note-icon" />
              <p><strong>Eslatma:</strong> Token faqat 10 daqiqa davomida amal qiladi</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="token-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>Token kodi</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token kodini kiriting"
                className="token-input"
                maxLength="10"
                autoFocus
              />
            </div>

            <div className="token-actions">
              <button type="submit" className="btn-primary">
                <FiKey /> Kirish
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Bekor qilish
              </button>
            </div>
          </form>

          <div className="token-help">
            <h4>Token olish uchun:</h4>
            <ol>
              <li>Administrator bilan bog'laning</li>
              <li>Sizning hisobingiz uchun token yaratilsin</li>
              <li>Token sizga 10 daqiqa muddatga beriladi</li>
              <li>Tokendan faqat siz foydalaning</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLogin;