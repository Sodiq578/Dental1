import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../App";
import { 
  getFromLocalStorage, 
  saveToLocalStorage, 
  validatePhone, 
  validateEmail,
  sendTelegramMessage 
} from "../utils";
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiEdit, 
  FiTrash2, 
  FiSearch, 
  FiPlus,
  FiEye,
  FiShield,
  FiClock,
  FiCheck,
  FiX,
  FiFilter,
  FiDownload,
  FiUpload
} from "react-icons/fi";
import "./PatientsWithAccount.css";

const PatientsWithAccount = () => {
  const { 
    users, 
    setUsers, 
    patients, 
    setPatients,
    currentUser,
    isLoading,
    setIsLoading 
  } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [exportData, setExportData] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
    status: "active",
    patientId: "",
    telegram: "",
    notes: ""
  });

  // Filtr qilingan foydalanuvchilar
  const patientsWithAccounts = users.filter(user => 
    user.role === "patient" && user.patientId
  );

  // Statistik ma'lumotlar
  const stats = {
    total: patientsWithAccounts.length,
    active: patientsWithAccounts.filter(user => user.status === "active").length,
    inactive: patientsWithAccounts.filter(user => user.status === "inactive").length,
    pending: patientsWithAccounts.filter(user => user.status === "pending").length
  };

  // Foydalanuvchilarni filtrlash
  const filteredUsers = patientsWithAccounts.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.patientId?.toString().includes(searchTerm);

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Foydalanuvchilarni saralash
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy] || "";
    let bValue = b[sortBy] || "";

    if (sortBy === "createdAt") {
      aValue = new Date(a.createdAt || 0);
      bValue = new Date(b.createdAt || 0);
    }

    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Modalni ochish
  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (type === "edit" && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: user.password || "",
        role: user.role || "patient",
        status: user.status || "active",
        patientId: user.patientId || "",
        telegram: user.telegram || "",
        notes: user.notes || ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "patient",
        status: "active",
        patientId: "",
        telegram: "",
        notes: ""
      });
    }
    
    setShowModal(true);
  };

  // Modalni yopish
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "patient",
      status: "active",
      patientId: "",
      telegram: "",
      notes: ""
    });
  };

  // Form inputlarini boshqarish
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Yangi foydalanuvchi qo'shish
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validatsiya
      if (!formData.name.trim()) {
        alert("Ism kiritilishi shart");
        return;
      }

      if (!formData.email && !formData.phone) {
        alert("Email yoki telefon raqami kiritilishi shart");
        return;
      }

      if (formData.email && !validateEmail(formData.email)) {
        alert("Noto'g'ri email formati");
        return;
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        alert("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
        return;
      }

      if (!formData.password) {
        alert("Parol kiritilishi shart");
        return;
      }

      // Email yoki telefon unikalligini tekshirish
      const existingUser = users.find(user => 
        user.email === formData.email || user.phone === formData.phone
      );

      if (existingUser) {
        alert("Bu email yoki telefon raqami bilan foydalanuvchi mavjud");
        return;
      }

      // Patient ID ni tekshirish
      let patientId = formData.patientId;
      if (!patientId) {
        // Avtomatik patient ID yaratish
        patientId = Date.now();
      } else {
        const existingPatient = patients.find(p => p.id === parseInt(patientId));
        if (!existingPatient) {
          alert("Berilgan ID bilan bemor topilmadi");
          return;
        }
      }

      const newUser = {
        id: Date.now(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        status: formData.status,
        patientId: patientId,
        telegram: formData.telegram.trim(),
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveToLocalStorage('users', updatedUsers);

      // Telegram xabar yuborish (agar chat ID bo'lsa)
      if (formData.telegram) {
        const message = `🦷 KEKSRI: Yangi foydalanuvchi hisobi yaratildi\n\nIsm: ${formData.name}\nEmail: ${formData.email || "Yo'q"}\nTelefon: ${formData.phone || "Yo'q"}\nHisob turi: ${formData.role}\nStatus: ${formData.status}\n\nTizimga kirish uchun: https://keksri.uz/login`;
        await sendTelegramMessage(formData.telegram, message);
      }

      alert("Foydalanuvchi muvaffaqiyatli qo'shildi");
      closeModal();
    } catch (error) {
      console.error("Foydalanuvchi qo'shishda xato:", error);
      alert("Foydalanuvchi qo'shishda xato yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // Foydalanuvchini tahrirlash
  const handleEditUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!selectedUser) return;

      // Validatsiya
      if (!formData.name.trim()) {
        alert("Ism kiritilishi shart");
        return;
      }

      if (formData.email && !validateEmail(formData.email)) {
        alert("Noto'g'ri email formati");
        return;
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        alert("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
        return;
      }

      // Boshqa foydalanuvchilarda email/telefon takrorlanishini tekshirish
      const existingUser = users.find(user => 
        user.id !== selectedUser.id && 
        (user.email === formData.email || user.phone === formData.phone)
      );

      if (existingUser) {
        alert("Bu email yoki telefon raqami bilan boshqa foydalanuvchi mavjud");
        return;
      }

      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? {
              ...user,
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              password: formData.password || user.password,
              role: formData.role,
              status: formData.status,
              patientId: formData.patientId,
              telegram: formData.telegram.trim(),
              notes: formData.notes.trim(),
              updatedAt: new Date().toISOString()
            }
          : user
      );

      setUsers(updatedUsers);
      saveToLocalStorage('users', updatedUsers);

      alert("Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi");
      closeModal();
    } catch (error) {
      console.error("Foydalanuvchini tahrirlashda xato:", error);
      alert("Foydalanuvchini tahrirlashda xato yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  // Foydalanuvchini o'chirish
  const handleDeleteUser = (user) => {
    if (window.confirm(`${user.name} foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) {
      const updatedUsers = users.filter(u => u.id !== user.id);
      setUsers(updatedUsers);
      saveToLocalStorage('users', updatedUsers);
      alert("Foydalanuvchi muvaffaqiyatli o'chirildi");
    }
  };

  // Statusni o'zgartirish
  const handleStatusChange = (user, newStatus) => {
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
        : u
    );

    setUsers(updatedUsers);
    saveToLocalStorage('users', updatedUsers);
    alert(`Foydalanuvchi statusi ${newStatus} ga o'zgartirildi`);
  };

  // Ma'lumotlarni eksport qilish
  const handleExportData = () => {
    const dataToExport = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      patientId: user.patientId,
      telegram: user.telegram,
      notes: user.notes,
      createdAt: user.createdAt
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keksri_patients_accounts_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ma'lumotlarni import qilish
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!Array.isArray(importedData)) {
          alert("Noto'g'ri fayl formati");
          return;
        }

        // Validatsiya
        const validUsers = importedData.filter(user => 
          user.name && (user.email || user.phone) && user.role
        );

        if (validUsers.length === 0) {
          alert("Faylda haqiqiy ma'lumotlar topilmadi");
          return;
        }

        // Yangi ID lar bilan foydalanuvchilarni qo'shish
        const newUsers = validUsers.map(user => ({
          ...user,
          id: Date.now() + Math.random(),
          password: user.password || "default123",
          status: user.status || "active",
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        const updatedUsers = [...users, ...newUsers];
        setUsers(updatedUsers);
        saveToLocalStorage('users', updatedUsers);

        alert(`${validUsers.length} ta foydalanuvchi muvaffaqiyatli import qilindi`);
        setImportFile(null);
        e.target.value = ""; // Inputni tozalash
      } catch (error) {
        console.error("Import xatosi:", error);
        alert("Faylni o'qishda xato. JSON formatini tekshiring.");
      }
    };
    reader.readAsText(file);
  };

  // Bemor ma'lumotlarini olish
  const getPatientInfo = (patientId) => {
    return patients.find(p => p.id === parseInt(patientId)) || null;
  };

  // Status rangini olish
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  // Status matnini olish
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Faol';
      case 'inactive': return 'Nofaol';
      case 'pending': return 'Kutilmoqda';
      default: return status;
    }
  };

  return (
    <div className="patients-with-account">
      {/* Sarlavha va statistikalar */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FiUser className="title-icon" />
            Hisobga Ega Bemorlar
          </h1>
          <p className="page-subtitle">
            Tizimda hisob ochgan bemorlarni boshqarish
          </p>
        </div>
        
        {showStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FiUser />
              </div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Jami Foydalanuvchilar</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon active">
                <FiCheck />
              </div>
              <div className="stat-info">
                <h3>{stats.active}</h3>
                <p>Faol Foydalanuvchilar</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon inactive">
                <FiX />
              </div>
              <div className="stat-info">
                <h3>{stats.inactive}</h3>
                <p>Nofaol Foydalanuvchilar</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon pending">
                <FiClock />
              </div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Kutilayotganlar</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Boshqaruv paneli */}
      <div className="control-panel">
        <div className="search-section">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Foydalanuvchi qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Rol:</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">Barcha Rollar</option>
              <option value="patient">Bemor</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Barcha Statuslar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
              <option value="pending">Kutilmoqda</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Saralash:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Ism</option>
              <option value="email">Email</option>
              <option value="createdAt">Sana</option>
              <option value="status">Status</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="sort-order-btn"
          >
            {sortOrder === "asc" ? "⬆️" : "⬇️"}
          </button>
        </div>

        <div className="action-section">
          <button 
            className="btn btn-primary"
            onClick={() => openModal("add")}
          >
            <FiPlus /> Yangi Foydalanuvchi
          </button>

          <div className="import-export-buttons">
            <label className="btn btn-secondary">
              <FiUpload /> Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
            
            <button 
              className="btn btn-secondary"
              onClick={handleExportData}
            >
              <FiDownload /> Export
            </button>
          </div>

          <button 
            className="btn btn-outline"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Statistikalarni Yashirish" : "Statistikalarni Ko'rsatish"}
          </button>
        </div>
      </div>

      {/* Foydalanuvchilar jadvali */}
      <div className="users-table-container">
        {sortedUsers.length === 0 ? (
          <div className="empty-state">
            <FiUser className="empty-icon" />
            <h3>Hech qanday foydalanuvchi topilmadi</h3>
            <p>Yangilarini qo'shish uchun "Yangi Foydalanuvchi" tugmasini bosing</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Email/Telefon</th>
                  <th>Bemor ID</th>
                  <th>Rol</th>
                  <th>Status</th>
                  <th>Yaratilgan Sana</th>
                  <th>Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(user => {
                  const patientInfo = getPatientInfo(user.patientId);
                  return (
                    <tr key={user.id} className="user-row">
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <strong>{user.name}</strong>
                            {user.notes && (
                              <small className="user-notes">{user.notes}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          {user.email && (
                            <div className="contact-item">
                              <FiMail /> {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="contact-item">
                              <FiPhone /> {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="patient-id">
                          {user.patientId}
                          {patientInfo && (
                            <small className="patient-name">
                              ({patientInfo.name})
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          <FiShield /> {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="status-actions">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(user.status) }}
                          >
                            {getStatusText(user.status)}
                          </span>
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user, e.target.value)}
                            className="status-select"
                          >
                            <option value="active">Faol</option>
                            <option value="inactive">Nofaol</option>
                            <option value="pending">Kutilmoqda</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => openModal("edit", user)}
                            title="Tahrirlash"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => openModal("edit", user)}
                            title="Tahrirlash"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteUser(user)}
                            title="O'chirish"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sortedUsers.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              {sortedUsers.length} ta foydalanuvchi
            </div>
          </div>
        )}
      </div>

      {/* Modal oynasi */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {modalType === "add" ? "Yangi Foydalanuvchi" : "Foydalanuvchini Tahrirlash"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={modalType === "add" ? handleAddUser : handleEditUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ism *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="To'liq ism"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>

                  <div className="form-group">
                    <label>Parol *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={modalType === "add"}
                      placeholder="Kamida 6 ta belgi"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rol</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="patient">Bemor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                      <option value="pending">Kutilmoqda</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Bemor ID</label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      placeholder="Bemor ID (avtomatik yaratiladi)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telegram Chat ID</label>
                    <input
                      type="text"
                      name="telegram"
                      value={formData.telegram}
                      onChange={handleInputChange}
                      placeholder="123456789"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Qo'shimcha ma'lumotlar</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Qo'shimcha ma'lumotlar..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Saqlanmoqda..." : 
                   modalType === "add" ? "Qo'shish" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsWithAccount;