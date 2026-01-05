import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import styles from "./ElectronicCard.module.css";

const ElectronicCard = () => {
  const cardRef = useRef(null);

  const exportPDF = async () => {
    const canvas = await html2canvas(cardRef.current, {
      scale: 2, // sifatni oshirish
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("elektron-karta.pdf");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Elektron Karta</h1>

      <div ref={cardRef} className={styles.card}>
        <h2 className={styles.cardTitle}>Bemor: Ali Valiev</h2>

        <p className={styles.cardText}>ID: PAT-12345</p>
        <p className={styles.cardText}>Tug‘ilgan sana: 1990-05-15</p>
        <p className={styles.cardText}>Davolash tarixi: ...</p>
        <p className={styles.cardText}>Allergiya: Penitsillin</p>
      </div>

      <div className="flex justify-center">
        <button onClick={exportPDF} className={styles.downloadBtn}>
          PDF yuklab olish
        </button>
      </div>
    </div>
  );
};

export default ElectronicCard;
