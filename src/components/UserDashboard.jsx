import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign,
  FiDownload, FiLogOut, FiPhone, FiPlus, FiSearch,
  FiHome, FiCreditCard, FiBarChart2, FiBell, FiMenu, 
  FiX, FiCheckCircle, FiAlertCircle, FiCheck, FiTrash2,
  FiMessageSquare
} from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { CSVLink } from "react-csv";
import { AppContext } from "../App";
import { addNewPatient, sendTelegramMessage } from "../utils";
import "./UserDashboard.css";

const COLORS = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#7209b7', '#f72585'];

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
  const upcomingCount = userAppointments.filter(apt => new Date(apt.date) > new Date()).length;
  const lastBilling = userBillings[userBillings.length - 1];

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
    Xizmatlar: bill.services.map(s => s.name).join(", "),
    Holat: bill.status
  }));

  // Logout handler
  const handleLogoutClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogout();
      navigate("/login");
    }, 800);
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
      status: 'to\'lanmagan'
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

  // Pay bill
  const handlePayBill = (billId) => {
    const updatedBillings = billings.map(b => 
      b.id === billId ? { ...b, paid: b.total, status: 'to\'langan' } : b
    );
    setBillings(updatedBillings);
    
    const bill = billings.find(b => b.id === billId);
    setSuccessMessage("To'lov muvaffaqiyatli amalga oshirildi!");
    
    // Add notification
    const newNotification = {
      id: Date.now(),
      title: "To'lov muvaffaqiyatli amalga oshirildi",
      message: `${bill.total.toLocaleString()} UZS miqdoridagi to'lovingiz tasdiqlandi`,
      type: "billing",
      time: "Hozir",
      read: false,
      date: new Date().toISOString(),
      action: { type: "view", billId }
    };
    setNotifications([newNotification, ...notifications]);
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
        // Settings page ga o'tish
        setSuccessMessage("Sozlamalar bo'limi tez orada qo'shiladi");
        setShowNotifications(false);
        setShowNotificationModal(false);
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
          </div>
        </div>
        <nav className="sidebar-nav">
          {["dashboard", "appointments", "billing", "stats"].map(tab => (
            <button 
              key={tab} 
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome />}
              {tab === "appointments" && <FiCalendar />}
              {tab === "billing" && <FiCreditCard />}
              {tab === "stats" && <FiBarChart2 />}
              <span>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuvlar" :
                tab === "billing" ? "To'lovlar" : "Statistika"
              }</span>
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={handleLogoutClick}>
          <FiLogOut /> Chiqish
        </button>
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
                </div>
              </div>
              <nav className="sidebar-nav">
                {["dashboard", "appointments", "billing", "stats"].map(tab => (
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
                    <span>{
                      tab === "dashboard" ? "Asosiy" :
                      tab === "appointments" ? "Uchrashuvlar" :
                      tab === "billing" ? "To'lovlar" : "Statistika"
                    }</span>
                  </button>
                ))}
              </nav>
              <button className="logout-button" onClick={handleLogoutClick}>
                <FiLogOut /> Chiqish
              </button>
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
                  <h3>{lastBilling ? `${lastBilling.total.toLocaleString()} UZS` : "0 UZS"}</h3>
                  <p>Oxirgi to'lov</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {activeTab === "stats" && (
            <div className="charts-wrapper">
              <div className="chart-box">
                <h3>Oylar bo'yicha</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={treatmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4361ee" radius={8} />
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
                    <Tooltip />
                  </PieChart>
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
                      <div>
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
                    </div>
                  ))
                ) : (
                  <div className="empty-placeholder">Uchrashuvlar yo'q</div>
                )}
              </div>
            </section>
          )}

          {/* Billing Section */}
          {(activeTab === "dashboard" || activeTab === "billing") && (
            <section className="section-block">
              <div className="section-title">
                <h3>To'lovlar</h3>
                <CSVLink 
                  data={billingCSVData} 
                  filename="tolovlar.csv" 
                  className="download-btn"
                >
                  <FiDownload /> Yuklab olish
                </CSVLink>
              </div>
              <div className="list-container">
                {userBillings.length > 0 ? (
                  userBillings.map(bill => (
                    <div key={bill.id} className="billing-item">
                      <div>
                        <div className="billing-date">
                          {new Date(bill.date).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="billing-amount">
                          {bill.total.toLocaleString()} UZS
                        </div>
                        <div className="billing-services">
                          {bill.services.map(s => s.name).join(", ")}
                        </div>
                      </div>
                      <div className="billing-actions">
                        <span className={`status-badge ${bill.status}`}>
                          {bill.status}
                        </span>
                        {bill.status === "to'lanmagan" && (
                          <button 
                            className="pay-button" 
                            onClick={() => handlePayBill(bill.id)}
                          >
                            To'lash
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-placeholder">To'lovlar yo'q</div>
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
          {["dashboard", "appointments", "billing", "stats"].map(tab => (
            <button 
              key={tab} 
              className={activeTab === tab ? "nav-active" : ""} 
              onClick={() => setActiveTab(tab)}
            >
              {tab === "dashboard" && <FiHome size={22} />}
              {tab === "appointments" && <FiCalendar size={22} />}
              {tab === "billing" && <FiCreditCard size={22} />}
              {tab === "stats" && <FiBarChart2 size={22} />}
              <span>{
                tab === "dashboard" ? "Asosiy" :
                tab === "appointments" ? "Uchrashuv" :
                tab === "billing" ? "To'lov" : "Stat"
              }</span>
            </button>
          ))}
        </nav>

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