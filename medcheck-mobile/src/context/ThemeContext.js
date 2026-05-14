import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('darkMode');
        if (stored !== null) {
          setIsDarkMode(stored === 'true');
        } else {
          const colorScheme = Appearance.getColorScheme();
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (e) {
        console.log('Tema yüklenirken hata:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
    } catch (error) {
      console.log('Tema kaydedilirken hata:', error);
    }
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      primary: '#3b82f6',
      danger: '#ef4444',
      cardShadow: '#000000',
    } : {
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#f1f5f9',
      primary: '#1e5c8a',
      danger: '#ef4444',
      cardShadow: '#64748b',
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
