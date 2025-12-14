import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

const menuSections = [
    {
        title: 'Operación',
        items: [
            { to: '/dashboard', label: 'Dashboard', permission: 'view_dashboard' },
            { to: '/mostrador', label: 'Mostrador', permission: 'access_pos' },
            { to: '/productos', label: 'Productos', permission: 'view_products' },
            { to: '/clientes', label: 'Clientes & Talleres', permission: 'view_clients' },
            { to: '/cuentas-corrientes', label: 'Cuentas Corrientes', permission: 'view_clients' },
            { to: '/compras', label: 'Compras', permission: 'view_purchases' },
            { to: '/stock', label: 'Stock', permission: 'view_stock' },
            { to: '/caja-gastos', label: 'Caja & Gastos', permission: 'view_reports' }, 
        ],
    },
    {
        title: 'Configuración',
        items: [
            { to: '/catalogo', label: 'Catálogo', permission: 'manage_products' },
            { to: '/proveedores', label: 'Proveedores', permission: 'manage_purchases' },
            { to: '/listas-precios', label: 'Listas de Precios', permission: 'manage_products' },
            { to: '/usuarios', label: 'Usuarios & Roles', permission: 'manage_users' },
            { to: '/parametros', label: 'Parámetros', permission: 'manage_settings' },
            { to: '/integraciones', label: 'Integraciones', permission: 'manage_settings' },
        ],
    },
];

export const Sidebar = ({ open, onToggle }) => {
    const { can, user, loading } = useAuth();
    const widthClass = open ? 'w-56' : 'w-14';
    
    // Safety check: if loading, maybe show skeleton or nothing? 
    // If not user, empty sidebar? 
    // Let's just return what we can. 

    const filterItems = (items) => {
        if (loading || !user) return [];
        return items.filter(item => {
            if (!item.permission) return true; // public
            return can(item.permission);
        });
    };

    return (
        <aside
            className={`${widthClass} h-screen border-r border-slate-200 bg-slate-50 flex flex-col transition-all duration-200 ease-out dark:border-slate-800 dark:bg-slate-950`}
        >
            <div className="h-12 flex items-center justify-between px-2 border-b border-slate-200 dark:border-slate-800">
                {open && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {user ? user.name : 'Cargando...'}
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
                {menuSections.map((section) => {
                    const visibleItems = filterItems(section.items);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.title} className="mt-2">
                            {open && (
                                <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
                                    {section.title}
                                </div>
                            )}
                            <ul className="space-y-0.5">
                                {visibleItems.map((item) => (
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
                    );
                })}
            </nav>
        </aside>
    );
};
