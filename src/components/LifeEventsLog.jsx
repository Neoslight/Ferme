import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const LifeEventsLog = ({ animalId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Vente',
    details: ''
  });

  const lifeEventsCollectionRef = collection(db, 'animals', animalId, 'life_events');
  const animalDocRef = doc(db, 'animals', animalId);

  const fetchLogs = async () => {
    setLoading(true);
    const q = query(lifeEventsCollectionRef, orderBy('date', 'desc'));
    const logSnapshot = await getDocs(q);
    const logList = logSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    setLogs(logList);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [animalId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const batch = writeBatch(db);

      // 1. Add new life event
      const newLifeEventRef = doc(lifeEventsCollectionRef);
      batch.set(newLifeEventRef, {
        date: new Date(formData.date),
        type: formData.type,
        details: formData.details
      });

      // 2. Update the animal's status
      const newStatus = formData.type === 'Vente' ? 'Vendu' : 'Décédé';
      batch.update(animalDocRef, { statut: newStatus });

      await batch.commit();

      // A full reload is the simplest way to ensure all data on the page is fresh
      window.location.reload();
    } catch (error) {
      console.error("Error logging life event: ", error);
      alert("Erreur lors de l'enregistrement de l'événement.");
    }
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h3>Événements de Vie</h3>

      <h4>Ajouter un événement (Vente / Décès)</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p>
          <label>Type: </label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Vente">Vente</option>
            <option value="Décès">Décès</option>
          </select>
        </p>
        <p><label>Détails: </label><input type="text" name="details" value={formData.details} onChange={handleChange} /></p>
        <button type="submit">Enregistrer l'événement</button>
      </form>

      <h4>Historique</h4>
      {loading ? <p>Chargement...</p> : (
        <ul>
          {logs.map(log => (
            <li key={log.id}>
              {log.date.toLocaleDateString()} - <strong>{log.type}</strong>: {log.details}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LifeEventsLog;
