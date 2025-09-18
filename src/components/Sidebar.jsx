// src/components/Sidebar.jsx
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCalendar, FiPackage, FiBarChart2, FiSettings,
  FiMoon, FiSun, FiType, FiLayout, FiDownload, FiUpload, FiClock,
  FiDollarSign, FiBox, FiBriefcase, FiGlobe, FiGrid, FiHelpCircle, FiSmile
} from 'react-icons/fi';
import { AppContext } from '../App';
import { backupAllData, restoreFromBackup } from '../utils'; 
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, darkMode }) => {
  const { setDarkMode, setFontSize, setLayout } = useContext(AppContext);
  const location = useLocation();

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
    { path: '/tooth', icon: <FiSmile />, label: 'Tishlar' } // ✅ Yangi qo‘shildi
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
                  onClick={toggleSidebar}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="settings-section">
            <h3>
              <FiSettings />
              <span>Sozlamalar</span>
            </h3>
            
            <div className="setting-item">
              <button 
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <FiSun /> : <FiMoon />}
                <span>{darkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
              </button>
            </div>
            
            <div className="setting-item">
              <FiType />
              <span>Shrift o'lchami</span>
              <select onChange={(e) => setFontSize(parseInt(e.target.value))}>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
              </select>
            </div>
            
            <div className="setting-item">
              <FiLayout />
              <span>Layout</span>
              <select onChange={(e) => setLayout(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
              </select>
            </div>

            <div className="setting-item">
              <button onClick={backupAllData}>
                <FiDownload />
                <span>Ma'lumotlarni zaxiralash</span>
              </button>
            </div>

            <div className="setting-item">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    restoreFromBackup(e.target.files[0], (success) => {
                      alert(success ? 'Ma\'lumotlar muvaffaqiyatli tiklandi!' : 'Ma\'lumotlarni tiklashda xatolik.');
                      window.location.reload();
                    });
                  }
                }}
              />
              <span>Ma'lumotlarni tiklash</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

