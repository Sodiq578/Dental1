import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiUserPlus } from "react-icons/fi";
import { useContext } from "react";
import { AppContext } from "../App";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          {isRegisterMode && (
            <div className="mb-4 relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Ism"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}
          <div className="mb-4 relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-6 relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : isRegisterMode ? "Ro'yxatdan o'tish" : "Kirish"}
          </button>
        </form>
        <p className="text-center mt-4">
          {isRegisterMode ? "Allaqachon hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
          <button
            onClick={toggleMode}
            className="text-indigo-600 hover:underline ml-1"
          >
            {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;