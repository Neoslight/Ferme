import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, orderBy, limit, getDocs, startAfter, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { calculateDueDate } from '../utils/reproductionUtils';

const PAGE_SIZE = 5;

const ReproductionLog = ({ animal }) => {
  const [logs, setLogs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sires, setSires] = useState([]); // List of possible fathers
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sireId: '',
    notes: ''
  });

  const reproLogsCollectionRef = collection(db, 'animals', animal.id, 'reproduction_logs');

  // Fetch potential sires (males of the same species)
  useEffect(() => {
    const fetchSires = async () => {
      if (!animal.espece) return;
      const siresQuery = query(
        collection(db, 'animals'),
        where('sexe', '==', 'Mâle'),
        where('espece', '==', animal.espece)
      );
      const sireSnapshot = await getDocs(siresQuery);
      const sireList = sireSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSires(sireList);
      if (sireList.length > 0) {
        setFormData(prev => ({ ...prev, sireId: sireList[0].id }));
      }
    };
    fetchSires();
  }, [animal.espece]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const firstPageQuery = query(reproLogsCollectionRef, orderBy('date', 'desc'), limit(PAGE_SIZE));
    const docSnapshots = await getDocs(firstPageQuery);
    const logList = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(logList);
    const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
    setLastVisible(lastDoc);
    setHasMore(docSnapshots.docs.length === PAGE_SIZE);
    setLoading(false);
  }, [animal.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);
    const nextPageQuery = query(reproLogsCollectionRef, orderBy('date', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
    const docSnapshots = await getDocs(nextPageQuery);
    const newLogs = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(prev => [...prev, ...newLogs]);
    const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
    setLastVisible(lastDoc);
    setHasMore(docSnapshots.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sireId) {
      alert("Veuillez sélectionner un reproducteur.");
      return;
    }
    try {
      const matingDate = new Date(formData.date);
      const dueDate = calculateDueDate(matingDate, animal.espece);

      const batch = writeBatch(db);

      // 1. Add new reproduction log
      const newLogRef = doc(reproLogsCollectionRef);
      batch.set(newLogRef, {
        date: matingDate,
        sireId: formData.sireId,
        notes: formData.notes,
        estimatedDueDate: dueDate,
      });

      // 2. Update the parent animal doc with the due date
      const animalDocRef = doc(db, 'animals', animal.id);
      batch.update(animalDocRef, { estimatedDueDate: dueDate });

      await batch.commit();

      fetchLogs(); // Refetch to show the new log
      setFormData(prev => ({
        ...prev,
        notes: '',
        date: new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error("Error adding reproduction log: ", error);
    }
  };

  // Only show the form for females
  if (animal.sexe !== 'Femelle') {
    return (
      <div className="card">
        <h3>Historique de Reproduction</h3>
        <p>Le suivi de la reproduction n'est disponible que pour les femelles.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Suivi de Reproduction</h3>
      <form onSubmit={handleSubmit}>
        <h4>Nouvelle Saillie</h4>
        <p><label>Date: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p>
          <label>Reproducteur (Père): </label>
          <select name="sireId" value={formData.sireId} onChange={handleChange} required>
            {sires.length === 0 && <option disabled>Aucun mâle de cette espèce trouvé</option>}
            {sires.map(sire => (
              <option key={sire.id} value={sire.id}>{sire.nom}</option>
            ))}
          </select>
        </p>
        <p><label>Notes: </label><textarea name="notes" value={formData.notes} onChange={handleChange}></textarea></p>
        <button type="submit" className="btn btn-primary">Enregistrer la saillie</button>
      </form>

      <h4 style={{marginTop: '2rem'}}>Historique</h4>
      {loading ? <p>Chargement...</p> : (
        logs.length === 0
          ? <p>Aucun événement de reproduction enregistré.</p>
          : <>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {logs.map(log => (
                <li key={log.id} style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
                  <p><strong>Date de saillie:</strong> {log.date.toLocaleDateString()}</p>
                  <p><strong>Reproducteur:</strong> {log.sireId}</p> {/* We could fetch sire name here */}
                  {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
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

export default ReproductionLog;
