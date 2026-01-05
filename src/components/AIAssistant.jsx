import React, { useState } from "react";
import styles from "./AIAssistant.css";

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    // User xabari
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);

    // Mock AI javobi
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text:
            "Tashxis tavsiyasi: Bu belgilarga ko‘ra gripp bo‘lishi mumkin. Iltimos, shifokorga murojaat qiling.",
            
          sender: "ai",
        },
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI Yordamchi</h1>

      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              msg.sender === "user"
                ? styles.userMessage
                : styles.aiMessage
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className={styles.inputContainer}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Belgilaringizni kiriting..."
        />
        <button onClick={sendMessage} className={styles.sendBtn}>
          Yuborish
        </button>
      </div>

      <p className={styles.warning}>
        * Bu faqat tavsiya. Professional shifokor maslahati o‘rnini bosa olmaydi.
      </p>
    </div>
  );
};

export default AIAssistant;
