import React, { useState, useEffect, useContext } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPhone, 
  FiPlus, 
  FiSearch, 
  FiEdit, 
  FiTrash2, 
  FiMapPin, 
  FiInfo, 
  FiDownload, 
  FiX,
  FiMail,
  FiHeart
} from 'react-icons/fi';
import { AppContext } from '../App';
import { validateStoredPatients, sanitizePatientData, validatePatientData, addNewPatient, sendTelegramMessage } from '../utils';
import * as XLSX from 'xlsx';
import './Patients.css';

const regions = {
  "Toshkent shahri": {
    "tumanlar": {
      "Yunusobod tumani": { "markazi": "Yunusobod" },
      "Mirzo Ulug'bek tumani": { "markazi": "Mirzo Ulug'bek" },
      "Yashnobod tumani": { "markazi": "Yashnobod" },
      "Chilonzor tumani": { "markazi": "Chilonzor" },
      "Shayxontohur tumani": { "markazi": "Shayxontohur" },
      "Olmazor tumani": { "markazi": "Olmazor" },
      "Bektemir tumani": { "markazi": "Bektemir" },
      "Mirobod tumani": { "markazi": "Mirobod" },
      "Sergeli tumani": { "markazi": "Sergeli" },
      "Uchtepa tumani": { "markazi": "Uchtepa" },
      "Yakkasaroy tumani": { "markazi": "Yakkasaroy" }
    }
  },
  "Toshkent viloyati": {
    "tumanlar": {
      "Olmaliq shahri": { "markazi": "Olmaliq" },
      "Angren shahri": { "markazi": "Angren" },
      "Bekobod shahri": { "markazi": "Bekobod" },
      "Chirchiq shahri": { "markazi": "Chirchiq" },
      "Yangiyo'l shahri": { "markazi": "Yangiyo'l" }
    }
  }
};

const Patients = () => {
  const { patients, setPatients, appointments, setAppointments, darkMode } = useContext(AppContext);
  
  // State lar
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExportFormat, setSelectedExportFormat] = useState('excel');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');
  const [viewMode, setViewMode] = useState('bemorlar');
  
  // Bemor portali state lari
  const [showRegistration, setShowRegistration] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [procedure, setProcedure] = useState('');
  const [newPatientPortal, setNewPatientPortal] = useState({
    name: '',
    phone: '',
    telegram: ''
  });

  // Yangi retsept state
  const [newPrescription, setNewPrescription] = useState({
    date: new Date().toISOString().slice(0, 10),
    medicine: '',
    dosage: '',
    notes: ''
  });

  // Manzilni parse qilish
  useEffect(() => {
    if (currentPatient && currentPatient.address) {
      const addressParts = currentPatient.address.split(', ');
      setSelectedRegion(addressParts[0] || '');
      setSelectedDistrict(addressParts[1] || '');
      setAdditionalAddress(addressParts.slice(2).join(', ') || '');
    } else {
      setSelectedRegion('');
      setSelectedDistrict('');
      setAdditionalAddress('');
    }
  }, [currentPatient]);

  // Xabarlarni tozalash
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Vaqt slotalari
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

  const getAvailableSlots = (date) => {
    const timeSlots = generateTimeSlots();
    const bookedSlots = appointments
      .filter(app => app.date === date && app.status !== 'bekor qilindi')
      .map(app => app.time);
    
    return timeSlots.map(slot => ({
      time: slot,
      isBooked: bookedSlots.includes(slot)
    }));
  };

  const slots = getAvailableSlots(selectedDate);

  // Bemorlarni filtrlash
  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  // Formatlash funksiyalari
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Telefon kiritilmagan';
    if (phone.startsWith('+998') && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('uz-UZ') : '-';
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  // Modal funksiyalari
  const openModal = (patient = null) => {
    setCurrentPatient(patient ? { 
      ...patient, 
      prescriptions: patient.prescriptions || [] 
    } : {
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
    });
    
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

  const openDetailsModal = (patient) => {
    setSelectedPatient({ ...patient, prescriptions: patient.prescriptions || [] });
    setDetailsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setExportModalOpen(false);
    setDetailsModalOpen(false);
    setError('');
    setSuccessMessage('');
    setCurrentPatient(null);
  };

  // Viloyat va tuman funksiyalari
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedDistrict('');
  };

  const getDistricts = () => {
    return selectedRegion && regions[selectedRegion] ? 
      Object.keys(regions[selectedRegion].tumanlar) : [];
  };

  // Bemor qo'shish/tahrirlash
  const handlePatientSubmit = (e) => {
    e.preventDefault();
    setError('');

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

    let updatedPatients;
    if (sanitizedPatient.id) {
      updatedPatients = patients.map(p => 
        p.id === sanitizedPatient.id ? sanitizedPatient : p
      );
      setSuccessMessage('Bemor ma\'lumotlari yangilandi');
    } else {
      const newPatient = {
        ...sanitizedPatient,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      updatedPatients = [...patients, newPatient];
      setSuccessMessage('Yangi bemor qo\'shildi');
    }

    setPatients(validateStoredPatients(updatedPatients));
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  // Bemor o'chirish
  const deletePatient = (id) => {
    if (window.confirm('Bemorni o\'chirishni tasdiqlaysizmi?')) {
      if (appointments.some(app => app.patientId === id)) {
        alert('Bu bemorning uchrashuvlari mavjud. Avval uchrashuvlarni o\'chiring.');
        return;
      }
      
      const updatedPatients = patients.filter(p => p.id !== id);
      setPatients(updatedPatients);
      setSuccessMessage('Bemor o\'chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeModal();
    }
  };

  // Retsept qo'shish
  const addPrescription = (e) => {
    e.preventDefault();
    
    if (!newPrescription.medicine.trim() || !newPrescription.dosage.trim()) {
      setError('Dori nomi va dozasi kiritilishi shart');
      return;
    }

    const updatedPatient = {
      ...currentPatient,
      prescriptions: [...(currentPatient.prescriptions || []), { ...newPrescription }]
    };

    setCurrentPatient(updatedPatient);
    setNewPrescription({
      date: new Date().toISOString().slice(0, 10),
      medicine: '',
      dosage: '',
      notes: ''
    });
    setError('');
  };

  // Retsept o'chirish
  const removePrescription = (index) => {
    const updatedPrescriptions = currentPatient.prescriptions.filter((_, i) => i !== index);
    setCurrentPatient({
      ...currentPatient,
      prescriptions: updatedPrescriptions
    });
  };

  // Eksport qilish
  const handleExport = () => {
    if (selectedExportFormat === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        patients.map(patient => ({
          ID: patient.id,
          Ism: patient.name,
          Telefon: patient.phone,
          Jins: patient.gender,
          Manzil: patient.address,
          "Tug'ilgan sana": patient.dob,
          "Oxirgi tashrif": patient.lastVisit,
          Izoh: patient.note,
          Telegram: patient.telegram,
          "Qo'shilgan sana": patient.createdAt
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bemorlar');
      XLSX.writeFile(workbook, 'bemorlar.xlsx');
    }
    
    setSuccessMessage('Ma\'lumotlar eksport qilindi');
    setTimeout(() => {
      setExportModalOpen(false);
      setSuccessMessage('');
    }, 3000);
  };

  // Bemor portali funksiyalari
  const handlePortalRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!newPatientPortal.name.trim() || !newPatientPortal.phone.trim()) {
      setError('Ism va telefon raqami kiritilishi shart');
      return;
    }

    const newPatient = {
      name: newPatientPortal.name,
      phone: newPatientPortal.phone,
      telegram: newPatientPortal.telegram,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    setPatients([...patients, newPatient]);
    setPatientId(newPatient.id);
    setShowRegistration(false);
    setSuccessMessage('Ro\'yxatdan o\'tdingiz! Endi uchrashuv band qilishingiz mumkin.');
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    setError('');

    if (!patientId) {
      setError('Avval ro\'yxatdan o\'ting');
      return;
    }

    if (!selectedTime) {
      setError('Vaqt tanlang');
      return;
    }

    if (!procedure.trim()) {
      setError('Jarayon nomini kiriting');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      patientId: patientId,
      patientName: newPatientPortal.name,
      date: selectedDate,
      time: selectedTime,
      procedure: procedure,
      status: 'kutilmoqda',
      createdAt: new Date().toISOString()
    };

    setAppointments([...appointments, newAppointment]);
    setSuccessMessage('Uchrashuv band qilindi!');
    
    setTimeout(() => {
      setSelectedTime('');
      setProcedure('');
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className={`bemorlar ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sarlavha */}
      <header className="sahifa-sarlavha">
        <div className="konteyner">
          <div className="sarlavha-ichki">
            <h1>
              <FiUser className="sarlavha-ikona" />
              {viewMode === 'bemorlar' ? 'Bemorlar Boshqaruvi' : 'Bemor Portali'}
            </h1>
            
            <button 
              className="rejim-tugmasi"
              onClick={() => setViewMode(viewMode === 'bemorlar' ? 'portal' : 'bemorlar')}
            >
              <FiHeart />
              {viewMode === 'bemorlar' ? 'Bemor Portali' : 'Bemorlar Ro\'yxati'}
            </button>
            
            {viewMode === 'bemorlar' && (
              <span className="badge">{patients.length} ta bemor</span>
            )}
          </div>
        </div>
      </header>

      {/* Xabarlar */}
      {successMessage && (
        <div className="xabar-muvaffaqiyatli">{successMessage}</div>
      )}
      {error && (
        <div className="xabar-xato">{error}</div>
      )}

      <div className="konteyner">
        {viewMode === 'bemorlar' ? (
          /* Bemorlar boshqaruvi */
          <>
            {/* Qidiruv va amallar paneli */}
            <div className="amallar-paneli">
              <div className="qidiruv-guruhi">
                <div className="qidiruv-input">
                  <label>Bemor qidirish</label>
                  <div className="input-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Ism yoki telefon raqami boʻyicha qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="amal-tugmalari">
                  <button 
                    className="tugma tugma-birlamchi"
                    onClick={() => openModal()}
                  >
                    <FiPlus /> Yangi bemor
                  </button>
                  
                  <button 
                    className="tugma tugma-ikkilamchi"
                    onClick={() => setExportModalOpen(true)}
                  >
                    <FiDownload /> Eksport
                  </button>
                </div>
              </div>
            </div>

            {/* Bemorlar ro'yxati */}
            {filteredPatients.length === 0 ? (
              <div className="bosh-holat">
                {searchTerm ? (
                  <>
                    <h3>Hech narsa topilmadi</h3>
                    <p>"{searchTerm}" boʻyicha bemor topilmadi</p>
                    <button 
                      className="tugma tugma-ikkilamchi"
                      onClick={() => setSearchTerm('')}
                    >
                      Filterni tozalash
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Hali bemorlar mavjud emas</h3>
                    <p>Birinchi bemoringizni qoʻshing</p>
                    <button 
                      className="tugma tugma-birlamchi"
                      onClick={() => openModal()}
                    >
                      <FiPlus /> Yangi bemor
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="jadval-konteyner">
                <table className="bemorlar-jadval">
                  <thead>
                    <tr>
                      <th>Bemor</th>
                      <th>Aloqa</th>
                      <th>Yoshi</th>
                      <th>Oxirgi tashrif</th>
                      <th>Izoh</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map(patient => (
                      <tr 
                        key={patient.id}
                        onClick={() => openDetailsModal(patient)}
                        className="bemor-qatori"
                      >
                        <td>
                          <div className="bemor-malumot">
                            <FiUser className="bemor-ikon" />
                            <span>{patient.name || 'Noma\'lum'}</span>
                          </div>
                        </td>
                        
                        <td>
                          <div className="bemor-malumot">
                            <FiPhone className="bemor-ikon" />
                            <span>{formatPhoneNumber(patient.phone)}</span>
                          </div>
                        </td>
                        
                        <td>{calculateAge(patient.dob)}</td>
                        
                        <td>
                          {patient.lastVisit ? formatDate(patient.lastVisit) : 'Tashrif yo\'q'}
                        </td>
                        
                        <td>
                          {patient.note ? (
                            <span className="izoh-korsatgichi">
                              {truncateText(patient.note)}
                            </span>
                          ) : '-'}
                        </td>
                        
                        <td>
                          <div className="amallar-tugmalari">
                            <button
                              className="tugma tugma-tahrir tugma-kichik"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(patient);
                              }}
                            >
                              <FiEdit />
                            </button>
                            
                            <button
                              className="tugma tugma-ochirish tugma-kichik"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePatient(patient.id);
                              }}
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
          /* Bemor portali */
          <div className="bemor-portali">
            <h2>Bemor Portali</h2>
            
            {showRegistration ? (
              /* Ro'yxatdan o'tish */
              <div className="ro'yxatdan-o'tish">
                <h3>Yangi ro'yxatdan o'tish</h3>
                
                <form onSubmit={handlePortalRegister}>
                  <div className="form-guruhi">
                    <label>
                      <FiUser className="input-ikon" />
                      Ism va familiya *
                    </label>
                    <input
                      type="text"
                      value={newPatientPortal.name}
                      onChange={(e) => setNewPatientPortal({
                        ...newPatientPortal,
                        name: e.target.value
                      })}
                      placeholder="To'liq ism va familiya"
                      required
                    />
                  </div>
                  
                  <div className="form-guruhi">
                    <label>
                      <FiPhone className="input-ikon" />
                      Telefon raqami *
                    </label>
                    <input
                      type="tel"
                      value={newPatientPortal.phone}
                      onChange={(e) => setNewPatientPortal({
                        ...newPatientPortal,
                        phone: e.target.value
                      })}
                      placeholder="+998 90 123 45 67"
                      required
                    />
                  </div>
                  
                  <div className="form-guruhi">
                    <label>
                      <FiMail className="input-ikon" />
                      Telegram ID (ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={newPatientPortal.telegram}
                      onChange={(e) => setNewPatientPortal({
                        ...newPatientPortal,
                        telegram: e.target.value
                      })}
                      placeholder="Telegram chat ID"
                    />
                    <div className="input-hint">
                      Xabarnomalar uchun. Agar kiritilmasa, SMS orqali yuboriladi.
                    </div>
                  </div>
                  
                  <button type="submit" className="tugma tugma-birlamchi">
                    <FiPlus /> Ro'yxatdan o'tish
                  </button>
                </form>
              </div>
            ) : (
              /* Uchrashuv band qilish */
              <div className="uchrashuv-band-qilish">
                <h3>Uchrashuv band qilish</h3>
                
                <div className="form-guruhi">
                  <label>
                    <FiCalendar className="input-ikon" />
                    Sana tanlang
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-guruhi">
                  <label>Mavjud vaqtlar</label>
                  <div className="vaqt-slotlari">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        className={`vaqt-sloti ${slot.isBooked ? 'band' : ''} ${
                          selectedTime === slot.time ? 'tanlangan' : ''
                        }`}
                        onClick={() => !slot.isBooked && setSelectedTime(slot.time)}
                        disabled={slot.isBooked}
                      >
                        {slot.time}
                        {slot.isBooked && ' (Band)'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <form onSubmit={handleBookAppointment}>
                  <div className="form-guruhi">
                    <label>
                      <FiClock className="input-ikon" />
                      Tanlangan vaqt
                    </label>
                    <input
                      type="text"
                      value={selectedTime || 'Vaqt tanlanmagan'}
                      readOnly
                    />
                  </div>
                  
                  <div className="form-guruhi">
                    <label>Jarayon tavsifi *</label>
                    <input
                      type="text"
                      value={procedure}
                      onChange={(e) => setProcedure(e.target.value)}
                      placeholder="Masalan: Tish tekshiruvi, Plomba qo'yish"
                      required
                    />
                  </div>
                  
                  <div className="amal-tugmalari">
                    <button type="submit" className="tugma tugma-birlamchi">
                      <FiCalendar /> Uchrashuvni band qilish
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal oynalar */}
      
      {/* Bemor qo'shish/tahrirlash modali */}
      {modalOpen && currentPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2>{currentPatient.id ? 'Bemorni tahrirlash' : 'Yangi bemor'}</h2>
              <button className="yopish-tugmasi" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-tanasi">
              <form onSubmit={handlePatientSubmit}>
                <div className="form-guruhi">
                  <label>
                    <FiUser className="input-ikon" />
                    Ism va familiya *
                  </label>
                  <input
                    type="text"
                    value={currentPatient.name}
                    onChange={e => setCurrentPatient({
                      ...currentPatient,
                      name: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="form-guruhi">
                  <label>
                    <FiPhone className="input-ikon" />
                    Telefon raqami *
                  </label>
                  <input
                    type="tel"
                    value={currentPatient.phone}
                    onChange={e => setCurrentPatient({
                      ...currentPatient,
                      phone: e.target.value
                    })}
                    required
                  />
                </div>
                
                <div className="form-qatorlari">
                  <div className="form-guruhi">
                    <label>Jins</label>
                    <select
                      value={currentPatient.gender}
                      onChange={e => setCurrentPatient({
                        ...currentPatient,
                        gender: e.target.value
                      })}
                    >
                      <option value="">Tanlanmagan</option>
                      <option value="Erkak">Erkak</option>
                      <option value="Ayol">Ayol</option>
                    </select>
                  </div>
                  
                  <div className="form-guruhi">
                    <label>
                      <FiCalendar className="input-ikon" />
                      Tug'ilgan sana
                    </label>
                    <input
                      type="date"
                      value={currentPatient.dob}
                      onChange={e => setCurrentPatient({
                        ...currentPatient,
                        dob: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="form-guruhi">
                  <label>
                    <FiMapPin className="input-ikon" />
                    Manzil
                  </label>
                  
                  <div className="form-qatorlari">
                    <div className="form-guruhi">
                      <label>Viloyat</label>
                      <select value={selectedRegion} onChange={handleRegionChange}>
                        <option value="">Viloyat tanlang</option>
                        {Object.keys(regions).map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-guruhi">
                      <label>Tuman</label>
                      <select 
                        value={selectedDistrict}
                        onChange={e => setSelectedDistrict(e.target.value)}
                        disabled={!selectedRegion}
                      >
                        <option value="">Tuman tanlang</option>
                        {getDistricts().map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <textarea
                    value={additionalAddress}
                    onChange={e => setAdditionalAddress(e.target.value)}
                    placeholder="Ko'cha, uy, xonadon ma'lumotlari"
                    rows={2}
                  />
                </div>
                
                <div className="form-guruhi">
                  <label>
                    <FiMail className="input-ikon" />
                    Telegram ID
                  </label>
                  <input
                    type="text"
                    value={currentPatient.telegram}
                    onChange={e => setCurrentPatient({
                      ...currentPatient,
                      telegram: e.target.value
                    })}
                    placeholder="Telegram chat ID"
                  />
                </div>
                
                <div className="form-guruhi">
                  <label>
                    <FiInfo className="input-ikon" />
                    Qo'shimcha ma'lumot
                  </label>
                  <textarea
                    value={currentPatient.note}
                    onChange={e => setCurrentPatient({
                      ...currentPatient,
                      note: e.target.value
                    })}
                    placeholder="Allergiyalar, kasalliklar tarixi, qo'shimcha eslatmalar"
                    rows={4}
                  />
                </div>
                
                {/* Retseptlar qismi */}
                <div className="form-guruhi">
                  <label>Retseptlar</label>
                  
                  <div className="retseptlar-royxati">
                    {currentPatient.prescriptions?.map((prescription, index) => (
                      <div key={index} className="retsept-elementi">
                        <div className="retsept-sarlavha">
                          <span className="retsept-sana">
                            {formatDate(prescription.date)}
                          </span>
                          <button
                            type="button"
                            className="tugma tugma-ochirish tugma-kichik"
                            onClick={() => removePrescription(index)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        <div className="retsept-malumot">
                          <strong>{prescription.medicine}</strong> - {prescription.dosage}
                          {prescription.notes && ` (${prescription.notes})`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="yangi-retsept">
                    <div className="form-qatorlari">
                      <div className="form-guruhi">
                        <label>Dori nomi</label>
                        <input
                          type="text"
                          value={newPrescription.medicine}
                          onChange={e => setNewPrescription({
                            ...newPrescription,
                            medicine: e.target.value
                          })}
                          placeholder="Dori nomi"
                        />
                      </div>
                      
                      <div className="form-guruhi">
                        <label>Doza</label>
                        <input
                          type="text"
                          value={newPrescription.dosage}
                          onChange={e => setNewPrescription({
                            ...newPrescription,
                            dosage: e.target.value
                          })}
                          placeholder="Doza va muddat"
                        />
                      </div>
                    </div>
                    
                    <div className="form-guruhi">
                      <label>Izoh</label>
                      <input
                        type="text"
                        value={newPrescription.notes}
                        onChange={e => setNewPrescription({
                          ...newPrescription,
                          notes: e.target.value
                        })}
                        placeholder="Qo'shimcha izoh"
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="tugma tugma-ikkilamchi"
                      onClick={addPrescription}
                    >
                      <FiPlus /> Retsept qo'shish
                    </button>
                  </div>
                </div>
                
                <div className="modal-amallar">
                  <button type="submit" className="tugma tugma-birlamchi">
                    {currentPatient.id ? 'Saqlash' : 'Qo\'shish'}
                  </button>
                  <button 
                    type="button" 
                    className="tugma tugma-ikkilamchi"
                    onClick={closeModal}
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Eksport modali */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2>Ma'lumotlarni eksport qilish</h2>
              <button className="yopish-tugmasi" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-tanasi">
              <div className="form-guruhi">
                <label>Format tanlang</label>
                <select
                  value={selectedExportFormat}
                  onChange={e => setSelectedExportFormat(e.target.value)}
                >
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>
              
              <div className="modal-amallar">
                <button 
                  className="tugma tugma-birlamchi"
                  onClick={handleExport}
                >
                  <FiDownload /> Eksport qilish
                </button>
                <button 
                  className="tugma tugma-ikkilamchi"
                  onClick={closeModal}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bemor tafsilotlari modali */}
      {detailsModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2>Bemor ma'lumotlari</h2>
              <button className="yopish-tugmasi" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-tanasi">
              <div className="bemor-tafsilotlari">
                <div className="tafsilot-bolimi">
                  <h3>
                    <FiUser />
                    Asosiy ma'lumotlar
                  </h3>
                  
                  <ul className="tafsilot-royxati">
                    <li>
                      <span className="tafsilot-yorligi">Ism:</span>
                      <span className="tafsilot-qiymati">{selectedPatient.name}</span>
                    </li>
                    <li>
                      <span className="tafsilot-yorligi">Telefon:</span>
                      <span className="tafsilot-qiymati">{formatPhoneNumber(selectedPatient.phone)}</span>
                    </li>
                    <li>
                      <span className="tafsilot-yorligi">Jins:</span>
                      <span className="tafsilot-qiymati">{selectedPatient.gender || '-'}</span>
                    </li>
                    <li>
                      <span className="tafsilot-yorligi">Yoshi:</span>
                      <span className="tafsilot-qiymati">{calculateAge(selectedPatient.dob)}</span>
                    </li>
                    <li>
                      <span className="tafsilot-yorligi">Manzil:</span>
                      <span className="tafsilot-qiymati">{selectedPatient.address || '-'}</span>
                    </li>
                  </ul>
                </div>
                
                {selectedPatient.note && (
                  <div className="tafsilot-bolimi">
                    <h3>
                      <FiInfo />
                      Qo'shimcha ma'lumot
                    </h3>
                    <p>{selectedPatient.note}</p>
                  </div>
                )}
                
                <div className="tafsilot-bolimi">
                  <h3>
                    <FiCalendar />
                    Retseptlar ({selectedPatient.prescriptions?.length || 0})
                  </h3>
                  
                  {selectedPatient.prescriptions?.length > 0 ? (
                    <ul className="tafsilot-royxati">
                      {selectedPatient.prescriptions.map((prescription, index) => (
                        <li key={index}>
                          <span className="tafsilot-yorligi">
                            {formatDate(prescription.date)}:
                          </span>
                          <span className="tafsilot-qiymati">
                            {prescription.medicine} ({prescription.dosage})
                            {prescription.notes && ` - ${prescription.notes}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Hali retseptlar mavjud emas</p>
                  )}
                </div>
              </div>
              
              <div className="modal-amallar">
                <button 
                  className="tugma tugma-birlamchi"
                  onClick={() => {
                    closeModal();
                    openModal(selectedPatient);
                  }}
                >
                  <FiEdit /> Tahrirlash
                </button>
                <button 
                  className="tugma tugma-ikkilamchi"
                  onClick={closeModal}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;