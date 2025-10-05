import React, { useState, useEffect, useContext } from 'react';
import { FiCalendar, FiClock, FiUser, FiPhone, FiPlus, FiSearch } from 'react-icons/fi';
import { AppContext } from '../App';
import { addNewPatient, sendTelegramMessage, getFromLocalStorage } from '../utils';
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

  // Generate time slots (9:00 to 18:00, 30-minute intervals)
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

  // Get available slots for the selected date
  const getSlotsForDate = (date) => {
    const timeSlots = generateTimeSlots();
    const booked = appointments
      .filter((app) => app.date === date && app.status !== 'bekor qilindi')
      .map((app) => app.time);

    return timeSlots.map((slot) => ({
      time: slot,
      isBooked: booked.includes(slot),
    }));
  };

  const slots = getSlotsForDate(selectedDate);

  // Find the next available slot
  const findNextAvailableSlot = () => {
    const today = new Date();
    let currentDate = new Date(selectedDate);
    let foundSlot = null;

    for (let i = 0; i < 30; i++) { // Check next 30 days
      const dateString = currentDate.toISOString().split('T')[0];
      const availableSlots = getSlotsForDate(dateString).filter(slot => !slot.isBooked);
      if (availableSlots.length > 0) {
        foundSlot = { date: dateString, time: availableSlots[0].time };
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return foundSlot;
  };

  // Handle patient registration
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

  // Handle appointment booking
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
    setSuccessMessage('Uchrashuv muvaffaqiyatli band qilindi!');
    
    const message = `Hurmatli ${newPatient.name}, sizning uchrashuvingiz ${selectedDate} kuni soat ${selectedTime} da rejalashtirildi. Jarayon: ${procedure}.`;
    if (newPatient.telegram) {
      sendTelegramMessage(newPatient.telegram, message);
    }
    sendTelegramMessage('5838205785', `Yangi uchrashuv: ${newPatient.name} - ${selectedDate} ${selectedTime} - ${procedure}`);

    setTimeout(() => {
      setSuccessMessage('');
      setSelectedTime('');
      setProcedure('');
    }, 3000);
  };

  // Handle request for next available slot
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

  // Clear messages after timeout
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
    <div className="container">
      <h1>Bemor Portali</h1>

      {successMessage && (
        <div className="bg-green-100">{successMessage}</div>
      )}
      {error && (
        <div className="bg-red-100">{error}</div>
      )}

      {showRegistration ? (
        <div className="bg-white">
          <h2>Roʻyxatdan oʻtish</h2>
          <form onSubmit={handleRegister}>
            <div>
              <label><FiUser /> Ism *</label>
              <input
                type="text"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label><FiPhone /> Telefon *</label>
              <input
                type="tel"
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                placeholder="+998901234567"
                required
              />
            </div>
            <div>
              <label>Telegram Chat ID (majburiy emas)</label>
              <input
                type="text"
                value={newPatient.telegram}
                onChange={(e) => setNewPatient({ ...newPatient, telegram: e.target.value })}
                placeholder="Telegram Chat ID (masalan: 5838205785)"
              />
              <p className="text-sm text-gray-500">Botga /start buyrugʻini yuboring va Chat ID ni kiriting.</p>
            </div>
            <button type="submit" className="bg-blue-500">
              <FiPlus /> Roʻyxatdan oʻtish
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white">
          <h2>Uchrashuv band qilish</h2>
          <div>
            <label><FiCalendar /> Sana</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <h3>Boʻsh vaqtlar</h3>
            <div className="grid">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  className={`p-2 ${slot.isBooked ? 'bg-gray-300' : 'bg-blue-100'}`}
                  onClick={() => !slot.isBooked && setSelectedTime(slot.time)}
                  disabled={slot.isBooked}
                  aria-selected={selectedTime === slot.time}
                >
                  {slot.time} {slot.isBooked ? '(Band)' : ''}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleBookAppointment}>
            <div>
              <label><FiClock /> Tanlangan vaqt</label>
              <input
                type="text"
                value={selectedTime}
                readOnly
              />
            </div>
            <div>
              <label>Jarayon *</label>
              <input
                type="text"
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                placeholder="Masalan: Tish tekshiruvi"
                required
              />
            </div>
            <button type="submit" className="bg-blue-500">
              <FiPlus /> Uchrashuv band qilish
            </button>
            <button
              type="button"
              className="bg-green-500"
              onClick={handleRequestNextSlot}
            >
              Keyingi boʻsh vaqt
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;