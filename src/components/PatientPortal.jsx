import React, { useState, useEffect, useContext } from 'react';
import { FiCalendar, FiClock, FiUser, FiPhone, FiPlus } from 'react-icons/fi';
import { AppContext } from '../App';
import { addNewPatient, sendTelegramMessage } from '../utils';
import './PatientPortal.css';

const PatientPortal = () => {
  const { appointments, setAppointments } = useContext(AppContext);
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegistration, setShowRegistration] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [procedure, setProcedure] = useState('');

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
      .map((app) => app.time);
    return timeSlots.map((slot) => ({ time: slot, isBooked: booked.includes(slot) }));
  };

  const slots = getSlotsForDate(selectedDate);

  const findNextAvailableSlot = () => {
    let currentDate = new Date(selectedDate);
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const availableSlots = getSlotsForDate(dateString).filter(slot => !slot.isBooked);
      if (availableSlots.length > 0) {
        return { date: dateString, time: availableSlots[0].time };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return null;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    addNewPatient(newPatient, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage('Muvaffaqiyatli roʻyxatdan oʻtdingiz! Endi uchrashuv band qilishingiz mumkin.');
        if (newPatient.telegram) {
          sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, siz muvaffaqiyatli roʻyxatdan oʻtdingiz.`);
        }
      } else {
        setError(message);
      }
    });
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!patientId) {
      setError('Iltimos, avval roʻyxatdan oʻting.');
      return;
    }
    if (!selectedTime) {
      setError('Iltimos, vaqtni tanlang.');
      return;
    }
    if (!procedure.trim()) {
      setError('Iltimos, jarayon nomini kiriting.');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      patientId,
      date: selectedDate,
      time: selectedTime,
      procedure,
      status: 'kutilmoqda',
      notes: '',
      prescription: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAppointments([...appointments, newAppointment]);
    setSuccessMessage('✅ Uchrashuv muvaffaqiyatli band qilindi!');

    const patientMessage = `Hurmatli ${newPatient.name},\n\n✅ Sizning uchrashuvingiz ${selectedDate} kuni, soat ${selectedTime} da rejalashtirildi.\n🔹 Jarayon: ${procedure}\n\n📍 SDK DENTAL klinikasi\n📞 Qo‘shimcha ma’lumot uchun bog‘laning: +998 ***\n\n🦷 Sog‘lig’ingiz biz uchun muhim!`;

    if (newPatient.telegram) {
      sendTelegramMessage(newPatient.telegram, patientMessage);
    }

    const adminMessage = `📢 Yangi uchrashuv band qilindi:\n\n👤 Bemor: ${newPatient.name}\n📅 Sana: ${selectedDate}\n🕒 Vaqt: ${selectedTime}\n🔹 Jarayon: ${procedure}\n\n🦷 SDK DENTAL tizimi`;
    sendTelegramMessage('5838205785', adminMessage);

    setTimeout(() => {
      setSuccessMessage('');
      setSelectedTime('');
      setProcedure('');
    }, 3000);
  };

  const handleRequestNextSlot = () => {
    setError('');
    setSuccessMessage('');

    if (!patientId) {
      setError('Iltimos, avval roʻyxatdan oʻting.');
      return;
    }

    const nextSlot = findNextAvailableSlot();
    if (nextSlot) {
      const message = `Keyingi boʻsh vaqt: ${nextSlot.date} kuni soat ${nextSlot.time}`;
      setSuccessMessage(message);
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, ${message}`);
      }
      sendTelegramMessage('5838205785', `Bemor ${newPatient.name} keyingi boʻsh vaqtni soʻradi: ${nextSlot.date} ${nextSlot.time}`);
    } else {
      setError('Keyingi 30 kun ichida boʻsh vaqt topilmadi.');
      if (newPatient.telegram) {
        sendTelegramMessage(newPatient.telegram, `Hurmatli ${newPatient.name}, hozircha boʻsh vaqt yoʻq. Keyinroq urinib koʻring.`);
      }
    }
  };

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  return (
    <div className="patient-portal-container">
      <h1>Bemor Portali</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {showRegistration ? (
        <div className="registration-form">
          <h2>Roʻyxatdan oʻtish</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group"><label><FiUser /> Ism *</label><input type="text" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} required /></div>
            <div className="form-group"><label><FiPhone /> Telefon *</label><input type="tel" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="+998901234567" required /></div>
            <div className="form-group"><label>Telegram Chat ID (ixtiyoriy)</label><input type="text" value={newPatient.telegram} onChange={(e) => setNewPatient({ ...newPatient, telegram: e.target.value })} placeholder="5838205785" /><p className="hint">Botga /start buyrugʻini yuboring va Chat ID ni kiriting.</p></div>
            <button type="submit" className="btn-primary"><FiPlus /> Roʻyxatdan oʻtish</button>
          </form>
        </div>
      ) : (
        <div className="appointment-form">
          <h2>Uchrashuv band qilish</h2>
          <div className="form-group"><label><FiCalendar /> Sana</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
          <div className="time-slots">
            <h3>Boʻsh vaqtlar</h3>
            <div className="slots-grid">
              {slots.map((slot) => (
                <button key={slot.time} className={`time-slot ${slot.isBooked ? 'booked' : ''} ${selectedTime === slot.time ? 'selected' : ''}`} onClick={() => !slot.isBooked && setSelectedTime(slot.time)} disabled={slot.isBooked}>
                  {slot.time} {slot.isBooked ? '(Band)' : ''}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleBookAppointment}>
            <div className="form-group"><label><FiClock /> Tanlangan vaqt</label><input type="text" value={selectedTime} readOnly /></div>
            <div className="form-group"><label>Jarayon *</label><input type="text" value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="Masalan: Tish tekshiruvi" required /></div>
            <div className="form-actions"><button type="submit" className="btn-primary"><FiPlus /> Uchrashuv band qilish</button><button type="button" className="btn-secondary" onClick={handleRequestNextSlot}>Keyingi boʻsh vaqt</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;