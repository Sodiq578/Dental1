import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FiMenu, FiDatabase } from 'react-icons/fi';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Appointments from './components/Appointments';
import Medications from './components/Medications';
import Reports from './components/Reports';
import TreatmentHistory from './components/TreatmentHistory';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Staff from './components/Staff';
import PatientPortal from './components/PatientPortal';
import Charting from './components/Charting';
import DentalAssistance from './components/DentalAssistance';
import Tooth from './components/ToothCard';
import UserLogin from './login/UserLogin';
import AdminLogin from './login/AdminLogin';
import StaffLogin from './login/StaffLogin';
import UserDashboard from './components/UserDashboard';
import Spinner from './adds/Spinner';
import LoggedInUsers from './components/LoggedInUsers';
import TokenLogin from './components/TokenLogin';
import ChooseLoginType from './components/ChooseLoginType';
import AdminDashboard from './components/Admin/AdminDashboard';
import BranchManagement from './components/Admin/BranchManagement';
import StaffPermissions from './login/StaffLogin';
import AdminFor from './login/AdminLogin';
import PatientsWithAccount from './login/UserLogin';

// Yangi komponentlar (placeholder sifatida qo'shildi, keyin batafsil ishlab chiqing)
import Documents from './components/Documents'; // Hujjatlar (Rentgen, Tahlil, Shartnomalar, Bemor fayllari)
import DentalChart from './components/DentalChart'; // Tish Kartasi (32 tish interaktiv, ranglar, tarix)
import Attendance from './components/Attendance'; // Ish vaqti / Attendance
import AuditLog from './components/AuditLog'; // Audit Log
import Security from './components/Security'; // Xavfsizlik (2FA va boshqalar)
import PatientQRCall from './components/PatientQRCall'; // QR-kod bilan bemor chaqirish
import ElectronicCard from './components/ElectronicCard'; // Elektron karta (PDF export)
import AIAssistant from './components/AIAssistant'; // AI yordamchi (tashxis tavsiyasi)

// Utils
import {
  getFromLocalStorage,
  saveToLocalStorage,
  initializeData,
  logLogin,
} from './utils';
import './App.css';

export const AppContext = createContext();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(getFromLocalStorage('sidebarOpen', false));
  const [fontSize, setFontSize] = useState(getFromLocalStorage('fontSize', 16));
  const [layout, setLayout] = useState(getFromLocalStorage('layout', 'normal'));
  const [dataLoaded, setDataLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState('checking');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenLoginOpen, setTokenLoginOpen] = useState(false);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [billings, setBillings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [logins, setLogins] = useState(getFromLocalStorage('logins', []));
  const [pendingAdmins, setPendingAdmins] = useState(getFromLocalStorage('pendingAdmins', []));

  // Yangi state'lar qo'shildi
  const [documents, setDocuments] = useState([]); // Hujjatlar uchun (Rentgen, Tahlil va h.k.)
  const [dentalCharts, setDentalCharts] = useState([]); // Tish Kartasi ma'lumotlari
  const [attendanceRecords, setAttendanceRecords] = useState([]); // Ish vaqti / Attendance
  const [auditLogs, setAuditLogs] = useState([]); // Audit Log ma'lumotlari

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        initializeData();
        setSidebarOpen(getFromLocalStorage('sidebarOpen', false));
        setFontSize(getFromLocalStorage('fontSize', 16));
        setLayout(getFromLocalStorage('layout', 'normal'));
        setPatients(getFromLocalStorage('patients', []));
        setAppointments(getFromLocalStorage('appointments', []));
        setMedications(getFromLocalStorage('medications', []));
        setBillings(getFromLocalStorage('billings', []));
        setInventory(getFromLocalStorage('inventory', []));
        setStaff(getFromLocalStorage('staff', []));
        setUsers(getFromLocalStorage('users', []));
        setLogins(getFromLocalStorage('logins', []));
        setPendingAdmins(getFromLocalStorage('pendingAdmins', []));

        // Yangi state'lar uchun localStorage'dan yuklash
        setDocuments(getFromLocalStorage('documents', []));
        setDentalCharts(getFromLocalStorage('dentalCharts', []));
        setAttendanceRecords(getFromLocalStorage('attendanceRecords', []));
        setAuditLogs(getFromLocalStorage('auditLogs', []));

        const savedUser = getFromLocalStorage('currentUser', null);
        if (savedUser) {
          setCurrentUser(savedUser);
          setIsLoggedIn(true);
        }

        const testKey = 'storage_test';
        try {
          localStorage.setItem(testKey, 'test');
          const value = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          setStorageStatus(value === 'test' ? 'available' : 'unavailable');
        } catch (error) {
          setStorageStatus('unavailable');
        }

        setDataLoaded(true);
      } catch (error) {
        console.error("Ma'lumotlarni yuklashda xato:", error);
        setStorageStatus('unavailable');
        setDataLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    saveToLocalStorage('sidebarOpen', sidebarOpen);
    saveToLocalStorage('fontSize', fontSize);
    saveToLocalStorage('layout', layout);
    saveToLocalStorage('patients', patients);
    saveToLocalStorage('appointments', appointments);
    saveToLocalStorage('medications', medications);
    saveToLocalStorage('billings', billings);
    saveToLocalStorage('inventory', inventory);
    saveToLocalStorage('staff', staff);
    saveToLocalStorage('users', users);
    saveToLocalStorage('currentUser', currentUser);
    saveToLocalStorage('logins', logins);
    saveToLocalStorage('pendingAdmins', pendingAdmins);

    // Yangi state'lar uchun saqlash
    saveToLocalStorage('documents', documents);
    saveToLocalStorage('dentalCharts', dentalCharts);
    saveToLocalStorage('attendanceRecords', attendanceRecords);
    saveToLocalStorage('auditLogs', auditLogs);
  }, [
    sidebarOpen,
    fontSize,
    layout,
    dataLoaded,
    patients,
    appointments,
    medications,
    billings,
    inventory,
    staff,
    users,
    currentUser,
    logins,
    pendingAdmins,
    documents,
    dentalCharts,
    attendanceRecords,
    auditLogs,
  ]);

  // Ctrl + Alt + T — Admin paneliga maxfiy o'tish
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault();

        // Agar allaqachon admin bo'lsa — to'g'ridan admin dashboardga
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
          window.location.href = '/admin';
        } else {
          // Aks holda — admin login sahifasiga yo'naltirish (xavfsiz variant)
          window.location.href = '/admin-login';
        }

        // === TEST UCHUN MAXFIY ADMIN LOGIN (FAKAT DEVELOPMENTDA ISHLATING!) ===
        // Quyidagi qismni faqat lokal testda qoldiring, productionda o'chirib qo'ying!
        /*
        const secretAdmin = {
          id: 'superadmin-001',
          name: 'Super Administrator',
          role: 'superadmin',
          branch: 'main',
          permissions: {
            patients: true,
            appointments: true,
            billing: true,
            inventory: true,
            staff: true,
            reports: true,
            admin: true,
            // boshqa kerakli ruxsatlar...
          },
        };
        handleLogin(secretAdmin);
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
        */
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser]); // currentUser o'zgarsa ham yangilansin

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    saveToLocalStorage('currentUser', userData);
    logLogin(userData);
    setLogins(getFromLocalStorage('logins', []));
    setTokenLoginOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    saveToLocalStorage('currentUser', null);
  };

  if (storageStatus === 'unavailable') {
    return (
      <div className="storage-error">
        <FiDatabase size={48} />
        <h2>LocalStorage mavjud emas</h2>
        <p>Brauzeringizda LocalStorage qo'llab-quvvatlanmaydi yoki bloklangan.</p>
        <p>Iltimos, brauzer sozlamalarini tekshiring yoki boshqa brauzerdan foydalaning.</p>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="loading-screen">
        <Spinner />
        <p>Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        fontSize,
        setFontSize,
        layout,
        setLayout,
        storageStatus,
        patients,
        setPatients,
        appointments,
        setAppointments,
        medications,
        setMedications,
        billings,
        setBillings,
        inventory,
        setInventory,
        staff,
        setStaff,
        users,
        setUsers,
        currentUser,
        isLoggedIn,
        handleLogout,
        isLoading,
        setIsLoading,
        getFromLocalStorage,
        saveToLocalStorage,
        logins,
        setLogins,
        pendingAdmins,
        setPendingAdmins,
        // Yangi state'lar va setter'lar
        documents,
        setDocuments,
        dentalCharts,
        setDentalCharts,
        attendanceRecords,
        setAttendanceRecords,
        auditLogs,
        setAuditLogs,
      }}
    >
      <Router>
        <div className="app" style={{ fontSize: `${fontSize}px` }}>
          {isLoading && (
            <div className="loading-overlay">
              <Spinner />
              <p>Yuklanmoqda...</p>
            </div>
          )}

          {!isLoggedIn ? (
            <Routes>
              <Route path="/" element={<ChooseLoginType />} />
              <Route path="/user-login" element={<UserLogin onLogin={handleLogin} />} />
              <Route path="/admin-login" element={<AdminLogin onLogin={handleLogin} />} />
              <Route path="/staff-login" element={<StaffLogin onLogin={handleLogin} />} />
              <Route path="/bemor-portali" element={<PatientPortal />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          ) : currentUser.role === 'patient' ? (
            <main className="patient-main">
              <Routes>
                <Route path="/foydalanuvchi" element={<UserDashboard />} />
                <Route path="*" element={<Navigate to="/foydalanuvchi" />} />
              </Routes>
            </main>
          ) : (
            <>
              <button
                className="menu-btn"
                onClick={toggleSidebar}
                aria-label="Yon panelni ochish/yopish"
              >
                <FiMenu />
              </button>

              <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
              />

              <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/bemorlar" element={<Patients />} />
                  <Route path="/uchrashuvlar" element={<Appointments />} />
                  <Route path="/dorilar" element={<Medications />} />
                  <Route path="/hisobotlar" element={<Reports />} />
                  <Route path="/davolash-tarixi" element={<TreatmentHistory />} />
                  <Route path="/hisob-kitob" element={<Billing />} />
                  <Route path="/ombor" element={<Inventory />} />
                  <Route path="/xodimlar" element={<Staff />} />
                  <Route path="/bemor-portali" element={<PatientPortal />} />
                  <Route path="/diagrammalar" element={<Charting />} />
                  <Route path="/davolashda-yordam" element={<DentalAssistance />} />
                  <Route path="/tooth" element={<Tooth />} />
                  <Route path="/foydalanuvchi" element={<UserDashboard />} />
                  <Route path="/kirganlar" element={<LoggedInUsers />} />
                  <Route
                    path="/mijozlar-kabinet"
                    element={
                      currentUser?.permissions?.patients ? (
                        <PatientsWithAccount />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/mijozlar" element={<Patients />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/filiallar" element={<BranchManagement />} />
                  <Route path="/admin/xodimlar" element={<StaffPermissions />} />
                  <Route path="/branch/:branchId" element={<AdminFor />} />
                  {/* Yangi routelar qo'shildi */}
                  <Route path="/hujjatlar" element={<Documents />} /> {/* Hujjatlar */}
                  <Route path="/tish-kartasi" element={<DentalChart />} /> {/* Tish Kartasi */}
                  <Route path="/ish-vaqti" element={<Attendance />} /> {/* Ish vaqti */}
                  <Route path="/audit-log" element={<AuditLog />} /> {/* Audit Log */}
                  <Route path="/xavfsizlik" element={<Security />} /> {/* Xavfsizlik (2FA) */}
                  <Route path="/bemor-chaqirish" element={<PatientQRCall />} /> {/* QR chaqirish */}
                  <Route path="/elektron-karta" element={<ElectronicCard />} /> {/* PDF export */}
                  <Route path="/ai-yordamchi" element={<AIAssistant />} /> {/* AI yordamchi */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </>
          )}

          <TokenLogin
            isOpen={tokenLoginOpen}
            onClose={() => setTokenLoginOpen(false)}
            onLogin={handleLogin}
          />
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;