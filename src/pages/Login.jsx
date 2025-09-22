// Login.jsx (komponentni ozgina o'zgartirdim: orqa fon rasm qo'shildi, dental temaga mos ranglar va animatsiyalar)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiUserPlus } from "react-icons/fi";
import { useContext } from "react";
import { AppContext } from "../App";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();
  const { users, setUsers } = useContext(AppContext);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
      navigate("/foydalanuvchi");
    } else {
      setError("Noto'g'ri email yoki parol");
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
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-card">
          <h2 className="login-title">
            {isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
          </h2>
          {error && <p className="error-message">{error}</p>}
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
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Yuklanmoqda..." : isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
            </button>
          </form>
          <p className="toggle-link">
            {isRegisterMode ? "Allaqachon hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
            <button onClick={toggleMode} className="toggle-button">
              {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;