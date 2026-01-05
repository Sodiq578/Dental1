import React, { useState, useEffect, useContext } from "react";
import { FiShield, FiLock, FiUser, FiKey, FiRefreshCw, FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiCopy, FiDownload, FiLogOut } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Security = () => {
  const [twoFA, setTwoFA] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [sessionSettings, setSessionSettings] = useState({
    autoLogout: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });
  
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Demo QR kod
    setQrCode(`data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZmZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiMwMDAwMDAiPlRJU0gtQ0xJTklDLTJGQS0xMjM0PC90ZXh0Pjwvc3ZnPg==`);
    
    // Demo backup kodlar
    setBackupCodes([
      "X7Y9-K8P2-Z3Q6",
      "A1B2-C3D4-E5F6",
      "M9N8-L7K6-J5I4",
      "R2T3-Y4U5-I6O7",
      "P9Q8-W7E6-R5T4"
    ]);
    
    // Demo login tarixi
    setLoginHistory([
      { id: 1, device: "Chrome Windows", location: "Toshkent, UZ", time: "Bugun 14:30", ip: "192.168.1.100", active: true },
      { id: 2, device: "Firefox Android", location: "Samarqand, UZ", time: "Kecha 09:15", ip: "192.168.1.101", active: false },
      { id: 3, device: "Safari iOS", location: "Buxoro, UZ", time: "3 kun oldin 16:45", ip: "192.168.1.102", active: false }
    ]);
    
    // Demo xavfsizlik ogohlantirishlari
    setSecurityAlerts([
      { id: 1, type: "warning", message: "3 marta noto'g'ri parol urinishi", time: "2 kun oldin", read: false },
      { id: 2, type: "info", message: "Yangi qurilmadan kirish", time: "5 kun oldin", read: true },
      { id: 3, type: "success", message: "Parol muvaffaqiyatli o'zgartirildi", time: "1 hafta oldin", read: true }
    ]);
  }, []);

  const handle2FAToggle = () => {
    const newTwoFA = !twoFA;
    setTwoFA(newTwoFA);
    
    if (newTwoFA) {
      setShowQR(true);
      toast.success("Ikki faktorli autentifikatsiya yoqildi!");
      toast.info("QR kodni skaner qiling yoki backup kodlarni saqlang");
    } else {
      setShowQR(false);
      setShowBackupCodes(false);
      toast.info("Ikki faktorli autentifikatsiya o'chirildi");
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Yangi parollar mos kelmadi!");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    
    toast.success("Parol muvaffaqiyatli o'zgartirildi!");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswordForm(false);
  };

  const generateBackupCodes = () => {
    const newCodes = Array.from({ length: 10 }, () => {
      return Math.random().toString(36).substring(2, 6).toUpperCase() + 
             "-" + 
             Math.random().toString(36).substring(2, 6).toUpperCase();
    });
    setBackupCodes(newCodes);
    toast.success("Yangi backup kodlar yaratildi!");
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText).then(() => {
      toast.success("Backup kodlar buferga ko'chirildi!");
    }).catch(err => {
      toast.error("Ko'chirishda xatolik yuz berdi!");
    });
  };

  const handleSessionSettingsChange = (key, value) => {
    setSessionSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.info("Sessiya sozlamalari yangilandi!");
  };

  const revokeSession = (sessionId) => {
    setLoginHistory(prev => prev.filter(session => session.id !== sessionId));
    toast.warning("Sessiya bekor qilindi!");
  };

  const markAllAlertsAsRead = () => {
    setSecurityAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    toast.info("Barcha ogohlantirishlar o'qilgan deb belgilandi");
  };

  const SecurityCard = ({ icon: Icon, title, description, action, actionText, status, color = "blue" }) => (
    <div className="security-card">
      <div className="card-icon" style={{ background: `var(--${color}-light)` }}>
        <Icon style={{ color: `var(--${color})` }} />
      </div>
      <div className="card-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="card-action">
        {action && (
          <button 
            onClick={action} 
            className={`action-btn ${status === 'active' ? 'btn-danger' : 'btn-primary'}`}
          >
            {actionText}
          </button>
        )}
        {status && (
          <span className={`status-badge status-${status}`}>
            {status === 'active' ? 'Faol' : 'NoFaol'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="security-dashboard">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="security-header">
        <div className="header-left">
          <FiShield className="main-icon" />
          <div>
            <h1>Xavfsizlik Boshqaruvi</h1>
            <p className="subtitle">Hisobingizni himoya qilish va xavfsizlik sozlamalari</p>
          </div>
        </div>
        <div className="header-right">
          <div className="security-score">
            <div className="score-circle">
              <span>85%</span>
            </div>
            <span className="score-label">Xavfsizlik darajasi</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="security-tabs">
        <button 
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Umumiy ko'rinish
        </button>
        <button 
          className={`tab-btn ${activeTab === "2fa" ? "active" : ""}`}
          onClick={() => setActiveTab("2fa")}
        >
          Ikki faktorli autentifikatsiya
        </button>
        <button 
          className={`tab-btn ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Parol boshqaruvi
        </button>
        <button 
          className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          Sessiyalar
        </button>
        <button 
          className={`tab-btn ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          Ogohlantirishlar
        </button>
      </div>

      {/* Main Content */}
      <div className="security-content">
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="overview-grid">
            <SecurityCard
              icon={FiShield}
              title="Ikki faktorli autentifikatsiya"
              description="Qo'shimcha xavfsizlik qatlami uchun mobil ilova orqali tasdiqlash"
              action={handle2FAToggle}
              actionText={twoFA ? "O'chirish" : "Yoqish"}
              status={twoFA ? "active" : "inactive"}
              color="blue"
            />
            
            <SecurityCard
              icon={FiLock}
              title="Parol holati"
              description="Oxirgi o'zgartirish: 30 kun oldin"
              action={() => setShowPasswordForm(true)}
              actionText="O'zgartirish"
              color="green"
            />
            
            <SecurityCard
              icon={FiUser}
              title="Faol sessiyalar"
              description={`${loginHistory.filter(s => s.active).length} ta faol sessiya`}
              action={() => setActiveTab("sessions")}
              actionText="Ko'rish"
              color="purple"
            />
            
            <SecurityCard
              icon={FiAlertCircle}
              title="Ogohlantirishlar"
              description={`${securityAlerts.filter(a => !a.read).length} ta o'qilmagan`}
              action={markAllAlertsAsRead}
              actionText="O'qildi deb belgilash"
              color="orange"
            />
            
            {/* Security Status */}
            <div className="status-section">
              <h3>Xavfsizlik holati</h3>
              <div className="status-indicators">
                <div className="indicator-item">
                  <div className="indicator-icon success">
                    <FiCheck />
                  </div>
                  <div>
                    <span className="indicator-title">Parol kuchli</span>
                    <span className="indicator-desc">Parol talablarga javob beradi</span>
                  </div>
                </div>
                
                <div className="indicator-item">
                  <div className="indicator-icon warning">
                    <FiAlertCircle />
                  </div>
                  <div>
                    <span className="indicator-title">2FA nofaol</span>
                    <span className="indicator-desc">Qo'shimcha himoya kerak</span>
                  </div>
                </div>
                
                <div className="indicator-item">
                  <div className="indicator-icon success">
                    <FiCheck />
                  </div>
                  <div>
                    <span className="indicator-title">Sessiya xavfsiz</span>
                    <span className="indicator-desc">Faol sessiyalar nazorat ostida</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Tab */}
        {activeTab === "2fa" && (
          <div className="twofa-section">
            <div className="section-header">
              <h2><FiShield /> Ikki faktorli autentifikatsiya</h2>
              <p>Hisobingizni qo'shimcha himoya qilish uchun 2FA ni yoqing</p>
            </div>
            
            <div className="twofa-toggle-section">
              <div className="toggle-header">
                <div className="toggle-info">
                  <h3>2 Faollashtirish</h3>
                  <p>Google Authenticator yoki Authy ilovasi orqali tasdiqlash</p>
                </div>
                <div className="toggle-switch">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={twoFA}
                      onChange={handle2FAToggle}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="toggle-label">{twoFA ? "Faol" : "Nofaol"}</span>
                </div>
              </div>
              
              {twoFA && (
                <div className="twofa-content">
                  <div className="qr-section">
                    <div className="qr-header">
                      <h4>QR kodni skaner qiling</h4>
                      <button 
                        className="btn-secondary"
                        onClick={() => setShowQR(!showQR)}
                      >
                        {showQR ? "Yashirish" : "Ko'rsatish"}
                      </button>
                    </div>
                    
                    {showQR && (
                      <div className="qr-container">
                        <div className="qr-code">
                          <img src={qrCode} alt="2FA QR Code" />
                          <div className="qr-overlay">
                            <div className="qr-text">TISH-CLINIC-2FA</div>
                          </div>
                        </div>
                        <div className="qr-instructions">
                          <h5>Qo'llash yo'riqnomasi:</h5>
                          <ol>
                            <li>Google Authenticator ilovasini yuklab oling</li>
                            <li>"QR kod skaner qilish" tugmasini bosing</li>
                            <li>Yuqoridagi QR kodni skaner qiling</li>
                            <li>Ilova avtomatik kod generatsiya qila boshlaydi</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="backup-section">
                    <div className="backup-header">
                      <h4>Backup kodlar</h4>
                      <div className="backup-actions">
                        <button 
                          className="btn-secondary"
                          onClick={() => setShowBackupCodes(!showBackupCodes)}
                        >
                          {showBackupCodes ? "Yashirish" : "Ko'rsatish"}
                        </button>
                        <button onClick={generateBackupCodes} className="btn-primary">
                          <FiRefreshCw /> Yangilash
                        </button>
                      </div>
                    </div>
                    
                    {showBackupCodes && (
                      <div className="backup-codes-container">
                        <div className="codes-grid">
                          {backupCodes.map((code, index) => (
                            <div key={index} className="code-item">
                              <span className="code-number">{index + 1}</span>
                              <span className="code-text">{code}</span>
                              <button 
                                className="copy-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(code);
                                  toast.info(`Kod ${code} nusxalandi`);
                                }}
                              >
                                <FiCopy />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="backup-warning">
                          <FiAlertCircle />
                          <p>Ushbu kodlarni xavfsiz joyda saqlang. Har bir kod faqat bir marta ishlatiladi.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="password-section">
            <div className="section-header">
              <h2><FiLock /> Parol boshqaruvi</h2>
              <p>Parolingizni muntazam yangilang va kuchli parol yarating</p>
            </div>
            
            <div className="password-content">
              <div className="password-form-section">
                <h3>Parolni o'zgartirish</h3>
                
                {!showPasswordForm ? (
                  <div className="password-prompt">
                    <p>Oxirgi marta parol 30 kun oldin o'zgartirilgan</p>
                    <button 
                      onClick={() => setShowPasswordForm(true)}
                      className="btn-primary"
                    >
                      <FiKey /> Parolni o'zgartirish
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="password-form">
                    <div className="form-group">
                      <label>Joriy parol</label>
                      <div className="password-input">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Joriy parolingizni kiriting"
                          required
                        />
                        <button 
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Yangi parol</label>
                      <div className="password-input">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Kamida 8 ta belgidan iborat bo'lsin"
                          required
                          minLength="8"
                        />
                        <button 
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Yangi parolni tasdiqlash</label>
                      <div className="password-input">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Yangi parolni qayta kiriting"
                          required
                        />
                        <button 
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        Parolni yangilash
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowPasswordForm(false)}
                        className="btn-secondary"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="password-requirements">
                <h3>Parol talablari</h3>
                <div className="requirements-list">
                  <div className="requirement-item">
                    <div className="requirement-check">
                      <FiCheck />
                    </div>
                    <span>Kamida 8 ta belgi</span>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-check">
                      <FiCheck />
                    </div>
                    <span>Kamida 1 ta katta harf</span>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-check">
                      <FiCheck />
                    </div>
                    <span>Kamida 1 ta raqam</span>
                  </div>
                  <div className="requirement-item">
                    <div className="requirement-check">
                      <FiCheck />
                    </div>
                    <span>Kamida 1 ta maxsus belgi</span>
                  </div>
                </div>
                
                <div className="password-tips">
                  <h4>Parol yaratish maslahatlari:</h4>
                  <ul>
                    <li>So'zlardan foydalanmang</li>
                    <li>Shaxsiy ma'lumotlardan foydalanmang</li>
                    <li>Har xil turdagi belgilardan foydalaning</li>
                    <li>Har 90 kunda parolni yangilang</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="sessions-section">
            <div className="section-header">
              <h2><FiUser /> Sessiyalar boshqaruvi</h2>
              <p>Faol sessiyalarni ko'rish va boshqarish</p>
            </div>
            
            <div className="sessions-content">
              <div className="session-controls">
                <div className="control-card">
                  <h4>Sessiya sozlamalari</h4>
                  <div className="control-options">
                    <div className="control-option">
                      <label>
                        <input
                          type="checkbox"
                          checked={sessionSettings.autoLogout}
                          onChange={(e) => handleSessionSettingsChange('autoLogout', e.target.checked)}
                        />
                        <span>Avtomatik chiqish</span>
                      </label>
                      <span className="option-value">{sessionSettings.sessionTimeout} daqiqa</span>
                    </div>
                    
                    <div className="control-option">
                      <label>Sessiya muddati:</label>
                      <select
                        value={sessionSettings.sessionTimeout}
                        onChange={(e) => handleSessionSettingsChange('sessionTimeout', parseInt(e.target.value))}
                      >
                        <option value="15">15 daqiqa</option>
                        <option value="30">30 daqiqa</option>
                        <option value="60">1 soat</option>
                        <option value="120">2 soat</option>
                      </select>
                    </div>
                    
                    <div className="control-option">
                      <label>Maksimal kirish urinishlari:</label>
                      <select
                        value={sessionSettings.maxLoginAttempts}
                        onChange={(e) => handleSessionSettingsChange('maxLoginAttempts', parseInt(e.target.value))}
                      >
                        <option value="3">3 marta</option>
                        <option value="5">5 marta</option>
                        <option value="10">10 marta</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="sessions-list">
                <div className="list-header">
                  <h3>Kirish tarixi</h3>
                  <button 
                    className="btn-danger"
                    onClick={() => {
                      setLoginHistory(prev => prev.filter(s => !s.active));
                      toast.warning("Barcha faol sessiyalar bekor qilindi!");
                    }}
                  >
                    <FiLogOut /> Barchasini bekor qilish
                  </button>
                </div>
                
                <div className="sessions-table">
                  {loginHistory.map((session) => (
                    <div key={session.id} className="session-row">
                      <div className="session-info">
                        <div className="session-device">
                          <div className="device-icon">
                            {session.device.includes("Chrome") ? "🌐" : 
                             session.device.includes("Firefox") ? "🦊" : 
                             session.device.includes("Safari") ? "🍎" : "📱"}
                          </div>
                          <div>
                            <div className="device-name">{session.device}</div>
                            <div className="device-location">{session.location}</div>
                          </div>
                        </div>
                        
                        <div className="session-details">
                          <div className="detail-item">
                            <span className="detail-label">Vaqt:</span>
                            <span className="detail-value">{session.time}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">IP manzil:</span>
                            <span className="detail-value">{session.ip}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="session-actions">
                        {session.active && (
                          <span className="active-badge">
                            <div className="active-dot"></div>
                            Faol
                          </span>
                        )}
                        <button 
                          onClick={() => revokeSession(session.id)}
                          className="btn-revoke"
                          disabled={!session.active}
                        >
                          <FiLogOut /> Bekor qilish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="alerts-section">
            <div className="section-header">
              <h2><FiAlertCircle /> Xavfsizlik ogohlantirishlari</h2>
              <p>Hisobingizdagi barcha xavfsizlik hodisalari</p>
            </div>
            
            <div className="alerts-content">
              <div className="alerts-list">
                <div className="list-header">
                  <h3>So'nggi ogohlantirishlar</h3>
                  <button 
                    onClick={markAllAlertsAsRead}
                    className="btn-secondary"
                  >
                    Barchasini o'qildi deb belgilash
                  </button>
                </div>
                
                <div className="alerts-container">
                  {securityAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`alert-item ${alert.read ? 'read' : 'unread'}`}
                    >
                      <div className="alert-icon">
                        <div className={`icon-container ${alert.type}`}>
                          {alert.type === 'success' ? <FiCheck /> : 
                           alert.type === 'warning' ? <FiAlertCircle /> : 
                           <FiAlertCircle />}
                        </div>
                      </div>
                      
                      <div className="alert-content">
                        <div className="alert-header">
                          <h4>{alert.message}</h4>
                          {!alert.read && <span className="unread-badge">Yangi</span>}
                        </div>
                        <div className="alert-time">{alert.time}</div>
                      </div>
                      
                      <button 
                        className="alert-action"
                        onClick={() => {
                          setSecurityAlerts(prev => 
                            prev.map(a => 
                              a.id === alert.id ? {...a, read: true} : a
                            )
                          );
                        }}
                      >
                        {alert.read ? "O'qilgan" : "O'qildi deb belgilash"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="alerts-settings">
                <div className="settings-card">
                  <h3>Ogohlantirish sozlamalari</h3>
                  
                  <div className="settings-options">
                    <div className="settings-group">
                      <h4>Email ogohlantirishlari</h4>
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span>Yangi qurilmadan kirish</span>
                      </label>
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span>Parol o'zgartirish</span>
                      </label>
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span>Ko'p marta noto'g'ri kirish urinishlari</span>
                      </label>
                    </div>
                    
                    <div className="settings-group">
                      <h4>Tizim ogohlantirishlari</h4>
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span>Sessiya muddati tugashi</span>
                      </label>
                      <label className="setting-option">
                        <input type="checkbox" defaultChecked />
                        <span>Backup kodlardan foydalanish</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;