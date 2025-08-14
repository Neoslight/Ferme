import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, orderBy, doc, writeBatch, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAnimalStore from '../stores/animalStore';

const PAGE_SIZE = 5;

const LifeEventsLog = ({ animalId }) => {
  const [logs, setLogs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { updateAnimal } = useAnimalStore();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Vente',
    details: ''
  });

  const lifeEventsCollectionRef = collection(db, 'animals', animalId, 'life_events');
  const animalDocRef = doc(db, 'animals', animalId);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const firstPageQuery = query(lifeEventsCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));
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

    const nextPageQuery = query(lifeEventsCollectionRef, orderBy('date', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
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

      // Reset form and refetch first page
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Vente',
        details: ''
      });
      fetchLogs();
      // 3. Update the global state
      updateAnimal({ statut: newStatus });

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
        logs.length === 0
          ? <p>Aucun événement de vie enregistré.</p>
          : <>
            <ul>
              {logs.map(log => (
                <li key={log.id}>
                  {log.date.toLocaleDateString()} - <strong>{log.type}</strong>: {log.details}
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

export default LifeEventsLog;
