import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('dani-lms-theme');
    if (saved === 'theme-light' || saved === 'theme-crystal-white') return 'theme-light';
    if (saved === 'theme-red-black' || saved === 'theme-royal-gold') return 'theme-red-black';
    return 'theme-dark'; // default for theme-red-eclipse or anything else
  };

  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    localStorage.setItem('dani-lms-theme', theme);
    document.body.className = theme;
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
