import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiX } from "react-icons/fi";
import { AppContext } from "../App";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient"); // Default role: patient
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const navigate = useNavigate();
  const { users, setUsers } = useContext(AppContext);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
        setModalContent({
          title: "Muvaffaqiyatli kirish",
          message: "Tizimga muvaffaqiyatli kirdingiz!",
        });
        setShowModal(true);
        setTimeout(() => {
          if (user.role === "patient") {
            navigate("/foydalanuvchi"); // Mijoz uchun shaxsiy kabinet
          } else {
            navigate("/"); // Xodim/admin uchun dashboard
          }
        }, 1500);
      } else {
        setError("Noto‘g‘ri email yoki parol. Agar tizimga kira olmasangiz, token orqali kirish uchun adminga murojaat qiling.");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (users.find((u) => u.email === email)) {
        setError("Bu email allaqachon ro‘yxatdan o‘tgan");
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role, // Role saqlanadi
        patientId: role === "patient" ? users.length + 1 : null, // Faqat mijoz uchun patientId
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      onLogin(newUser);
      setModalContent({
        title: "Muvaffaqiyatli ro‘yxatdan o‘tish",
        message: "Hisobingiz muvaffaqiyatli yaratildi va tizimga kirdingiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        if (newUser.role === "patient") {
          navigate("/foydalanuvchi"); // Mijoz uchun shaxsiy kabinet
        } else {
          navigate("/"); // Xodim/admin uchun dashboard
        }
      }, 1500);
      setIsLoading(false);
    }, 1000);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setRole("patient"); // Har safar rejim o'zgarganda patient default bo'ladi
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">{isRegisterMode ? "Ro‘yxatdan o‘tish" : "Mijoz sifatida kirish"}</h2>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          {isRegisterMode && (
            <>
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
              {/* Role tanlash: Mijoz default bo'ladi */}
              <div className="role-selection">
                <h4>Bo'limni tanlang:</h4>
                <label>
                  <input
                    type="radio"
                    value="patient"
                    checked={role === "patient"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  Mijoz sifatida (shaxsiy kabinet)
                </label>
                <label>
                  <input
                    type="radio"
                    value="staff"
                    checked={role === "staff"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  Xodim sifatida (to'liq tizim)
                </label>
              </div>
            </>
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
            {isLoading ? (
              <div className="loading-spinner">
                Yuklanmoqda...
              </div>
            ) : isRegisterMode ? "Ro‘yxatdan o‘tish" : "Kirish"}
          </button>
        </form>
        <p className="toggle-text">
          {isRegisterMode ? "Allaqachon hisobingiz bormi?" : "Hisobingiz yo‘qmi?"}
          <button onClick={toggleMode} className="toggle-button">
            {isRegisterMode ? "Kirish" : "Ro‘yxatdan o‘tish"}
          </button>
        </p>
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
              <button className="modal-btn modal-btn-cancel" onClick={closeModal}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;