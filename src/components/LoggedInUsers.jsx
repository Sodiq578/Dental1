 
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { getLoginMethod, filterLogins, sortLoginsByTimestamp, clearLogins } from "../utils";
import "./LoggedInUsers.css";

const LoggedInUsers = () => {
  const { logins, user } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const filteredAndSortedLogins = useMemo(() => {
    if (!Array.isArray(logins)) {
      setError("Logins ma'lumotlari noto'g'ri formatda");
      return [];
    }

    const filtered = filterLogins(logins, {
      roleFilter,
      methodFilter,
      dateFilter,
      searchQuery,
    });

    return sortLoginsByTimestamp(filtered, true);
  }, [logins, roleFilter, methodFilter, dateFilter, searchQuery]);

  const totalLogins = filteredAndSortedLogins.length;
  const todayLogins = filteredAndSortedLogins.filter((login) => {
    const loginDate = new Date(login.timestamp);
    const today = new Date();
    return loginDate.toDateString() === today.toDateString();
  }).length;

  const uniqueUsers = new Set(
    filteredAndSortedLogins.map((login) => login.email || login.phone)
  ).size;

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleClearFilters = () => {
    setRoleFilter("");
    setMethodFilter("");
    setDateFilter("");
    setSearchQuery("");
    setError(null);
  };

  const handleClearLogins = () => {
    if (user?.role !== "admin") {
      setError("Faqat administrator login tarixini tozalashi mumkin");
      return;
    }
    clearLogins();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "role-badge role-admin";
      case "staff":
        return "role-badge role-staff";
      case "patient":
        return "role-badge role-patient";
      default:
        return "role-badge";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "staff":
        return "Xodim";
      case "patient":
        return "Bemor";
      default:
        return role || "Noma'lum";
    }
  };

  return (
    <div className={`kirgan-foydalanuvchilar ${loading ? "yuklanmoqda" : ""}`}>
      <h2>Tizimga Kirgan Foydalanuvchilar</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <div className="button-group">
          <button
            className="yangilash-tugmasi"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Ma'lumotlarni yangilash"
            aria-disabled={loading}
          >
            ↻ Yangilash
          </button>
          <button
            className="tozalash-tugmasi"
            onClick={handleClearFilters}
            disabled={loading}
            aria-label="Filtrlarni tozalash"
            aria-disabled={loading}
          >
            🗑️ Filtrlarni Tozalash
          </button>
          {user?.role === "admin" && (
            <button
              className="tozalash-tugmasi"
              onClick={handleClearLogins}
              disabled={loading}
              aria-label="Login tarixini tozalash"
              aria-disabled={loading}
            >
              🗑️ Login Tarixini Tozalash
            </button>
          )}
        </div>

        <div className="filters">
          <div className="filter-group">
            <label htmlFor="roleFilter">Rol:</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Foydalanuvchi rolini tanlash"
            >
              <option value="">Barcha rollar</option>
              <option value="admin">Administrator</option>
              <option value="staff">Xodim</option>
              <option value="patient">Bemor</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="methodFilter">Kirish Usuli:</label>
            <select
              id="methodFilter"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Kirish usulini tanlash"
            >
              <option value="">Barcha usullar</option>
              <option value="admin">Admin</option>
              <option value="token">Token</option>
              <option value="email">Email</option>
              <option value="telefon">Telefon</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="dateFilter">Vaqt:</label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Vaqt oralig'ini tanlash"
            >
              <option value="">Barcha sanalar</option>
              <option value="today">Bugun</option>
              <option value="yesterday">Kecha</option>
              <option value="week">Oxirgi hafta</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="searchQuery">Qidiruv:</label>
            <input
              id="searchQuery"
              type="text"
              placeholder="Ism, email yoki telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Ism, email yoki telefon bo'yicha qidirish"
            />
          </div>
        </div>
      </div>

      <div className="statistik-malumot">
        <div className="statistik-element">
          <span className="statistik-raqam">{totalLogins}</span>
          <span className="statistik-label">Jami Kirishlar</span>
        </div>
        <div className="statistik-element">
          <span className="statistik-raqam">{todayLogins}</span>
          <span className="statistik-label">Bugungi Kirishlar</span>
        </div>
        <div className="statistik-element">
          <span className="statistik-raqam">{uniqueUsers}</span>
          <span className="statistik-label">Takrorlanmagan Foydalanuvchilar</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ism</th>
            <th>Elektron Pochta</th>
            <th>Telefon</th>
            <th>Rol</th>
            <th>Kirish Usuli</th>
            <th>Kirish Vaqti</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedLogins.length > 0 ? (
            filteredAndSortedLogins.map((login) => (
              <tr key={login.id}>
                <td data-label="Ism">
                  <div className="user-info">
                    <div className="user-avatar">
                      {login.name ? login.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{login.name || "Noma'lum"}</div>
                      {login.loginMethod === "token" && (
                        <div className="login-method-badge token">Token</div>
                      )}
                    </div>
                  </div>
                </td>
                <td data-label="Elektron Pochta">{login.email || "-"}</td>
                <td data-label="Telefon">{login.phone || "-"}</td>
                <td data-label="Rol">
                  <span className={getRoleBadgeClass(login.role)}>
                    {getRoleDisplayName(login.role)}
                  </span>
                </td>
                <td data-label="Kirish Usuli">
                  <span className={`login-method ${getLoginMethod(login).toLowerCase()}`}>
                    {getLoginMethod(login)}
                  </span>
                </td>
                <td data-label="Kirish Vaqti" className="vaqt-korsatgich">
                  {new Date(login.timestamp).toLocaleString("uz-UZ", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">Hech qanday kirish qayd etilmagan</td>
            </tr>
          )}
        </tbody>
      </table>

      {loading && <div className="yuklanmoqda"></div>}
    </div>
  );
};

export default LoggedInUsers;

