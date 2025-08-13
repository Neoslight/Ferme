import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EnclosuresPage = () => {
  const [enclosures, setEnclosures] = useState([]);
  const [newEnclosureName, setNewEnclosureName] = useState('');
  const [loading, setLoading] = useState(true);

  const enclosuresCollectionRef = collection(db, 'enclos');

  const fetchEnclosures = async () => {
    setLoading(true);
    const enclosureSnapshot = await getDocs(enclosuresCollectionRef);
    const enclosureList = enclosureSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEnclosures(enclosureList);
    setLoading(false);
  };

  useEffect(() => {
    fetchEnclosures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEnclosureName.trim()) {
      alert("Le nom de l'enclos ne peut pas être vide.");
      return;
    }
    try {
      await addDoc(enclosuresCollectionRef, { name: newEnclosureName });
      setNewEnclosureName('');
      fetchEnclosures(); // Re-fetch to show the new enclosure
    } catch (error) {
      console.error("Error adding enclosure: ", error);
      alert("Erreur lors de l'ajout de l'enclos.");
    }
  };

  return (
    <div>
      <h1>Gestion des Enclos</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newEnclosureName}
          onChange={(e) => setNewEnclosureName(e.target.value)}
          placeholder="Nom du nouvel enclos"
        />
        <button type="submit">Ajouter</button>
      </form>

      <h3>Liste des enclos existants</h3>
      {loading ? <p>Chargement...</p> : (
        <ul>
          {enclosures.map(enclosure => (
            <li key={enclosure.id}>{enclosure.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EnclosuresPage;
