import React, { useState, useContext } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiBriefcase, FiClock, FiUser, FiPhone, FiCalendar, FiX, FiMail, FiKey } from 'react-icons/fi';
import { AppContext } from '../App';
import './Staff.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Staff = () => {
  const { staff, setStaff, darkMode } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  // Filtered staff
  const filteredStaff = staff.filter(s =>
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterRole ? s.role === filterRole : true)
  );

  // Generate random token (10 characters, alphanumeric)
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 10; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Generate token for staff member
  const handleGenerateToken = (staffMember) => {
    const token = generateToken();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const updatedStaff = staff.map(s => 
      s.id === staffMember.id 
        ? { 
            ...s, 
            token: token,
            tokenExpiry: tokenExpiry.toISOString(),
            tokenGeneratedAt: new Date().toISOString()
          }
        : s
    );
    
    setStaff(updatedStaff);
    setGeneratedToken(token);
    setTokenModalOpen(true);
  };

  // Check if token is expired
  const isTokenExpired = (staffMember) => {
    if (!staffMember.tokenExpiry) return true;
    return new Date() > new Date(staffMember.tokenExpiry);
  };

  // Calculate monthly salaries for chart
  const getMonthlySalaries = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salaryData = staff.map(s => {
      const monthlySalary = calculateMonthlySalary(s);
      return months.map(() => monthlySalary);
    });

    return {
      labels: months,
      datasets: staff.map((s, index) => ({
        label: s.name,
        data: salaryData[index],
        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
      })),
    };
  };

  // Calculate monthly salary for a staff member
  const calculateMonthlySalary = (staffMember) => {
    let baseSalary = parseFloat(staffMember.salary) || 0;
    const shiftMultiplier = staffMember.shift === 'Tungi' ? 1.2 : 1; // 20% increase for night shift
    return baseSalary * shiftMultiplier;
  };

  // Calculate daily salary
  const calculateDailySalary = (staffMember) => {
    if (staffMember.dailyRate) {
      const shiftMultiplier = staffMember.shift === 'Tungi' ? 1.2 : 1;
      return parseFloat(staffMember.dailyRate) * shiftMultiplier;
    }
    const monthlySalary = calculateMonthlySalary(staffMember);
    const workDaysCount = staffMember.workHours?.days?.length || 22; // Default to 22 working days
    return monthlySalary / workDaysCount;
  };

  // Individual staff monthly salary breakdown
  const getIndividualSalaryChart = (staffMember) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalary = calculateMonthlySalary(staffMember);
    const dailySalary = calculateDailySalary(staffMember);
    const workDaysCount = staffMember.workHours?.days?.length || 22;

    return {
      labels: months,
      datasets: [
        {
          label: `${staffMember.name} - Oylik Maosh`,
          data: months.map(() => monthlySalary),
          backgroundColor: '#4CAF50',
        },
        {
          label: `${staffMember.name} - Kunlik Maosh`,
          data: months.map(() => dailySalary * workDaysCount),
          backgroundColor: '#2196F3',
        },
      ],
    };
  };

  const openModal = (staffMember = null) => {
    setCurrentStaff(staffMember ? {
      ...staffMember,
      workHours: {
        start: staffMember.workHours?.start || '09:00',
        end: staffMember.workHours?.end || '18:00',
        days: Array.isArray(staffMember.workHours?.days) ? [...staffMember.workHours.days] : ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma']
      }
    } : {
      id: null,
      name: '',
      email: '',
      role: '',
      phone: '',
      schedule: '',
      notes: '',
      salary: '',
      dailyRate: '',
      workHours: { start: '09:00', end: '18:00', days: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'] },
      shift: 'Kunduzgi'
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const openViewModal = (staffMember) => {
    setCurrentStaff({
      ...staffMember,
      workHours: {
        start: staffMember.workHours?.start || '09:00',
        end: staffMember.workHours?.end || '18:00',
        days: Array.isArray(staffMember.workHours?.days) ? [...staffMember.workHours.days] : []
      }
    });
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setTokenModalOpen(false);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentStaff.name.trim()) {
      setError('Ism kiritilishi shart');
      return;
    }
    if (currentStaff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentStaff.email)) {
      setError('Noto‘g‘ri email formati');
      return;
    }
    if (currentStaff.phone && !/^\+998\d{9}$/.test(currentStaff.phone)) {
      setError('Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak');
      return;
    }
    if (!currentStaff.salary && !currentStaff.dailyRate) {
      setError('Oylik yoki kunlik maosh kiritilishi shart');
      return;
    }
    if (currentStaff.salary && isNaN(parseFloat(currentStaff.salary))) {
      setError('Oylik maosh raqam bo‘lishi kerak');
      return;
    }
    if (currentStaff.dailyRate && isNaN(parseFloat(currentStaff.dailyRate))) {
      setError('Kunlik maosh raqam bo‘lishi kerak');
      return;
    }
    if (!currentStaff.workHours.days.length) {
      setError('Kamida bitta ish kuni tanlanishi kerak');
      return;
    }

    const updated = currentStaff.id
      ? staff.map(s => (s.id === currentStaff.id ? currentStaff : s))
      : [...staff, { ...currentStaff, id: Date.now() }];
    setStaff(updated);
    setSuccessMessage(currentStaff.id ? 'Xodim yangilandi' : 'Yangi xodim qo‘shildi');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deleteStaff = (id) => {
    if (window.confirm('Haqiqatan ham bu xodimni o‘chirmoqchimisiz?')) {
      setStaff(staff.filter(s => s.id !== id));
      setSuccessMessage('Xodim o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleWorkDaysChange = (day) => {
    setCurrentStaff(prev => {
      const currentDays = Array.isArray(prev.workHours?.days) ? [...prev.workHours.days] : [];
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      
      return {
        ...prev,
        workHours: {
          ...prev.workHours,
          days: updatedDays
        }
      };
    });
  };

  return (
    <div className={`staff ${darkMode ? 'dark' : ''}`}>
      <div className="page-header">
        <h1>Xodimlar</h1>
        <span className="badge">{staff.length} ta</span>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="actions">
        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Ism, rol, email yoki telefon bo‘yicha qidirish..."
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
              <option value="Doktor">Doktor</option>
              <option value="Yordamchi">Yordamchi</option>
              <option value="Admin">Admin</option>
              <option value="Hamshira">Hamshira</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi Xodim
        </button>
      </div>

      {/* Monthly Salary Chart */}
      {staff.length > 0 && (
        <div className="chart-container">
          <h3>Oylik Maoshlar (Umumiy)</h3>
          <Bar
            data={getMonthlySalaries()}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Xodimlar Oylik Maoshlari' },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Maosh (UZS)' },
                },
              },
            }}
          />
        </div>
      )}

      {filteredStaff.length === 0 ? (
        <div className="empty-state">
          {searchTerm || filterRole ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>Qidiruv shartlari bo‘yicha xodim topilmadi</p>
              <button onClick={() => {setSearchTerm(''); setFilterRole('');}} className="btn-secondary">
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali xodimlar mavjud emas</h3>
              <p>Birinchi xodimingizni qo‘shing</p>
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
                <th>Rol</th>
                <th>Telefon</th>
                <th>Ish soatlari</th>
                <th>Navbatchilik</th>
                <th>Oylik Maosh</th>
                <th>Token</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s.id} onClick={() => openViewModal(s)} className="staff-row">
                  <td>
                    <div className="staff-name">
                      <FiUser className="staff-icon" />
                      {s.name}
                    </div>
                  </td>
                  <td>
                    <div className="staff-email">
                      <FiMail className="staff-icon" />
                      {s.email || '-'}
                    </div>
                  </td>
                  <td>{s.role}</td>
                  <td>
                    <div className="staff-phone">
                      <FiPhone className="staff-icon" />
                      {s.phone || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="staff-schedule">
                      <FiClock className="staff-icon" />
                      {s.workHours ? `${s.workHours.start} - ${s.workHours.end}` : (s.schedule || '-')}
                    </div>
                  </td>
                  <td>
                    <div className="staff-shift">
                      <FiCalendar className="staff-icon" />
                      {s.shift || '-'}
                    </div>
                  </td>
                  <td>{new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(calculateMonthlySalary(s))}</td>
                  <td>
                    <div className="token-status">
                      {s.token && !isTokenExpired(s) ? (
                        <span className="token-active">Faol (10 daqiqa)</span>
                      ) : (
                        <span className="token-inactive">Faol emas</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={(e) => { e.stopPropagation(); openModal(s); }} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleGenerateToken(s); }} className="btn-token" title="Token yaratish">
                        <FiKey />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteStaff(s.id); }} className="btn-delete" title="O'chirish">
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>{currentStaff.id ? 'Xodimni Tahrirlash' : 'Yangi Xodim Qoshish'}</h2>
                <button type="button" onClick={closeModal} className="close-button">&times;</button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label><FiBriefcase /> Ism *</label>
                <input
                  type="text"
                  value={currentStaff.name}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label><FiMail /> Email</label>
                <input
                  type="email"
                  value={currentStaff.email}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
                  placeholder="xodim@example.com"
                />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select
                  value={currentStaff.role}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
                  required
                >
                  <option value="">Rol tanlang</option>
                  <option value="Doktor">Doktor</option>
                  <option value="Yordamchi">Yordamchi</option>
                  <option value="Admin">Admin</option>
                  <option value="Hamshira">Hamshira</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={currentStaff.phone}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
                  placeholder="+998901234567"
                />
              </div>
              <div className="form-group">
                <label>Oylik Maosh (UZS) *</label>
                <input
                  type="number"
                  value={currentStaff.salary}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, salary: e.target.value })}
                  placeholder="Masalan: 4000000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Kunlik Maosh (UZS, ixtiyoriy)</label>
                <input
                  type="number"
                  value={currentStaff.dailyRate}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, dailyRate: e.target.value })}
                  placeholder="Masalan: 200000"
                />
              </div>
              <div className="form-group">
                <label>Ish soatlari</label>
                <div className="time-inputs">
                  <input
                    type="time"
                    value={currentStaff.workHours?.start || '09:00'}
                    onChange={(e) => setCurrentStaff({
                      ...currentStaff, 
                      workHours: {
                        ...currentStaff.workHours,
                        start: e.target.value
                      }
                    })}
                  />
                  <span className="time-separator">-</span>
                  <input
                    type="time"
                    value={currentStaff.workHours?.end || '18:00'}
                    onChange={(e) => setCurrentStaff({
                      ...currentStaff, 
                      workHours: {
                        ...currentStaff.workHours,
                        end: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ish kunlari *</label>
                <div className="days-selector">
                  {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'].map(day => (
                    <label key={day} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={currentStaff.workHours?.days?.includes(day) || false}
                        onChange={() => handleWorkDaysChange(day)}
                      />
                      {day.substring(0, 3)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Navbatchilik</label>
                <select
                  value={currentStaff.shift || 'Kunduzgi'}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, shift: e.target.value })}
                >
                  <option value="Kunduzgi">Kunduzgi</option>
                  <option value="Kechki">Kechki</option>
                  <option value="Tungi">Tungi</option>
                </select>
              </div>
              <div className="form-group">
                <label>Izoh</label>
                <textarea
                  value={currentStaff.notes}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Saqlash</button>
                <button type="button" onClick={closeModal} className="btn-secondary">Bekor qilish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && currentStaff && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content staff-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xodim Ma'lumotlari</h2>
              <button type="button" onClick={closeModal} className="close-button">&times;</button>
            </div>
            <div className="staff-detail-content">
              <div className="staff-detail-header">
                <div className="staff-avatar">
                  {currentStaff.name.charAt(0)}
                </div>
                <div className="staff-info">
                  <h3>{currentStaff.name}</h3>
                  <p className="staff-role">{currentStaff.role}</p>
                  {currentStaff.email && <p className="staff-email">{currentStaff.email}</p>}
                </div>
              </div>
              <div className="staff-detail-section">
                <h4>Aloqa Ma'lumotlari</h4>
                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <span>{currentStaff.phone || 'Telefon raqami kiritilmagan'}</span>
                </div>
                {currentStaff.email && (
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span>{currentStaff.email}</span>
                  </div>
                )}
              </div>
              <div className="staff-detail-section">
                <h4>Ish Jadvali</h4>
                <div className="detail-item">
                  <FiClock className="detail-icon" />
                  <span>{currentStaff.workHours ? `${currentStaff.workHours.start} - ${currentStaff.workHours.end}` : (currentStaff.schedule || 'Jadval kiritilmagan')}</span>
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div className="work-days">
                    {currentStaff.workHours?.days?.length > 0 ? (
                      currentStaff.workHours.days.map(day => (
                        <span key={day} className="day-tag">{day}</span>
                      ))
                    ) : (
                      'Ish kunlari belgilanmagan'
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Navbatchilik:</span>
                  <span className={`shift-tag ${currentStaff.shift?.toLowerCase()}`}>
                    {currentStaff.shift || 'Belgilanmagan'}
                  </span>
                </div>
              </div>
              <div className="staff-detail-section">
                <h4>Maosh Ma'lumotlari</h4>
                <div className="detail-item">
                  <span className="detail-label">Oylik Maosh:</span>
                  <span>{new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(calculateMonthlySalary(currentStaff))}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kunlik Maosh:</span>
                  <span>{new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(calculateDailySalary(currentStaff))}</span>
                </div>
              </div>
              {currentStaff.notes && (
                <div className="staff-detail-section">
                  <h4>Qo'shimcha Izohlar</h4>
                  <p className="staff-notes">{currentStaff.notes}</p>
                </div>
              )}
              <div className="staff-detail-section">
                <h4>Token Ma'lumotlari</h4>
                <div className="detail-item">
                  <span className="detail-label">Token holati:</span>
                  <span className={currentStaff.token && !isTokenExpired(currentStaff) ? "token-active" : "token-inactive"}>
                    {currentStaff.token && !isTokenExpired(currentStaff) ? 'Faol (10 daqiqa)' : 'Faol emas'}
                  </span>
                </div>
                {currentStaff.tokenGeneratedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Yaratilgan vaqt:</span>
                    <span>{new Date(currentStaff.tokenGeneratedAt).toLocaleString('uz-UZ')}</span>
                  </div>
                )}
                <button 
                  onClick={() => handleGenerateToken(currentStaff)}
                  className="btn-token"
                >
                  <FiKey /> Yangi Token Yaratish
                </button>
              </div>
              <div className="chart-container">
                <h4>{currentStaff.name} - Maosh Grafiki</h4>
                <Bar
                  data={getIndividualSalaryChart(currentStaff)}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: `${currentStaff.name} - Oylik va Kunlik Maosh` },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Maosh (UZS)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setViewModalOpen(false); openModal(currentStaff); }} className="btn-primary">
                <FiEdit /> Tahrirlash
              </button>
              <button onClick={closeModal} className="btn-secondary">Yopish</button>
            </div>
          </div>
        </div>
      )}

      {tokenModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Token Yaratildi</h2>
              <button type="button" onClick={closeModal} className="close-button">&times;</button>
            </div>
            <div className="token-content">
              <div className="token-display">
                <FiKey className="token-icon" />
                <h3>{generatedToken}</h3>
                <p>Ushbu token 10 daqiqa davomida amal qiladi</p>
                <p className="token-warning">Tokenni hech kimga bermang va yopishdan oldin eslab qoling!</p>
              </div>
              <div className="token-actions">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    alert('Token nusxalandi!');
                  }}
                  className="btn-primary"
                >
                  Nusxalash
                </button>
                <button onClick={closeModal} className="btn-secondary">Yopish</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;