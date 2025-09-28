import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FiMenu, FiDatabase } from "react-icons/fi";

// Components
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Appointments from "./components/Appointments";
import Medications from "./components/Medications";
import Reports from "./components/Reports";
import TreatmentHistory from "./components/TreatmentHistory";
import Billing from "./components/Billing";
import Inventory from "./components/Inventory";
import Staff from "./components/Staff";
import PatientPortal from "./components/PatientPortal";
import Charting from "./components/Charting";
import DentalAssistance from "./components/DentalAssistance";
import Tooth from "./components/ToothCard";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import Spinner from "./adds/Spinner";
import LoggedInUsers from "./components/LoggedInUsers";
import TokenLogin from "./components/TokenLogin";

// Utils
import { getFromLocalStorage, saveToLocalStorage, initializeData, logLogin } from "./utils";
import "./App.css";

// Context
export const AppContext = createContext();

const App = () => {
  // State for UI and authentication
  const [sidebarOpen, setSidebarOpen] = useState(getFromLocalStorage("sidebarOpen", false));
  const [fontSize, setFontSize] = useState(getFromLocalStorage("fontSize", 16));
  const [layout, setLayout] = useState(getFromLocalStorage("layout", "normal"));
  const [dataLoaded, setDataLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState("checking");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenLoginOpen, setTokenLoginOpen] = useState(false);

  // Data state
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [billings, setBillings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [logins, setLogins] = useState(getFromLocalStorage("logins", []));

  // Initialize data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        initializeData();

        setSidebarOpen(getFromLocalStorage("sidebarOpen", false));
        setFontSize(getFromLocalStorage("fontSize", 16));
        setLayout(getFromLocalStorage("layout", "normal"));
        setPatients(getFromLocalStorage("patients", []));
        setAppointments(getFromLocalStorage("appointments", []));
        setMedications(getFromLocalStorage("medications", []));
        setBillings(getFromLocalStorage("billings", []));
        setInventory(getFromLocalStorage("inventory", []));
        setStaff(getFromLocalStorage("staff", []));
        setUsers(getFromLocalStorage("users", []));
        setLogins(getFromLocalStorage("logins", []));

        const savedUser = getFromLocalStorage("currentUser", null);
        if (savedUser) {
          setCurrentUser(savedUser);
          setIsLoggedIn(true);
        }

        const testKey = "storage_test";
        localStorage.setItem(testKey, "test");
        if (localStorage.getItem(testKey) !== "test") {
          setStorageStatus("unavailable");
        } else {
          setStorageStatus("available");
        }
        localStorage.removeItem(testKey);

        setDataLoaded(true);
      } catch (error) {
        console.error("Ma'lumotlarni yuklashda xato:", error);
        setStorageStatus("unavailable");
        setDataLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (!dataLoaded) return;

    saveToLocalStorage("sidebarOpen", sidebarOpen);
    saveToLocalStorage("fontSize", fontSize);
    saveToLocalStorage("layout", layout);
    saveToLocalStorage("patients", patients);
    saveToLocalStorage("appointments", appointments);
    saveToLocalStorage("medications", medications);
    saveToLocalStorage("billings", billings);
    saveToLocalStorage("inventory", inventory);
    saveToLocalStorage("staff", staff);
    saveToLocalStorage("users", users);
    saveToLocalStorage("currentUser", currentUser);
    saveToLocalStorage("logins", logins);
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
  ]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    saveToLocalStorage("currentUser", userData);
    logLogin(userData);
    setLogins(getFromLocalStorage("logins", []));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    saveToLocalStorage("currentUser", null);
  };

  if (storageStatus === "unavailable") {
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
      }}
    >
      <Router>
        <div className="app" style={{ fontSize: `${fontSize}px` }}>
          {isLoading && (
            <div className="loading-overlay">
              <Spinner />
            </div>
          )}
          {!isLoggedIn ? (
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} onOpenTokenLogin={() => setTokenLoginOpen(true)} />} />
              <Route path="/bemor-portali" element={<PatientPortal />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : currentUser.role === "patient" ? (
            <main className="">
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
                aria-label="Yon panelni ochish"
              >
                <FiMenu />
              </button>
              <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
              <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
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
                  <Route path="/mijozlar" element={<Patients />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </>
          )}
          {/* Token Login Modal */}
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