import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAnimals } from '../queries/useAnimals';
import { useDashboardStats } from '../queries/useDashboardStats';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaPlus, FaSyringe, FaExchangeAlt, FaExclamationTriangle, FaBell, FaBoxOpen } from 'react-icons/fa';

// --- Reusable Components ---
const Widget = ({ title, children }) => (
  <div style={styles.widget}>
    <h3 style={styles.widgetTitle}>{title}</h3>
    {children}
  </div>
);

const StatCard = ({ value, label, style }) => (
  <div style={{...styles.statCard, ...style}}>
    <div style={styles.statValue}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);


const QuickAccessButton = ({ to, icon, label }) => (
    <Link to={to} style={styles.quickAccessButton}>
        {icon}
        <span>{label}</span>
    </Link>
);

// --- Placeholder Widgets ---
const AlertsAndTasksWidget = () => {
    // Placeholder data
    const alerts = [
        { text: 'Mise bas de Blanquette prévue dans 5 jours', type: 'info', icon: <FaBell /> },
        { text: 'Vaccination de Grosminet à faire cette semaine', type: 'warning', icon: <FaExclamationTriangle /> },
        { text: 'Stock de foin faible', type: 'critical', icon: <FaBoxOpen /> },
    ];

    const alertStyles = {
        info: { color: '#1967d2', backgroundColor: '#e8f0fe' },
        warning: { color: '#f9ab00', backgroundColor: '#fff8e1' },
        critical: { color: '#d93025', backgroundColor: '#fce8e6' },
    };

    return (
        <Widget title="Alertes et Tâches Urgentes">
            <div style={styles.alertsContainer}>
                {alerts.map((alert, index) => (
                    <div key={index} style={{...styles.alertItem, ...alertStyles[alert.type]}}>
                        <span style={styles.alertIcon}>{alert.icon}</span>
                        <span>{alert.text}</span>
                    </div>
                ))}
            </div>
        </Widget>
    );
};
const QuickAccessWidget = () => (
    <Widget title="Accès Rapide">
        <div style={styles.quickAccessContainer}>
            <QuickAccessButton to="/add" icon={<FaPlus size={20} />} label="Ajouter un Animal" />
            <QuickAccessButton to="/health" icon={<FaSyringe size={20} />} label="Enregistrer un Soin" />
            <QuickAccessButton to="/movements" icon={<FaExchangeAlt size={20} />} label="Noter un Déplacement" />
        </div>
    </Widget>
);

const KeyStatsWidget = ({ stats }) => {
    const presentCount = stats?.byStatus?.['Présent'] ?? 0;
    // This is a placeholder, will need to be calculated properly later
    const birthsThisMonth = 0;
    const departuresThisMonth = 0;

    return (
        <Widget title="Statistiques Clés">
            <div style={styles.statCardContainer}>
                <StatCard value={presentCount} label="Animaux Présents" />
                <StatCard value={`+${birthsThisMonth}`} label="Naissances ce mois-ci" style={{color: '#4CAF50'}} />
                <StatCard value={`${departuresThisMonth}`} label="Ventes/Décès ce mois-ci" style={{color: '#F44336'}}/>
            </div>
        </Widget>
    );
};

const DistributionChartsWidget = ({ stats }) => {
    const speciesData = Object.entries(stats?.bySpecies ?? {}).map(([name, value]) => ({ name, value }));
    const statusData = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({ name, value }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

    const renderChart = (data, title) => (
        <div style={{ flex: 1, minWidth: '200px' }}>
            <h4 style={{textAlign: 'center'}}>{title}</h4>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <Widget title="Répartition">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {renderChart(speciesData, 'Par Espèce')}
                {renderChart(statusData, 'Par Statut')}
            </div>
        </Widget>
    );
};
const AnimalFilters = ({ filters, setFilters, enclosures, species }) => {
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Widget title="Filtres et Recherche">
            <div style={styles.filtersContainer}>
                <input
                    type="text"
                    name="searchTerm"
                    placeholder="Rechercher un nom..."
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    style={styles.filterInput}
                />
                <select name="speciesFilter" value={filters.speciesFilter} onChange={handleFilterChange} style={styles.filterSelect}>
                    <option value="">Toutes les espèces</option>
                    {species?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="statusFilter" value={filters.statusFilter} onChange={handleFilterChange} style={styles.filterSelect}>
                    <option value="">Tous les statuts</option>
                    <option value="Présent">Présent</option>
                    <option value="Vendu">Vendu</option>
                    <option value="Décédé">Décédé</option>
                </select>
                <select name="locationFilter" value={filters.locationFilter} onChange={handleFilterChange} style={styles.filterSelect}>
                    <option value="">Tous les enclos</option>
                    {enclosures?.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>
        </Widget>
    );
};

const getAge = (dateString) => {
    if (!dateString) return '';
    const birthDate = new Date(dateString.toDate ? dateString.toDate() : dateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }
    return `${years} an${years > 1 ? 's' : ''}, ${months} mois`;
};

const AnimalList = ({ animals, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage }) => {
    const statusColors = {
        'Présent': '#4CAF50', // green
        'Vendu': '#FFC107',   // amber
        'Décédé': '#F44336', // red
    };

    return (
        <Widget title={`Liste des Animaux (${animals.length})`}>
            <ul style={{listStyle: 'none', padding: 0}}>
                {animals.map(animal => (
                    <li key={animal.id} style={styles.animalListItem}>
                        <Link to={`/animal/${animal.id}`} style={styles.animalLink}>
                            <img
                                src={animal.photoURL || 'https://via.placeholder.com/60'}
                                alt={animal.nom}
                                style={styles.animalPhoto}
                            />
                            <div style={styles.animalInfo}>
                                <strong>{animal.nom}</strong> ({animal.espece} - {animal.sexe})
                                <div style={styles.animalSubInfo}>
                                    <span>Enclos: {animal.enclos || 'N/A'}</span>
                                    <span>Âge: {getAge(animal.date_naissance)}</span>
                                </div>
                            </div>
                            <div style={{...styles.statusIndicator, backgroundColor: statusColors[animal.statut] ?? '#9E9E9E'}}>
                                {animal.statut}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            {hasNextPage && (
                <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} style={styles.loadMoreButton}>
                    {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                </button>
            )}
        </Widget>
    );
};

const HomePage = () => {
  const [filters, setFilters] = useState({ searchTerm: '', speciesFilter: '', statusFilter: '', locationFilter: '' });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(filters.searchTerm), 500);
    return () => clearTimeout(handler);
  }, [filters.searchTerm]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isLoadingAnimals
  } = useAnimals({ ...filters, searchTerm: debouncedSearchTerm });

  const { data: stats, isLoading: isLoadingStats, error: errorStats } = useDashboardStats();

  const { data: enclosures } = useQuery({
    queryKey: ['enclosures'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'enclos'));
      return snapshot.docs.map(d => d.data().name);
    }
  });

  if (isLoadingAnimals || isLoadingStats) {
    return <p>Chargement du tableau de bord...</p>;
  }

  if (error || errorStats) {
    return <p>Une erreur est survenue: {error?.message || errorStats?.message}</p>;
  }

  const animals = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Tableau de Bord</h1>
      </header>

      <main style={styles.mainGrid}>
        {/* Colonne 1: Actions & Alertes */}
        <div style={styles.column}>
          <AlertsAndTasksWidget />
          <QuickAccessWidget />
        </div>

        {/* Colonne 2: Vue d'ensemble */}
        <div style={styles.column}>
          <KeyStatsWidget stats={stats} />
          <DistributionChartsWidget stats={stats} />
        </div>
      </main>

      {/* Section Principale: Liste des Animaux */}
      <section style={styles.fullWidthSection}>
        <AnimalFilters
          filters={filters}
          setFilters={setFilters}
          enclosures={enclosures}
          species={stats ? Object.keys(stats.bySpecies) : []}
        />
        <AnimalList
          animals={animals}
          isFetching={isFetching}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </section>
    </div>
  );
};

// --- Styles ---
const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#f4f7f6',
  },
  header: {
    marginBottom: '1rem',
  },
  mainGrid: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  fullWidthSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  widget: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  widgetTitle: {
    marginBottom: '1rem',
    fontSize: '1.2rem',
    color: '#333',
  },
  statCardContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '1rem',
  },
  statCard: {
    flex: 1,
    textAlign: 'center',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
  },
  quickAccessContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  quickAccessButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#e8f0fe',
    color: '#1967d2',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  alertsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontWeight: '500',
  },
  alertIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  filtersContainer: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterInput: {
    flex: 1,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
  },
  filterSelect: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    minWidth: '150px',
  },
  animalListItem: {
    borderBottom: '1px solid #eee',
  },
  animalLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    textDecoration: 'none',
    color: 'inherit',
  },
  animalPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  animalInfo: {
    flex: 1,
  },
  animalSubInfo: {
    display: 'flex',
    gap: '1rem',
    color: '#666',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  statusIndicator: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  loadMoreButton: {
    width: '100%',
    padding: '1rem',
    marginTop: '1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1967d2',
    color: 'white',
    cursor: 'pointer',
  },
};

export default HomePage;
