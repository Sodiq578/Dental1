import React, { useState, useEffect } from 'react';
import { 
  FiEdit, FiTrash2, FiPlus, FiX, FiSearch, 
  FiCalendar, FiClock, FiUser, FiPhone, 
  FiActivity, FiArrowRight, FiDownload, FiUpload 
} from 'react-icons/fi';
import { 
  getFromLocalStorage, 
  saveToLocalStorage, 
  validateStoredPatients, 
  sanitizePatientData, 
  validatePatientData, 
  exportPatientsData, 
  importPatientsData,
  exportAppointmentsData,
  importAppointmentsData,
  sendTelegramMessage
} from '../utils';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState(() => getFromLocalStorage('appointments', []));
  const [patients, setPatients] = useState(() => validateStoredPatients(getFromLocalStorage('patients', [])));
  const [modalOpen, setModalOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [originalApp, setOriginalApp] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [countdowns, setCountdowns] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [smsTimers, setSmsTimers] = useState({});
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    gender: '',
    address: '',
    dob: '',
    note: '',
    telegram: '',
    prescriptions: []
  });
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    saveToLocalStorage('appointments', appointments);
  }, [appointments]);

  useEffect(() => {
    saveToLocalStorage('patients', patients);
  }, [patients]);

  const openModal = (app = null, slotTime = null) => {
    const appData = app
      ? { ...app, prescription: app.prescription || '' }
      : {
          id: null,
          patientId: '',
          date: selectedDate,
          time: slotTime || '',
          procedure: '',
          status: 'kutilmoqda',
          nextVisit: '',
          phone: '',
          notes: '',
          prescription: '',
          createdAt: new Date().toISOString()
        };
    setCurrentApp(appData);
    setOriginalApp(app ? { ...app, prescription: app.prescription || '' } : null);
    setNewPatientMode(false);
    setNewPatient({
      name: '',
      phone: '',
      gender: '',
      address: '',
      dob: '',
      note: '',
      telegram: '',
      prescriptions: []
    });
    setSelectedPatient(app ? patients.find(p => String(p.id) === String(app.patientId)) : null);
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
    setSuccessMessage('');
    setNewPatientMode(false);
    setNewPatient({
      name: '',
      phone: '',
      gender: '',
      address: '',
      dob: '',
      note: '',
      telegram: '',
      prescriptions: []
    });
    setSelectedPatient(null);
    setOriginalApp(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPatientMode) {
      const patientErrors = validatePatientData(newPatient);
      if (patientErrors.length > 0) {
        setError(patientErrors.join(', '));
        return;
      }
    } else if (!currentApp.patientId) {
      setError('Bemor tanlanishi shart');
      return;
    }
    if (!currentApp.date) {
      setError('Uchrashuv sanasi kiritilishi shart');
      return;
    }
    if (!currentApp.time) {
      setError('Uchrashuv vaqti kiritilishi shart');
      return;
    }
    if (!currentApp.procedure.trim()) {
      setError('Jarayon nomi kiritilishi shart');
      return;
    }

    let updatedAppointments;
    let updatedPatients = [...patients];
    let patientId = currentApp.patientId;
    let patientIndex;

    if (newPatientMode) {
      const sanitizedPatient = sanitizePatientData({
        ...newPatient,
        id: Date.now(),
        prescriptions: []
      });
      updatedPatients.push(sanitizedPatient);
      patientId = sanitizedPatient.id;
      patientIndex = updatedPatients.length - 1;
    } else {
      patientIndex = updatedPatients.findIndex(p => String(p.id) === String(patientId));
    }

    const newApp = {
      ...currentApp,
      id: currentApp.id || Date.now(),
      patientId,
      updatedAt: new Date().toISOString()
    };

    const isNewApp = !currentApp.id;
    const prescriptionChanged = newApp.prescription.trim() !== '' && 
      (isNewApp || newApp.prescription !== (originalApp?.prescription || ''));

    if (prescriptionChanged) {
      const newPrescription = {
        appointmentId: newApp.id,
        date: newApp.date,
        procedure: newApp.procedure,
        text: newApp.prescription
      };
      updatedPatients[patientIndex].prescriptions.push(newPrescription);
      updatedPatients[patientIndex].updatedAt = new Date().toISOString();
    }

    if (isNewApp) {
      updatedAppointments = [...appointments, newApp];
      setSuccessMessage('Yangi uchrashuv muvaffaqiyatli qoʻshildi');
    } else {
      updatedAppointments = appointments.map((a) => (a.id === currentApp.id ? newApp : a));
      setSuccessMessage('Uchrashuv muvaffaqiyatli yangilandi');
    }

    setAppointments(updatedAppointments);
    setPatients(updatedPatients);

    const patient = newPatientMode ? newPatient : patients.find(p => String(p.id) === String(patientId));
    const adminChatId = '5838205785';
    const isNew = !currentApp.id;

    if (patient) {
      let messageParts = [];
      messageParts.push(isNew 
        ? `Sizning uchrashuvingiz ${newApp.date} kuni soat ${newApp.time} da rejalashtirildi. Jarayon: ${newApp.procedure}.`
        : `Uchrashuv yangilandi: ${newApp.date} ${newApp.time}, Jarayon: ${newApp.procedure}.`);
      if (newApp.nextVisit && (isNew || newApp.nextVisit !== (originalApp?.nextVisit || ''))) {
        messageParts.push(`Keyingi kelish sanasi: ${newApp.nextVisit}.`);
      }
      if (prescriptionChanged) {
        messageParts.push(`Retsept: ${newApp.prescription}.`);
      }
      if (!isNew && newApp.status !== originalApp.status) {
        messageParts.push(`Uchrashuv statusi: ${newApp.status}.`);
      }
      if (patient.telegram) {
        if (messageParts.length > 0) {
          const message = `Hurmatli ${patient.name}, ${messageParts.join(' ')}`;
          sendTelegramMessage(patient.telegram, message);
        }
      } else {
        const adminMessage = `Yangi uchrashuv qo'shildi/yangilandi: ${patient.name} - ${newApp.date} ${newApp.time} - ${newApp.procedure}. (Bemor Telegram ma'lumoti yo'q) ${messageParts.slice(1).join(' ')}`;
        sendTelegramMessage(adminChatId, adminMessage);
      }
    }

    setTimeout(() => {
      setSuccessMessage('');
      if (!error) closeModal();
    }, 3000);

    setupSmsReminder(newApp);
  };

  const setupSmsReminder = (app) => {
    const appDateTime = new Date(`${app.date}T${app.time}`);
    const now = new Date();
    const reminderTime = new Date(appDateTime.getTime() - (2 * 60 * 1000));
    if (reminderTime > now) {
      const timeoutId = setTimeout(() => {
        sendSmsReminder(app);
      }, reminderTime - now);
      setSmsTimers((prev) => ({ ...prev, [app.id]: timeoutId }));
    }
  };

  const sendSmsReminder = (app) => {
    const patientName = getPatientName(app.patientId);
    const message = `Eslatma: Hurmatli ${patientName}, uchrashuvingiz ${app.date} ${app.time} da. Telefon: ${app.phone}`;
    console.log(`SMS yuborildi: ${message}`);
    alert(`SMS yuborildi: ${message}`);
    const patient = patients.find(p => String(p.id) === String(app.patientId));
    if (patient && patient.telegram) {
      sendTelegramMessage(patient.telegram, message);
    } else {
      sendTelegramMessage('5838205785', `Bemor ${patientName} uchun eslatma: ${message} (Telegram yo'q)`);
    }
  };

  const getPatientName = (id) => {
    if (!id) return 'Noma’lum bemor';
    const p = patients.find((p) => String(p.id) === String(id));
    return p ? p.name || 'Noma’lum bemor' : 'Noma’lum bemor';
  };

  const deleteAppointment = (id) => {
    if (window.confirm('Haqiqatan ham bu uchrashuvni o‘chirmoqchimisiz?')) {
      const updated = appointments.filter((a) => a.id !== id);
      setAppointments(updated);
      setSuccessMessage('Uchrashuv muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      if (smsTimers[id]) {
        clearTimeout(smsTimers[id]);
        setSmsTimers((prev) => { delete prev[id]; return { ...prev }; });
      }
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch = !searchTerm || 
      getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.procedure.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesDate = !dateFilter || app.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'kutilmoqda': return 'pending';
      case 'amalga oshirildi': return 'completed';
      case 'bekor qilindi': return 'cancelled';
      default: return 'default';
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Telefon kiritilmagan';
    if (phone.startsWith('+998') && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      appointments.forEach((app) => {
        if (app.status === 'kutilmoqda') {
          const appDateTime = new Date(`${app.date}T${app.time}`);
          const now = new Date();
          const diff = appDateTime - now;
          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            newCountdowns[app.id] = `${hours} soat ${minutes} daqiqa qoldi`;
          } else {
            newCountdowns[app.id] = 'Vaqt o\'tdi';
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 60000);
    return () => clearInterval(interval);
  }, [appointments]);

  useEffect(() => {
    appointments.forEach(setupSmsReminder);
  }, [appointments]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getSlotsForDate = (date) => {
    const timeSlots = generateTimeSlots();
    const booked = appointments
      .filter((app) => app.date === date && app.status !== 'bekor qilindi')
      .map((app) => ({ time: app.time, patient: getPatientName(app.patientId) }));
    return timeSlots.map((slot) => ({
      time: slot,
      isBooked: booked.some((b) => b.time === slot),
      patient: booked.find((b) => b.time === slot)?.patient || null,
    }));
  };

  const slots = getSlotsForDate(selectedDate);

  const handleExportPatients = () => {
    const success = exportPatientsData();
    if (success) {
      setSuccessMessage('Bemorlar muvaffaqiyatli eksport qilindi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleImportPatients = (event) => {
    const file = event.target.files[0];
    if (file) {
      importPatientsData(file, (success, message) => {
        if (success) {
          setPatients(validateStoredPatients(getFromLocalStorage('patients', [])));
          setSuccessMessage(message);
        } else {
          setError(message);
        }
        setTimeout(() => {
          setSuccessMessage('');
          setError('');
        }, 3000);
      });
    }
  };

  const handleExportAppointments = () => {
    const success = exportAppointmentsData();
    if (success) {
      setSuccessMessage('Uchrashuvlar muvaffaqiyatli eksport qilindi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleImportAppointments = (event) => {
    const file = event.target.files[0];
    if (file) {
      importAppointmentsData(file, (success, message) => {
        if (success) {
          setAppointments(getFromLocalStorage('appointments', []));
          setSuccessMessage(message);
        } else {
          setError(message);
        }
        setTimeout(() => {
          setSuccessMessage('');
          setError('');
        }, 3000);
      });
    }
  };

  const clearStorage = () => {
    if (window.confirm('Barcha ma\'lumotlarni o\'chirishni xohlaysizmi?')) {
      saveToLocalStorage('appointments', []);
      saveToLocalStorage('patients', []);
      setAppointments([]);
      setPatients([]);
      setSuccessMessage('Ma\'lumotlar muvaffaqiyatli tozalandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Uchrashuvlar</h1>
        <span className="app-count">{appointments.length} ta</span>
      </div>

      {successMessage && <div className="success-alert">{successMessage}</div>}
      {error && <div className="error-alert">{error}</div>}

      <div className="app-controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            id="search-input"
            type="text"
            placeholder="Bemor ismi yoki jarayon boʻyicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
          />
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="status-filter" className="input-label">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Barcha statuslar</option>
              <option value="kutilmoqda">Kutilmoqda</option>
              <option value="amalga oshirildi">Amalga oshirildi</option>
              <option value="bekor qilindi">Bekor qilindi</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="date-filter" className="input-label">Sana</label>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        
        </div>
      </div>

      <div className="calendar-section">
        <h2>Kalendar</h2>
        <label htmlFor="calendar-date" className="input-label">Sana tanlang</label>
        <input
          id="calendar-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <div className="time-slots">
          {slots.map((slot) => (
            <div
              key={slot.time}
              className={`slot ${slot.isBooked ? 'booked' : 'free'}`}
              onClick={() => !slot.isBooked && openModal(null, slot.time)}
            >
              <span>{slot.time}</span>
              <span>{slot.isBooked ? `Band: ${slot.patient}` : 'Bo\'sh'}</span>
            </div>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          {searchTerm || statusFilter !== 'all' || dateFilter ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>Qidiruv yoki filtr boʻyicha uchrashuv topilmadi</p>
              <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }} className="action-button">
                Filtrlarni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali uchrashuvlar mavjud emas</h3>
              <p>Birinchi uchrashuvingizni qoʻshing</p>
              <button onClick={() => openModal()} className="primary-button">
                <FiPlus /> Yangi uchrashuv qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="appointments-table">
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana va Vaqt</th>
                <th>Jarayon</th>
                <th>Status</th>
                <th>Keyingi kelish</th>
                <th>Qoldiq vaqt</th>
                <th>Izoh</th>
                <th>Retsept</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => (
                <tr key={app.id}>
                  <td>{getPatientName(app.patientId)}</td>
                  <td>{app.date} {app.time}</td>
                  <td>{app.procedure}</td>
                  <td>
                    <span className={`status-tag ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>{app.nextVisit || '-'}</td>
                  <td>{countdowns[app.id] || '-'}</td>
                  <td>{app.notes ? app.notes.slice(0, 20) + '...' : '-'}</td>
                  <td>{app.prescription ? app.prescription.slice(0, 20) + '...' : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openModal(app)} className="edit-button" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteAppointment(app.id)} className="delete-button" title="Oʻchirish">
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
                <button type="button" onClick={closeModal} className="modal-close-button">
                  <FiX />
                </button>
              </div>

              {error && <div className="error-alert">{error}</div>}
              {successMessage && <div className="success-alert">{successMessage}</div>}

              <div className="form-group">
                <label htmlFor="patient-select" className="input-label">
                  <FiUser className="input-icon" /> Bemor ismi *
                </label>
                {!newPatientMode ? (
                  <>
                    <select
                      id="patient-select"
                      value={currentApp.patientId}
                      onChange={(e) => {
                        const selPatient = patients.find((p) => String(p.id) === String(e.target.value));
                        setSelectedPatient(selPatient);
                        setCurrentApp({
                          ...currentApp,
                          patientId: e.target.value,
                          phone: selPatient?.phone || '',
                        });
                      }}
                      required={!newPatientMode}
                    >
                      <option value="">Bemor tanlang</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || `Bemor ID: ${p.id}`} {p.phone ? `(${formatPhoneNumber(p.phone)})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="action-button switch-button"
                      onClick={() => setNewPatientMode(true)}
                    >
                      Yangi bemor kiritish
                    </button>
                    {selectedPatient && selectedPatient.prescriptions.length > 0 && (
                      <div className="previous-prescriptions">
                        <h4>Oldingi retseptlar:</h4>
                        <ul>
                          {selectedPatient.prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((pres, index) => (
                            <li key={index}>
                              {pres.date} - {pres.procedure}: {pres.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="new-patient-name" className="input-label">Ism *</label>
                        <input
                          id="new-patient-name"
                          type="text"
                          placeholder="Bemor ismi"
                          value={newPatient.name}
                          onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="new-patient-phone" className="input-label">Telefon *</label>
                        <input
                          id="new-patient-phone"
                          type="tel"
                          placeholder="+998 90 123 45 67"
                          value={newPatient.phone}
                          onChange={(e) => {
                            setNewPatient({ ...newPatient, phone: e.target.value });
                            setCurrentApp({ ...currentApp, phone: e.target.value });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="new-patient-gender" className="input-label">Jins</label>
                        <select
                          id="new-patient-gender"
                          value={newPatient.gender}
                          onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        >
                          <option value="">Jinsni tanlang</option>
                          <option value="male">Erkak</option>
                          <option value="female">Ayol</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="new-patient-dob" className="input-label">Tug'ilgan sana</label>
                        <input
                          id="new-patient-dob"
                          type="date"
                          value={newPatient.dob}
                          onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-patient-address" className="input-label">Manzil</label>
                      <input
                        id="new-patient-address"
                        type="text"
                        placeholder="Bemor manzili"
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-patient-telegram" className="input-label">Telegram Chat ID</label>
                      <input
                        id="new-patient-telegram"
                        type="text"
                        placeholder="Telegram Chat ID (masalan: 5838205785)"
                        value={newPatient.telegram}
                        onChange={(e) => setNewPatient({ ...newPatient, telegram: e.target.value })}
                      />
                      <div className="input-hint">Bemor botga start bosgandan keyin olingan Chat ID ni kiriting</div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-patient-note" className="input-label">Izoh</label>
                      <textarea
                        id="new-patient-note"
                        placeholder="Bemor haqida qo'shimcha izohlar"
                        value={newPatient.note}
                        onChange={(e) => setNewPatient({ ...newPatient, note: e.target.value })}
                        rows="3"
                      />
                    </div>
                    <button
                      type="button"
                      className="action-button switch-button"
                      onClick={() => setNewPatientMode(false)}
                    >
                      Mavjud bemorni tanlash
                    </button>
                  </>
                )}
                <div className="input-hint">
                  {!newPatientMode ? 'Uchrashuv uchun bemorni tanlang' : 'Yangi bemor ma\'lumotlarini kiriting'}
                </div>
              </div>

              {!newPatientMode && (
                <div className="form-group">
                  <label htmlFor="phone-input" className="input-label">
                    <FiPhone className="input-icon" /> Telefon raqami
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="Telefon raqami (masalan: +998 90 123 45 67)"
                    value={currentApp.phone}
                    onChange={(e) => setCurrentApp({ ...currentApp, phone: e.target.value })}
                  />
                  <div className="input-hint">Xalqaro formatda kiriting, majburiy emas</div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="date-input" className="input-label">
                    <FiCalendar className="input-icon" /> Uchrashuv sanasi *
                  </label>
                  <input
                    id="date-input"
                    type="date"
                    value={currentApp.date}
                    onChange={(e) => setCurrentApp({ ...currentApp, date: e.target.value })}
                    required
                  />
                  <div className="input-hint">Uchrashuv bo‘ladigan sanani tanlang</div>
                </div>
                <div className="form-group">
                  <label htmlFor="time-input" className="input-label">
                    <FiClock className="input-icon" /> Uchrashuv vaqti *
                  </label>
                  <input
                    id="time-input"
                    type="time"
                    value={currentApp.time}
                    onChange={(e) => setCurrentApp({ ...currentApp, time: e.target.value })}
                    required
                  />
                  <div className="input-hint">Uchrashuv vaqtini kiriting</div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="procedure-input" className="input-label">
                  <FiActivity className="input-icon" /> Jarayon nomi *
                </label>
                <input
                  id="procedure-input"
                  type="text"
                  placeholder="Jarayon nomi (masalan: tish tekshiruvi)"
                  value={currentApp.procedure}
                  onChange={(e) => setCurrentApp({ ...currentApp, procedure: e.target.value })}
                  required
                />
                <div className="input-hint">Bemor uchun rejalashtirilgan jarayonni kiriting</div>
              </div>

              <div className="form-group">
                <label htmlFor="status-input" className="input-label">Uchrashuv holati</label>
                <select
                  id="status-input"
                  value={currentApp.status}
                  onChange={(e) => setCurrentApp({ ...currentApp, status: e.target.value })}
                >
                  <option value="kutilmoqda">Kutilmoqda</option>
                  <option value="amalga oshirildi">Amalga oshirildi</option>
                  <option value="bekor qilindi">Bekor qilindi</option>
                </select>
                <div className="input-hint">Uchrashuvning joriy holatini tanlang</div>
              </div>

              <div className="form-group">
                <label htmlFor="next-visit-input" className="input-label">
                  <FiArrowRight className="input-icon" /> Keyingi kelish sanasi
                </label>
                <input
                  id="next-visit-input"
                  type="date"
                  value={currentApp.nextVisit}
                  onChange={(e) => setCurrentApp({ ...currentApp, nextVisit: e.target.value })}
                />
                <div className="input-hint">Keyingi uchrashuv sanasini kiriting</div>
              </div>

              <div className="form-group">
                <label htmlFor="prescription-input" className="input-label">Retsept</label>
                <textarea
                  id="prescription-input"
                  placeholder="Retsept ma'lumotlari (dorilar, tavsiyalar)"
                  value={currentApp.prescription || ''}
                  onChange={(e) => setCurrentApp({ ...currentApp, prescription: e.target.value })}
                  rows="4"
                />
                <div className="input-hint">Retseptni kiriting (majburiy emas)</div>
              </div>

              <div className="form-group">
                <label htmlFor="notes-input" className="input-label">Izohlar</label>
                <textarea
                  id="notes-input"
                  placeholder="Bemorning shikoyatlari yoki tavsiyalar"
                  value={currentApp.notes}
                  onChange={(e) => setCurrentApp({ ...currentApp, notes: e.target.value })}
                  rows="4"
                />
                <div className="input-hint">Qo‘shimcha ma’lumotlarni kiriting</div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button">Saqlash</button>
                <button type="button" onClick={closeModal} className="action-button">Bekor qilish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;