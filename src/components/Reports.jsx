import React, { useContext } from 'react';
import { AppContext } from '../App';
import { FiDownload } from 'react-icons/fi';
import './Reports.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Reports = () => {
  const { appointments, patients } = useContext(AppContext); // Global state

  // === Statistika ===
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;

  // Oylik tashriflar
  const visitsByMonth = appointments.reduce((acc, a) => {
    const month = new Date(a.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(visitsByMonth).map(([month, count]) => ({
    month,
    count
  }));

  // === CSV Export ===
  const exportCSV = () => {
    const csvContent =
      'ID,Bemor,Sana,Vaqt,Jarayon\n' +
      appointments
        .map(
          (a) =>
            `${a.id},${patients.find((p) => p.id === a.patientId)?.name || ''},${a.date},${a.time},${a.procedure}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'uchrashuvlar_hisoboti.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // === JSON Export ===
  const exportJSON = () => {
    const data = appointments.map((a) => ({
      ...a,
      patient: patients.find((p) => p.id === a.patientId)?.name || '',
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'uchrashuvlar_hisoboti.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports">
      <h1>Hisobotlar</h1>

      {/* Statistikalar */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Umumiy bemorlar</h3>
          <p>{totalPatients}</p>
        </div>
        <div className="stat-card">
          <h3>Umumiy uchrashuvlar</h3>
          <p>{totalAppointments}</p>
        </div>
        <div className="stat-card">
          <h3>Oylik tashriflar</h3>
          <p>{appointments.length}</p>
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
                stroke="#4f46e5"
                strokeWidth={2}
                fill="rgba(79, 70, 229, 0.2)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Grafik maʼlumotlari mavjud emas</p>
        )}
      </div>

      {/* So‘nggi uchrashuvlar jadvali */}
      <div className="table-section">
        <h2>So‘nggi uchrashuvlar</h2>
        {appointments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Sana</th>
                <th>Vaqt</th>
                <th>Jarayon</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(-10).reverse().map((a) => (
                <tr key={a.id}>
                  <td>{patients.find((p) => p.id === a.patientId)?.name || 'Nomaʼlum'}</td>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td>{a.time}</td>
                  <td>{a.procedure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Hali uchrashuvlar mavjud emas</p>
        )}
      </div>

      {/* Export tugmalari */}
      <div className="export-buttons">
        <button onClick={exportCSV} className="export-btn">
          <FiDownload /> CSV ga eksport
        </button>
        <button onClick={exportJSON} className="export-btn">
          <FiDownload /> JSON ga eksport
        </button>
      </div>
    </div>
  );
};

export default Reports;