// src/components/Admin/BranchManagement.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiSearch, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone, FiKey, FiX, FiAward, FiCopy,
  FiHome, FiUsers, FiShield, FiFileText, FiBarChart2, FiMapPin,
  FiDollarSign, FiTrendingUp, FiActivity, FiArrowLeft
} from "react-icons/fi";
import { AppContext } from "../../App";
import { getFromLocalStorage, saveToLocalStorage, validateEmail, validatePhone, validatePassword } from "../../utils";
import "./BranchManagement.css";

const BranchManagement = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { setIsLoading, currentUser } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // admin, insurance, staff
  const [currentItem, setCurrentItem] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  // Data states
  const [branches, setBranches] = useState(getFromLocalStorage("branches", []));
  const [admins, setAdmins] = useState(getFromLocalStorage("admins", []));
  const [insuranceCompanies, setInsuranceCompanies] = useState(getFromLocalStorage("insuranceCompanies", []));
  const [staff, setStaff] = useState(getFromLocalStorage("staff", []));
  const [billings, setBillings] = useState(getFromLocalStorage("billings", []));
  const [patients, setPatients] = useState(getFromLocalStorage("patients", []));
  const [appointments, setAppointments] = useState(getFromLocalStorage("appointments", []));

  // Forms
  const [adminForm, setAdminForm] = useState({
    name: "", email: "", phone: "", password: "", branchId, role: "branch_admin"
  });
  const [insuranceForm, setInsuranceForm] = useState({
    name: "", contactName: "", email: "", phone: "", address: "", coverage: "", commission: 0, status: "active"
  });
  const [staffForm, setStaffForm] = useState({
    name: "", position: "", phone: "", email: "", salary: "", branchId, status: "active"
  });

  // Find the current branch
  const branch = branches.find(b => b.id === parseInt(branchId)) || {};

  // Save data to localStorage with dependency array to avoid unnecessary updates
  useEffect(() => {
    saveToLocalStorage("branches", branches);
  }, [branches]);

  useEffect(() => {
    saveToLocalStorage("admins", admins);
  }, [admins]);

  useEffect(() => {
    saveToLocalStorage("insuranceCompanies", insuranceCompanies);
  }, [insuranceCompanies]);

  useEffect(() => {
    saveToLocalStorage("staff", staff);
  }, [staff]);

  useEffect(() => {
    saveToLocalStorage("billings", billings);
  }, [billings]);

  useEffect(() => {
    saveToLocalStorage("patients", patients);
  }, [patients]);

  useEffect(() => {
    saveToLocalStorage("appointments", appointments);
  }, [appointments]);

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleCopyToken = (token, admin) => {
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopiedTokenId(admin.id);
        setSuccessMessage(`${admin.name} token nusxalandi!`);
        setTimeout(() => {
          setCopiedTokenId(null);
          setSuccessMessage("");
        }, 2000);
      })
      .catch(() => {
        setError("Tokenni nusxalashda xatolik yuz berdi");
        setTimeout(() => setError(""), 3000);
      });
  };

  // Admin Management
  const handleAddAdmin = () => {
    setModalType("admin");
    setCurrentItem(null);
    setAdminForm({
      name: "", email: "", phone: "", password: "", branchId, role: "branch_admin"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditAdmin = (admin) => {
    setModalType("admin");
    setCurrentItem(admin);
    setAdminForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: "",
      branchId: admin.branchId || branchId,
      role: admin.role || "branch_admin"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveAdmin = () => {
    setIsLoading(true);
    if (!adminForm.name || !adminForm.email || !adminForm.phone || !adminForm.branchId) {
      setError("Barcha maydonlar va filial tanlanishi shart");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(adminForm.email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(adminForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!currentItem && !adminForm.password) {
      setError("Yangi admin uchun parol kiritilishi shart");
      setIsLoading(false);
      return;
    }
    if (adminForm.password && !validatePassword(adminForm.password)) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    const newAdmin = {
      ...adminForm,
      id: currentItem ? currentItem.id : Date.now(),
      token: currentItem ? currentItem.token : generateToken(),
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isAdminToken: true,
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentItem) {
      setAdmins(admins.map(a => (a.id === currentItem.id ? newAdmin : a)));
    } else {
      setAdmins([...admins, newAdmin]);
    }

    setModalOpen(false);
    setSuccessMessage("Admin muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteAdmin = (adminId) => {
    if (window.confirm("Haqiqatan ham bu adminni o'chirmoqchimisiz?")) {
      if (admins.find(a => a.id === adminId)?.email === currentUser?.email) {
        setError("O'zingizni o'chira olmaysiz!");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setAdmins(admins.filter(a => a.id !== adminId));
      setSuccessMessage("Admin muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Staff Management
  const handleAddStaff = () => {
    setModalType("staff");
    setCurrentItem(null);
    setStaffForm({
      name: "", position: "", phone: "", email: "", salary: "", branchId, status: "active"
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
      branchId: staffMember.branchId || branchId,
      status: staffMember.status || "active"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveStaff = () => {
    setIsLoading(true);
    if (!staffForm.name || !staffForm.position || !staffForm.phone || !staffForm.branchId) {
      setError("Barcha maydonlar va filial tanlanishi shart");
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

    const newStaff = {
      ...staffForm,
      id: currentItem ? currentItem.id : Date.now(),
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentItem) {
      setStaff(staff.map(s => (s.id === currentItem.id ? newStaff : s)));
    } else {
      setStaff([...staff, newStaff]);
    }

    setModalOpen(false);
    setSuccessMessage("Xodim muvaffaqiyatli qo'shildi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
      setStaff(staff.filter(s => s.id !== staffId));
      setSuccessMessage("Xodim muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Insurance Management
  const handleAddInsurance = () => {
    setModalType("insurance");
    setCurrentItem(null);
    setInsuranceForm({
      name: "", contactName: "", email: "", phone: "", address: "", coverage: "", commission: 0, status: "active"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditInsurance = (insurance) => {
    setModalType("insurance");
    setCurrentItem(insurance);
    setInsuranceForm({
      name: insurance.name,
      contactName: insurance.contactName,
      email: insurance.email,
      phone: insurance.phone,
      address: insurance.address,
      coverage: insurance.coverage,
      commission: insurance.commission,
      status: insurance.status
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveInsurance = () => {
    setIsLoading(true);
    if (!insuranceForm.name || !insuranceForm.contactName || !insuranceForm.phone) {
      setError("Kompaniya nomi, kontakt shaxs va telefon raqami kiritilishi shart");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(insuranceForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(insuranceForm.email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }

    const newInsurance = {
      ...insuranceForm,
      id: currentItem ? currentItem.id : Date.now(),
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentItem) {
      setInsuranceCompanies(insuranceCompanies.map(i => (i.id === currentItem.id ? newInsurance : i)));
    } else {
      setInsuranceCompanies([...insuranceCompanies, newInsurance]);
    }

    setModalOpen(false);
    setSuccessMessage("Sug'urta kompaniyasi muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteInsurance = (insuranceId) => {
    if (window.confirm("Haqiqatan ham bu sug'urta kompaniyasini o'chirmoqchimisiz?")) {
      setInsuranceCompanies(insuranceCompanies.filter(i => i.id !== insuranceId));
      setSuccessMessage("Sug'urta kompaniyasi muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtered data for the selected branch
  const filteredAdmins = admins.filter(a =>
    a.branchId === branchId && (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone.includes(searchTerm)
    )
  );

  const filteredStaff = staff.filter(s =>
    s.branchId === branchId && (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    )
  );

  const filteredInsurance = insuranceCompanies.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    p.branchId === branchId && (
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    )
  );

  const filteredAppointments = appointments.filter(a =>
    a.branchId === branchId && (
      a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Branch-specific statistics
  const branchStats = {
    revenue: billings.filter(b => b.branchId === branchId).reduce((sum, bill) => sum + (Number(bill.total) || 0), 0),
    staffCount: staff.filter(s => s.branchId === branchId).length,
    adminCount: admins.filter(a => a.branchId === branchId).length,
    patientCount: patients.filter(p => p.branchId === branchId).length,
    appointmentCount: appointments.filter(a => a.branchId === branchId).length
  };

  // Chart data for branch revenue (by month)
  const revenueData = billings
    .filter(b => b.branchId === branchId)
    .reduce((acc, bill) => {
      const date = new Date(bill.createdAt).toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
      acc[date] = (acc[date] || 0) + (Number(bill.total) || 0);
      return acc;
    }, {});
  
  const chartLabels = Object.keys(revenueData);
  const chartValues = Object.values(revenueData);

  // Render functions
  const renderOverviewTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>{branch.name} - Umumiy ma'lumot</h2>
      </div>
      <div className="branch-details">
        <div className="detail-section">
          <h3>Filial ma'lumotlari</h3>
          <p><FiMapPin /> Manzil: {branch.address || "Manzil kiritilmagan"}</p>
          <p><FiPhone /> Telefon: {branch.phone || "Telefon kiritilmagan"}</p>
          <p><FiMail /> Email: {branch.email || "Email kiritilmagan"}</p>
          <p><FiUsers /> Menejer: {branch.manager || "Menejer kiritilmagan"}</p>
          <p><FiActivity /> Status: {branch.status === "active" ? "Faol" : "Nofaol"}</p>
          <p><FiKey /> Token: {branch.token || "Token mavjud emas"}</p>
        </div>
        <div className="detail-section">
          <h3>Statistika</h3>
          <p><FiDollarSign /> Jami daromad: {branchStats.revenue.toLocaleString()} so'm</p>
          <p><FiUsers /> Xodimlar soni: {branchStats.staffCount}</p>
          <p><FiUsers /> Adminlar soni: {branchStats.adminCount}</p>
          <p><FiUsers /> Bemorlar soni: {branchStats.patientCount}</p>
          <p><FiFileText /> Uchrashuvlar soni: {branchStats.appointmentCount}</p>
        </div>
      </div>
    </div>
  );

  const renderAdminsTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Administratorlar</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Adminlar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddAdmin}>
            <FiPlus /> Yangi Admin
          </button>
        </div>
      </div>
      {successMessage && (
        <div className="alert-success">
          <FiAward className="alert-icon" />
          <span>{successMessage}</span>
        </div>
      )}
      <div className="admin-grid">
        {filteredAdmins.length === 0 ? (
          <p className="no-data">Adminlar topilmadi</p>
        ) : (
          filteredAdmins.map(admin => (
            <div key={admin.id} className="admin-card">
              <div className="admin-header">
                <h3>{admin.name}</h3>
                <span className="status-badge status-admin">{admin.role === "super_admin" ? "Super Admin" : "Filial Admini"}</span>
              </div>
              <div className="admin-info">
                <div className="info-item">
                  <FiMail /> {admin.email}
                </div>
                <div className="info-item">
                  <FiPhone /> {admin.phone}
                </div>
                <div className="info-item token-item">
                  <div className="token-text">
                    <FiKey /> Token: {admin.token}
                  </div>
                  <button
                    className={`btn-copy ${copiedTokenId === admin.id ? 'copied' : ''}`}
                    onClick={() => handleCopyToken(admin.token, admin)}
                    title="Tokenni nusxalash"
                  >
                    <FiCopy />
                    <span>{copiedTokenId === admin.id ? "Nusxalandi!" : "Nusxalash"}</span>
                  </button>
                </div>
              </div>
              <div className="admin-actions">
                <button className="btn-edit" onClick={() => handleEditAdmin(admin)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="btn-delete" onClick={() => handleDeleteAdmin(admin.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
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
      {successMessage && (
        <div className="alert-success">
          <FiAward className="alert-icon" />
          <span>{successMessage}</span>
        </div>
      )}
      <div className="staff-grid">
        {filteredStaff.length === 0 ? (
          <p className="no-data">Xodimlar topilmadi</p>
        ) : (
          filteredStaff.map(member => (
            <div key={member.id} className="staff-card">
              <div className="staff-header">
                <h3>{member.name}</h3>
                <span className="status-badge staff-status">{member.position}</span>
              </div>
              <div className="staff-info">
                <div className="info-item">
                  <FiPhone /> {member.phone}
                </div>
                <div className="info-item">
                  <FiMail /> {member.email || "Email kiritilmagan"}
                </div>
                <div className="info-item">
                  <FiDollarSign /> Maosh: {member.salary ? `${member.salary.toLocaleString()} so'm` : "Belgilanmagan"}
                </div>
              </div>
              <div className="staff-actions">
                <button className="btn-edit" onClick={() => handleEditStaff(member)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="btn-delete" onClick={() => handleDeleteStaff(member.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderInsuranceTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Sug'urta Kompaniyalari</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Kompaniyalar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddInsurance}>
            <FiPlus /> Yangi Kompaniya
          </button>
        </div>
      </div>
      <div className="insurance-grid">
        {filteredInsurance.length === 0 ? (
          <p className="no-data">Sug'urta kompaniyalari topilmadi</p>
        ) : (
          filteredInsurance.map(company => (
            <div key={company.id} className="insurance-card">
              <div className="insurance-header">
                <h3>{company.name}</h3>
                <span className={`status-badge ${company.status}`}>{company.status === "active" ? "Faol" : "Nofaol"}</span>
              </div>
              <div className="insurance-info">
                <div className="info-item">
                  <FiShield /> Kontakt: {company.contactName}
                </div>
                <div className="info-item">
                  <FiPhone /> {company.phone}
                </div>
                <div className="info-item">
                  <FiMail /> {company.email}
                </div>
                <div className="info-item">
                  <FiMapPin /> {company.address}
                </div>
                <div className="info-item">
                  <FiDollarSign /> Komissiya: {company.commission}%
                </div>
                <div className="info-item">
                  <FiFileText /> Qamrov: {company.coverage}
                </div>
              </div>
              <div className="insurance-actions">
                <button className="btn-edit" onClick={() => handleEditInsurance(company)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="btn-delete" onClick={() => handleDeleteInsurance(company.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
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
        </div>
      </div>
      <div className="patients-grid">
        {filteredPatients.length === 0 ? (
          <p className="no-data">Bemorlar topilmadi</p>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="patient-card">
              <div className="patient-header">
                <h3>{patient.name || "Noma'lum"}</h3>
              </div>
              <div className="patient-info">
                <div className="info-item">
                  <FiPhone /> {patient.phone || "Telefon kiritilmagan"}
                </div>
                <div className="info-item">
                  <FiMail /> {patient.email || "Email kiritilmagan"}
                </div>
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
        </div>
      </div>
      <div className="appointments-grid">
        {filteredAppointments.length === 0 ? (
          <p className="no-data">Uchrashuvlar topilmadi</p>
        ) : (
          filteredAppointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header">
                <h3>{appointment.patientName || "Noma'lum"}</h3>
                <span className={`status-badge ${appointment.status}`}>
                  {appointment.status === "scheduled" ? "Rejalashtirilgan" : appointment.status === "completed" ? "Yakunlangan" : "Bekor qilingan"}
                </span>
              </div>
              <div className="appointment-info">
                <div className="info-item">
                  <FiUsers /> Doktor: {appointment.doctorName || "Noma'lum"}
                </div>
                <div className="info-item">
                  <FiFileText /> Sana: {new Date(appointment.date).toLocaleString('uz-UZ')}
                </div>
                <div className="info-item">
                  <FiFileText /> Xizmat: {appointment.service || "Kiritilmagan"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>{branch.name} - Statistika</h2>
      </div>
      <div className="stats-dashboard">
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>{branchStats.revenue.toLocaleString()} so'm</h3>
              <p>Jami daromad</p>
            </div>
          </div>
          <div className="stat-card staff">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-content">
              <h3>{branchStats.staffCount}</h3>
              <p>Xodimlar soni</p>
            </div>
          </div>
          <div className="stat-card admins">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{branchStats.adminCount}</h3>
              <p>Administratorlar</p>
            </div>
          </div>
          <div className="stat-card patients">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{branchStats.patientCount}</h3>
              <p>Bemorlar soni</p>
            </div>
          </div>
          <div className="stat-card appointments">
            <div className="stat-icon">
              <FiFileText />
            </div>
            <div className="stat-content">
              <h3>{branchStats.appointmentCount}</h3>
              <p>Uchrashuvlar soni</p>
            </div>
          </div>
        </div>
        {chartLabels.length > 0 && (
          <div className="charts-section">
            <div className="chart-card">
              <h4>Oylik daromad</h4>
              {/* Chart component would go here */}
              <div className="chart-placeholder">
                <p>Chart will be displayed here with data:</p>
                <p>Labels: {chartLabels.join(', ')}</p>
                <p>Values: {chartValues.join(', ')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderModal = () => {
    switch (modalType) {
      case "admin":
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{currentItem ? "Adminni tahrirlash" : "Yangi admin"}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              {error && <div className="alert-error">{error}</div>}
              <div className="modal-body">
                <div className="form-group">
                  <label>Ism</label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="Ismni kiriting"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="Email kiriting"
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                    placeholder="+998901234567"
                  />
                </div>
                <div className="form-group">
                  <label>Parol {currentItem ? "(ixtiyoriy)" : ""}</label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Parolni kiriting"
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select 
                    value={adminForm.role} 
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  >
                    <option value="branch_admin">Filial Admini</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Bekor qilish
                </button>
                <button className="btn-primary" onClick={handleSaveAdmin}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        );
      case "insurance":
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{currentItem ? "Kompaniyani tahrirlash" : "Yangi sug'urta kompaniyasi"}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              {error && <div className="alert-error">{error}</div>}
              <div className="modal-body">
                <div className="form-group">
                  <label>Kompaniya nomi</label>
                  <input
                    type="text"
                    value={insuranceForm.name}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                    placeholder="Kompaniya nomini kiriting"
                  />
                </div>
                <div className="form-group">
                  <label>Kontakt shaxs</label>
                  <input
                    type="text"
                    value={insuranceForm.contactName}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, contactName: e.target.value })}
                    placeholder="Kontakt shaxs ismi"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={insuranceForm.email}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, email: e.target.value })}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={insuranceForm.phone}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, phone: e.target.value })}
                    placeholder="+998901234567"
                  />
                </div>
                <div className="form-group">
                  <label>Manzil</label>
                  <input
                    type="text"
                    value={insuranceForm.address}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, address: e.target.value })}
                    placeholder="Kompaniya manzili"
                  />
                </div>
                <div className="form-group">
                  <label>Qamrov turi</label>
                  <input
                    type="text"
                    value={insuranceForm.coverage}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, coverage: e.target.value })}
                    placeholder="Qamrov turlari (masalan: ortodontiya, implantologiya)"
                  />
                </div>
                <div className="form-group">
                  <label>Komissiya foizi (%)</label>
                  <input
                    type="number"
                    value={insuranceForm.commission}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, commission: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Holati</label>
                  <select 
                    value={insuranceForm.status} 
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, status: e.target.value })}
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Bekor qilish
                </button>
                <button className="btn-primary" onClick={handleSaveInsurance}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        );
      case "staff":
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{currentItem ? "Xodimni tahrirlash" : "Yangi xodim"}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              {error && <div className="alert-error">{error}</div>}
              <div className="modal-body">
                <div className="form-group">
                  <label>Ism</label>
                  <input
                    type="text"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="To'liq ism"
                  />
                </div>
                <div className="form-group">
                  <label>Lavozim</label>
                  <input
                    type="text"
                    value={staffForm.position}
                    onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                    placeholder="Lavozim (masalan: Stomatolog, Hamshira)"
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+998901234567"
                  />
                </div>
                <div className="form-group">
                  <label>Email (ixtiyoriy)</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Maosh (so'm)</label>
                  <input
                    type="number"
                    value={staffForm.salary}
                    onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                    placeholder="4000000"
                  />
                </div>
                <div className="form-group">
                  <label>Holati</label>
                  <select 
                    value={staffForm.status} 
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                    <option value="vacation">Ta'tilda</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Bekor qilish
                </button>
                <button className="btn-primary" onClick={handleSaveStaff}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="branch-management">
      <div className="page-header">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Orqaga
        </button>
        <h1><FiHome /> {branch.name || "Filial"} - Filial boshqaruvi</h1>
        <p>{branch.address || "Manzil kiritilmagan"}</p>
        {currentUser && (
          <p><FiUsers /> Joriy foydalanuvchi: {currentUser.name} ({currentUser.role === "super_admin" ? "Super Admin" : "Filial Admini"})</p>
        )}
      </div>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === "overview" ? "active" : ""}`} 
          onClick={() => setActiveTab("overview")}
        >
          <FiFileText /> Umumiy
        </button>
        <button 
          className={`tab-button ${activeTab === "admins" ? "active" : ""}`} 
          onClick={() => setActiveTab("admins")}
        >
          <FiUsers /> Administratorlar
        </button>
        <button 
          className={`tab-button ${activeTab === "staff" ? "active" : ""}`} 
          onClick={() => setActiveTab("staff")}
        >
          <FiActivity /> Xodimlar
        </button>
        <button 
          className={`tab-button ${activeTab === "insurance" ? "active" : ""}`} 
          onClick={() => setActiveTab("insurance")}
        >
          <FiShield /> Sug'urta
        </button>
        <button 
          className={`tab-button ${activeTab === "patients" ? "active" : ""}`} 
          onClick={() => setActiveTab("patients")}
        >
          <FiUsers /> Bemorlar
        </button>
        <button 
          className={`tab-button ${activeTab === "appointments" ? "active" : ""}`} 
          onClick={() => setActiveTab("appointments")}
        >
          <FiFileText /> Uchrashuvlar
        </button>
        <button 
          className={`tab-button ${activeTab === "stats" ? "active" : ""}`} 
          onClick={() => setActiveTab("stats")}
        >
          <FiBarChart2 /> Statistika
        </button>
      </div>

      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "admins" && renderAdminsTab()}
      {activeTab === "staff" && renderStaffTab()}
      {activeTab === "insurance" && renderInsuranceTab()}
      {activeTab === "patients" && renderPatientsTab()}
      {activeTab === "appointments" && renderAppointmentsTab()}
      {activeTab === "stats" && renderStatsTab()}

      {successMessage && (
        <div className="alert-success">
          <FiAward className="alert-icon" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}
      {modalOpen && (
        <div className="modal">
          {renderModal()}
        </div>
      )}
    </div>
  );
};

export default BranchManagement;