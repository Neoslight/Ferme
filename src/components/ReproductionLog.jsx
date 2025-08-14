import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { calculateDueDate } from '../utils/reproductionUtils';
import { usePaginatedSubCollection } from '../queries/usePaginatedSubCollection';

const addReproductionLog = async ({ animal, formData }) => {
  const matingDate = new Date(formData.date);
  const dueDate = calculateDueDate(matingDate, animal.espece);

  const batch = writeBatch(db);
  const animalDocRef = doc(db, 'animals', animal.id);
  const reproLogsCollectionRef = collection(db, 'animals', animal.id, 'reproduction_logs');

  const newLogRef = doc(reproLogsCollectionRef);
  batch.set(newLogRef, {
    date: matingDate,
    sireId: formData.sireId,
    notes: formData.notes,
    estimatedDueDate: dueDate,
  });

  batch.update(animalDocRef, { estimatedDueDate: dueDate });
  return await batch.commit();
};

const ReproductionLog = ({ animal }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sireId: '',
    notes: ''
  });

  const { data: siresData } = useQuery({
    queryKey: ['sires', animal.espece],
    queryFn: async () => {
      const siresQuery = query(collection(db, 'animals'), where('sexe', '==', 'Mâle'), where('espece', '==', animal.espece));
      const snapshot = await getDocs(siresQuery);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!animal.espece,
  });

  useEffect(() => {
    if (siresData && siresData.length > 0) {
      setFormData(prev => ({ ...prev, sireId: siresData[0].id }));
    }
  }, [siresData]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = usePaginatedSubCollection(animal.id, 'reproduction_logs');

  const addReproLogMutation = useMutation({
    mutationFn: (formData) => addReproductionLog({ animal, formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcollection', animal.id, 'reproduction_logs'] });
      queryClient.invalidateQueries({ queryKey: ['animal', animal.id] });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.sireId) return;
    addReproLogMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          sireId: siresData[0]?.id || '',
          notes: ''
        });
      }
    });
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
            {siresData?.length === 0 && <option disabled>Aucun mâle de cette espèce trouvé</option>}
            {siresData?.map(sire => (
              <option key={sire.id} value={sire.id}>{sire.nom}</option>
            ))}
          </select>
        </p>
        <p><label>Notes: </label><textarea name="notes" value={formData.notes} onChange={handleChange}></textarea></p>
        <button type="submit" className="btn btn-primary" disabled={addReproLogMutation.isPending}>
          {addReproLogMutation.isPending ? 'Enregistrement...' : 'Enregistrer la saillie'}
        </button>
      </form>

      <h4 style={{marginTop: '2rem'}}>Historique</h4>
      {isLoading ? <p>Chargement...</p> : (
        data.pages.flatMap(page => page.data).length === 0
          ? <p>Aucun événement de reproduction enregistré.</p>
          : <>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {data.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.data.map(log => (
                    <li key={log.id} style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}>
                      <p><strong>Date de saillie:</strong> {new Date(log.date.seconds * 1000).toLocaleDateString()}</p>
                      <p><strong>Reproducteur:</strong> {log.sireId}</p> {/* We could fetch sire name here */}
                      {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
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

export default ReproductionLog;
