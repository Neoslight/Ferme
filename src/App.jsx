import React, { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { ThemeContext } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { auth } from './firebaseConfig';
import ThemeToggleButton from './components/ThemeToggleButton';
import OfflineIndicator from './components/OfflineIndicator';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const AnimalDetailPage = lazy(() => import('./pages/AnimalDetailPage'));
const EditAnimalPage = lazy(() => import('./pages/EditAnimalPage'));
const AddAnimalPage = lazy(() => import('./pages/AddAnimalPage'));
const EnclosuresPage = lazy(() => import('./pages/EnclosuresPage'));
const FinancialReportPage = lazy(() => import('./pages/FinancialReportPage'));
const FoodStockPage = lazy(() => import('./pages/FoodStockPage'));
const RationsPage = lazy(() => import('./pages/RationsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));


function App() {
  const { theme } = useContext(ThemeContext);
  const { currentUser } = useAuth();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className={`theme-${theme}`}>
      <OfflineIndicator />
      {currentUser && (
        <nav>
          <ul style={{position: 'relative'}}>
            <li><Link to="/">Tableau de Bord</Link></li>
            <li><Link to="/calendar">Calendrier & Tâches</Link></li>
            <li><Link to="/add">Ajouter un Animal</Link></li>
            <li><Link to="/enclosures">Gérer les Enclos</Link></li>
            <li><Link to="/stock/food">Gestion du Stock</Link></li>
            <li><Link to="/rations">Gestion des Rations</Link></li>
            <li><Link to="/reports/financial">Rapport Financier</Link></li>
            <li style={{position: 'absolute', right: '150px'}}><ThemeToggleButton /></li>
            <li style={{position: 'absolute', right: 0}}><button onClick={handleLogout}>Déconnexion</button></li>
          </ul>
        </nav>
      )}

      <main>
        <Suspense fallback={<div className="card"><p>Chargement de la page...</p></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/animal/:id" element={<ProtectedRoute><AnimalDetailPage /></ProtectedRoute>} />
          <Route path="/animal/:id/edit" element={<ProtectedRoute><EditAnimalPage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddAnimalPage /></ProtectedRoute>} />
          <Route path="/enclosures" element={<ProtectedRoute><EnclosuresPage /></ProtectedRoute>} />
          <Route path="/reports/financial" element={<ProtectedRoute><FinancialReportPage /></ProtectedRoute>} />
          <Route path="/stock/food" element={<ProtectedRoute><FoodStockPage /></ProtectedRoute>} />
          <Route path="/rations" element={<ProtectedRoute><RationsPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
