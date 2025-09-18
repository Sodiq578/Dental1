import React, { useState, useContext } from 'react';
import { FiSearch, FiUser, FiCalendar } from 'react-icons/fi';
import { AppContext } from '../App';
import './PatientPortal.css';

const PatientPortal = () => {
  const { patients, appointments, billings } = useContext(AppContext);
  const [patientId, setPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSearch = () => {
    const patient = patients.find(p => p.id === parseInt(patientId));
    setSelectedPatient(patient || null);
  };

  const getPatientAppointments = () => {
    return appointments.filter(a => a.patientId === selectedPatient?.id);
  };

  const getPatientBills = () => {
    return billings.filter(b => b.patientId === selectedPatient?.id);
  };

  return (
    <div className="patient-portal">
      <div className="page-header">
        <h1>Bemor Portali</h1>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Bemor ID sini kiriting..."
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="btn-primary">Qidirish</button>
      </div>

      {selectedPatient ? (
        <div className="patient-details">
          <h2>{selectedPatient.name} uchun Ma'lumotlar</h2>
          <div className="detail-card">
            <FiUser />
            <div>
              <strong>Ism:</strong> {selectedPatient.name}
            </div>
            <div>
              <strong>Telefon:</strong> {selectedPatient.phone || '-'}
            </div>
            <div>
              <strong>Manzil:</strong> {selectedPatient.address || '-'}
            </div>
          </div>

          <h3>Uchrashuvlar</h3>
          {getPatientAppointments().length === 0 ? (
            <p>Hali uchrashuvlar yo‘q</p>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Vaqt</th>
                  <th>Jarayon</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {getPatientAppointments().map(a => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>{a.procedure}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>To‘lovlar</h3>
          {getPatientBills().length === 0 ? (
            <p>Hali to‘lovlar yo‘q</p>
          ) : (
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Faktura Raqami</th>
                  <th>Summa</th>
                  <th>Status</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {getPatientBills().map(b => (
                  <tr key={b.id}>
                    <td>{b.invoiceNumber}</td>
                    <td>{b.amount} UZS</td>
                    <td>{b.status === 'paid' ? 'To‘langan' : 'To‘lanmagan'}</td>
                    <td>{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Bemor tanlanmadi</h3>
          <p>Iltimos, bemor ID sini kiriting va qidirish tugmasini bosing</p>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;