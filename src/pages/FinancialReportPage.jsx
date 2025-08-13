import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const FinancialReportPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
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

      querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        if (transaction.type === 'cost') {
          totalCosts += transaction.amount;
        } else if (transaction.type === 'revenue') {
          totalRevenues += transaction.amount;
        }
      });

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
          <h2>Bilan pour la période sélectionnée</h2>
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
