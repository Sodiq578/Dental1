import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCalendar, FiPackage, FiBarChart2, FiSettings,
  FiMoon, FiSun, FiType, FiLayout, FiDownload, FiUpload, FiClock,
  FiDollarSign, FiBox, FiBriefcase, FiGlobe, FiGrid, FiHelpCircle, FiSmile,
  FiLogOut // Added logout icon
} from 'react-icons/fi';
import { AppContext } from '../App';
import { backupAllData, restoreFromBackup } from '../utils'; 
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, darkMode, onLogout }) => { // Added onLogout prop
  const { setDarkMode, setFontSize, setLayout, setIsLoading } = useContext(AppContext); // setIsLoading qo'shildi
  const location = useLocation();

  // Spinner uchun handleNavClick funksiyasi - 1 soniya ko'rsatib, o'chiradi
 const handleNavClick = () => {
  setIsLoading(true);
  console.log("Sidebar link bosildi, spinner ko'rsatilmoqda"); // Debug uchun
  const timer = setTimeout(() => {
    setIsLoading(false);
    console.log("Spinner tezroq o'chirildi"); // Debug uchun
  }, 300); // 300 ms (0.3 soniya)

  return () => clearTimeout(timer);
};


  const menuItems = [
    { path: '/', icon: <FiHome />, label: 'Bosh sahifa' },
    { path: '/bemorlar', icon: <FiUsers />, label: 'Bemorlar' },
    { path: '/uchrashuvlar', icon: <FiCalendar />, label: 'Uchrashuvlar' },
    { path: '/dorilar', icon: <FiPackage />, label: 'Dorilar' },
    { path: '/hisobotlar', icon: <FiBarChart2 />, label: 'Hisobotlar' },
    { path: '/davolash-tarixi', icon: <FiClock />, label: 'Davolash Tarixi' },
    { path: '/hisob-kitob', icon: <FiDollarSign />, label: 'Hisob-kitob' },
    { path: '/ombor', icon: <FiBox />, label: 'Ombor' },
    { path: '/xodimlar', icon: <FiBriefcase />, label: 'Xodimlar' },
    { path: '/bemor-portali', icon: <FiGlobe />, label: 'Bemor Portali' },
    { path: '/davolashda-yordam', icon: <FiHelpCircle />, label: 'Davolashda Yordam' },
    { path: '/tooth', icon: <FiSmile />, label: 'Tishlar' }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${darkMode ? 'dark' : ''}`}>
        <div className="sidebar-header">
          <h2>Tish Shifoxonasi</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={(e) => {
                    handleNavClick(); // Spinner ishga tushirish
                    toggleSidebar(); // Sidebar yopish
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            {/* Logout Button - Spinner qo'shilmagan, chunki login sahifasiga o'tkazadi */}
            <li>
              <button 
                className="sidebar-logout-btn"
                onClick={onLogout}
                aria-label="Tizimdan chiqish"
              >
                <FiLogOut />
                <span>Chiqish</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;