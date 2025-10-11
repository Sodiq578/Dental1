import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign, FiDownload, FiLogOut, FiPhone, FiPlus, FiSearch
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

  // Foydalanuvchi yo‘q bo‘lsa, login sahifasiga yo‘naltirish
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
      if (filter === "o‘tgan") return aptDate < now;
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
      const type = apt.procedure || "Noma‘lum";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  // CSV eksport ma‘lumotlari
  const appointmentCSVData = filteredAppointments.map(apt => ({
    Sana: new Date(apt.date).toLocaleDateString('uz-UZ'),
    Muolaja: apt.procedure
  }));

  const billingCSVData = userBillings.map(bill => ({
    Sana: new Date(bill.date).toLocaleDateString('uz-UZ'),
    Jami: bill.total,
    Xizmatlar: bill.services.map(s => s.name).join(", "),
    Holat: bill.status || "Noma‘lum"
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
      title: "O‘zbekiston Stomatologiyasi 2025",
      description: "Toshkentda stomatologiya ko‘rgazmasi, 15-17 aprel, 2025",
      image: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg"
    },
    {
      title: "UzMedExpo 2025",
      description: "Toshkentda 17-xalqaro sog‘liqni saqlash ko‘rgazmasi, 4-6 noyabr",
      image: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg"
    },
    {
      title: "IDECA Toshkent 2025",
      description: "Stomatologiya ta‘limi tadbirlari, 8 mamlakatdan 26 ta ma‘ruzachi",
      image: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg"
    },
    {
      title: "Stomatologiyada AI",
      description: "Sun‘iy intellekt diagnostika va ta‘limda o‘zgarishlar keltirmoqda",
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

  // Tanlangan sana uchun bo‘sh slotlarni olish
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

  // Keyingi bo‘sh slotni topish
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

  // Bemor ro‘yxatdan o‘tishi
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    addNewPatient(newPatient, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage('Muvaffaqiyatli ro‘yxatdan o‘tdingiz! Endi uchrashuv band qilishingiz mumkin.');
        if (newPatient.telegram) {
          sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, siz muvaffaqiyatli ro‘yxatdan o‘tdingiz.`);
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
    setError('Iltimos, avval ro‘yxatdan o‘ting.');
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
  
  // 🆕 To'lov hisobini yaratish (uchrashuv band qilinganda avtomatik to'lanmagan hisob yaratiladi, narxni taxminan 100000 UZS deb qo'yamiz)
  const appointmentCost = 100000; // Muolaja uchun standart narx (kerak bo'lsa o'zgartirish mumkin)
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
    status: 'to‘lanmagan',
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
💰 Hisob: ${appointmentCost} UZS (to‘lanmagan)

📍 SDK DENTAL klinikasi
📞 Qo‘shimcha ma’lumot uchun bog‘laning: +998 ***

🦷 Sog‘lig’ingiz biz uchun muhim!
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
💰 Hisob: ${appointmentCost} UZS (to‘lanmagan)

🦷 SDK DENTAL tizimi
  `.trim();

  sendTelegramMessage('5838205785', adminMessage); // Admin chat ID

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
    if (!bill || bill.status !== 'to‘lanmagan') {
      setError('To‘lov allaqachon amalga oshirilgan yoki topilmadi.');
      return;
    }

    // To'lovni yangilash
    setBillings(billings.map(b => 
      b.id === billId 
        ? { ...b, paid: b.total, status: 'to‘langan', paymentMethod: 'naqd', updatedAt: new Date().toISOString() } 
        : b
    ));

    setSuccessMessage('✅ To‘lov muvaffaqiyatli amalga oshirildi!');

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

  // Keyingi bo‘sh slotni so‘rash
  const handleRequestNextSlot = () => {
    setError('');
    setSuccessMessage('');

    if (!patientId) {
      setError('Iltimos, avval ro‘yxatdan o‘ting.');
      return;
    }

    const nextSlot = findNextAvailableSlot();
    if (nextSlot) {
      const message = `Keyingi bo‘sh vaqt: ${nextSlot.date} kuni soat ${nextSlot.time}`;
      setSuccessMessage(message);
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, ${message}`);
      }
      sendTelegramMessage('5838205785', `Bemor ${newPatient.name} keyingi bo‘sh vaqtni so‘radi: ${nextSlot.date} ${nextSlot.time}`);
    } else {
      setError('Keyingi 30 kun ichida bo‘sh vaqt topilmadi.');
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, hozircha bo‘sh vaqt yo‘q. Keyinroq urinib ko‘ring.`);
      }
    }
  };

  // Xabarlar vaqtinchalik ko‘rsatiladi
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

  return (
    <div className="dashboard-container">
      {/* Sarlavha */}
      <div className="dashboard-header">
        <FiUser size={48} className="header-icon" />
        <div className="header-info">
          <h2>{currentUser.name}ning Boshqaruv Paneli</h2>
          <p>Email: {currentUser.email}</p>
        </div>
        <button className="btn btn-danger logout-btn" onClick={handleLogoutClick} disabled={isLoading}>
          <FiLogOut /> <span>Chiqish</span>
        </button>
      </div>

      {/* Statistikalar */}
      <div className="stats-container">
        <div className="stat-item">
          <FiCalendar size={32} className="stat-icon primary" />
          <h3>Jami Uchrashuvlar</h3>
          <p>{totalAppointments}</p>
        </div>
        <div className="stat-item">
          <FiActivity size={32} className="stat-icon success" />
          <h3>Jami Xarajatlar</h3>
          <p>{totalCost.toLocaleString()} UZS</p>
        </div>
        <div className="stat-item">
          <FiClock size={32} className="stat-icon warning" />
          <h3>Kelgusi Uchrashuvlar</h3>
          <p>{upcomingCount}</p>
        </div>
        <div className="stat-item">
          <FiDollarSign size={32} className="stat-icon danger" />
          <h3>Oxirgi To‘lov</h3>
          <p>{lastBilling ? `${lastBilling.total.toLocaleString()} UZS` : "Yo‘q"}</p>
        </div>
      </div>

      {/* Filtrlar */}
      <div className="filter-container">
        {["hamma", "o‘tgan", "kelgusi"].map((type) => (
          <button
            key={type}
            className={`btn filter-btn ${filter === type ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(type)}
          >
            {type === "hamma" ? "Hammasi" : type === "o‘tgan" ? "O‘tgan" : "Kelgusi"}
          </button>
        ))}
      </div>

      {/* Diagrammalar */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Oylar Bo‘yicha Uchrashuvlar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={treatmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
              <XAxis dataKey="month" stroke="var(--gray-600)" />
              <YAxis stroke="var(--gray-600)" />
              <Tooltip contentStyle={{ backgroundColor: "var(--white)" }} />
              <Legend />
              <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Muolaja Turlari</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={treatmentTypes}
                cx="50%" cy="50%" outerRadius={100} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {treatmentTypes.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "var(--white)" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bo‘limlar */}
      <div className="sections-container">
        {/* Uchrashuvlar */}
        <div className="section-card">
          <div className="section-header">
            <h4>Uchrashuvlar</h4>
            <CSVLink
              data={appointmentCSVData}
              filename={`${filter}_uchrashuvlar.csv`}
              className="btn btn-info download-link"
            >
              <FiDownload /> Yuklab Olish
            </CSVLink>
          </div>
          {filteredAppointments.length > 0 ? (
            <ul className="list">
              {filteredAppointments.slice(0, 5).map(apt => (
                <li key={apt.id} className="list-item">
                  <FiCalendar className="list-icon" />
                  <div>
                    <span className="list-date">{new Date(apt.date).toLocaleDateString('uz-UZ')}</span>
                    <span className="list-desc">{apt.procedure}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">Uchrashuvlar yo‘q</p>
          )}
        </div>

        {/* To‘lovlar tarixi */}
        <div className="section-card">
          <div className="section-header">
            <h4>To‘lovlar Tarixi</h4>
            <CSVLink
              data={billingCSVData}
              filename="tolovlar_tarixi.csv"
              className="btn btn-info download-link"
            >
              <FiDownload /> Yuklab Olish
            </CSVLink>
          </div>
          {userBillings.length > 0 ? (
            <ul className="list">
              {userBillings.slice(0, 5).map(bill => (
                <li key={bill.id} className="list-item">
                  <FiDollarSign className="list-icon danger" />
                  <div>
                    <span className="list-date">{new Date(bill.date).toLocaleDateString('uz-UZ')} - {bill.total.toLocaleString()} UZS</span>
                    <span className="list-desc">{bill.services.map(s => s.name).join(", ")} ({bill.status})</span>
                  </div>
                  {bill.status === 'to‘lanmagan' && (
                    <button className="btn btn-primary" onClick={() => handlePayBill(bill.id)}>
                      To‘lov qilish
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">To‘lov yozuvlari yo‘q</p>
          )}
        </div>

        {/* Mijoz Portali */}
        <div className="section-card">
          <div className="section-header">
            <h4>Mijoz Portali</h4>
          </div>
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {error && (
            <div className="alert alert-error">{error}</div>
          )}
          {showRegistration ? (
            <div>
              <h5>Ro‘yxatdan O‘tish</h5>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label><FiUser /> Ism *</label>
                  <input
                    type="text"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    required
                    placeholder="Ismingizni kiriting"
                  />
                </div>
                <div className="form-group">
                  <label><FiPhone /> Telefon *</label>
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telegram Chat ID (majburiy emas)</label>
                  <input
                    type="text"
                    value={newPatient.telegram}
                    onChange={(e) => setNewPatient({ ...newPatient, telegram: e.target.value })}
                    placeholder="Telegram Chat ID (masalan: 5838205785)"
                  />
                  <p className="hint">Botga /start buyrug‘ini yuboring va Chat ID ni kiriting.</p>
                </div>
                <button type="submit" className="btn btn-primary">
                  <FiPlus /> Ro‘yxatdan O‘tish
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h5>Uchrashuv Band Qilish</h5>
              <div className="form-group">
                <label><FiCalendar /> Sana</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <h6>Bo‘sh Vaqtlar</h6>
                <div className="time-slots">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      className={`slot-btn ${slot.isBooked ? 'booked' : selectedTime === slot.time ? 'selected' : ''}`}
                      onClick={() => !slot.isBooked && setSelectedTime(slot.time)}
                      disabled={slot.isBooked}
                      aria-selected={selectedTime === slot.time}
                    >
                      {slot.time} {slot.isBooked ? '(Band)' : ''}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={handleBookAppointment}>
                <div className="form-group">
                  <label><FiClock /> Tanlangan Vaqt</label>
                  <input
                    type="text"
                    value={selectedTime}
                    readOnly
                    placeholder="Vaqtni yuqoridan tanlang"
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
                <button type="submit" className="btn btn-primary">
                  <FiPlus /> Uchrashuv Band Qilish
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRequestNextSlot}
                >
                  <FiSearch /> Keyingi Bo‘sh Vaqt
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Yangiliklar */}
      <div className="news-section">
        <h3>So‘nggi Yangiliklar</h3>
        <div className="news-grid">
          {newsItems.map((news, i) => (
            <div key={i} className="news-card">
              <img src={news.image} alt={news.title} className="news-image" loading="lazy" />
              <div className="news-content">
                <h4>{news.title}</h4>
                <p>{news.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yuklanish oynasi */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" role="status">
            <span className="visually-hidden">Yuklanmoqda...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;