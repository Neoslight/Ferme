import React, { useState } from 'react';
import { usePaginatedSubCollection } from '../queries/usePaginatedSubCollection';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const addLifeEvent = async ({ animalId, formData }) => {
  const batch = writeBatch(db);
  const animalDocRef = doc(db, 'animals', animalId);
  const lifeEventsCollectionRef = collection(db, 'animals', animalId, 'life_events');

  const newLifeEventRef = doc(lifeEventsCollectionRef);
  batch.set(newLifeEventRef, {
    date: new Date(formData.date),
    type: formData.type,
    details: formData.details
  });

  const newStatus = formData.type === 'Vente' ? 'Vendu' : 'Décédé';
  batch.update(animalDocRef, { statut: newStatus });

  return await batch.commit();
};

const LifeEventsLog = ({ animalId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Vente',
    details: ''
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = usePaginatedSubCollection(animalId, 'life_events');

  const addLifeEventMutation = useMutation({
    mutationFn: (formData) => addLifeEvent({ animalId, formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcollection', animalId, 'life_events'] });
      queryClient.invalidateQueries({ queryKey: ['animal', animalId] });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addLifeEventMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'Vente',
          details: ''
        });
      }
    });
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
      {isLoading ? <p>Chargement...</p> : (
        data.pages.flatMap(page => page.data).length === 0
          ? <p>Aucun événement de vie enregistré.</p>
          : <>
            <ul>
              {data.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.data.map(log => (
                    <li key={log.id}>
                      {new Date(log.date.seconds * 1000).toLocaleDateString()} - <strong>{log.type}</strong>: {log.details}
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

export default LifeEventsLog;
