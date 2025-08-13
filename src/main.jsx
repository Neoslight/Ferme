import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';

// We will create these page components shortly
// import HomePage from './pages/HomePage';
// import AnimalDetailPage from './pages/AnimalDetailPage';
// import AddAnimalPage from './pages/AddAnimalPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
