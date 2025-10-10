import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import './Inventory.css';

const Inventory = () => {
  const { inventory, setInventory, darkMode } = useContext(AppContext);
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
      type: 'dori',
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
    }, 2000);
  };

  const deleteItem = (id) => {
    if (window.confirm('Haqiqatan ham bu mahsulotni o‘chirmoqchimisiz?')) {
      setInventory(inventory.filter(i => i.id !== id));
      setSuccessMessage('Mahsulot o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const getTypeLabel = (type) => {
    return type === 'dori' ? 'Dori' : 'Maxsulot';
  };

  return (
    <div className={`inventory-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="inventory-header">
        <h1>Ombor</h1>
        <span className="inventory-count">{filteredItems.length} ta mahsulot</span>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="inventory-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Mahsulot nomini kiriting..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
            aria-label="Mahsulot nomi bo‘yicha qidirish"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Qidiruvni tozalash"
            >
              Tozalash
            </button>
          )}
        </div>
        <button onClick={() => openModal()} className="primary-button">
          Yangi Qo‘shish
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <h3>Mahsulot topilmadi</h3>
              <p>"{searchTerm}" bo‘yicha hech narsa topilmadi</p>
              <button onClick={() => setSearchTerm('')} className="action-button">
                Qidiruvni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Ombor bo‘sh</h3>
              <p>Birinchi mahsulotingizni qo‘shing</p>
              <button onClick={() => openModal()} className="primary-button">
                Yangi Qo‘shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="inventory-list">
          {filteredItems.map(i => (
            <div
              key={i.id}
              className={`inventory-item ${i.quantity < 20 ? 'low-stock' : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  openModal(i);
                }
              }}
              aria-label={`Mahsulot ${i.name} tafsilotlarini ko‘rish yoki tahrirlash`}
            >
              <div className="inventory-item-content" onClick={() => openModal(i)}>
                <div className="inventory-item-header">
                  <h3>{i.name}</h3>
                  <span className={`type-tag type-${i.type}`}>{getTypeLabel(i.type)}</span>
                </div>
                <div className="inventory-item-details">
                  <p><strong>Miqdori:</strong> {i.quantity} {i.unit || ''}</p>
                  <p><strong>Yaroqlilik:</strong> {i.expiryDate || '-'}</p>
                  <p><strong>Izoh:</strong> {i.notes || '-'}</p>
                </div>
              </div>
              <div className="inventory-item-actions">
                <button
                  onClick={() => openModal(i)}
                  className="edit-button"
                  aria-label={`Mahsulot ${i.name} ni tahrirlash`}
                >
                  Tahrirlash
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(i.id); }}
                  className="delete-button"
                  aria-label={`Mahsulot ${i.name} ni o‘chirish`}
                >
                  O‘chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>{currentItem.id ? 'Tahrirlash' : 'Yangi Mahsulot'}</h2>
                <button type="button" onClick={closeModal} className="modal-close-button">
                  &times;
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label>Nomi *</label>
                <input
                  type="text"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  required
                  placeholder="Mahsulot nomini kiriting"
                  aria-label="Mahsulot nomi"
                />
              </div>
              <div className="form-group">
                <label>Turi</label>
                <select
                  value={currentItem.type}
                  onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value })}
                  aria-label="Mahsulot turi"
                >
                  <option value="dori">Dori</option>
                  <option value="maxsulot">Maxsulot</option>
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
                  placeholder="Miqdorni kiriting"
                  aria-label="Mahsulot miqdori"
                />
              </div>
              <div className="form-group">
                <label>Birligi</label>
                <input
                  type="text"
                  value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  placeholder="Masalan: dona, quti"
                  aria-label="Mahsulot birligi"
                />
              </div>
              <div className="form-group">
                <label>Yaroqlilik Muddati</label>
                <input
                  type="date"
                  value={currentItem.expiryDate}
                  onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                  aria-label="Yaroqlilik muddati"
                />
              </div>
              <div className="form-group">
                <label>Izoh</label>
                <textarea
                  value={currentItem.notes}
                  onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                  rows="3"
                  placeholder="Qo'shimcha ma'lumotlar"
                  aria-label="Mahsulot izohi"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-button">Saqlash</button>
                <button type="button" onClick={closeModal} className="action-button">Bekor qilish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;