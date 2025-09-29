import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiX, FiMail, FiShield, FiKey, FiPhone, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import { AppContext } from "../App";
import { logLogin } from "../utils";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [authMethod, setAuthMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [tempUser, setTempUser] = useState(null);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [showTokenLogin, setShowTokenLogin] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  
  const navigate = useNavigate();
  const { users, setUsers, setLogins, staff } = useContext(AppContext);
  const otpInputRefs = useRef([]);

  // Timer logic for OTP resend
  useEffect(() => {
    let interval = null;
    if (isOtpMode && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOtpMode, timer]);

  // OTP inputlari uchun focus boshqaruvi
  useEffect(() => {
    if (isOtpMode && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [isOtpMode]);

  // OTP mode ga o'tganda reset qilish
  useEffect(() => {
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
    }
  }, [isOtpMode]);

  const handleResendOtp = () => {
    if (canResend) {
      setTimer(120);
      setCanResend(false);
      setError("");
      setOtp("");
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {}, 1000);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    if (value && index < 3) {
      otpInputRefs.current[index + 1].focus();
    }
    
    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);
    
    if (fullOtp.length === 4 && autoVerify) {
      setTimeout(() => {
        handleAutoVerify(fullOtp);
      }, 500);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleAutoVerify = (otpCode) => {
    if (otpCode === "1234") {
      setIsLoading(true);
      setTimeout(() => {
        if (isRegisterMode) {
          const updatedUsers = [...users, tempUser];
          setUsers(updatedUsers);
        }
        onLogin(tempUser);
        logLogin(tempUser);
        setLogins((prevLogins) => [
          ...prevLogins,
          {
            id: Date.now(),
            userId: tempUser.id,
            name: tempUser.name,
            email: tempUser.email,
            phone: tempUser.phone,
            role: tempUser.role,
            timestamp: new Date().toISOString(),
          },
        ]);
        setModalContent({
          title: isRegisterMode ? "Muvaffaqiyatli ro'yxatdan o'tish" : "Muvaffaqiyatli kirish",
          message: "Tizimga muvaffaqiyatli kirdingiz!",
        });
        setShowModal(true);
        setTimeout(() => {
          if (tempUser.role === "patient") {
            navigate("/foydalanuvchi");
          } else {
            navigate("/");
          }
        }, 1500);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const numbers = pasteData.replace(/\D/g, '').slice(0, 4);
    
    const newOtpDigits = [...otpDigits];
    numbers.split('').forEach((num, index) => {
      if (index < 4) {
        newOtpDigits[index] = num;
      }
    });
    
    setOtpDigits(newOtpDigits);
    setOtp(numbers);
    
    const lastFilledIndex = Math.min(numbers.length - 1, 3);
    if (otpInputRefs.current[lastFilledIndex]) {
      otpInputRefs.current[lastFilledIndex].focus();
    }
    
    if (numbers.length === 4 && autoVerify) {
      setTimeout(() => {
        handleAutoVerify(numbers);
      }, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (authMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }
    if (authMethod === "phone" && !/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (authMethod === "email" && !password) {
      setError("Parol kiritilishi shart");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      if (isRegisterMode) {
        if (authMethod === "email" && users.find((u) => u.email === email)) {
          setError("Bu email allaqachon ro'yxatdan o'tgan");
          setIsLoading(false);
          return;
        }
        if (authMethod === "phone" && users.find((u) => u.phone === phone)) {
          setError("Bu telefon raqami allaqachon ro'yxatdan o'tgan");
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: users.length + 1,
          name,
          email: authMethod === "email" ? email : "",
          phone: authMethod === "phone" ? phone : "",
          password: authMethod === "email" ? password : "",
          role,
          patientId: role === "patient" ? users.length + 1 : null,
        };
        setTempUser(newUser);
        setIsOtpMode(true);
        setTimer(120);
        setCanResend(false);
      } else {
        const user = users.find((u) =>
          (authMethod === "email"
            ? u.email === email && u.password === password
            : u.phone === phone) && u.role === role
        );
        if (user) {
          setTempUser(user);
          setIsOtpMode(true);
          setTimer(120);
          setCanResend(false);
        } else {
          setError(
            authMethod === "email"
              ? "Noto'g'ri email yoki parol."
              : "Bu telefon raqami ro'yxatdan o'tmagan."
          );
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (otp === "1234") {
        if (isRegisterMode) {
          const updatedUsers = [...users, tempUser];
          setUsers(updatedUsers);
        }
        onLogin(tempUser);
        logLogin(tempUser);
        setLogins((prevLogins) => [
          ...prevLogins,
          {
            id: Date.now(),
            userId: tempUser.id,
            name: tempUser.name,
            email: tempUser.email,
            phone: tempUser.phone,
            role: tempUser.role,
            timestamp: new Date().toISOString(),
          },
        ]);
        setModalContent({
          title: isRegisterMode ? "Muvaffaqiyatli ro'yxatdan o'tish" : "Muvaffaqiyatli kirish",
          message: "Tizimga muvaffaqiyatli kirdingiz!",
        });
        setShowModal(true);
        setTimeout(() => {
          if (tempUser.role === "patient") {
            navigate("/foydalanuvchi");
          } else {
            navigate("/");
          }
        }, 1500);
      } else {
        setError("Noto'g'ri OTP kodi. (Test uchun: 1234)");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleTokenLogin = (e) => {
    e.preventDefault();
    setError("");

    const token = e.target.token?.value;
    if (!token?.trim()) {
      setError("Token kiritilishi shart");
      return;
    }

    const staffMember = staff.find(s => 
      s.token === token && 
      s.tokenExpiry && 
      new Date() < new Date(s.tokenExpiry)
    );

    if (staffMember) {
      const tempUser = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: 'staff',
        staffData: staffMember,
        loginMethod: 'token'
      };
      
      onLogin(tempUser);
      logLogin(tempUser);
      setLogins((prevLogins) => [
        ...prevLogins,
        {
          id: Date.now(),
          userId: tempUser.id,
          name: tempUser.name,
          email: tempUser.email,
          role: tempUser.role,
          timestamp: new Date().toISOString(),
        },
      ]);
      setModalContent({
        title: "Muvaffaqiyatli kirish",
        message: "Xodim sifatida tizimga kirdingiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } else {
      setError("Noto'g'ri yoki muddati o'tgan token");
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPhone("");
    setPassword("");
    setName("");
    setRole("patient");
    setIsOtpMode(false);
    setOtp("");
    setOtpDigits(['', '', '', '']);
    setTimer(120);
    setCanResend(false);
    setShowPassword(false);
    setShowTokenLogin(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  return (
    <div className="login-page">
      <div className="dental-bg-pattern"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiShield className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">
              {showTokenLogin ? "Token orqali kirish" : 
               isRegisterMode ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
            </h2>
            <p className="login-subtitle">
              {showTokenLogin ? "Xodim sifatida tizimga kirish" :
               isRegisterMode ? "Yangi hisob yarating" : "Hisobingizga kiring"}
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <div className="alert-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {showTokenLogin ? (
            <div className="token-login-section">
              <div className="token-info-card">
                <FiKey className="token-icon" />
                <h3>Xodim kirishi</h3>
                <p>Token orqali tizimga kirish uchun quyidagi formani to'ldiring</p>
              </div>

              <form onSubmit={handleTokenLogin} className="login-form">
                <div className={`input-group ${isFocused.token ? 'focused' : ''}`}>
                  <FiShield className="input-icon" />
                  <input
                    type="text"
                    name="token"
                    placeholder="Token kodini kiriting"
                    onFocus={() => handleFocus('token')}
                    onBlur={() => handleBlur('token')}
                    className="input-field token-input"
                    maxLength="10"
                    autoFocus
                  />
                </div>

                <button type="submit" className="submit-button token-submit">
                  <FiKey /> Token orqali kirish
                </button>

                <button 
                  type="button" 
                  className="back-to-login"
                  onClick={() => setShowTokenLogin(false)}
                >
                  <FiArrowLeft /> Oddiy kirishga qaytish
                </button>
              </form>
            </div>
          ) : !isOtpMode ? (
            <form onSubmit={handleSubmit} className="login-form">
              {isRegisterMode && (
                <div className={`input-group ${isFocused.name ? 'focused' : ''}`}>
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="To'liq ism"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div className="selection-group">
                <label className="section-label">Autentifikatsiya usuli:</label>
                <div className="auth-method-selection">
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="email"
                      checked={authMethod === "email"}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiMail className="option-icon" />
                    Email
                  </label>
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="phone"
                      checked={authMethod === "phone"}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiPhone className="option-icon" />
                    Telefon
                  </label>
                </div>
              </div>

              <div className="selection-group">
                <label className="section-label">Hisob turi:</label>
                <div className="role-selection">
                  <label className="role-option">
                    <input
                      type="radio"
                      value="patient"
                      checked={role === "patient"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <FiUser className="option-icon" />
                    Mijoz
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      value="staff"
                      checked={role === "staff"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <FiShield className="option-icon" />
                    Xodim
                  </label>
                </div>
              </div>

              {authMethod === "email" ? (
                <div className={`input-group ${isFocused.email ? 'focused' : ''}`}>
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Elektron pochta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    className="input-field"
                    required
                  />
                </div>
              ) : (
                <div className={`input-group ${isFocused.phone ? 'focused' : ''}`}>
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="+998 XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => handleFocus('phone')}
                    onBlur={() => handleBlur('phone')}
                    className="input-field"
                    required
                  />
                </div>
              )}

              {authMethod === "email" && (
                <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    className="input-field"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Yuklanmoqda...
                  </>
                ) : isRegisterMode ? (
                  "Ro'yxatdan o'tish"
                ) : (
                  "Kirish"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="login-form">
              <div className="otp-info">
                <p className="otp-message">
                  {authMethod === "email"
                    ? "Elektron pochtangizga yuborilgan 4 xonali kodni kiriting"
                    : "Telefon raqamingizga SMS orqali yuborilgan 4 xonali kodni kiriting"}
                </p>
                <p className="otp-hint">(Test rejimida: <strong>1234</strong>)</p>
                
                <div className="auto-verify-option">
                  <label className="auto-verify-label">
                    <input
                      type="checkbox"
                      checked={autoVerify}
                      onChange={(e) => setAutoVerify(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Kod to'liq kiritilganda avtomatik tekshirish
                  </label>
                </div>
              </div>

              <div className="otp-inputs-container">
                <div className="otp-inputs-group">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handlePaste}
                      onFocus={() => handleFocus(`otp-${index}`)}
                      onBlur={() => handleBlur(`otp-${index}`)}
                      className={`otp-digit-input ${otpDigits[index] ? 'filled' : ''} ${
                        isFocused[`otp-${index}`] ? 'focused' : ''
                      }`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <div className="otp-digits-display">
                  {otpDigits.map((digit, index) => (
                    <span 
                      key={index} 
                      className={`otp-digit ${digit ? 'active' : ''} ${
                        isFocused[`otp-${index}`] ? 'focused' : ''
                      }`}
                    >
                      {digit || '•'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="otp-timer">
                <div className="countdown-timer">
                  <span>Qayta yuborish: </span>
                  <span className="timer-display">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || otp.length !== 4}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Tekshirilmoqda...
                  </>
                ) : (
                  "Tasdiqlash"
                )}
              </button>

              <div className="otp-actions">
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOtp}
                  disabled={!canResend}
                >
                  Kodni qayta yuborish
                </button>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setIsOtpMode(false);
                    setOtpDigits(['', '', '', '']);
                    setOtp('');
                    setTimer(120);
                    setCanResend(false);
                  }}
                >
                  Orqaga
                </button>
              </div>
              
              <div className="otp-help">
                <p>
                  <strong>Qo'llanma:</strong> Kodni bitta inputga yozishingiz yoki har bir raqamni alohida kiriting.
                  Kod to'liq kiritilganda avtomatik tekshiriladi.
                </p>
              </div>
            </form>
          )}

          {!isOtpMode && !showTokenLogin && (
            <div className="login-footer">
              <p className="toggle-text">
                {isRegisterMode ? "Hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
                <button onClick={toggleMode} className="toggle-button">
                  {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
                </button>
              </p>

              {!isRegisterMode && (
                <div className="token-login-option">
                  <div className="separator">
                    <span>Yoki</span>
                  </div>
                  <button 
                    onClick={() => setShowTokenLogin(true)} 
                    className="btn-token-login"
                  >
                    <FiKey className="btn-icon" />
                    Token orqali kirish (Xodimlar uchun)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{modalContent.title}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="modal-content">
              <p>{modalContent.message}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-primary" onClick={closeModal}>
                Davom etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;


