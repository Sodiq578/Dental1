import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiClock,
  FiDollarSign,
  FiBox,
  FiBriefcase,
  FiHelpCircle,
  FiSmile,
  FiLogOut,
  FiUser,
  FiFolder, // Yangi icon: Hujjatlar uchun
  FiActivity, // Yangi icon: Ish vaqti / Attendance uchun
  FiFileText, // Yangi icon: Audit Log uchun
  FiShield, // Yangi icon: Xavfsizlik uchun
  FiGrid, // FiQrcode o'rniga alternativa (grid kvadratlar QR kodga o'xshaydi)
  FiDownload, // Yangi icon: Elektron karta (PDF export) uchun
  FiCpu, // Yangi icon: AI yordamchi uchun
} from "react-icons/fi";
import { AppContext } from "../App";
import "./Sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const { setIsLoading, currentUser } = useContext(AppContext);
  const location = useLocation();

  // Handle navigation click with loading state
  const handleNavClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Base menu items for all users
  const baseMenu = [
    { path: "/", icon: <FiHome />, label: "Bosh sahifa" },
    { path: "/bemorlar", icon: <FiUsers />, label: "Bemorlar" },
    { path: "/uchrashuvlar", icon: <FiCalendar />, label: "Uchrashuvlar" },
    { path: "/dorilar", icon: <FiPackage />, label: "Dorilar" },
    { path: "/hisobotlar", icon: <FiBarChart2 />, label: "Hisobotlar" },
    { path: "/davolash-tarixi", icon: <FiClock />, label: "Davolash Tarixi" },
    { path: "/hisob-kitob", icon: <FiDollarSign />, label: "Hisob-kitob" },
    { path: "/ombor", icon: <FiBox />, label: "Ombor" },
    { path: "/xodimlar", icon: <FiBriefcase />, label: "Xodimlar" },
    { path: "/davolashda-yordam", icon: <FiHelpCircle />, label: "Davolashda Yordam" },
    { path: "/tooth", icon: <FiSmile />, label: "Tishlar" }, // Mavjud Tish Kartasi
    { path: "/kirganlar", icon: <FiUsers />, label: "Kirganlar" },
    {
      path: "/mijozlar-kabinet",
      icon: <FiUsers />,
      label: "Mijozlar (Kabinet)",
      restricted: true,
    },
    { path: "/mijozlar", icon: <FiUsers />, label: "Mijozlar" },
    // Yangi qo'shimchalar: Hujjatlar
    { path: "/hujjatlar", icon: <FiFolder />, label: "Hujjatlar" }, // Rentgen, Tahlil, Shartnomalar, Bemor fayllari
    // Yangi qo'shimchalar: Tish Kartasi (kengaytirilgan)
    { path: "/tish-kartasi", icon: <FiSmile />, label: "Tish Kartasi" }, // 32 tish interaktiv, ranglar, tarix
    // Yangi qo'shimchalar: Ish vaqti / Attendance
    { path: "/ish-vaqti", icon: <FiActivity />, label: "Ish Vaqti" }, // Kirish-chiqish, kechikishlar, jadval
    // Yangi qo'shimchalar: Audit Log
    { path: "/audit-log", icon: <FiFileText />, label: "Audit Log" }, // Kim nima o'zgartirdi, qachon
    // Yangi qo'shimchalar: Xavfsizlik
    { path: "/xavfsizlik", icon: <FiShield />, label: "Xavfsizlik" }, // 2FA va boshqalar
    // Yangi qo'shimchalar: QR-kod bilan bemor chaqirish
    { path: "/bemor-chaqirish", icon: <FiGrid />, label: "Bemor Chaqirish (QR)" },
    // Yangi qo'shimchalar: Elektron karta (PDF export)
    { path: "/elektron-karta", icon: <FiDownload />, label: "Elektron Karta" },
    // Yangi qo'shimchalar: AI yordamchi
    { path: "/ai-yordamchi", icon: <FiCpu />, label: "AI Yordamchi" }, // Tashxis tavsiyasi
  ];

  // Admin-specific menu items
  const adminMenu = [
    { path: "/admin", icon: <FiSettings />, label: "Admin Panel" },
    { path: "/admin/xodimlar", icon: <FiUsers />, label: "Xodim Ruxsatlari" },
    // Admin uchun majburiy 2FA ni xavfsizlik bo'limida boshqarish mumkin
  ];

  // Determine menu items based on user role and permissions
  const getMenuItems = () => {
    if (currentUser?.role === "patient") {
      return [{ path: "/foydalanuvchi", icon: <FiUser />, label: "Shaxsiy Kabinet" }];
    }
    const menu = currentUser?.role === "admin" ? [...baseMenu, ...adminMenu] : baseMenu;
    return menu.filter(
      (item) => !item.restricted || (item.restricted && currentUser?.permissions?.patients)
    );
  };

  // Check if a path is active
  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/admin")) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile sidebar */}
      <div
        className={`dental-sidebar-overlay ${isOpen ? "dental-active" : ""}`}
        onClick={toggleSidebar}
        onKeyDown={(e) => e.key === "Enter" && toggleSidebar()}
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close sidebar"
      />

      {/* Sidebar */}
      <aside className={`dental-sidebar ${isOpen ? "dental-open" : ""}`}>
        <div className="dental-sidebar-header">
          <h2>Tish Shifoxonasi</h2>
          <div className="dental-user-info">
            <FiUser className="dental-user-icon" aria-hidden="true" />
            <div className="dental-user-details">
              <span className="dental-user-name">{currentUser?.name || "Foydalanuvchi"}</span>
              <span className="dental-user-role">
                {currentUser?.role === "admin"
                  ? "Administrator"
                  : currentUser?.role === "doctor"
                  ? "Shifokor"
                  : currentUser?.role === "nurse"
                  ? "Hamshira"
                  : currentUser?.role === "patient"
                  ? "Mijoz"
                  : "Xodim"}
              </span>
            </div>
          </div>
        </div>

        <nav className="dental-sidebar-nav">
          <ul>
            {getMenuItems().map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={isActivePath(item.path) ? "dental-active" : ""}
                  onClick={() => {
                    handleNavClick();
                    if (window.innerWidth <= 768) toggleSidebar();
                  }}
                  aria-current={isActivePath(item.path) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="dental-logout-item">
              <button
                className="dental-sidebar-logout-btn"
                onClick={onLogout}
                aria-label="Log out"
              >
                <FiLogOut aria-hidden="true" />
                <span>Chiqish</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

// PropTypes for type checking
Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Sidebar;