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
  const [modalType, setModalType] = useState(""); // branch, admin, insurance, staff, discount
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
  const [pendingAdmins, setPendingAdmins] = useState(getPendingAdminRequests());
  const [insuranceDiscounts, setInsuranceDiscounts] = useState(getFromLocalStorage("insuranceDiscounts", []));

  // Forms
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

  // Token generation function
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

  // Branch ID generation
  const generateBranchId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `BR-${timestamp}-${random}`;
  };

  // Refresh token
  const handleRefreshToken = (item, type) => {
    const newToken = generateToken();

    if (type === "branch") {
      const updatedBranches = branches.map(branch =>
        branch.id === item.id ? { ...branch, token: newToken } : branch
      );
      setBranches(updatedBranches);
      setSuccessMessage(`${item.name} branch token updated!`);
    } else if (type === "admin") {
      const updatedAdmins = admins.map(admin =>
        admin.id === item.id ? {
          ...admin,
          token: newToken,
          tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : admin
      );
      setAdmins(updatedAdmins);
      setSuccessMessage(`${item.name} admin token updated!`);
    }

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCopyToken = (token, item, isBranch = false) => {
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopiedTokenId(item.id);
        setSuccessMessage(`${isBranch ? item.name + ' branch' : item.name} token copied!`);
        setTimeout(() => {
          setCopiedTokenId(null);
          setSuccessMessage("");
        }, 2000);
      })
      .catch(() => {
        setError("Error copying token");
        setTimeout(() => setError(""), 3000);
      });
  };

  // Insurance Discount Management
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
      setError("Insurance company must be selected");
      setIsLoading(false);
      return;
    }

    if (discountForm.discountValue <= 0) {
      setError("Discount value must be greater than 0");
      setIsLoading(false);
      return;
    }

    if (discountForm.discountType === "percentage" && discountForm.discountValue > 100) {
      setError("Percentage discount cannot exceed 100%");
      setIsLoading(false);
      return;
    }

    if (new Date(discountForm.endDate) <= new Date(discountForm.startDate)) {
      setError("End date must be after start date");
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
    setSuccessMessage("Discount saved successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteDiscount = (discountId) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      setInsuranceDiscounts(insuranceDiscounts.filter(d => d.id !== discountId));
      initializeStats();
      setSuccessMessage("Discount deleted successfully");
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
    setSuccessMessage("Discount status updated");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Branch Management
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
      setError("Branch name, address and phone number are required");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(branchForm.phone)) {
      setError("Phone number must be in +998XXXXXXXXX format");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(branchForm.email)) {
      setError("Invalid email format");
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
    setSuccessMessage("Branch saved successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteBranch = (branchId) => {
    if (window.confirm("Are you sure you want to delete this branch? All related data will also be deleted.")) {
      setBranches(branches.filter(b => b.id !== branchId));
      setAdmins(admins.filter(a => a.branchId !== branchId));
      setStaff(staff.filter(s => s.branchId !== branchId));
      setBillings(billings.filter(b => b.branchId !== branchId));
      setPatients(patients.filter(p => p.branchId !== branchId));
      setAppointments(appointments.filter(a => a.branchId !== branchId));
      initializeStats();
      setSuccessMessage("Branch deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Admin Management
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
      setError("All fields including Telegram Chat ID are required");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(adminForm.email)) {
      setError("Invalid email format");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(adminForm.phone)) {
      setError("Phone number must be in +998XXXXXXXXX format");
      setIsLoading(false);
      return;
    }
    if (!/^\d+$/.test(adminForm.telegram)) {
      setError("Telegram Chat ID must contain only numbers");
      setIsLoading(false);
      return;
    }
    if (!currentItem && !adminForm.password) {
      setError("Password is required for new admin");
      setIsLoading(false);
      return;
    }
    if (adminForm.password && !validatePassword(adminForm.password)) {
      setError("Password must be at least 6 characters long");
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
    setSuccessMessage("Admin saved successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteAdmin = (adminId) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      if (admins.find(a => a.id === adminId)?.email === currentUser?.email) {
        setError("You cannot delete yourself!");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setAdmins(admins.filter(a => a.id !== adminId));
      initializeStats();
      setSuccessMessage("Admin deleted successfully");
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
      setError("Company name, contact person and phone number are required");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(insuranceForm.phone)) {
      setError("Phone number must be in +998XXXXXXXXX format");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(insuranceForm.email)) {
      setError("Invalid email format");
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
    setSuccessMessage("Insurance company saved successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteInsurance = (insuranceId) => {
    if (window.confirm("Are you sure you want to delete this insurance company?")) {
      setInsuranceCompanies(insuranceCompanies.filter(i => i.id !== insuranceId));
      setInsuranceDiscounts(insuranceDiscounts.filter(d => d.insuranceId !== insuranceId));
      initializeStats();
      setSuccessMessage("Insurance company deleted successfully");
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
      setError("All fields and branch selection are required");
      setIsLoading(false);
      return;
    }
    if (!validatePhone(staffForm.phone)) {
      setError("Phone number must be in +998XXXXXXXXX format");
      setIsLoading(false);
      return;
    }
    if (staffForm.email && !validateEmail(staffForm.email)) {
      setError("Invalid email format");
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
    setSuccessMessage("Staff added successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleDeleteStaff = (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      setStaff(staff.filter(s => s.id !== staffId));
      initializeStats();
      setSuccessMessage("Staff deleted successfully");
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
    setSuccessMessage(`${request.name} approved as admin`);
    setTimeout(() => setSuccessMessage(""), 3000);
    setIsLoading(false);
  };

  const handleRejectAdminRequest = (requestId) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
      updatePendingAdminRequest(requestId, { status: "rejected" });
      setPendingAdmins(getPendingAdminRequests());
      setSuccessMessage("Request rejected");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtered data
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

  // Render functions
  const renderBranchesTab = () => (
    <div className="adminDashboardTabContent">
      <div className="adminDashboardPageHeader">
        <h2>Branches</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={handleAddBranch}>
            <FiPlus /> New Branch
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
          <p className="adminDashboardNoData">No branches found</p>
        ) : (
          filteredBranches.map(branch => (
            <div key={branch.id} className="adminDashboardBranchCard">
              <div className="adminDashboardBranchHeader">
                <h3>{branch.name}</h3>
                <span className={`adminDashboardStatusBadge ${branch.status}`}>{branch.status === "active" ? "Active" : "Inactive"}</span>
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
                  <FiUsers /> Manager: {branch.manager}
                </div>
                <div className="adminDashboardInfoItem adminDashboardTokenItem">
                  <div className="adminDashboardTokenText">
                    <FiKey /> Token: {branch.token}
                  </div>
                  <div className="adminDashboardTokenActions">
                    <button
                      className={`adminDashboardBtnCopy ${copiedTokenId === branch.id ? 'adminDashboardCopied' : ''}`}
                      onClick={() => handleCopyToken(branch.token, branch, true)}
                      title="Copy token"
                    >
                      <FiCopy />
                      <span>{copiedTokenId === branch.id ? "Copied!" : "Copy"}</span>
                    </button>
                    <button
                      className="adminDashboardBtnRefresh"
                      onClick={() => handleRefreshToken(branch, "branch")}
                      title="Refresh token"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>
              </div>
              <div className="adminDashboardBranchActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditBranch(branch)}>
                  <FiEdit /> Edit
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteBranch(branch.id)}>
                  <FiTrash2 /> Delete
                </button>
                <button className="adminDashboardBtnView" onClick={() => handleViewBranch(branch)}>
                  <FiEye /> Details
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
        <h2>Administrators</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddAdmin()}>
            <FiPlus /> New Admin
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
          <p className="adminDashboardNoData">No admins found</p>
        ) : (
          filteredAdmins.map(admin => (
            <div key={admin.id} className="adminDashboardAdminCard">
              <div className="adminDashboardAdminHeader">
                <h3>{admin.name}</h3>
                <span className="adminDashboardRoleBadge">{admin.role === "super_admin" ? "Super Admin" : "Branch Admin"}</span>
              </div>
              <div className="adminDashboardAdminInfo">
                <div className="adminDashboardInfoItem">
                  <FiMail /> {admin.email}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {admin.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> Branch: {admin.branchId ? branches.find(b => b.id === admin.branchId)?.name || "N/A" : "General"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiKey /> Telegram Chat ID: {admin.telegram || "N/A"}
                </div>
                <div className="adminDashboardInfoItem adminDashboardTokenItem">
                  <div className="adminDashboardTokenText">
                    <FiKey /> Token: {admin.token}
                  </div>
                  <div className="adminDashboardTokenActions">
                    <button
                      className={`adminDashboardBtnCopy ${copiedTokenId === admin.id ? 'adminDashboardCopied' : ''}`}
                      onClick={() => handleCopyToken(admin.token, admin)}
                      title="Copy token"
                    >
                      <FiCopy />
                      <span>{copiedTokenId === admin.id ? "Copied!" : "Copy"}</span>
                    </button>
                    <button
                      className="adminDashboardBtnRefresh"
                      onClick={() => handleRefreshToken(admin, "admin")}
                      title="Refresh token"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>
                <div className="adminDashboardInfoItem">
                  <FiDatabase /> Token expiry: {new Date(admin.tokenExpiry).toLocaleDateString('en-US')}
                </div>
              </div>
              <div className="adminDashboardAdminActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditAdmin(admin)}>
                  <FiEdit /> Edit
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteAdmin(admin.id)}>
                  <FiTrash2 /> Delete
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
        <h2>Pending Admin Requests</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search requests..."
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
          <p className="adminDashboardNoData">No pending requests</p>
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
                    {request.status === "pending" ? "Pending" : request.status === "approved" ? "Approved" : "Rejected"}
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
                    <FiKey /> Telegram Chat ID: {request.telegram || "N/A"}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiFileText /> Created: {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {request.status === "pending" && (
                  <div className="adminDashboardAdminActions">
                    <button className="adminDashboardBtnEdit" onClick={() => handleApproveAdminRequest(request)}>
                      <FiCheck /> Approve
                    </button>
                    <button className="adminDashboardBtnDelete" onClick={() => handleRejectAdminRequest(request.id)}>
                      <FiXCircle /> Reject
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
        <h2>Insurance Companies</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search insurance companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={handleAddInsurance}>
            <FiPlus /> New Insurance
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
          <p className="adminDashboardNoData">No insurance companies found</p>
        ) : (
          filteredInsurance.map(insurance => (
            <div key={insurance.id} className="adminDashboardInsuranceCard">
              <div className="adminDashboardInsuranceHeader">
                <h3>{insurance.name}</h3>
                <span className={`adminDashboardStatusBadge ${insurance.status}`}>
                  {insurance.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="adminDashboardInsuranceInfo">
                <div className="adminDashboardInfoItem">
                  <FiUsers /> Contact: {insurance.contactName}
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
                  <FiDollarSign /> Commission: {insurance.commission}%
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPercent /> Active discounts: {
                    insuranceDiscounts.filter(d =>
                      d.insuranceId === insurance.id && d.isActive
                    ).length
                  }
                </div>
              </div>
              <div className="adminDashboardInsuranceActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditInsurance(insurance)}>
                  <FiEdit /> Edit
                </button>
                <button className="adminDashboardBtnSecondary" onClick={() => handleAddDiscount(insurance.id)}>
                  <FiTag /> Add Discount
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteInsurance(insurance.id)}>
                  <FiTrash2 /> Delete
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
        <h2>Insurance Discounts</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddDiscount()}>
            <FiPlus /> New Discount
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
          <p className="adminDashboardNoData">No discounts found</p>
        ) : (
          filteredDiscounts.map(discount => {
            const insurance = insuranceCompanies.find(i => i.id === discount.insuranceId);
            const isExpired = new Date(discount.endDate) < new Date();
            const isActive = discount.isActive && !isExpired;

            return (
              <div key={discount.id} className={`adminDashboardDiscountCard ${!isActive ? 'adminDashboardExpired' : ''}`}>
                <div className="adminDashboardDiscountHeader">
                  <h3>{insurance?.name || "Unknown insurance"}</h3>
                  <div className="adminDashboardDiscountBadges">
                    <span className={`adminDashboardStatusBadge ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                    </span>
                    <span className="adminDashboardDiscountTypeBadge">
                      {discount.discountType === "percentage" ? "Percentage" : "Fixed"}
                    </span>
                  </div>
                </div>
                <div className="adminDashboardDiscountInfo">
                  <div className="adminDashboardInfoItem">
                    <FiPercent /> Discount: {discount.discountValue}
                    {discount.discountType === "percentage" ? "%" : " UZS"}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDollarSign /> Min amount: {discount.minAmount || 0} UZS
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDollarSign /> Max amount: {discount.maxAmount || "Unlimited"} UZS
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiCalendar /> Start: {new Date(discount.startDate).toLocaleDateString('en-US')}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiCalendar /> End: {new Date(discount.endDate).toLocaleDateString('en-US')}
                  </div>
                  <div className="adminDashboardInfoItem">
                    <FiDatabase /> Created: {new Date(discount.createdAt).toLocaleDateString('en-US')}
                  </div>
                </div>
                <div className="adminDashboardDiscountActions">
                  <button className="adminDashboardBtnEdit" onClick={() => handleEditDiscount(discount)}>
                    <FiEdit /> Edit
                  </button>
                  <button
                    className={isActive ? "adminDashboardBtnWarning" : "adminDashboardBtnSecondary"}
                    onClick={() => handleToggleDiscountStatus(discount.id)}
                  >
                    {isActive ? <FiXCircle /> : <FiCheck />}
                    {isActive ? " Deactivate" : " Activate"}
                  </button>
                  <button className="adminDashboardBtnDelete" onClick={() => handleDeleteDiscount(discount.id)}>
                    <FiTrash2 /> Delete
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
        <h2>Staff</h2>
        <div className="adminDashboardHeaderActions">
          <div className="adminDashboardSearchContainer">
            <FiSearch className="adminDashboardSearchIcon" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminDashboardSearchInput"
            />
          </div>
          <button className="adminDashboardBtnPrimary" onClick={() => handleAddStaff()}>
            <FiPlus /> New Staff
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
          <p className="adminDashboardNoData">No staff found</p>
        ) : (
          filteredStaff.map(staffMember => (
            <div key={staffMember.id} className="adminDashboardStaffCard">
              <div className="adminDashboardStaffHeader">
                <h3>{staffMember.name}</h3>
                <span className={`adminDashboardStatusBadge ${staffMember.status}`}>
                  {staffMember.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="adminDashboardStaffInfo">
                <div className="adminDashboardInfoItem">
                  <FiUsers /> Position: {staffMember.position}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiPhone /> {staffMember.phone}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMail /> {staffMember.email || "N/A"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiMapPin /> Branch: {staffMember.branchId ? branches.find(b => b.id === staffMember.branchId)?.name || "N/A" : "General"}
                </div>
                <div className="adminDashboardInfoItem">
                  <FiDollarSign /> Salary: {staffMember.salary || "N/A"} UZS
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
                        title="Copy token"
                      >
                        <FiCopy />
                        <span>{copiedTokenId === staffMember.id ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="adminDashboardStaffActions">
                <button className="adminDashboardBtnEdit" onClick={() => handleEditStaff(staffMember)}>
                  <FiEdit /> Edit
                </button>
                <button className="adminDashboardBtnDelete" onClick={() => handleDeleteStaff(staffMember.id)}>
                  <FiTrash2 /> Delete
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
        <h2>Statistics</h2>
      </div>

      <div className="adminDashboardStatsGrid">
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiHome />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Total Branches</h3>
            <p>{stats.totalBranches || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiUsers />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Active Branches</h3>
            <p>{stats.activeBranches || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiShield />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Admins</h3>
            <p>{stats.totalAdmins || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiUsers />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Staff</h3>
            <p>{stats.totalStaff || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiFileText />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Insurance Companies</h3>
            <p>{stats.totalInsurance || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiPercent />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Active Discounts</h3>
            <p>{stats.activeDiscounts || 0}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiDollarSign />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Total Revenue</h3>
            <p>{(stats.totalRevenue || 0).toLocaleString()} UZS</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiTrendingUp />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Monthly Growth</h3>
            <p>{stats.monthlyGrowth || "0%"}</p>
          </div>
        </div>
        <div className="adminDashboardStatCard">
          <div className="adminDashboardStatIcon">
            <FiActivity />
          </div>
          <div className="adminDashboardStatInfo">
            <h3>Patient Satisfaction</h3>
            <p>{stats.patientSatisfaction || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="adminDashboardChartContainer">
        <p>Chart placeholder: Monthly Revenue Statistics</p>
      </div>
    </div>
  );

  return (
    <div className="adminDashboard">
      <div className="adminDashboardSidebar">
        <h1>Admin Panel</h1>
        <button
          className={`adminDashboardMenuItem ${activeTab === "branches" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("branches")}
        >
          <FiHome /> Branches
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "admins" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          <FiShield /> Admins
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "pending_admins" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("pending_admins")}
        >
          <FiFileText /> Requests
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "insurance" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("insurance")}
        >
          <FiFileText /> Insurance
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "discounts" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("discounts")}
        >
          <FiPercent /> Discounts
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "staff" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          <FiUsers /> Staff
        </button>
        <button
          className={`adminDashboardMenuItem ${activeTab === "stats" ? "adminDashboardActive" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <FiBarChart2 /> Statistics
        </button>
        <button className="adminDashboardMenuItem" onClick={() => navigate("/")}>
          Back
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
                  {modalType === "branch" && (currentItem ? "Edit Branch" : "Add New Branch")}
                  {modalType === "admin" && (currentItem ? "Edit Admin" : "Add New Admin")}
                  {modalType === "insurance" && (currentItem ? "Edit Insurance" : "Add New Insurance")}
                  {modalType === "staff" && (currentItem ? "Edit Staff" : "Add New Staff")}
                  {modalType === "discount" && (currentItem ? "Edit Discount" : "Add New Discount")}
                </h2>
                <button className="adminDashboardModalClose" onClick={() => setModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="adminDashboardModalBody">
                {modalType === "branch" && (
                  <div className="adminDashboardFormGroup">
                    <label>Branch Name</label>
                    <input type="text" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="Enter branch name"
                    />
                    <label>Address</label>
                    <input type="text" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                    <label>Phone</label>
                    <input type="text" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Email</label>
                    <input type="text" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                    <label>Manager</label>
                    <input type="text" value={branchForm.manager} onChange={(e) => setBranchForm({ ...branchForm, manager: e.target.value })}
                      placeholder="Enter manager name"
                    />
                    <label>Status</label>
                    <select value={branchForm.status} onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <label>Branch ID</label>
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
                          <FiRefreshCw /> Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {modalType === "admin" && (
                  <div className="adminDashboardFormGroup">
                    <label>Name</label>
                    <input type="text" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="Enter name"
                    />
                    <label>Email</label>
                    <input type="text" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                    <label>Phone</label>
                    <input type="text" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Telegram Chat ID</label>
                    <input type="text" value={adminForm.telegram} onChange={(e) => setAdminForm({ ...adminForm, telegram: e.target.value })}
                      placeholder="Enter Telegram Chat ID"
                    />
                    <label>Password</label>
                    <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder={currentItem ? "New password (optional)" : "Enter password"}
                    />
                    <label>Role</label>
                    <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}>
                      <option value="super_admin">Super Admin</option>
                      <option value="branch_admin">Branch Admin</option>
                    </select>
                    <label>Branch</label>
                    <select value={adminForm.branchId} onChange={(e) => setAdminForm({ ...adminForm, branchId: e.target.value })}>
                      <option value="">General</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <div className="adminDashboardTokenGenerator">
                      <label>Token (Auto-generated)</label>
                      <input type="text" value={currentItem ? adminForm.token || "New token will be generated" : "Token will be generated when adding new admin"} disabled />
                    </div>
                  </div>
                )}
                {modalType === "insurance" && (
                  <div className="adminDashboardFormGroup">
                    <label>Company Name</label>
                    <input type="text" value={insuranceForm.name} onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                      placeholder="Enter company name"
                    />
                    <label>Contact Person</label>
                    <input type="text" value={insuranceForm.contactName} onChange={(e) => setInsuranceForm({ ...insuranceForm, contactName: e.target.value })}
                      placeholder="Enter contact person name"
                    />
                    <label>Email</label>
                    <input type="text" value={insuranceForm.email} onChange={(e) => setInsuranceForm({ ...insuranceForm, email: e.target.value })}
                      placeholder="Enter email"
                    />
                    <label>Phone</label>
                    <input type="text" value={insuranceForm.phone} onChange={(e) => setInsuranceForm({ ...insuranceForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Address</label>
                    <input type="text" value={insuranceForm.address} onChange={(e) => setInsuranceForm({ ...insuranceForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                    <label>Coverage</label>
                    <input type="text" value={insuranceForm.coverage} onChange={(e) => setInsuranceForm({ ...insuranceForm, coverage: e.target.value })}
                      placeholder="Enter coverage"
                    />
                    <label>Commission (%)</label>
                    <input type="number" value={insuranceForm.commission} onChange={(e) => setInsuranceForm({ ...insuranceForm, commission: e.target.value })}
                      placeholder="Enter commission percentage"
                    />
                    <label>Status</label>
                    <select value={insuranceForm.status} onChange={(e) => setInsuranceForm({ ...insuranceForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                {modalType === "staff" && (
                  <div className="adminDashboardFormGroup">
                    <label>Name</label>
                    <input type="text" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Enter name"
                    />
                    <label>Position</label>
                    <input type="text" value={staffForm.position} onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                      placeholder="Enter position"
                    />
                    <label>Phone</label>
                    <input type="text" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                    />
                    <label>Email</label>
                    <input type="text" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="Enter email (optional)"
                    />
                    <label>Salary (UZS)</label>
                    <input type="number" value={staffForm.salary} onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                      placeholder="Enter salary"
                    />
                    <label>Branch</label>
                    <select value={staffForm.branchId} onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}>
                      <option value="">Select branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <label>Status</label>
                    <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="adminDashboardTokenGenerator">
                      <label>Token (Auto-generated)</label>
                      <input type="text" value={currentItem ? staffForm.token || "New token will be generated" : "Token will be generated when adding new staff"} disabled />
                    </div>
                  </div>
                )}
                {modalType === "discount" && (
                  <div className="adminDashboardFormGroup">
                    <label>Insurance Company</label>
                    <select value={discountForm.insuranceId} onChange={(e) => setDiscountForm({ ...discountForm, insuranceId: e.target.value })}>
                      <option value="">Select insurance company</option>
                      {insuranceCompanies.map(insurance => (
                        <option key={insurance.id} value={insurance.id}>
                          {insurance.name}
                        </option>
                      ))}
                    </select>
                    <label>Discount Type</label>
                    <select value={discountForm.discountType} onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (UZS)</option>
                    </select>
                    <label>
                      Discount Value
                      {discountForm.discountType === "percentage" ? " (%)" : " (UZS)"}
                    </label>
                    <input
                      type="number"
                      value={discountForm.discountValue}
                      onChange={(e) => setDiscountForm({ ...discountForm, discountValue: parseFloat(e.target.value) || 0 })}
                      placeholder={discountForm.discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                    />
                    <label>Minimum Amount (UZS)</label>
                    <input
                      type="number"
                      value={discountForm.minAmount}
                      onChange={(e) => setDiscountForm({ ...discountForm, minAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter minimum amount"
                    />
                    <label>Maximum Amount (UZS)</label>
                    <input
                      type="number"
                      value={discountForm.maxAmount}
                      onChange={(e) => setDiscountForm({ ...discountForm, maxAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter maximum amount (0 - unlimited)"
                    />
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={discountForm.startDate}
                      onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                    />
                    <label>End Date</label>
                    <input
                      type="date"
                      value={discountForm.endDate}
                      onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    />
                    <label>Status</label>
                    <select value={discountForm.isActive} onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.value === "true" })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
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
                  Save
                </button>
                <button className="adminDashboardModalBtn adminDashboardModalBtnSecondary" onClick={() => setModalOpen(false)}>
                  Cancel
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