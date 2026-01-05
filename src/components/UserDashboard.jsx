import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign,
  FiDownload, FiLogOut, FiPhone, FiPlus, FiSearch,
  FiHome, FiCreditCard, FiBarChart2, FiBell, FiMenu, 
  FiX, FiCheckCircle, FiAlertCircle, FiCheck, FiTrash2,
  FiMessageSquare, FiEye, FiPrinter, FiCopy, FiChevronRight
} from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { CSVLink } from "react-csv";
import { AppContext } from "../App";
import { addNewPatient, sendTelegramMessage } from "../utils";
import "./UserDashboard.css";

const COLORS = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#7209b7', '#f72585'];

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Naqd pul', icon: '💰', fee: 0 },
  { id: 'card', name: 'Plastik karta', icon: '💳', fee: 1.5 },
  { id: 'click', name: 'Click', icon: '🟢', fee: 1.2 },
  { id: 'payme', name: 'Payme', icon: '🟣', fee: 1.0 },
  { id: 'uzum', name: 'Uzum Bank', icon: '🟡', fee: 0.8 },
  { id: 'transfer', name: 'Bank o\'tkazmasi', icon: '🏦', fee: 0.5 }
];

const PAYMENT_STATUS = {
  PENDING: "kutilmoqda",
  PROCESSING: "jarayonda",
  SUCCESS: "muvaffaqiyatli",
  FAILED: "muvaffaqiyatsiz",
  REFUNDED: "qaytarilgan"
};

const UserDashboard = () => {
  const { currentUser, appointments, billings, setAppointments, setBillings, handleLogout } = useContext(AppContext);
  const [filter, setFilter] = useState("hamma");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Patient registration states
  const [newPatient, setNewPatient] = useState({
    name: '', phone: '', gender: '', address: '', dob: '', note: '', telegram: '', prescriptions: []
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegistration, setShowRegistration] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [procedure, setProcedure] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Yangi uchrashuv band qilindi",
      message: "Siz 15-dekabr kuni soat 14:30 da stomatologik tekshiruvga yozildingiz",
      type: "appointment",
      time: "5 daqiqa oldin",
      read: false,
      date: new Date().toISOString(),
      action: { type: "view", appointmentId: 1 }
    },
    {
      id: 2,
      title: "To'lov tasdiqlandi",
      message: "200,000 UZS miqdoridagi to'lovingiz muvaffaqiyatli amalga oshirildi",
      type: "billing",
      time: "1 soat oldin",
      read: false,
      date: new Date(Date.now() - 3600000).toISOString(),
      action: { type: "view", billId: 1 }
    },
    {
      id: 3,
      title: "Eslatma",
      message: "Ertaga 10:00 da sizning davolashingiz yakunlanadi",
      type: "reminder",
      time: "2 soat oldin",
      read: true,
      date: new Date(Date.now() - 7200000).toISOString(),
      action: { type: "reminder" }
    },
    {
      id: 4,
      title: "Tizim yangilanishi",
      message: "Telegram orqali eslatmalar qo'shildi. Sozlamalardan faollashtiring",
      type: "system",
      time: "1 kun oldin",
      read: true,
      date: new Date(Date.now() - 86400000).toISOString(),
      action: { type: "settings" }
    },
    {
      id: 5,
      title: "Yangilik: Yangi xizmatlar",
      message: "Endi implantatsiya va ortopedik davolash xizmatlari mavjud",
      type: "system",
      time: "2 kun oldin",
      read: true,
      date: new Date(Date.now() - 172800000).toISOString(),
      action: { type: "info" }
    }
  ]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(2);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(30);
  const [logoutReason, setLogoutReason] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Get user-specific data
  const userAppointments = useMemo(() =>
    appointments.filter(apt => apt.patientId === currentUser?.id),
    [appointments, currentUser]
  );

  const userBillings = useMemo(() =>
    billings.filter(bill => bill.patientId === currentUser?.id),
    [billings, currentUser]
  );

  // Filter appointments based on selected filter
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      if (filter === "o'tgan") return aptDate < now;
      if (filter === "kelgusi") return aptDate >= now;
      return true;
    });
  }, [userAppointments, filter]);

  // Calculate statistics
  const totalAppointments = userAppointments.length;
  const totalCost = userBillings.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const totalPaid = userBillings.reduce((sum, bill) => sum + (bill.paid || 0), 0);
  const upcomingCount = userAppointments.filter(apt => new Date(apt.date) > new Date()).length;
  const lastBilling = userBillings[userBillings.length - 1];

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const stats = {
      totalPaid: 0,
      pendingAmount: 0,
      lastPaymentDate: null,
      paymentMethods: {}
    };
    
    userBillings.forEach(bill => {
      stats.totalPaid += bill.paid || 0;
      stats.pendingAmount += (bill.total - (bill.paid || 0));
      
      if (bill.paymentHistory) {
        bill.paymentHistory.forEach(payment => {
          if (!stats.paymentMethods[payment.method]) {
            stats.paymentMethods[payment.method] = 0;
          }
          stats.paymentMethods[payment.method] += payment.amount;
          
          if (!stats.lastPaymentDate || new Date(payment.date) > new Date(stats.lastPaymentDate)) {
            stats.lastPaymentDate = payment.date;
          }
        });
      }
    });
    
    return stats;
  }, [userBillings]);

  // Prepare chart data
  const treatmentsByMonth = useMemo(() => {
    const monthly = {};
    filteredAppointments.forEach(apt => {
      const month = new Date(apt.date).getMonth() + 1;
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly).map(([month, count]) => ({
      month: `${month}-oy`, count
    }));
  }, [filteredAppointments]);

  const treatmentTypes = useMemo(() => {
    const types = {};
    filteredAppointments.forEach(apt => {
      const type = apt.procedure || "Noma'lum";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  const paymentTimeline = useMemo(() => {
    const timeline = [];
    userBillings.forEach(bill => {
      if (bill.paymentHistory) {
        bill.paymentHistory.forEach(payment => {
          timeline.push({
            date: new Date(payment.date).toLocaleDateString('uz-UZ'),
            amount: payment.amount,
            method: payment.method
          });
        });
      }
    });
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }, [userBillings]);

  // CSV data for export
  const appointmentCSVData = filteredAppointments.map(apt => ({
    Sana: new Date(apt.date).toLocaleDateString('uz-UZ'),
    Vaqt: apt.time,
    Muolaja: apt.procedure,
    Holat: apt.status
  }));

  const billingCSVData = userBillings.map(bill => ({
    Sana: new Date(bill.date).toLocaleDateString('uz-UZ'),
    Jami: bill.total,
    Tolangan: bill.paid || 0,
    Qoldiq: bill.total - (bill.paid || 0),
    Xizmatlar: bill.services.map(s => s.name).join(", "),
    Holat: bill.status
  }));

  // Logout handler
  const handleLogoutClick = () => {
    setIsLoading(true);
    
    // Log logout reason if provided
    if (logoutReason) {
      console.log(`Chiqish sababi: ${logoutReason}`);
    }
    
    setTimeout(() => {
      handleLogout();
      navigate("/login");
    }, 800);
  };

  // Logout confirmation
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
    setLogoutTimer(30);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
    setLogoutTimer(30);
    setLogoutReason('');
  };

  // Auto logout timer
  useEffect(() => {
    let timer;
    if (showLogoutConfirm && logoutTimer > 0) {
      timer = setInterval(() => {
        setLogoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (logoutTimer === 0 && showLogoutConfirm) {
      handleLogoutClick();
    }
    return () => clearInterval(timer);
  }, [showLogoutConfirm, logoutTimer]);

  // Reset timer on user activity
  useEffect(() => {
    const resetTimer = () => {
      if (showLogoutConfirm) {
        setLogoutTimer(30);
      }
    };

    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [showLogoutConfirm]);

  // Time slot generation
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getSlotsForDate = (date) => {
    const timeSlots = generateTimeSlots();
    const booked = appointments
      .filter(app => app.date === date && app.status !== 'bekor qilindi')
      .map(app => app.time);
    return timeSlots.map(slot => ({
      time: slot,
      isBooked: booked.includes(slot),
    }));
  };

  const slots = getSlotsForDate(selectedDate);

  const findNextAvailableSlot = () => {
    let currentDate = new Date(selectedDate);
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const available = getSlotsForDate(dateStr).filter(s => !s.isBooked);
      if (available.length > 0) {
        return { date: dateStr, time: available[0].time };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return null;
  };

  // Patient registration
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate phone number
    if (!newPatient.phone.match(/^\+998[0-9]{9}$/)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      return;
    }

    // In a real app, this would be an API call
    addNewPatient(newPatient, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        
        // Add notification
        const newNotification = {
          id: Date.now(),
          title: "Ro'yxatdan o'tish muvaffaqiyatli",
          message: `Hurmatli ${newPatient.name}, siz muvaffaqiyatli ro'yxatdan o'tdingiz`,
          type: "system",
          time: "Hozir",
          read: false,
          date: new Date().toISOString(),
          action: { type: "welcome" }
        };
        setNotifications([newNotification, ...notifications]);
        
        // Send Telegram notification if provided
        if (newPatient.telegram) {
          sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, ro'yxatdan o'tdingiz!`);
        }
      } else {
        setError(message);
      }
    });
  };

  // Book appointment
  const handleBookAppointment = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!patientId) return setError("Avval ro'yxatdan o'ting");
    if (!selectedTime) return setError("Vaqt tanlang");
    if (!procedure.trim()) return setError("Muolaja nomini kiriting");

    const cost = 100000;
    const newApt = {
      id: Date.now(),
      patientId,
      date: selectedDate,
      time: selectedTime,
      procedure,
      status: 'kutilmoqda',
      createdAt: new Date().toISOString()
    };
    
    const newBill = {
      id: Date.now() + 1,
      patientId,
      patientName: newPatient.name,
      date: selectedDate,
      services: [{ name: procedure, cost }],
      total: cost,
      paid: 0,
      status: 'to\'lanmagan',
      paymentHistory: []
    };

    // Update state
    setAppointments([...appointments, newApt]);
    setBillings([...billings, newBill]);
    
    setSuccessMessage("Uchrashuv muvaffaqiyatli band qilindi!");
    setSelectedTime('');
    setProcedure('');

    // Add notification
    const newNotification = {
      id: Date.now() + 2,
      title: "Yangi uchrashuv band qilindi",
      message: `${selectedDate} ${selectedTime} da ${procedure} muolajasi uchun uchrashuv band qilindi`,
      type: "appointment",
      time: "Hozir",
      read: false,
      date: new Date().toISOString(),
      action: { type: "view", appointmentId: newApt.id }
    };
    setNotifications([newNotification, ...notifications]);

    // Send notifications
    const msg = `✅ ${newPatient.name}, ${selectedDate} ${selectedTime} da uchrashuv band qilindi!\nMuolaja: ${procedure}\nNarxi: ${cost} UZS`;
    if (newPatient.telegram) sendTelegramMessage(newPatient.telegram, msg);
    sendTelegramMessage('5838205785', `Yangi band: ${newPatient.name} - ${selectedDate} ${selectedTime}`);
  };

  // Payment functions
  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.total - (bill.paid || 0));
    setPaymentMethod('card');
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedBill || paymentAmount <= 0) return;
    
    setPaymentProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedBillings = billings.map(b => 
        b.id === selectedBill.id ? { 
          ...b, 
          paid: (b.paid || 0) + paymentAmount,
          status: paymentAmount >= (b.total - (b.paid || 0)) ? 'to\'langan' : 'qisman to\'langan',
          paymentHistory: [...(b.paymentHistory || []), {
            id: Date.now(),
            date: new Date().toISOString(),
            amount: paymentAmount,
            method: paymentMethod,
            methodName: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name,
            status: 'success',
            receiptNo: `SDK-${Date.now()}`
          }]
        } : b
      );
      
      setBillings(updatedBillings);
      
      // Add to payment history
      const newPaymentRecord = {
        billId: selectedBill.id,
        patientName: selectedBill.patientName,
        date: new Date().toISOString(),
        amount: paymentAmount,
        method: paymentMethod,
        methodName: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name,
        status: 'success',
        receiptNo: `SDK-${Date.now()}`
      };
      
      setPaymentHistory([newPaymentRecord, ...paymentHistory]);
      
      // Generate and show receipt
      const receiptData = {
        ...selectedBill,
        payment: newPaymentRecord,
        remaining: selectedBill.total - (selectedBill.paid || 0) - paymentAmount
      };
      
      setSelectedReceipt(receiptData);
      
      setSuccessMessage(`To'lov muvaffaqiyatli amalga oshirildi! ${paymentAmount.toLocaleString()} UZS`);
      setShowPaymentModal(false);
      
      // Add notification
      const newNotification = {
        id: Date.now(),
        title: "To'lov muvaffaqiyatli amalga oshirildi",
        message: `${paymentAmount.toLocaleString()} UZS miqdoridagi to'lov ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name} orqali tasdiqlandi`,
        type: "billing",
        time: "Hozir",
        read: false,
        date: new Date().toISOString(),
        action: { type: "receipt", billId: selectedBill.id }
      };
      setNotifications([newNotification, ...notifications]);
      
      // Auto-show receipt after 1 second
      setTimeout(() => {
        setShowReceiptModal(true);
      }, 1000);
      
    } catch (error) {
      setError("To'lov amalga oshirishda xatolik yuz berdi");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Simple text-based receipt generation (no jsPDF required)
  const generateReceipt = (receiptData) => {
    const receiptContent = `
SDK DENTAL - TO'LOV KVITANSIYASI
================================
Kvitanciya raqami: ${receiptData.payment.receiptNo}
Sana: ${new Date(receiptData.payment.date).toLocaleDateString('uz-UZ')}
Vaqt: ${new Date(receiptData.payment.date).toLocaleTimeString('uz-UZ')}
Mijoz: ${receiptData.patientName}
To'lov usuli: ${receiptData.payment.methodName}
================================
XIZMATLAR:
${receiptData.services.map((service, index) => 
  `${index + 1}. ${service.name}: ${service.cost.toLocaleString()} UZS`
).join('\n')}
================================
Umumiy summa: ${receiptData.total.toLocaleString()} UZS
To'langan: ${receiptData.payment.amount.toLocaleString()} UZS
Komissiya: ${(receiptData.payment.amount * (PAYMENT_METHODS.find(m => m.id === receiptData.payment.method)?.fee || 0) / 100).toLocaleString()} UZS
Qoldiq summa: ${receiptData.remaining.toLocaleString()} UZS
================================
To'lov holati: TO'LANDI
================================
Tashakkur! Sizning to'lovingiz muvaffaqiyatli qabul qilindi.
© SDK DENTAL 2024
    `;
    
    // Create a Blob and download as text file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kvitanciya-${receiptData.payment.receiptNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccessMessage("Kvitanciya yuklab olindi!");
  };

  const copyReceiptNumber = (receiptNo) => {
    navigator.clipboard.writeText(receiptNo);
    setSuccessMessage("Kvitanciya raqami nusxalandi!");
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'to\'langan': return '#10b981';
      case 'qisman to\'langan': return '#f59e0b';
      case 'to\'lanmagan': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const calculateRemainingAmount = (bill) => {
    return bill.total - (bill.paid || 0);
  };

  // Request next available slot
  const handleRequestNextSlot = () => {
    const next = findNextAvailableSlot();
    if (next) {
      setSuccessMessage(`Keyingi bo'sh vaqt: ${next.date} ${next.time}`);
      
      // Add notification
      const newNotification = {
        id: Date.now(),
        title: "Bo'sh vaqt topildi",
        message: `${next.date} ${next.time} da bo'sh vaqt mavjud`,
        type: "reminder",
        time: "Hozir",
        read: false,
        date: new Date().toISOString(),
        action: { type: "book", date: next.date, time: next.time }
      };
      setNotifications([newNotification, ...notifications]);
    } else {
      setError("Yaqin 30 kun ichida bo'sh vaqt yo'q");
    }
  };

  // Notification functions
  const toggleNotifications = () => {
    if (window.innerWidth >= 1024) {
      setShowNotifications(!showNotifications);
    } else {
      setShowNotificationModal(true);
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'appointment': return <FiCalendar size={18} />;
      case 'billing': return <FiCreditCard size={18} />;
      case 'system': return <FiMessageSquare size={18} />;
      case 'reminder': return <FiClock size={18} />;
      default: return <FiBell size={18} />;
    }
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    switch(notification.action?.type) {
      case 'view':
        if (notification.action.appointmentId) {
          setActiveTab('appointments');
          setShowNotifications(false);
          setShowNotificationModal(false);
        } else if (notification.action.billId) {
          setActiveTab('billing');
          setShowNotifications(false);
          setShowNotificationModal(false);
        }
        break;
      case 'book':
        if (notification.action.date && notification.action.time) {
          setSelectedDate(notification.action.date);
          setSelectedTime(notification.action.time);
          setShowNotificationModal(false);
          setActiveTab('dashboard');
        }
        break;
      case 'settings':
        setSuccessMessage("Sozlamalar bo'limi tez orada qo'shiladi");
        setShowNotifications(false);
        setShowNotificationModal(false);
        break;
      case 'receipt':
        const bill = userBillings.find(b => b.id === notification.action.billId);
        if (bill && bill.paymentHistory && bill.paymentHistory.length > 0) {
          setSelectedReceipt({
            ...bill,
            payment: bill.paymentHistory[bill.paymentHistory.length - 1],
            remaining: bill.total - bill.paid
          });
          setShowReceiptModal(true);
        }
        break;
      default:
        // Do nothing
    }
  };

  // Auto-update badge count when notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotificationBadgeCount(unreadCount);
  }, [notifications]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown') && !event.target.closest('.header-notification')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (!currentUser) return null;

  // News items
  const newsItems = [
    { title: "O'zbekiston Stomatologiyasi 2025", desc: "Toshkentda stomatologiya ko'rgazmasi, 15-17 aprel", img: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg" },
    { title: "UzMedExpo 2025", desc: "17-xalqaro sog'liqni saqlash ko'rgazmasi", img: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg" },
    { title: "IDECA Toshkent 2025", desc: "Stomatologiya ta'limi tadbirlari", img: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg" },
    { title: "Stomatologiyada AI", desc: "Sun'iy intellekt yangi imkoniyatlar", img: "https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg" },
    { title: "2025 Trendlar", desc: "Minimal invaziv va 3D texnologiyalar", img: "https://images.pexels.com/photos/6628600/pexels-photo-6628600.jpeg" }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <div className="sidebar-profile">
          <div className="profile-avatar"><FiUser size={32} /></div>
          <div>
            <h3>{currentUser.name}</h3>
            <p>Mijoz</p>
            <div className="profile-balance">
              <FiCreditCard size={14} />
              <span>To'langan: {totalPaid.toLocaleString()} UZS</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {["dashboard", "appointments", "billing", "stats", "payments"].map(tab => (
            <button 
              key={tab} 
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome />}
              {tab === "appointments" && <FiCalendar />}
              {tab === "billing" && <FiCreditCard />}
              {tab === "stats" && <FiBarChart2 />}
              {tab === "payments" && <FiDollarSign />}
              <span>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuvlar" :
                tab === "billing" ? "To'lovlar" :
                tab === "payments" ? "To'lov tarixi" : "Statistika"
              }</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogoutConfirm}>
            <FiLogOut /> Chiqish
          </button>
          <div className="sidebar-help">
            <a href="tel:+998901234567">📞 Qo'llab-quvvatlash</a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h1 className="header-title">SDK DENTAL</h1>
          <div className="header-notification" onClick={toggleNotifications}>
            <FiBell size={22} />
            {notificationBadgeCount > 0 && (
              <span className="notif-badge">{notificationBadgeCount}</span>
            )}
            
            {/* Desktop Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown show">
                <div className="notification-dropdown-header">
                  <h3>Xabarlar</h3>
                  <a 
                    href="#" 
                    className="view-all-notifications"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowNotifications(false);
                      setShowNotificationModal(true);
                    }}
                  >
                    Hammasini ko'rish
                  </a>
                </div>
                <div className="notification-dropdown-list">
                  {notifications.slice(0, 4).map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-dropdown-item ${notification.read ? '' : 'unread'}`}
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className={`notification-dropdown-icon ${notification.type}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-dropdown-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <div className="notification-dropdown-time">
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="notification-dropdown-item">
                      <div className="notification-dropdown-content">
                        <h4>Xabarlar yo'q</h4>
                        <p>Hozircha yangi xabarlar mavjud emas</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
              <div className="sidebar-profile">
                <div className="profile-avatar"><FiUser size={32} /></div>
                <div>
                  <h3>{currentUser.name}</h3>
                  <p>Mijoz</p>
                  <div className="profile-balance">
                    <FiCreditCard size={14} />
                    <span>To'langan: {totalPaid.toLocaleString()} UZS</span>
                  </div>
                </div>
              </div>
              <nav className="sidebar-nav">
                {["dashboard", "appointments", "billing", "stats", "payments"].map(tab => (
                  <button 
                    key={tab} 
                    className={`nav-link ${activeTab === tab ? "active" : ""}`}
                    onClick={() => { 
                      setActiveTab(tab); 
                      setMobileMenuOpen(false); 
                    }}
                  >
                    {tab === "dashboard" && <FiHome />}
                    {tab === "appointments" && <FiCalendar />}
                    {tab === "billing" && <FiCreditCard />}
                    {tab === "stats" && <FiBarChart2 />}
                    {tab === "payments" && <FiDollarSign />}
                    <span>{
                      tab === "dashboard" ? "Asosiy" :
                      tab === "appointments" ? "Uchrashuvlar" :
                      tab === "billing" ? "To'lovlar" :
                      tab === "payments" ? "To'lov tarixi" : "Statistika"
                    }</span>
                  </button>
                ))}
              </nav>
              <div className="sidebar-footer">
                <button className="logout-button" onClick={handleLogoutConfirm}>
                  <FiLogOut /> Chiqish
                </button>
                <div className="sidebar-help">
                  <a href="tel:+998901234567">📞 Qo'llab-quvvatlash</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <main className="main-container">
          {/* Alerts */}
          {successMessage && (
            <div className="alert success">
              <FiCheckCircle /> {successMessage}
            </div>
          )}
          {error && (
            <div className="alert error">
              <FiAlertCircle /> {error}
            </div>
          )}

          {/* Stats Cards */}
          {(activeTab === "dashboard" || activeTab === "stats") && (
            <div className="stats-grid">
              <div className="stat-card gradient-blue">
                <FiCalendar size={28} />
                <div>
                  <h3>{totalAppointments}</h3>
                  <p>Jami uchrashuvlar</p>
                </div>
              </div>
              <div className="stat-card gradient-purple">
                <FiDollarSign size={28} />
                <div>
                  <h3>{totalCost.toLocaleString()} UZS</h3>
                  <p>Jami xarajat</p>
                </div>
              </div>
              <div className="stat-card gradient-teal">
                <FiClock size={28} />
                <div>
                  <h3>{upcomingCount}</h3>
                  <p>Kelgusi</p>
                </div>
              </div>
              <div className="stat-card gradient-pink">
                <FiActivity size={28} />
                <div>
                  <h3>{paymentStats.totalPaid.toLocaleString()} UZS</h3>
                  <p>To'langan</p>
                </div>
              </div>
              <div className="stat-card gradient-orange">
                <FiCreditCard size={28} />
                <div>
                  <h3>{paymentStats.pendingAmount.toLocaleString()} UZS</h3>
                  <p>Qoldiq</p>
                </div>
              </div>
              <div className="stat-card gradient-green">
                <FiUser size={28} />
                <div>
                  <h3>{userBillings.filter(b => b.status === 'to\'langan').length}</h3>
                  <p>To'langanlar</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {activeTab === "stats" && (
            <div className="charts-wrapper">
              <div className="chart-box">
                <h3>Oylar bo'yicha uchrashuvlar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={treatmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ta`, 'Soni']} />
                    <Bar dataKey="count" fill="#4361ee" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-box">
                <h3>Muolaja turlari</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie 
                      data={treatmentTypes} 
                      dataKey="value" 
                      outerRadius={90} 
                      label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                    >
                      {treatmentTypes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} ta`, 'Soni']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-box full-width">
                <h3>To'lovlar tarixi</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={paymentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} UZS`, 'Summa']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {(activeTab === "dashboard" || activeTab === "appointments") && (
            <section className="section-block">
              <div className="section-title">
                <h3>Uchrashuvlar</h3>
                <div className="filter-buttons">
                  {["hamma", "kelgusi", "o'tgan"].map(f => (
                    <button 
                      key={f} 
                      className={filter === f ? "filter-active" : "filter-inactive"} 
                      onClick={() => setFilter(f)}
                    >
                      {f === "hamma" ? "Hammasi" : f === "kelgusi" ? "Kelgusi" : "O'tgan"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="list-container">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map(apt => (
                    <div key={apt.id} className="item-card">
                      <div className="item-date-time">
                        <div className="item-date">
                          {new Date(apt.date).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="item-time">{apt.time}</div>
                      </div>
                      <div className="item-info">
                        <h4>{apt.procedure}</h4>
                        <span className={`status-badge ${apt.status}`}>
                          {apt.status}
                        </span>
                      </div>
                      <button className="item-action">
                        <FiChevronRight size={20} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-placeholder">
                    <FiCalendar size={48} />
                    <p>Uchrashuvlar yo'q</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Billing Section */}
          {(activeTab === "dashboard" || activeTab === "billing") && (
            <section className="section-block">
              <div className="section-title">
                <h3>To'lovlar</h3>
                <div className="section-actions">
                  <CSVLink 
                    data={billingCSVData} 
                    filename="tolovlar.csv" 
                    className="download-btn"
                  >
                    <FiDownload /> Yuklab olish
                  </CSVLink>
                  <button 
                    className="generate-report-btn"
                    onClick={() => {
                      if (userBillings.length > 0) {
                        const bill = userBillings[0];
                        const receiptData = {
                          ...bill,
                          payment: {
                            amount: bill.paid || 0,
                            methodName: 'Naqd pul',
                            date: new Date().toISOString(),
                            receiptNo: `SDK-${Date.now()}`,
                            method: 'cash'
                          },
                          remaining: bill.total - (bill.paid || 0)
                        };
                        generateReceipt(receiptData);
                      }
                    }}
                  >
                    <FiPrinter /> Hisobot
                  </button>
                </div>
              </div>
              <div className="list-container">
                {userBillings.length > 0 ? (
                  userBillings.map(bill => {
                    const remaining = calculateRemainingAmount(bill);
                    const paidPercentage = ((bill.paid || 0) / bill.total * 100).toFixed(0);
                    
                    return (
                      <div key={bill.id} className="billing-item">
                        <div className="billing-info">
                          <div className="billing-header">
                            <div className="billing-date">
                              {new Date(bill.date).toLocaleDateString('uz-UZ')}
                            </div>
                            <div className="billing-patient">
                              {bill.patientName}
                            </div>
                          </div>
                          <div className="billing-amount">
                            <span className="amount-label">Jami:</span>
                            <strong>{bill.total.toLocaleString()} UZS</strong>
                          </div>
                          <div className="billing-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${paidPercentage}%` }}
                              />
                            </div>
                            <div className="progress-labels">
                              <span>To'langan: {(bill.paid || 0).toLocaleString()} UZS</span>
                              <span>Qoldiq: {remaining.toLocaleString()} UZS</span>
                            </div>
                          </div>
                          <div className="billing-services">
                            <span>Xizmatlar:</span>
                            <div className="services-list">
                              {bill.services.map((s, idx) => (
                                <span key={idx} className="service-tag">
                                  {s.name} - {s.cost.toLocaleString()} UZS
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="billing-actions">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getPaymentStatusColor(bill.status) }}
                          >
                            {bill.status}
                          </span>
                          {remaining > 0 && (
                            <button 
                              className="pay-button" 
                              onClick={() => handlePayBill(bill)}
                            >
                              <FiCreditCard /> To'lash
                            </button>
                          )}
                          {bill.paymentHistory && bill.paymentHistory.length > 0 && (
                            <button 
                              className="history-button"
                              onClick={() => {
                                const lastPayment = bill.paymentHistory[bill.paymentHistory.length - 1];
                                setSelectedReceipt({
                                  ...bill,
                                  payment: lastPayment,
                                  remaining: bill.total - bill.paid
                                });
                                setShowReceiptModal(true);
                              }}
                            >
                              <FiEye /> Kvitanciya
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-placeholder">
                    <FiCreditCard size={48} />
                    <p>To'lovlar yo'q</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Payment History */}
          {activeTab === "payments" && (
            <section className="section-block">
              <div className="section-title">
                <h3>To'lovlar tarixi</h3>
                <div className="payment-stats">
                  <div className="payment-stat-card">
                    <span>Jami to'langan</span>
                    <h3>{paymentStats.totalPaid.toLocaleString()} UZS</h3>
                  </div>
                  <div className="payment-stat-card">
                    <span>O'rtacha to'lov</span>
                    <h3>
                      {paymentHistory.length > 0 
                        ? (paymentStats.totalPaid / paymentHistory.length).toLocaleString(undefined, {maximumFractionDigits: 0})
                        : 0
                      } UZS
                    </h3>
                  </div>
                  <div className="payment-stat-card">
                    <span>So'nggi to'lov</span>
                    <h3>
                      {paymentStats.lastPaymentDate 
                        ? new Date(paymentStats.lastPaymentDate).toLocaleDateString('uz-UZ')
                        : 'Mavjud emas'
                      }
                    </h3>
                  </div>
                </div>
              </div>
              <div className="list-container">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <div key={index} className="payment-history-item">
                      <div className="payment-icon">
                        {PAYMENT_METHODS.find(m => m.id === payment.method)?.icon || '💰'}
                      </div>
                      <div className="payment-details">
                        <div className="payment-header">
                          <h4>{payment.patientName}</h4>
                          <span className="payment-date">
                            {new Date(payment.date).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <div className="payment-info">
                          <span className="payment-method">
                            {payment.methodName}
                          </span>
                          <span className="payment-receipt">
                            № {payment.receiptNo}
                          </span>
                        </div>
                        <div className="payment-amount">
                          <strong>{payment.amount.toLocaleString()} UZS</strong>
                          <span className={`payment-status ${payment.status}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="payment-actions">
                        <button 
                          className="receipt-button"
                          onClick={() => {
                            const bill = userBillings.find(b => b.id === payment.billId);
                            if (bill) {
                              setSelectedReceipt({
                                ...bill,
                                payment: payment,
                                remaining: bill.total - bill.paid
                              });
                              setShowReceiptModal(true);
                            }
                          }}
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="copy-button"
                          onClick={() => copyReceiptNumber(payment.receiptNo)}
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-placeholder">
                    <FiDollarSign size={48} />
                    <p>To'lovlar tarixi yo'q</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Patient Portal */}
          {activeTab === "dashboard" && (
            <section className="section-block">
              <h3 className="section-title">Mijoz Portali</h3>
              <div className="portal-container">
                {showRegistration ? (
                  <form onSubmit={handleRegister} className="form-card">
                    <h4>Ro'yxatdan o'tish</h4>
                    <input 
                      type="text" 
                      placeholder="Ismingiz" 
                      required 
                      value={newPatient.name} 
                      onChange={e => setNewPatient({...newPatient, name: e.target.value})} 
                    />
                    <input 
                      type="tel" 
                      placeholder="Telefon +998XXXXXXXXX" 
                      required 
                      value={newPatient.phone} 
                      onChange={e => setNewPatient({...newPatient, phone: e.target.value})} 
                    />
                    <input 
                      type="text" 
                      placeholder="Telegram Chat ID (ixtiyoriy)" 
                      value={newPatient.telegram} 
                      onChange={e => setNewPatient({...newPatient, telegram: e.target.value})} 
                    />
                    <button type="submit" className="primary-button full">
                      Ro'yxatdan o'tish
                    </button>
                  </form>
                ) : (
                  <div className="booking-card">
                    <h4>Yangi uchrashuv</h4>
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={e => setSelectedDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="time-grid">
                      {slots.map(s => (
                        <button 
                          key={s.time} 
                          type="button"
                          disabled={s.isBooked} 
                          className={`time-btn ${s.isBooked ? 'booked' : selectedTime === s.time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(s.time)}
                        >
                          {s.time} {s.isBooked && "●"}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleBookAppointment}>
                      <input 
                        type="text" 
                        placeholder="Muolaja nomi" 
                        required 
                        value={procedure} 
                        onChange={e => setProcedure(e.target.value)} 
                      />
                      <div className="button-group">
                        <button type="submit" className="primary-button">
                          Band qilish
                        </button>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          onClick={handleRequestNextSlot}
                        >
                          Bo'sh vaqt
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* News Section */}
          {activeTab === "dashboard" && (
            <section className="section-block">
              <h3 className="section-title">Yangiliklar</h3>
              <div className="news-grid">
                {newsItems.map((n, i) => (
                  <div key={i} className="news-item">
                    <img src={n.img} alt={n.title} loading="lazy" />
                    <div className="news-text">
                      <h4>{n.title}</h4>
                      <p>{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="bottom-nav">
          {["dashboard", "appointments", "billing", "payments", "stats"].map(tab => (
            <button 
              key={tab} 
              className={activeTab === tab ? "nav-active" : ""} 
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome size={22} />}
              {tab === "appointments" && <FiCalendar size={22} />}
              {tab === "billing" && <FiCreditCard size={22} />}
              {tab === "payments" && <FiDollarSign size={22} />}
              {tab === "stats" && <FiBarChart2 size={22} />}
              <span>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuv" :
                tab === "billing" ? "To'lov" :
                tab === "payments" ? "Tarix" : "Stat"
              }</span>
            </button>
          ))}
        </nav>

        {/* Payment Modal */}
        {showPaymentModal && selectedBill && (
          <div className="payment-modal-overlay" onClick={() => !paymentProcessing && setShowPaymentModal(false)}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
              <div className="payment-modal-header">
                <h3>To'lov amalga oshirish</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                  disabled={paymentProcessing}
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>
              
              <div className="payment-modal-body">
                <div className="payment-bill-info">
                  <h4>{selectedBill.patientName}</h4>
                  <div className="payment-details">
                    <div className="payment-detail-item">
                      <span>Umumiy summa:</span>
                      <strong>{selectedBill.total.toLocaleString()} UZS</strong>
                    </div>
                    <div className="payment-detail-item">
                      <span>To'langan:</span>
                      <strong style={{color: '#10b981'}}>
                        {(selectedBill.paid || 0).toLocaleString()} UZS
                      </strong>
                    </div>
                    <div className="payment-detail-item">
                      <span>Qoldiq:</span>
                      <strong style={{color: '#ef4444'}}>
                        {calculateRemainingAmount(selectedBill).toLocaleString()} UZS
                      </strong>
                    </div>
                  </div>
                </div>
                
                <div className="payment-amount-input">
                  <label>To'lov summasi (UZS)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                    min="1000"
                    max={calculateRemainingAmount(selectedBill)}
                    disabled={paymentProcessing}
                  />
                  <div className="amount-suggestions">
                    <button 
                      onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.25))}
                      disabled={paymentProcessing}
                    >
                      25%
                    </button>
                    <button 
                      onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.5))}
                      disabled={paymentProcessing}
                    >
                      50%
                    </button>
                    <button 
                      onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.75))}
                      disabled={paymentProcessing}
                    >
                      75%
                    </button>
                    <button 
                      onClick={() => setPaymentAmount(calculateRemainingAmount(selectedBill))}
                      disabled={paymentProcessing}
                    >
                      100%
                    </button>
                  </div>
                </div>
                
                <div className="payment-methods">
                  <h4>To'lov usulini tanlang</h4>
                  <div className="method-grid">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method.id}
                        className={`method-btn ${paymentMethod === method.id ? 'selected' : ''}`}
                        onClick={() => !paymentProcessing && setPaymentMethod(method.id)}
                        disabled={paymentProcessing}
                      >
                        <span className="method-icon">{method.icon}</span>
                        <span>{method.name}</span>
                        <span className="method-fee">{method.fee}%</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {paymentMethod === 'card' && (
                  <div className="card-details">
                    <h4>Karta ma'lumotlari</h4>
                    <div className="card-inputs">
                      <input type="text" placeholder="Karta raqami" disabled={paymentProcessing} />
                      <div className="card-row">
                        <input type="text" placeholder="MM/YY" disabled={paymentProcessing} />
                        <input type="text" placeholder="CVV" disabled={paymentProcessing} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="payment-modal-footer">
                <div className="payment-summary">
                  <div className="summary-item">
                    <span>To'lov summasi:</span>
                    <strong>{paymentAmount.toLocaleString()} UZS</strong>
                  </div>
                  <div className="summary-item">
                    <span>Komissiya ({PAYMENT_METHODS.find(m => m.id === paymentMethod)?.fee || 0}%):</span>
                    <strong>{(paymentAmount * (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.fee || 0) / 100).toLocaleString()} UZS</strong>
                  </div>
                  <div className="summary-item total">
                    <span>Jami to'lanadi:</span>
                    <strong>{(paymentAmount * (1 + (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.fee || 0) / 100)).toLocaleString()} UZS</strong>
                  </div>
                </div>
                
                <div className="payment-actions">
                  <button 
                    className="cancel-payment-btn"
                    onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                    disabled={paymentProcessing}
                  >
                    Bekor qilish
                  </button>
                  <button 
                    className={`confirm-payment-btn ${paymentProcessing ? 'processing' : ''}`}
                    onClick={processPayment}
                    disabled={paymentProcessing || paymentAmount <= 0 || paymentAmount > calculateRemainingAmount(selectedBill)}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="payment-spinner"></div>
                        To'lov amalga oshirilmoqda...
                      </>
                    ) : (
                      `To'lash (${(paymentAmount * (1 + (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.fee || 0) / 100)).toLocaleString()} UZS)`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedReceipt && (
          <div className="receipt-modal-overlay" onClick={() => setShowReceiptModal(false)}>
            <div className="receipt-modal" onClick={e => e.stopPropagation()}>
              <div className="receipt-modal-header">
                <h3>To'lov kvitansiyasi</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowReceiptModal(false)}
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>
              
              <div className="receipt-modal-body">
                <div className="receipt-logo">
                  <h2>SDK DENTAL</h2>
                  <p>To'lov kvitansiyasi</p>
                </div>
                
                <div className="receipt-details">
                  <div className="receipt-row">
                    <span>Kvitanciya №:</span>
                    <strong>{selectedReceipt.payment.receiptNo}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Sana:</span>
                    <strong>{new Date(selectedReceipt.payment.date).toLocaleDateString('uz-UZ')}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Vaqt:</span>
                    <strong>{new Date(selectedReceipt.payment.date).toLocaleTimeString('uz-UZ')}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Mijoz:</span>
                    <strong>{selectedReceipt.patientName}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>To'lov summasi:</span>
                    <strong className="receipt-amount">
                      {selectedReceipt.payment.amount.toLocaleString()} UZS
                    </strong>
                  </div>
                  <div className="receipt-row">
                    <span>To'lov usuli:</span>
                    <strong>{selectedReceipt.payment.methodName}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Qoldiq summa:</span>
                    <strong className="receipt-remaining">
                      {selectedReceipt.remaining.toLocaleString()} UZS
                    </strong>
                  </div>
                  <div className="receipt-row">
                    <span>Holati:</span>
                    <strong className="receipt-status success">To'langan</strong>
                  </div>
                </div>
                
                <div className="receipt-services">
                  <h4>Xizmatlar:</h4>
                  {selectedReceipt.services.map((service, index) => (
                    <div key={index} className="service-row">
                      <span>{service.name}</span>
                      <span>{service.cost.toLocaleString()} UZS</span>
                    </div>
                  ))}
                </div>
                
                <div className="receipt-footer">
                  <div className="receipt-total">
                    <span>Umumiy summa:</span>
                    <strong>{selectedReceipt.total.toLocaleString()} UZS</strong>
                  </div>
                  <div className="receipt-total">
                    <span>To'langan:</span>
                    <strong>{(selectedReceipt.paid || 0).toLocaleString()} UZS</strong>
                  </div>
                  <div className="receipt-total">
                    <span>Qoldiq:</span>
                    <strong>{selectedReceipt.remaining.toLocaleString()} UZS</strong>
                  </div>
                </div>
              </div>
              
              <div className="receipt-modal-actions">
                <button 
                  className="receipt-action-btn"
                  onClick={() => generateReceipt(selectedReceipt)}
                >
                  <FiDownload /> Yuklab olish (TXT)
                </button>
                <button 
                  className="receipt-action-btn secondary"
                  onClick={() => copyReceiptNumber(selectedReceipt.payment.receiptNo)}
                >
                  <FiCopy /> Raqamni nusxalash
                </button>
                <button 
                  className="receipt-action-btn outline"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="logout-modal-overlay">
            <div className="logout-modal">
              <div className="logout-modal-icon">
                <FiLogOut size={48} />
              </div>
              <h3>Chiqishni tasdiqlaysizmi?</h3>
              <p>Hisobingizdan chiqish arafasidasiz. Avtomatik ravishda {logoutTimer} soniyadan so'ng chiqiladi.</p>
              
              <div className="logout-reason">
                <label>Chiqish sababi (ixtiyoriy):</label>
                <select 
                  value={logoutReason} 
                  onChange={(e) => setLogoutReason(e.target.value)}
                >
                  <option value="">Tanlang...</option>
                  <option value="ish_tugadi">Ish tugadi</option>
                  <option value="tanaffus">Tanaffus</option>
                  <option value="boshqa_device">Boshqa qurilmada kirish</option>
                  <option value="xavfsizlik">Xavfsizlik sabablari</option>
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>
              
              <div className="logout-timer">
                <div className="timer-circle">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="#ef4444" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * (logoutTimer / 30))}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className="timer-text">{logoutTimer}s</span>
                </div>
              </div>
              
              <div className="logout-modal-actions">
                <button 
                  className="cancel-logout-btn"
                  onClick={handleCancelLogout}
                >
                  Bekor qilish
                </button>
                <button 
                  className="confirm-logout-btn"
                  onClick={handleLogoutClick}
                >
                  Chiqish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="notification-modal" onClick={() => setShowNotificationModal(false)}>
            <div className="notification-modal-content" onClick={e => e.stopPropagation()}>
              <div className="notification-modal-header">
                <h3>Xabarlar</h3>
                <button 
                  className="close-notification-modal"
                  onClick={() => setShowNotificationModal(false)}
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>
              
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? '' : 'unread'}`}
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className={`notification-icon ${notification.type}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <div className="notification-time">
                          {!notification.read && <span className="notification-dot"></span>}
                          {notification.time}
                        </div>
                        <div className="notification-actions">
                          <button 
                            className="notification-action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <FiCheck /> O'qildi
                          </button>
                          <button 
                            className="notification-action-btn secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <FiTrash2 /> O'chirish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">
                    <FiBell size={48} />
                    <h4>Xabarlar yo'q</h4>
                    <p>Hozircha yangi xabarlar mavjud emas</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="notification-actions-bar">
                  <button className="mark-all-read-btn" onClick={markAllAsRead}>
                    <FiCheck /> Hammasini o'qilgan qilish
                  </button>
                  <div className="notification-count">
                    {notificationBadgeCount} ta o'qilmagan
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-screen">
            <div className="loader"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;