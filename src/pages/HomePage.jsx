import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import SpeciesPieChart from '../components/charts/SpeciesPieChart';
import BirthsBarChart from '../components/charts/BirthsBarChart';

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

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [enclosures, setEnclosures] = useState([]);

  // Fetch enclosures for the filter dropdown
  useEffect(() => {
    const fetchEnclosures = async () => {
      const snapshot = await getDocs(collection(db, 'enclos'));
      const enclosureList = snapshot.docs.map(d => d.data().name);
      setEnclosures(enclosureList);
    };
    fetchEnclosures();
  }, []);

  const buildQuery = (isPaginating = false) => {
    let q = query(collection(db, 'animals'), orderBy('nom'));

    // Apply filters
    // Note: Firestore requires creating composite indexes for these queries.
    // The console will provide a link to create them automatically upon the first query failure.
    if (speciesFilter) q = query(q, where('espece', '==', speciesFilter));
    if (statusFilter) q = query(q, where('statut', '==', statusFilter));
    if (locationFilter) q = query(q, where('currentLocation', '==', locationFilter));

    // Apply pagination
    if (isPaginating && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    q = query(q, limit(PAGE_SIZE));
    return q;
  };

  const fetchAnimals = async (isPaginating = false) => {
    if (isPaginating) setLoadingMore(true);
    else setLoading(true);

    const q = buildQuery(isPaginating);
    const documentSnapshots = await getDocs(q);

    let newAnimals = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Client-side search term filtering
    if (searchTerm) {
      newAnimals = newAnimals.filter(animal =>
        animal.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (isPaginating) {
      setPaginatedAnimals(prev => [...prev, ...newAnimals]);
    } else {
      setPaginatedAnimals(newAnimals);
    }

    const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    setLastVisible(lastDoc);
    setHasMore(documentSnapshots.docs.length === PAGE_SIZE);

    if (isPaginating) setLoadingMore(false);
    else setLoading(false);
  };

  // Fetch stats once on mount
  useEffect(() => {
    const fetchAllForStats = async () => {
      const allAnimalsSnapshot = await getDocs(collection(db, 'animals'));
      const allAnimalsList = allAnimalsSnapshot.docs.map(doc => doc.data());
      setAllAnimals(allAnimalsList);
    };
    fetchAllForStats();
  }, []);

  // Refetch animals when filters change
  useEffect(() => {
    fetchAnimals();
  }, [speciesFilter, statusFilter, locationFilter]);

  // Debounced search term effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAnimals();
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleLoadMore = () => {
    fetchAnimals(true);
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

      <div className="card" style={{display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem'}}>
        <div style={{flex: 1, minWidth: '300px'}}><SpeciesPieChart animals={allAnimals} /></div>
        <div style={{flex: 1, minWidth: '400px'}}><BirthsBarChart animals={allAnimals} /></div>
      </div>

      <div className="card">
        <h3>Filtres et Recherche</h3>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{flex: 1}}
          />
          <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
            <option value="">Toutes les espèces</option>
            {[...new Set(allAnimals.map(a => a.espece))].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="Présent">Présent</option>
            <option value="Vendu">Vendu</option>
            <option value="Décédé">Décédé</option>
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="">Tous les enclos</option>
            {enclosures.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <h2>Liste des Animaux</h2>
      {paginatedAnimals.length === 0 ? (
        <p>Aucun animal trouvé. <Link to="/add">Ajoutez-en un !</Link></p>
      ) : (
        <>
          <ul className="animal-list">
            {paginatedAnimals.map(animal => (
              <li key={animal.id}>
                <Link to={`/animal/${animal.id}`} className="animal-list-item">
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <img
                      src={animal.photoURL || 'https://via.placeholder.com/50'}
                      alt={animal.nom}
                      style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover'}}
                    />
                    <div>
                      <strong>{animal.nom}</strong> ({animal.espece})
                      <br/>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>{animal.statut}</span>
                    </div>
                  </div>
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
