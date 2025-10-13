import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign, 
  FiDownload, FiLogOut, FiPhone, FiPlus, FiSearch,
  FiHome, FiCreditCard, FiBarChart2, FiBell, FiMenu, FiX
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { CSVLink } from "react-csv";
import { AppContext } from "../App";
import { addNewPatient, sendTelegramMessage } from "../utils";
import "./UserDashboard.css";

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#FF9F43', '#6AB04C', '#1A535C'];

const UserDashboard = () => {
  const { currentUser, appointments, billings, setAppointments, setBillings, handleLogout } = useContext(AppContext);
  const [filter, setFilter] = useState("hamma");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Patient Portal States
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    gender: '',
    address: '',
    dob: '',
    note: '',
    telegram: '',
    prescriptions: []
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegistration, setShowRegistration] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [procedure, setProcedure] = useState('');

  // Foydalanuvchi yo'q bo'lsa, login sahifasiga yo'naltirish
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Foydalanuvchi uchrashuvlari
  const userAppointments = useMemo(() =>
    appointments.filter(apt => apt.patientId === currentUser?.id),
    [appointments, currentUser]
  );

  const userBillings = useMemo(() =>
    billings.filter(bill => bill.patientId === currentUser?.id),
    [billings, currentUser]
  );

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      if (filter === "o'tgan") return aptDate < now;
      if (filter === "kelgusi") return aptDate >= now;
      return true;
    });
  }, [userAppointments, filter]);

  // Statistikalar
  const totalAppointments = userAppointments.length;
  const totalCost = userBillings.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const upcomingCount = userAppointments.filter(apt => new Date(apt.date) > new Date()).length;
  const lastBilling = userBillings[userBillings.length - 1];

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

  // CSV eksport ma'lumotlari
  const appointmentCSVData = filteredAppointments.map(apt => ({
    Sana: new Date(apt.date).toLocaleDateString('uz-UZ'),
    Muolaja: apt.procedure
  }));

  const billingCSVData = userBillings.map(bill => ({
    Sana: new Date(bill.date).toLocaleDateString('uz-UZ'),
    Jami: bill.total,
    Xizmatlar: bill.services.map(s => s.name).join(", "),
    Holat: bill.status || "Noma'lum"
  }));

  // Chiqish
  const handleLogoutClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogout();
      navigate("/login");
    }, 1000);
  };

  // Yangiliklar
  const newsItems = [
    {
      title: "O'zbekiston Stomatologiyasi 2025",
      description: "Toshkentda stomatologiya ko'rgazmasi, 15-17 aprel, 2025",
      image: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg"
    },
    {
      title: "UzMedExpo 2025",
      description: "Toshkentda 17-xalqaro sog'liqni saqlash ko'rgazmasi, 4-6 noyabr",
      image: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg"
    },
    {
      title: "IDECA Toshkent 2025",
      description: "Stomatologiya ta'limi tadbirlari, 8 mamlakatdan 26 ta ma'ruzachi",
      image: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg"
    },
    {
      title: "Stomatologiyada AI",
      description: "Sun'iy intellekt diagnostika va ta'limda o'zgarishlar keltirmoqda",
      image: "https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg"
    },
    {
      title: "2025 yilda stomatologiyadagi 10 ta trend",
      description: "Minimal invaziv vinirlar, 3D bosib chiqarish va boshqalar",
      image: "https://images.pexels.com/photos/6628600/pexels-photo-6628600.jpeg"
    }
  ];

  // Vaqt slotlarini generatsiya qilish (9:00 dan 18:00 gacha, 30 daqiqa intervallar)
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

  // Tanlangan sana uchun bo'sh slotlarni olish
  const getSlotsForDate = (date) => {
    const timeSlots = generateTimeSlots();
    const booked = appointments
      .filter((app) => app.date === date && app.status !== 'bekor qilindi')
      .map((app) => app.time);

    return timeSlots.map((slot) => ({
      time: slot,
      isBooked: booked.includes(slot),
    }));
  };

  const slots = getSlotsForDate(selectedDate);

  // Keyingi bo'sh slotni topish
  const findNextAvailableSlot = () => {
    const today = new Date();
    let currentDate = new Date(selectedDate);
    let foundSlot = null;

    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const availableSlots = getSlotsForDate(dateString).filter(slot => !slot.isBooked);
      if (availableSlots.length > 0) {
        foundSlot = { date: dateString, time: availableSlots[0].time };
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return foundSlot;
  };

  // Bemor ro'yxatdan o'tishi
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    addNewPatient(newPatient, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage('Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Endi uchrashuv band qilishingiz mumkin.');
        if (newPatient.telegram) {
          sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, siz muvaffaqiyatli ro'yxatdan o'tdingiz.`);
        }
      } else {
        setError(message);
      }
    });
  };

  // Uchrashuv band qilish
  const handleBookAppointment = (e) => {
    e.preventDefault();

    // 🔄 Xabarlarni tozalash
    setError('');
    setSuccessMessage('');

    // ✅ Validatsiya
    if (!patientId) {
      setError('Iltimos, avval ro\'yxatdan o\'ting.');
      return;
    }

    if (!selectedTime) {
      setError('Iltimos, vaqtni tanlang.');
      return;
    }

    if (!procedure.trim()) {
      setError('Iltimos, muolaja nomini kiriting.');
      return;
    }

    // 🆕 Uchrashuv obyektini yaratish
    const newAppointment = {
      id: Date.now(),
      patientId,
      date: selectedDate,
      time: selectedTime,
      procedure,
      status: 'kutilmoqda',
      notes: '',
      prescription: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 📋 Uchrashuvni holatga saqlash
    setAppointments([...appointments, newAppointment]);
    
    // 🆕 To'lov hisobini yaratish
    const appointmentCost = 100000;
    const newBilling = {
      id: Date.now() + 1,
      patientId,
      patientName: newPatient.name,
      date: selectedDate,
      services: [
        { name: procedure, cost: appointmentCost }
      ],
      total: appointmentCost,
      paid: 0,
      status: 'to\'lanmagan',
      paymentMethod: '',
      notes: 'Yangi uchrashuv uchun hisob'
    };
    setBillings([...billings, newBilling]);

    setSuccessMessage('✅ Uchrashuv muvaffaqiyatli band qilindi!');

    // 📲 Telegram xabari — Bemor uchun
    const patientMessage = `
Hurmatli ${newPatient.name},

✅ Sizning uchrashuvingiz ${selectedDate} kuni, soat ${selectedTime} da rejalashtirildi.
🔹 Muolaja: ${procedure}
💰 Hisob: ${appointmentCost} UZS (to\'lanmagan)

📍 SDK DENTAL klinikasi
📞 Qo'shimcha ma'lumot uchun bog'laning: +998 ***

🦷 Sog'lig'ingiz biz uchun muhim!
    `.trim();

    if (newPatient.telegram) {
      sendTelegramMessage(newPatient.telegram, patientMessage);
    }

    // 🛎️ Telegram xabari — Admin uchun
    const adminMessage = `
📢 Yangi uchrashuv band qilindi:

👤 Bemor: ${newPatient.name}
📅 Sana: ${selectedDate}
🕒 Vaqt: ${selectedTime}
🔹 Muolaja: ${procedure}
💰 Hisob: ${appointmentCost} UZS (to\'lanmagan)

🦷 SDK DENTAL tizimi
    `.trim();

    sendTelegramMessage('5838205785', adminMessage);

    // 🧹 Formani tozalash
    setTimeout(() => {
      setSuccessMessage('');
      setSelectedTime('');
      setProcedure('');
    }, 3000);
  };

  // To'lov qilish funksiyasi
  const handlePayBill = (billId) => {
    const bill = userBillings.find(b => b.id === billId);
    if (!bill || bill.status !== 'to\'lanmagan') {
      setError('To\'lov allaqachon amalga oshirilgan yoki topilmadi.');
      return;
    }

    // To'lovni yangilash
    setBillings(billings.map(b => 
      b.id === billId 
        ? { ...b, paid: b.total, status: 'to\'langan', paymentMethod: 'naqd', updatedAt: new Date().toISOString() } 
        : b
    ));

    setSuccessMessage('✅ To\'lov muvaffaqiyatli amalga oshirildi!');

    // Telegram xabari — Bemor uchun
    const patientMessage = `
Hurmatli ${currentUser.name},

✅ To'lov amalga oshirildi: ${bill.total} UZS
📅 Sana: ${bill.date}
🔹 Xizmatlar: ${bill.services.map(s => s.name).join(', ')}

🦷 SDK DENTAL tizimi
    `.trim();

    if (newPatient.telegram) {
      sendTelegramMessage(newPatient.telegram, patientMessage);
    }

    // Telegram xabari — Admin uchun
    const adminMessage = `
📢 To'lov qilindi:

👤 Bemor: ${currentUser.name}
💰 Miqdor: ${bill.total} UZS
📅 Sana: ${bill.date}
🔹 Xizmatlar: ${bill.services.map(s => s.name).join(', ')}

🦷 SDK DENTAL tizimi
    `.trim();

    sendTelegramMessage('5838205785', adminMessage);

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Keyingi bo'sh slotni so'rish
  const handleRequestNextSlot = () => {
    setError('');
    setSuccessMessage('');

    if (!patientId) {
      setError('Iltimos, avval ro\'yxatdan o\'ting.');
      return;
    }

    const nextSlot = findNextAvailableSlot();
    if (nextSlot) {
      const message = `Keyingi bo'sh vaqt: ${nextSlot.date} kuni soat ${nextSlot.time}`;
      setSuccessMessage(message);
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, ${message}`);
      }
      sendTelegramMessage('5838205785', `Bemor ${newPatient.name} keyingi bo'sh vaqtni so'radi: ${nextSlot.date} ${nextSlot.time}`);
    } else {
      setError('Keyingi 30 kun ichida bo\'sh vaqt topilmadi.');
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, hozircha bo'sh vaqt yo'q. Keyinroq urinib ko'ring.`);
      }
    }
  };

  // Xabarlar vaqtinchalik ko'rsatiladi
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (!currentUser) return null;

  // Desktop Sidebar Navigation
  const DesktopSidebar = () => (
    <div className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="avatar">
          <FiUser />
        </div>
        <div className="user-details">
          <h3>{currentUser.name}</h3>
          <p>SDK DENTAL</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <FiHome />
          <span>Asosiy</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          <FiCalendar />
          <span>Uchrashuvlar</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "billing" ? "active" : ""}`}
          onClick={() => setActiveTab("billing")}
        >
          <FiCreditCard />
          <span>To'lovlar</span>
        </button>
        <button 
          className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <FiBarChart2 />
          <span>Statistika</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogoutClick} disabled={isLoading}>
          <FiLogOut />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  // Mobile Navigation
  const MobileNav = () => (
    <div className="mobile-nav">
      <button 
        className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
        onClick={() => setActiveTab("dashboard")}
      >
        <FiHome />
        <span>Asosiy</span>
      </button>
      <button 
        className={`nav-item ${activeTab === "appointments" ? "active" : ""}`}
        onClick={() => setActiveTab("appointments")}
      >
        <FiCalendar />
        <span>Uchrashuvlar</span>
      </button>
      <button 
        className={`nav-item ${activeTab === "billing" ? "active" : ""}`}
        onClick={() => setActiveTab("billing")}
      >
        <FiCreditCard />
        <span>To'lovlar</span>
      </button>
      <button 
        className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
        onClick={() => setActiveTab("stats")}
      >
        <FiBarChart2 />
        <span>Statistika</span>
      </button>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
            <div className="page-title">
              <h1>
                {activeTab === "dashboard" && "Asosiy"}
                {activeTab === "appointments" && "Uchrashuvlar"}
                {activeTab === "billing" && "To'lovlar"}
                {activeTab === "stats" && "Statistika"}
              </h1>
              <p>SDK DENTAL klinikasi</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <FiBell />
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              <div className="avatar">
                <FiUser />
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">Mijoz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay active">
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                <div className="avatar">
                  <FiUser />
                </div>
                <div className="user-details">
                  <h3>{currentUser.name}</h3>
                  <p>SDK DENTAL</p>
                </div>
                <button 
                  className="close-menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiX />
                </button>
              </div>
              
              <nav className="mobile-nav-menu">
                <button 
                  className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("dashboard");
                    setMobileMenuOpen(false);
                  }}
                >
                  <FiHome />
                  <span>Asosiy</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === "appointments" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("appointments");
                    setMobileMenuOpen(false);
                  }}
                >
                  <FiCalendar />
                  <span>Uchrashuvlar</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === "billing" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("billing");
                    setMobileMenuOpen(false);
                  }}
                >
                  <FiCreditCard />
                  <span>To'lovlar</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("stats");
                    setMobileMenuOpen(false);
                  }}
                >
                  <FiBarChart2 />
                  <span>Statistika</span>
                </button>
              </nav>
              
              <div className="mobile-menu-footer">
                <button className="logout-btn" onClick={handleLogoutClick} disabled={isLoading}>
                  <FiLogOut />
                  <span>Chiqish</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Statistikalar */}
          {(activeTab === "dashboard" || activeTab === "stats") && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon primary">
                  <FiCalendar />
                </div>
                <div className="stat-info">
                  <h3>{totalAppointments}</h3>
                  <p>Jami Uchrashuvlar</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon success">
                  <FiDollarSign />
                </div>
                <div className="stat-info">
                  <h3>{totalCost.toLocaleString()} UZS</h3>
                  <p>Jami Xarajatlar</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <h3>{upcomingCount}</h3>
                  <p>Kelgusi Uchrashuvlar</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon danger">
                  <FiActivity />
                </div>
                <div className="stat-info">
                  <h3>{lastBilling ? `${lastBilling.total.toLocaleString()} UZS` : "0 UZS"}</h3>
                  <p>Oxirgi To'lov</p>
                </div>
              </div>
            </div>
          )}

          {/* Diagrammalar */}
          {activeTab === "stats" && (
            <div className="charts-section">
              <div className="chart-card">
                <h3>Oylar Bo'yicha Uchrashuvlar</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={treatmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Bar dataKey="count" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>Muolaja Turlari</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={treatmentTypes}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {treatmentTypes.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Uchrashuvlar */}
          {(activeTab === "dashboard" || activeTab === "appointments") && (
            <div className="section">
              <div className="section-header">
                <h3>Uchrashuvlar</h3>
                <div className="filter-tabs">
                  {["hamma", "o'tgan", "kelgusi"].map((type) => (
                    <button
                      key={type}
                      className={`filter-tab ${filter === type ? "active" : ""}`}
                      onClick={() => setFilter(type)}
                    >
                      {type === "hamma" ? "Hammasi" : type === "o'tgan" ? "O'tgan" : "Kelgusi"}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="appointments-list">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map(apt => (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-date">
                        <span className="date">{new Date(apt.date).toLocaleDateString('uz-UZ')}</span>
                        <span className="time">{apt.time}</span>
                      </div>
                      <div className="appointment-details">
                        <h4>{apt.procedure}</h4>
                        <p className={`status ${apt.status}`}>{apt.status}</p>
                      </div>
                      <div className="appointment-actions">
                        <CSVLink
                          data={appointmentCSVData}
                          filename={`${filter}_uchrashuvlar.csv`}
                          className="btn-icon"
                        >
                          <FiDownload />
                        </CSVLink>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FiCalendar size={48} />
                    <p>Uchrashuvlar topilmadi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* To'lovlar */}
          {(activeTab === "dashboard" || activeTab === "billing") && (
            <div className="section">
              <div className="section-header">
                <h3>To'lovlar Tarixi</h3>
                <CSVLink
                  data={billingCSVData}
                  filename="tolovlar_tarixi.csv"
                  className="btn btn-outline"
                >
                  <FiDownload /> Yuklab Olish
                </CSVLink>
              </div>
              
              <div className="billing-list">
                {userBillings.length > 0 ? (
                  userBillings.map(bill => (
                    <div key={bill.id} className="billing-card">
                      <div className="billing-info">
                        <div className="billing-date">
                          {new Date(bill.date).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="billing-details">
                          <h4>{bill.total.toLocaleString()} UZS</h4>
                          <p>{bill.services.map(s => s.name).join(", ")}</p>
                        </div>
                        <div className={`billing-status ${bill.status}`}>
                          {bill.status}
                        </div>
                      </div>
                      {bill.status === 'to\'lanmagan' && (
                        <button 
                          className="btn btn-primary pay-btn"
                          onClick={() => handlePayBill(bill.id)}
                        >
                          To'lov qilish
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FiCreditCard size={48} />
                    <p>To'lov yozuvlari topilmadi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mijoz Portali */}
          {activeTab === "dashboard" && (
            <div className="section">
              <div className="section-header">
                <h3>Mijoz Portali</h3>
              </div>
              
              {successMessage && (
                <div className="alert alert-success">{successMessage}</div>
              )}
              {error && (
                <div className="alert alert-error">{error}</div>
              )}
              
              <div className="portal-card">
                {showRegistration ? (
                  <div className="registration-form">
                    <h4>Ro'yxatdan O'tish</h4>
                    <form onSubmit={handleRegister}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            <FiUser /> Ism *
                          </label>
                          <input
                            type="text"
                            value={newPatient.name}
                            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                            required
                            placeholder="Ismingizni kiriting"
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            <FiPhone /> Telefon *
                          </label>
                          <input
                            type="tel"
                            value={newPatient.phone}
                            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                            placeholder="+998901234567"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Telegram Chat ID (majburiy emas)</label>
                        <input
                          type="text"
                          value={newPatient.telegram}
                          onChange={(e) => setNewPatient({ ...newPatient, telegram: e.target.value })}
                          placeholder="Telegram Chat ID (masalan: 5838205785)"
                        />
                        <p className="form-hint">Botga /start buyrug'ini yuboring va Chat ID ni kiriting.</p>
                      </div>
                      
                      <button type="submit" className="btn btn-primary full-width">
                        <FiPlus /> Ro'yxatdan O'tish
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="booking-form">
                    <h4>Uchrashuv Band Qilish</h4>
                    
                    <div className="form-group">
                      <label><FiCalendar /> Sana</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <h5>Bo'sh Vaqtlar</h5>
                      <div className="time-slots-grid">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            className={`time-slot ${slot.isBooked ? 'booked' : selectedTime === slot.time ? 'selected' : ''}`}
                            onClick={() => !slot.isBooked && setSelectedTime(slot.time)}
                            disabled={slot.isBooked}
                          >
                            {slot.time}
                            {slot.isBooked && <span className="slot-badge">Band</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <form onSubmit={handleBookAppointment}>
                      <div className="form-group">
                        <label>Tanlangan Vaqt</label>
                        <input
                          type="text"
                          value={selectedTime}
                          readOnly
                          placeholder="Vaqtni yuqoridan tanlang"
                          className="selected-time"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Muolaja *</label>
                        <input
                          type="text"
                          value={procedure}
                          onChange={(e) => setProcedure(e.target.value)}
                          placeholder="Masalan: Tish tekshiruvi"
                          required
                        />
                      </div>
                      
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          <FiPlus /> Uchrashuv Band Qilish
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleRequestNextSlot}
                        >
                          <FiSearch /> Keyingi Bo'sh Vaqt
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Yangiliklar */}
          {activeTab === "dashboard" && (
            <div className="section">
              <h3>So'nggi Yangiliklar</h3>
              <div className="news-grid">
                {newsItems.map((news, i) => (
                  <div key={i} className="news-card">
                    <div className="news-image">
                      <img src={news.image} alt={news.title} loading="lazy" />
                    </div>
                    <div className="news-content">
                      <h4>{news.title}</h4>
                      <p>{news.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>

      {/* Yuklanish oynasi */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Yuklanmoqda...</p>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;