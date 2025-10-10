import React, { useState, useEffect, useContext } from 'react';
import { 
  FiEdit, FiTrash2, FiPlus, FiX, FiSearch, 
  FiCalendar, FiUser, FiPhone, FiMapPin, 
  FiInfo, FiDownload, FiMail 
} from 'react-icons/fi';
import { AppContext } from '../App';
import { 
  validateStoredPatients, 
  sanitizePatientData, 
  validatePatientData, 
  sendTelegramMessage 
} from '../utils';
import * as XLSX from 'xlsx';
import './Patients.css';

// Region and district data for Uzbekistan
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
      "Yangiyol shahri": { "markazi": "Yangiyol" }
    }
  }
};

const Patients = () => {
  const { patients, setPatients, appointments, darkMode } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExportFormat, setSelectedExportFormat] = useState('excel');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');
  const [newPrescription, setNewPrescription] = useState({
    date: new Date().toISOString().slice(0, 10),
    medicine: '',
    dosage: '',
    notes: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage, setPatientsPerPage] = useState(50); // Increased from 20 to 50
  const [showAll, setShowAll] = useState(false); // New state for toggling pagination
  const [isLoading, setIsLoading] = useState(true); // New loading state

  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500); // Simulate API delay
  }, []);

  // Update address fields when editing a patient
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

  // Clear success/error messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Utility functions
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

  const truncateText = (text, maxLength = 20) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  // Modal handling
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
    setDetailsModalOpen(false);
    setExportModalOpen(false);
    setError('');
    setSuccessMessage('');
    setCurrentPatient(null);
    setSelectedPatient(null);
  };

  // Address handling
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedDistrict('');
  };

  const getDistricts = () => {
    return selectedRegion && regions[selectedRegion] ? 
      Object.keys(regions[selectedRegion].tumanlar) : [];
  };

  // Patient form submission
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
      setSuccessMessage('Bemor ma\'lumotlari muvaffaqiyatli yangilandi');
    } else {
      const newPatient = {
        ...sanitizedPatient,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      updatedPatients = [...patients, newPatient];
      setSuccessMessage('Yangi bemor muvaffaqiyatli qo\'shildi');
      
      const adminChatId = '5838205785';
      const message = `Yangi bemor qoshildi: ${newPatient.name} - ${formatPhoneNumber(newPatient.phone)}`;
      sendTelegramMessage(adminChatId, message);
    }

    setPatients(validateStoredPatients(updatedPatients));
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  // Delete patient
  const deletePatient = (id) => {
    if (window.confirm('Haqiqatan ham bu bemorni o‘chirmoqchimisiz?')) {
      if (appointments.some(app => String(app.patientId) === String(id))) {
        setError('Bu bemorning uchrashuvlari mavjud. Avval uchrashuvlarni o‘chiring.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      const updatedPatients = patients.filter(p => p.id !== id);
      setPatients(updatedPatients);
      setSuccessMessage('Bemor muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeModal();
    }
  };

  // Prescription handling
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

  const removePrescription = (index) => {
    const updatedPrescriptions = currentPatient.prescriptions.filter((_, i) => i !== index);
    setCurrentPatient({
      ...currentPatient,
      prescriptions: updatedPrescriptions
    });
  };

  // Export data
  const handleExport = () => {
    if (selectedExportFormat === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        patients.map(patient => ({
          ID: patient.id,
          Ism: patient.name,
          Telefon: formatPhoneNumber(patient.phone),
          Jins: patient.gender || '-',
          Manzil: patient.address || '-',
          "Tug'ilgan sana": formatDate(patient.dob),
          Izoh: patient.note || '-',
          Telegram: patient.telegram || '-',
          "Qoshilgan sana": formatDate(patient.createdAt)
        }))
      );
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bemorlar');
      XLSX.writeFile(workbook, 'bemorlar.xlsx');
    }
    
    setSuccessMessage('Ma\'lumotlar muvaffaqiyatli eksport qilindi');
    setTimeout(() => {
      setExportModalOpen(false);
      setSuccessMessage('');
    }, 3000);
  };

  // Filter and paginate patients
  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  const indexOfLastPatient = showAll ? filteredPatients.length : currentPage * patientsPerPage;
  const indexOfFirstPatient = showAll ? 0 : indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="app-header">
        <h1>
          <FiUser className="input-icon" /> Bemorlar
        </h1>
        <span className="app-count">{filteredPatients.length} ta</span>
      </div>

      {successMessage && <div className="success-alert">{successMessage}</div>}
      {error && <div className="error-alert">{error}</div>}

      <div className="app-controls">
        <div className="search-bar">
          <input
            id="search-input"
            type="text"
            placeholder="Ism yoki telefon boʻyicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
            aria-label="Bemorlarni qidirish"
          />
        </div>
        <div className="action-buttons">
          <button className="primary-button" onClick={() => openModal()}>
            <FiPlus /> Yangi bemor
          </button>
          <button className="action-button" onClick={() => setExportModalOpen(true)}>
            <FiDownload /> Eksport
          </button>
          <button 
            className="action-button" 
            onClick={() => setShowAll(!showAll)}
            aria-label={showAll ? "Paginatsiyani yoqish" : "Hammasini ko'rsatish"}
          >
            {showAll ? 'Paginatsiyani yoqish' : 'Hammasini ko‘rsatish'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Yuklanmoqda...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{searchTerm}" boʻyicha bemor topilmadi</p>
              <button onClick={() => setSearchTerm('')} className="action-button">
                Qidiruvni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali bemorlar mavjud emas</h3>
              <p>Birinchi bemoringizni qoʻshing</p>
              <button onClick={() => openModal()} className="primary-button">
                <FiPlus /> Yangi bemor
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="appointments-table">
          <table aria-label="Bemorlar ro'yxati">
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Telefon</th>
                <th>Yoshi</th>
                <th>Manzil</th>
                <th>Izoh</th>
                <th>Retseptlar</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map(patient => (
                <tr key={patient.id} onClick={() => openDetailsModal(patient)} className="bemor-qatori">
                  <td>{patient.name || 'Noma’lum'}</td>
                  <td>{formatPhoneNumber(patient.phone)}</td>
                  <td>{calculateAge(patient.dob)}</td>
                  <td>{truncateText(patient.address)}</td>
                  <td>{truncateText(patient.note)}</td>
                  <td>{patient.prescriptions?.length || 0} ta</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(patient);
                        }} 
                        className="edit-button" 
                        title="Tahrirlash"
                        aria-label={`Tahrirlash ${patient.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatient(patient.id);
                        }} 
                        className="delete-button" 
                        title="Oʻchirish"
                        aria-label={`O'chirish ${patient.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!showAll && totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                aria-label="Oldingi sahifa"
              >
                Oldingi
              </button>
              
              {pageNumbers.map(number => (
                <button
                  key={number}
                  className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                  onClick={() => paginate(number)}
                  aria-label={`Sahifa ${number}`}
                >
                  {number}
                </button>
              ))}
              
              <button
                className="pagination-button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Keyingi sahifa"
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && currentPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handlePatientSubmit}>
              <div className="modal-header">
                <h2>{currentPatient.id ? 'Bemorni tahrirlash' : 'Yangi bemor'}</h2>
                <button type="button" onClick={closeModal} className="modal-close-button" aria-label="Modalni yopish">
                  <FiX />
                </button>
              </div>

              {error && <div className="error-alert">{error}</div>}
              {successMessage && <div className="success-alert">{successMessage}</div>}

              <div className="form-group">
                <label htmlFor="name-input" className="input-label">
                  <FiUser className="input-icon" /> Ism va familiya *
                </label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Bemor ismi"
                  value={currentPatient.name}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, name: e.target.value })}
                  required
                  aria-required="true"
                />
                <div className="input-hint">To‘liq ism va familiyani kiriting</div>
              </div>

              <div className="form-group">
                <label htmlFor="phone-input" className="input-label">
                  <FiPhone className="input-icon" /> Telefon raqami *
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={currentPatient.phone}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, phone: e.target.value })}
                  required
                  aria-required="true"
                />
                <div className="input-hint">Xalqaro formatda kiriting</div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="gender-input" className="input-label">Jins</label>
                  <select
                    id="gender-input"
                    value={currentPatient.gender}
                    onChange={(e) => setCurrentPatient({ ...currentPatient, gender: e.target.value })}
                    aria-label="Jinsni tanlang"
                  >
                    <option value="">Jinsni tanlang</option>
                    <option value="Erkak">Erkak</option>
                    <option value="Ayol">Ayol</option>
                  </select>
                  <div className="input-hint">Bemor jinsini tanlang</div>
                </div>
                <div className="form-group">
                  <label htmlFor="dob-input" className="input-label">
                    <FiCalendar className="input-icon" /> Tug'ilgan sana
                  </label>
                  <input
                    id="dob-input"
                    type="date"
                    value={currentPatient.dob}
                    onChange={(e) => setCurrentPatient({ ...currentPatient, dob: e.target.value })}
                    aria-label="Tug'ilgan sana"
                  />
                  <div className="input-hint">Tug‘ilgan sanani kiriting</div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address-input" className="input-label">
                  <FiMapPin className="input-icon" /> Manzil
                </label>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="region-input" className="input-label">Viloyat</label>
                    <select
                      id="region-input"
                      value={selectedRegion}
                      onChange={handleRegionChange}
                      aria-label="Viloyat tanlang"
                    >
                      <option value="">Viloyat tanlang</option>
                      {Object.keys(regions).map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="district-input" className="input-label">Tuman</label>
                    <select
                      id="district-input"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedRegion}
                      aria-label="Tuman tanlang"
                    >
                      <option value="">Tuman tanlang</option>
                      {getDistricts().map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  id="address-input"
                  placeholder="Ko‘cha, uy, xonadon ma‘lumotlari"
                  value={additionalAddress}
                  onChange={(e) => setAdditionalAddress(e.target.value)}
                  rows="2"
                  aria-label="Qo‘shimcha manzil ma‘lumotlari"
                />
                <div className="input-hint">To‘liq manzilni kiriting</div>
              </div>

              <div className="form-group">
                <label htmlFor="telegram-input" className="input-label">
                  <FiMail className="input-icon" /> Telegram Chat ID
                </label>
                <input
                  id="telegram-input"
                  type="text"
                  placeholder="Telegram Chat ID (masalan: 5838205785)"
                  value={currentPatient.telegram}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, telegram: e.target.value })}
                  aria-label="Telegram Chat ID"
                />
                <div className="input-hint">Bemor botga start bosgandan keyin olingan Chat ID ni kiriting</div>
              </div>

              <div className="form-group">
                <label htmlFor="note-input" className="input-label">
                  <FiInfo className="input-icon" /> Izohlar
                </label>
                <textarea
                  id="note-input"
                  placeholder="Allergiyalar, kasalliklar tarixi, qo‘shimcha eslatmalar"
                  value={currentPatient.note}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, note: e.target.value })}
                  rows="4"
                  aria-label="Qo‘shimcha izohlar"
                />
                <div className="input-hint">Bemor haqida qo‘shimcha ma‘lumotlarni kiriting</div>
              </div>

              <div className="form-group">
                <label className="input-label">Retseptlar ({currentPatient.prescriptions?.length || 0})</label>
                <div className="previous-prescriptions">
                  {currentPatient.prescriptions?.length > 0 ? (
                    <ul aria-label="Retseptlar ro'yxati">
                      {currentPatient.prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((pres, index) => (
                        <li key={index}>
                          {formatDate(pres.date)} - {pres.medicine}: {pres.dosage} {pres.notes && `(${pres.notes})`}
                          <button 
                            type="button" 
                            className="delete-button" 
                            onClick={() => removePrescription(index)}
                            aria-label={`Retseptni o'chirish ${pres.medicine}`}
                          >
                            <FiTrash2 />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Hali retseptlar mavjud emas</p>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="prescription-medicine" className="input-label">Dori nomi</label>
                    <input
                      id="prescription-medicine"
                      type="text"
                      placeholder="Dori nomi"
                      value={newPrescription.medicine}
                      onChange={(e) => setNewPrescription({ ...newPrescription, medicine: e.target.value })}
                      aria-label="Dori nomi"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prescription-dosage" className="input-label">Doza</label>
                    <input
                      id="prescription-dosage"
                      type="text"
                      placeholder="Doza va muddat"
                      value={newPrescription.dosage}
                      onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                      aria-label="Doza va muddat"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="prescription-notes" className="input-label">Izoh</label>
                  <input
                    id="prescription-notes"
                    type="text"
                    placeholder="Qo‘shimcha izoh"
                    value={newPrescription.notes}
                    onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                    aria-label="Retsept izohi"
                  />
                </div>
                <button 
                  type="button" 
                  className="action-button" 
                  onClick={addPrescription}
                  aria-label="Retsept qo‘shish"
                >
                  <FiPlus /> Retsept qo‘shish
                </button>
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  {currentPatient.id ? 'Saqlash' : 'Qo‘shish'}
                </button>
                <button type="button" onClick={closeModal} className="action-button">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bemor ma'lumotlari</h2>
              <button type="button" onClick={closeModal} className="modal-close-button" aria-label="Modalni yopish">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h3 className="details-title">
                  <FiUser className="input-icon" /> Asosiy ma'lumotlar
                </h3>
                <div className="details-content">
                  <p><strong>Ism:</strong> {selectedPatient.name || 'Noma’lum'}</p>
                  <p><strong>Telefon:</strong> {formatPhoneNumber(selectedPatient.phone)}</p>
                  <p><strong>Jins:</strong> {selectedPatient.gender || '-'}</p>
                  <p><strong>Yoshi:</strong> {calculateAge(selectedPatient.dob)}</p>
                  <p><strong>Manzil:</strong> {selectedPatient.address || '-'}</p>
                  <p><strong>Telegram:</strong> {selectedPatient.telegram || '-'}</p>
                </div>
              </div>

              {selectedPatient.note && (
                <div className="details-section">
                  <h3 className="details-title">
                    <FiInfo className="input-icon" /> Qoshimcha ma'lumot
                  </h3>
                  <div className="details-content">
                    <p>{selectedPatient.note}</p>
                  </div>
                </div>
              )}

              <div className="details-section">
                <h3 className="details-title">
                  <FiCalendar className="input-icon" /> Retseptlar ({selectedPatient.prescriptions?.length || 0})
                </h3>
                <div className="details-content">
                  {selectedPatient.prescriptions?.length > 0 ? (
                    <ul className="prescription-list" aria-label="Retseptlar ro'yxati">
                      {selectedPatient.prescriptions.map((pres, index) => (
                        <li key={index} className="prescription-item">
                          {formatDate(pres.date)} - {pres.medicine}: {pres.dosage} {pres.notes && `(${pres.notes})`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-data">Hali retseptlar mavjud emas</p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="primary-button" 
                  onClick={() => {
                    closeModal();
                    openModal(selectedPatient);
                  }}
                  aria-label={`Tahrirlash ${selectedPatient.name}`}
                >
                  <FiEdit /> Tahrirlash
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="action-button"
                  aria-label="Modalni yopish"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ma'lumotlarni eksport qilish</h2>
              <button type="button" onClick={closeModal} className="modal-close-button" aria-label="Modalni yopish">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="export-format" className="input-label">Format tanlang</label>
                <select
                  id="export-format"
                  value={selectedExportFormat}
                  onChange={(e) => setSelectedExportFormat(e.target.value)}
                  aria-label="Eksport formatini tanlang"
                >
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button className="primary-button" onClick={handleExport} aria-label="Ma'lumotlarni eksport qilish">
                  <FiDownload /> Eksport qilish
                </button>
                <button type="button" onClick={closeModal} className="action-button" aria-label="Bekor qilish">
                  Bekor qilish
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