import React, { useState, useContext, useEffect } from "react";
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiClock, FiUser, FiPhone, FiCalendar, FiX, FiMail, FiKey, FiAward, FiHome, FiCopy } from "react-icons/fi";
import { AppContext } from "../App";
import "./Staff.css";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Staff = () => {
  const { staff, setStaff, currentUser, getFromLocalStorage, saveToLocalStorage } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [adminTokenModal, setAdminTokenModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [branches, setBranches] = useState([]);

  // Ish kunlari va smena variantlari
  const workDays = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
  const roles = ["Doktor", "Yordamchi", "Admin", "Hamshira", "Administrator", "Boshliq", "Kassir", "Xizmat ko'rsatish"];
  const shifts = ["Kunduzgi", "Tungi", "Smenali"];

  useEffect(() => {
    // Filiallarni yuklash
    const loadedBranches = getFromLocalStorage("branches", []);
    setBranches(loadedBranches);
  }, [getFromLocalStorage]);

  // Joriy foydalanuvchi filiali
  const currentUserBranch = currentUser?.branchId;

  // Filtered staff - filial admini uchun faqat o'z filiali xodimlari
  const filteredStaff = staff.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole ? s.role === filterRole : true;
    const matchesBranch = filterBranch ? s.branchId === filterBranch : true;
    
    // Agar filial admini bo'lsa, faqat o'z filiali xodimlarini ko'rsatish
    const branchFilter = currentUser?.role === "branch_admin" ? s.branchId === currentUserBranch : true;
    
    return matchesSearch && matchesRole && matchesBranch && branchFilter;
  });

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

    const updatedStaff = staff.map((s) =>
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

    const updatedStaff = staff.map((s) =>
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
              branchId: staffMember.branchId,
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

  // Calculate monthly salaries for chart
  const getMonthlySalaries = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Faqat joriy filial xodimlari uchun
    const branchStaff = currentUser?.role === "branch_admin" 
      ? staff.filter(s => s.branchId === currentUserBranch)
      : staff;

    const salaryData = branchStaff.map((s) => {
      const monthlySalary = calculateMonthlySalary(s);
      return months.map(() => monthlySalary);
    });

    return {
      labels: months,
      datasets: branchStaff.map((s, index) => ({
        label: s.name,
        data: salaryData[index],
        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
      })),
    };
  };

  // Calculate monthly salary for a staff member
  const calculateMonthlySalary = (staffMember) => {
    let baseSalary = parseFloat(staffMember.salary) || 0;
    const shiftMultiplier = staffMember.shift === "Tungi" ? 1.2 : 1;
    return baseSalary * shiftMultiplier;
  };

  // Calculate daily salary
  const calculateDailySalary = (staffMember) => {
    if (staffMember.dailyRate) {
      const shiftMultiplier = staffMember.shift === "Tungi" ? 1.2 : 1;
      return parseFloat(staffMember.dailyRate) * shiftMultiplier;
    }
    const monthlySalary = calculateMonthlySalary(staffMember);
    const workDaysCount = staffMember.workHours?.days?.length || 22;
    return monthlySalary / workDaysCount;
  };

  // Individual staff monthly salary breakdown
  const getIndividualSalaryChart = (staffMember) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySalary = calculateMonthlySalary(staffMember);
    const dailySalary = calculateDailySalary(staffMember);
    const workDaysCount = staffMember.workHours?.days?.length || 22;

    return {
      labels: months,
      datasets: [
        {
          label: `${staffMember.name} - Oylik Maosh`,
          data: months.map(() => monthlySalary),
          backgroundColor: "#4CAF50",
        },
        {
          label: `${staffMember.name} - Kunlik Maosh`,
          data: months.map(() => dailySalary * workDaysCount),
          backgroundColor: "#2196F3",
        },
      ],
    };
  };

  const openModal = (staffMember = null) => {
    // Agar filial admini bo'lsa, faqat o'z filiali uchun xodim qo'shishi mumkin
    const defaultBranchId = currentUser?.role === "branch_admin" ? currentUserBranch : "";

    setCurrentStaff(
      staffMember
        ? {
            ...staffMember,
            workHours: {
              start: staffMember.workHours?.start || "09:00",
              end: staffMember.workHours?.end || "18:00",
              days: Array.isArray(staffMember.workHours?.days)
                ? [...staffMember.workHours.days]
                : ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"],
            },
          }
        : {
            id: null,
            name: "",
            email: "",
            phone: "",
            role: "",
            schedule: "",
            notes: "",
            salary: "",
            dailyRate: "",
            branchId: defaultBranchId,
            workHours: {
              start: "09:00",
              end: "18:00",
              days: ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"],
            },
            shift: "Kunduzgi",
          }
    );
    setModalOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const openViewModal = (staffMember) => {
    setCurrentStaff({
      ...staffMember,
      workHours: {
        start: staffMember.workHours?.start || "09:00",
        end: staffMember.workHours?.end || "18:00",
        days: Array.isArray(staffMember.workHours?.days) ? [...staffMember.workHours.days] : [],
      },
    });
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setTokenModalOpen(false);
    setAdminTokenModal(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentStaff.name.trim()) {
      setError("Ism kiritilishi shart");
      return;
    }
    if (currentStaff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentStaff.email)) {
      setError("Noto'g'ri email formati");
      return;
    }
    if (currentStaff.phone && !/^\+998\d{9}$/.test(currentStaff.phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      return;
    }
    if (!currentStaff.role) {
      setError("Rol tanlanishi shart");
      return;
    }
    if (!currentStaff.salary && !currentStaff.dailyRate) {
      setError("Oylik yoki kunlik maosh kiritilishi shart");
      return;
    }
    if (currentStaff.salary && isNaN(parseFloat(currentStaff.salary))) {
      setError("Oylik maosh raqam bo'lishi kerak");
      return;
    }
    if (currentStaff.dailyRate && isNaN(parseFloat(currentStaff.dailyRate))) {
      setError("Kunlik maosh raqam bo'lishi kerak");
      return;
    }
    if (!currentStaff.workHours.days.length) {
      setError("Kamida bitta ish kuni tanlanishi kerak");
      return;
    }
    if (!currentStaff.branchId && currentUser?.role !== "branch_admin") {
      setError("Filial tanlanishi shart");
      return;
    }

    const updated = currentStaff.id
      ? staff.map((s) => (s.id === currentStaff.id ? currentStaff : s))
      : [...staff, { 
          ...currentStaff, 
          id: Date.now(), 
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.name
        }];
    
    setStaff(updated);
    saveToLocalStorage("staff", updated);
    setSuccessMessage(currentStaff.id ? "Xodim yangilandi" : "Yangi xodim qo'shildi");
    
    setTimeout(() => {
      setSuccessMessage("");
      closeModal();
    }, 3000);
  };

  const deleteStaff = (id) => {
    if (window.confirm("Haqiqatan ham bu xodimni o'chirmoqchimisiz?")) {
      const updatedStaff = staff.filter((s) => s.id !== id);
      setStaff(updatedStaff);
      saveToLocalStorage("staff", updatedStaff);
      setSuccessMessage("Xodim o'chirildi");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleWorkDaysChange = (day) => {
    setCurrentStaff((prev) => {
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

  // Admin rolini tekshirish
  const isAdminRole = (role) => {
    return role === "Admin" || role === "Administrator" || role === "Boshliq";
  };

  // Filial boshlig'i rolini tekshirish
  const isBranchHeadRole = (role) => {
    return role === "Boshliq";
  };

  // Filial nomini olish
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "Filial topilmadi";
  };

  return (
    <div className="staff">
      <div className="page-header">
        <h1>Xodimlar</h1>
        <div className="header-info">
          <span className="badge">{filteredStaff.length} ta</span>
          {currentUser?.role === "branch_admin" && (
            <span className="branch-badge">
              <FiHome /> {getBranchName(currentUserBranch)}
            </span>
          )}
        </div>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="actions">
        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Ism, rol, email yoki telefon bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="">Barcha rollar</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          {currentUser?.role !== "branch_admin" && (
            <div className="filter-box">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="filter-select"
              >
                <option value="">Barcha filiallar</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi Xodim
        </button>
      </div>

      {staff.length > 0 && (
        <div className="chart-container">
          <h3>Oylik Maoshlar ({currentUser?.role === "branch_admin" ? getBranchName(currentUserBranch) : "Barcha Filiallar"})</h3>
          <Bar
            data={getMonthlySalaries()}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Xodimlar Oylik Maoshlari" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Maosh (UZS)" },
                },
              },
            }}
          />
        </div>
      )}

      {filteredStaff.length === 0 ? (
        <div className="empty-state">
          {searchTerm || filterRole || filterBranch ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>Qidiruv shartlari bo'yicha xodim topilmadi</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterRole("");
                  setFilterBranch("");
                }}
                className="btn-secondary"
              >
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali xodimlar mavjud emas</h3>
              <p>Birinchi xodimingizni qo'shing</p>
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi xodim qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Rol</th>
                {currentUser?.role !== "branch_admin" && <th>Filial</th>}
                <th>Ish soatlari</th>
                <th>Navbatchilik</th>
                <th>Oylik Maosh</th>
                <th>Token</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id} onClick={() => openViewModal(s)} className="staff-row">
                  <td>
                    <div className="staff-name">
                      {isAdminRole(s.role) && <FiAward className="admin-crown" />}
                      {isBranchHeadRole(s.role) && <FiHome className="branch-head-icon" />}
                      <FiUser className="staff-icon" />
                      {s.name}
                    </div>
                  </td>
                  <td>
                    <div className="staff-email">
                      <FiMail className="staff-icon" />
                      {s.email || "-"}
                    </div>
                  </td>
                  <td>
                    <div className="staff-phone">
                      <FiPhone className="staff-icon" />
                      {s.phone || "-"}
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${isAdminRole(s.role) ? 'role-admin' : isBranchHeadRole(s.role) ? 'role-branch-head' : 'role-staff'}`}>
                      {s.role}
                    </span>
                  </td>
                  {currentUser?.role !== "branch_admin" && (
                    <td>
                      <div className="staff-branch">
                        <FiHome className="staff-icon" />
                        {getBranchName(s.branchId)}
                      </div>
                    </td>
                  )}
                  <td>
                    <div className="staff-schedule">
                      <FiClock className="staff-icon" />
                      {s.workHours ? `${s.workHours.start} - ${s.workHours.end}` : s.schedule || "-"}
                    </div>
                  </td>
                  <td>
                    <div className="staff-shift">
                      <FiCalendar className="staff-icon" />
                      {s.shift || "-"}
                    </div>
                  </td>
                  <td>{new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS" }).format(calculateMonthlySalary(s))}</td>
                  <td>
                    <div className="token-status">
                      {s.token && !isTokenExpired(s) ? (
                        <span className={`token-active ${s.isAdminToken ? 'admin-token' : s.isBranchHeadToken ? 'branch-head-token' : ''}`}>
                          {s.isBranchHeadToken ? 'Filial Token' : s.isAdminToken ? 'Admin Token' : 'Faol'} 
                          {s.isBranchHeadToken ? ' (24 soat)' : ' (10 daqiqa)'}
                        </span>
                      ) : (
                        <span className="token-inactive">Faol emas</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(s);
                        }}
                        className="btn-edit"
                        title="Tahrirlash"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isBranchHeadRole(s.role)) {
                            handleGenerateBranchHeadToken(s);
                          } else {
                            handleGenerateToken(s, isAdminRole(s.role));
                          }
                        }}
                        className={`btn-token ${isAdminRole(s.role) ? 'btn-admin-token' : isBranchHeadRole(s.role) ? 'btn-branch-head-token' : ''}`}
                        title={
                          isBranchHeadRole(s.role) ? "Filial boshlig'i token yaratish" : 
                          isAdminRole(s.role) ? "Admin token yaratish" : "Token yaratish"
                        }
                      >
                        <FiKey />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStaff(s.id);
                        }}
                        className="btn-delete"
                        title="O'chirish"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Xodim qo'shish/tahrirlash modal oynasi */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>{currentStaff.id ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}</h2>
                <button type="button" onClick={closeModal} className="close-button">
                  <FiX />
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              <div className="form-sections">
                {/* Asosiy ma'lumotlar */}
                <div className="form-section">
                  <h3>Asosiy Ma'lumotlar</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>To'liq Ism *</label>
                      <input
                        type="text"
                        value={currentStaff.name}
                        onChange={(e) => setCurrentStaff({...currentStaff, name: e.target.value})}
                        placeholder="Familiya Ism Sharif"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={currentStaff.email}
                        onChange={(e) => setCurrentStaff({...currentStaff, email: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Telefon</label>
                      <input
                        type="tel"
                        value={currentStaff.phone}
                        onChange={(e) => setCurrentStaff({...currentStaff, phone: e.target.value})}
                        placeholder="+998901234567"
                      />
                    </div>

                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        value={currentStaff.role}
                        onChange={(e) => setCurrentStaff({...currentStaff, role: e.target.value})}
                        required
                      >
                        <option value="">Rolni tanlang</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {currentUser?.role !== "branch_admin" && (
                      <div className="form-group">
                        <label>Filial *</label>
                        <select
                          value={currentStaff.branchId}
                          onChange={(e) => setCurrentStaff({...currentStaff, branchId: e.target.value})}
                          required
                        >
                          <option value="">Filial tanlang</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ish jadvali */}
                <div className="form-section">
                  <h3>Ish Jadvali</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Ish boshlash vaqti</label>
                      <input
                        type="time"
                        value={currentStaff.workHours.start}
                        onChange={(e) => setCurrentStaff({
                          ...currentStaff, 
                          workHours: {...currentStaff.workHours, start: e.target.value}
                        })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Ish tugash vaqti</label>
                      <input
                        type="time"
                        value={currentStaff.workHours.end}
                        onChange={(e) => setCurrentStaff({
                          ...currentStaff, 
                          workHours: {...currentStaff.workHours, end: e.target.value}
                        })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Navbatchilik</label>
                      <select
                        value={currentStaff.shift}
                        onChange={(e) => setCurrentStaff({...currentStaff, shift: e.target.value})}
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
                            checked={currentStaff.workHours.days.includes(day)}
                            onChange={() => handleWorkDaysChange(day)}
                          />
                          <span className="checkmark"></span>
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Maosh ma'lumotlari */}
                <div className="form-section">
                  <h3>Maosh Ma'lumotlari</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Oylik Maosh (UZS)</label>
                      <input
                        type="number"
                        value={currentStaff.salary}
                        onChange={(e) => setCurrentStaff({...currentStaff, salary: e.target.value})}
                        placeholder="5000000"
                      />
                    </div>

                    <div className="form-group">
                      <label>Kunlik Maosh (UZS)</label>
                      <input
                        type="number"
                        value={currentStaff.dailyRate}
                        onChange={(e) => setCurrentStaff({...currentStaff, dailyRate: e.target.value})}
                        placeholder="200000"
                      />
                    </div>
                  </div>
                  <p className="form-hint">Kamida bitta maosh turi kiritilishi shart</p>
                </div>

                {/* Qo'shimcha ma'lumotlar */}
                <div className="form-section">
                  <h3>Qo'shimcha Ma'lumotlar</h3>
                  <div className="form-group">
                    <label>Izohlar</label>
                    <textarea
                      value={currentStaff.notes || ""}
                      onChange={(e) => setCurrentStaff({...currentStaff, notes: e.target.value})}
                      placeholder="Qo'shimcha ma'lumotlar..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {currentStaff.id ? "Saqlash" : "Qo'shish"}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xodimni ko'rish modal oynasi */}
      {viewModalOpen && currentStaff && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xodim Ma'lumotlari</h2>
              <button type="button" onClick={closeModal} className="close-button">
                <FiX />
              </button>
            </div>

            <div className="staff-details">
              <div className="detail-section">
                <h3>Asosiy Ma'lumotlar</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Ism:</strong>
                    <span>{currentStaff.name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Rol:</strong>
                    <span className={`role-badge ${isAdminRole(currentStaff.role) ? 'role-admin' : isBranchHeadRole(currentStaff.role) ? 'role-branch-head' : 'role-staff'}`}>
                      {currentStaff.role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong>
                    <span>{currentStaff.email || "Mavjud emas"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Telefon:</strong>
                    <span>{currentStaff.phone || "Mavjud emas"}</span>
                  </div>
                  {currentUser?.role !== "branch_admin" && (
                    <div className="detail-item">
                      <strong>Filial:</strong>
                      <span>{getBranchName(currentStaff.branchId)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Ish Jadvali</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Ish vaqti:</strong>
                    <span>{currentStaff.workHours.start} - {currentStaff.workHours.end}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Navbatchilik:</strong>
                    <span>{currentStaff.shift}</span>
                  </div>
                  <div className="detail-item full-width">
                    <strong>Ish kunlari:</strong>
                    <div className="days-list">
                      {currentStaff.workHours.days.map(day => (
                        <span key={day} className="day-tag">{day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Maosh Ma'lumotlari</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Oylik maosh:</strong>
                    <span>{currentStaff.salary ? new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS" }).format(parseFloat(currentStaff.salary)) : "Mavjud emas"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Kunlik maosh:</strong>
                    <span>{currentStaff.dailyRate ? new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS" }).format(parseFloat(currentStaff.dailyRate)) : "Mavjud emas"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Hisoblangan oylik:</strong>
                    <span>{new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS" }).format(calculateMonthlySalary(currentStaff))}</span>
                  </div>
                </div>
              </div>

              {currentStaff.notes && (
                <div className="detail-section">
                  <h3>Qo'shimcha Ma'lumotlar</h3>
                  <div className="detail-item full-width">
                    <p>{currentStaff.notes}</p>
                  </div>
                </div>
              )}

              {/* Token ma'lumotlari */}
              {currentStaff.token && !isTokenExpired(currentStaff) && (
                <div className="detail-section">
                  <h3>Token Ma'lumotlari</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Token:</strong>
                      <span className="token-display-small">{currentStaff.token}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Turi:</strong>
                      <span>
                        {currentStaff.isBranchHeadToken ? "Filial Boshlig'i Token" : 
                         currentStaff.isAdminToken ? "Admin Token" : "Oddiy Token"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Amal qilish muddati:</strong>
                      <span>{new Date(currentStaff.tokenExpiry).toLocaleString()}</span>
                    </div>
                    {currentStaff.tokenGeneratedBy && (
                      <div className="detail-item">
                        <strong>Yaratgan:</strong>
                        <span>{currentStaff.tokenGeneratedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Individual salary chart */}
              <div className="detail-section">
                <h3>Maosh Statistikasi</h3>
                <div className="chart-mini">
                  <Bar
                    data={getIndividualSalaryChart(currentStaff)}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                    height={200}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  closeModal();
                  openModal(currentStaff);
                }} 
                className="btn-primary"
              >
                <FiEdit /> Tahrirlash
              </button>
              <button onClick={closeModal} className="btn-secondary">
                Yopish
              </button>
            </div>
          </div>
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
              <h2>
                {currentStaff?.isBranchHeadToken ? "Filial Boshlig'i Token Yaratildi" : "Admin Token Yaratildi"}
              </h2>
              <button type="button" onClick={closeModal} className="close-button">
                <FiX />
              </button>
            </div>
            <div className="token-content">
              <div className="token-display admin-token-display">
                {currentStaff?.isBranchHeadToken ? (
                  <FiHome className="token-icon branch-head-icon" />
                ) : (
                  <FiAward className="token-icon admin-icon" />
                )}
                <h3>{generatedToken}</h3>
                <p className="admin-token-warning">
                  {currentStaff?.isBranchHeadToken ? (
                    <>
                      ⚠️ Diqqat! Bu FILIAL BOSHLIG'I token. Ushbu token orqali kiringan foydalanuvchi 
                      faqat <strong>{getBranchName(currentStaff?.branchId)}</strong> filiali uchun boshqarish huquqiga ega bo'ladi.
                      <br />
                      <strong>Muddati: 24 soat</strong>
                    </>
                  ) : (
                    <>
                      ⚠️ Diqqat! Bu ADMIN token. Ushbu token orqali kiringan foydalanuvchi 
                      butun tizimni boshqarish huquqiga ega bo'ladi.
                      <br />
                      <strong>Muddati: 10 daqiqa</strong>
                    </>
                  )}
                </p>
              </div>
              <div className="token-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    alert("Token nusxalandi!");
                  }}
                  className={`btn-primary ${currentStaff?.isBranchHeadToken ? 'branch-head-copy-btn' : 'admin-copy-btn'}`}
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

export default Staff;