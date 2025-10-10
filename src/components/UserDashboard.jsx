import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiCalendar, FiActivity, FiClock, FiDollarSign, FiDownload, FiLogOut
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { CSVLink } from "react-csv";
import { AppContext } from "../App";
import "./UserDashboard.css";

const COLORS = ['#3B82F6', '#10B981', '#FBBF24', '#F87171', '#8B5CF6', '#34D399'];

const UserDashboard = () => {
  const { currentUser, appointments, billings, handleLogout } = useContext(AppContext);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 🔁 Redirect if no user
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // 🔎 Filtered Appointments
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
      if (filter === "past") return aptDate < now;
      if (filter === "upcoming") return aptDate >= now;
      return true;
    });
  }, [userAppointments, filter]);

  // 📊 Stats
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
      month: `Month ${month}`, count
    }));
  }, [filteredAppointments]);

  const treatmentTypes = useMemo(() => {
    const types = {};
    filteredAppointments.forEach(apt => {
      const type = apt.procedure || "Unknown";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  // 📁 CSV Export Data
  const appointmentCSVData = filteredAppointments.map(apt => ({
    Date: new Date(apt.date).toLocaleDateString('uz-UZ'),
    Procedure: apt.procedure
  }));

  const billingCSVData = userBillings.map(bill => ({
    Date: new Date(bill.date).toLocaleDateString('uz-UZ'),
    Total: bill.total,
    Services: bill.services.map(s => s.name).join(", "),
    Status: bill.status || "Unknown"
  }));

  // 🚪 Logout
  const handleLogoutClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogout();
      navigate("/login");
    }, 1000);
  };

  // 📰 News items
  const newsItems = [
    {
      title: "Stomatology Uzbekistan 2025",
      description: "Dental exhibition in Tashkent, April 15-17, 2025",
      image: "https://images.pexels.com/photos/6812583/pexels-photo-6812583.jpeg"
    },
    {
      title: "UzMedExpo 2025",
      description: "17th International Healthcare Exhibition in Tashkent, November 4-6",
      image: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-9054.jpg"
    },
    {
      title: "IDECA Tashkent 2025",
      description: "Dental education events, 26 speakers from 8 countries",
      image: "https://images.pexels.com/photos/4226263/pexels-photo-4226263.jpeg"
    },
    {
      title: "AI in Dentistry",
      description: "AI transforming diagnostics and education",
      image: "https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg"
    },
    {
      title: "Top 10 Cosmetic Dentistry Trends in 2025",
      description: "Minimally Invasive Veneers, 3D Printing and more",
      image: "https://images.pexels.com/photos/6628600/pexels-photo-6628600.jpeg"
    }
  ];

  if (!currentUser) return null; // Already handled by useEffect

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <FiUser size={48} className="header-icon" />
        <div className="header-info">
          <h2>{currentUser.name}'s Dashboard</h2>
          <p>Email: {currentUser.email}</p>
        </div>
        <button className="btn btn-danger logout-btn" onClick={handleLogoutClick} disabled={isLoading}>
          <FiLogOut /> <span>Log Out</span>
        </button>
      </div>

      {/* Stats */}
      <div className="stats-container">
        <div className="stat-item">
          <FiCalendar size={32} className="stat-icon primary" />
          <h3>Total Appointments</h3>
          <p>{totalAppointments}</p>
        </div>
        <div className="stat-item">
          <FiActivity size={32} className="stat-icon success" />
          <h3>Total Expenses</h3>
          <p>{totalCost.toLocaleString()} UZS</p>
        </div>
        <div className="stat-item">
          <FiClock size={32} className="stat-icon warning" />
          <h3>Upcoming Appointments</h3>
          <p>{upcomingCount}</p>
        </div>
        <div className="stat-item">
          <FiDollarSign size={32} className="stat-icon danger" />
          <h3>Last Payment</h3>
          <p>{lastBilling ? `${lastBilling.total.toLocaleString()} UZS` : "None"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-container">
        {["all", "past", "upcoming"].map((type) => (
          <button
            key={type}
            className={`btn filter-btn ${filter === type ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Appointments by Month</h3>
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
          <h3>Treatment Types</h3>
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

      {/* Sections */}
      <div className="sections-container">
        {/* Appointments */}
        <div className="section-card">
          <div className="section-header">
            <h4>Appointments</h4>
            <CSVLink
              data={appointmentCSVData}
              filename={`${filter}_appointments.csv`}
              className="btn btn-info download-link"
            >
              <FiDownload /> Download
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
            <p className="no-data">No appointments</p>
          )}
        </div>

        {/* Billing */}
        <div className="section-card">
          <div className="section-header">
            <h4>Billing History</h4>
            <CSVLink
              data={billingCSVData}
              filename="billing_history.csv"
              className="btn btn-info download-link"
            >
              <FiDownload /> Download
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No billing records</p>
          )}
        </div>
      </div>

      {/* News */}
      <div className="news-section">
        <h3>Latest News</h3>
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
