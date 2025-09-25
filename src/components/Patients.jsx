// Patients.js
import React, { useState, useEffect, useContext } from 'react';
import { FiCalendar, FiClock, FiUser, FiPhone, FiPlus, FiSearch, FiEdit, FiTrash2, FiMapPin, FiInfo, FiDownload, FiX } from 'react-icons/fi';
import { AppContext } from '../App';
import { validateStoredPatients, sanitizePatientData, validatePatientData, addNewPatient, sendTelegramMessage, getFromLocalStorage } from '../utils';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import './Patients.css';

// Regions and districts data
const regions = {
  "Qoraqalpogʻiston Respublikasi": {
    "tumanlar": {
      "Amudaryo tumani": { "Tuman markazi": "Mangʻit" },
      "Beruniy tumani": { "Tuman markazi": "Beruniy" },
      "Boʻzatov tumani": { "Tuman markazi": "Boʻzatov" },
      "Chimboy tumani": { "Tuman markazi": "Chimboy" },
      "Ellikqal’a tumani": { "Tuman markazi": "Boʻston" },
      "Kegeyli tumani": { "Tuman markazi": "Kegeyli" },
      "Moʻynoq tumani": { "Tuman markazi": "Moʻynoq" },
      "Nukus tumani": { "Tuman markazi": "Oqmangʻit" },
      "Qanlikoʻl tumani": { "Tuman markazi": "Qanlikoʻl" },
      "Qoʻngʻirot tumani": { "Tuman markazi": "Qoʻngʻirot" },
      "Qoraoʻzak tumani": { "Tuman markazi": "Qoraoʻzak" },
      "Shoʻmanoy tumani": { "Tuman markazi": "Shoʻmanoy" },
      "Taxtakoʻpir tumani": { "Tuman markazi": "Taxtakoʻpir" },
      "Toʻrtkoʻl tumani": { "Tuman markazi": "Toʻrtkoʻl" },
      "Xoʻjayli tumani": { "Tuman markazi": "Xoʻjayli" },
      "Taxiatosh tumani": { "Tuman markazi": "Taxiatosh" },
    }
  },
  // Add other regions as needed (omitted for brevity)
};

// Placeholder for sendSMS function
const sendSMS = (phone, message) => {
  console.log(`SMS sent to ${phone}: ${message}`);
  return true;
};

// Helper function to send notification via Telegram or SMS
const sendNotification = (patient, message) => {
  if (patient.telegram) {
    sendTelegramMessage(patient.telegram, message);
  } else if (patient.phone) {
    sendSMS(patient.phone, message);
  }
};

const Patients = () => {
  const { patients, setPatients, appointments, setAppointments } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [newPrescription, setNewPrescription] = useState({
    date: new Date().toISOString().slice(0, 10),
    medicine: '',
    dosage: '',
    notes: ''
  });
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExportFormat, setSelectedExportFormat] = useState('excel');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');
  const [viewMode, setViewMode] = useState('patients');
  const [newPatientPortal, setNewPatientPortal] = useState({
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
  const [showRegistration, setShowRegistration] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [procedure, setProcedure] = useState('');

  // Parse address when editing a patient
  useEffect(() => {
    if (currentPatient && currentPatient.address) {
      const [region, district, ...rest] = currentPatient.address.split(', ');
      setSelectedRegion(region || '');
      setSelectedDistrict(district || '');
      setAdditionalAddress(rest.join(', ') || '');
    } else {
      setSelectedRegion('');
      setSelectedDistrict('');
      setAdditionalAddress('');
    }
  }, [currentPatient]);

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

  // Generate time slots
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
    for (let i = 0; i < 30; i++) {
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
    addNewPatient(newPatientPortal, (success, message, data) => {
      if (success) {
        setPatientId(data.id);
        setShowRegistration(false);
        setSuccessMessage('Muvaffaqiyatli roʻyxatdan oʻtdingiz! Endi uchrashuv band qilishingiz mumkin.');
        const formattedMessage = `*Hurmatli ${newPatientPortal.name}!* 🎉\nSiz muvaffaqiyatli roʻyxatdan oʻtdingiz. Endi uchrashuv band qilishingiz mumkin.`;
        sendNotification(newPatientPortal, formattedMessage);
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
    const formattedMessage = `*Hurmatli ${newPatientPortal.name}!* 📅\nSizning uchrashuvingiz *${selectedDate}* kuni soat *${selectedTime}* da rejalashtirildi.\nJarayon: *${procedure}*.\n\nRahmat! 😊`;
    sendNotification(newPatientPortal, formattedMessage);
    sendTelegramMessage('5838205785', `Yangi uchrashuv: ${newPatientPortal.name} - ${selectedDate} ${selectedTime} - ${procedure}`);
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
      const formattedMessage = `*Hurmatli ${newPatientPortal.name}!* 🔍\nKeyingi boʻsh vaqt: *${nextSlot.date}* kuni soat *${nextSlot.time}*.\n\nRahmat! 😊`;
      setSuccessMessage(formattedMessage);
      sendNotification(newPatientPortal, formattedMessage);
      sendTelegramMessage('5838205785', `Bemor ${newPatientPortal.name} keyingi boʻsh vaqtni soʻradi: ${nextSlot.date} ${nextSlot.time}`);
    } else {
      const formattedMessage = `*Hurmatli ${newPatientPortal.name}!* ⚠️\nKeyingi 30 kun ichida boʻsh vaqt topilmadi. Keyinroq urinib koʻring.`;
      setError(formattedMessage);
      sendNotification(newPatientPortal, formattedMessage);
    }
  };

  // Handle prescription addition
  const addPrescription = (e) => {
    e.preventDefault();
    if (!newPrescription.medicine.trim() || !newPrescription.dosage.trim()) {
      setError('Dori nomi va dozasi majburiy');
      return;
    }
    setCurrentPatient({
      ...currentPatient,
      prescriptions: [...currentPatient.prescriptions, { ...newPrescription }]
    });
    const formattedMessage = `*Yangi retsept qo'shildi!* 💊\nSana: *${newPrescription.date}*\nDori: *${newPrescription.medicine}*\nDoza: *${newPrescription.dosage}*${newPrescription.notes ? `\nIzoh: _${newPrescription.notes}_` : ''}`;
    const adminChatId = '5838205785';
    if (currentPatient.telegram) {
      sendTelegramMessage(currentPatient.telegram, formattedMessage);
    } else {
      sendTelegramMessage(adminChatId, `Bemor ${currentPatient.name || 'Yangi bemor'} uchun yangi retsept qo'shildi: ${formattedMessage} (Telegram yo'q)`);
    }
    setNewPrescription({
      date: new Date().toISOString().slice(0, 10),
      medicine: '',
      dosage: '',
      notes: ''
    });
    setError('');
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  const openModal = (patient = null) => {
    setCurrentPatient(
      patient
        ? { ...patient, prescriptions: patient.prescriptions || [], telegram: patient.telegram || '' }
        : {
            id: null,
            name: '',
            phone: '',
            gender: '',
            address: '',
            dob: '',
            lastVisit: '',
            note: '',
            telegram: '',
            prescriptions: []
          }
    );
    setNewPrescription({
      date: new Date().toISOString().slice(0, 10),
      medicine: '',
      dosage: '',
      notes: ''
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const openNoteModal = (note, e) => {
    if (e) e.stopPropagation();
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const openDetailsModal = (patient) => {
    setSelectedPatient({ ...patient, prescriptions: patient.prescriptions || [] });
    setDetailsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setExportModalOpen(false);
    setNoteModalOpen(false);
    setDetailsModalOpen(false);
    setError('');
    setSuccessMessage('');
    setCurrentPatient(null);
    setSelectedRegion('');
    setSelectedDistrict('');
    setAdditionalAddress('');
  };

  const handlePrescriptionChange = (e) => {
    setNewPrescription({ ...newPrescription, [e.target.name]: e.target.value });
  };

  const removePrescription = (index) => {
    const updatedPrescriptions = currentPatient.prescriptions.filter((_, i) => i !== index);
    setCurrentPatient({ ...currentPatient, prescriptions: updatedPrescriptions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const address = [selectedRegion, selectedDistrict, additionalAddress]
      .filter(Boolean)
      .join(', ');
    const updatedPatient = {
      ...currentPatient,
      address: address
    };
    const sanitizedPatient = sanitizePatientData(updatedPatient);
    const validationErrors = validatePatientData(sanitizedPatient);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    let updated;
    if (sanitizedPatient.id) {
      updated = patients.map((p) => 
        p.id === sanitizedPatient.id ? sanitizedPatient : p
      );
      setSuccessMessage('Bemor ma\'lumotlari muvaffaqiyatli yangilandi');
      const formattedMessage = `*Bemor ma'lumotlari yangilandi!* 📝\nIsm: *${sanitizedPatient.name}*\nTelefon: *${sanitizedPatient.phone}*`;
      sendNotification(sanitizedPatient, formattedMessage);
    } else {
      const newPatient = { 
        ...sanitizedPatient, 
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      };
      updated = [...patients, newPatient];
      setSuccessMessage('Yangi bemor muvaffaqiyatli qo‘shildi');
      const formattedMessage = `*Yangi bemor qo'shildi!* 👤\nIsm: *${newPatient.name}*\nTelefon: *${newPatient.phone}*`;
      sendNotification(newPatient, formattedMessage);
    }
    setPatients(validateStoredPatients(updated));
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deletePatient = (id) => {
    if (window.confirm('Haqiqatan ham bu bemorni o‘chirmoqchimisiz?')) {
      if (appointments.some((a) => a.patientId === id)) {
        alert('Bu bemorning uchrashuvlari mavjud. Iltimos, avval uchrashuvlarni o‘chirib tashlang.');
        return;
      }
      const updated = patients.filter((p) => p.id !== id);
      setPatients(updated);
      setSuccessMessage('Bemor muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeModal();
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const performExport = async () => {
    if (selectedExportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(patients.map(p => ({
        ID: p.id,
        Ism: p.name,
        Telefon: p.phone,
        Jins: p.gender,
        Manzil: p.address,
        TugilganSana: p.dob,
        OxirgiTashrif: p.lastVisit,
        Izoh: p.note,
        Telegram: p.telegram,
        Retseptlar: p.prescriptions ? p.prescriptions.map(pr => `${pr.date}: ${pr.medicine} (${pr.dosage}) - ${pr.notes || ''}`).join('; ') : '-',
        QoShilganSana: p.createdAt
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bemorlar");
      XLSX.writeFile(wb, "bemorlar.xlsx");
    } else if (selectedExportFormat === 'word') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: patients.flatMap(p => [
            new Paragraph({ children: [new TextRun({ text: `ID: ${p.id}`, bold: true })] }),
            new Paragraph({ children: [new TextRun(`Ism: ${p.name || 'Noma\'lum'}`)] }),
            new Paragraph({ children: [new TextRun(`Telefon: ${p.phone || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Jins: ${p.gender || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Manzil: ${p.address || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Tug'ilgan sana: ${p.dob || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Oxirgi tashrif: ${p.lastVisit || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Izoh: ${p.note || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Telegram: ${p.telegram || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Retseptlar: ${p.prescriptions ? p.prescriptions.map(pr => `${pr.date}: ${pr.medicine} (${pr.dosage}) - ${pr.notes || ''}`).join('\n') : '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Qo'shilgan sana: ${p.createdAt || '-'}`)] }),
            new Paragraph({ children: [new TextRun("-----------------------------")] })
          ])
        }]
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bemorlar.docx';
      a.click();
      URL.revokeObjectURL(url);
    }
    setSuccessMessage('Ma\'lumotlar muvaffaqiyatli eksport qilindi');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const truncateNote = (note, maxLength = 30) => {
    if (!note) return '-';
    return note.length > maxLength ? `${note.slice(0, maxLength)}...` : note;
  };

  const truncatePrescriptions = (prescriptions, maxLength = 30) => {
    if (!prescriptions || prescriptions.length === 0) return '-';
    const summary = `${prescriptions.length} ta retsept`;
    return summary.length > maxLength ? `${summary.slice(0, maxLength)}...` : summary;
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Telefon kiritilmagan';
    if (phone.startsWith('+998') && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('uz-UZ') : '-';
  };

  // Handle region change
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedDistrict('');
  };

  // Get districts for the selected region
  const getDistricts = () => {
    return selectedRegion && regions[selectedRegion] ? Object.keys(regions[selectedRegion].tumanlar) : [];
  };

  // Get center for selected district
  const getDistrictCenter = () => {
    return selectedRegion && selectedDistrict && regions[selectedRegion].tumanlar[selectedDistrict] ? regions[selectedRegion].tumanlar[selectedDistrict]["Tuman markazi"] : '';
  };

  return (
    <div className="patients">
      <div className="page-header">
        <h1>{viewMode === 'patients' ? 'Bemorlar' : 'Bemor Portali'}</h1>
        <button
          className="btn-toggle"
          onClick={() => setViewMode(viewMode === 'patients' ? 'portal' : 'patients')}
        >
          {viewMode === 'patients' ? 'Portaldan foydalanish' : 'Bemorlar roʻyxatiga qaytish'}
        </button>
        {viewMode === 'patients' && <span className="badge">{patients.length} ta</span>}
      </div>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {viewMode === 'patients' ? (
        <>
          <div className="actions">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Ism yoki telefon raqami boʻyicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="action-buttons-group">
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi bemor
              </button>
              <button onClick={handleExport} className="btn-secondary" title="Eksport qilish">
                <FiDownload />
              </button>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="empty-state">
              {search ? (
                <>
                  <h3>Hech narsa topilmadi</h3>
                  <p>"{search}" boʻyicha hech qanday bemor topilmadi</p>
                  <button onClick={() => setSearch('')} className="btn-secondary">
                    Filterni tozalash
                  </button>
                </>
              ) : (
                <>
                  <h3>Hali bemorlar mavjud emas</h3>
                  <p>Birinchi bemoringizni qoʻshing</p>
                  <button onClick={() => openModal()} className="btn-primary">
                    <FiPlus /> Yangi bemor qo'shish
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
                    <th>Telefon</th>
                    <th>Yoshi</th>
                    <th>Jinsi</th>
                    <th>Oxirgi tashrif</th>
                    <th>Izoh</th>
                    <th>Retseptlar</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openDetailsModal(p)}
                      style={{ cursor: 'pointer' }}
                      className="mobile-card"
                    >
                      <td data-label="Ism" className="patient-name">
                        <div className="patient-info">
                          <FiUser className="patient-icon" />
                          <span>{p.name || 'Noma\'lum'}</span>
                        </div>
                      </td>
                      <td data-label="Telefon">
                        <div className="patient-info">
                          <FiPhone className="patient-icon" />
                          <span>{formatPhoneNumber(p.phone)}</span>
                        </div>
                      </td>
                      <td data-label="Yoshi" className="desktop-only">{calculateAge(p.dob)}</td>
                      <td data-label="Jinsi" className="desktop-only">{p.gender || '-'}</td>
                      <td data-label="Oxirgi tashrif">
                        {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('uz-UZ') : 'Tashrif yo\'q'}
                      </td>
                      <td data-label="Izoh" className="desktop-only">
                        {p.note ? (
                          <span
                            className="note-link"
                            onClick={(e) => openNoteModal(p.note, e)}
                            title="To‘liq izohni ko‘rish"
                          >
                            {truncateNote(p.note)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td data-label="Retseptlar" className="desktop-only">
                        {truncatePrescriptions(p.prescriptions)}
                      </td>
                      <td data-label="Amallar" onClick={(e) => e.stopPropagation()} className="desktop-only">
                        <div className="action-buttons">
                          <button
                            onClick={() => openModal(p)}
                            className="btn-edit"
                            title="Tahrirlash"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => deletePatient(p.id)}
                            className="btn-delete"
                            title="Oʻchirish"
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
        </>
      ) : (
        <div className="patient-portal">
          <h2>Bemor Portali</h2>
          {showRegistration ? (
            <div className="bg-white">
              <h3>Roʻyxatdan oʻtish</h3>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label><FiUser className="input-icon" /> Ism *</label>
                  <input
                    type="text"
                    value={newPatientPortal.name}
                    onChange={(e) => setNewPatientPortal({ ...newPatientPortal, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FiPhone className="input-icon" /> Telefon *</label>
                  <input
                    type="tel"
                    value={newPatientPortal.phone}
                    onChange={(e) => setNewPatientPortal({ ...newPatientPortal, phone: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telegram Chat ID (majburiy emas)</label>
                  <input
                    type="text"
                    value={newPatientPortal.telegram}
                    onChange={(e) => setNewPatientPortal({ ...newPatientPortal, telegram: e.target.value })}
                    placeholder="Telegram Chat ID (masalan: 5838205785)"
                  />
                  <p className="text-sm text-gray-500">Botga /start buyrugʻini yuboring va Chat ID ni kiriting. Agar kiritilmasa, SMS orqali xabar yuboriladi (agar telefon mavjud bo'lsa).</p>
                </div>
                <button type="submit" className="btn-primary">
                  <FiPlus /> Roʻyxatdan oʻtish
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white">
              <h3>Uchrashuv band qilish</h3>
              <div className="form-group">
                <label><FiCalendar className="input-icon" /> Sana</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <h4>Boʻsh vaqtlar</h4>
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
                <div className="form-group">
                  <label><FiClock className="input-icon" /> Tanlangan vaqt</label>
                  <input
                    type="text"
                    value={selectedTime}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Jarayon *</label>
                  <input
                    type="text"
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    placeholder="Masalan: Tish tekshiruvi"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <FiPlus /> Uchrashuv band qilish
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRequestNextSlot}
                >
                  <FiSearch /> Keyingi boʻsh vaqt
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Patient Modal */}
      {modalOpen && currentPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>
                  {currentPatient.id ? 'Bemorni tahrirlash' : 'Yangi bemor qoʻshish'}
                </h2>
                <button type="button" onClick={closeModal} className="close-button">
                  &times;
                </button>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              
              <div className="form-group">
                <label>
                  <FiUser className="input-icon" /> Ism va familiya *
                </label>
                <input
                  type="text"
                  placeholder="Bemorning ism va familiyasi"
                  value={currentPatient.name}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FiPhone className="input-icon" /> Telefon *
                </label>
                <input
                  type="tel"
                  placeholder="Telefon raqami"
                  value={currentPatient.phone}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, phone: e.target.value })
                  }
                  required
                />
                <div className="input-hint">Xalqaro formatda, masalan: +998 97 123 45 67 yoki chet el nomeri</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jinsi</label>
                  <select
                    value={currentPatient.gender}
                    onChange={(e) =>
                      setCurrentPatient({ ...currentPatient, gender: e.target.value })
                    }
                  >
                    <option value="">Tanlanmagan</option>
                    <option value="Erkak">Erkak</option>
                    <option value="Ayol">Ayol</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <FiCalendar className="input-icon" /> Tug'ilgan sana
                  </label>
                  <input
                    type="date"
                    value={currentPatient.dob}
                    onChange={(e) =>
                      setCurrentPatient({ ...currentPatient, dob: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin className="input-icon" /> Manzil
                </label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Viloyat</label>
                    <select
                      value={selectedRegion}
                      onChange={handleRegionChange}
                    >
                      <option value="">Viloyatni tanlang</option>
                      {Object.keys(regions).map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tuman</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedRegion}
                    >
                      <option value="">Tumanni tanlang</option>
                      {getDistricts().map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="Qo‘shimcha manzil ma'lumotlari (ko‘cha, uy raqami va h.k.)"
                  value={additionalAddress}
                  onChange={(e) => setAdditionalAddress(e.target.value)}
                  rows="2"
                  className="address-details"
                />
                {selectedDistrict && (
                  <div className="input-hint">Tuman markazi: {getDistrictCenter()}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="telegram" className="input-label">
                  Telegram Chat ID (xabarnoma uchun)
                </label>
                <input
                  id="telegram"
                  type="text"
                  placeholder="Telegram Chat ID (masalan: 5838205785)"
                  value={currentPatient.telegram}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, telegram: e.target.value })}
                />
                <div className="input-hint">Bemor botga start bosgandan keyin olingan Chat ID ni kiriting (majburiy emas). Agar kiritilmasa, SMS orqali xabar yuboriladi (agar telefon mavjud bo'lsa).</div>
              </div>

              <div className="form-group">
                <label>Oxirgi tashrif</label>
                <input
                  type="date"
                  value={currentPatient.lastVisit}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, lastVisit: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  <FiInfo className="input-icon" /> Izoh
                </label>
                <textarea
                  placeholder="Qo‘shimcha eslatmalar, allergiyalar, kasallik tarixi va h.k."
                  value={currentPatient.note}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, note: e.target.value })
                  }
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Retseptlar (Davolash retsepti)</label>
                <div className="prescriptions-list">
                  {currentPatient.prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((pr, index) => (
                    <div key={index} className="prescription-item">
                      <div>
                        <strong>{formatDate(pr.date)}:</strong> {pr.medicine} ({pr.dosage}) {pr.notes ? `- ${pr.notes}` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="btn-delete small"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="add-prescription">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sana</label>
                      <input
                        type="date"
                        name="date"
                        value={newPrescription.date}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Dori nomi *</label>
                      <input
                        type="text"
                        name="medicine"
                        placeholder="Dori nomi"
                        value={newPrescription.medicine}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Doza *</label>
                      <input
                        type="text"
                        name="dosage"
                        placeholder="Doza (masalan: 1 tabletka kuniga 2 marta)"
                        value={newPrescription.dosage}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Izoh</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Qo'shimcha izoh"
                        value={newPrescription.notes}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={addPrescription} className="btn-primary small">
                    <FiPlus /> Retsept qo'shish
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {currentPatient.id ? 'Saqlash' : 'Qoʻshish'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eksport formatini tanlang</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="form-group">
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="word">Word (.docx)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={performExport} className="btn-primary">
                Eksport qilish
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bemor izohi</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="note-content">
              <p>{selectedNote}</p>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="btn-secondary">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bemor ma'lumotlari</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="patient-details-new">
              <section className="detail-section">
                <h3>Asosiy ma'lumotlar</h3>
                <ul>
                  <li>
                    <span className="detail-label"><FiUser /> Ism va familiya:</span>
                    <span className="detail-value">{selectedPatient.name || 'Noma\'lum'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiPhone /> Telefon:</span>
                    <span className="detail-value">{formatPhoneNumber(selectedPatient.phone)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Telegram:</span>
                    <span className="detail-value">{selectedPatient.telegram || '-'}</span>
                  </li>
                  <li>
                    <span className="detail-label">Jinsi:</span>
                    <span className="detail-value">{selectedPatient.gender || '-'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiMapPin /> Manzil:</span>
                    <span className="detail-value">{selectedPatient.address || '-'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Tug'ilgan sana:</span>
                    <span className="detail-value">{formatDate(selectedPatient.dob)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Yoshi:</span>
                    <span className="detail-value">{calculateAge(selectedPatient.dob)}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Oxirgi tashrif:</span>
                    <span className="detail-value">{selectedPatient.lastVisit ? formatDate(selectedPatient.lastVisit) : 'Hali tashrif yo\'q'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Qo'shilgan sana:</span>
                    <span className="detail-value">{formatDate(selectedPatient.createdAt)}</span>
                  </li>
                </ul>
              </section>
              
              {selectedPatient.note && (
                <section className="detail-section">
                  <h3>Izoh</h3>
                  <p className="detail-note-text">{selectedPatient.note}</p>
                </section>
              )}

              <section className="detail-section">
                <h3>Retseptlar</h3>
                {selectedPatient.prescriptions.length > 0 ? (
                  <ul className="prescriptions-list-new">
                    {selectedPatient.prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((pr, index) => (
                      <li key={index}>
                        <strong>{formatDate(pr.date)}:</strong> {pr.medicine} ({pr.dosage}) {pr.notes ? `- ${pr.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Hali retseptlar yo'q</p>
                )}
              </section>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  closeModal();
                  openModal(selectedPatient);
                }}
                className="btn-primary"
              >
                Tahrirlash
              </button>
              <button
                onClick={() => deletePatient(selectedPatient.id)}
                className="btn-delete"
              >
                Oʻchirish
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;