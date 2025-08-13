import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, writeBatch, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PAGE_SIZE = 5;

const MovementLog = ({ animalId, currentAnimalData }) => {
  const [logs, setLogs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [enclosures, setEnclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    toLocation: '',
    reason: ''
  });

  const movementLogsCollectionRef = collection(db, 'animals', animalId, 'movement_logs');
  const enclosuresCollectionRef = collection(db, 'enclos');
  const animalDocRef = doc(db, 'animals', animalId);

  // Fetch enclosures once, as they don't change often
  useEffect(() => {
    const fetchEnclosures = async () => {
      const enclosureSnapshot = await getDocs(enclosuresCollectionRef);
      const enclosureList = enclosureSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEnclosures(enclosureList);
      if (enclosureList.length > 0) {
        setFormData(prev => ({ ...prev, toLocation: enclosureList[0].name }));
      }
    };
    fetchEnclosures();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const firstPageQuery = query(movementLogsCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));
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

    const nextPageQuery = query(movementLogsCollectionRef, orderBy('date', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
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
    if (!formData.toLocation) {
      alert("Veuillez sélectionner une destination.");
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Add new movement log
      const newLogRef = doc(movementLogsCollectionRef);
      batch.set(newLogRef, {
        date: new Date(formData.date),
        fromLocation: currentAnimalData.currentLocation || 'Inconnue',
        toLocation: formData.toLocation,
        reason: formData.reason
      });

      // 2. Update the animal's current location on the parent doc
      batch.update(animalDocRef, { currentLocation: formData.toLocation });

      await batch.commit();

      // Reset form and refetch first page
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
        reason: ''
      }));
      fetchLogs();
      // Also need to tell parent to refetch animal data... this is tricky.
      // For now, a reload is the simplest way to ensure the "current location" is updated.
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
        logs.length === 0
          ? <p>Aucun déplacement enregistré.</p>
          : <>
            <ul>
              {logs.map(log => (
                <li key={log.id}>
                  {log.date.toLocaleDateString()}: <strong>{log.fromLocation}</strong> vers <strong>{log.toLocation}</strong> ({log.reason})
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
      )}
    </div>
  );
};

export default MovementLog;
