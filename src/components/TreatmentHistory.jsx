
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { FiSearch, FiUser, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import './TreatmentHistory.css';

const TreatmentHistory = () => {
  const { patients, appointments } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('excel');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validPatients = Array.isArray(patients) ? patients : [];
  const validAppointments = Array.isArray(appointments) ? appointments : [];

  const filteredPatients = useMemo(() => {
    return validPatients.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );
  }, [validPatients, searchTerm]);

  const getPatientHistory = useMemo(() => {
    return (patientId) =>
      validAppointments
        .filter(a => a.patientId === patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [validAppointments]);

  const getPatientName = (patientId) => {
    const p = validPatients.find(p => p.id === patientId);
    return p ? p.name : 'Noma’lum';
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const performExport = async () => {
    try {
      if (selectedExportFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(validAppointments.map(a => ({
          ID: a.id,
          Bemor: getPatientName(a.patientId),
          Telefon: validPatients.find(p => p.id === a.patientId)?.phone || '-',
          Sana: a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-',
          Vaqt: a.time || '-',
          Jarayon: a.procedure || '-',
          Status: a.status || '-',
          Izoh: a.notes || '-'
        })));
        ws['!cols'] = [
          { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Davolash Tarixi");
        XLSX.writeFile(wb, "davolash_tarixi.xlsx");
      } else if (selectedExportFormat === 'word') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: validAppointments.flatMap(a => [
              new Paragraph({ children: [new TextRun({ text: `ID: ${a.id}`, bold: true })] }),
              new Paragraph({ children: [new TextRun(`Bemor: ${getPatientName(a.patientId)}`)] }),
              new Paragraph({ children: [new TextRun(`Telefon: ${validPatients.find(p => p.id === a.patientId)?.phone || '-'}`)] }),
              new Paragraph({ children: [new TextRun(`Sana: ${a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-'}`)] }),
              new Paragraph({ children: [new TextRun(`Vaqt: ${a.time || '-'}`)] }),
              new Paragraph({ children: [new TextRun(`Jarayon: ${a.procedure || '-'}`)] }),
              new Paragraph({ children: [new TextRun(`Status: ${a.status || '-'}`)] }),
              new Paragraph({ children: [new TextRun(`Izoh: ${a.notes || '-'}`)] }),
              new Paragraph({ children: [new TextRun("-----------------------------")] })
            ])
          }]
        });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'davolash_tarixi.docx';
        a.click();
        URL.revokeObjectURL(url);
      }
      setSuccessMessage('Ma\'lumotlar muvaffaqiyatli eksport qilindi');
      setTimeout(() => {
        setSuccessMessage('');
        setExportModalOpen(false);
      }, 3000);
    } catch (err) {
      setErrorMessage('Eksportda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const closeModal = () => {
    setExportModalOpen(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <div className="treatment-history">
      <div className="page-header">
        <h1>Davolash Tarixi</h1>
        <span className="badge">{validAppointments.length} ta yozuv</span>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

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
        <div className="action-buttons-group">
          <button onClick={handleExport} className="btn-secondary" title="Eksport qilish">
            <FiDownload /> Eksport
          </button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <h3>Hech narsa topilmadi</h3>
          <p>"{searchTerm}" boʻyicha bemor topilmadi</p>
          <button onClick={() => setSearchTerm('')} className="btn-secondary">
            Filterni tozalash
          </button>
        </div>
      ) : (
        <div className="patient-list">
          {filteredPatients.map(p => (
            <div
              key={p.id}
              className={`patient-card ${selectedPatientId === p.id ? 'selected' : ''}`}
              onClick={() => setSelectedPatientId(p.id)}
            >
              <FiUser className="patient-icon" />
              <div className="patient-info">
                <h3>{p.name || 'Noma\'lum'}</h3>
                <p>Telefon: {p.phone || '-'}</p>
                <p>Uchrashuvlar: {getPatientHistory(p.id).length} ta</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPatientId && (
        <div className="history-modal">
          <div className="modal-header">
            <h2>{getPatientName(selectedPatientId)} ning Davolash Tarixi</h2>
            <button onClick={() => setSelectedPatientId(null)} className="close-button">
              &times;
            </button>
          </div>
          {getPatientHistory(selectedPatientId).length === 0 ? (
            <p className="no-history">Hali davolash tarixi yo'q</p>
          ) : (
            <div className="table-container">
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
                      <td>{a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-'}</td>
                      <td>{a.time || '-'}</td>
                      <td>{a.procedure || '-'}</td>
                      <td>{a.status || '-'}</td>
                      <td>{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {exportModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eksport formatini tanlang</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="form-group">
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="word">Word (.docx)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={performExport} className="btn-primary">
                Eksport qilish
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;
