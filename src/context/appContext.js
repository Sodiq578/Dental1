// src/context/AppContext.js
import { createContext, useState } from "react";

// Context yaratamiz
export const AppContext = createContext();

// Provider
export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Login funksiyasi
  const loginUser = (user) => {
    setCurrentUser(user);
  };

  // Ro‘yxatdan o‘tish funksiyasi
  const registerUser = (user) => {
    setCurrentUser(user);
  };

  // Logout funksiyasi
  const logoutUser = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{ currentUser, loginUser, registerUser, logoutUser }}>
      {children}
    </AppContext.Provider>
  );
};
