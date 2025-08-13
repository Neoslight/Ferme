import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EditAnimalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchAnimal = async () => {
      const animalDocRef = doc(db, 'animals', id);
      const animalDoc = await getDoc(animalDocRef);
      if (animalDoc.exists()) {
        const data = animalDoc.data();
        // Firebase Timestamps need to be converted for the date input field
        const birthDate = data.dateDeNaissance ? new Date(data.dateDeNaissance.seconds * 1000).toISOString().split('T')[0] : '';
        setFormData({ ...data, dateDeNaissance: birthDate });
      }
    };
    fetchAnimal();
  }, [id]);

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
      const animalDocRef = doc(db, 'animals', id);
      await updateDoc(animalDocRef, {
        ...formData,
        dateDeNaissance: formData.dateDeNaissance ? new Date(formData.dateDeNaissance) : null
      });
      navigate(`/animal/${id}`);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Erreur lors de la mise à jour de l'animal.");
    }
  };

  if (!formData) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Modifier {formData.nom}</h1>
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
          <input type="text" name="caractere" value={formData.caractere || ''} onChange={handleChange} placeholder="Ex: Docile, craintif..."/>
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
          <label>Statut: </label>
          <select name="statut" value={formData.statut} onChange={handleChange}>
            <option value="Présent">Présent</option>
            <option value="Vendu">Vendu</option>
            <option value="Décédé">Décédé</option>
          </select>
        </p>
        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
};

export default EditAnimalPage;
