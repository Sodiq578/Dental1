import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FiMenu, FiDatabase } from "react-icons/fi";

// Komponentlar
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

// Utils
import {
  getFromLocalStorage,
  saveToLocalStorage,
  initializeData,
} from "./utils";
import "./App.css";

// Context
export const AppContext = createContext();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [layout, setLayout] = useState("normal");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState("checking");

  // Data state
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [billings, setBillings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);

  // Boshlang‘ich ma’lumotlarni yuklash
  useEffect(() => {
    try {
      initializeData();

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

      // LocalStorage test
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
    }
  }, []);

  // O‘zgarishlarni LocalStorage’ga saqlash
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
  ]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
        <div className="loading-spinner"></div>
        <p>Ma'lumotlar yuklanmoqda...</p>
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
        getFromLocalStorage, // Added to context
      }}
    >
      <Router>
        <div className={`app ${darkMode ? "dark-mode" : ""}`}>
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
          />

          <main className="main-content">
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
            </Routes>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;