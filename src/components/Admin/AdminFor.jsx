// src/components/Admin/AdminFor.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiSearch, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone, 
  FiUser, FiCalendar, FiDollarSign, FiActivity, FiBarChart2,
  FiHome, FiUsers, FiFileText, FiShield, FiAward, FiX, FiKey, FiClock,
  FiCopy
} from "react-icons/fi";
import { AppContext } from "../../App";
import { getFromLocalStorage, saveToLocalStorage, validateEmail, validatePhone } from "../../utils";
import "./AdminFor.css";

const AdminFor = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { setIsLoading, currentUser, staff: allStaff, setStaff } = useContext(AppContext);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [adminTokenModal, setAdminTokenModal] = useState(false);
  const [modalType, setModalType] = useState(""); // staff, patient, appointment
  const [currentItem, setCurrentItem] = useState(null);
  const [generatedToken, setGeneratedToken] = useState("");

  // Data states
  const [branch, setBranch] = useState(null);
  const [staff, setLocalStaff] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [stats, setStats] = useState({});

  // Forms
  const [staffForm, setStaffForm] = useState({
    name: "", position: "", phone: "", email: "", salary: "", status: "active",
    workHours: { start: "09:00", end: "18:00", days: [] }, shift: "Kunduzgi"
  });
  const [patientForm, setPatientForm] = useState({
    name: "", phone: "", gender: "", address: "", dob: "", note: ""
  });
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "", date: "", time: "", procedure: "", doctor: "", status: "reja qilindi", notes: ""
  });

  // Ish kunlari va smena variantlari
  const workDays = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
  const positions = ["Doktor", "Yordamchi", "Hamshira", "Boshliq", "Kassir", "Xizmat ko'rsatish"];
  const shifts = ["Kunduzgi", "Tungi", "Smenali"];

  useEffect(() => {
    loadBranchData();
  }, [branchId]);

  const loadBranchData = () => {
    const branches = getFromLocalStorage("branches", []);
    const currentBranch = branches.find(b => String(b.id) === String(branchId));
    
    if (!currentBranch) {
      setError("Filial topilmadi");
      return;
    }

    setBranch(currentBranch);
    
    // Load branch-specific data
    const allPatients = getFromLocalStorage("patients", []);
    const allAppointments = getFromLocalStorage("appointments", []);
    const allBillings = getFromLocalStorage("billings", []);

    const branchStaff = allStaff.filter(s => String(s.branchId) === String(branchId));
    const branchPatients = allPatients.filter(p => String(p.branchId) === String(branchId));
    const branchAppointments = allAppointments.filter(a => String(a.branchId) === String(branchId));
    const branchBillings = allBillings.filter(b => String(b.branchId) === String(branchId));

    setLocalStaff(branchStaff);
    setPatients(branchPatients);
    setAppointments(branchAppointments);
    setBillings(branchBillings);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = branchAppointments.filter(app => app.date === today);
    const pendingAppointments = branchAppointments.filter(app => app.status === 'kutilmoqda');
    const totalRevenue = branchBillings.reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

    setStats({
      totalStaff: branchStaff.length,
      totalPatients: branchPatients.length,
      todayAppointments: todayAppointments.length,
      pendingAppointments: pendingAppointments.length,
      totalRevenue: totalRevenue,
      monthlyGrowth: "8.2%"
    });
  };

  // Generate random token (12 characters, alphanumeric)
  const generateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Generate token for staff member
  const handleGenerateToken = (staffMember, isAdminToken = false) => {
    const token = generateToken();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const updatedStaff = allStaff.map((s) =>
      s.id === staffMember.id
        ? {
            ...s,
            token: token,
            tokenExpiry: tokenExpiry.toISOString(),
            tokenGeneratedAt: new Date().toISOString(),
            isAdminToken: isAdminToken,
            tokenGeneratedBy: currentUser?.name
          }
        : s
    );

    setStaff(updatedStaff);
    saveToLocalStorage("staff", updatedStaff);
    setGeneratedToken(token);
    
    if (isAdminToken) {
      setAdminTokenModal(true);
    } else {
      setTokenModalOpen(true);
    }
  };

  // Generate Branch Head Token (Filial boshlig'i uchun maxsus token)
  const handleGenerateBranchHeadToken = (staffMember) => {
    const token = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for branch head

    const updatedStaff = allStaff.map(s =>
      s.id === staffMember.id
        ? {
            ...s,
            token: token,
            tokenExpiry: tokenExpiry.toISOString(),
            tokenGeneratedAt: new Date().toISOString(),
            isAdminToken: true,
            isBranchHeadToken: true,
            tokenGeneratedBy: currentUser?.name,
            branchHeadAccess: {
              branchId: branchId,
              permissions: ["staff_management", "patient_management", "appointment_management", "billing_management"]
            }
          }
        : s
    );

    setStaff(updatedStaff);
    saveToLocalStorage("staff", updatedStaff);
    setGeneratedToken(token);
    setAdminTokenModal(true);
  };

  // Check if token is expired
  const isTokenExpired = (staffMember) => {
    if (!staffMember.tokenExpiry) return true;
    return new Date() > new Date(staffMember.tokenExpiry);
  };

  const handleGoBack = () => {
    navigate("/admin");
  };

  // Staff Management
  const handleAddStaff = () => {
    setModalType("staff");
    setCurrentItem(null);
    setStaffForm({
      name: "", position: "", phone: "", email: "", salary: "", status: "active",
      workHours: { start: "09:00", end: "18:00", days: ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"] },
      shift: "Kunduzgi"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditStaff = (staffMember) => {
    setModalType("staff");
    setCurrentItem(staffMember);
    setStaffForm({
      name: staffMember.name,
      position: staffMember.position,
      phone: staffMember.phone,
      email: staffMember.email || "",
      salary: staffMember.salary || "",
      status: staffMember.status || "active",
      workHours: staffMember.workHours || { start: "09:00", end: "18:00", days: [] },
      shift: staffMember.shift || "Kunduzgi"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveStaff = () => {
    setIsLoading(true);
    if (!staffForm.name || !staffForm.position || !staffForm.phone) {
      setError("Ism, lavozim va telefon raqami kiritilishi shart");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(staffForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (staffForm.email && !validateEmail(staffForm.email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }
    if (!staffForm.workHours.days.length) {
      setError("Kamida bitta ish kuni tanlanishi kerak");
      setIsLoading(false);
      return;
    }

    const newStaff = {
      ...staffForm,
      id: currentItem ? currentItem.id : Date.now(),
      branchId: branchId,
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedStaff;

    if (currentItem) {
      updatedStaff = allStaff.map(s => 
        String(s.id) === String(currentItem.id) ? newStaff : s
      );
    } else {
      updatedStaff = [...allStaff, newStaff];
    }

    setStaff(updatedStaff);
    saveToLocalStorage("staff", updatedStaff);
    setLocalStaff(updatedStaff.filter(s => String(s.branchId) === String(branchId)));
    
    loadBranchData();
    setModalOpen(false);
    setSuccessMessage("Xodim muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
      const updatedStaff = allStaff.filter(s => String(s.id) !== String(staffId));
      
      setStaff(updatedStaff);
      saveToLocalStorage("staff", updatedStaff);
      setLocalStaff(updatedStaff.filter(s => String(s.branchId) === String(branchId)));
      
      loadBranchData();
      setSuccessMessage("Xodim muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleWorkDaysChange = (day) => {
    setStaffForm((prev) => {
      const currentDays = Array.isArray(prev.workHours?.days) ? [...prev.workHours.days] : [];
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];

      return {
        ...prev,
        workHours: {
          ...prev.workHours,
          days: updatedDays,
        },
      };
    });
  };

  // Patient Management
  const handleAddPatient = () => {
    setModalType("patient");
    setCurrentItem(null);
    setPatientForm({
      name: "", phone: "", gender: "", address: "", dob: "", note: ""
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditPatient = (patient) => {
    setModalType("patient");
    setCurrentItem(patient);
    setPatientForm({
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender || "",
      address: patient.address || "",
      dob: patient.dob || "",
      note: patient.note || ""
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSavePatient = () => {
    setIsLoading(true);
    if (!patientForm.name || !patientForm.phone) {
      setError("Ism va telefon raqami kiritilishi shart");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(patientForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    const newPatient = {
      ...patientForm,
      id: currentItem ? currentItem.id : Date.now(),
      branchId: branchId,
      prescriptions: currentItem ? currentItem.prescriptions : [],
      toothChart: currentItem ? currentItem.toothChart : [],
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allPatients = getFromLocalStorage("patients", []);
    let updatedPatients;

    if (currentItem) {
      updatedPatients = allPatients.map(p => 
        String(p.id) === String(currentItem.id) ? newPatient : p
      );
    } else {
      updatedPatients = [...allPatients, newPatient];
    }

    setPatients(updatedPatients.filter(p => String(p.branchId) === String(branchId)));
    saveToLocalStorage("patients", updatedPatients);
    
    loadBranchData();
    setModalOpen(false);
    setSuccessMessage("Bemor muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeletePatient = (patientId) => {
    if (window.confirm("Haqiqatan ham bu bemorni o'chirmoqchimisiz?")) {
      const allPatients = getFromLocalStorage("patients", []);
      const updatedPatients = allPatients.filter(p => String(p.id) !== String(patientId));
      
      setPatients(updatedPatients.filter(p => String(p.branchId) === String(branchId)));
      saveToLocalStorage("patients", updatedPatients);
      
      // Also delete related appointments
      const allAppointments = getFromLocalStorage("appointments", []);
      const updatedAppointments = allAppointments.filter(a => String(a.patientId) !== String(patientId));
      saveToLocalStorage("appointments", updatedAppointments);
      
      loadBranchData();
      setSuccessMessage("Bemor muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Appointment Management
  const handleAddAppointment = () => {
    setModalType("appointment");
    setCurrentItem(null);
    setAppointmentForm({
      patientId: "", date: "", time: "", procedure: "", doctor: "", status: "reja qilindi", notes: ""
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditAppointment = (appointment) => {
    setModalType("appointment");
    setCurrentItem(appointment);
    setAppointmentForm({
      patientId: appointment.patientId,
      date: appointment.date,
      time: appointment.time,
      procedure: appointment.procedure,
      doctor: appointment.doctor,
      status: appointment.status,
      notes: appointment.notes || ""
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveAppointment = () => {
    setIsLoading(true);
    if (!appointmentForm.patientId || !appointmentForm.date || !appointmentForm.time || !appointmentForm.procedure) {
      setError("Barcha maydonlar kiritilishi shart");
      setIsLoading(false);
      return;
    }

    const patient = patients.find(p => String(p.id) === String(appointmentForm.patientId));
    if (!patient) {
      setError("Bemor topilmadi");
      setIsLoading(false);
      return;
    }

    const newAppointment = {
      ...appointmentForm,
      id: currentItem ? currentItem.id : Date.now(),
      branchId: branchId,
      patientName: patient.name,
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allAppointments = getFromLocalStorage("appointments", []);
    let updatedAppointments;

    if (currentItem) {
      updatedAppointments = allAppointments.map(a => 
        String(a.id) === String(currentItem.id) ? newAppointment : a
      );
    } else {
      updatedAppointments = [...allAppointments, newAppointment];
    }

    setAppointments(updatedAppointments.filter(a => String(a.branchId) === String(branchId)));
    saveToLocalStorage("appointments", updatedAppointments);
    
    loadBranchData();
    setModalOpen(false);
    setSuccessMessage("Uchrashuv muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteAppointment = (appointmentId) => {
    if (window.confirm("Haqiqatan ham bu uchrashuvni o'chirmoqchimisiz?")) {
      const allAppointments = getFromLocalStorage("appointments", []);
      const updatedAppointments = allAppointments.filter(a => String(a.id) !== String(appointmentId));
      
      setAppointments(updatedAppointments.filter(a => String(a.branchId) === String(branchId)));
      saveToLocalStorage("appointments", updatedAppointments);
      
      loadBranchData();
      setSuccessMessage("Uchrashuv muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtered data
  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAppointments = appointments.filter(a =>
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Admin rolini tekshirish
  const isAdminRole = (role) => {
    return role === "Admin" || role === "Administrator" || role === "Boshliq";
  };

  // Filial boshlig'i rolini tekshirish
  const isBranchHeadRole = (role) => {
    return role === "Boshliq";
  };

  const closeModal = () => {
    setModalOpen(false);
    setTokenModalOpen(false);
    setAdminTokenModal(false);
    setError("");
    setSuccessMessage("");
  };

  // Render functions
  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="overview-header">
        <h2>{branch?.name} - Umumiy ko'rinish</h2>
        <p>{branch?.address}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card staff">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalStaff}</h3>
            <p>Xodimlar</p>
          </div>
        </div>

        <div className="stat-card patients">
          <div className="stat-icon">
            <FiUser />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPatients}</h3>
            <p>Bemorlar</p>
          </div>
        </div>

        <div className="stat-card appointments">
          <div className="stat-icon">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <h3>{stats.todayAppointments}</h3>
            <p>Bugungi uchrashuvlar</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRevenue?.toLocaleString()} so'm</h3>
            <p>Jami daromad</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingAppointments}</h3>
            <p>Kutilayotgan uchrashuvlar</p>
          </div>
        </div>

        <div className="stat-card growth">
          <div className="stat-icon">
            <FiBarChart2 />
          </div>
          <div className="stat-content">
            <h3>{stats.monthlyGrowth}</h3>
            <p>Oylik o'sish</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>So'nggi Faollik</h3>
        <div className="activity-list">
          {appointments.slice(0, 5).map(appointment => (
            <div key={appointment.id} className="activity-item">
              <div className="activity-icon">
                <FiCalendar />
              </div>
              <div className="activity-content">
                <p><strong>{appointment.patientName}</strong> - {appointment.procedure}</p>
                <span>{appointment.date} {appointment.time} • {appointment.doctor}</span>
              </div>
              <div className={`activity-status ${appointment.status}`}>
                {appointment.status === 'amalga oshirildi' ? '✅' : 
                 appointment.status === 'kutilmoqda' ? '⏳' : '📅'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Xodimlar</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Xodimlar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddStaff}>
            <FiPlus /> Yangi Xodim
          </button>
        </div>
      </div>

      <div className="staff-table">
        <table>
          <thead>
            <tr>
              <th>Ism</th>
              <th>Lavozim</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Ish soatlari</th>
              <th>Navbatchilik</th>
              <th>Maosh</th>
              <th>Token</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">Xodimlar topilmadi</td>
              </tr>
            ) : (
              filteredStaff.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className="staff-name">
                      {isBranchHeadRole(member.position) && <FiAward className="admin-crown" />}
                      <FiUser className="staff-icon" />
                      {member.name}
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${isBranchHeadRole(member.position) ? 'role-branch-head' : 'role-staff'}`}>
                      {member.position}
                    </span>
                  </td>
                  <td>{member.phone}</td>
                  <td>{member.email || "-"}</td>
                  <td>
                    {member.workHours ? 
                      `${member.workHours.start} - ${member.workHours.end}` : 
                      "-"
                    }
                  </td>
                  <td>{member.shift || "-"}</td>
                  <td>{member.salary ? `${member.salary.toLocaleString()} so'm` : "-"}</td>
                  <td>
                    <div className="token-status">
                      {member.token && !isTokenExpired(member) ? (
                        <span className={`token-active ${member.isBranchHeadToken ? 'branch-head-token' : ''}`}>
                          {member.isBranchHeadToken ? 'Filial Token' : 'Faol'} 
                          {member.isBranchHeadToken ? ' (24 soat)' : ' (10 daqiqa)'}
                        </span>
                      ) : (
                        <span className="token-inactive">Faol emas</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEditStaff(member)}>
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          if (isBranchHeadRole(member.position)) {
                            handleGenerateBranchHeadToken(member);
                          } else {
                            handleGenerateToken(member, isBranchHeadRole(member.position));
                          }
                        }}
                        className={`btn-token ${isBranchHeadRole(member.position) ? 'btn-branch-head-token' : ''}`}
                        title={
                          isBranchHeadRole(member.position) ? 
                          "Filial boshlig'i token yaratish" : 
                          "Token yaratish"
                        }
                      >
                        <FiKey />
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteStaff(member.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPatientsTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Bemorlar</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Bemorlar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddPatient}>
            <FiPlus /> Yangi Bemor
          </button>
        </div>
      </div>

      <div className="patients-grid">
        {filteredPatients.length === 0 ? (
          <p className="no-data">Bemorlar topilmadi</p>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <h3>{patient.name}</h3>
                <span className="gender-badge">{patient.gender || "Noma'lum"}</span>
              </div>
              <div className="patient-info">
                <div className="info-item">
                  <FiPhone /> {patient.phone}
                </div>
                {patient.address && (
                  <div className="info-item">
                    <FiHome /> {patient.address}
                  </div>
                )}
                {patient.dob && (
                  <div className="info-item">
                    <FiCalendar /> Tug'ilgan: {patient.dob}
                  </div>
                )}
                {patient.note && (
                  <div className="info-item">
                    <FiFileText /> {patient.note}
                  </div>
                )}
              </div>
              <div className="patient-actions">
                <button className="btn-edit" onClick={() => handleEditPatient(patient)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="btn-delete" onClick={() => handleDeletePatient(patient.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Uchrashuvlar</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Uchrashuvlar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddAppointment}>
            <FiPlus /> Yangi Uchrashuv
          </button>
        </div>
      </div>

      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>Bemor</th>
              <th>Sana</th>
              <th>Vaqt</th>
              <th>Protsedura</th>
              <th>Shifokor</th>
              <th>Holati</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Uchrashuvlar topilmadi</td>
              </tr>
            ) : (
              filteredAppointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{appointment.patientName}</td>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.procedure}</td>
                  <td>{appointment.doctor}</td>
                  <td>
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status === 'amalga oshirildi' ? 'Bajarildi' : 
                       appointment.status === 'kutilmoqda' ? 'Kutilmoqda' : 'Rejalashtirilgan'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEditAppointment(appointment)}>
                        <FiEdit />
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteAppointment(appointment.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    switch (modalType) {
      case "staff":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Xodimni tahrirlash" : "Yangi xodim"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            
            <div className="form-sections">
              <div className="form-section">
                <h3>Asosiy Ma'lumotlar</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>To'liq Ism *</label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                      placeholder="Familiya Ism Sharif"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lavozim *</label>
                    <select
                      value={staffForm.position}
                      onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                      required
                    >
                      <option value="">Lavozim tanlang</option>
                      {positions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Telefon *</label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                      placeholder="+998901234567"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Ish Jadvali</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ish boshlash vaqti</label>
                    <input
                      type="time"
                      value={staffForm.workHours.start}
                      onChange={(e) => setStaffForm({
                        ...staffForm, 
                        workHours: {...staffForm.workHours, start: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ish tugash vaqti</label>
                    <input
                      type="time"
                      value={staffForm.workHours.end}
                      onChange={(e) => setStaffForm({
                        ...staffForm, 
                        workHours: {...staffForm.workHours, end: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Navbatchilik</label>
                    <select
                      value={staffForm.shift}
                      onChange={(e) => setStaffForm({...staffForm, shift: e.target.value})}
                    >
                      {shifts.map(shift => (
                        <option key={shift} value={shift}>{shift}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ish Kunlari *</label>
                  <div className="days-checkbox-grid">
                    {workDays.map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={staffForm.workHours.days.includes(day)}
                          onChange={() => handleWorkDaysChange(day)}
                        />
                        <span className="checkmark"></span>
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Maosh Ma'lumotlari</h3>
                <div className="form-group">
                  <label>Oylik Maosh (UZS)</label>
                  <input
                    type="number"
                    value={staffForm.salary}
                    onChange={(e) => setStaffForm({...staffForm, salary: e.target.value})}
                    placeholder="5000000"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Holati</h3>
                <div className="form-group">
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                    <option value="vacation">Ta'tilda</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveStaff}>
                Saqlash
              </button>
            </div>
          </div>
        );

      case "patient":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Bemorni tahrirlash" : "Yangi bemor"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            <div className="form-group">
              <label>Ism</label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                placeholder="To'liq ism"
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={patientForm.phone}
                onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                placeholder="+998901234567"
              />
            </div>
            <div className="form-group">
              <label>Jins</label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
              >
                <option value="">Tanlang</option>
                <option value="Erkak">Erkak</option>
                <option value="Ayol">Ayol</option>
              </select>
            </div>
            <div className="form-group">
              <label>Manzil</label>
              <input
                type="text"
                value={patientForm.address}
                onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                placeholder="Manzil"
              />
            </div>
            <div className="form-group">
              <label>Tug'ilgan sana</label>
              <input
                type="date"
                value={patientForm.dob}
                onChange={(e) => setPatientForm({...patientForm, dob: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Qo'shimcha ma'lumot</label>
              <textarea
                value={patientForm.note}
                onChange={(e) => setPatientForm({...patientForm, note: e.target.value})}
                placeholder="Qo'shimcha ma'lumotlar..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSavePatient}>
                Saqlash
              </button>
            </div>
          </div>
        );

      case "appointment":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Uchrashuvni tahrirlash" : "Yangi uchrashuv"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            <div className="form-group">
              <label>Bemor</label>
              <select
                value={appointmentForm.patientId}
                onChange={(e) => setAppointmentForm({...appointmentForm, patientId: e.target.value})}
                required
              >
                <option value="">Bemor tanlang</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sana</label>
              <input
                type="date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Vaqt</label>
              <input
                type="time"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Protsedura</label>
              <input
                type="text"
                value={appointmentForm.procedure}
                onChange={(e) => setAppointmentForm({...appointmentForm, procedure: e.target.value})}
                placeholder="Protsedura nomi"
                required
              />
            </div>
            <div className="form-group">
              <label>Shifokor</label>
              <input
                type="text"
                value={appointmentForm.doctor}
                onChange={(e) => setAppointmentForm({...appointmentForm, doctor: e.target.value})}
                placeholder="Shifokor ismi"
                required
              />
            </div>
            <div className="form-group">
              <label>Holati</label>
              <select
                value={appointmentForm.status}
                onChange={(e) => setAppointmentForm({...appointmentForm, status: e.target.value})}
              >
                <option value="reja qilindi">Rejalashtirilgan</option>
                <option value="kutilmoqda">Kutilmoqda</option>
                <option value="amalga oshirildi">Amalga oshirildi</option>
                <option value="bekor qilindi">Bekor qilindi</option>
              </select>
            </div>
            <div className="form-group">
              <label>Qo'shimcha ma'lumot</label>
              <textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                placeholder="Qo'shimcha ma'lumotlar..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveAppointment}>
                Saqlash
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!branch) {
    return (
      <div className="admin-for">
        <div className="loading">Filial ma'lumotlari yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="admin-for">
      <div className="admin-for-header">
        <button className="btn-back" onClick={handleGoBack}>
          <FiArrowLeft /> Orqaga
        </button>
        <div className="header-content">
          <h1>{branch.name}</h1>
          <p>{branch.address} • {branch.phone}</p>
        </div>
        <div className="header-actions">
          <div className="branch-status">
            <span className={`status-badge ${branch.status}`}>
              {branch.status === "active" ? "Faol" : "Nofaol"}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiBarChart2 /> Umumiy
          </button>
          <button 
            className={`tab-button ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => setActiveTab("staff")}
          >
            <FiUsers /> Xodimlar
          </button>
          <button 
            className={`tab-button ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            <FiUser /> Bemorlar
          </button>
          <button 
            className={`tab-button ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <FiCalendar /> Uchrashuvlar
          </button>
        </div>
      </div>

      <div className="tab-content-container">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "staff" && renderStaffTab()}
        {activeTab === "patients" && renderPatientsTab()}
        {activeTab === "appointments" && renderAppointmentsTab()}
      </div>

      {successMessage && (
        <div className="alert-success global-alert">
          <FiAward className="alert-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert-error global-alert">
          <span>{error}</span>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          {renderModal()}
        </div>
      )}

      {/* Oddiy token modal oynasi */}
      {tokenModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Token Yaratildi</h2>
              <button type="button" onClick={closeModal} className="close-button">
                <FiX />
              </button>
            </div>
            <div className="token-content">
              <div className="token-display">
                <FiKey className="token-icon" />
                <h3>{generatedToken}</h3>
                <p>Token 10 daqiqa davomida amal qiladi</p>
              </div>
              <div className="token-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    alert("Token nusxalandi!");
                  }}
                  className="btn-primary"
                >
                  <FiCopy /> Nusxalash
                </button>
                <button onClick={closeModal} className="btn-secondary">
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin token modal oynasi */}
      {adminTokenModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content admin-token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filial Boshlig'i Token Yaratildi</h2>
              <button type="button" onClick={closeModal} className="close-button">
                <FiX />
              </button>
            </div>
            <div className="token-content">
              <div className="token-display admin-token-display">
                <FiHome className="token-icon branch-head-icon" />
                <h3>{generatedToken}</h3>
                <p className="admin-token-warning">
                  ⚠️ Diqqat! Bu FILIAL BOSHLIG'I token. Ushbu token orqali kiringan foydalanuvchi 
                  faqat <strong>{branch?.name}</strong> filiali uchun boshqarish huquqiga ega bo'ladi.
                  <br />
                  <strong>Muddati: 24 soat</strong>
                </p>
              </div>
              <div className="token-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    alert("Filial boshlig'i token nusxalandi!");
                  }}
                  className="btn-primary branch-head-copy-btn"
                >
                  <FiCopy /> Nusxalash
                </button>
                <button onClick={closeModal} className="btn-secondary">
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFor;