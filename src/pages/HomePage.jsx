import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value }) => (
  <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
    <h2 style={{ margin: 0, fontSize: '2rem' }}>{value}</h2>
    <p style={{ margin: 0, color: '#666' }}>{title}</p>
  </div>
);

const HomePage = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      try {
        const animalsCollection = collection(db, 'animals');
        const animalSnapshot = await getDocs(animalsCollection);
        const animalList = animalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnimals(animalList);
      } catch (error) {
        console.error("Error fetching animals: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  const stats = useMemo(() => {
    const total = animals.length;
    const bySpecies = animals.reduce((acc, animal) => {
      acc[animal.espece] = (acc[animal.espece] || 0) + 1;
      return acc;
    }, {});
    const byStatus = animals.reduce((acc, animal) => {
      acc[animal.statut] = (acc[animal.statut] || 0) + 1;
      return acc;
    }, {});

    return { total, bySpecies, byStatus };
  }, [animals]);

  if (loading) {
    return <p>Chargement du tableau de bord...</p>;
  }

  return (
    <div>
      <h1>Tableau de Bord</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Total d'animaux" value={stats.total} />
        {Object.entries(stats.bySpecies).map(([species, count]) => (
          <StatCard key={species} title={species} value={count} />
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Statuts</h3>
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <p key={status}><strong>{status}:</strong> {count}</p>
        ))}
      </div>

      <hr />

      <h2>Liste Complète des Animaux</h2>
      {animals.length === 0 ? (
        <p>Aucun animal trouvé. <Link to="/add">Ajoutez-en un !</Link></p>
      ) : (
        <ul className="animal-list">
          {animals.map(animal => (
            <li key={animal.id}>
              <Link to={`/animal/${animal.id}`} className="animal-list-item">
                <div>
                  <strong>{animal.nom}</strong> ({animal.espece})
                </div>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>{animal.statut}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HomePage;
