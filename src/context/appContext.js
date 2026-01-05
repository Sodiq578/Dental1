import { createContext, useState, useEffect } from "react";

// Kontekst yaratamiz
export const AppContext = createContext();

// Provider (ta'minlovchi) komponent
export const AppProvider = ({ children }) => {
  // Joriy foydalanuvchi uchun state
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
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Yangi hujjat",
      message: "Rentgen 2025-01 hujjati yuklandi",
      type: "system",
      read: false,
      time: "5 daqiqa oldin",
      date: new Date().toISOString()
    }
  ]);

  // Yangi state'lar qo'shildi
  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: "Rentgen 2025-01", 
      type: "X-Ray", 
      date: "2025-01-15",
      patientName: "Hasan Alimov",
      doctorName: "Dr. Ali Valiyev",
      description: "Yuqori jag' rentgeni",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "2.4 MB",
      tags: ["Rentgen", "Tibbiy", "Jag"]
    },
    { 
      id: 2, 
      name: "Qon tahlili natijalari", 
      type: "Lab", 
      date: "2025-01-10",
      patientName: "Zarina Nazarova",
      doctorName: "Dr. Ali Valiyev",
      description: "To'liq qon tahlili",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "1.2 MB",
      tags: ["Tahlil", "Lab", "Qon"]
    },
    { 
      id: 3, 
      name: "Shartnoma №1245", 
      type: "PDF", 
      date: "2024-12-01",
      patientName: "Bekzod Rasulov",
      doctorName: "Dr. Ali Valiyev",
      description: "Davolanish shartnomasi",
      uploadedBy: "Admin Botir Xo'jayev",
      fileSize: "850 KB",
      tags: ["Shartnoma", "Rasmiy", "Hujjat"]
    },
    { 
      id: 4, 
      name: "Bemor tibbiy yozuvlari", 
      type: "Folder", 
      date: "2025-01-20",
      patientName: "Madina Xolmirzayeva",
      doctorName: "Dr. Ali Valiyev",
      description: "Bemorning to'liq tibbiy tarixi",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "4.7 MB",
      tags: ["Tarix", "Arxiv", "Bemor"]
    },
    { 
      id: 5, 
      name: "Stomatologik tahlil", 
      type: "PDF", 
      date: "2025-01-18",
      patientName: "Javohir To'rayev",
      doctorName: "Dr. Ali Valiyev",
      description: "Tishlar holati tahlili",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "1.8 MB",
      tags: ["Tish", "Tahlil", "Stomatologiya"]
    },
    { 
      id: 6, 
      name: "MRI skanerlash", 
      type: "Image", 
      date: "2025-01-22",
      patientName: "Sardor Qodirov",
      doctorName: "Dr. Ali Valiyev",
      description: "Bosh MRI tasviri",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "8.5 MB",
      tags: ["MRI", "Tasvir", "Diagnostika"]
    },
    { 
      id: 7, 
      name: "Xarajatlar hisoboti", 
      type: "Excel", 
      date: "2025-01-25",
      patientName: "Dilshod Axmedov",
      doctorName: "Dr. Ali Valiyev",
      description: "Oylik xarajatlar hisoboti",
      uploadedBy: "Admin Botir Xo'jayev",
      fileSize: "650 KB",
      tags: ["Hisobot", "Moliya", "Excel"]
    },
    { 
      id: 8, 
      name: "Tish rentgeni", 
      type: "X-Ray", 
      date: "2025-01-28",
      patientName: "Fotima Yusupova",
      doctorName: "Dr. Ali Valiyev",
      description: "Panoramik tish rentgeni",
      uploadedBy: "Dr. Ali Valiyev",
      fileSize: "3.2 MB",
      tags: ["Rentgen", "Tish", "Panoramik"]
    }
  ]); // Hujjatlar (Rentgen, Tahlil, Shartnomalar, PDF/JPG)

  const [dentalCharts, setDentalCharts] = useState([
    {
      id: 1,
      patientId: 1,
      patientName: "Hasan Alimov",
      teeth: Array(32).fill(null).map((_, i) => ({
        number: i + 1,
        condition: i < 8 ? "healthy" : i < 16 ? "cavity" : "filled",
        notes: "",
        lastCheck: "2025-01-15"
      })),
      lastUpdated: "2025-01-15",
      doctorName: "Dr. Ali Valiyev"
    }
  ]); // Tish Kartasi va Sxemasi (32 tish, ranglar, tarix)

  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 1,
      staffId: 1,
      staffName: "Dr. Ali Valiyev",
      date: "2025-01-15",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "present",
      hoursWorked: 9
    }
  ]); // Ish vaqti / Attendance

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      userId: 1,
      userName: "Dr. Ali Valiyev",
      action: "login",
      details: "Tizimga kirish",
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100"
    }
  ]); // Audit Log

  const [securitySettings, setSecuritySettings] = useState({ 
    twoFAEnabled: false,
    passwordExpiryDays: 90,
    sessionTimeout: 30,
    failedLoginAttempts: 5
  }); // Xavfsizlik (2FA)

  // Boshlang'ich ma'lumotlarni yuklash
  useEffect(() => {
    // localStorage'dan ma'lumotlarni olish
    const savedAppointments = localStorage.getItem('appointments');
    const savedBillings = localStorage.getItem('billings');
    const savedInventory = localStorage.getItem('inventory');
    const savedStaff = localStorage.getItem('staff');
    const savedNotifications = localStorage.getItem('notifications');

    // Yangi state'lar uchun yuklash
    const savedDocuments = localStorage.getItem('documents');
    const savedDentalCharts = localStorage.getItem('dentalCharts');
    const savedAttendanceRecords = localStorage.getItem('attendanceRecords');
    const savedAuditLogs = localStorage.getItem('auditLogs');
    const savedSecuritySettings = localStorage.getItem('securitySettings');

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

    // Yangi state'lar
    if (savedDocuments) {
      try {
        setDocuments(JSON.parse(savedDocuments));
      } catch (error) {
        console.error('Documents ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedDentalCharts) {
      try {
        setDentalCharts(JSON.parse(savedDentalCharts));
      } catch (error) {
        console.error('DentalCharts ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedAttendanceRecords) {
      try {
        setAttendanceRecords(JSON.parse(savedAttendanceRecords));
      } catch (error) {
        console.error('AttendanceRecords ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedAuditLogs) {
      try {
        setAuditLogs(JSON.parse(savedAuditLogs));
      } catch (error) {
        console.error('AuditLogs ma\'lumotlarini parse qilishda xato:', error);
      }
    }

    if (savedSecuritySettings) {
      try {
        setSecuritySettings(JSON.parse(savedSecuritySettings));
      } catch (error) {
        console.error('SecuritySettings ma\'lumotlarini parse qilishda xato:', error);
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

  // Yangi state'lar uchun saqlash
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('dentalCharts', JSON.stringify(dentalCharts));
  }, [dentalCharts]);

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  // Foydalanuvchini tizimga kiritish funksiyasi (2FA majburiy admin uchun qo'shimcha tekshirish mumkin)
  const loginUser = (user) => {
    if (user.role === 'admin' && !securitySettings.twoFAEnabled) {
      // 2FA majburiy bo'lsa, bu yerda qo'shimcha logika qo'shing (masalan, OTP so'rash)
      console.warn('Admin uchun 2FA majburiy!');
    }
    setCurrentUser(user);
    // Login notification qo'shish
    addNotification({
      title: 'Tizimga kirish',
      message: `${user.name} tizimga kirdi`,
      type: 'system',
      read: false
    });
    // Audit log qo'shish
    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'login',
      details: 'Foydalanuvchi tizimga kirdi',
      ipAddress: '192.168.1.100'
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
    // Audit log qo'shish
    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'register',
      details: 'Yangi foydalanuvchi ro\'yxatdan o\'tdi'
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
      // Audit log qo'shish
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'logout',
        details: 'Foydalanuvchi tizimdan chiqdi'
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
    
    // Audit log qo'shish
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'add_staff',
      details: `Yangi xodim qo'shildi: ${staffMember.name}`
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
      // Audit log qo'shish
      addAuditLog({
        userId: currentUser?.id,
        userName: currentUser?.name,
        action: 'remove_staff',
        details: `Xodim o'chirildi: ${staffMember.name}`
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
    // Audit log qo'shish
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'update_staff',
      details: `Xodim ma'lumotlari yangilandi: ID ${staffId}`
    });
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

  // Yangi funksiyalar qo'shildi
  // Hujjat qo'shish (masalan, Rentgen yoki PDF)
  const addDocument = (newDocument) => {
    const document = {
      id: Date.now(),
      ...newDocument,
      uploadedAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, document]);
    
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'add_document',
      details: `Yangi hujjat qo'shildi: ${newDocument.name} (${newDocument.type})`
    });
    
    addNotification({
      title: 'Yangi hujjat',
      message: `${newDocument.name} hujjati yuklandi`,
      type: 'document',
      read: false
    });
    
    return document;
  };

  // Tish kartasi yangilash
  const updateDentalChart = (patientId, chartData) => {
    setDentalCharts(prev => {
      const existing = prev.find(chart => chart.patientId === patientId);
      if (existing) {
        return prev.map(chart => 
          chart.patientId === patientId ? { ...chart, ...chartData, lastUpdated: new Date().toISOString() } : chart
        );
      }
      return [...prev, { patientId, ...chartData, lastUpdated: new Date().toISOString() }];
    });
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'update_dental_chart',
      details: `Bemor tish kartasi yangilandi: ID ${patientId}`
    });
  };

  // Attendance qayd etish
  const recordAttendance = (record) => {
    const newRecord = {
      id: Date.now(),
      ...record,
      timestamp: new Date().toISOString()
    };
    setAttendanceRecords(prev => [...prev, newRecord]);
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'record_attendance',
      details: `Ish vaqti qaydi qo'shildi: ${record.staffName} - ${record.type}`
    });
  };

  // Audit log qo'shish funksiyasi
  const addAuditLog = (log) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...log
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 2FA yoqish/o'chirish (admin uchun majburiy)
  const toggle2FA = (enabled) => {
    setSecuritySettings(prev => ({ ...prev, twoFAEnabled: enabled }));
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'toggle_2fa',
      details: `2FA ${enabled ? 'yoqildi' : 'o\'chirildi'}`
    });
    
    addNotification({
      title: 'Xavfsizlik sozlamalari',
      message: `2FA ${enabled ? 'yoqildi' : 'o\'chirildi'}`,
      type: 'security',
      read: false
    });
  };

  // Hujjatni o'chirish funksiyasi
  const deleteDocument = (documentId) => {
    const document = documents.find(d => d.id === documentId);
    setDocuments(prev => prev.filter(d => d.id !== documentId));
    
    if (document) {
      addAuditLog({
        userId: currentUser?.id,
        userName: currentUser?.name,
        action: 'delete_document',
        details: `Hujjat o'chirildi: ${document.name}`
      });
      
      addNotification({
        title: 'Hujjat o\'chirildi',
        message: `${document.name} hujjati o'chirildi`,
        type: 'warning',
        read: false
      });
    }
  };

  // Hujjatni yangilash funksiyasi
  const updateDocument = (documentId, updatedData) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, ...updatedData, updatedAt: new Date().toISOString() }
        : doc
    ));
    
    addAuditLog({
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'update_document',
      details: `Hujjat yangilandi: ID ${documentId}`
    });
  };

  // Hujjatni qidirish funksiyasi
  const searchDocuments = (searchTerm) => {
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Hujjatlar statistikasi
  const getDocumentStats = () => {
    const total = documents.length;
    const byType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {});
    const byDoctor = documents.reduce((acc, doc) => {
      acc[doc.doctorName] = (acc[doc.doctorName] || 0) + 1;
      return acc;
    }, {});
    
    return { total, byType, byDoctor };
  };

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
    notificationBadgeCount,

    // Hujjatlar boshqaruvi
    documents,
    setDocuments,
    addDocument,
    deleteDocument,
    updateDocument,
    searchDocuments,
    getDocumentStats,
    
    // Tish kartasi
    dentalCharts,
    setDentalCharts,
    updateDentalChart,
    
    // Ish vaqti
    attendanceRecords,
    setAttendanceRecords,
    recordAttendance,
    
    // Audit log
    auditLogs,
    setAuditLogs,
    addAuditLog,
    
    // Xavfsizlik
    securitySettings,
    setSecuritySettings,
    toggle2FA
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;