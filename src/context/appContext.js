// AppContext.js - Global State Management
import { createContext, useState, useEffect } from "react";

// Kontekst yaratamiz
export const AppContext = createContext();

// Provider (ta'minlovchi) komponent
export const AppProvider = ({ children }) => {
  // Joriy foydalanuvchi uchun state
  const [currentUser, setCurrentUser] = useState(null);

  // Uchrashuvlar uchun state
  const [appointments, setAppointments] = useState([]);

  // To'lovlar uchun state
  const [billings, setBillings] = useState([]);

  // Ombordagi mahsulotlar ro'yxati uchun state
  const [inventory, setInventory] = useState([]);

  // Xodimlar ro'yxati uchun state
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

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);

  // Boshlang'ich ma'lumotlarni yuklash
  useEffect(() => {
    // localStorage'dan ma'lumotlarni olish
    const savedAppointments = localStorage.getItem('appointments');
    const savedBillings = localStorage.getItem('billings');
    const savedInventory = localStorage.getItem('inventory');
    const savedStaff = localStorage.getItem('staff');
    const savedNotifications = localStorage.getItem('notifications');

    if (savedAppointments) {
      try {
        setAppointments(JSON.parse(savedAppointments));
      } catch (error) {
        console.error('Appointments ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedBillings) {
      try {
        setBillings(JSON.parse(savedBillings));
      } catch (error) {
        console.error('Billings ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (error) {
        console.error('Inventory ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedStaff) {
      try {
        setStaff(JSON.parse(savedStaff));
      } catch (error) {
        console.error('Staff ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Notifications ma\'lumotlarini parse qilishda xato:', error);
      }
    }
  }, []);

  // State o'zgarganida localStorage'ga saqlash
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('billings', JSON.stringify(billings));
  }, [billings]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Foydalanuvchini tizimga kiritish funksiyasi
  const loginUser = (user) => {
    setCurrentUser(user);
    // Login notification qo'shish
    addNotification({
      title: 'Tizimga kirish',
      message: `${user.name} tizimga kirdi`,
      type: 'system',
      read: false
    });
  };

  // Foydalanuvchini ro'yxatdan o'tkazish funksiyasi
  const registerUser = (user) => {
    setCurrentUser(user);
    addNotification({
      title: 'Ro\'yxatdan o\'tish',
      message: `${user.name} ro\'yxatdan o\'tdi`,
      type: 'system',
      read: false
    });
  };

  // Tizimdan chiqish funksiyasi
  const handleLogout = () => {
    if (currentUser) {
      addNotification({
        title: 'Tizimdan chiqish',
        message: `${currentUser.name} tizimdan chiqdi`,
        type: 'system',
        read: false
      });
    }
    setCurrentUser(null);
    localStorage.removeItem('userToken');
  };

  // Yangi xodim qo'shish funksiyasi
  const addStaffMember = (newStaff) => {
    const staffMember = {
      id: Date.now(),
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
    
    addNotification({
      title: 'Yangi xodim',
      message: `${staffMember.name} xodim sifatida qo\'shildi`,
      type: 'system',
      read: false
    });
    
    return staffMember;
  };

  // Xodimni o'chirish funksiyasi
  const removeStaffMember = (staffId) => {
    const staffMember = staff.find(m => m.id === staffId);
    setStaff(prev => prev.filter(member => member.id !== staffId));
    
    if (staffMember) {
      addNotification({
        title: 'Xodim o\'chirildi',
        message: `${staffMember.name} xodim ro\'yxatidan o\'chirildi`,
        type: 'system',
        read: false
      });
    }
  };

  // Xodim ma'lumotlarini yangilash funksiyasi
  const updateStaffMember = (staffId, updatedData) => {
    setStaff(prev => prev.map(member => 
      member.id === staffId 
        ? { ...member, ...updatedData }
        : member
    ));
  };

  // Notification qo'shish funksiyasi
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      time: 'Hozir',
      date: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Notification o'qilgan deb belgilash
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  // Barcha notification'larni o'qilgan qilish
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // Notification o'chirish
  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // Notification badge count
  const notificationBadgeCount = notifications.filter(n => !n.read).length;

  // Barcha context qiymatlari
  const contextValue = {
    // User management
    currentUser,
    loginUser,
    registerUser,
    handleLogout,
    
    // Data management
    appointments,
    setAppointments,
    billings,
    setBillings,
    inventory,
    setInventory,
    
    // Staff management
    staff,
    setStaff,
    addStaffMember,
    removeStaffMember,
    updateStaffMember,
    
    // Loading state
    isLoading,
    setIsLoading,
    
    // Notification management
    notifications,
    setNotifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    notificationBadgeCount
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};