import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAnimalStore from '../stores/animalStore';
import { usePaginatedSubCollection } from '../queries/usePaginatedSubCollection';
import { useAddMovementLog } from '../mutations/useAddMovementLog';

const MovementLog = ({ animalId }) => {
  const { animal } = useAnimalStore();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    toLocation: '',
    reason: ''
  });

  const { data: enclosuresData } = useQuery({
    queryKey: ['enclosures'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'enclos'));
      return snapshot.docs.map(d => d.data().name);
    }
  });

  // Set default destination when enclosures load
  useEffect(() => {
    if (enclosuresData && enclosuresData.length > 0) {
      setFormData(prev => ({ ...prev, toLocation: enclosuresData[0] }));
    }
  }, [enclosuresData]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = usePaginatedSubCollection(animalId, 'movement_logs');

  const addMovementLogMutation = useAddMovementLog(animalId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.toLocation) return;
    addMovementLogMutation.mutate({
      fromLocation: animal.currentLocation || 'Inconnue',
      ...formData
    }, {
      onSuccess: () => {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          toLocation: enclosuresData[0] || '',
          reason: ''
        });
      }
    });
  };

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
      <h3>Déplacements et Localisation</h3>
      <p><strong>Localisation Actuelle:</strong> {animal?.currentLocation || 'Non définie'}</p>

      <h4>Enregistrer un déplacement</h4>
      <form onSubmit={handleSubmit}>
        <p><label>Date: </label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></p>
        <p>
          <label>Nouvel enclos: </label>
          <select name="toLocation" value={formData.toLocation} onChange={handleChange} required>
            {enclosuresData?.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </p>
        <p><label>Raison: </label><input type="text" name="reason" value={formData.reason} onChange={handleChange} /></p>
        <button type="submit" className="btn btn-primary" disabled={addMovementLogMutation.isPending}>
          {addMovementLogMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      <h4>Historique des déplacements</h4>
      {isLoading ? <p>Chargement...</p> : (
        data.pages.flatMap(page => page.data).length === 0
          ? <p>Aucun déplacement enregistré.</p>
          : <>
            <ul>
              {data.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.data.map(log => (
                    <li key={log.id}>
                      {new Date(log.date.seconds * 1000).toLocaleDateString()}: <strong>{log.fromLocation}</strong> vers <strong>{log.toLocation}</strong> ({log.reason})
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
            {hasNextPage && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
      )}
    </div>
  );
};

export default MovementLog;
