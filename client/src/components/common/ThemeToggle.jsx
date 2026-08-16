import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg border transition-all flex items-center justify-center text-sm shadow-sm ${
        isDark
          ? 'bg-gray-800 border-gray-700 text-amber-300 hover:bg-gray-700 hover:text-amber-200'
          : 'bg-white border-gray-200 text-indigo-600 hover:bg-gray-100 hover:text-indigo-700'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400" />
      ) : (
        <Moon size={17} className="text-indigo-600" />
      )}
    </button>
  );
}
