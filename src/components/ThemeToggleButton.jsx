import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme} style={{padding: '0.5rem', fontSize: '0.8rem'}}>
      {theme === 'light' ? 'Mode Contraste' : 'Mode Normal'}
    </button>
  );
};

export default ThemeToggleButton;
