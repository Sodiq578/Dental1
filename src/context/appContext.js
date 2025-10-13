import { createContext, useState } from "react";

// Kontekst yaratamiz
export const AppContext = createContext();

// Provider (ta'minlovchi) komponent
export const AppProvider = ({ children }) => {
  // Joriy foydalanuvchi uchun state
  const [currentUser, setCurrentUser] = useState(null);

  // Ombordagi mahsulotlar ro'yxati uchun state
  const [inventory, setInventory] = useState([]);

  // Xodimlar ro'yxati uchun state (StaffPermissions uchun)
  const [staff, setStaff] = useState([
    {
      id: 1,
      name: "Dr. Ali Valiyev",
      email: "ali.valiyev@clinic.uz",
      role: "doctor",
      permissions: {
        patients: true,
        appointments: true,
        medications: true,
        billing: false,
        inventory: false,
        reports: true
      },
      branchId: 1,
      phone: "+998 90 123 45 67",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Hamshira Zuhra Karimova",
      email: "zuhra.karimova@clinic.uz",
      role: "nurse",
      permissions: {
        patients: true,
        appointments: true,
        medications: false,
        billing: false,
        inventory: false,
        reports: false
      },
      branchId: 1,
      phone: "+998 91 234 56 78",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Admin Botir Xo'jayev",
      email: "botir.xojayev@clinic.uz",
      role: "admin",
      permissions: {
        patients: true,
        appointments: true,
        medications: true,
        billing: true,
        inventory: true,
        reports: true
      },
      branchId: 2,
      phone: "+998 93 345 67 89",
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: "Xodim Nigora To'xtayeva",
      email: "nigora.toxtayeva@clinic.uz",
      role: "staff",
      permissions: {
        patients: false,
        appointments: false,
        medications: false,
        billing: true,
        inventory: true,
        reports: false
      },
      branchId: 3,
      phone: "+998 94 456 78 90",
      createdAt: new Date().toISOString()
    }
  ]);

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

  // Yangi xodim qo'shish funksiyasi
  const addStaffMember = (newStaff) => {
    const staffMember = {
      id: Date.now(), // Real app'da backend'dan keladi
      ...newStaff,
      permissions: {
        patients: false,
        appointments: false,
        medications: false,
        billing: false,
        inventory: false,
        reports: false
      },
      createdAt: new Date().toISOString()
    };
    setStaff(prev => [...prev, staffMember]);
    return staffMember;
  };

  // Xodimni o'chirish funksiyasi
  const removeStaffMember = (staffId) => {
    setStaff(prev => prev.filter(member => member.id !== staffId));
  };

  // Xodim ma'lumotlarini yangilash funksiyasi
  const updateStaffMember = (staffId, updatedData) => {
    setStaff(prev => prev.map(member => 
      member.id === staffId 
        ? { ...member, ...updatedData }
        : member
    ));
  };

  // Barcha context qiymatlari
  const contextValue = {
    currentUser,
    loginUser,
    registerUser,
    logoutUser,
    inventory,
    setInventory,
    // Staff management
    staff,
    setStaff,
    addStaffMember,
    removeStaffMember,
    updateStaffMember
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};