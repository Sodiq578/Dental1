 
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCalendar, FiPackage, FiBarChart2, FiSettings,
  FiClock, FiDollarSign, FiBox, FiBriefcase, FiGlobe, FiHelpCircle,
  FiSmile, FiLogOut, FiUser
} from 'react-icons/fi';
import { AppContext } from '../App';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const { setIsLoading, currentUser } = useContext(AppContext);
  const location = useLocation();

  const handleNavClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const baseMenu = [
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
    { path: '/tooth', icon: <FiSmile />, label: 'Tishlar' },
    { path: '/foydalanuvchi', icon: <FiUser />, label: 'Foydalanuvchi' },
    { path: '/mijozlar', icon: <FiUsers />, label: 'Mijozlar' },
    { path: '/kirganlar', icon: <FiUsers />, label: 'Kirganlar' },
  ];

  const adminMenu = [
    { path: '/admin', icon: <FiSettings />, label: 'Admin Panel' },
    { path: '/admin/filiallar', icon: <FiHome />, label: 'Filiallar' },
    { path: '/admin/xodimlar', icon: <FiUsers />, label: 'Xodim Ruxsatlari' },
  ];

  const getMenuItems = () => {
    if (currentUser?.role === 'admin') {
      return [...baseMenu, ...adminMenu];
    }
    return baseMenu;
  };

  const menuItems = getMenuItems();

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/admin')) return location.pathname === path;
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
        aria-hidden={!isOpen}
      ></div>
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Tish Shifoxonasi</h2>
          <div className="user-info">
            <FiUser className="user-icon" />
            <div className="user-details">
              <span className="user-name">{currentUser?.name || 'Foydalanuvchi'}</span>
              <span className="user-role">
                {currentUser?.role === 'admin' ? 'Administrator' : 
                 currentUser?.role === 'doctor' ? 'Shifokor' : 
                 currentUser?.role === 'nurse' ? 'Hamshira' : 'Xodim'}
              </span>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={isActivePath(item.path) ? 'active' : ''}
                  onClick={() => {
                    handleNavClick();
                    if (window.innerWidth <= 768) {
                      toggleSidebar();
                    }
                  }}
                  aria-current={isActivePath(item.path) ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}

            <li className="logout-item">
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
