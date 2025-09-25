import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiUserPlus, FiKey } from "react-icons/fi";
import { AppContext } from "../App";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [showGeneratedToken, setShowGeneratedToken] = useState(false);
  const navigate = useNavigate();
  const { users, setUsers } = useContext(AppContext);

  // Generate a new token every 30 seconds
  useEffect(() => {
    const generateToken = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setGeneratedToken(result);
    };

    generateToken();
    const tokenInterval = setInterval(generateToken, 30000); // Rotate every 30 seconds

    return () => clearInterval(tokenInterval);
  }, []);

  // Handle keypress for Ctrl+Alt+D and Ctrl+Alt+Q
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "d") {
        setShowTokenInput(true);
        setShowGeneratedToken(false);
        setError("");
      }
      if (e.ctrlKey && e.altKey && e.key === "q") {
        setShowGeneratedToken(true);
        setShowTokenInput(false);
        setError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (showTokenInput) {
      // Token-based login
      if (token === generatedToken) {
        const adminUser = {
          id: 0,
          name: "Admin",
          email: "admin@example.com",
          patientId: 0,
        };
        onLogin(adminUser);
        navigate("/foydalanuvchi");
      } else {
        setError("Noto'g'ri token. Iltimos, adminga murojaat qiling.");
      }
    } else {
      // Email/password login
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
        navigate("/foydalanuvchi");
      } else {
        setError("Noto'g'ri email yoki parol. Token orqali kirish uchun Ctrl+Alt+D bosing.");
      }
    }
    setIsLoading(false);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
      patientId: users.length + 1,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    onLogin(newUser);
    navigate("/foydalanuvchi");
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setShowTokenInput(false);
    setShowGeneratedToken(false);
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-card">
          <h2 className="login-title">
            {isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
          </h2>
          {error && <p className="error-message">{error}</p>}
          {showGeneratedToken && (
            <div className="token-display">
              <FiKey className="token-icon" />
              <p>Token: <span className="token-value">{generatedToken}</span></p>
              <p className="token-info">Token har 30 soniyada yangilanadi</p>
            </div>
          )}
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="login-form">
            {isRegisterMode && (
              <div className="input-group">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Ism"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            )}
            {!showTokenInput && !isRegisterMode && (
              <>
                <div className="input-group">
                  <FiUser className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
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
              </>
            )}
            {showTokenInput && (
              <div className="input-group">
                <FiKey className="input-icon" />
                <input
                  type="text"
                  placeholder="Token kiriting"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yuklanmoqda...
                </span>
              ) : isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
            </button>
          </form>
          <p className="toggle-link">
            {isRegisterMode ? "Allaqachon hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
            <button onClick={toggleMode} className="toggle-button">
              {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          </p>
          {!isRegisterMode && (
            <p className="token-hint">
              Token orqali kirish uchun <strong>Ctrl+Alt+D</strong> bosing. Token olish uchun <strong>Ctrl+Alt+Q</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;