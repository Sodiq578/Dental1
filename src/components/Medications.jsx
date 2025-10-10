import React, { useState, useContext } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiInfo, FiX } from 'react-icons/fi';
import { AppContext } from '../App';
import './Medications.css';

const Medications = () => {
  const { medications, setMedications } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentMed, setCurrentMed] = useState(null);
  const [selectedDetailsMed, setSelectedDetailsMed] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredMeds = medications.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (med = null) => {
    setCurrentMed(
      med
        ? { ...med }
        : { id: null, name: '', type: '', dosage: '', quantity: 0, usage: '' }
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

  const openDetailsModal = (med) => {
    setSelectedDetailsMed(med);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedDetailsMed(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentMed.name.trim()) {
      setError('Dori nomi kiritilishi shart');
      return;
    }
    if (currentMed.quantity < 0) {
      setError('Miqdor 0 dan kichik bo‘lishi mumkin emas');
      return;
    }
    let updated;
    if (currentMed.id) {
      updated = medications.map((m) => (m.id === currentMed.id ? currentMed : m));
      setSuccessMessage('Dori ma\'lumotlari muvaffaqiyatli yangilandi');
    } else {
      updated = [...medications, { ...currentMed, id: Date.now() }];
      setSuccessMessage('Yangi dori muvaffaqiyatli qo‘shildi');
    }
    setMedications(updated);
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deleteMed = (id) => {
    if (window.confirm('Haqiqatan ham bu dorini o‘chirmoqchimisiz?')) {
      const updated = medications.filter((m) => m.id !== id);
      setMedications(updated);
      setSuccessMessage('Dori muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="med-container">
      <div className="med-header">
        <h1>Dorilar</h1>
        <span className="med-count">{medications.length} ta</span>
      </div>

      {successMessage && <div className="success-alert">{successMessage}</div>}
      {error && <div className="error-alert">{error}</div>}

      <div className="med-controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Dori nomi boʻyicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-field"
          />
        </div>
        <button onClick={() => openModal()} className="primary-button">
          <FiPlus /> Yangi dori
        </button>
      </div>

      {filteredMeds.length === 0 ? (
        <div className="empty-state">
          {search ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{search}" boʻyicha hech qanday dori topilmadi</p>
              <button onClick={() => setSearch('')} className="action-button">
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali dorilar mavjud emas</h3>
              <p>Birinchi doringizni qoʻshing</p>
              <button onClick={() => openModal()} className="primary-button">
                <FiPlus /> Yangi dori qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="medications-table">
          <table>
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Turi</th>
                <th>Dozasi</th>
                <th>Miqdori</th>
                <th>Foydalanish</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeds.map((m) => (
                <tr
                  key={m.id}
                  className={m.quantity < 20 ? 'low-stock' : ''}
                  onClick={() => openDetailsModal(m)}
                >
                  <td>{m.name || '-'}</td>
                  <td>{m.type || '-'}</td>
                  <td>{m.dosage || '-'}</td>
                  <td>{m.quantity}</td>
                  <td>{m.usage || '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="table-actions">
                      <button onClick={() => openModal(m)} className="edit-button" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteMed(m.id)} className="delete-button" title="Oʻchirish">
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
                <h2>{currentMed.id ? 'Dorini tahrirlash' : 'Yangi dori qoʻshish'}</h2>
                <button type="button" onClick={closeModal} className="modal-close-button">
                  <FiX />
                </button>
              </div>

              {error && <div className="error-alert">{error}</div>}
              {successMessage && <div className="success-alert">{successMessage}</div>}

              <div className="form-group">
                <label className="input-label">
                  <FiInfo className="input-icon" /> Dori nomi *
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Paracetamol"
                  value={currentMed.name}
                  onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FiInfo className="input-icon" /> Turi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Tableta, Sirop, Injektsiya"
                  value={currentMed.type}
                  onChange={(e) => setCurrentMed({ ...currentMed, type: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FiInfo className="input-icon" /> Dozasi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 500mg yoki 5ml"
                  value={currentMed.dosage}
                  onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FiInfo className="input-icon" /> Miqdori *
                </label>
                <input
                  type="number"
                  placeholder="Dona yoki quti soni"
                  value={currentMed.quantity}
                  onChange={(e) =>
                    setCurrentMed({ ...currentMed, quantity: parseInt(e.target.value) || 0 })
                  }
                  required
                  min="0"
                />
                <div className="input-hint">0 yoki undan yuqori son kiriting</div>
              </div>

              <div className="form-group">
                <label className="input-label">
                  <FiInfo className="input-icon" /> Foydalanish
                </label>
                <textarea
                  placeholder="Masalan: Kuniga 2 marta, ovqatdan keyin"
                  value={currentMed.usage}
                  onChange={(e) => setCurrentMed({ ...currentMed, usage: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  {currentMed.id ? 'Saqlash' : 'Qoʻshish'}
                </button>
                <button type="button" onClick={closeModal} className="action-button">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsModalOpen && selectedDetailsMed && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h2>Dori tafsilotlari</h2>
              <button type="button" onClick={closeDetailsModal} className="details-close-button">
                <FiX />
              </button>
            </div>
            <div className="details-modal-content">
              <p><strong>Nomi:</strong> {selectedDetailsMed.name || '-'}</p>
              <p><strong>Turi:</strong> {selectedDetailsMed.type || '-'}</p>
              <p><strong>Dozasi:</strong> {selectedDetailsMed.dosage || '-'}</p>
              <p><strong>Miqdori:</strong> {selectedDetailsMed.quantity}</p>
              <p><strong>Foydalanish:</strong> {selectedDetailsMed.usage || '-'}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => { closeDetailsModal(); openModal(selectedDetailsMed); }} className="primary-button">
                Tahrirlash
              </button>
              <button onClick={closeDetailsModal} className="action-button">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medications;