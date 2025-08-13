import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FinancialReportPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une date de début et une date de fin.");
      return;
    }
    setLoading(true);
    setReport(null);

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('date', '>=', new Date(startDate)),
        where('date', '<=', new Date(endDate))
      );

      const querySnapshot = await getDocs(q);
      let totalCosts = 0;
      let totalRevenues = 0;
      const transactionsData = [];

      querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        transactionsData.push({
          date: transaction.date.toDate().toLocaleDateString(),
          description: transaction.description,
          type: transaction.type === 'cost' ? 'Coût' : 'Revenu',
          amount: transaction.amount.toFixed(2) + '€'
        });
        if (transaction.type === 'cost') {
          totalCosts += transaction.amount;
        } else if (transaction.type === 'revenue') {
          totalRevenues += transaction.amount;
        }
      });

      setTransactions(transactionsData);
      setReport({
        totalCosts,
        totalRevenues,
        balance: totalRevenues - totalCosts
      });

    } catch (error) {
      console.error("Erreur lors de la génération du rapport: ", error);
      alert("Une erreur est survenue. Il est possible qu'un index Firestore soit manquant. Vérifiez la console du navigateur (F12) pour un lien permettant de le créer automatiquement.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport Financier", 14, 16);
    doc.setFontSize(12);
    doc.text(`Période du ${startDate} au ${endDate}`, 14, 22);

    doc.autoTable({
      startY: 30,
      head: [['Date', 'Description', 'Type', 'Montant']],
      body: transactions.map(t => [t.date, t.description, t.type, t.amount]),
      footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
      foot: [
        ['', '', 'Total Revenus', `${report.totalRevenues.toFixed(2)}€`],
        ['', '', 'Total Coûts', `${report.totalCosts.toFixed(2)}€`],
        ['', '', 'Bilan', `${report.balance.toFixed(2)}€`],
      ]
    });

    doc.save(`rapport_financier_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="card">
      <h1>Rapport Financier</h1>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <label>Date de début: </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>Date de fin: </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={generateReport} disabled={loading}>
          {loading ? 'Génération...' : 'Générer le rapport'}
        </button>
      </div>

      {report && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>Bilan pour la période sélectionnée</h2>
            <button onClick={handleExportPDF}>Exporter en PDF</button>
          </div>
          <p><strong>Total des Revenus:</strong> <span style={{color: 'green'}}>{report.totalRevenues.toFixed(2)}€</span></p>
          <p><strong>Total des Coûts:</strong> <span style={{color: 'red'}}>{report.totalCosts.toFixed(2)}€</span></p>
          <hr />
          <p><strong>Bilan:</strong> <strong style={{color: report.balance >= 0 ? 'green' : 'red'}}>{report.balance.toFixed(2)}€</strong></p>
        </div>
      )}
    </div>
  );
};

export default FinancialReportPage;
