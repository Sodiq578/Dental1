import React, { useState, useEffect } from 'react';
import { FiShield, FiKey, FiUserCheck, FiClock, FiRefreshCw, FiCheck, FiX, FiAlertTriangle, FiCopy } from 'react-icons/fi';
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import './Security.css';

const Security = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(5);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(90);
  const [currentUser, setCurrentUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedSecurity = getFromLocalStorage('securitySettings', {});
    setTwoFAEnabled(savedSecurity.twoFAEnabled || false);
    setBackupCodes(savedSecurity.backupCodes || []);
    setSessionTimeout(savedSecurity.sessionTimeout || 30);
    setFailedLoginAttempts(savedSecurity.failedLoginAttempts || 5);
    setPasswordExpiryDays(savedSecurity.passwordExpiryDays || 90);
    
    const user = getFromLocalStorage('currentUser', null);
    setCurrentUser(user);
    
    const logs = getFromLocalStorage('auditLogs', []);
    setAuditLogs(logs.slice(0, 20));
  }, []);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    setBackupCodes(codes);
    return codes;
  };

  const handleToggle2FA = () => {
    const newState = !twoFAEnabled;
    
    if (newState && backupCodes.length === 0) {
      const newCodes = generateBackupCodes();
      setBackupCodes(newCodes);
      setShowBackupCodes(true);
    }
    
    setTwoFAEnabled(newState);
    saveToLocalStorage('securitySettings', {
      twoFAEnabled: newState,
      backupCodes: backupCodes,
      sessionTimeout,
      failedLoginAttempts,
      passwordExpiryDays
    });
    
    setSuccessMessage(`2FA ${newState ? 'yoqildi' : "o'chirildi"}`);
    
    // Audit log
    const auditLog = {
      id: Date.now(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'toggle_2fa',
      details: `2FA ${newState ? 'yoqildi' : "o'chirildi"}`,
      timestamp: new Date().toISOString()
    };
    const logs = getFromLocalStorage('auditLogs', []);
    saveToLocalStorage('auditLogs', [auditLog, ...logs]);
  };

  const handleSaveSettings = () => {
    saveToLocalStorage('securitySettings', {
      twoFAEnabled,
      backupCodes,
      sessionTimeout,
      failedLoginAttempts,
      passwordExpiryDays
    });
    
    setSuccessMessage('Xavfsizlik sozlamalari saqlandi');
    
    // Audit log
    const auditLog = {
      id: Date.now(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'update_security_settings',
      details: 'Xavfsizlik sozlamalari yangilandi',
      timestamp: new Date().toISOString()
    };
    const logs = getFromLocalStorage('auditLogs', []);
    saveToLocalStorage('auditLogs', [auditLog, ...logs]);
  };

  const generateNewBackupCodes = () => {
    const newCodes = generateBackupCodes();
    setBackupCodes(newCodes);
    setShowBackupCodes(true);
    setSuccessMessage('Yangi zaxira kodlari yaratildi');
  };

  const handleCopyCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccessMessage('Kodlar nusxalandi');
  };

  const clearAuditLogs = () => {
    if (window.confirm('Audit jurnali tozalanadi. Bu amalni bekor qilib bo\'lmaydi. Davom etilsinmi?')) {
      saveToLocalStorage('auditLogs', []);
      setAuditLogs([]);
      setSuccessMessage('Audit jurnali tozalandi');
    }
  };

  return (
    <div className="security-container">
      <div className="security-header">
        <div className="header-content">
          <div className="header-icon"><FiShield /></div>
          <div><h1>Xavfsizlik Sozlamalari</h1><p>Akkauntingiz xavfsizligini kuchaytiring</p></div>
        </div>
      </div>

      {successMessage && <div className="alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert-error">{errorMessage}</div>}

      <div className="security-grid">
        <div className="security-card">
          <div className="card-header"><div className="card-icon"><FiKey /></div><h3>Ikki Faktorli Autentifikatsiya (2FA)</h3></div>
          <div className="card-content"><p>Hisobingizni qo'shimcha himoya qatlami bilan mustahkamlang. 2FA yoqilganda, har bir kirishda maxsus kod talab qilinadi.</p>
          <div className="toggle-wrapper"><label className="toggle-switch"><input type="checkbox" checked={twoFAEnabled} onChange={handleToggle2FA} /><span className="toggle-slider"></span></label><span className="toggle-label">{twoFAEnabled ? 'Yoqilgan' : 'O\'chirilgan'}</span></div></div>
          {showBackupCodes && backupCodes.length > 0 && (<div className="backup-codes"><div className="backup-header"><h4>Zaxira kodlari</h4><button onClick={generateNewBackupCodes} className="btn-icon"><FiRefreshCw /> Yangilash</button><button onClick={handleCopyCodes} className="btn-icon"><FiCopy /> Nusxalash</button></div><div className="codes-grid">{backupCodes.map((code, i) => (<div key={i} className="code-item">{code}</div>))}</div><p className="backup-warning"><FiAlertTriangle /> Bu kodlarni xavfsiz joyda saqlang. Har bir kod faqat bir marta ishlatilishi mumkin.</p></div>)}
        </div>

        <div className="security-card">
          <div className="card-header"><div className="card-icon"><FiClock /></div><h3>Seans Sozlamalari</h3></div>
          <div className="card-content"><div className="setting-group"><label>Seans muddati (daqiqa)</label><input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(parseInt(e.target.value))} min="5" max="120" className="setting-input" /><p className="setting-hint">Harakatsizlikdan keyin avtomatik chiqish</p></div>
          <div className="setting-group"><label>Parol muddati (kun)</label><input type="number" value={passwordExpiryDays} onChange={(e) => setPasswordExpiryDays(parseInt(e.target.value))} min="30" max="365" className="setting-input" /><p className="setting-hint">Parolni necha kunda bir marta yangilash kerak</p></div></div>
        </div>

        <div className="security-card">
          <div className="card-header"><div className="card-icon"><FiUserCheck /></div><h3>Kirish Xavfsizligi</h3></div>
          <div className="card-content"><div className="setting-group"><label>Muvaffaqiyatsiz urinishlar chegarasi</label><input type="number" value={failedLoginAttempts} onChange={(e) => setFailedLoginAttempts(parseInt(e.target.value))} min="3" max="10" className="setting-input" /><p className="setting-hint">Nechta muvaffaqiyatsiz urinishdan keyin hisob bloklanadi</p></div>
          <button onClick={handleSaveSettings} className="btn-primary">Sozlamalarni saqlash</button></div>
        </div>

        <div className="security-card full-width">
          <div className="card-header"><div className="card-icon"><FiShield /></div><h3>Audit Jurnali</h3><button onClick={clearAuditLogs} className="btn-icon btn-danger"><FiX /> Tozalash</button></div>
          <div className="card-content"><div className="audit-table"><table className="security-table"><thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Harakat</th><th>Tafsilotlar</th></tr></thead><tbody>{auditLogs.length > 0 ? (auditLogs.map((log, index) => (<tr key={log.id || index}><td>{new Date(log.timestamp).toLocaleString()}</td><td>{log.userName || 'Noma\'lum'}</td><td>{log.action}</td><td>{log.details}</td></tr>))) : (<tr><td colSpan="4" className="empty-row">Hech qanday audit yozuvi topilmadi</td></tr>)}</tbody></table></div></div>
        </div>
      </div>
    </div>
  );
};

export default Security;