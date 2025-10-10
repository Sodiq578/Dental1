import { createContext, useState } from "react";

// Kontekst yaratamiz
export const AppContext = createContext();

// Provider (ta'minlovchi) komponent
export const AppProvider = ({ children }) => {
  // Joriy foydalanuvchi uchun state
  const [currentUser, setCurrentUser] = useState(null);

  // Ombordagi mahsulotlar ro'yxati uchun state
  const [inventory, setInventory] = useState([]);

  // Foydalanuvchini tizimga kiritish funksiyasi
  const loginUser = (user) => {
    setCurrentUser(user);
  };

  // Foydalanuvchini ro'yxatdan o'tkazish funksiyasi
  const registerUser = (user) => {
    setCurrentUser(user);
  };

  // Tizimdan chiqish funksiyasi
  const logoutUser = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      loginUser,
      registerUser,
      logoutUser,
      inventory,      // Ombor ma'lumotlari
      setInventory,   // Ombor ma'lumotlarini yangilash funksiyasi
    }}>
      {children}
    </AppContext.Provider>
  );
};
