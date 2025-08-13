import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import HealthLog from '../components/HealthLog';
import MovementLog from '../components/MovementLog';
import LifeEventsLog from '../components/LifeEventsLog';

const AnimalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const animalDocRef = doc(db, 'animals', id);
        const animalDoc = await getDoc(animalDocRef);

        if (animalDoc.exists()) {
          setAnimal({ id: animalDoc.id, ...animalDoc.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimal();
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

  const ActionButton = ({ to, children }) => <Link to={to} style={{ marginRight: '1rem' }}><button>{children}</button></Link>;
  const DangerButton = ({ onClick, children }) => <button onClick={onClick} style={{ backgroundColor: 'var(--danger-color)' }}>{children}</button>;

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1>Profil de {animal.nom}</h1>
        <p><strong>Espèce:</strong> {animal.espece}</p>
        <p><strong>Race:</strong> {animal.race}</p>
        <p><strong>Sexe:</strong> {animal.sexe}</p>
        <p><strong>Date de naissance:</strong> {animal.dateDeNaissance ? new Date(animal.dateDeNaissance.seconds * 1000).toLocaleDateString() : 'Inconnue'}</p>
        <p><strong>Statut:</strong> {animal.statut}</p>
        <p><strong>Localisation Actuelle:</strong> {animal.currentLocation || 'Non définie'}</p>

        <div style={{ marginTop: '1.5rem' }}>
          <ActionButton to={`/animal/${id}/edit`}>Modifier</ActionButton>
          <DangerButton onClick={handleDelete}>Supprimer</DangerButton>
        </div>
      </div>

      <div className="card"><HealthLog animalId={id} /></div>
      <div className="card"><MovementLog animalId={id} currentAnimalData={animal} /></div>
      <div className="card"><LifeEventsLog animalId={id} /></div>
    </div>
  );
};

export default AnimalDetailPage;
