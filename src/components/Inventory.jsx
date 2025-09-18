import React, { useState, useContext } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiBox } from 'react-icons/fi';
import { AppContext } from '../App';
import './Inventory.css';

const Inventory = () => {
  const { inventory, setInventory } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredItems = inventory.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (item = null) => {
    setCurrentItem(item ? { ...item } : {
      id: null,
      name: '',
      type: 'medication', // medication yoki material
      quantity: 0,
      unit: '',
      expiryDate: '',
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
    if (!currentItem.name.trim()) {
      setError('Nomi kiritilishi shart');
      return;
    }
    if (currentItem.quantity < 0) {
      setError('Miqdor 0 dan kichik bo‘lishi mumkin emas');
      return;
    }
    const updated = currentItem.id
      ? inventory.map(i => (i.id === currentItem.id ? currentItem : i))
      : [...inventory, { ...currentItem, id: Date.now() }];
    setInventory(updated);
    setSuccessMessage(currentItem.id ? 'Ma’lumot yangilandi' : 'Yangi mahsulot qo‘shildi');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deleteItem = (id) => {
    if (window.confirm('Haqiqatan ham bu mahsulotni o‘chirmoqchimisiz?')) {
      setInventory(inventory.filter(i => i.id !== id));
      setSuccessMessage('Mahsulot o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="inventory">
      <div className="page-header">
        <h1>Ombor</h1>
        <span className="badge">{inventory.length} ta</span>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="Mahsulot nomi bo‘yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <FiPlus /> Yangi Mahsulot
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{searchTerm}" bo‘yicha mahsulot topilmadi</p>
              <button onClick={() => setSearchTerm('')} className="btn-secondary">
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali mahsulotlar mavjud emas</h3>
              <p>Birinchi mahsulotingizni qo‘shing</p>
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi mahsulot qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Turi</th>
                <th>Miqdori</th>
                <th>Birligi</th>
                <th>Yaroqlilik Muddati</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(i => (
                <tr key={i.id} className={i.quantity < 20 ? 'low-stock' : ''}>
                  <td>{i.name}</td>
                  <td>{i.type === 'medication' ? 'Dori' : 'Material'}</td>
                  <td>{i.quantity}</td>
                  <td>{i.unit || '-'}</td>
                  <td>{i.expiryDate || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(i)} className="btn-edit" title="Tahrirlash">
                        <FiEdit />
                      </button>
                      <button onClick={() => deleteItem(i.id)} className="btn-delete" title="O‘chirish">
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
                <h2>{currentItem.id ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo‘shish'}</h2>
                <button type="button" onClick={closeModal} className="close-button">&times;</button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label><FiBox /> Nomi *</label>
                <input
                  type="text"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Turi</label>
                <select
                  value={currentItem.type}
                  onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value })}
                >
                  <option value="medication">Dori</option>
                  <option value="material">Material</option>
                </select>
              </div>
              <div className="form-group">
                <label>Miqdori *</label>
                <input
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Birligi</label>
                <input
                  type="text"
                  value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  placeholder="Masalan: dona, quti"
                />
              </div>
              <div className="form-group">
                <label>Yaroqlilik Muddati</label>
                <input
                  type="date"
                  value={currentItem.expiryDate}
                  onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Izoh</label>
                <textarea
                  value={currentItem.notes}
                  onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
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

export default Inventory;