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

// Utils
import { getFromLocalStorage, saveToLocalStorage, initializeData } from "./utils";
import "./App.css";

// Context
export const AppContext = createContext();

const App = () => {
  // State for UI and authentication
  const [sidebarOpen, setSidebarOpen] = useState(getFromLocalStorage("sidebarOpen", false));
  const [darkMode, setDarkMode] = useState(getFromLocalStorage("darkMode", false));
  const [fontSize, setFontSize] = useState(getFromLocalStorage("fontSize", 16));
  const [layout, setLayout] = useState(getFromLocalStorage("layout", "normal"));
  const [dataLoaded, setDataLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState("checking");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [billings, setBillings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);

  // Initialize data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        initializeData(); // Initialize local storage with default data

        // Load state from local storage
        setSidebarOpen(getFromLocalStorage("sidebarOpen", false));
        setDarkMode(getFromLocalStorage("darkMode", false));
        setFontSize(getFromLocalStorage("fontSize", 16));
        setLayout(getFromLocalStorage("layout", "normal"));
        setPatients(getFromLocalStorage("patients", []));
        setAppointments(getFromLocalStorage("appointments", []));
        setMedications(getFromLocalStorage("medications", []));
        setBillings(getFromLocalStorage("billings", []));
        setInventory(getFromLocalStorage("inventory", []));
        setStaff(getFromLocalStorage("staff", []));
        setUsers(getFromLocalStorage("users", []));

        // Check for logged-in user
        const savedUser = getFromLocalStorage("currentUser", null);
        if (savedUser) {
          setCurrentUser(savedUser);
          setIsLoggedIn(true);
        }

        // Verify localStorage availability
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
        setDataLoaded(true); // Allow app to render even if there's an error
      }
    };

    loadInitialData();
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (!dataLoaded) return;

    saveToLocalStorage("sidebarOpen", sidebarOpen);
    saveToLocalStorage("darkMode", darkMode);
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
  }, [
    sidebarOpen,
    darkMode,
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
  ]);

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Handle login
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    saveToLocalStorage("currentUser", userData);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    saveToLocalStorage("currentUser", null);
  };

  // Handle storage unavailable
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

  // Show loading spinner until data is loaded
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
        darkMode,
        setDarkMode,
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
      }}
    >
      <Router>
        <div className={`app ${darkMode ? "dark" : ""}`} style={{ fontSize: `${fontSize}px` }}>
          {isLoading && (
            <div className="loading-overlay">
              <Spinner />
            </div>
          )}
          {!isLoggedIn ? (
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/bemor-portali" element={<PatientPortal />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : currentUser.role === "patient" ? (
            // Patient view: No sidebar, only UserDashboard
            <main className="main-content full-width">
              <Routes>
                <Route path="/foydalanuvchi" element={<UserDashboard />} />
                <Route path="*" element={<Navigate to="/foydalanuvchi" />} />
              </Routes>
            </main>
          ) : (
            // Admin/staff view: Full system with sidebar
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
                darkMode={darkMode}
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
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </>
          )}
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;