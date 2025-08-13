import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';

import HomePage from './pages/HomePage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import AddAnimalPage from './pages/AddAnimalPage';
import EditAnimalPage from './pages/EditAnimalPage';
import EnclosuresPage from './pages/EnclosuresPage';


function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Liste des Animaux</Link>
          </li>
          <li>
            <Link to="/add">Ajouter un Animal</Link>
          </li>
          <li>
            <Link to="/enclosures">Gérer les Enclos</Link>
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
