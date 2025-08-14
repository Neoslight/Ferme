import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Papa from 'papaparse';

const PAGE_SIZE = 5;

const HealthLog = ({ animalId }) => {
  const [logs, setLogs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Soin',
    description: '',
    traitement: '',
    reminderDate: ''
  });

  const healthLogsCollectionRef = collection(db, 'animals', animalId, 'health_logs');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const firstPageQuery = query(healthLogsCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));
    const documentSnapshots = await getDocs(firstPageQuery);

    const logList = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(logList);

    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastDoc);

    if (documentSnapshots.docs.length < PAGE_SIZE) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
    setLoading(false);
  }, [animalId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);

    const nextPageQuery = query(healthLogsCollectionRef, orderBy('date', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
    const documentSnapshots = await getDocs(nextPageQuery);

    const newLogs = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(prevLogs => [...prevLogs, ...newLogs]);

    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastDoc);

    if (documentSnapshots.docs.length < PAGE_SIZE) {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) {
      alert("La description est obligatoire.");
      return;
    }
    try {
      const newLog = {
        date: new Date(formData.date),
        type: formData.type,
        description: formData.description,
        traitement: formData.traitement,
      };
      if (formData.reminderDate) {
        newLog.reminderDate = new Date(formData.reminderDate);
      }
      await addDoc(healthLogsCollectionRef, newLog);

      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Soin',
        description: '',
        traitement: '',
        reminderDate: ''
      });
      fetchLogs();
    } catch (error) {
      console.error("Error adding health log: ", error);
      alert("Erreur lors de l'ajout de l'événement de santé.");
    }
  };

  const handleExportCSV = async () => {
    // 1. Fetch all logs for this animal
    const allLogsQuery = query(healthLogsCollectionRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(allLogsQuery);
    const allLogs = snapshot.docs.map(d => {
      const data = d.data();
      return {
        date: data.date.toDate().toLocaleDateString(),
        type: data.type,
        description: data.description,
        traitement: data.traitement,
        date_rappel: data.reminderDate ? data.reminderDate.toDate().toLocaleDateString() : ''
      }
    });

    // 2. Convert to CSV
    const csv = Papa.unparse(allLogs);

    // 3. Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_sante_${animalId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h3>Suivi de Santé</h3>

      <h4>Ajouter un événement</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date de l'événement: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p>
          <label>Type: </label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Soin">Soin</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Blessure">Blessure</option>
            <option value="Visite Vétérinaire">Visite Vétérinaire</option>
            <option value="Autre">Autre</option>
          </select>
        </p>
        <p><label>Description: </label><textarea name="description" value={formData.description} onChange={handleChange} required></textarea></p>
        <p><label>Traitement: </label><input type="text" name="traitement" value={formData.traitement} onChange={handleChange} /></p>
        <p><label>Date de rappel (Optionnel):</label><input type="date" name="reminderDate" value={formData.reminderDate} onChange={handleChange} /></p>
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h4>Historique</h4>
        <button onClick={handleExportCSV}>Exporter en CSV</button>
      </div>
      {loading ? <p>Chargement...</p> : (
        logs.length === 0
          ? <p>Aucun événement de santé enregistré.</p>
          : (
            <>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {logs.map(log => (
                  <li key={log.id} style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
                    <strong>{log.date.toLocaleDateString()} - {log.type}</strong>
                    <p>Description: {log.description}</p>
                    {log.traitement && <p>Traitement: {log.traitement}</p>}
                  </li>
                ))}
              </ul>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? 'Chargement...' : 'Charger plus'}
                  </button>
                </div>
              )}
            </>
          )
      )}
    </div>
  );
};

export default HealthLog;
