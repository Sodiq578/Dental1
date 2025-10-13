import React, { useState, useContext, useEffect } from "react";
import {
  FiSearch, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone, FiKey, FiX, FiAward, FiCopy,
  FiHome, FiUsers, FiShield, FiFileText, FiBarChart2, FiMapPin,
  FiDollarSign, FiTrendingUp, FiActivity, FiDatabase, FiEye, FiCheck, FiXCircle,
  FiRefreshCw, FiPercent, FiTag, FiPackage, FiCalendar
} from "react-icons/fi";
import { AppContext } from "../../App";
import {
  getFromLocalStorage,
  saveToLocalStorage,
  validateEmail,
  validatePhone,
  validatePassword,
  getPendingAdminRequests,
  updatePendingAdminRequest
} from "../../utils";
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
  const [modalType, setModalType] = useState(""); // filial, admin, sugurta, xodim, chegirma
  const [currentItem, setCurrentItem] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  // Ma'lumotlar holatlari
  const [branches, setBranches] = useState(getFromLocalStorage("branches", []));
  const [admins, setAdmins] = useState(getFromLocalStorage("admins", []));
  const [insuranceCompanies, setInsuranceCompanies] = useState(getFromLocalStorage("insuranceCompanies", []));
  const [staff, setStaff] = useState(getFromLocalStorage("staff", []));
  const [billings, setBillings] = useState(getFromLocalStorage("billings", []));
  const [patients, setPatients] = useState(getFromLocalStorage("patients", []));
  const [appointments, setAppointments] = useState(getFromLocalStorage("appointments", []));
  const [stats, setStats] = useState(getFromLocalStorage("systemStats", {}));
  const [pendingAdmins, setPendingAdmins] = useState(getPendingAdminRequests());
  const [insuranceDiscounts, setInsuranceDiscounts] = useState(getFromLocalStorage("insuranceDiscounts", []));

  // Formlar
  const [branchForm, setBranchForm] = useState({
    name: "", address: "", phone: "", email: "", manager: "", status: "active", branchId: "", token: ""
  });
  const [adminForm, setAdminForm] = useState({
    name: "", email: "", phone: "", password: "", branchId: "", role: "branch_admin", telegram: ""
  });
  const [insuranceForm, setInsuranceForm] = useState({
    name: "", contactName: "", email: "", phone: "", address: "", coverage: "", commission: 0, status: "active"
  });
  const [staffForm, setStaffForm] = useState({
    name: "", position: "", phone: "", email: "", salary: "", branchId: "", status: "active"
  });
  const [discountForm, setDiscountForm] = useState({
    insuranceId: "", discountType: "percentage", discountValue: 0,
    minAmount: 0, maxAmount: 0, startDate: "", endDate: "", isActive: true
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
    saveToLocalStorage("insuranceDiscounts", insuranceDiscounts);
  }, [branches, admins, insuranceCompanies, staff, billings, patients, appointments, stats, insuranceDiscounts]);

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
      totalDiscounts: insuranceDiscounts.length,
      activeDiscounts: insuranceDiscounts.filter(d => d.isActive).length,
      totalRevenue: getFromLocalStorage("billings", []).reduce((sum, bill) => sum + (Number(bill.total) || 0), 0),
      monthlyGrowth: "12.5%",
      patientSatisfaction: "4.8/5"
    };
    setStats(newStats);
  };

  // Token yaratish funksiyasi
  const generateToken = (length = 12, type = "alphanumeric") => {
    let chars = '';
    let token = '';

    if (type === "numeric") {
      chars = '0123456789';
    } else if (type === "alphabetic") {
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else {
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }

    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
  };

  // Filial ID yaratish
  const generateBranchId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `BR-${timestamp}-${random}`;
  };

  // Token yangilash
  const handleRefreshToken = (item, type) => {
    const newToken = generateToken();

    if (type === "branch") {
      const updatedBranches = branches.map(branch =>
        branch.id === item.id ? { ...branch, token: newToken } : branch
      );
      setBranches(updatedBranches);
      setSuccessMessage(`${item.name} filial tokeni yangilandi!`);
    } else if (type === "admin") {
      const updatedAdmins = admins.map(admin =>
        admin.id === item.id ? {
          ...admin,
          token: newToken,
          tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : admin
      );
      setAdmins(updatedAdmins);
      setSuccessMessage(`${item.name} admin tokeni yangilandi!`);
    }

    setTimeout(() => setSuccessMessage(""), 3000);
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
        setError("Token nusxalashda xatolik");
        setTimeout(() => setError(""), 3000);
      });
  };

  // Sug'urta chegirmalari boshqaruvi
  const handleAddDiscount = (insuranceId = "") => {
    setModalType("discount");
    setCurrentItem(null);
    setDiscountForm({
      insuranceId: insuranceId || "",
      discountType: "percentage",
      discountValue: 0,
      minAmount: 0,
      maxAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEditDiscount = (discount) => {
    setModalType("discount");
    setCurrentItem(discount);
    setDiscountForm({
      insuranceId: discount.insuranceId,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      minAmount: discount.minAmount || 0,
      maxAmount: discount.maxAmount || 0,
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: discount.isActive
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveDiscount = () => {
    setIsLoading(true);

    if (!discountForm.insuranceId) {
      setError("Sug'urta kompaniyasi tanlanishi shart");
      setIsLoading(false);
      return;
    }

    if (discountForm.discountValue <= 0) {
      setError("Chegirma qiymati 0 dan katta bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    if (discountForm.discountType === "percentage" && discountForm.discountValue > 100) {
      setError("Foiz chegirmasi 100% dan oshmasligi kerak");
      setIsLoading(false);
      return;
    }

    if (new Date(discountForm.endDate) <= new Date(discountForm.startDate)) {
      setError("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    const newDiscount = {
      ...discountForm,
      id: currentItem ? currentItem.id : Date.now(),
      createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentItem) {
      setInsuranceDiscounts(insuranceDiscounts.map(d => (d.id === currentItem.id ? newDiscount : d)));
    } else {
      setInsuranceDiscounts([...insuranceDiscounts, newDiscount]);
    }

    initializeStats();
    setModalOpen(false);
    setSuccessMessage("Chegirma muvaffaqiyatli saqlandi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteDiscount = (discountId) => {
    if (window.confirm("Ushbu chegirmni o'chirishga ishonchingiz komilmi?")) {
      setInsuranceDiscounts(insuranceDiscounts.filter(d => d.id !== discountId));
      initializeStats();
      setSuccessMessage("Chegirma muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleToggleDiscountStatus = (discountId) => {
    const updatedDiscounts = insuranceDiscounts.map(discount =>
      discount.id === discountId
        ? { ...discount, isActive: !discount.isActive, updatedAt: new Date().toISOString() }
        : discount
    );
    setInsuranceDiscounts(updatedDiscounts);
    setSuccessMessage("Chegirma holati yangilandi");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Filiallar boshqaruvi
  const handleAddBranch = () => {
    setModalType("branch");
    setCurrentItem(null);
    setBranchForm({
      name: "", address: "", phone: "", email: "", manager: "", status: "active",
      branchId: generateBranchId(), token: generateToken()
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
      setError("Filial nomi, manzili va telefon raqami majburiy");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(branchForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(branchForm.email)) {
      setError("Noto'g'ri email format");
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
    if (window.confirm("Ushbu filialni o'chirishga ishonchingiz komilmi? Barcha bog'liq ma'lumotlar ham o'chiriladi.")) {
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

  // Admin boshqaruvi
  const handleAddAdmin = (branchId = "") => {
    setModalType("admin");
    setCurrentItem(null);
    setAdminForm({
      name: "", email: "", phone: "", password: "", branchId, role: "branch_admin", telegram: ""
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
      role: admin.role || "branch_admin",
      telegram: admin.telegram || ""
    });
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSaveAdmin = () => {
    setIsLoading(true);
    if (!adminForm.name || !adminForm.email || !adminForm.phone || !adminForm.telegram) {
      setError("Barcha maydonlar, shu jumladan Telegram Chat ID majburiy");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(adminForm.email)) {
      setError("Noto'g'ri email format");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(adminForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!/^\d+$/.test(adminForm.telegram)) {
      setError("Telegram Chat ID faqat raqamlardan iborat bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!currentItem && !adminForm.password) {
      setError("Yangi admin uchun parol majburiy");
      setIsLoading(false);
      return;
    }
    if (adminForm.password && !validatePassword(adminForm.password)) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
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
    if (window.confirm("Ushbu adminni o'chirishga ishonchingiz komilmi?")) {
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

  // Sug'urta boshqaruvi
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
      setError("Kompaniya nomi, aloqa shaxsi va telefon raqami majburiy");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(insuranceForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(insuranceForm.email)) {
      setError("Noto'g'ri email format");
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
    if (window.confirm("Ushbu sug'urta kompaniyasini o'chirishga ishonchingiz komilmi?")) {
      setInsuranceCompanies(insuranceCompanies.filter(i => i.id !== insuranceId));
      setInsuranceDiscounts(insuranceDiscounts.filter(d => d.insuranceId !== insuranceId));
      initializeStats();
      setSuccessMessage("Sug'urta kompaniyasi muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Xodimlar boshqaruvi
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
      setError("Barcha maydonlar va filial tanlovi majburiy");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(staffForm.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (staffForm.email && !validateEmail(staffForm.email)) {
      setError("Noto'g'ri email format");
      setIsLoading(false);
      return;
    }

    const newStaff = {
      ...staffForm,
      id: currentItem ? currentItem.id : Date.now(),
      token: generateToken(10, "numeric"),
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    setSuccessMessage("Xodim muvaffaqiyatli qo'shildi");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm("Ushbu xodimni o'chirishga ishonchingiz komilmi?")) {
      setStaff(staff.filter(s => s.id !== staffId));
      initializeStats();
      setSuccessMessage("Xodim muvaffaqiyatli o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleApproveAdminRequest = (request) => {
    setIsLoading(true);
    const newAdmin = {
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      password: request.password,
      role: "branch_admin",
      token: generateToken(),
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isAdminToken: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      telegram: request.telegram
    };

    setAdmins([...admins, newAdmin]);
    updatePendingAdminRequest(request.id, { status: "approved" });
    setPendingAdmins(getPendingAdminRequests());
    setSuccessMessage(`${request.name} admin sifatida tasdiqlandi`);
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleRejectAdminRequest = (requestId) => {
    if (window.confirm("Ushbu so'rovni rad etishga ishonchingiz komilmi?")) {
      updatePendingAdminRequest(requestId, { status: "rejected" });
      setPendingAdmins(getPendingAdminRequests());
      setSuccessMessage("So'rov rad etildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtrlangan ma'lumotlar
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

  const filteredDiscounts = insuranceDiscounts.filter(d => {
    const insurance = insuranceCompanies.find(i => i.id === d.insuranceId);
    return (
      insurance?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.discountType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Render funksiyalari
  const renderBranchesTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Filiallar</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Filiallarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={handleAddBranch}>
            <FiPlus /> Yangi Filial
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardBranchesGrid">
        {filteredBranches.length === 0 ? (
          <p className="adminDashboardNoData">Filiallar topilmadi</p>
        ) : (
          filteredBranches.map(branch => (
            <div key={branch.id} className="adminDashboardBranchCard">
              <div className="adminDashboardBranchHeader">
                <h3>{branch.name}</h3>
                <span className={`adminDashboardStatusBadge ${branch.status}`}>
                  {branch.status === "active" ? "Faol" : "Faol emas"}
                </span>
              </div>
              <div className="adminDashboardBranchInfo">
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> {branch.address}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {branch.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMail /> {branch.email}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiUsers /> Menejer: {branch.manager}
                </div>
                <div className="adminDashboardInfoItem adminDashboardTokenItem">
                  <div className="adminDashboardTokenText">
                    <FiKey /> Token: {branch.token}
                  </div>
                  <div className="adminDashboardTokenActions">
                    <button
                      className={`adminDashboardBtnCopy ${copiedTokenId === branch.id ? 'adminDashboardCopied' : ''}`}
                      onClick={() => handleCopyToken(branch.token, branch, true)}
                      title="Tokenni nusxalash"
                    >
                      <FiCopy />
                      <span>{copiedTokenId === branch.id ? "Nusxalandi!" : "Nusxalash"}</span>
                    </button>
                    <button
                      className="adminDashboardBtnRefresh"
                      onClick={() => handleRefreshToken(branch, "branch")}
                      title="Tokenni yangilash"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>
              </div>
              <div className="adminDashboardBranchActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditBranch(branch)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteBranch(branch.id)}>
                  <FiTrash2 /> O'chirish
                </button>
                <button className="adminDashboardBtnView" onClick={() => handleViewBranch(branch)}>
                  <FiEye /> Tafsilotlar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAdminsTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Administratorlar</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Adminlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddAdmin()}>
            <FiPlus /> Yangi Admin
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardAdminsGrid">
        {filteredAdmins.length === 0 ? (
          <p className="adminDashboardNoData">Adminlar topilmadi</p>
        ) : (
          filteredAdmins.map(admin => (
            <div key={admin.id} className="adminDashboardAdminCard">
              <div className="adminDashboardAdminHeader">
                <h3>{admin.name}</h3>
                <span className="adminDashboardRoleBadge">
                  {admin.role === "super_admin" ? "Bosh Admin" : "Filial Admini"}
                </span>
              </div>
              <div className="adminDashboardAdminInfo">
                <div className="adminDashboardInfoItem">
                  <FiMail /> {admin.email}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {admin.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> Filial: {admin.branchId ? branches.find(b => b.id === admin.branchId)?.name || "Yo'q" : "Umumiy"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiKey /> Telegram Chat ID: {admin.telegram || "Yo'q"}
                </div>
                <div className="adminDashboardInfoItem adminDashboardTokenItem">
                  <div className="adminDashboardTokenText">
                    <FiKey /> Token: {admin.token}
                  </div>
                  <div className="adminDashboardTokenActions">
                    <button
                      className={`adminDashboardBtnCopy ${copiedTokenId === admin.id ? 'adminDashboardCopied' : ''}`}
                      onClick={() => handleCopyToken(admin.token, admin)}
                      title="Tokenni nusxalash"
                    >
                      <FiCopy />
                      <span>{copiedTokenId === admin.id ? "Nusxalandi!" : "Nusxalash"}</span>
                    </button>
                    <button
                      className="adminDashboardBtnRefresh"
                      onClick={() => handleRefreshToken(admin, "admin")}
                      title="Tokenni yangilash"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>
                <div className="adminDashboardInfoItem">
                  <FiDatabase /> Token tugash sanasi: {new Date(admin.tokenExpiry).toLocaleDateString('uz-UZ')}
                </div>
              </div>
              <div className="adminDashboardAdminActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditAdmin(admin)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteAdmin(admin.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPendingAdminsTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Kutilayotgan Admin So'rovlari</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="So'rovlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardAdminsGrid">
        {pendingAdmins.length === 0 ? (
          <p className="adminDashboardNoData">Kutilayotgan so'rovlar yo'q</p>
        ) : (
          pendingAdmins
            .filter(a =>
              a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.phone.includes(searchTerm)
            )
            .map(request => (
              <div key={request.id} className="adminDashboardAdminCard">
                <div className="adminDashboardAdminHeader">
                  <h3>{request.name}</h3>
                  <span className={`adminDashboardStatusBadge ${request.status}`}>
                    {request.status === "pending" ? "Kutilmoqda" : request.status === "approved" ? "Tasdiqlandi" : "Rad etildi"}
                  </span>
                </div>
                <div className="adminDashboardAdminInfo">
                  <div className="adminDashboardInfoItem">
                    <FiMail /> {request.email}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiPhone /> {request.phone}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiKey /> Telegram Chat ID: {request.telegram || "Yo'q"}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiFileText /> Yaratilgan: {new Date(request.createdAt).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                {request.status === "pending" && (
                  <div className="adminDashboardAdminActions">
                    <button className="adminDashboardBtnEdit" onClick={() => handleApproveAdminRequest(request)}>
                      <FiCheck /> Tasdiqlash
                    </button>
                    <button className="adminDashboardBtnDelete" onClick={() => handleRejectAdminRequest(request.id)}>
                      <FiXCircle /> Rad etish
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderInsuranceTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Sug'urta Kompaniyalari</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Sug'urta kompaniyalarini qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={handleAddInsurance}>
            <FiPlus /> Yangi Sug'urta
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardInsuranceGrid">
        {filteredInsurance.length === 0 ? (
          <p className="adminDashboardNoData">Sug'urta kompaniyalari topilmadi</p>
        ) : (
          filteredInsurance.map(insurance => (
            <div key={insurance.id} className="adminDashboardInsuranceCard">
              <div className="adminDashboardInsuranceHeader">
                <h3>{insurance.name}</h3>
                <span className={`adminDashboardStatusBadge ${insurance.status}`}>
                  {insurance.status === "active" ? "Faol" : "Faol emas"}
                </span>
              </div>
              <div className="adminDashboardInsuranceInfo">
                <div className="adminDashboardInfoItem">
                  <FiUsers /> Aloqa: {insurance.contactName}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {insurance.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMail /> {insurance.email}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> {insurance.address}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiDollarSign /> Komissiya: {insurance.commission}%
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPercent /> Faol chegirmalar: {
                    insuranceDiscounts.filter(d =>
                      d.insuranceId === insurance.id && d.isActive
                    ).length
                  }
                </div>
              </div>
              <div className="adminDashboardInsuranceActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditInsurance(insurance)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="adminDashboardBtnSecondary" onClick={() => handleAddDiscount(insurance.id)}>
                  <FiTag /> Chegirma Qo'shish
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteInsurance(insurance.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDiscountsTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Sug'urta Chegirmalari</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Chegirmalarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddDiscount()}>
            <FiPlus /> Yangi Chegirma
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardDiscountsGrid">
        {filteredDiscounts.length === 0 ? (
          <p className="adminDashboardNoData">Chegirmalar topilmadi</p>
        ) : (
          filteredDiscounts.map(discount => {
            const insurance = insuranceCompanies.find(i => i.id === discount.insuranceId);
            const isExpired = new Date(discount.endDate) < new Date();
            const isActive = discount.isActive && !isExpired;

            return (
              <div key={discount.id} className={`adminDashboardDiscountCard ${!isActive ? 'adminDashboardExpired' : ''}`}>
                <div className="adminDashboardDiscountHeader">
                  <h3>{insurance?.name || "Noma'lum sug'urta"}</h3>
                  <div className="adminDashboardDiscountBadges">
                    <span className={`adminDashboardStatusBadge ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? "Faol" : isExpired ? "Muddati tugagan" : "Faol emas"}
                    </span>
                    <span className="adminDashboardDiscountTypeBadge">
                      {discount.discountType === "percentage" ? "Foiz" : "Soddaroq"}
                    </span>
                  </div>
                </div>
                <div className="adminDashboardDiscountInfo">
                  <div className="adminDashboardInfoItem">
                    <FiPercent /> Chegirma: {discount.discountValue}
                    {discount.discountType === "percentage" ? "%" : " so'm"}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDollarSign /> Min miqdor: {discount.minAmount || 0} so'm
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDollarSign /> Max miqdor: {discount.maxAmount || "Cheksiz"} so'm
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiCalendar /> Boshlanish: {new Date(discount.startDate).toLocaleDateString('uz-UZ')}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiCalendar /> Tugash: {new Date(discount.endDate).toLocaleDateString('uz-UZ')}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDatabase /> Yaratilgan: {new Date(discount.createdAt).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                <div className="adminDashboardDiscountActions">
                  <button className="adminDashboardBtnEdit" onClick={() => handleEditDiscount(discount)}>
                    <FiEdit /> Tahrirlash
                  </button>
                  <button
                    className={isActive ? "adminDashboardBtnWarning" : "adminDashboardBtnSecondary"}
                    onClick={() => handleToggleDiscountStatus(discount.id)}
                  >
                    {isActive ? <FiXCircle /> : <FiCheck />}
                    {isActive ? " O'chirish" : " Faollashtirish"}
                  </button>
                  <button className="adminDashboardBtnDelete" onClick={() => handleDeleteDiscount(discount.id)}>
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

  const renderStaffTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Xodimlar</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Xodimlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddStaff()}>
            <FiPlus /> Yangi Xodim
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminDashboardAlertSuccess">
          <FiAward className="adminDashboardAlertIcon" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="adminDashboardStaffGrid">
        {filteredStaff.length === 0 ? (
          <p className="adminDashboardNoData">Xodimlar topilmadi</p>
        ) : (
          filteredStaff.map(staffMember => (
            <div key={staffMember.id} className="adminDashboardStaffCard">
              <div className="adminDashboardStaffHeader">
                <h3>{staffMember.name}</h3>
                <span className={`adminDashboardStatusBadge ${staffMember.status}`}>
                  {staffMember.status === "active" ? "Faol" : "Faol emas"}
                </span>
              </div>
              <div className="adminDashboardStaffInfo">
                <div className="adminDashboardInfoItem">
                  <FiUsers /> Lavozim: {staffMember.position}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {staffMember.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMail /> {staffMember.email || "Yo'q"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> Filial: {staffMember.branchId ? branches.find(b => b.id === staffMember.branchId)?.name || "Yo'q" : "Umumiy"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiDollarSign /> Maosh: {staffMember.salary || "Yo'q"} so'm
                </div>
                {staffMember.token && (
                  <div className="adminDashboardInfoItem adminDashboardTokenItem">
                    <div className="adminDashboardTokenText">
                      <FiKey /> Token: {staffMember.token}
                    </div>
                    <div className="adminDashboardTokenActions">
                      <button
                        className={`adminDashboardBtnCopy ${copiedTokenId === staffMember.id ? 'adminDashboardCopied' : ''}`}
                        onClick={() => handleCopyToken(staffMember.token, staffMember)}
                        title="Tokenni nusxalash"
                      >
                        <FiCopy />
                        <span>{copiedTokenId === staffMember.id ? "Nusxalandi!" : "Nusxalash"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="adminDashboardStaffActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditStaff(staffMember)}>
                  <FiEdit /> Tahrirlash
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteStaff(staffMember.id)}>
                  <FiTrash2 /> O'chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Statistika</h2>
      </div>

      <div className="adminDashboardStatsGrid">
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiHome />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Jami Filiallar</h3>
            <p>{stats.totalBranches || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiUsers />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Faol Filiallar</h3>
            <p>{stats.activeBranches || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiShield />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Adminlar</h3>
            <p>{stats.totalAdmins || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiUsers />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Xodimlar</h3>
            <p>{stats.totalStaff || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiFileText />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Sug'urta Kompaniyalari</h3>
            <p>{stats.totalInsurance || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiPercent />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Faol Chegirmalar</h3>
            <p>{stats.activeDiscounts || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiDollarSign />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Jami Daromad</h3>
            <p>{(stats.totalRevenue || 0).toLocaleString()} so'm</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiTrendingUp />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Oylik O'sish</h3>
            <p>{stats.monthlyGrowth || "0%"}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiActivity />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Bemorlar Qoniqishi</h3>
            <p>{stats.patientSatisfaction || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="adminDashboardChartContainer">
        <p>Oylik daromad statistikasi uchun grafik joylashuvi</p>
      </div>
    </div>
  );

  return (
    <div className="adminDashboard">
      <div className="adminDashboardSidebar">
        <h1>Admin Paneli</h1>
        <button
          className={`adminDashboardMenuItem ${activeTab === "branches" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("branches")}
        >
          <FiHome /> Filiallar
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "admins" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          <FiShield /> Adminlar
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "pending_admins" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("pending_admins")}
        >
          <FiFileText /> So'rovlar
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "insurance" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("insurance")}
        >
          <FiFileText /> Sug'urta
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "discounts" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("discounts")}
        >
          <FiPercent /> Chegirmalar
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "staff" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          <FiUsers /> Xodimlar
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "stats" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <FiBarChart2 /> Statistika
        </button>
        <button className="adminDashboardMenuItem" onClick={() => navigate("/")}>
          Orqaga
        </button>
      </div>

      <div className="adminDashboardMain">
        {error && (
          <div className="adminDashboardAlertError">
            <FiXCircle className="adminDashboardAlertIcon" />
            <span>{error}</span>
          </div>
        )}
        {activeTab === "branches" && renderBranchesTab()}
        {activeTab === "admins" && renderAdminsTab()}
        {activeTab === "pending_admins" && renderPendingAdminsTab()}
        {activeTab === "insurance" && renderInsuranceTab()}
        {activeTab === "discounts" && renderDiscountsTab()}
        {activeTab === "staff" && renderStaffTab()}
        {activeTab === "stats" && renderStatsTab()}
        {modalOpen && (
          <div className="adminDashboardModalOverlay">
            <div className="adminDashboardModalContent">
              <div className="adminDashboardModalHeader">
                <h2>
                  {modalType === "branch" && (currentItem ? "Filialni tahrirlash" : "Yangi Filial Qo'shish")}
                  {modalType === "admin" && (currentItem ? "Adminni tahrirlash" : "Yangi Admin Qo'shish")}
                  {modalType === "insurance" && (currentItem ? "Sug'urtani tahrirlash" : "Yangi Sug'urta Qo'shish")}
                  {modalType === "staff" && (currentItem ? "Xodimni tahrirlash" : "Yangi Xodim Qo'shish")}
                  {modalType === "discount" && (currentItem ? "Chegirmni tahrirlash" : "Yangi Chegirma Qo'shish")}
                </h2>
                <button className="adminDashboardModalClose" onClick={() => setModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="adminDashboardModalBody">
                {modalType === "branch" && (
                  <div className="adminDashboardFormGroup">
                    <label>Filial Nomi</label>
                    <input type="text" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="Filial nomini kiriting"
                    />
                    <label>Manzil</label>
                    <input type="text" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      placeholder="Manzilni kiriting"
                    />
                    <label>Telefon</label>
                    <input type="text" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Email</label>
                    <input type="text" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      placeholder="Email kiriting"
                    />
                    <label>Menejer</label>
                    <input type="text" value={branchForm.manager} onChange={(e) => setBranchForm({ ...branchForm, manager: e.target.value })}
                      placeholder="Menejer nomini kiriting"
                    />
                    <label>Holati</label>
                    <select value={branchForm.status} onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}>
                      <option value="active">Faol</option>
                      <option value="inactive">Faol emas</option>
                    </select>
                    <label>Filial ID</label>
                    <input type="text" value={branchForm.branchId} disabled />
                    <div className="adminDashboardTokenGenerator">
                      <label>Token</label>
                      <div className="adminDashboardTokenInputGroup">
                        <input type="text" value={branchForm.token} disabled />
                        <button
                          type="button"
                          className="adminDashboardBtnGenerate"
                          onClick={() => setBranchForm({ ...branchForm, token: generateToken() })}
                        >
                          <FiRefreshCw /> Yangilash
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {modalType === "admin" && (
                  <div className="adminDashboardFormGroup">
                    <label>Ism</label>
                    <input type="text" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="Ism kiriting"
                    />
                    <label>Email</label>
                    <input type="text" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      placeholder="Email kiriting"
                    />
                    <label>Telefon</label>
                    <input type="text" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Telegram Chat ID</label>
                    <input type="text" value={adminForm.telegram} onChange={(e) => setAdminForm({ ...adminForm, telegram: e.target.value })}
                      placeholder="Telegram Chat ID kiriting"
                    />
                    <label>Parol</label>
                    <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder={currentItem ? "Yangi parol (ixtiyoriy)" : "Parol kiriting"}
                    />
                    <label>Roli</label>
                    <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}>
                      <option value="super_admin">Bosh Admin</option>
                      <option value="branch_admin">Filial Admini</option>
                    </select>
                    <label>Filial</label>
                    <select value={adminForm.branchId} onChange={(e) => setAdminForm({ ...adminForm, branchId: e.target.value })}>
                      <option value="">Umumiy</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <div className="adminDashboardTokenGenerator">
                      <label>Token (Avtomatik yaratiladi)</label>
                      <input type="text" value={currentItem ? adminForm.token || "Yangi token yaratiladi" : "Yangi admin qo'shilganda token yaratiladi"} disabled />
                    </div>
                  </div>
                )}
                {modalType === "insurance" && (
                  <div className="adminDashboardFormGroup">
                    <label>Kompaniya Nomi</label>
                    <input type="text" value={insuranceForm.name} onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                      placeholder="Kompaniya nomini kiriting"
                    />
                    <label>Aloqa Shaxsi</label>
                    <input type="text" value={insuranceForm.contactName} onChange={(e) => setInsuranceForm({ ...insuranceForm, contactName: e.target.value })}
                      placeholder="Aloqa shaxsini kiriting"
                    />
                    <label>Email</label>
                    <input type="text" value={insuranceForm.email} onChange={(e) => setInsuranceForm({ ...insuranceForm, email: e.target.value })}
                      placeholder="Email kiriting"
                    />
                    <label>Telefon</label>
                    <input type="text" value={insuranceForm.phone} onChange={(e) => setInsuranceForm({ ...insuranceForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Manzil</label>
                    <input type="text" value={insuranceForm.address} onChange={(e) => setInsuranceForm({ ...insuranceForm, address: e.target.value })}
                      placeholder="Manzil kiriting"
                    />
                    <label>Qoplama</label>
                    <input type="text" value={insuranceForm.coverage} onChange={(e) => setInsuranceForm({ ...insuranceForm, coverage: e.target.value })}
                      placeholder="Qoplama kiriting"
                    />
                    <label>Komissiya (%)</label>
                    <input type="number" value={insuranceForm.commission} onChange={(e) => setInsuranceForm({ ...insuranceForm, commission: e.target.value })}
                      placeholder="Komissiya foizini kiriting"
                    />
                    <label>Holati</label>
                    <select value={insuranceForm.status} onChange={(e) => setInsuranceForm({ ...insuranceForm, status: e.target.value })}>
                      <option value="active">Faol</option>
                      <option value="inactive">Faol emas</option>
                    </select>
                  </div>
                )}
                {modalType === "staff" && (
                  <div className="adminDashboardFormGroup">
                    <label>Ism</label>
                    <input type="text" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Ism kiriting"
                    />
                    <label>Lavozim</label>
                    <input type="text" value={staffForm.position} onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                      placeholder="Lavozim kiriting"
                    />
                    <label>Telefon</label>
                    <input type="text" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Email</label>
                    <input type="text" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="Email kiriting (ixtiyoriy)"
                    />
                    <label>Maosh (so'm)</label>
                    <input type="number" value={staffForm.salary} onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                      placeholder="Maosh kiriting"
                    />
                    <label>Filial</label>
                    <select value={staffForm.branchId} onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}>
                      <option value="">Filial tanlang</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <label>Holati</label>
                    <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}>
                      <option value="active">Faol</option>
                      <option value="inactive">Faol emas</option>
                    </select>
                    <div className="adminDashboardTokenGenerator">
                      <label>Token (Avtomatik yaratiladi)</label>
                      <input type="text" value={currentItem ? staffForm.token || "Yangi token yaratiladi" : "Yangi xodim qo'shilganda token yaratiladi"} disabled />
                    </div>
                  </div>
                )}
                {modalType === "discount" && (
                  <div className="adminDashboardFormGroup">
                    <label>Sug'urta Kompaniyasi</label>
                    <select value={discountForm.insuranceId} onChange={(e) => setDiscountForm({ ...discountForm, insuranceId: e.target.value })}>
                      <option value="">Sug'urta kompaniyasini tanlang</option>
                      {insuranceCompanies.map(insurance => (
                        <option key={insurance.id} value={insurance.id}>
                          {insurance.name}
                        </option>
                      ))}
                    </select>
                    <label>Chegirma Turi</label>
                    <select value={discountForm.discountType} onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}>
                      <option value="percentage">Foiz (%)</option>
                      <option value="fixed">Soddaroq miqdor (so'm)</option>
                    </select>
                    <label>
                      Chegirma Qiymati
                      {discountForm.discountType === "percentage" ? " (%)" : " (so'm)"}
                    </label>
                    <input
                      type="number"
                      value={discountForm.discountValue}
                      onChange={(e) => setDiscountForm({ ...discountForm, discountValue: parseFloat(e.target.value) || 0 })}
                      placeholder={discountForm.discountType === "percentage" ? "Foiz kiriting" : "Miqdor kiriting"}
                    />
                    <label>Minimal Miqdor (so'm)</label>
                    <input
                      type="number"
                      value={discountForm.minAmount}
                      onChange={(e) => setDiscountForm({ ...discountForm, minAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="Minimal miqdor kiriting"
                    />
                    <label>Maksimal Miqdor (so'm)</label>
                    <input
                      type="number"
                      value={discountForm.maxAmount}
                      onChange={(e) => setDiscountForm({ ...discountForm, maxAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="Maksimal miqdor kiriting (0 - cheksiz)"
                    />
                    <label>Boshlanish Sanasi</label>
                    <input
                      type="date"
                      value={discountForm.startDate}
                      onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                    />
                    <label>Tugash Sanasi</label>
                    <input
                      type="date"
                      value={discountForm.endDate}
                      onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    />
                    <label>Holati</label>
                    <select value={discountForm.isActive} onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.value === "true" })}>
                      <option value="true">Faol</option>
                      <option value="false">Faol emas</option>
                    </select>
                  </div>
                )}
              </div>
              {error && (
                <div className="adminDashboardAlertError">
                  <FiXCircle className="adminDashboardAlertIcon" />
                  <span>{error}</span>
                </div>
              )}
              <div className="adminDashboardModalFooter">
                <button className="adminDashboardModalBtn adminDashboardModalBtnPrimary" onClick={() => {
                  if (modalType === "branch") handleSaveBranch();
                  else if (modalType === "admin") handleSaveAdmin();
                  else if (modalType === "insurance") handleSaveInsurance();
                  else if (modalType === "staff") handleSaveStaff();
                  else if (modalType === "discount") handleSaveDiscount();
                }}>
                  Saqlash
                </button>
                <button className="adminDashboardModalBtn adminDashboardModalBtnSecondary" onClick={() => setModalOpen(false)}>
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;