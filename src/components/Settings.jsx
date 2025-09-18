import React, { useState } from 'react';
import { getFromLocalStorage, saveToLocalStorage } from '../utils.js';
import './Settings.css';

const Settings = () => {
  const [user, setUser] = useState(
    getFromLocalStorage('user', { 
      name: '', 
      email: '', 
      phone: '', 
      specialty: '', 
      bio: '' 
    })
  );
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToLocalStorage('user', user);
    setMessage('Maʼlumotlar saqlandi ✅');

    setTimeout(() => setMessage(''), 3000); // 3 soniyadan keyin xabar yo‘qoladi
  };

  return (
    <div className="settings">
      <h1>⚙️ Sozlamalar</h1>
      <form onSubmit={handleSubmit} className="settings-form">
        <h2>👤 Foydalanuvchi profili</h2>

        <input 
          type="text"
          name="name" 
          placeholder="Ism" 
          value={user.name} 
          onChange={handleChange} 
          required
        />

        <input 
          type="email"
          name="email" 
          placeholder="Email" 
          value={user.email} 
          onChange={handleChange} 
        />

        <input 
          type="tel"
          name="phone" 
          placeholder="Telefon" 
          value={user.phone} 
          onChange={handleChange} 
        />

        <input 
          type="text"
          name="specialty" 
          placeholder="Mutaxassislik (masalan: stomatolog)" 
          value={user.specialty} 
          onChange={handleChange} 
        />

        <textarea 
          name="bio" 
          placeholder="O‘zingiz haqingizda qisqacha yozing..." 
          value={user.bio} 
          onChange={handleChange} 
        />

        <button type="submit" className="save-btn">💾 Saqlash</button>

        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default Settings;
