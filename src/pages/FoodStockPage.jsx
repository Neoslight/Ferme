import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FiPlus, FiMinus, FiTrash2, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';

const FoodStockPage = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    alertThreshold: ''
  });

  const stockCollectionRef = collection(db, 'food_stock');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    const snapshot = await getDocs(stockCollectionRef);
    const stockList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setStock(stockList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(stockCollectionRef, {
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        alertThreshold: parseFloat(formData.alertThreshold)
      });
      setFormData({ name: '', quantity: '', unit: 'kg', alertThreshold: '' });
      fetchStock();
    } catch (error) {
      console.error("Error adding stock item: ", error);
    }
  };

  const handleUpdateQuantity = async (id, currentQuantity, change) => {
    const itemDoc = doc(db, 'food_stock', id);
    const newQuantity = currentQuantity + change;
    await updateDoc(itemDoc, { quantity: newQuantity });
    fetchStock();
  };

  // A simple delete function
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article du stock ?")) {
      await deleteDoc(doc(db, 'food_stock', id));
      fetchStock();
    }
  }

  return (
    <div className="card">
      <h1>Gestion des Stocks d'Aliments</h1>

      <div className="card">
        <h3>Ajouter un nouvel aliment au stock</h3>
        <form onSubmit={handleAddSubmit}>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nom (ex: Foin de Crau)" required />
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantité initiale" required />
          <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Unité (ex: kg, bottes)" required />
          <input type="number" name="alertThreshold" value={formData.alertThreshold} onChange={handleChange} placeholder="Seuil d'alerte" required />
          <button type="submit" className="btn btn-primary">Ajouter au stock</button>
        </form>
      </div>

      <h3>Inventaire Actuel</h3>
      {loading ? <p>Chargement...</p> : (
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr>
              <th>Aliment</th>
              <th>Quantité</th>
              <th>Actions</th>
              <th>Supprimer</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(item => {
              const isLow = item.quantity <= item.alertThreshold;
              return (
                <tr key={item.id} style={{backgroundColor: isLow ? '#fffbe6' : 'transparent', borderBottom: '1px solid #ddd'}}>
                  <td>{item.name}</td>
                  <td style={{fontWeight: 'bold', color: isLow ? '#d46b08' : 'inherit'}}>
                    {item.quantity} {item.unit}
                    {isLow && ' (Stock Bas !)'}
                  </td>
                  <td style={{display: 'flex', gap: '0.5rem'}}>
                    <button title="Ajouter 1" className="btn btn-secondary" onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}><FiPlus /></button>
                    <button title="Retirer 1" className="btn btn-secondary" onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}><FiMinus /></button>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}><FiTrash2 /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FoodStockPage;
