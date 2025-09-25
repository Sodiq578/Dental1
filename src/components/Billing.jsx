import React, { useState, useContext } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { AppContext } from '../App';
import './Billing.css';

const Billing = () => {
  const { patients, appointments, billings, setBillings } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if patients array is empty
  if (!patients || patients.length === 0) {
    return <div className="error-state">Bemorlar ma'lumotlari yuklanmadi</div>;
  }

  const filteredBills = billings.filter(b =>
    patients.find(p => String(p.id) === String(b.patientId))?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.invoiceNumber.includes(searchTerm)
  );

  const openModal = (bill = null) => {
    setCurrentBill(bill ? { ...bill } : {
      id: null,
      patientId: '',
      invoiceNumber: `INV-${Date.now()}`,
      amount: 0,
      status: 'unpaid',
      insurance: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentBill.patientId) {
      setError('Bemor tanlanishi shart');
      return;
    }
    if (currentBill.amount <= 0) {
      setError('To‘lov summasi 0 dan katta bo‘lishi kerak');
      return;
    }
    const updated = currentBill.id
      ? billings.map(b => (String(b.id) === String(currentBill.id) ? { ...currentBill } : b))
      : [...billings, { ...currentBill, id: Date.now() }];
    setBillings(updated);
    setSuccessMessage(currentBill.id ? 'To‘lov yangilandi' : 'To‘lov qo‘shildi');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deleteBill = (id) => {
    if (window.confirm('Haqiqatan ham bu to‘lovni o‘chirmoqchimisiz?')) {
      setBillings(billings.filter(b => String(b.id) !== String(id)));
      setSuccessMessage('To‘lov o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getPatientName = (id, bill) => {
    const p = patients.find(p => String(p.id) === String(id));
    return p ? p.name : (bill.patientName || 'Noma’lum');
  };

  return (
    <div className="billing">
      <div className="page-header">
        <h1>Hisob-kitob</h1>
        <span className="badge">{billings.length} ta</span>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="Bemor yoki faktura raqami bo‘yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi To‘lov
        </button>
      </div>

      {filteredBills.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{searchTerm}" bo‘yicha to‘lov topilmadi</p>
              <button onClick={() => setSearchTerm('')} className="btn-secondary">
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali to‘lovlar mavjud emas</h3>
              <p>Birinchi to‘lovingizni qo‘shing</p>
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi to‘lov qo'shish
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
                <th>Faktura Raqami</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Sug‘urta</th>
                <th>Sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(b => (
                <tr key={b.id}>
                  <td>{getPatientName(b.patientId, b)}</td>
                  <td>{b.invoiceNumber}</td>
                  <td>{b.amount || b.total} UZS</td>
                  <td>{b.status === 'paid' ? 'To‘langan' : 'To‘lanmagan'}</td>
                  <td>{b.insurance || '-'}</td>
                  <td>{b.date}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(b)} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteBill(b.id)} className="btn-delete" title="O‘chirish">
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
                <h2>{currentBill.id ? 'To‘lovni Tahrirlash' : 'Yangi To‘lov Qo‘shish'}</h2>
                <button type="button" onClick={closeModal} className="close-button">&times;</button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label><FiDollarSign /> Bemor *</label>
                <select
                  value={currentBill.patientId}
                  onChange={(e) => setCurrentBill({ ...currentBill, patientId: e.target.value })}
                  required
                >
                  <option value="">Bemor tanlang</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Faktura Raqami *</label>
                <input
                  type="text"
                  value={currentBill.invoiceNumber}
                  onChange={(e) => setCurrentBill({ ...currentBill, invoiceNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Summa (UZS) *</label>
                <input
                  type="number"
                  value={currentBill.amount}
                  onChange={(e) => setCurrentBill({ ...currentBill, amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={currentBill.status}
                  onChange={(e) => setCurrentBill({ ...currentBill, status: e.target.value })}
                >
                  <option value="unpaid">To‘lanmagan</option>
                  <option value="paid">To‘langan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sug‘urta</label>
                <input
                  type="text"
                  value={currentBill.insurance}
                  onChange={(e) => setCurrentBill({ ...currentBill, insurance: e.target.value })}
                  placeholder="Sug‘urta kompaniyasi"
                />
              </div>
              <div className="form-group">
                <label>Sana</label>
                <input
                  type="date"
                  value={currentBill.date}
                  onChange={(e) => setCurrentBill({ ...currentBill, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Izoh</label>
                <textarea
                  value={currentBill.notes}
                  onChange={(e) => setCurrentBill({ ...currentBill, notes: e.target.value })}
                  rows="3"
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

export default Billing;