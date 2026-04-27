// UserDashboard.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign,
  FiDownload, FiLogOut, FiPhone, FiPlus, FiSearch,
  FiHome, FiCreditCard, FiBarChart2, FiBell, FiMenu, 
  FiX, FiCheckCircle, FiAlertCircle, FiCheck, FiTrash2,
  FiMessageSquare, FiEye, FiPrinter, FiCopy, FiChevronRight,
  FiEdit2, FiMapPin, FiMail, FiGlobe, FiStar, FiTrendingUp,
  FiUsers, FiFileText, FiInfo, FiSettings, FiShield
} from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { CSVLink } from "react-csv";
import { AppContext } from "../App";
import { addNewPatient, sendTelegramMessage } from "../utils";
import "./UserDashboard.css";

const COLORS = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#7209b7', '#f72585', '#10b981', '#f59e0b'];

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Naqd pul', icon: '💰', fee: 0 },
  { id: 'card', name: 'Plastik karta', icon: '💳', fee: 1.5 },
  { id: 'click', name: 'Click', icon: '🟢', fee: 1.2 },
  { id: 'payme', name: 'Payme', icon: '🟣', fee: 1.0 },
  { id: 'uzum', name: 'Uzum Bank', icon: '🟡', fee: 0.8 },
  { id: 'transfer', name: 'Bank o\'tkazmasi', icon: '🏦', fee: 0.5 }
];

const TREATMENT_TYPES = [
  { id: 1, name: "Tish tozalash", duration: 30, price: 150000 },
  { id: 2, name: "Karyes davolash", duration: 45, price: 200000 },
  { id: 3, name: "Tish olish", duration: 30, price: 250000 },
  { id: 4, name: "Implantatsiya", duration: 60, price: 1500000 },
  { id: 5, name: "Koronka", duration: 45, price: 800000 },
  { id: 6, name: "Oqartirish", duration: 60, price: 500000 }
];

const UserDashboard = () => {
  const { currentUser, appointments, billings, setAppointments, setBillings, handleLogout } = useContext(AppContext);
  const [filter, setFilter] = useState("hamma");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Profile states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || 'user@example.com',
    phone: currentUser?.phone || '+998901234567',
    address: 'Toshkent sh., Chilonzor tumani',
    birthday: '1990-01-01',
    bloodType: 'O+',
    allergies: 'Yo\'q',
    emergencyContact: '+998901234568',
    emergencyName: 'Oilaviy shifokor',
    avatar: null
  });

  // Treatment History states
  const [treatmentHistory, setTreatmentHistory] = useState([
    {
      id: 1,
      date: '2024-10-15',
      type: 'Tish tozalash',
      doctor: 'Dr. Alimova D.',
      cost: 150000,
      status: 'completed',
      notes: 'Muntazam tozalash, tishlari sog\'lom',
      nextAppointment: '2024-11-15',
      toothNumber: '11,21,31,41',
      beforeImage: null,
      afterImage: null
    },
    {
      id: 2,
      date: '2024-09-20',
      type: 'Karyes davolash',
      doctor: 'Dr. Karimov R.',
      cost: 200000,
      status: 'completed',
      notes: 'O\'ng tish karyesi davolandi',
      nextAppointment: null,
      toothNumber: '16',
      beforeImage: null,
      afterImage: null
    },
    {
      id: 3,
      date: '2024-11-01',
      type: 'Tish olish',
      doctor: 'Dr. Alimova D.',
      cost: 250000,
      status: 'ongoing',
      notes: 'Aql tishi olindi, shish bosilishi mumkin',
      nextAppointment: '2024-11-08',
      toothNumber: '28',
      beforeImage: null,
      afterImage: null
    }
  ]);

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedCalendarAppointment, setSelectedCalendarAppointment] = useState(null);

  // Chat states
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Assalomu alaykum! Bugungi uchrashuvingiz 15:00 da", sender: "doctor", time: new Date().toISOString(), read: true },
    { id: 2, text: "Va alaykum assalom! Mayli, kelaman", sender: "user", time: new Date(Date.now() - 3600000).toISOString(), read: true },
    { id: 3, text: "Uchrashuvdan oldin tishlaringizni cho'tkalang", sender: "doctor", time: new Date(Date.now() - 1800000).toISOString(), read: false }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ appointments: [], billings: [] });

  // Reminder states
  const [reminders, setReminders] = useState([
    { id: 1, title: "Ertaga tish tozalash", date: new Date(Date.now() + 86400000).toISOString(), time: "10:00", type: "appointment", active: true },
    { id: 2, title: "To'lov muddati", date: new Date(Date.now() + 172800000).toISOString(), time: "18:00", type: "payment", active: true },
    { id: 3, title: "Dori ichish", date: new Date(Date.now() + 3600000).toISOString(), time: "20:00", type: "medicine", active: false }
  ]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', date: '', time: '', type: 'appointment' });

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
  const [selectedTreatment, setSelectedTreatment] = useState('');

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

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setSearchResults({
        appointments: userAppointments.filter(apt => 
          apt.procedure?.toLowerCase().includes(query) ||
          apt.date?.includes(query)
        ),
        billings: userBillings.filter(bill => 
          bill.services?.some(s => s.name.toLowerCase().includes(query)) ||
          bill.total?.toString().includes(query)
        )
      });
    } else {
      setSearchResults({ appointments: [], billings: [] });
    }
  }, [searchQuery, userAppointments, userBillings]);

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

  // Chart data
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

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return userAppointments.filter(apt => apt.date === dateStr);
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  const weekDays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedCalendarDate(date);
    const apts = getAppointmentsForDate(date);
    if (apts.length > 0) {
      setSelectedCalendarAppointment(apts[0]);
      setShowAppointmentDetails(true);
    }
  };

  // Profile handlers
  const handleProfileUpdate = () => {
    setEditingProfile(false);
    setSuccessMessage("Profil ma'lumotlari yangilandi!");
    setShowProfileModal(false);
  };

  // Treatment history helpers
  const getTreatmentStatusBadge = (status) => {
    switch(status) {
      case 'completed': return { text: 'Yakunlangan', color: '#10b981' };
      case 'ongoing': return { text: 'Jarayonda', color: '#f59e0b' };
      case 'cancelled': return { text: 'Bekor qilingan', color: '#ef4444' };
      default: return { text: 'Rejada', color: '#4361ee' };
    }
  };

  // Chat handlers
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      time: new Date().toISOString(),
      read: false
    };
    setMessages([...messages, msg]);
    setNewMessage('');
    
    // Auto-reply simulation
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: "Xabaringiz qabul qilindi. Tez orada javob beramiz!",
        sender: 'doctor',
        time: new Date().toISOString(),
        read: false
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  // Reminder handlers
  const addReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    const reminder = {
      id: Date.now(),
      ...newReminder,
      active: true,
      date: new Date(newReminder.date).toISOString()
    };
    setReminders([...reminders, reminder]);
    setShowReminderModal(false);
    setNewReminder({ title: '', date: '', time: '', type: 'appointment' });
    setSuccessMessage("Eslatma qo'shildi!");
  };

  const toggleReminder = (id) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

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
    
    if (!newPatient.phone.match(/^\+998[0-9]{9}$/)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      return;
    }

    addNewPatient(newPatient, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        
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
    if (!procedure.trim() && !selectedTreatment) return setError("Muolaja nomini kiriting");

    const finalProcedure = procedure || selectedTreatment;
    const selectedTreatmentData = TREATMENT_TYPES.find(t => t.name === finalProcedure);
    const cost = selectedTreatmentData?.price || 100000;
    
    const newApt = {
      id: Date.now(),
      patientId,
      date: selectedDate,
      time: selectedTime,
      procedure: finalProcedure,
      status: 'kutilmoqda',
      createdAt: new Date().toISOString()
    };
    
    const newBill = {
      id: Date.now() + 1,
      patientId,
      patientName: newPatient.name,
      date: selectedDate,
      services: [{ name: finalProcedure, cost }],
      total: cost,
      paid: 0,
      status: 'to\'lanmagan',
      paymentHistory: []
    };

    setAppointments([...appointments, newApt]);
    setBillings([...billings, newBill]);
    
    setSuccessMessage("Uchrashuv muvaffaqiyatli band qilindi!");
    setSelectedTime('');
    setProcedure('');
    setSelectedTreatment('');

    const newNotification = {
      id: Date.now() + 2,
      title: "Yangi uchrashuv band qilindi",
      message: `${selectedDate} ${selectedTime} da ${finalProcedure} muolajasi uchun uchrashuv band qilindi`,
      type: "appointment",
      time: "Hozir",
      read: false,
      date: new Date().toISOString(),
      action: { type: "view", appointmentId: newApt.id }
    };
    setNotifications([newNotification, ...notifications]);

    const msg = `✅ ${newPatient.name}, ${selectedDate} ${selectedTime} da uchrashuv band qilindi!\nMuolaja: ${finalProcedure}\nNarxi: ${cost} UZS`;
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
      
      const receiptData = {
        ...selectedBill,
        payment: newPaymentRecord,
        remaining: selectedBill.total - (selectedBill.paid || 0) - paymentAmount
      };
      
      setSelectedReceipt(receiptData);
      
      setSuccessMessage(`To'lov muvaffaqiyatli amalga oshirildi! ${paymentAmount.toLocaleString()} UZS`);
      setShowPaymentModal(false);
      
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
      
      setTimeout(() => {
        setShowReceiptModal(true);
      }, 1000);
      
    } catch (error) {
      setError("To'lov amalga oshirishda xatolik yuz berdi");
    } finally {
      setPaymentProcessing(false);
    }
  };

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

  const handleRequestNextSlot = () => {
    const next = findNextAvailableSlot();
    if (next) {
      setSuccessMessage(`Keyingi bo'sh vaqt: ${next.date} ${next.time}`);
      
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
        break;
    }
  };

  // Auto-update badge count
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

  // Logout handler
  const handleLogoutClick = () => {
    setIsLoading(true);
    
    if (logoutReason) {
      console.log(`Chiqish sababi: ${logoutReason}`);
    }
    
    setTimeout(() => {
      handleLogout();
      navigate("/login");
    }, 800);
  };

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

  const treatmentCSVData = treatmentHistory.map(t => ({
    Sana: t.date,
    Muolaja: t.type,
    Shifokor: t.doctor,
    Narxi: t.cost,
    Holat: t.status,
    Eslatma: t.notes
  }));

  if (!currentUser) return null;

  const newsItems = [
    { title: "O'zbekiston Stomatologiyasi 2025", desc: "Toshkentda stomatologiya ko'rgazmasi, 15-17 aprel", img: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg" },
    { title: "UzMedExpo 2025", desc: "17-xalqaro sog'liqni saqlash ko'rgazmasi", img: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg" },
    { title: "IDECA Toshkent 2025", desc: "Stomatologiya ta'limi tadbirlari", img: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg" },
    { title: "Stomatologiyada AI", desc: "Sun'iy intellekt yangi imkoniyatlar", img: "https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg" }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <div className="sidebar-profile" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
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
          {["dashboard", "appointments", "calendar", "treatment", "billing", "payments", "stats", "chat", "reminders"].map(tab => (
            <button 
              key={tab} 
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome />}
              {tab === "appointments" && <FiCalendar />}
              {tab === "calendar" && <FiClock />}
              {tab === "treatment" && <FiFileText />}
              {tab === "billing" && <FiCreditCard />}
              {tab === "payments" && <FiDollarSign />}
              {tab === "stats" && <FiBarChart2 />}
              {tab === "chat" && <FiMessageSquare />}
              {tab === "reminders" && <FiBell />}
              <span>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuvlar" :
                tab === "calendar" ? "Kalendar" :
                tab === "treatment" ? "Davolash tarixi" :
                tab === "billing" ? "To'lovlar" :
                tab === "payments" ? "To'lov tarixi" :
                tab === "stats" ? "Statistika" :
                tab === "chat" ? "Chat" : "Eslatmalar"
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
          <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="header-chat" 
              onClick={() => setActiveTab('chat')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
            >
              <FiMessageSquare size={20} />
            </button>
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
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
              <div className="sidebar-profile" onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
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
                {["dashboard", "appointments", "calendar", "treatment", "billing", "payments", "stats", "chat", "reminders"].map(tab => (
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
                    {tab === "calendar" && <FiClock />}
                    {tab === "treatment" && <FiFileText />}
                    {tab === "billing" && <FiCreditCard />}
                    {tab === "payments" && <FiDollarSign />}
                    {tab === "stats" && <FiBarChart2 />}
                    {tab === "chat" && <FiMessageSquare />}
                    {tab === "reminders" && <FiBell />}
                    <span>{
                      tab === "dashboard" ? "Asosiy" :
                      tab === "appointments" ? "Uchrashuvlar" :
                      tab === "calendar" ? "Kalendar" :
                      tab === "treatment" ? "Davolash tarixi" :
                      tab === "billing" ? "To'lovlar" :
                      tab === "payments" ? "To'lov tarixi" :
                      tab === "stats" ? "Statistika" :
                      tab === "chat" ? "Chat" : "Eslatmalar"
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

        {/* Search Bar */}
        <div className=" " style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input 
              type="text" 
              placeholder="Uchrashuv yoki to'lovlarni qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '30px', border: '1px solid #e0e0e0', fontSize: '14px' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <FiX size={18} />
              </button>
            )}
          </div>
          {searchQuery && (searchResults.appointments.length > 0 || searchResults.billings.length > 0) && (
            <div className="search-results" style={{ marginTop: '12px', background: 'white', borderRadius: '20px', padding: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              {searchResults.appointments.map(apt => (
                <div key={apt.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setActiveTab('appointments')}>
                  <strong>{apt.procedure}</strong> - {apt.date} {apt.time}
                </div>
              ))}
              {searchResults.billings.map(bill => (
                <div key={bill.id} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setActiveTab('billing')}>
                  <strong>{bill.services[0]?.name}</strong> - {bill.total.toLocaleString()} UZS
                </div>
              ))}
            </div>
          )}
        </div>

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

          {/* Stats Cards - Only on Dashboard */}
          {(activeTab === "dashboard") && (
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

          {/* Charts - Stats Tab */}
       {activeTab === "stats" && (
            <div className="charts-wrapper">
              <div className="chart-box">
                <h3>Oylar bo'yicha uchrashuvlar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[{ month: 'Yan', count: 2 }, { month: 'Fev', count: 3 }, { month: 'Mar', count: 1 }, { month: 'Apr', count: 4 }, { month: 'May', count: 2 }, { month: 'Iyun', count: 3 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4361ee" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-box">
                <h3>To'lovlar tarixi</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={paymentHistory.length > 0 ? paymentHistory : [{ date: 'Yan', amount: 500000 }, { date: 'Fev', amount: 750000 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeTab === "calendar" && (
            <section className="section-block">
              <div className="section-title">
                <h3>Uchrashuvlar kalendarı</h3>
                <div className="calendar-nav" style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => changeMonth(-1)} className="secondary-button">◀</button>
                  <span style={{ fontWeight: 500 }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <button onClick={() => changeMonth(1)} className="secondary-button">▶</button>
                  <button onClick={() => setCurrentMonth(new Date())} className="secondary-button">Bugun</button>
                </div>
              </div>
              
              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {weekDays.map(day => (
                  <div key={day} style={{ textAlign: 'center', fontWeight: 600, padding: '12px', color: '#666' }}>{day}</div>
                ))}
                {calendarDays.map((date, idx) => {
                  const apts = date ? getAppointmentsForDate(date) : [];
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  const isSelected = date && selectedCalendarDate?.toDateString() === date.toDateString();
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleDateClick(date)}
                      style={{
                        minHeight: '100px',
                        background: isSelected ? 'rgba(67, 97, 238, 0.1)' : isToday ? 'rgba(16, 185, 129, 0.1)' : 'white',
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: date ? 'pointer' : 'default',
                        border: isToday ? '2px solid #10b981' : '1px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                    >
                      {date && (
                        <>
                          <div style={{ fontWeight: 600, marginBottom: '8px' }}>{date.getDate()}</div>
                          {apts.map(apt => (
                            <div key={apt.id} style={{ fontSize: '10px', background: '#4361ee', color: 'white', padding: '4px 6px', borderRadius: '8px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {apt.time} {apt.procedure?.slice(0, 10)}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Appointment Details Modal */}
          {showAppointmentDetails && selectedCalendarAppointment && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '90%' }}>
                <h3>Uchrashuv tafsilotlari</h3>
                <p><strong>Sana:</strong> {selectedCalendarAppointment.date}</p>
                <p><strong>Vaqt:</strong> {selectedCalendarAppointment.time}</p>
                <p><strong>Muolaja:</strong> {selectedCalendarAppointment.procedure}</p>
                <p><strong>Holat:</strong> {selectedCalendarAppointment.status}</p>
                <button onClick={() => setShowAppointmentDetails(false)} className="primary-button" style={{ marginTop: '20px', width: '100%' }}>Yopish</button>
              </div>
            </div>
          )}

          {/* Treatment History Tab */}
          {activeTab === "treatment" && (
            <section className="section-block">
              <div className="section-title">
                <h3>Davolash tarixi</h3>
                <CSVLink data={treatmentCSVData} filename="davolash_tarixi.csv" className="download-btn" style={{ padding: '8px 16px', background: '#4361ee', color: 'white', borderRadius: '20px', textDecoration: 'none', fontSize: '13px' }}>
                  <FiDownload /> Yuklab olish
                </CSVLink>
              </div>
              
              <div className="treatment-timeline">
                {treatmentHistory.map(treatment => {
                  const statusBadge = getTreatmentStatusBadge(treatment.status);
                  return (
                    <div key={treatment.id} className="treatment-item" style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid #eee', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', marginBottom: '12px' }}>
                      <div className="treatment-date" style={{ minWidth: '100px' }}>
                        <div style={{ fontWeight: 600 }}>{treatment.date}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{treatment.doctor}</div>
                      </div>
                      <div className="treatment-info" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0 }}>{treatment.type}</h4>
                          <span style={{ background: statusBadge.color, color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px' }}>{statusBadge.text}</span>
                        </div>
                        {treatment.toothNumber && <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}><strong>Tish №:</strong> {treatment.toothNumber}</p>}
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{treatment.notes}</p>
                        <p style={{ fontSize: '13px', fontWeight: 500 }}>Narxi: {treatment.cost.toLocaleString()} UZS</p>
                        {treatment.nextAppointment && (
                          <p style={{ fontSize: '12px', color: '#f59e0b' }}>🔔 Keyingi uchrashuv: {treatment.nextAppointment}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="tooth-chart" style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
                <h4>Tish kartasi</h4>
                <div className="tooth-diagram" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginTop: '16px' }}>
                  {[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38].map(tooth => {
                    const hasTreatment = treatmentHistory.some(t => t.toothNumber?.includes(tooth.toString()));
                    return (
                      <div key={tooth} style={{ 
                        textAlign: 'center', 
                        padding: '8px', 
                        background: hasTreatment ? 'rgba(67, 97, 238, 0.2)' : 'white', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '12px',
                        fontWeight: hasTreatment ? 600 : 400,
                        color: hasTreatment ? '#4361ee' : '#666'
                      }}>
                        {tooth}
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', textAlign: 'center' }}>🔵 Moviy rang - davolangan tishlar</p>
              </div>
            </section>
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
                <div className="section-actions" style={{ display: 'flex', gap: '12px' }}>
                  <CSVLink 
                    data={billingCSVData} 
                    filename="tolovlar.csv" 
                    className="download-btn"
                    style={{ padding: '8px 16px', background: '#4361ee', color: 'white', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                    style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                            style={{ backgroundColor: getPaymentStatusColor(bill.status), color: 'white' }}
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

          {/* Payment History Tab */}
          {activeTab === "payments" && (
            <section className="section-block">
              <div className="section-title">
                <h3>To'lovlar tarixi</h3>
                <div className="payment-stats" style={{ display: 'flex', gap: '16px' }}>
                  <div className="payment-stat-card" style={{ background: 'rgba(255,255,255,0.5)', padding: '12px 20px', borderRadius: '16px' }}>
                    <span>Jami to'langan</span>
                    <h3 style={{ margin: 0 }}>{paymentStats.totalPaid.toLocaleString()} UZS</h3>
                  </div>
                  <div className="payment-stat-card" style={{ background: 'rgba(255,255,255,0.5)', padding: '12px 20px', borderRadius: '16px' }}>
                    <span>O'rtacha to'lov</span>
                    <h3 style={{ margin: 0 }}>
                      {paymentHistory.length > 0 
                        ? (paymentStats.totalPaid / paymentHistory.length).toLocaleString(undefined, {maximumFractionDigits: 0})
                        : 0
                      } UZS
                    </h3>
                  </div>
                </div>
              </div>
              <div className="list-container">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <div key={index} className="payment-history-item">
                      <div className="payment-icon" style={{ fontSize: '28px' }}>
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
                          <span className={`payment-status ${payment.status}`} style={{ background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="copy-button"
                          onClick={() => copyReceiptNumber(payment.receiptNo)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
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

          {/* Chat Section */}
          {activeTab === "chat" && (
            <section className="section-block">
              <div className="section-title">
                <h3>Doktor bilan chat</h3>
                <div className="doctor-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="doctor-avatar" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4361ee, #7209b7)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <FiUser size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>Dr. Alimova D.</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#10b981' }}>● Online</p>
                  </div>
                </div>
              </div>
              
              <div className="chat-messages" style={{ height: '400px', overflowY: 'auto', padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '20px', marginBottom: '16px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{ 
                      maxWidth: '70%', 
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, #4361ee, #3f37c9)' : 'white', 
                      color: msg.sender === 'user' ? 'white' : '#333',
                      padding: '10px 14px', 
                      borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>{msg.text}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.7 }}>{new Date(msg.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input" style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Xabar yozing..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1, padding: '14px', borderRadius: '30px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                />
                <button onClick={sendMessage} className="primary-button" style={{ padding: '12px 24px' }}>
                  <FiMessageSquare /> Yuborish
                </button>
              </div>
            </section>
          )}

          {/* Reminders Section */}
          {activeTab === "reminders" && (
            <section className="section-block">
              <div className="section-title">
                <h3>Eslatmalar</h3>
                <button onClick={() => setShowReminderModal(true)} className="primary-button" style={{ padding: '8px 20px' }}>
                  <FiPlus /> Qo'shish
                </button>
              </div>
              
              <div className="reminders-list">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="reminder-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', marginBottom: '12px' }}>
                    <div className="reminder-info">
                      <h4 style={{ margin: 0, textDecoration: reminder.active ? 'none' : 'line-through', opacity: reminder.active ? 1 : 0.5 }}>{reminder.title}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                        {new Date(reminder.date).toLocaleDateString('uz-UZ')} {reminder.time}
                      </p>
                      <span className="reminder-type" style={{ fontSize: '11px', background: reminder.type === 'appointment' ? '#4361ee20' : reminder.type === 'payment' ? '#10b98120' : '#f59e0b20', padding: '2px 8px', borderRadius: '12px', marginTop: '6px', display: 'inline-block' }}>
                        {reminder.type === 'appointment' ? '📅 Uchrashuv' : reminder.type === 'payment' ? '💰 To\'lov' : '💊 Dori'}
                      </span>
                    </div>
                    <div className="reminder-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => toggleReminder(reminder.id)} className="reminder-toggle" style={{ background: reminder.active ? '#10b981' : '#999', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', cursor: 'pointer' }}>
                        {reminder.active ? <FiCheck /> : <FiX />}
                      </button>
                      <button onClick={() => deleteReminder(reminder.id)} className="reminder-delete" style={{ background: '#ef4444', border: 'none', width: '40px', height: '40px', borderRadius: '20px', color: 'white', cursor: 'pointer' }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
                {reminders.length === 0 && (
                  <div className="empty-placeholder">
                    <FiBell size={48} />
                    <p>Eslatmalar yo'q</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Patient Portal - Only on Dashboard */}
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
                      placeholder="Manzil" 
                      value={newPatient.address} 
                      onChange={e => setNewPatient({...newPatient, address: e.target.value})} 
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
                    
                    <div className="treatment-select" style={{ marginBottom: '16px' }}>
                      <select 
                        value={selectedTreatment} 
                        onChange={(e) => setSelectedTreatment(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid #e0e0e0' }}
                      >
                        <option value="">Muolajani tanlang</option>
                        {TREATMENT_TYPES.map(t => (
                          <option key={t.id} value={t.name}>{t.name} - {t.price.toLocaleString()} UZS</option>
                        ))}
                      </select>
                    </div>
                    
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
                        placeholder="Yoki muolaja nomini yozing" 
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

          {/* News Section - Only on Dashboard */}
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
          {["dashboard", "appointments", "calendar", "treatment", "billing", "payments", "chat", "reminders"].map(tab => (
            <button 
              key={tab} 
              className={activeTab === tab ? "nav-active" : ""} 
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome size={20} />}
              {tab === "appointments" && <FiCalendar size={20} />}
              {tab === "calendar" && <FiClock size={20} />}
              {tab === "treatment" && <FiFileText size={20} />}
              {tab === "billing" && <FiCreditCard size={20} />}
              {tab === "payments" && <FiDollarSign size={20} />}
              {tab === "chat" && <FiMessageSquare size={20} />}
              {tab === "reminders" && <FiBell size={20} />}
              <span style={{ fontSize: '10px' }}>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuv" :
                tab === "calendar" ? "Kalendar" :
                tab === "treatment" ? "Tarix" :
                tab === "billing" ? "To'lov" :
                tab === "payments" ? "Tarix" :
                tab === "chat" ? "Chat" : "Eslatma"
              }</span>
            </button>
          ))}
        </nav>

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="profile-modal" style={{ background: 'white', borderRadius: '32px', width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="profile-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0 }}>Profil ma'lumotlari</h3>
                <button onClick={() => { setShowProfileModal(false); setEditingProfile(false); }} className="close-modal-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <AiOutlineClose size={20} />
                </button>
              </div>
              <div className="profile-modal-body" style={{ padding: '24px' }}>
                {editingProfile ? (
                  <>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Ism</label>
                      <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Email</label>
                      <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Telefon</label>
                      <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>Manzil</label>
                      <input type="text" value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }} />
                    </div>
                    <div className="profile-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button onClick={handleProfileUpdate} className="primary-button" style={{ flex: 1 }}>Saqlash</button>
                      <button onClick={() => setEditingProfile(false)} className="secondary-button" style={{ flex: 1 }}>Bekor qilish</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-info" style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div className="profile-avatar-large" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4361ee, #7209b7)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                        <FiUser size={40} />
                      </div>
                      <h3 style={{ margin: 0 }}>{profileData.name}</h3>
                      <p style={{ color: '#666', margin: '4px 0 0' }}>Mijoz</p>
                    </div>
                    <div className="profile-details" style={{ background: '#f8f9fa', borderRadius: '20px', padding: '16px' }}>
                      <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ color: '#666' }}>📧 Email</span>
                        <span>{profileData.email}</span>
                      </div>
                      <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ color: '#666' }}>📞 Telefon</span>
                        <span>{profileData.phone}</span>
                      </div>
                      <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ color: '#666' }}>📍 Manzil</span>
                        <span>{profileData.address}</span>
                      </div>
                      <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                        <span style={{ color: '#666' }}>🎂 Tug'ilgan kun</span>
                        <span>{profileData.birthday}</span>
                      </div>
                    </div>
                    <div className="profile-actions" style={{ marginTop: '20px' }}>
                      <button onClick={() => setEditingProfile(true)} className="primary-button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FiEdit2 /> Tahrirlash
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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
                  <div className="amount-suggestions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.25))} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: 'white' }}>25%</button>
                    <button onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.5))} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: 'white' }}>50%</button>
                    <button onClick={() => setPaymentAmount(Math.ceil(calculateRemainingAmount(selectedBill) * 0.75))} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: 'white' }}>75%</button>
                    <button onClick={() => setPaymentAmount(calculateRemainingAmount(selectedBill))} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', background: 'white' }}>100%</button>
                  </div>
                </div>
                
                <div className="payment-methods">
                  <h4>To'lov usulini tanlang</h4>
                  <div className="method-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method.id}
                        className={`method-btn ${paymentMethod === method.id ? 'selected' : ''}`}
                        onClick={() => !paymentProcessing && setPaymentMethod(method.id)}
                        disabled={paymentProcessing}
                        style={{ padding: '10px', borderRadius: '16px', border: paymentMethod === method.id ? '2px solid #4361ee' : '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                      >
                        <span className="method-icon" style={{ fontSize: '24px' }}>{method.icon}</span>
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="payment-modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid #eee' }}>
                <div className="payment-summary" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '20px', marginBottom: '20px' }}>
                  <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>To'lov summasi:</span>
                    <strong>{paymentAmount.toLocaleString()} UZS</strong>
                  </div>
                  <div className="summary-item total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '8px' }}>
                    <span>Jami to'lanadi:</span>
                    <strong>{(paymentAmount * (1 + (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.fee || 0) / 100)).toLocaleString()} UZS</strong>
                  </div>
                </div>
                
                <div className="payment-actions" style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="cancel-payment-btn"
                    onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                    disabled={paymentProcessing}
                    style={{ flex: 1, padding: '12px', borderRadius: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                  >
                    Bekor qilish
                  </button>
                  <button 
                    className={`confirm-payment-btn ${paymentProcessing ? 'processing' : ''}`}
                    onClick={processPayment}
                    disabled={paymentProcessing || paymentAmount <= 0 || paymentAmount > calculateRemainingAmount(selectedBill)}
                    style={{ flex: 1, padding: '12px', borderRadius: '30px', background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="payment-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginRight: '8px' }}></div>
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
            <div className="receipt-modal" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '32px', width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="receipt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                <h3>To'lov kvitansiyasi</h3>
                <button className="close-modal-btn" onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <AiOutlineClose size={20} />
                </button>
              </div>
              
              <div className="receipt-modal-body" style={{ padding: '24px' }}>
                <div className="receipt-logo" style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '28px', background: 'linear-gradient(135deg, #4361ee, #7209b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SDK DENTAL</h2>
                  <p>To'lov kvitansiyasi</p>
                </div>
                
                <div className="receipt-details" style={{ background: '#f8f9fa', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
                  <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #ddd' }}>
                    <span>Kvitanciya №:</span>
                    <strong>{selectedReceipt.payment.receiptNo}</strong>
                  </div>
                  <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #ddd' }}>
                    <span>Sana:</span>
                    <strong>{new Date(selectedReceipt.payment.date).toLocaleDateString('uz-UZ')}</strong>
                  </div>
                  <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #ddd' }}>
                    <span>Mijoz:</span>
                    <strong>{selectedReceipt.patientName}</strong>
                  </div>
                  <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #ddd' }}>
                    <span>To'lov summasi:</span>
                    <strong style={{ color: '#10b981' }}>{selectedReceipt.payment.amount.toLocaleString()} UZS</strong>
                  </div>
                  <div className="receipt-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Holati:</span>
                    <strong style={{ color: '#10b981' }}>To'langan</strong>
                  </div>
                </div>
                
                <div className="receipt-services" style={{ marginBottom: '20px' }}>
                  <h4>Xizmatlar:</h4>
                  {selectedReceipt.services.map((service, index) => (
                    <div key={index} className="service-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span>{service.name}</span>
                      <span>{service.cost.toLocaleString()} UZS</span>
                    </div>
                  ))}
                </div>
                
                <div className="receipt-footer" style={{ background: '#f8f9fa', borderRadius: '20px', padding: '16px' }}>
                  <div className="receipt-total" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Umumiy summa:</span>
                    <strong>{selectedReceipt.total.toLocaleString()} UZS</strong>
                  </div>
                  <div className="receipt-total" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Qoldiq:</span>
                    <strong>{selectedReceipt.remaining.toLocaleString()} UZS</strong>
                  </div>
                </div>
              </div>
              
              <div className="receipt-modal-actions" style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderTop: '1px solid #eee' }}>
                <button onClick={() => generateReceipt(selectedReceipt)} className="primary-button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FiDownload /> Yuklab olish
                </button>
                <button onClick={() => copyReceiptNumber(selectedReceipt.payment.receiptNo)} className="secondary-button" style={{ flex: 1, padding: '12px', borderRadius: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                  <FiCopy /> Nusxalash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '32px', width: '90%', maxWidth: '400px', padding: '24px' }}>
              <h3>Yangi eslatma</h3>
              <input 
                type="text" 
                placeholder="Eslatma nomi" 
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '12px' }}
              />
              <input 
                type="date" 
                value={newReminder.date}
                onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '12px' }}
              />
              <input 
                type="time" 
                value={newReminder.time}
                onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '12px' }}
              />
              <select 
                value={newReminder.type}
                onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px' }}
              >
                <option value="appointment">📅 Uchrashuv</option>
                <option value="payment">💰 To'lov</option>
                <option value="medicine">💊 Dori</option>
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={addReminder} className="primary-button" style={{ flex: 1 }}>Qo'shish</button>
                <button onClick={() => setShowReminderModal(false)} className="secondary-button" style={{ flex: 1, background: 'white', border: '1px solid #ddd', borderRadius: '30px', padding: '12px', cursor: 'pointer' }}>Bekor qilish</button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="logout-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="logout-modal" style={{ background: 'white', borderRadius: '32px', width: '90%', maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
              <div className="logout-modal-icon" style={{ color: '#ef4444', marginBottom: '16px' }}>
                <FiLogOut size={48} />
              </div>
              <h3>Chiqishni tasdiqlaysizmi?</h3>
              <p>Hisobingizdan chiqish arafasidasiz. Avtomatik ravishda {logoutTimer} soniyadan so'ng chiqiladi.</p>
              
              <div className="logout-reason" style={{ margin: '20px 0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>Chiqish sababi (ixtiyoriy):</label>
                <select 
                  value={logoutReason} 
                  onChange={(e) => setLogoutReason(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
                >
                  <option value="">Tanlang...</option>
                  <option value="ish_tugadi">Ish tugadi</option>
                  <option value="tanaffus">Tanaffus</option>
                  <option value="boshqa_device">Boshqa qurilmada kirish</option>
                  <option value="xavfsizlik">Xavfsizlik sabablari</option>
                </select>
              </div>
              
              <div className="logout-timer" style={{ margin: '20px 0' }}>
                <div className="timer-circle" style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="#ef4444" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * (logoutTimer / 30))}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className="timer-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', fontWeight: 'bold' }}>{logoutTimer}s</span>
                </div>
              </div>
              
              <div className="logout-modal-actions" style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-logout-btn" onClick={handleCancelLogout} style={{ flex: 1, padding: '12px', borderRadius: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>Bekor qilish</button>
                <button className="confirm-logout-btn" onClick={handleLogoutClick} style={{ flex: 1, padding: '12px', borderRadius: '30px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>Chiqish</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="notification-modal" onClick={() => setShowNotificationModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="notification-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '32px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div className="notification-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
                <h3>Xabarlar</h3>
                <button className="close-notification-modal" onClick={() => setShowNotificationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <AiOutlineClose size={20} />
                </button>
              </div>
              
              <div className="notification-list" style={{ flex: 1, overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? '' : 'unread'}`}
                      onClick={() => handleNotificationAction(notification)}
                      style={{ display: 'flex', gap: '14px', padding: '16px', borderBottom: '1px solid #eee' }}
                    >
                      <div className={`notification-icon ${notification.type}`} style={{ width: '44px', height: '44px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: notification.type === 'appointment' ? '#4361ee20' : '#10b98120', flexShrink: 0 }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content" style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{notification.title}</h4>
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>{notification.message}</p>
                        <div className="notification-time" style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          {!notification.read && <span className="notification-dot" style={{ display: 'inline-block', width: '6px', height: '6px', background: '#4361ee', borderRadius: '3px', marginRight: '6px' }}></span>}
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty" style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
                    <FiBell size={48} />
                    <h4>Xabarlar yo'q</h4>
                    <p>Hozircha yangi xabarlar mavjud emas</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="notification-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #eee' }}>
                  <button className="mark-all-read-btn" onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCheck /> Hammasini o'qilgan qilish
                  </button>
                  <div className="notification-count" style={{ fontSize: '13px', color: '#666' }}>
                    {notificationBadgeCount} ta o'qilmagan
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-screen" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div className="loader" style={{ width: '48px', height: '48px', border: '3px solid #e0e0e0', borderTopColor: '#4361ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;