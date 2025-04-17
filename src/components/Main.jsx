import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Canvas from './Canvas';

const Main = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTool, setActiveTool] = useState('select');

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update document class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toUpperCase();
      switch (key) {
        case 'P':
          setActiveTool('pencil');
          break;
        case 'R':
          setActiveTool('rectangle');
          break;
        case 'C':
          setActiveTool('circle');
          break;
        case 'T':
          setActiveTool('text');
          break;
        case 'S':
          setActiveTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-900 transition-colors duration-300">
      <div className="fixed top-0 left-0 right-0 h-16 z-50">
        <Navbar 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          activeTool={activeTool}
          setActiveTool={setActiveTool}
        />
      </div>
      <div className="pt-20 h-[calc(100vh-80px)]">
        <Canvas activeTool={activeTool} />
      </div>
    </div>
  );
};

export default Main; 