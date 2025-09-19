import React, { useState, useContext, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiBriefcase, FiClock, FiUser, FiPhone, FiCalendar, FiX } from 'react-icons/fi';
import { AppContext } from '../App';
import './Staff.css';

const Staff = () => {
  const { staff, setStaff, darkMode } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Xodimlarni qidirish va filtrlash
  const filteredStaff = staff.filter(s =>
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)) &&
    (filterRole ? s.role === filterRole : true)
  );

  const openModal = (staffMember = null) => {
    setCurrentStaff(staffMember ? { ...staffMember } : {
      id: null,
      name: '',
      role: '',
      phone: '',
      schedule: '',
      notes: '',
      workHours: { start: '09:00', end: '18:00', days: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'] },
      shift: 'Kunduzgi'
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const openViewModal = (staffMember) => {
    setCurrentStaff(staffMember);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentStaff.name.trim()) {
      setError('Ism kiritilishi shart');
      return;
    }
    if (currentStaff.phone && !/^\+998\d{9}$/.test(currentStaff.phone)) {
      setError('Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak');
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

  // Ish soatlari va kunlarini boshqarish
  const handleWorkDaysChange = (day) => {
    const updatedDays = currentStaff.workHours.days.includes(day)
      ? currentStaff.workHours.days.filter(d => d !== day)
      : [...currentStaff.workHours.days, day];
    
    setCurrentStaff({
      ...currentStaff,
      workHours: {
        ...currentStaff.workHours,
        days: updatedDays
      }
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
              placeholder="Ism, rol yoki telefon bo‘yicha qidirish..."
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
            </select>
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi Xodim
        </button>
      </div>

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
                <th>Rol</th>
                <th>Telefon</th>
                <th>Ish soatlari</th>
                <th>Navbatchilik</th>
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
                  <td>
                    <div className="action-buttons">
                      <button onClick={(e) => { e.stopPropagation(); openModal(s); }} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteStaff(s.id); }} className="btn-delete" title="O‘chirish">
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
                <h2>{currentStaff.id ? 'Xodimni Tahrirlash' : 'Yangi Xodim Qo‘shish'}</h2>
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
                <label>Ish kunlari</label>
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
                </div>
              </div>
              
              <div className="staff-detail-section">
                <h4>Aloqa Ma'lumotlari</h4>
                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <span>{currentStaff.phone || 'Telefon raqami kiritilmagan'}</span>
                </div>
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
                    {currentStaff.workHours?.days?.map(day => (
                      <span key={day} className="day-tag">{day}</span>
                    )) || 'Ish kunlari belgilanmagan'}
                  </div>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Navbatchilik:</span>
                  <span className={`shift-tag ${currentStaff.shift?.toLowerCase()}`}>
                    {currentStaff.shift || 'Belgilanmagan'}
                  </span>
                </div>
              </div>
              
              {currentStaff.notes && (
                <div className="staff-detail-section">
                  <h4>Qo'shimcha Izohlar</h4>
                  <p className="staff-notes">{currentStaff.notes}</p>
                </div>
              )}
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
    </div>
  );
};

export default Staff;