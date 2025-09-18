import React, { useState, useContext } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiBriefcase } from 'react-icons/fi';
import { AppContext } from '../App';
import './Staff.css';

const Staff = () => {
  const { staff, setStaff } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (staffMember = null) => {
    setCurrentStaff(staffMember ? { ...staffMember } : {
      id: null,
      name: '',
      role: '',
      phone: '',
      schedule: '',
      notes: ''
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    setModalOpen(false);
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

  return (
    <div className="staff">
      <div className="page-header">
        <h1>Xodimlar</h1>
        <span className="badge">{staff.length} ta</span>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="actions">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Ism yoki rol bo‘yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi Xodim
        </button>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{searchTerm}" bo‘yicha xodim topilmadi</p>
              <button onClick={() => setSearchTerm('')} className="btn-secondary">
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
                <th>Jadval</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.schedule || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(s)} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteStaff(s.id)} className="btn-delete" title="O‘chirish">
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
                <label>Jadval</label>
                <textarea
                  value={currentStaff.schedule}
                  onChange={(e) => setCurrentStaff({ ...currentStaff, schedule: e.target.value })}
                  placeholder="Masalan: Dushanba-Juma, 9:00-17:00"
                  rows="3"
                />
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
    </div>
  );
};

export default Staff;