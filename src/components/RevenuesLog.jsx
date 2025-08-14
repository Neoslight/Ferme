import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PAGE_SIZE = 5;

const RevenuesLog = ({ animalId }) => {
  const [logs, setLogs] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  const transactionsCollectionRef = collection(db, 'transactions');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const q = query(
      transactionsCollectionRef,
      where('animalId', '==', animalId),
      where('type', '==', 'revenue'),
      orderBy('date', 'desc'),
      limit(PAGE_SIZE)
    );
    const docSnapshots = await getDocs(q);
    const logList = docSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
    setLogs(logList);
    const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
    setLastVisible(lastDoc);
    setHasMore(docSnapshots.docs.length === PAGE_SIZE);
    setLoading(false);
  }, [animalId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);
    const q = query(
      transactionsCollectionRef,
      where('animalId', '==', animalId),
      where('type', '==', 'revenue'),
      orderBy('date', 'desc'),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    const docSnapshots = await getDocs(q);
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
    if (!formData.description || !formData.amount) {
      alert("La description et le montant sont obligatoires.");
      return;
    }
    try {
      await addDoc(transactionsCollectionRef, {
        animalId: animalId,
        type: 'revenue',
        date: new Date(formData.date),
        description: formData.description,
        amount: parseFloat(formData.amount)
      });
      fetchLogs();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: ''
      });
    } catch (error) {
      console.error("Error adding revenue log: ", error);
    }
  };

  return (
    <div>
      <h4>Revenus</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date:</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p><label>Description:</label><input type="text" name="description" value={formData.description} onChange={handleChange} required /></p>
        <p><label>Montant (€):</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required /></p>
        <button type="submit" className="btn btn-primary">Ajouter Revenu</button>
      </form>

      <h5 style={{marginTop: '2rem'}}>Historique des Revenus</h5>
      {loading ? <p>Chargement...</p> : (
        logs.length === 0
          ? <p>Aucun revenu enregistré.</p>
          : <>
              <ul>
                {logs.map(log => (
                  <li key={log.id}>
                    {log.date.toLocaleDateString()}: {log.description} - <strong>{log.amount.toFixed(2)}€</strong>
                  </li>
                ))}
              </ul>
              {hasMore && <button onClick={handleLoadMore} disabled={loadingMore}>{loadingMore ? 'Chargement...' : 'Charger plus'}</button>}
            </>
      )}
    </div>
  );
};

export default RevenuesLog;
