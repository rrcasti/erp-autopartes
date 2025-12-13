import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

export const TopBar = ({ onToggleSidebar, onShowHelp }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const themeLabel =
        theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Sistema';

    return (
        <header className="h-12 flex items-center justify-between px-4 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="p-1 rounded hover:bg-slate-100 focus:outline-none dark:hover:bg-slate-800"
                    title="Mostrar/ocultar menú"
                >
                    ☰
                </button>
                <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm tracking-wide">
                        RepuestosKm21 ERP
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {location.pathname}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Búsqueda global (placeholder por ahora) */}
                <input
                    type="text"
                    placeholder="Buscar en el ERP (Ctrl + K)..."
                    className="hidden md:block text-xs bg-slate-100 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-500/30 focus:border-blue-500 w-64 dark:bg-slate-800 dark:border-slate-600"
                />

                {/* Botón ayuda */}
                <button
                    onClick={onShowHelp}
                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                    title="Ver atajos de teclado (F1)"
                >
                    ?
                </button>

                {/* Botón tema */}
                <button
                    onClick={toggleTheme}
                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                    title="Cambiar tema claro/oscuro"
                >
                    {themeLabel}
                </button>

                {/* Usuario actual (placeholder) */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Usuario</span>
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-[10px] text-white">
                        U
                    </span>
                </div>
            </div>
        </header>
    );
};
