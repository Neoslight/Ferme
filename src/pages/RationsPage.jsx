import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const RationsPage = () => {
  const [rations, setRations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingRation, setEditingRation] = useState(null); // To hold the ration being edited

  const rationsCollectionRef = collection(db, 'rations');

  const fetchRations = useCallback(async () => {
    setLoading(true);
    const snapshot = await getDocs(rationsCollectionRef);
    const rationsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setRations(rationsList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRations();
  }, [fetchRations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingRation(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRation) { // Update existing ration
      const rationDoc = doc(db, 'rations', editingRation.id);
      await updateDoc(rationDoc, { name: editingRation.name, description: editingRation.description });
      setEditingRation(null);
    } else { // Add new ration
      await addDoc(rationsCollectionRef, formData);
    }
    setFormData({ name: '', description: '' });
    fetchRations();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ration ?")) {
      await deleteDoc(doc(db, 'rations', id));
      fetchRations();
    }
  };

  return (
    <div className="card">
      <h1>Gestion des Rations Alimentaires</h1>

      <div className="card">
        <h3>{editingRation ? "Modifier la ration" : "Créer une nouvelle ration"}</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={editingRation ? editingRation.name : formData.name} onChange={editingRation ? handleEditChange : handleChange} placeholder="Nom (ex: Ration Croissance)" required />
          <textarea name="description" value={editingRation ? editingRation.description : formData.description} onChange={editingRation ? handleEditChange : handleChange} placeholder="Description (ex: Foin à volonté, 2kg granulés...)" required></textarea>
          <button type="submit">{editingRation ? "Mettre à jour" : "Créer la ration"}</button>
          {editingRation && <button type="button" onClick={() => setEditingRation(null)}>Annuler</button>}
        </form>
      </div>

      <h3>Rations Définies</h3>
      {loading ? <p>Chargement...</p> : (
        <ul style={{listStyle: 'none', padding: 0}}>
          {rations.map(ration => (
            <li key={ration.id} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <div>
                <strong>{ration.name}</strong>
                <p style={{margin: 0}}>{ration.description}</p>
              </div>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className="btn btn-secondary" onClick={() => setEditingRation(ration)}><FiEdit /></button>
                <button className="btn btn-danger" onClick={() => handleDelete(ration.id)}><FiTrash2 /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RationsPage;
