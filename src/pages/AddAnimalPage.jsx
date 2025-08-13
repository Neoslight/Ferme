import React, { useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const AddAnimalPage = () => {
  const [formData, setFormData] = useState({
    nom: '',
    espece: '',
    race: '',
    dateDeNaissance: '',
    sexe: 'Mâle',
    statut: 'Présent',
    origine: 'Achat',
    origineDetails: '',
    caractere: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.espece) {
      alert("Le nom et l'espèce sont obligatoires.");
      return;
    }
    try {
      const batch = writeBatch(db);

      // 1. Create the new animal document
      const newAnimalRef = doc(collection(db, 'animals'));
      batch.set(newAnimalRef, {
        nom: formData.nom,
        espece: formData.espece,
        race: formData.race,
        caractere: formData.caractere,
        dateDeNaissance: formData.dateDeNaissance ? new Date(formData.dateDeNaissance) : null,
        sexe: formData.sexe,
        statut: 'Présent',
        currentLocation: '', // Initialize location
      });

      // 2. Create the first life event
      const lifeEventsCollectionRef = collection(db, 'animals', newAnimalRef.id, 'life_events');
      const newLifeEventRef = doc(lifeEventsCollectionRef);
      batch.set(newLifeEventRef, {
        date: formData.dateDeNaissance ? new Date(formData.dateDeNaissance) : new Date(),
        type: formData.origine,
        details: formData.origineDetails
      });

      await batch.commit();
      navigate('/');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Erreur lors de l'ajout de l'animal.");
    }
  };

  return (
    <div>
      <h1>Ajouter un nouvel animal</h1>
      <form onSubmit={handleSubmit}>
        <p>
          <label>Nom: </label>
          <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
        </p>
        <p>
          <label>Espèce: </label>
          <input type="text" name="espece" value={formData.espece} onChange={handleChange} required />
        </p>
        <p>
          <label>Race: </label>
          <input type="text" name="race" value={formData.race} onChange={handleChange} />
        </p>
        <p>
          <label>Caractère: </label>
          <input type="text" name="caractere" value={formData.caractere} onChange={handleChange} placeholder="Ex: Docile, craintif..."/>
        </p>
        <p>
          <label>Date de naissance: </label>
          <input type="date" name="dateDeNaissance" value={formData.dateDeNaissance} onChange={handleChange} />
        </p>
        <p>
          <label>Sexe: </label>
          <select name="sexe" value={formData.sexe} onChange={handleChange}>
            <option value="Mâle">Mâle</option>
            <option value="Femelle">Femelle</option>
          </select>
        </p>
         <p>
          <label>Origine: </label>
          <select name="origine" value={formData.origine} onChange={handleChange}>
            <option value="Achat">Achat</option>
            <option value="Naissance sur site">Naissance sur site</option>
          </select>
        </p>
        <p>
          <label>Détails de l'origine: </label>
          <input type="text" name="origineDetails" value={formData.origineDetails} onChange={handleChange} placeholder="Ex: Ferme Dupont, mère: Blanchette..."/>
        </p>
        <button type="submit">Ajouter l'animal</button>
      </form>
    </div>
  );
};

export default AddAnimalPage;
