import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FiEdit, FiTrash2, FiPrinter } from 'react-icons/fi';
import HealthLog from '../components/HealthLog';
import MovementLog from '../components/MovementLog';
import LifeEventsLog from '../components/LifeEventsLog';
import ReproductionLog from '../components/ReproductionLog';
import CostsLog from '../components/CostsLog';
import RevenuesLog from '../components/RevenuesLog';

const AnimalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [assignedRation, setAssignedRation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const animalDocRef = doc(db, 'animals', id);

    const unsubscribe = onSnapshot(animalDocRef, async (animalDoc) => {
      if (animalDoc.exists()) {
        const animalData = { id: animalDoc.id, ...animalDoc.data() };
        setAnimal(animalData);

        if (animalData.rationId) {
          const rationDocRef = doc(db, 'rations', animalData.rationId);
          const rationDoc = await getDoc(rationDocRef);
          if (rationDoc.exists()) {
            setAssignedRation(rationDoc.data());
          }
        } else {
          setAssignedRation(null);
        }
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error with onSnapshot: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${animal.nom} ?`)) {
      try {
        await deleteDoc(doc(db, 'animals', id));
        navigate('/');
      } catch (error) {
        console.error("Error removing document: ", error);
        alert("Erreur lors de la suppression de l'animal.");
      }
    }
  };

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!animal) {
    return <p>Animal non trouvé.</p>;
  }

  return (
    <div>
      <div className="card printable-area" style={{ marginBottom: '2rem' }}>
        <div style={{display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap'}}>
          {animal.photoURL && <img src={animal.photoURL} alt={animal.nom} style={{width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px'}}/>}
          <h1>{animal.nom}</h1>
        </div>
        <hr/>
        <p><strong>Espèce:</strong> {animal.espece}</p>
        <p><strong>Race:</strong> {animal.race}</p>
        <p><strong>Caractère:</strong> {animal.caractere || 'Non renseigné'}</p>
        <p><strong>Sexe:</strong> {animal.sexe}</p>
        <p><strong>Date de naissance:</strong> {animal.dateDeNaissance ? new Date(animal.dateDeNaissance.seconds * 1000).toLocaleDateString() : 'Inconnue'}</p>
        <p><strong>Statut:</strong> {animal.statut}</p>
        <p><strong>Localisation Actuelle:</strong> {animal.currentLocation || 'Non renseigné'}</p>

        {assignedRation && (
           <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-title)' }}>Ration: {assignedRation.name}</p>
            <p style={{ margin: 0 }}>{assignedRation.description}</p>
          </div>
        )}

        {animal.estimatedDueDate && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-title)' }}>
              Mise bas estimée le: {new Date(animal.estimatedDueDate.seconds * 1000).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <Link to={`/animal/${id}/edit`}><button className="btn btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><FiEdit /> Modifier</button></Link>
          <button onClick={handleDelete} className="btn btn-danger" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><FiTrash2 /> Supprimer</button>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><FiPrinter /> Imprimer la fiche</button>
        </div>
      </div>

      <div className="card no-print"><HealthLog animalId={id} /></div>
      <div className="card no-print"><MovementLog animalId={id} currentAnimalData={animal} /></div>
      <div className="card no-print"><LifeEventsLog animalId={id} /></div>
      <div className="card no-print"><ReproductionLog animal={animal} /></div>
      <div className="card no-print">
        <h2>Suivi Financier</h2>
        <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
          <div style={{flex: 1, minWidth: '300px'}}><CostsLog animalId={id} /></div>
          <div style={{flex: 1, minWidth: '300px'}}><RevenuesLog animalId={id} /></div>
        </div>
      </div>
    </div>
  );
};

export default AnimalDetailPage;
