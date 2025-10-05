// src/components/Admin/AdminDashboard.jsx
import React, { useState, useContext, useEffect } from "react";
import {
  FiSearch, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone, FiKey, FiX, FiAward, FiCopy,
  FiHome, FiUsers, FiShield, FiFileText, FiBarChart2, FiMapPin,
  FiDollarSign, FiTrendingUp, FiActivity, FiDatabase, FiEye
} from "react-icons/fi";
import { AppContext } from "../../App";
import { getFromLocalStorage, saveToLocalStorage, validateEmail, validatePhone, validatePassword } from "../../utils";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { setIsLoading, currentUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("branches");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // branch, admin, insurance, staff
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
  const [stats, setStats] = useState(getFromLocalStorage("systemStats", {}));

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: "", address: "", phone: "", email: "", manager: "", status: "active", branchId: "", token: ""
  });
  const [adminForm, setAdminForm] = useState({
    name: "", email: "", phone: "", password: "", branchId: "", role: "branch_admin"
  });
  const [insuranceForm, setInsuranceForm] = useState({
    name: "", contactName: "", email: "", phone: "", address: "", coverage: "", commission: 0, status: "active"
  });
  const [staffForm, setStaffForm] = useState({
    name: "", position: "", phone: "", email: "", salary: "", branchId: "", status: "active"
  });

  useEffect(() => {
    saveToLocalStorage("branches", branches);
    saveToLocalStorage("admins", admins);
    saveToLocalStorage("insuranceCompanies", insuranceCompanies);
    saveToLocalStorage("staff", staff);
    saveToLocalStorage("billings", billings);
    saveToLocalStorage("patients", patients);
    saveToLocalStorage("appointments", appointments);
    saveToLocalStorage("systemStats", stats);
  }, [branches, admins, insuranceCompanies, staff, billings, patients, appointments, stats]);

  useEffect(() => {
    if (!stats.totalBranches) {
      initializeStats();
    }
  }, []);

  const initializeStats = () => {
    const newStats = {
      totalBranches: branches.length,
      activeBranches: branches.filter(b => b.status === "active").length,
      totalAdmins: admins.length,
      totalStaff: staff.length,
      totalInsurance: insuranceCompanies.length,
      activeInsurance: insuranceCompanies.filter(i => i.status === "active").length,
      totalRevenue: getFromLocalStorage("billings", []).reduce((sum, bill) => sum + (Number(bill.total) || 0), 0),
      monthlyGrowth: "12.5%",
      patientSatisfaction: "4.8/5"
    };
    setStats(newStats);
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const generateBranchId = () => {
    return `BR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handleCopyToken = (token, item, isBranch = false) => {
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopiedTokenId(item.id);
        setSuccessMessage(`${isBranch ? item.name + ' filial' : item.name} token nusxalandi!`);
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

  // Branch Management
  const handleAddBranch = () => {
    setModalType("branch");
    setCurrentItem(null);
    setBranchForm({
      name: "", address: "", phone: "", email: "", manager: "", status: "active", branchId: generateBranchId(), token: generateToken()
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditBranch = (branch) => {
    setModalType("branch");
    setCurrentItem(branch);
    setBranchForm({
      ...branch,
      token: branch.token || generateToken()
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleViewBranch = (branch) => {
    navigate(`/branch/${branch.id}`);
  };

  const handleSaveBranch = () => {
    setIsLoading(true);
    if (!branchForm.name || !branchForm.address || !branchForm.phone) {
      setError("Filial nomi, manzili va telefon raqami kiritilishi shart");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(branchForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(branchForm.email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }

    const newBranch = {
      ...branchForm,
      id: currentItem ? currentItem.id : Date.now(),
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentItem) {
      setBranches(branches.map(b => (b.id === currentItem.id ? newBranch : b)));
    } else {
      setBranches([...branches, newBranch]);
    }
    
    initializeStats();
    setModalOpen(false);
    setSuccessMessage("Filial muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteBranch = (branchId) => {
    if (window.confirm("Haqiqatan ham bu filialni o'chirmoqchimisiz? Barcha bog'liq ma'lumotlar ham o'chib ketadi.")) {
      setBranches(branches.filter(b => b.id !== branchId));
      setAdmins(admins.filter(a => a.branchId !== branchId));
      setStaff(staff.filter(s => s.branchId !== branchId));
      setBillings(billings.filter(b => b.branchId !== branchId));
      setPatients(patients.filter(p => p.branchId !== branchId));
      setAppointments(appointments.filter(a => a.branchId !== branchId));
      initializeStats();
      setSuccessMessage("Filial muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Admin Management (Global and Branch-specific)
  const handleAddAdmin = (branchId = "") => {
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
      branchId: admin.branchId || "",
      role: admin.role || "branch_admin"
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveAdmin = () => {
    setIsLoading(true);
    if (!adminForm.name || !adminForm.email || !adminForm.phone) {
      setError("Barcha maydonlar kiritilishi shart");
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
    
    initializeStats();
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
      initializeStats();
      setSuccessMessage("Admin muvaffaqiyatli o'chirildi");
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
    
    initializeStats();
    setModalOpen(false);
    setSuccessMessage("Sug'urta kompaniyasi muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteInsurance = (insuranceId) => {
    if (window.confirm("Haqiqatan ham bu sug'urta kompaniyasini o'chirmoqchimisiz?")) {
      setInsuranceCompanies(insuranceCompanies.filter(i => i.id !== insuranceId));
      initializeStats();
      setSuccessMessage("Sug'urta kompaniyasi muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Staff Management
  const handleAddStaff = (branchId = "") => {
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
      branchId: staffMember.branchId || "",
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
    
    initializeStats();
    setModalOpen(false);
    setSuccessMessage("Xodim muvaffaqiyatli q'o'shildi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
      setStaff(staff.filter(s => s.id !== staffId));
      initializeStats();
      setSuccessMessage("Xodim muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtered data (Global)
  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  );

  const filteredInsurance = insuranceCompanies.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  // Render functions for main admin
  const renderBranchesTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Filiallar</h2>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Filiallar bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleAddBranch}>
            <FiPlus /> Yangi Filial
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert-success">
          <FiAward className="alert-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="branches-grid">
        {filteredBranches.length === 0 ? (
          <p className="no-data">Filiallar topilmadi</p>
        ) : (
          filteredBranches.map(branch => (
            <div key={branch.id} className="branch-card">
              <div className="branch-header">
                <h3>{branch.name}</h3>
                <span className={`status-badge ${branch.status}`}>{branch.status === "active" ? "Faol" : "Nofaol"}</span>
              </div>
              <div className="branch-info">
                <div className="info-item">
                  <FiMapPin /> {branch.address}
                </div>
                <div className="info-item">
                  <FiPhone /> {branch.phone}
                </div>
                <div className="info-item">
                  <FiMail /> {branch.email}
                </div>
                <div className="info-item">
                  <FiUsers /> Menejer: {branch.manager}
                </div>
                <div className="info-item token-item">
                  <div className="token-text">
                    <FiKey /> Token: {branch.token}
                  </div>
                  <button
                    className={`btn-copy ${copiedTokenId === branch.id ? 'copied' : ''}`}
                    onClick={() => handleCopyToken(branch.token, branch, true)}
                    title="Tokenni nusxalash"
                  >
                    <FiCopy />
                    <span>{copiedTokenId === branch.id ? "Nusxalandi!" : "Nusxalash"}</span>
                  </button>
                </div>
              </div>
              <div className="branch-actions">
                <button className="btn-edit" onClick={() => handleEditBranch(branch)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="btn-delete" onClick={() => handleDeleteBranch(branch.id)}>
                  <FiTrash2 /> O'chirish
                </button>
                <button className="btn-view" onClick={() => handleViewBranch(branch)}>
                  <FiEye /> Batafsil
                </button>
              </div>
            </div>
          ))
        )}
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
          <button className="btn-primary" onClick={() => handleAddAdmin()}>
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
          filteredAdmins.map(admin => {
            const branch = branches.find(b => b.id === admin.branchId);
            return (
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
                  <div className="info-item">
                    <FiHome /> Filial: {branch ? branch.name : "Umumiy"}
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
            );
          })
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
          <button className="btn-primary" onClick={() => handleAddStaff()}>
            <FiPlus /> Yangi Xodim
          </button>
        </div>
      </div>

      <div className="staff-grid">
        {filteredStaff.length === 0 ? (
          <p className="no-data">Xodimlar topilmadi</p>
        ) : (
          filteredStaff.map(member => {
            const branch = branches.find(b => b.id === member.branchId);
            return (
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
                    <FiHome /> Filial: {branch ? branch.name : "Belgilanmagan"}
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
            );
          })
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="tab-content">
      <div className="page-header">
        <h2>Tizim Statistika</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={initializeStats}>
            <FiDatabase /> Ma'lumotlarni yangilash
          </button>
        </div>
      </div>

      <div className="stats-dashboard">
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>{stats.totalRevenue?.toLocaleString()} so'm</h3>
              <p>Jami daromad</p>
            </div>
          </div>
          
          <div className="stat-card branches">
            <div className="stat-icon">
              <FiHome />
            </div>
            <div className="stat-content">
              <h3>{stats.totalBranches}</h3>
              <p>Filiallar soni</p>
            </div>
          </div>

          <div className="stat-card admins">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats.totalAdmins}</h3>
              <p>Administratorlar</p>
            </div>
          </div>

          <div className="stat-card staff">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-content">
              <h3>{stats.totalStaff}</h3>
              <p>Xodimlar soni</p>
            </div>
          </div>

          <div className="stat-card insurance">
            <div className="stat-icon">
              <FiShield />
            </div>
            <div className="stat-content">
              <h3>{stats.totalInsurance}</h3>
              <p>Sug'urta kompaniyalari</p>
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

        <div className="charts-section">
          <div className="chart-card">
            <h4>Filiallar bo'yicha daromad</h4>
            <div className="chart-placeholder">
              <FiBarChart2 size={48} />
              <p>Grafik ma'lumotlari bu yerda ko'rsatiladi</p>
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Xodimlar faolligi</h4>
            <div className="chart-placeholder">
              <FiActivity size={48} />
              <p>Faollik hisoboti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    switch (modalType) {
      case "branch":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Filialni tahrirlash" : "Yangi filial"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            <div className="form-group">
              <label>Filial nomi</label>
              <input
                type="text"
                value={branchForm.name}
                onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                placeholder="Filial nomini kiriting"
              />
            </div>
            <div className="form-group">
              <label>Manzil</label>
              <input
                type="text"
                value={branchForm.address}
                onChange={(e) => setBranchForm({...branchForm, address: e.target.value})}
                placeholder="To'liq manzil"
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})}
                placeholder="+998901234567"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={branchForm.email}
                onChange={(e) => setBranchForm({...branchForm, email: e.target.value})}
                placeholder="filial@example.com"
              />
            </div>
            <div className="form-group">
              <label>Menejer ismi</label>
              <input
                type="text"
                value={branchForm.manager}
                onChange={(e) => setBranchForm({...branchForm, manager: e.target.value})}
                placeholder="Menejer to'liq ismi"
              />
            </div>
            <div className="form-group">
              <label>Holati</label>
              <select
                value={branchForm.status}
                onChange={(e) => setBranchForm({...branchForm, status: e.target.value})}
              >
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>
            <div className="form-group">
              <label>Token</label>
              <input
                type="text"
                value={branchForm.token}
                readOnly
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveBranch}>
                Saqlash
              </button>
            </div>
          </div>
        );

      case "admin":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Adminni tahrirlash" : "Yangi admin"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            <div className="form-group">
              <label>Ism</label>
              <input
                type="text"
                value={adminForm.name}
                onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                placeholder="Ismni kiriting"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                placeholder="Email kiriting"
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({...adminForm, phone: e.target.value})}
                placeholder="+998901234567"
              />
            </div>
            <div className="form-group">
              <label>Parol {currentItem ? "(ixtiyoriy)" : ""}</label>
              <input
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                placeholder="Parolni kiriting"
              />
            </div>
            <div className="form-group">
              <label>Filial</label>
              <select
                value={adminForm.branchId}
                onChange={(e) => setAdminForm({...adminForm, branchId: e.target.value})}
              >
                <option value="">Umumiy (Filial emas)</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select
                value={adminForm.role}
                onChange={(e) => setAdminForm({...adminForm, role: e.target.value})}
              >
                <option value="branch_admin">Filial Admini</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveAdmin}>
                Saqlash
              </button>
            </div>
          </div>
        );

      case "insurance":
        return (
          <div className="modal">
            <div className="modal-header">
              <h2>{currentItem ? "Kompaniyani tahrirlash" : "Yangi sug'urta kompaniyasi"}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>
            {error && <div className="alert-error"><span>{error}</span></div>}
            <div className="form-group">
              <label>Kompaniya nomi</label>
              <input
                type="text"
                value={insuranceForm.name}
                onChange={(e) => setInsuranceForm({...insuranceForm, name: e.target.value})}
                placeholder="Kompaniya nomini kiriting"
              />
            </div>
            <div className="form-group">
              <label>Kontakt shaxs</label>
              <input
                type="text"
                value={insuranceForm.contactName}
                onChange={(e) => setInsuranceForm({...insuranceForm, contactName: e.target.value})}
                placeholder="Kontakt shaxs ismi"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={insuranceForm.email}
                onChange={(e) => setInsuranceForm({...insuranceForm, email: e.target.value})}
                placeholder="email@company.com"
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={insuranceForm.phone}
                onChange={(e) => setInsuranceForm({...insuranceForm, phone: e.target.value})}
                placeholder="+998901234567"
              />
            </div>
            <div className="form-group">
              <label>Manzil</label>
              <input
                type="text"
                value={insuranceForm.address}
                onChange={(e) => setInsuranceForm({...insuranceForm, address: e.target.value})}
                placeholder="Kompaniya manzili"
              />
            </div>
            <div className="form-group">
              <label>Qamrov turi</label>
              <input
                type="text"
                value={insuranceForm.coverage}
                onChange={(e) => setInsuranceForm({...insuranceForm, coverage: e.target.value})}
                placeholder="Qamrov turlari (masalan: ortodontiya, implantologiya)"
              />
            </div>
            <div className="form-group">
              <label>Komissiya foizi (%)</label>
              <input
                type="number"
                value={insuranceForm.commission}
                onChange={(e) => setInsuranceForm({...insuranceForm, commission: parseFloat(e.target.value) || 0})}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Holati</label>
              <select
                value={insuranceForm.status}
                onChange={(e) => setInsuranceForm({...insuranceForm, status: e.target.value})}
              >
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveInsurance}>
                Saqlash
              </button>
            </div>
          </div>
        );

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
            <div className="form-group">
              <label>Ism</label>
              <input
                type="text"
                value={staffForm.name}
                onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                placeholder="To'liq ism"
              />
            </div>
            <div className="form-group">
              <label>Lavozim</label>
              <input
                type="text"
                value={staffForm.position}
                onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                placeholder="Lavozim (masalan: Stomatolog, Hamshira)"
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                placeholder="+998901234567"
              />
            </div>
            <div className="form-group">
              <label>Email (ixtiyoriy)</label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Maosh (so'm)</label>
              <input
                type="number"
                value={staffForm.salary}
                onChange={(e) => setStaffForm({...staffForm, salary: e.target.value})}
                placeholder="4000000"
              />
            </div>
            <div className="form-group">
              <label>Filial</label>
              <select
                value={staffForm.branchId}
                onChange={(e) => setStaffForm({...staffForm, branchId: e.target.value})}
                required
              >
                <option value="">Filial tanlang</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Holati</label>
              <select
                value={staffForm.status}
                onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
              >
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
                <option value="vacation">Ta'tilda</option>
              </select>
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

      default:
        return null;
    }
  };

  return (
    <div className="admin-panel">
      <div className="management-header">
        <h1><FiHome /> Admin Panel</h1>
        <p>Klinika tarmog'ini markazlashgan boshqarish</p>
        {currentUser && (
          <div className="current-user">
            <FiUsers /> Joriy foydalanuvchi: {currentUser.name} ({currentUser.role === "super_admin" ? "Super Admin" : "Filial Admini"})
          </div>
        )}
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === "branches" ? "active" : ""}`}
            onClick={() => setActiveTab("branches")}
          >
            <FiHome /> Filiallar
          </button>
          <button 
            className={`tab-button ${activeTab === "admins" ? "active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            <FiUsers /> Administratorlar
          </button>
          <button 
            className={`tab-button ${activeTab === "insurance" ? "active" : ""}`}
            onClick={() => setActiveTab("insurance")}
          >
            <FiShield /> Sug'urta
          </button>
          <button 
            className={`tab-button ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => setActiveTab("staff")}
          >
            <FiActivity /> Xodimlar
          </button>
          <button 
            className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <FiBarChart2 /> Statistika
          </button>
        </div>
      </div>

      <div className="tab-content-container">
        {activeTab === "branches" && renderBranchesTab()}
        {activeTab === "admins" && renderAdminsTab()}
        {activeTab === "insurance" && renderInsuranceTab()}
        {activeTab === "staff" && renderStaffTab()}
        {activeTab === "stats" && renderStatsTab()}
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
    </div>
  );
};

export default AdminDashboard;