import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { 
  FiDownload, FiTrendingUp, FiUsers, FiCalendar, FiDollarSign, 
  FiArrowUp, FiArrowDown, FiSearch, FiX 
} from 'react-icons/fi';
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
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import './Reports.css';

const Reports = () => {
  const { appointments, patients, billings, darkMode } = useContext(AppContext);
  const [sortOrder, setSortOrder] = useState('desc');
  const [recentLimit, setRecentLimit] = useState(10);
  const [activeChart, setActiveChart] = useState('visits');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data validation
  const validPatients = Array.isArray(patients) ? patients : [];
  const validAppointments = Array.isArray(appointments) ? appointments : [];
  const validBillings = Array.isArray(billings) ? billings : [];

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Filter data by date range and search term
  const filteredAppointments = useMemo(() => {
    let filtered = validAppointments.filter(a => {
      if (!a.date) return false;
      const appDate = new Date(a.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return appDate >= start && appDate <= end;
    });

    if (searchTerm) {
      filtered = filtered.filter(a => {
        const patient = validPatients.find(p => String(p.id) === String(a.patientId));
        const patientName = patient ? patient.name : (a.patientName || '');
        return (
          patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.procedure || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  }, [validAppointments, validPatients, startDate, endDate, searchTerm]);

  const filteredBillings = useMemo(() => {
    return validBillings.filter(b => {
      if (!b.date) return false;
      const billDate = new Date(b.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return billDate >= start && billDate <= end;
    });
  }, [validBillings, startDate, endDate]);

  // Statistika
  const totalPatients = validPatients.length;
  const totalAppointments = filteredAppointments.length;
  const totalRevenue = filteredBillings.reduce((sum, bill) => sum + (bill.amount || bill.total || 0), 0);
  const avgRevenuePerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;

  // Dynamic trend calculations
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? '+∞%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getMonthlyData = (data, key) => {
    const monthly = {};
    data.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[monthKey] = (monthly[monthKey] || 0) + (key === 'count' ? 1 : (item[key] || 0));
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  };

  const appointmentsMonthly = getMonthlyData(filteredAppointments, 'count');
  const currentAppointments = appointmentsMonthly[appointmentsMonthly.length - 1] || 0;
  const previousAppointments = appointmentsMonthly[appointmentsMonthly.length - 2] || 0;
  const appointmentsTrend = calculateTrend(currentAppointments, previousAppointments);

  const revenueMonthly = getMonthlyData(filteredBillings, 'amount');
  const currentRevenue = revenueMonthly[revenueMonthly.length - 1] || 0;
  const previousRevenue = revenueMonthly[revenueMonthly.length - 2] || 0;
  const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

  // Oylik tashriflar
  const visitsByMonth = useMemo(() => {
    const acc = {};
    filteredAppointments.forEach(a => {
      if (!a.date || isNaN(new Date(a.date).getTime())) return;
      const d = new Date(a.date);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum.toString().padStart(2, '0');
      const key = `${year}-${monthStr}`;
      const displayMonth = d.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
      if (!acc[key]) {
        acc[key] = { month: displayMonth, count: 0, sortKey: parseInt(`${year}${monthStr}`) };
      }
      acc[key].count += 1;
    });
    return Object.values(acc).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredAppointments]);

  const chartData = visitsByMonth.map(item => ({ month: item.month, count: item.count }));

  // Oylik daromad
  const revenueByMonth = useMemo(() => {
    const acc = {};
    filteredBillings.forEach(b => {
      if (!b.date || isNaN(new Date(b.date).getTime())) return;
      const d = new Date(b.date);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum.toString().padStart(2, '0');
      const key = `${year}-${monthStr}`;
      const displayMonth = d.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
      if (!acc[key]) {
        acc[key] = { month: displayMonth, amount: 0, sortKey: parseInt(`${year}${monthStr}`) };
      }
      acc[key].amount += (b.amount || b.total || 0);
    });
    return Object.values(acc).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredBillings]);

  const revenueChartData = revenueByMonth.map(item => ({ month: item.month, amount: item.amount }));

  // Top procedures
  const proceduresByCount = useMemo(() => {
    return filteredAppointments.reduce((acc, a) => {
      const procedure = a.procedure || 'Nomaʼlum';
      acc[procedure] = (acc[procedure] || 0) + 1;
      return acc;
    }, {});
  }, [filteredAppointments]);

  const topProcedures = Object.entries(proceduresByCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Bemor bo'yicha tashriflar
  const visitsByPatient = useMemo(() => {
    return filteredAppointments.reduce((acc, a) => {
      const patient = validPatients.find(p => String(p.id) === String(a.patientId));
      const patientName = patient ? patient.name : (a.patientName || 'Nomaʼlum');
      acc[patientName] = (acc[patientName] || 0) + 1;
      return acc;
    }, {});
  }, [filteredAppointments, validPatients]);

  const patientTableData = Object.entries(visitsByPatient)
    .map(([name, count]) => ({
      name,
      visits: count,
    }))
    .sort((a, b) => (sortOrder === 'desc' ? b.visits - a.visits : a.visits - b.visits));

  // Eng faol bemor
  const topPatientVisits = Math.max(...patientTableData.map(p => p.visits), 0) || 1;

  // Status bo'yicha statistika
  const appointmentsByStatus = useMemo(() => {
    return filteredAppointments.reduce((acc, a) => {
      const status = a.status || 'Nomaʼlum';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [filteredAppointments]);

  const statusData = Object.entries(appointmentsByStatus).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // Ranglar palitrasi
  const COLORS = ['#5a67d8', '#2f855a', '#d69e2e', '#e53e3e', '#805ad5'];

  // Status class mapper
  const getStatusClass = (status) => {
    if (!status) return 'unknown';
    const statusMap = {
      'kutilmoqda': 'pending',
      'amalga oshirildi': 'confirmed',
      'bekor qilindi': 'cancelled',
      'nomaʼlum': 'unknown'
    };
    return statusMap[status.toLowerCase().replace(/\s+/g, '')] || 'unknown';
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  // Excel eksport
  const exportToExcel = () => {
    try {
      const appointmentData = filteredAppointments.map((a) => ({
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

      const billingData = filteredBillings.map((b) => ({
        ID: b.id,
        Bemor: validPatients.find((p) => String(p.id) === String(b.patientId))?.name || b.patientName || 'Nomaʼlum',
        Faktura: b.invoiceNumber || '-',
        Summa: (b.amount || b.total || 0).toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
        Status: b.status || '-',
        Sana: b.date ? new Date(b.date).toLocaleDateString('uz-UZ') : '-',
        Izoh: b.notes || '-',
      }));

      const proceduresData = topProcedures.map((proc) => ({
        Jarayon: proc.name,
        Soni: proc.count,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appointmentData), 'Uchrashuvlar');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientData), 'Bemor Tashriflari');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billingData), 'Hisob-kitoblar');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(proceduresData), 'Top Jarayonlar');

      const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
      XLSX.writeFile(wb, `hisobotlar${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMessage('Hisobotlar muvaffaqiyatli eksport qilindi!');
    } catch (error) {
      console.error('Eksportda xatolik:', error);
      setErrorMessage('Maʼlumotlarni eksport qilishda xatolik yuz berdi.');
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

  const recentAppointments = useMemo(() => {
    return filteredAppointments
      .filter(a => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, recentLimit);
  }, [filteredAppointments, recentLimit]);

  return (
    <div className={`reports ${darkMode ? 'dark-mode' : ''}`}>
      <div className="reports-header">
        <div className="header-content">
          <h1>
            <FiTrendingUp className="header-icon" />
            Hisobotlar va Analitika
          </h1>
          <p>Klinikangiz faoliyati bo'yicha to‘liq ma’lumot</p>
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

      {successMessage && <div className="success-alert">{successMessage}</div>}
      {errorMessage && <div className="error-alert">{errorMessage}</div>}

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="start-date">Boshlanish sanasi</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-date">Tugash sanasi</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group search-group">
          <label htmlFor="search-term">Qidiruv</label>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              id="search-term"
              type="text"
              placeholder="Bemor ismi yoki jarayon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <FiX onClick={() => setSearchTerm('')} className="clear-icon" />
            )}
          </div>
        </div>
        {(startDate || endDate || searchTerm) && (
          <button onClick={clearFilters} className="clear-filters-btn">
            <FiX /> Filtrlarni o‘chirish
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-report">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Jami bemorlar</h3>
            <p>{totalPatients.toLocaleString('uz-UZ')}</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon-report">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <h3>Uchrashuvlar</h3>
            <p>{totalAppointments.toLocaleString('uz-UZ')}</p>
            <span className={`stat-trend ${appointmentsTrend.includes('+') ? 'positive' : 'negative'}`}>
              {appointmentsTrend.includes('+') ? <FiArrowUp /> : <FiArrowDown />}
              {appointmentsTrend} (o‘tgan oy)
            </span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon-report">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>Jami daromad</h3>
            <p>{totalRevenue.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' })}</p>
            <span className={`stat-trend ${revenueTrend.includes('+') ? 'positive' : 'negative'}`}>
              {revenueTrend.includes('+') ? <FiArrowUp /> : <FiArrowDown />}
              {revenueTrend} (o‘tgan oy)
            </span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon-report">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>O‘rtacha daromad</h3>
            <p>{avgRevenuePerPatient.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' })}</p>
          </div>
        </div>
      </div>

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
              className={`chart-btn ${activeChart === 'status' ? 'active' : ''}`}
              onClick={() => setActiveChart('status')}
            >
              Statuslar
            </button>
            <button 
              className={`chart-btn ${activeChart === 'procedures' ? 'active' : ''}`}
              onClick={() => setActiveChart('procedures')}
            >
              Jarayonlar
            </button>
          </div>
        </div>

        <div className="charts-container">
          {activeChart === 'visits' && (
            <div className="chart-card">
              <h3>Oy bo‘yicha tashriflar</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#5a67d8" 
                      strokeWidth={2}
                      dot={{ fill: '#5a67d8', strokeWidth: 1, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Ma’lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          )}
          {activeChart === 'revenue' && (
            <div className="chart-card">
              <h3>Oy bo‘yicha daromad</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [
                        value.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
                        'Daromad'
                      ]}
                    />
                    <Bar dataKey="amount" fill="#2f855a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Ma’lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          )}
          {activeChart === 'status' && (
            <div className="chart-card">
              <h3>Uchrashuv statuslari</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name.slice(0, 10)}...: ${value}`}
                      outerRadius={100}
                      innerRadius={50}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Ma’lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          )}
          {activeChart === 'procedures' && (
            <div className="chart-card">
              <h3>Eng ko‘p jarayonlar</h3>
              {topProcedures.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProcedures}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#e53e3e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">
                  <p>Ma’lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="tables-grid">
        <div className="table-card">
          <div className="table-header">
            <h3>Bemorlar bo‘yicha tashriflar (Top 8)</h3>
            <button onClick={handleSortToggle} className="sort-btn">
              {sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />}
              {sortOrder === 'desc' ? 'Kamayish' : 'Oshish'}
            </button>
          </div>
          <div className="table-container">
            {patientTableData.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
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
                      </td>
                      <td>{patient.name}</td>
                      <td>{patient.visits}</td>
                      <td>
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill"
                            style={{ width: topPatientVisits > 0 ? `${(patient.visits / topPatientVisits) * 100}%` : '0%' }}
                          ></div>
                          <span>{totalAppointments > 0 ? ((patient.visits / totalAppointments) * 100).toFixed(1) + '%' : '0%'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Ma’lumotlar mavjud emas</p>
              </div>
            )}
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>Oxirgi uchrashuvlar</h3>
            <div className="limit-control">
              <label>Ko‘rsatish: </label>
              <select value={recentLimit} onChange={handleLimitChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            {recentAppointments.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Bemor</th>
                    <th>Sana va vaqt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appointment) => (
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
                        <span className={`status-badge status-${getStatusClass(appointment.status)}`}>
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

      <div className="export-section">
        <button onClick={exportToExcel} className="export-btn">
          <FiDownload /> Excel’ga eksport
        </button>
      </div>
    </div>
  );
};

export default Reports;