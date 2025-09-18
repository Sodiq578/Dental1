import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { validateStoredPatients, sanitizePatientData, validatePatientData, exportPatientsData, importPatientsData } from '../utils';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiPhone, FiMapPin, FiCalendar, FiInfo, FiDownload, FiUpload } from 'react-icons/fi';
import './Patients.css';

// Bemorlar komponenti
const Patients = () => {
  const { patients, setPatients, appointments, getFromLocalStorage } = useContext(AppContext); // Added getFromLocalStorage here
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  const openModal = (patient = null) => {
    setCurrentPatient(
      patient
        ? { ...patient }
        : {
            id: null,
            name: '',
            phone: '',
            gender: '',
            address: '',
            dob: '',
            lastVisit: '',
            note: '',
          }
    );
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
    setSelectedPatient(patient);
    setDetailsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNoteModalOpen(false);
    setDetailsModalOpen(false);
    setError('');
    setSuccessMessage('');
    setCurrentPatient(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ma'lumotlarni tozalash
    const sanitizedPatient = sanitizePatientData(currentPatient);
    
    // Validatsiya (telefon validatsiyasini bo'shatib qo'ydik, faqat mavjudligini tekshirish)
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
    } else {
      const newPatient = { 
        ...sanitizedPatient, 
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      };
      updated = [...patients, newPatient];
      setSuccessMessage('Yangi bemor muvaffaqiyatli qo‘shildi');
    }
    
    setPatients(validateStoredPatients(updated)); // Global state yangilash
    
    // 3 soniyadan so'ng xabarni yo'qotish
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
      setPatients(updated); // Global state yangilash
      setSuccessMessage('Bemor muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeModal();
    }
  };

  const handleExport = () => {
    const success = exportPatientsData();
    if (success) {
      setSuccessMessage('Bemor ma\'lumotlari muvaffaqiyatli eksport qilindi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    importPatientsData(file, (success, message) => {
      if (success) {
        // Yangi ma'lumotlarni yuklash va global state ni yangilash
        setPatients(validateStoredPatients(getFromLocalStorage('patients', [])));
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(message);
        setTimeout(() => setError(''), 5000);
      }
    });
  };

  const truncateNote = (note, maxLength = 30) => {
    if (!note) return '-';
    return note.length > maxLength ? `${note.slice(0, maxLength)}...` : note;
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
    // Agar +998 bilan boshlansa, O'zbekiston formatida ko'rsat
    if (phone.startsWith('+998') && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    // Boshqa formatlar uchun (chet el), faqat bo'shliqlar qo'shish yoki asl holatda qoldirish
    // Masalan, +1 (123) 456-7890 ni o'zgartirmasdan qoldirish yoki oddiy format
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'); // Umumiy oddiy format (faqat raqamlar uchun)
  };

  return (
    <div className="patients">
      <div className="page-header">
        <h1>Bemorlar</h1>
        <span className="badge">{patients.length} ta</span>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
          <label className="btn-secondary import-btn" title="Import qilish">
            <FiUpload />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
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
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openDetailsModal(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="patient-name">
                    <div className="patient-info">
                      <FiUser className="patient-icon" />
                      <span>{p.name || 'Noma\'lum'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="patient-info">
                      <FiPhone className="patient-icon" />
                      <span>{formatPhoneNumber(p.phone)}</span>
                    </div>
                  </td>
                  <td>{calculateAge(p.dob)}</td>
                  <td>{p.gender || '-'}</td>
                  <td>
                    {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('uz-UZ') : 'Tashrif yo\'q'}
                  </td>
                  <td>
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
                  <td onClick={(e) => e.stopPropagation()}>
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

      {/* Add/Edit Patient Modal */}
      {modalOpen && (
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
                <textarea
                  placeholder="Bemorning to'liq manzili (shahar, tuman, ko'cha, uy va h.k.)"
                  value={currentPatient.address}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, address: e.target.value })
                  }
                  rows="3"
                />
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
            <div className="patient-details">
              <div className="detail-item detail-name">
                <FiUser className="detail-icon" />
                <div>
                  <strong>Ism va familiya</strong>
                  <p>{selectedPatient.name || 'Noma\'lum'}</p>
                </div>
              </div>
              
              <div className="detail-item detail-phone">
                <FiPhone className="detail-icon" />
                <div>
                  <strong>Telefon</strong>
                  <p>{formatPhoneNumber(selectedPatient.phone)}</p>
                </div>
              </div>
              
              <div className="detail-item detail-gender">
                <div className="detail-icon">👤</div>
                <div>
                  <strong>Jinsi</strong>
                  <p>{selectedPatient.gender || '-'}</p>
                </div>
              </div>
              
              <div className="detail-item detail-address">
                <FiMapPin className="detail-icon" />
                <div>
                  <strong>Manzil</strong>
                  <p>{selectedPatient.address || '-'}</p>
                </div>
              </div>
              
              <div className="detail-item detail-dob">
                <FiCalendar className="detail-icon" />
                <div>
                  <strong>Tug'ilgan sana</strong>
                  <p>{selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString('uz-UZ') : '-'}</p>
                </div>
              </div>
              
              <div className="detail-item detail-age">
                <div className="detail-icon">🎂</div>
                <div>
                  <strong>Yoshi</strong>
                  <p>{calculateAge(selectedPatient.dob)}</p>
                </div>
              </div>
              
              <div className="detail-item detail-last-visit">
                <FiCalendar className="detail-icon" />
                <div>
                  <strong>Oxirgi tashrif</strong>
                  <p>{selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString('uz-UZ') : 'Hali tashrif yo\'q'}</p>
                </div>
              </div>
              
              <div className="detail-item detail-created">
                <FiCalendar className="detail-icon" />
                <div>
                  <strong>Qo'shilgan sana</strong>
                  <p>{selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString('uz-UZ') : '-'}</p>
                </div>
              </div>
              
              {selectedPatient.note && (
                <div className="detail-item detail-note">
                  <FiInfo className="detail-icon" />
                  <div>
                    <strong>Izoh</strong>
                    <p className="detail-note-text">{selectedPatient.note}</p>
                  </div>
                </div>
              )}
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