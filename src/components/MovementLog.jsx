import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const MovementLog = ({ animalId, currentAnimalData }) => {
  const [logs, setLogs] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    toLocation: '',
    reason: ''
  });

  const movementLogsCollectionRef = collection(db, 'animals', animalId, 'movement_logs');
  const enclosuresCollectionRef = collection(db, 'enclos');
  const animalDocRef = doc(db, 'animals', animalId);

  const fetchMovementData = async () => {
    setLoading(true);
    // Fetch logs
    const q = query(movementLogsCollectionRef, orderBy('date', 'desc'));
    const logSnapshot = await getDocs(q);
    const logList = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(logList);

    // Fetch enclosures
    const enclosureSnapshot = await getDocs(enclosuresCollectionRef);
    const enclosureList = enclosureSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEnclosures(enclosureList);

    // Set default destination
    if (enclosureList.length > 0) {
      setFormData(prev => ({ ...prev, toLocation: enclosureList[0].name }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMovementData();
  }, [animalId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.toLocation) {
      alert("Veuillez sélectionner une destination.");
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Add new movement log
      const newLogRef = doc(movementLogsCollectionRef); //
      batch.set(newLogRef, {
        date: new Date(formData.date),
        fromLocation: currentAnimalData.currentLocation || 'Inconnue',
        toLocation: formData.toLocation,
        reason: formData.reason
      });

      // 2. Update the animal's current location
      batch.update(animalDocRef, { currentLocation: formData.toLocation });

      await batch.commit();

      // Refresh data
      fetchMovementData();
      // We also need to refresh the parent component's data, this is tricky.
      // For now, a page reload might be the simplest solution, though not ideal.
      // A better solution would be to lift state up or use a state management library.
      window.location.reload();


    } catch (error) {
      console.error("Error logging movement: ", error);
      alert("Erreur lors de l'enregistrement du déplacement.");
    }
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h3>Déplacements et Localisation</h3>
      <p><strong>Localisation Actuelle:</strong> {currentAnimalData.currentLocation || 'Non définie'}</p>

      <h4>Enregistrer un déplacement</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p>
          <label>Nouvel enclos: </label>
          <select name="toLocation" value={formData.toLocation} onChange={handleChange} required>
            {enclosures.map(enclosure => (
              <option key={enclosure.id} value={enclosure.name}>{enclosure.name}</option>
            ))}
          </select>
        </p>
        <p><label>Raison: </label><input type="text" name="reason" value={formData.reason} onChange={handleChange} /></p>
        <button type="submit">Enregistrer</button>
      </form>

      <h4>Historique des déplacements</h4>
      {loading ? <p>Chargement...</p> : (
        <ul>
          {logs.map(log => (
            <li key={log.id}>
              {log.date.toLocaleDateString()}: <strong>{log.fromLocation}</strong> vers <strong>{log.toLocation}</strong> ({log.reason})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MovementLog;
