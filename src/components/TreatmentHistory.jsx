import React, { useState, useContext } from 'react';
import { FiSearch, FiUser } from 'react-icons/fi';
import { AppContext } from '../App';
import './TreatmentHistory.css'; // Yangi CSS fayl qo'shing (quyida taklif)

const TreatmentHistory = () => {
  const { patients, appointments } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const getPatientHistory = (patientId) => {
    return appointments
      .filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Eng yangi birinchi
  };

  const getPatientName = (id) => {
    const p = patients.find(p => p.id === id);
    return p ? p.name : 'Noma’lum';
  };

  return (
    <div className="treatment-history">
      <div className="page-header">
        <h1>Davolash Tarixi</h1>
        <span className="badge">{appointments.length} ta yozuv</span>
      </div>

      <div className="actions">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Bemor ism yoki telefon boʻyicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <h3>Hech narsa topilmadi</h3>
          <p>Qidiruv boʻyicha bemor topilmadi</p>
        </div>
      ) : (
        <div className="patient-list">
          {filteredPatients.map(p => (
            <div key={p.id} className="patient-card" onClick={() => setSelectedPatientId(p.id)}>
              <FiUser className="patient-icon" />
              <div className="patient-info">
                <h3>{p.name}</h3>
                <p>Telefon: {p.phone}</p>
                <p>Uchrashuvlar: {getPatientHistory(p.id).length} ta</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPatientId && (
        <div className="history-modal">
          <h2>{getPatientName(selectedPatientId)} ning Davolash Tarixi</h2>
          <button onClick={() => setSelectedPatientId(null)}>Yopish</button>
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Vaqt</th>
                <th>Jarayon</th>
                <th>Status</th>
                <th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {getPatientHistory(selectedPatientId).map(a => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.procedure}</td>
                  <td>{a.status}</td>
                  <td>{a.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {getPatientHistory(selectedPatientId).length === 0 && <p>Hali davolash tarixi yo'q</p>}
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;