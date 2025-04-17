import React from 'react';
import { Sun, Moon, Square, Circle, Pencil, Type, MousePointer2 } from 'lucide-react';

const tools = [
  { name: 'Select', icon: MousePointer2, shortcut: 'S' },
  { name: 'Rectangle', icon: Square, shortcut: 'R' },
  { name: 'Circle', icon: Circle, shortcut: 'C' },
  { name: 'Pencil', icon: Pencil, shortcut: 'P' },
  { name: 'Text', icon: Type, shortcut: 'T' }
];

const Navbar = ({ isDarkMode, toggleTheme, activeTool, setActiveTool }) => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 dark:bg-zinc-900/50 backdrop-blur-md border border-white/20 dark:border-zinc-800/20 shadow-lg">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold bg-gradient-to-r from-[#f54a00] to-orange-500 bg-clip-text text-transparent">
            KD
          </span>
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mx-2" />
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => setActiveTool(tool.name.toLowerCase())}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activeTool === tool.name.toLowerCase()
                  ? 'bg-[#f54a00]/20 text-[#f54a00]'
                  : 'hover:bg-gray-200/50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-gray-300'
              }`}
              title={`${tool.name} (${tool.shortcut})`}
            >
              <tool.icon size={20} />
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mx-2" />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-gray-300"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Navbar; 