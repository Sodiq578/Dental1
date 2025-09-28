import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiX, FiMail, FiShield, FiKey, FiPhone } from "react-icons/fi";
import { AppContext } from "../App";
import { logLogin } from "../utils";
import "./Login.css";

const Login = ({ onLogin, onOpenTokenLogin }) => {
  const [authMethod, setAuthMethod] = useState("email"); // email or phone
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
  const [tempUser, setTempUser] = useState(null);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const { users, setUsers, setLogins } = useContext(AppContext);

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

  const handleResendOtp = () => {
    if (canResend) {
      setTimer(120);
      setCanResend(false);
      setError("");
      setOtp("");
      // Simulate resending OTP
      setTimeout(() => {
        // In a real app, resend OTP to email or phone
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate input based on auth method
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
          password: authMethod === "email" ? password : "", // No password for phone
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
    setTimer(120);
    setCanResend(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="login-page">
      <div className="dental-bg-icons"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiShield className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">{isRegisterMode ? "Ro'yxatdan o'tish" : "Tizimga kirish"}</h2>
            <p className="login-subtitle">
              {isRegisterMode ? "Yangi hisob yarating" : "Hisobingizga kiring"}
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

              <div className="auth-method-selection">
                <label className="auth-method-option">
                  <input
                    type="radio"
                    value="email"
                    checked={authMethod === "email"}
                    onChange={(e) => setAuthMethod(e.target.value)}
                  />
                  <span className="auth-method-custom"></span>
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
                  Telefon
                </label>
              </div>

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

              {authMethod === "email" ? (
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
              ) : (
                <div className="input-group">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Telefon raqami (+998XXXXXXXXX)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              )}

              {authMethod === "email" && (
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
              )}

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
                <p>
                  {authMethod === "email"
                    ? "Elektron pochtangizga yuborilgan 4 xonali kodni kiriting"
                    : "Telefon raqamingizga SMS orqali yuborilgan 4 xonali kodni kiriting"}
                </p>
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

              <div className="countdown-timer">
                Qayta yuborish: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? "Tekshirilmoqda..." : "Tasdiqlash"}
              </button>

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
                  setOtp("");
                  setTimer(120);
                  setCanResend(false);
                }}
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