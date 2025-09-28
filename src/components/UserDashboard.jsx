import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign, FiDownload, FiLogOut } from "react-icons/fi";
import { AppContext } from "../App";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CSVLink } from "react-csv";
import "./UserDashboard.css";

const UserDashboard = () => {
  const { currentUser, appointments, billings, handleLogout } = useContext(AppContext);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const userAppointments = useMemo(() => 
    appointments.filter(apt => apt.patientId === currentUser?.id), [appointments, currentUser]
  );

  const userBillings = useMemo(() => 
    billings.filter(bill => bill.patientId === currentUser?.id), [billings, currentUser]
  );

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return userAppointments.filter(apt => {
      if (filter === "past") return new Date(apt.date) < now;
      if (filter === "upcoming") return new Date(apt.date) >= now;
      return true;
    });
  }, [userAppointments, filter]);

  const totalAppointments = userAppointments.length;
  const totalCost = userBillings.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const upcomingCount = userAppointments.filter(apt => new Date(apt.date) > new Date()).length;

  const treatmentsByMonth = useMemo(() => {
    const monthly = {};
    filteredAppointments.forEach(apt => {
      const month = new Date(apt.date).getMonth() + 1;
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly).map(([month, count]) => ({ month: `Oy ${month}`, count }));
  }, [filteredAppointments]);

  const treatmentTypes = useMemo(() => {
    const types = {};
    filteredAppointments.forEach(apt => {
      const type = apt.procedure || "Noma'lum";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  const appointmentCSVData = filteredAppointments.map(apt => ({
    Date: new Date(apt.date).toLocaleDateString('uz-UZ'),
    Procedure: apt.procedure,
  }));

  const billingCSVData = userBillings.map(bill => ({
    Date: new Date(bill.date).toLocaleDateString('uz-UZ'),
    Total: bill.total,
    Services: bill.services.map(s => s.name).join(", "),
    Status: bill.status || "Noma'lum",
  }));

  const COLORS = ['#3B82F6', '#10B981', '#FBBF24', '#F87171', '#8B5CF6', '#34D399'];

  const newsItems = [
    {
      title: "Stomatology Uzbekistan 2025",
      description: "Tashkentda o'tkaziladigan stomatologiya ko'rgazmasi, 15-17 aprel 2025, yangi texnologiyalar va mahsulotlar taqdim etiladi.",
      image: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "UzMedExpo 2025",
      description: "17th International Specialized Exhibition for Healthcare in Uzbekistan, 4-6 noyabr 2025, Toshkent.",
      image: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "IDECA Tashkent 2025",
      description: "International dental show in Uzbekistan, 40 dan ortiq stomatologik ta'lim tadbirlari, 26 spiker 8 mamlakatdan.",
      image: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "The Most Important Dental Trends for 2025",
      description: "AI stomatologiyada diagnostika, tasvirlash va ta'limni o'zgartirmoqda.",
      image: "https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "Top 10 Cosmetic Dentistry Trends in 2025",
      description: "Minimally Invasive Veneers, 3D Printing va boshqa trendlar.",
      image: "https://images.pexels.com/photos/6628600/pexels-photo-6628600.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
  ];

  const handleLogoutClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogout();
      navigate("/login");
      setIsLoading(false);
    }, 1000);
  };

  if (!currentUser) {
    return (
      <div className="no-user" data-testid="no-user">
        Foydalanuvchi topilmadi
      </div>
    );
  }

  return (
    <div className="user-dashboard" data-testid="user-dashboard">
      <div className="user-header">
        <FiUser size={48} className="user-icon" />
        <div>
          <h2 className="header-title">{currentUser.name} - Shaxsiy Kabinet</h2>
          <p className="header-email">Email: {currentUser.email}</p>
        </div>
        <button 
          className="logout-button"
          onClick={handleLogoutClick}
          aria-label="Tizimdan chiqish"
        >
          <FiLogOut size={20} />
          <span>Chiqish</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiCalendar size={32} className="stat-icon blue" />
          <h3 className="stat-title">Jami Uchrashuvlar</h3>
          <p className="stat-value">{totalAppointments}</p>
        </div>
        <div className="stat-card">
          <FiActivity size={32} className="stat-icon green" />
          <h3 className="stat-title">Jami Xarajatlar</h3>
          <p className="stat-value">{totalCost.toLocaleString()} so'm</p>
        </div>
        <div className="stat-card">
          <FiClock size={32} className="stat-icon yellow" />
          <h3 className="stat-title">Kelajakdagi Uchrashuvlar</h3>
          <p className="stat-value">{upcomingCount}</p>
        </div>
        <div className="stat-card">
          <FiDollarSign size={32} className="stat-icon red" />
          <h3 className="stat-title">Oxirgi To'lov</h3>
          <p className="stat-value">
            {userBillings[0] ? `${userBillings[0].total.toLocaleString()} so'm` : "Yo'q"}
          </p>
        </div>
      </div>

      <div className="filter-section">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
          data-testid="filter-all"
        >
          Barchasi
        </button>
        <button
          className={`filter-btn ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
          data-testid="filter-past"
        >
          O'tgan
        </button>
        <button
          className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
          data-testid="filter-upcoming"
        >
          Kelajakdagi
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3 className="chart-title">Uchrashuvlar bo'yicha statistika</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={treatmentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Davolash Turlari</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={treatmentTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {treatmentTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sections-container">
        <div className="section-card">
          <div className="section-header">
            <h4 className="section-title">Kelajakdagi Uchrashuvlar</h4>
            <CSVLink
              data={appointmentCSVData}
              filename="upcoming_appointments.csv"
              className="download-link"
            >
              <FiDownload className="download-icon" /> Yuklash
            </CSVLink>
          </div>
          {filteredAppointments.filter(apt => new Date(apt.date) > new Date()).length > 0 ? (
            <ul className="list">
              {filteredAppointments
                .filter(apt => new Date(apt.date) > new Date())
                .slice(0, 5)
                .map(apt => (
                  <li key={apt.id} className="list-item">
                    <FiClock size={20} className="list-icon blue" />
                    <div>
                      <p className="list-date">{new Date(apt.date).toLocaleDateString('uz-UZ')}</p>
                      <p className="list-desc">{apt.procedure}</p>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="no-data">Kelajakdagi uchrashuvlar yo'q</p>
          )}
        </div>

        <div className="section-card">
          <div className="section-header">
            <h4 className="section-title">Davolash Tarixi</h4>
            <CSVLink
              data={appointmentCSVData}
              filename="appointment_history.csv"
              className="download-link"
            >
              <FiDownload className="download-icon" /> Yuklash
            </CSVLink>
          </div>
          <ul className="list">
            {filteredAppointments.slice(0, 5).map(apt => (
              <li key={apt.id} className="list-item">
                <FiCalendar size={20} className="list-icon blue" />
                <div>
                  <p className="list-date">{new Date(apt.date).toLocaleDateString('uz-UZ')}</p>
                  <p className="list-desc">{apt.procedure}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h4 className="section-title">To'lov Tarixi</h4>
            <CSVLink
              data={billingCSVData}
              filename="billing_history.csv"
              className="download-link"
            >
              <FiDownload className="download-icon" /> Yuklash
            </CSVLink>
          </div>
          {userBillings.length > 0 ? (
            <ul className="list">
              {userBillings.slice(0, 5).map(bill => (
                <li key={bill.id} className="list-item">
                  <FiDollarSign size={20} className="list-icon red" />
                  <div>
                    <p className="list-date">
                      {new Date(bill.date).toLocaleDateString('uz-UZ')} - {bill.total.toLocaleString()} so'm
                    </p>
                    <p className="list-desc">{bill.services.map(s => s.name).join(", ")} ({bill.status})</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">To'lov tarixi yo'q</p>
          )}
        </div>
      </div>

      <div className="news-section">
        <h3 className="news-title">Bizning Yangiliklar</h3>
        <div className="news-grid">
          {newsItems.map((news, index) => (
            <div key={index} className="news-card">
              <img 
                src={news.image} 
                alt={news.title} 
                className="news-image"
              />
              <div className="news-content">
                <h4 className="news-card-title">{news.title}</h4>
                <p className="news-desc">{news.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;