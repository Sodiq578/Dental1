// src/components/PatientPortal.jsx
import React, { useState, useContext } from 'react';
import { FiSearch, FiUser, FiCalendar, FiClock, FiArrowRight, FiSend, FiX, FiEdit, FiSave } from 'react-icons/fi';
import { AppContext } from '../App';
import { sendTelegramMessage, getFromLocalStorage, saveToLocalStorage, addNewPatient, cancelAppointment, updatePatient } from '../utils';
import './PatientPortal.css';

const PatientPortal = () => {
  const { patients, setPatients, appointments, setAppointments, billings } = useContext(AppContext);
  const [patientId, setPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [procedure, setProcedure] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [newPatient, setNewPatient] = useState({
    name: '', phone: '', gender: '', address: '', dob: '', telegram: '', note: ''
  });

  const handleSearch = () => {
    const patient = patients.find(p => String(p.id) === String(patientId));
    if (patient) {
      setSelectedPatient(patient);
      setTelegramId(patient.telegram || '');
      setEditedPatient({ ...patient });
      setErrorMessage('');
    } else {
      setSelectedPatient(null);
      setErrorMessage('Bemor topilmadi');
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      updatePatient(selectedPatient.id, { ...editedPatient, telegram: telegramId }, (success, message) => {
        if (success) {
          setPatients(getFromLocalStorage('patients', []));
          setSelectedPatient({ ...editedPatient, telegram: telegramId });
          setSuccessMessage(message);
          setEditMode(false);
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage(message);
          setTimeout(() => setErrorMessage(''), 3000);
        }
      });
    } else {
      setEditMode(true);
    }
  };

  const handlePatientChange = (field, value) => {
    setEditedPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleNewPatientChange = (field, value) => {
    setNewPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewPatient = () => {
    addNewPatient(newPatient, (success, message, addedPatient) => {
      if (success) {
        setPatients(getFromLocalStorage('patients', []));
        setSuccessMessage(message);
        setPatientId(String(addedPatient.id));
        setSelectedPatient(addedPatient);
        setTelegramId(addedPatient.telegram || '');
        setShowNewPatientForm(false);
        setNewPatient({ name: '', phone: '', gender: '', address: '', dob: '', telegram: '', note: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    });
  };

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

  const getAvailableSlots = () => {
    const timeSlots = generateTimeSlots();
    const bookedSlots = appointments
      .filter(app => app.date === selectedDate && app.status !== 'bekor qilindi' && String(app.patientId) !== String(selectedPatient?.id))
      .map(app => app.time);
    return timeSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const handleBookSlot = () => {
    if (!selectedSlot || !procedure.trim()) {
      setErrorMessage('Vaqt va jarayonni tanlang');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      patientId: selectedPatient.id,
      date: selectedDate,
      time: selectedSlot,
      procedure: procedure.trim(),
      status: 'kutilmoqda',
      nextVisit: '',
      phone: selectedPatient.phone,
      notes: '',
      prescription: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    saveToLocalStorage('appointments', updatedAppointments);

    const updatedPatients = patients.map(p => 
      String(p.id) === String(selectedPatient.id) 
        ? { ...p, updatedAt: new Date().toISOString() }
        : p
    );
    setPatients(updatedPatients);
    saveToLocalStorage('patients', updatedPatients);

    const adminChatId = '5838205785';
    let message = `Yangi zakaz: ${selectedPatient.name} - ${selectedDate} ${selectedSlot} - ${procedure}`;
    
    if (telegramId) {
      const patientMessage = `Hurmatli ${selectedPatient.name}, sizning zakazingiz ${selectedDate} kuni ${selectedSlot} da tasdiqlandi. Jarayon: ${procedure}.`;
      sendTelegramMessage(telegramId, patientMessage);
      message += ` (Bemor ga xabar yuborildi)`;
    } else {
      message += ` (Bemor Telegram ID si yo'q)`;
    }

    sendTelegramMessage(adminChatId, message);

    setSuccessMessage('Zakaz muvaffaqiyatli yuborildi!');
    setSelectedSlot('');
    setProcedure('');
    setErrorMessage('');
    setShowBooking(false);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCancelAppointment = (appointmentId) => {
    cancelAppointment(appointmentId, (success, message) => {
      if (success) {
        setAppointments(getFromLocalStorage('appointments', []));
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    });
  };

  const getPatientAppointments = () => {
    return appointments.filter(a => String(a.patientId) === String(selectedPatient?.id));
  };

  const getPatientBills = () => {
    return billings.filter(b => String(b.patientId) === String(selectedPatient?.id));
  };

  const getPatientPrescriptions = () => {
    return selectedPatient?.prescriptions || [];
  };

  const sendPatientInfoToTelegram = () => {
    if (!telegramId) {
      setErrorMessage('Telegram ID kiritilmagan');
      return;
    }

    const message = `
Hurmatli ${selectedPatient.name},

Sizning ma'lumotlaringiz:
- Telefon: ${selectedPatient.phone}
- Manzil: ${selectedPatient.address || '-'}
- Uchrashuvlar: ${getPatientAppointments().length} ta
- Oxirgi retsept: ${getPatientPrescriptions().length > 0 ? getPatientPrescriptions()[getPatientPrescriptions().length - 1].text.slice(0, 50) + '...' : 'Yo\'q'}

Zakaz qilish uchun portalga kiring.
    `;
    sendTelegramMessage(telegramId, message);
    setSuccessMessage('Ma\'lumotlar Telegram orqali yuborildi!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleTelegramContact = () => {
    window.open('https://t.me/your_bot_username', '_blank');
  };

  return (
    <div className="patient-portal">
      <div className="page-header">
        <h1>Bemor Portali</h1>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="search-box">
        <input
          type="text"
          placeholder="Bemor ID sini kiriting..."
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="btn-primary">
          <FiSearch /> Qidirish
        </button>
        <button onClick={() => setShowNewPatientForm(true)} className="btn-primary">
          Yangi Bemor Qo'shish
        </button>
      </div>

      {showNewPatientForm && (
        <div className="modal-overlay" onClick={() => setShowNewPatientForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yangi Bemor Qo'shish</h2>
              <button type="button" onClick={() => setShowNewPatientForm(false)} className="close-button">
                <FiX />
              </button>
            </div>
            <div className="form-group">
              <label>Ism *:</label>
              <input
                type="text"
                value={newPatient.name}
                onChange={e => handleNewPatientChange('name', e.target.value)}
                placeholder="Bemor ismi"
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon *:</label>
              <input
                type="tel"
                value={newPatient.phone}
                onChange={e => handleNewPatientChange('phone', e.target.value)}
                placeholder="+998901234567"
                required
              />
            </div>
            <div className="form-group">
              <label>Jins:</label>
              <select value={newPatient.gender} onChange={e => handleNewPatientChange('gender', e.target.value)}>
                <option value="">Tanlang</option>
                <option value="Erkak">Erkak</option>
                <option value="Ayol">Ayol</option>
              </select>
            </div>
            <div className="form-group">
              <label>Manzil:</label>
              <input
                type="text"
                value={newPatient.address}
                onChange={e => handleNewPatientChange('address', e.target.value)}
                placeholder="Bemor manzili"
              />
            </div>
            <div className="form-group">
              <label>Tug'ilgan sana:</label>
              <input
                type="date"
                value={newPatient.dob}
                onChange={e => handleNewPatientChange('dob', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Telegram Chat ID:</label>
              <input
                type="text"
                value={newPatient.telegram}
                onChange={e => handleNewPatientChange('telegram', e.target.value)}
                placeholder="Telegram Chat ID"
              />
            </div>
            <div className="form-group">
              <label>Izoh:</label>
              <textarea
                value={newPatient.note}
                onChange={e => handleNewPatientChange('note', e.target.value)}
                placeholder="Qo'shimcha izohlar"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddNewPatient} className="btn-primary">Saqlash</button>
              <button onClick={() => setShowNewPatientForm(false)} className="btn-secondary">Bekor qilish</button>
            </div>
          </div>
        </div>
      )}

      {selectedPatient ? (
        <div className="patient-details">
          <h2>{selectedPatient.name} uchun Ma'lumotlar</h2>
          <div className="detail-card">
            <FiUser />
            {editMode ? (
              <>
                <div>
                  <strong>Ism:</strong>
                  <input
                    type="text"
                    value={editedPatient.name}
                    onChange={e => handlePatientChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <strong>Telefon:</strong>
                  <input
                    type="tel"
                    value={editedPatient.phone || ''}
                    onChange={e => handlePatientChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <strong>Manzil:</strong>
                  <input
                    type="text"
                    value={editedPatient.address || ''}
                    onChange={e => handlePatientChange('address', e.target.value)}
                  />
                </div>
                <div>
                  <strong>Telegram ID:</strong>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={e => setTelegramId(e.target.value)}
                    placeholder="Telegram Chat ID"
                  />
                </div>
                <button onClick={handleEditToggle} className="btn-primary">
                  <FiSave /> Saqlash
                </button>
              </>
            ) : (
              <>
                <div><strong>Ism:</strong> {selectedPatient.name}</div>
                <div><strong>Telefon:</strong> {selectedPatient.phone || '-'}</div>
                <div><strong>Manzil:</strong> {selectedPatient.address || '-'}</div>
                <div><strong>Telegram ID:</strong> {telegramId || 'Kiritilmagan'}</div>
                <button onClick={handleEditToggle} className="btn-secondary">
                  <FiEdit /> Tahrirlash
                </button>
              </>
            )}
            <button onClick={sendPatientInfoToTelegram} className="btn-primary">
              <FiSend /> Ma'lumotlarni Telegram ga yuborish
            </button>
            <button onClick={handleTelegramContact} className="btn-primary">
              <FiSend /> Telegram orqali bog'lanish
            </button>
          </div>

          <h3>Uchrashuvlar</h3>
          {getPatientAppointments().length === 0 ? (
            <p>Hali uchrashuvlar yo‘q</p>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Vaqt</th>
                  <th>Jarayon</th>
                  <th>Status</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {getPatientAppointments().map(a => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>{a.procedure}</td>
                    <td>{a.status}</td>
                    <td>
                      {a.status === 'kutilmoqda' && (
                        <button onClick={() => handleCancelAppointment(a.id)} className="btn-secondary">
                          <FiX /> Bekor qilish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Retseptlar</h3>
          {getPatientPrescriptions().length === 0 ? (
            <p>Hali retseptlar yo‘q</p>
          ) : (
            <div className="prescriptions-list">
              {getPatientPrescriptions().map((pres, index) => (
                <div key={index} className="prescription-item">
                  <strong>{pres.date} - {pres.procedure}:</strong> {pres.text}
                </div>
              ))}
            </div>
          )}

          <h3>To‘lovlar</h3>
          {getPatientBills().length === 0 ? (
            <p>Hali to‘lovlar yo‘q</p>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Faktura Raqami</th>
                  <th>Summa</th>
                  <th>Status</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {getPatientBills().map(b => (
                  <tr key={b.id}>
                    <td>{b.invoiceNumber}</td>
                    <td>{b.amount} UZS</td>
                    <td>{b.status === 'paid' ? 'To‘langan' : 'To‘lanmagan'}</td>
                    <td>{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="booking-section">
            <h3><FiCalendar /> Yangi Zakaz Qilish</h3>
            <button onClick={() => setShowBooking(!showBooking)} className="btn-primary">
              {showBooking ? 'Yopish' : 'Zakaz Qilish'}
            </button>
            {showBooking && (
              <div className="booking-form">
                <div className="form-group">
                  <label>Sana tanlash:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Mavjud vaqtlar:</label>
                  <div className="time-slots">
                    {getAvailableSlots().map(slot => (
                      <button
                        key={slot}
                        className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Jarayon nomi:</label>
                  <input
                    type="text"
                    placeholder="Jarayon nomi (masalan: tish tekshiruvi)"
                    value={procedure}
                    onChange={e => setProcedure(e.target.value)}
                  />
                </div>
                <button onClick={handleBookSlot} className="btn-primary">
                  <FiArrowRight /> Zakaz Qilish
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Bemor tanlanmadi</h3>
          <p>Iltimos, bemor ID sini kiriting va qidirish tugmasini bosing yoki yangi bemor qo'shing</p>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;