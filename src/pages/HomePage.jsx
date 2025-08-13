import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value }) => (
  <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
    <h2 style={{ margin: 0, fontSize: '2rem' }}>{value}</h2>
    <p style={{ margin: 0, color: '#666' }}>{title}</p>
  </div>
);

const PAGE_SIZE = 15;

const HomePage = () => {
  const [allAnimals, setAllAnimals] = useState([]); // For stats
  const [paginatedAnimals, setPaginatedAnimals] = useState([]); // For list display
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial fetch for stats and first page
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      // Fetch all for stats - this could be optimized further with a separate stats doc
      const allAnimalsSnapshot = await getDocs(collection(db, 'animals'));
      const allAnimalsList = allAnimalsSnapshot.docs.map(doc => doc.data());
      setAllAnimals(allAnimalsList);

      // Fetch first page
      const firstPageQuery = query(collection(db, 'animals'), orderBy('nom'), limit(PAGE_SIZE));
      const documentSnapshots = await getDocs(firstPageQuery);

      const firstPageAnimals = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaginatedAnimals(firstPageAnimals);

      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);

      if (documentSnapshots.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);

    const nextPageQuery = query(
      collection(db, 'animals'),
      orderBy('nom'),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );

    const documentSnapshots = await getDocs(nextPageQuery);
    const newAnimals = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPaginatedAnimals(prevAnimals => [...prevAnimals, ...newAnimals]);

    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastDoc);

    if (documentSnapshots.docs.length < PAGE_SIZE) {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const stats = useMemo(() => {
    const total = allAnimals.length;
    const bySpecies = allAnimals.reduce((acc, animal) => {
      acc[animal.espece] = (acc[animal.espece] || 0) + 1;
      return acc;
    }, {});
    const byStatus = allAnimals.reduce((acc, animal) => {
      acc[animal.statut] = (acc[animal.statut] || 0) + 1;
      return acc;
    }, {});

    return { total, bySpecies, byStatus };
  }, [allAnimals]);

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

      <h2>Liste des Animaux</h2>
      {paginatedAnimals.length === 0 ? (
        <p>Aucun animal trouvé. <Link to="/add">Ajoutez-en un !</Link></p>
      ) : (
        <>
          <ul className="animal-list">
            {paginatedAnimals.map(animal => (
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
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Chargement...' : 'Charger plus'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
