import React, { useState, useContext } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiGrid, FiUser } from 'react-icons/fi';
import { AppContext } from '../App';
import './Charting.css';

const Charting = () => {
  const { patients, appointments, setAppointments } = useContext(AppContext);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentChart, setCurrentChart] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const getPatientCharts = () => {
    return appointments
      .filter(a => a.patientId === selectedPatient?.id)
      .map(a => ({
        id: a.id,
        date: a.date,
        procedure: a.procedure,
        tooth: a.notes?.match(/Tooth (\d+)/)?.[1] || 'N/A',
        notes: a.notes
      }));
  };

  const openModal = (chart = null) => {
    setCurrentChart(chart ? { ...chart } : {
      id: null,
      patientId: selectedPatient?.id,
      date: new Date().toISOString().split('T')[0],
      procedure: '',
      tooth: '',
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
    if (!currentChart.procedure.trim()) {
      setError('Jarayon kiritilishi shart');
      return;
    }
    if (!currentChart.tooth.trim()) {
      setError('Tish raqami kiritilishi shart');
      return;
    }
    const updatedAppointment = {
      ...currentChart,
      notes: `Tooth ${currentChart.tooth}: ${currentChart.notes}`
    };
    let updatedAppointments;
    if (currentChart.id) {
      updatedAppointments = appointments.map(a => (a.id === currentChart.id ? updatedAppointment : a));
      setSuccessMessage('Diagramma yangilandi');
    } else {
      updatedAppointments = [...appointments, {
        ...updatedAppointment,
        id: Date.now(),
        patientId: selectedPatient.id,
        status: 'kutilmoqda',
        time: '00:00'
      }];
      setSuccessMessage('Yangi diagramma qo‘shildi');
    }
    setAppointments(updatedAppointments);
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deleteChart = (id) => {
    if (window.confirm('Haqiqatan ham bu diagrammani o‘chirmoqchimisiz?')) {
      setAppointments(appointments.filter(a => a.id !== id));
      setSuccessMessage('Diagramma o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const renderToothDiagram = () => {
    return (
      <svg width="400" height="200" viewBox="0 0 400 200" className="tooth-diagram">
        <rect x="0" y="0" width="400" height="200" fill="#f8fafc" rx="10" />
        <text x="200" y="20" textAnchor="middle" fontSize="16" fill="#64748b">Yuqori Tishlar</text>
        <text x="200" y="100" textAnchor="middle" fontSize="16" fill="#64748b">Pastki Tishlar</text>
        {[...Array(16)].map((_, i) => {
          const toothNumber = i + 1;
          const isTreated = getPatientCharts().some(c => c.tooth === `Tooth ${toothNumber}`);
          return (
            <React.Fragment key={`tooth-${i}`}>
              <rect
                x={20 + i * 24}
                y={30}
                width="20"
                height="40"
                fill={isTreated ? '#f59e0b' : '#e2e8f0'}
                stroke="#64748b"
                strokeWidth="1"
                rx="2"
              />
              <text x={30 + i * 24} y="80" fontSize="10" fill="#64748b">{toothNumber}</text>
              <rect
                x={20 + i * 24}
                y={120}
                width="20"
                height="40"
                fill={isTreated ? '#f59e0b' : '#e2e8f0'}
                stroke="#64748b"
                strokeWidth="1"
                rx="2"
              />
              <text x={30 + i * 24} y="170" fontSize="10" fill="#64748b">{16 + toothNumber}</text>
            </React.Fragment>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="charting">
      <div className="page-header">
        <h1>Diagrammalar</h1>
      </div>

      <div className="actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="Bemor ism yoki telefon bo‘yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {selectedPatient && (
          <button onClick={() => openModal()} className="btn-primary">
            <FiPlus /> Yangi Diagramma
          </button>
        )}
      </div>

      <div className="patient-list">
        {filteredPatients.length === 0 ? (
          <p>Bemorlar topilmadi</p>
        ) : (
          filteredPatients.map(p => (
            <div
              key={p.id}
              className={`patient-card ${selectedPatient?.id === p.id ? 'selected' : ''}`}
              onClick={() => setSelectedPatient(p)}
            >
              <FiUser className="patient-icon" />
              <div className="patient-info">
                <h3>{p.name}</h3>
                <p>Telefon: {p.phone}</p>
                <p>Diagrammalar: {getPatientCharts().length} ta</p>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPatient && (
        <div className="chart-section">
          <div className="">
            <h2>{selectedPatient.name} uchun Tish Diagrammasi</h2>
            <button onClick={() => setSelectedPatient(null)} className="btn-secondary">Boshqa Bemor</button>
          </div>
          <div className="diagram-container">
            {renderToothDiagram()}
          </div>
          <h3>Davolash Tarixi</h3>
          {getPatientCharts().length === 0 ? (
            <div className="empty-state">
              <p>Hali diagrammalar yo‘q</p>
              <button onClick={() => openModal()} className="btn-primary">Yangi Diagramma Qo‘shish</button>
            </div>
          ) : (
            <table className="chart-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Jarayon</th>
                  <th>Tish</th>
                  <th>Izoh</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {getPatientCharts().map(c => (
                  <tr key={c.id}>
                    <td>{c.date}</td>
                    <td>{c.procedure}</td>
                    <td>{c.tooth}</td>
                    <td>{c.notes || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => openModal(c)} className="btn-edit" title="Tahrirlash">
                          <FiEdit />
                        </button>
                        <button onClick={() => deleteChart(c.id)} className="btn-delete" title="O‘chirish">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>{currentChart.id ? 'Diagrammani Tahrirlash' : 'Yangi Diagramma Qo‘shish'}</h2>
                <button type="button" onClick={closeModal} className="close-button">&times;</button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label>Sana</label>
                <input
                  type="date"
                  value={currentChart.date}
                  onChange={(e) => setCurrentChart({ ...currentChart, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Jarayon *</label>
                <input
                  type="text"
                  value={currentChart.procedure}
                  onChange={(e) => setCurrentChart({ ...currentChart, procedure: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tish Raqami *</label>
                <input
                  type="text"
                  value={currentChart.tooth}
                  onChange={(e) => setCurrentChart({ ...currentChart, tooth: e.target.value })}
                  placeholder="Masalan: 18"
                  required
                />
              </div>
              <div className="form-group">
                <label>Izoh</label>
                <textarea
                  value={currentChart.notes}
                  onChange={(e) => setCurrentChart({ ...currentChart, notes: e.target.value })}
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

export default Charting;