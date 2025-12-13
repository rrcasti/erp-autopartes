import React from 'react';
import { NavLink } from 'react-router-dom';

const menuSections = [
    {
        title: 'Operación',
        items: [
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/mostrador', label: 'Mostrador' },
            { to: '/productos', label: 'Productos' },
            { to: '/clientes', label: 'Clientes & Talleres' },
            { to: '/cuentas-corrientes', label: 'Cuentas Corrientes' },
            { to: '/compras', label: 'Compras' },
            { to: '/stock', label: 'Stock' },
            { to: '/caja-gastos', label: 'Caja & Gastos' },
        ],
    },
    {
        title: 'Configuración',
        items: [
            { to: '/catalogo', label: 'Catálogo' },
            { to: '/proveedores', label: 'Proveedores' },
            { to: '/listas-precios', label: 'Listas de Precios' },
            { to: '/usuarios', label: 'Usuarios & Roles' },
            { to: '/parametros', label: 'Parámetros' },
            { to: '/integraciones', label: 'Integraciones' },
        ],
    },
];

export const Sidebar = ({ open, onToggle }) => {
    const widthClass = open ? 'w-56' : 'w-14';

    return (
        <aside
            className={`${widthClass} h-screen border-r border-slate-200 bg-slate-50 flex flex-col transition-all duration-200 ease-out dark:border-slate-800 dark:bg-slate-950`}
        >
            <div className="h-12 flex items-center justify-between px-2 border-b border-slate-200 dark:border-slate-800">
                {open && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Menú
                    </span>
                )}
                {!open && (
                    <button
                        onClick={onToggle}
                        className="mx-auto text-xs p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Expandir menú"
                    >
                        ☰
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-auto text-xs">
                {menuSections.map((section) => (
                    <div key={section.title} className="mt-2">
                        {open && (
                            <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
                                {section.title}
                            </div>
                        )}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => (
                                <li key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        className={({ isActive }) =>
                                            [
                                                'flex items-center gap-2 px-2 py-1.5 rounded-r',
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                                            ].join(' ')
                                        }
                                        title={open ? undefined : item.label}
                                    >
                                        <span className="w-6 text-center">•</span>
                                        {open && <span>{item.label}</span>}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
};
