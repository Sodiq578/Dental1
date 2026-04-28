import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({
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
  });

  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [dentalCharts, setDentalCharts] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({ twoFAEnabled: false, passwordExpiryDays: 90, sessionTimeout: 30, failedLoginAttempts: 5 });

  const loginUser = (user) => {
    setCurrentUser(user);
    addNotification({ title: 'Tizimga kirish', message: `${user.name} tizimga kirdi`, type: 'system', read: false });
    addAuditLog({ userId: user.id, userName: user.name, action: 'login', details: 'Foydalanuvchi tizimga kirdi', ipAddress: '192.168.1.100' });
  };

  const registerUser = (user) => {
    setCurrentUser(user);
    addNotification({ title: "Ro'yxatdan o'tish", message: `${user.name} ro'yxatdan o'tdi`, type: 'system', read: false });
    addAuditLog({ userId: user.id, userName: user.name, action: 'register', details: "Yangi foydalanuvchi ro'yxatdan o'tdi" });
  };

  const handleLogout = () => {
    if (currentUser) {
      addNotification({ title: 'Tizimdan chiqish', message: `${currentUser.name} tizimdan chiqdi`, type: 'system', read: false });
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'logout', details: 'Foydalanuvchi tizimdan chiqdi' });
    }
    setCurrentUser(null);
    localStorage.removeItem('userToken');
  };

  const addNotification = (notification) => {
    const newNotification = { id: Date.now(), ...notification, time: 'Hozir', date: new Date().toISOString() };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const addAuditLog = (log) => {
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), ...log };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const contextValue = { currentUser, loginUser, registerUser, handleLogout, appointments, setAppointments, billings, setBillings, inventory, setInventory, staff, setStaff, isLoading, setIsLoading, notifications, setNotifications, addNotification, documents, setDocuments, dentalCharts, setDentalCharts, attendanceRecords, setAttendanceRecords, auditLogs, setAuditLogs, securitySettings, setSecuritySettings };

  return (<AppContext.Provider value={contextValue}>{children}</AppContext.Provider>);
};

export default AppProvider;