import React, { useState, useContext } from 'react';
import { 
  FiEdit, FiTrash2, FiPlus, FiX, FiSearch, 
  FiCalendar, FiClock, FiUser, FiPhone, 
  FiActivity, FiArrowRight 
} from 'react-icons/fi';
import { AppContext } from '../App';  // Context dan foydalanamiz
import './Appointments.css';

const Appointments = () => {
  const { appointments, setAppointments, patients } = useContext(AppContext); // Global state dan olamiz
  const [modalOpen, setModalOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // 🔹 Modalni ochish
  const openModal = (app = null) => {
    setCurrentApp(
      app
        ? { ...app }
        : {
            id: null,
            patientId: '',
            date: '',
            time: '',
            procedure: '',
            status: 'kutilmoqda',
            nextVisit: '',
            phone: '',
            notes: '',
            createdAt: new Date().toISOString()
          }
    );
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
    setSuccessMessage('');
  };

  // 🔹 Formani yuborish
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!currentApp.patientId) {
      setError('Bemor tanlanishi shart');
      return;
    }
    if (!currentApp.date) {
      setError('Sana kiritilishi shart');
      return;
    }
    if (!currentApp.time) {
      setError('Vaqt kiritilishi shart');
      return;
    }
    if (!currentApp.procedure.trim()) {
      setError('Jarayon kiritilishi shart');
      return;
    }
    if (currentApp.phone && !/^\+998\d{9}$/.test(currentApp.phone)) {
      setError('Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak');
      return;
    }

    let updated;
    const newApp = {
      ...currentApp,
      id: currentApp.id || Date.now(),
      updatedAt: new Date().toISOString()
    };

    if (currentApp.id) {
      updated = appointments.map((a) => (a.id === currentApp.id ? newApp : a));
      setSuccessMessage('Uchrashuv muvaffaqiyatli yangilandi');
    } else {
      updated = [...appointments, newApp];
      setSuccessMessage('Yangi uchrashuv muvaffaqiyatli qoʻshildi');
    }
    
    setAppointments(updated); // Global state ni yangilaymiz (avto saqlanadi App.js da)
    
    setTimeout(() => {
      setSuccessMessage('');
      if (!error) closeModal();
    }, 3000);
  };

  // 🔹 Bemor ismini olish
  const getPatientName = (id) => {
    if (!id) return 'Noma’lum bemor';
    const p = patients.find((p) => String(p.id) === String(id));
    return p ? p.name || 'Noma’lum bemor' : 'Noma’lum bemor';
  };

  // 🔹 O'chirish funksiyasi
  const deleteAppointment = (id) => {
    if (window.confirm('Haqiqatan ham bu uchrashuvni o‘chirmoqchimisiz?')) {
      const updated = appointments.filter((a) => a.id !== id);
      setAppointments(updated); // Global state ni yangilaymiz
      setSuccessMessage('Uchrashuv muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // 🔹 Filtrlangan uchrashuvlar
  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch = !searchTerm || 
      getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.procedure.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const matchesDate = !dateFilter || app.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // 🔹 Status tahlili (jadval uchun)
  const getStatusColor = (status) => {
    switch (status) {
      case 'kutilmoqda': return 'orange';
      case 'amalga oshirildi': return 'green';
      case 'bekor qilindi': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="appointments">
      <div className="page-header">
        <h1>Uchrashuvlar</h1>
        <span className="badge">{appointments.length} ta</span>
      </div>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="actions">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Bemor yoki jarayon boʻyicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Barcha statuslar</option>
            <option value="kutilmoqda">Kutilmoqda</option>
            <option value="amalga oshirildi">Amalga oshirildi</option>
            <option value="bekor qilindi">Bekor qilindi</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Sana boʻyicha filtr"
          />
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi uchrashuv
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          {searchTerm || statusFilter !== 'all' || dateFilter ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>Qidiruv yoki filtr boʻyicha uchrashuv topilmadi</p>
              <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }} className="btn-secondary">
                Filtrlarni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali uchrashuvlar mavjud emas</h3>
              <p>Birinchi uchrashuvingizni qoʻshing</p>
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi uchrashuv qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana va Vaqt</th>
                <th>Jarayon</th>
                <th>Status</th>
                <th>Keyingi kelish</th>
                <th>Izoh</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => (
                <tr key={app.id}>
                  <td>{getPatientName(app.patientId)}</td>
                  <td>
                    {app.date} {app.time}
                  </td>
                  <td>{app.procedure}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>{app.nextVisit || '-'}</td>
                  <td>{app.notes ? app.notes.slice(0, 20) + '...' : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(app)} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteAppointment(app.id)} className="btn-delete" title="Oʻchirish">
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
                <h2>{currentApp.id ? 'Uchrashuvni tahrirlash' : 'Yangi uchrashuv qoʻshish'}</h2>
                <button type="button" onClick={closeModal} className="close-button">
                  &times;
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              {/* 🔹 Bemor */}
              <div className="form-group">
                <label>
                  <FiUser className="input-icon" /> Bemor *
                </label>
                <select
                  value={currentApp.patientId}
                  onChange={(e) => {
                    const selectedPatient = patients.find((p) => String(p.id) === String(e.target.value));
                    setCurrentApp({
                      ...currentApp,
                      patientId: e.target.value,
                      phone: selectedPatient?.phone || '',
                    });
                  }}
                  required
                >
                  <option value="">Bemor tanlang</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `Bemor ID: ${p.id}`} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔹 Telefon */}
              <div className="form-group">
                <label>
                  <FiPhone className="input-icon" /> Telefon raqam
                </label>
                <input
                  type="tel"
                  placeholder="+998901234567"
                  value={currentApp.phone}
                  onChange={(e) => setCurrentApp({ ...currentApp, phone: e.target.value })}
                />
              </div>

              {/* 🔹 Sana va vaqt */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FiCalendar className="input-icon" /> Sana *
                  </label>
                  <input
                    type="date"
                    value={currentApp.date}
                    onChange={(e) => setCurrentApp({ ...currentApp, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FiClock className="input-icon" /> Vaqt *
                  </label>
                  <input
                    type="time"
                    value={currentApp.time}
                    onChange={(e) => setCurrentApp({ ...currentApp, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 🔹 Jarayon */}
              <div className="form-group">
                <label>
                  <FiActivity className="input-icon" /> Jarayon *
                </label>
                <input
                  type="text"
                  placeholder="Masalan: tish davolash"
                  value={currentApp.procedure}
                  onChange={(e) => setCurrentApp({ ...currentApp, procedure: e.target.value })}
                  required
                />
              </div>

              {/* 🔹 Status */}
              <div className="form-group">
                <label>Status</label>
                <select
                  value={currentApp.status}
                  onChange={(e) => setCurrentApp({ ...currentApp, status: e.target.value })}
                >
                  <option value="kutilmoqda">Kutilmoqda</option>
                  <option value="amalga oshirildi">Amalga oshirildi</option>
                  <option value="bekor qilindi">Bekor qilindi</option>
                </select>
              </div>

              {/* 🔹 Keyingi kelish */}
              <div className="form-group">
                <label>
                  <FiArrowRight className="input-icon" /> Keyingi kelish
                </label>
                <input
                  type="date"
                  value={currentApp.nextVisit}
                  onChange={(e) => setCurrentApp({ ...currentApp, nextVisit: e.target.value })}
                />
              </div>

              {/* 🔹 Izoh */}
              <div className="form-group">
                <label>📝 Qoʻshimcha maʼlumot</label>
                <textarea
                  placeholder="Masalan: Bemor antibiotik ichishi kerak"
                  value={currentApp.notes}
                  onChange={(e) => setCurrentApp({ ...currentApp, notes: e.target.value })}
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

export default Appointments;