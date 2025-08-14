import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import { useAnimals } from '../queries/useAnimals';
import { useDashboardStats } from '../queries/useDashboardStats';
import SpeciesPieChart from '../components/charts/SpeciesPieChart';
import BirthsBarChart from '../components/charts/BirthsBarChart';

const StatCard = ({ title, value }) => (
  <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
    <h2 style={{ margin: 0, fontSize: '2rem' }}>{value}</h2>
    <p style={{ margin: 0, color: '#666' }}>{title}</p>
  </div>
);

const HomePage = () => {
  // Filters state
  const [filters, setFilters] = useState({
    searchTerm: '',
    speciesFilter: '',
    statusFilter: '',
    locationFilter: '',
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.searchTerm]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading
  } = useAnimals({ ...filters, searchTerm: debouncedSearchTerm });

  const { data: stats } = useDashboardStats();

  const { data: enclosures } = useQuery({
    queryKey: ['enclosures'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'enclos'));
      return snapshot.docs.map(d => d.data().name);
    }
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const animals = data?.pages.flatMap(page => page.data) ?? [];

  if (isLoading) {
    return <p>Chargement du tableau de bord...</p>;
  }

  if (error) {
    return <p>Erreur: {error.message}</p>
  }

  return (
    <div>
      <h1>Tableau de Bord</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Total d'animaux" value={stats?.total ?? 0} />
        {stats?.bySpecies && Object.entries(stats.bySpecies).map(([species, count]) => (
          <StatCard key={species} title={species} value={count} />
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Statuts</h3>
        {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
          <p key={status}><strong>{status}:</strong> {count}</p>
        ))}
      </div>

      <div className="card" style={{display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem'}}>
        <div style={{flex: 1, minWidth: '300px'}}><SpeciesPieChart stats={stats} /></div>
        <div style={{flex: 1, minWidth: '400px'}}><BirthsBarChart animals={animals} /></div>
      </div>

      <div className="card">
        <h3>Filtres et Recherche</h3>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <input
            type="text"
            name="searchTerm"
            placeholder="Rechercher par nom..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            style={{flex: 1}}
          />
          <select name="speciesFilter" value={filters.speciesFilter} onChange={handleFilterChange}>
            <option value="">Toutes les espèces</option>
            {[...new Set(animals?.map(a => a.espece) ?? [])].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="statusFilter" value={filters.statusFilter} onChange={handleFilterChange}>
            <option value="">Tous les statuts</option>
            <option value="Présent">Présent</option>
            <option value="Vendu">Vendu</option>
            <option value="Décédé">Décédé</option>
          </select>
          <select name="locationFilter" value={filters.locationFilter} onChange={handleFilterChange}>
            <option value="">Tous les enclos</option>
            {enclosures?.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <h2>Liste des Animaux {isFetching && !isFetchingNextPage && '(Mise à jour...)'}</h2>
      {animals.length === 0 && !isFetching ? (
        <p>Aucun animal trouvé pour ces filtres. <Link to="/add">Ajoutez-en un !</Link></p>
      ) : (
        <>
          <ul className="animal-list">
            {animals.map(animal => (
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
          {hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
