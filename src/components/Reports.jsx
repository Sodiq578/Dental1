import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { FiDownload, FiTrendingUp, FiUsers, FiCalendar, FiDollarSign, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import './Reports.css';

const Reports = () => {
  const { appointments, patients, billings, darkMode } = useContext(AppContext);
  const [sortOrder, setSortOrder] = useState('desc');
  const [recentLimit, setRecentLimit] = useState(10);
  const [activeChart, setActiveChart] = useState('visits'); // 'visits', 'revenue', 'patients'

  // Data validation
  const validPatients = Array.isArray(patients) ? patients : [];
  const validAppointments = Array.isArray(appointments) ? appointments : [];
  const validBillings = Array.isArray(billings) ? billings : [];

  // === Statistika ===
  const totalPatients = validPatients.length;
  const totalAppointments = validAppointments.length;
  const totalRevenue = validBillings.reduce((sum, bill) => sum + (bill.amount || bill.total || 0), 0);
  const avgRevenuePerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;

  // Oylik tashriflar
  const visitsByMonth = useMemo(() => {
    return validAppointments.reduce((acc, a) => {
      if (!a.date || isNaN(new Date(a.date).getTime())) return acc;
      const month = new Date(a.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }, [validAppointments]);

  const chartData = Object.entries(visitsByMonth)
    .map(([month, count]) => ({
      month,
      count,
      date: new Date(month + ' 1, 2023'),
    }))
    .sort((a, b) => a.date - b.date)
    .map(({ month, count }) => ({ month, count }));

  // Oylik daromad
  const revenueByMonth = useMemo(() => {
    return validBillings.reduce((acc, b) => {
      if (!b.date || isNaN(new Date(b.date).getTime())) return acc;
      const month = new Date(b.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (b.amount || b.total || 0);
      return acc;
    }, {});
  }, [validBillings]);

  const revenueChartData = Object.entries(revenueByMonth)
    .map(([month, amount]) => ({
      month,
      amount,
      date: new Date(month + ' 1, 2023'),
    }))
    .sort((a, b) => a.date - b.date)
    .map(({ month, amount }) => ({ month, amount }));

  // Bemor bo'yicha tashriflar
  const visitsByPatient = useMemo(() => {
    return validAppointments.reduce((acc, a) => {
      const patient = validPatients.find(p => String(p.id) === String(a.patientId));
      const patientName = patient ? patient.name : (a.patientName || 'Nomaʼlum');
      acc[patientName] = (acc[patientName] || 0) + 1;
      return acc;
    }, {});
  }, [validAppointments, validPatients]);

  const patientTableData = Object.entries(visitsByPatient)
    .map(([name, count]) => ({
      name,
      visits: count,
    }))
    .sort((a, b) => (sortOrder === 'desc' ? b.visits - a.visits : a.visits - a.visits));

  // Eng faol bemor
  const topPatient = patientTableData[0]?.name || 'Maʼlumot yoʻq';
  const topPatientVisits = patientTableData[0]?.visits || 0;

  // Status bo'yicha statistika
  const appointmentsByStatus = useMemo(() => {
    return validAppointments.reduce((acc, a) => {
      const status = a.status || 'Nomaʼlum';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [validAppointments]);

  const statusData = Object.entries(appointmentsByStatus).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // Ranglar palitrasi
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Excel eksport
  const exportToExcel = () => {
    try {
      const appointmentData = validAppointments.map((a) => ({
        ID: a.id,
        Bemor: validPatients.find((p) => String(p.id) === String(a.patientId))?.name || a.patientName || 'Nomaʼlum',
        Telefon: validPatients.find((p) => String(p.id) === String(a.patientId))?.phone || '-',
        Sana: a.date ? new Date(a.date).toLocaleDateString('uz-UZ') : '-',
        Vaqt: a.time || '-',
        Jarayon: a.procedure || '-',
        Status: a.status || '-',
        Izoh: a.notes || '-',
      }));

      const patientData = patientTableData.map((p) => ({
        Bemor: p.name,
        Tashriflar: p.visits.toLocaleString('uz-UZ'),
      }));

      const billingData = validBillings.map((b) => ({
        ID: b.id,
        Bemor: validPatients.find((p) => String(p.id) === String(b.patientId))?.name || b.patientName || 'Nomaʼlum',
        Faktura: b.invoiceNumber || '-',
        Summa: (b.amount || b.total || 0).toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
        Status: b.status || '-',
        Sana: b.date ? new Date(b.date).toLocaleDateString('uz-UZ') : '-',
        Izoh: b.notes || '-',
      }));

      const wsAppointments = XLSX.utils.json_to_sheet(appointmentData);
      const wsPatients = XLSX.utils.json_to_sheet(patientData);
      const wsBillings = XLSX.utils.json_to_sheet(billingData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsAppointments, 'Uchrashuvlar');
      XLSX.utils.book_append_sheet(wb, wsPatients, 'Bemor Tashriflari');
      XLSX.utils.book_append_sheet(wb, wsBillings, 'Hisob-kitoblar');

      XLSX.writeFile(wb, `hisobotlar_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Eksportda xatolik:', error);
      alert('Maʼlumotlarni eksport qilishda xatolik yuz berdi.');
    }
  };

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleLimitChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setRecentLimit(value);
    }
  };

  return (
    <div className={`reports ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sarlavha */}
      <div className="reports-header">
        <div className="header-content">
          <h1>
            <FiTrendingUp className="header-icon" />
            Hisobotlar va Analitika
          </h1>
          <p>Klinikangiz faoliyati bo'yicha batafsil statistika</p>
        </div>
        <div className="header-stats">
          <span className="stat-badge">
            <FiCalendar /> {totalAppointments.toLocaleString('uz-UZ')} uchrashuv
          </span>
          <span className="stat-badge">
            <FiUsers /> {totalPatients.toLocaleString('uz-UZ')} bemor
          </span>
        </div>
      </div>

      {/* Asosiy statistikalar */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-report">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Umumiy Bemorlar</h3>
            <p>{totalPatients.toLocaleString('uz-UZ')}</p>
            <span className="stat-trend">
              <FiArrowUp /> +12% o'tgan oyga nisbatan
            </span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-report">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <h3>Uchrashuvlar</h3>
            <p>{totalAppointments.toLocaleString('uz-UZ')}</p>
            <span className="stat-trend">
              <FiArrowUp /> +8% o'tgan oyga nisbatan
            </span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-report">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>Umumiy Daromad</h3>
            <p>{totalRevenue.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' })}</p>
            <span className="stat-trend">
              <FiArrowUp /> +15% o'tgan oyga nisbatan
            </span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-report">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>O'rtacha Daromad</h3>
            <p>{avgRevenuePerPatient.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' })}</p>
            <span className="stat-trend">
              <FiArrowUp /> +5% o'tgan oyga nisbatan
            </span>
          </div>
        </div>
      </div>

      {/* Grafiklar bo'limi */}
      <div className="charts-section">
        <div className="section-header">
          <h2>Analitika va Trendlar</h2>
          <div className="chart-controls">
            <button 
              className={`chart-btn ${activeChart === 'visits' ? 'active' : ''}`}
              onClick={() => setActiveChart('visits')}
            >
              Tashriflar
            </button>
            <button 
              className={`chart-btn ${activeChart === 'revenue' ? 'active' : ''}`}
              onClick={() => setActiveChart('revenue')}
            >
              Daromad
            </button>
            <button 
              className={`chart-btn ${activeChart === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveChart('patients')}
            >
              Statuslar
            </button>
          </div>
        </div>

        <div className="charts-container">
          {activeChart === 'visits' && (
            <div className="chart-card">
              <h3>Oy bo'yicha Tashriflar</h3>
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
                      strokeWidth={3}
                      dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Maʼlumot yoʻq</p>
                </div>
              )}
            </div>
          )}

          {activeChart === 'revenue' && (
            <div className="chart-card">
              <h3>Oy bo'yicha Daromad</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [
                        value.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
                        'Daromad'
                      ]}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Maʼlumot yoʻq</p>
                </div>
              )}
            </div>
          )}

          {activeChart === 'patients' && (
            <div className="chart-card">
              <h3>Uchrashuv Statuslari</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Maʼlumot yoʻq</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jadval bo'limlari */}
      <div className="tables-grid">
        {/* Bemorlar tashriflari */}
        <div className="table-card">
          <div className="table-header">
            <h3>Bemorlar bo'yicha Tashriflar</h3>
            <button onClick={handleSortToggle} className="sort-btn">
              {sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />}
              {sortOrder === 'desc' ? 'Kamayish' : 'Osish'}
            </button>
          </div>
          <div className="table-container">
            {patientTableData.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Bemor</th>
                    <th>Tashriflar</th>
                    <th>Foiz</th>
                  </tr>
                </thead>
                <tbody>
                  {patientTableData.slice(0, 8).map((patient, index) => (
                    <tr key={patient.name}>
                      <td>
                        <span className="patient-rank">{index + 1}</span>
                        {patient.name}
                      </td>
                      <td>{patient.visits}</td>
                      <td>
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill"
                            style={{ 
                              width: `${(patient.visits / topPatientVisits) * 100}%` 
                            }}
                          ></div>
                          <span>{((patient.visits / totalAppointments) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Maʼlumot yoʻq</p>
              </div>
            )}
          </div>
        </div>

        {/* So'nggi uchrashuvlar */}
        <div className="table-card">
          <div className="table-header">
            <h3>So'nggi Uchrashuvlar</h3>
            <div className="limit-control">
              <label>Ko'rsatish: </label>
              <select value={recentLimit} onChange={handleLimitChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            {validAppointments.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Bemor</th>
                    <th>Sana</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validAppointments
                    .slice(-recentLimit)
                    .reverse()
                    .map((appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          {validPatients.find((p) => String(p.id) === String(appointment.patientId))?.name ||
                            appointment.patientName || 'Nomaʼlum'}
                        </td>
                        <td>
                          {appointment.date ? new Date(appointment.date).toLocaleDateString('uz-UZ') : '-'}
                          <br />
                          <small>{appointment.time || '-'}</small>
                        </td>
                        <td>
                          <span className={`status-badge status-${appointment.status?.toLowerCase() || 'unknown'}`}>
                            {appointment.status || 'Nomaʼlum'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Uchrashuvlar mavjud emas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eksport tugmasi */}
      <div className="export-section">
        <button onClick={exportToExcel} className="export-btn">
          <FiDownload />
          Excelga Yuklab Olish
        </button>
      </div>
    </div>
  );
};

export default Reports;