import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { ThemeContext } from './context/ThemeContext';
import ThemeToggleButton from './components/ThemeToggleButton';
import OfflineIndicator from './components/OfflineIndicator';

import HomePage from './pages/HomePage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import AddAnimalPage from './pages/AddAnimalPage';
import EditAnimalPage from './pages/EditAnimalPage';
import EnclosuresPage from './pages/EnclosuresPage';
import FinancialReportPage from './pages/FinancialReportPage';
import FoodStockPage from './pages/FoodStockPage';
import RationsPage from './pages/RationsPage';
import CalendarPage from './pages/CalendarPage';


function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`theme-${theme}`}>
      <OfflineIndicator />
      <nav>
        <ul style={{position: 'relative'}}>
          <li>
            <Link to="/">Tableau de Bord</Link>
          </li>
          <li>
            <Link to="/calendar">Calendrier & Tâches</Link>
          </li>
          <li>
            <Link to="/add">Ajouter un Animal</Link>
          </li>
          <li>
            <Link to="/enclosures">Gérer les Enclos</Link>
          </li>
          <li>
            <Link to="/stock/food">Gestion du Stock</Link>
          </li>
          <li>
            <Link to="/rations">Gestion des Rations</Link>
          </li>
          <li>
            <Link to="/reports/financial">Rapport Financier</Link>
          </li>
          <li style={{position: 'absolute', right: 0}}>
            <ThemeToggleButton />
          </li>
        </ul>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/animal/:id" element={<AnimalDetailPage />} />
          <Route path="/animal/:id/edit" element={<EditAnimalPage />} />
          <Route path="/add" element={<AddAnimalPage />} />
          <Route path="/enclosures" element={<EnclosuresPage />} />
          <Route path="/reports/financial" element={<FinancialReportPage />} />
          <Route path="/stock/food" element={<FoodStockPage />} />
          <Route path="/rations" element={<RationsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
