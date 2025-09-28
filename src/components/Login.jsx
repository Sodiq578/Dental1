import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiX, FiMail, FiShield, FiKey } from "react-icons/fi";
import { AppContext } from "../App";
import { logLogin } from "../utils";
import "./Login.css";

const Login = ({ onLogin, onOpenTokenLogin }) => {
  const [email, setEmail] = useState("");
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
  const [tempUser, setTempUser] = useState(null);
  const navigate = useNavigate();
  const { users, setUsers, setLogins } = useContext(AppContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (isRegisterMode) {
        if (users.find((u) => u.email === email)) {
          setError("Bu email allaqachon ro'yxatdan o'tgan");
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: users.length + 1,
          name,
          email,
          password,
          role,
          patientId: role === "patient" ? users.length + 1 : null,
        };
        setTempUser(newUser);
        setIsOtpMode(true);
      } else {
        const user = users.find((u) => u.email === email && u.password === password && u.role === role);
        if (user) {
          setTempUser(user);
          setIsOtpMode(true);
        } else {
          setError("Noto'g'ri email, parol yoki rol.");
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

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setRole("patient");
    setIsOtpMode(false);
    setOtp("");
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiShield className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">{isRegisterMode ? "Ro'yxatdan o'tish" : "Tizimga kirish"}</h2>
            <p className="login-subtitle">
              {isRegisterMode 
                ? "Yangi hisob yarating" 
                : "Hisobingizga kiring"}
            </p>
          </div>
          
          {error && <div className="alert-error">{error}</div>}
          
          {!isOtpMode ? (
            <form onSubmit={handleSubmit} className="login-form">
              {isRegisterMode && (
                <div className="input-group">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="To'liq ism"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              )}
              
              <div className="role-selection">
                <h4>Hisob turi:</h4>
                <div className="role-options">
                  <label className="role-option">
                    <input
                      type="radio"
                      value="patient"
                      checked={role === "patient"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="radio-custom"></span>
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
                    Xodim
                  </label>
                </div>
              </div>
              
              <div className="input-group">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Elektron pochta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="input-group">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading-spinner">Yuklanmoqda...</span>
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
                <p>Elektron pochtangizga yuborilgan 4 xonali kodni kiriting</p>
                <p className="otp-hint">(Test rejimida: <strong>1234</strong>)</p>
              </div>
              
              <div className="input-group">
                <FiShield className="input-icon" />
                <input
                  type="text"
                  placeholder="OTP kodi"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field"
                  maxLength="4"
                  required
                />
              </div>
              
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? "Tekshirilmoqda..." : "Tasdiqlash"}
              </button>
              
              <button 
                type="button" 
                className="back-button"
                onClick={() => setIsOtpMode(false)}
              >
                Orqaga
              </button>
            </form>
          )}
          
          <div className="login-footer">
            <p className="toggle-text">
              {isRegisterMode ? "Hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
              <button onClick={toggleMode} className="toggle-button">
                {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
              </button>
            </p>

            {/* Token login option */}
            {!isRegisterMode && (
              <div className="token-login-option">
                <div className="separator">
                  <span>Yoki</span>
                </div>
                <button onClick={onOpenTokenLogin} className="btn-token-login">
                  <FiKey /> Token orqali kirish (Xodimlar uchun)
                </button>
              </div>
            )}
          </div>
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