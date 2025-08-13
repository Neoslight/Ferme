import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const HealthLog = ({ animalId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Soin',
    description: '',
    traitement: ''
  });

  // Reference to the sub-collection
  const healthLogsCollectionRef = collection(db, 'animals', animalId, 'health_logs');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const q = query(healthLogsCollectionRef, orderBy('date', 'desc'));
      const logSnapshot = await getDocs(q);
      const logList = logSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date for display
        date: doc.data().date.toDate()
      }));
      setLogs(logList);
      setLoading(false);
    };

    fetchLogs();
  }, [animalId]);

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
      await addDoc(healthLogsCollectionRef, {
        ...formData,
        date: new Date(formData.date)
      });
      // Reset form and refresh list
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Soin',
        description: '',
        traitement: ''
      });
      // A simple way to refresh is to re-fetch
      const q = query(healthLogsCollectionRef, orderBy('date', 'desc'));
      const logSnapshot = await getDocs(q);
      const logList = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
      setLogs(logList);

    } catch (error) {
      console.error("Error adding health log: ", error);
      alert("Erreur lors de l'ajout de l'événement de santé.");
    }
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h3>Suivi de Santé</h3>

      <h4>Ajouter un événement</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
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
        <button type="submit">Ajouter</button>
      </form>

      <h4>Historique</h4>
      {loading ? <p>Chargement...</p> : (
        logs.length === 0
        ? <p>Aucun événement de santé enregistré.</p>
        : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {logs.map(log => (
              <li key={log.id} style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
                <strong>{log.date.toLocaleDateString()} - {log.type}</strong>
                <p>Description: {log.description}</p>
                {log.traitement && <p>Traitement: {log.traitement}</p>}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default HealthLog;
