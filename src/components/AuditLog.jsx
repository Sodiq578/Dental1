import React from "react";

const AuditLog = () => {
  const logs = [
    { id: 1, user: "Admin", action: "Bemor ma'lumotlari o'zgartirildi", time: "2025-01-03 14:30" },
    { id: 2, user: "Dr. Ali", action: "Yangi uchrashuv qo'shildi", time: "2025-01-03 12:15" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <ul className="space-y-4">
        {logs.map((log) => (
          <li key={log.id} className="border p-4 rounded shadow">
            <strong>{log.user}</strong> — {log.action}
            <br />
            <small>{log.time}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditLog;