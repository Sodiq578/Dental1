import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { FiDownload } from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";
import * as XLSX from 'xlsx';
import './Reports.css';

const Reports = () => {
  const { appointments, patients } = useContext(AppContext);
  const [sortOrder, setSortOrder] = useState('desc'); // Jadvalni tartiblash uchun holat

  // Data validation
  const validPatients = Array.isArray(patients) ? patients : [];
  const validAppointments = Array.isArray(appointments) ? appointments : [];

  // === Statistika ===
  const totalPatients = validPatients.length;
  const totalAppointments = validAppointments.length;

  // Oylik tashriflar
  const visitsByMonth = useMemo(() => {
    return validAppointments.reduce((acc, a) => {
      if (!a.date) return acc;
      const month = new Date(a.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }, [validAppointments]);

  const chartData = Object.entries(visitsByMonth).map(([month, count]) => ({
    month,
    count
  }));

  // Bemor bo'yicha tashriflar soni
  const visitsByPatient = useMemo(() => {
    return validAppointments.reduce((acc, a) => {
      const patient = validPatients.find(p => p.id === a.patientId);
      const patientName = patient ? patient.name : 'Nomaʼlum';
      acc[patientName] = (acc[patientName] || 0) + 1;
      return acc;
    }, {});
  }, [validAppointments, validPatients]);

  // Tartiblangan jadval ma'lumotlari
  const patientTableData = Object.entries(visitsByPatient)
    .map(([name, count]) => ({
      name,
      visits: count
    }))
    .sort((a, b) => sortOrder === 'desc' ? b.visits - a.visits : a.visits - b.visits);

  // Eng faol bemor
  const topPatient = patientTableData[0]?.name || 'Maʼlumot yoʻq';
  const topPatientVisits = patientTableData[0]?.visits || 0;

  // === Excel Export ===
  const exportToExcel = () => {
    try {
      // Prepare appointment data
      const appointmentData = validAppointments.map((a) => ({
        ID: a.id,
        Bemor: validPatients.find((p) => p.id === a.patientId)?.name || 'Nomaʼlum',
        Telefon: validPatients.find((p) => p.id === a.patientId)?.phone || '-',
        Sana: a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-',
        Vaqt: a.time || '-',
        Jarayon: a.procedure || '-',
        Status: a.status || '-',
        Izoh: a.notes || '-'
      }));

      // Prepare patient visit summary
      const patientData = patientTableData.map((p) => ({
        Bemor: p.name,
        Tashriflar: p.visits.toLocaleString('uz-UZ') // Raqamlarni formatlash
      }));

      // Create worksheets
      const wsAppointments = XLSX.utils.json_to_sheet(appointmentData);
      const wsPatients = XLSX.utils.json_to_sheet(patientData);

      // Define column widths
      wsAppointments['!cols'] = [
        { wch: 10 }, // ID
        { wch: 20 }, // Bemor
        { wch: 15 }, // Telefon
        { wch: 15 }, // Sana
        { wch: 10 }, // Vaqt
        { wch: 25 }, // Jarayon
        { wch: 15 }, // Status
        { wch: 30 }  // Izoh
      ];
      wsPatients['!cols'] = [
        { wch: 20 }, // Bemor
        { wch: 15 }  // Tashriflar
      ];

      // Apply styles
      [wsAppointments, wsPatients].forEach((ws) => {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = { c: C, r: R };
            const cellRef = XLSX.utils.encode_cell(cellAddress);

            if (!ws[cellRef]) continue;

            ws[cellRef].s = {
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              },
              alignment: { vertical: 'center', horizontal: 'left' }
            };

            if (R === 0) {
              ws[cellRef].s.font = { bold: true };
              ws[cellRef].s.fill = { fgColor: { rgb: 'D3D3D3' } };
            } else {
              ws[cellRef].s.fill = {
                fgColor: { rgb: R % 2 === 0 ? 'F5F5F5' : 'FFFFFF' }
              };
            }
          }
        }
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsAppointments, 'Uchrashuvlar');
      XLSX.utils.book_append_sheet(wb, wsPatients, 'Bemor Tashriflari');

      // Trigger download
      XLSX.writeFile(wb, 'hisobotlar.xlsx');
    } catch (error) {
      console.error('Eksportda xatolik:', error);
      alert('Maʼlumotlarni eksport qilishda xatolik yuz berdi.');
    }
  };

  // Tartiblash funksiyasi
  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Hisobotlar</h1>
        <span className="badge">{totalAppointments.toLocaleString('uz-UZ')} ta uchrashuv</span>
      </div>

      {/* Statistikalar */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Umumiy bemorlar</h3>
          <p>{totalPatients.toLocaleString('uz-UZ')}</p>
        </div>
        <div className="stat-card">
          <h3>Umumiy uchrashuvlar</h3>
          <p>{totalAppointments.toLocaleString('uz-UZ')}</p>
        </div>
        <div className="stat-card">
          <h3>Oylik tashriflar</h3>
          <p>{Object.values(visitsByMonth).reduce((sum, count) => sum + count, 0).toLocaleString('uz-UZ')}</p>
        </div>
        <div className="stat-card">
          <h3>Eng faol bemor</h3>
          <p>{topPatient} ({topPatientVisits.toLocaleString('uz-UZ')} tashrif)</p>
        </div>
      </div>

      {/* Grafik */}
      <div className="chart-section">
        <h2>Oy bo‘yicha tashriflar</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                fill="rgba(37, 99, 235, 0.2)"
              >
                <LabelList dataKey="count" position="top" /> {/* Raqamlarni grafikda ko‘rsatish */}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-data">Grafik maʼlumotlari mavjud emas</p>
        )}
      </div>

      {/* Bemor bo'yicha tashriflar jadvali */}
      <div className="table-section">
        <h2>Bemor bo‘yicha tashriflar</h2>
        <button onClick={handleSortToggle} className="btn-sort">
          Tartiblash: {sortOrder === 'desc' ? 'Yuqoridan pastga' : 'Pastdan yuqoriga'}
        </button>
        {patientTableData.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Tashriflar soni</th>
              </tr>
            </thead>
            <tbody>
              {patientTableData.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.visits.toLocaleString('uz-UZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Bemor tashriflari mavjud emas</p>
        )}
      </div>

      {/* So‘nggi uchrashuvlar jadvali */}
      <div className="table-section">
        <h2>So‘nggi uchrashuvlar</h2>
        {validAppointments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana</th>
                <th>Vaqt</th>
                <th>Jarayon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {validAppointments.slice(-10).reverse().map((a) => (
                <tr key={a.id}>
                  <td>{validPatients.find((p) => p.id === a.patientId)?.name || 'Nomaʼlum'}</td>
                  <td>{a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-'}</td>
                  <td>{a.time || '-'}</td>
                  <td>{a.procedure || '-'}</td>
                  <td>{a.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Hali uchrashuvlar mavjud emas</p>
        )}
      </div>

      {/* Export tugmasi */}
      <div className="export-buttons">
        <button onClick={exportToExcel} className="btn-primary">
          <FiDownload /> Excelga eksport
        </button>
      </div>
    </div>
  );
};

export default Reports;