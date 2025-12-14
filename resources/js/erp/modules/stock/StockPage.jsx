import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Tabs = ({ active, onChange, tabs }) => (
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    active === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                {tab.label}
            </button>
        ))}
    </div>
);

const KPICard = ({ title, value, color, onClick, active }) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-lg border ${color} bg-white dark:bg-slate-800 shadow-sm transition-all cursor-pointer ${
            active ? 'ring-2 ring-offset-2 ring-blue-500 transform scale-105' : 'hover:shadow-md'
        }`}
    >
        <div className="text-xs text-slate-500 uppercase font-semibold">{title}</div>
        <div className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{value}</div>
    </div>
);

export const StockPage = () => {
    const [tab, setTab] = useState('balances');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '' | 'critical' | 'low' | 'normal'

    const [stats, setStats] = useState({});
    
    // Fetch estadísticas generales
    const fetchStats = async () => {
        try {
            const res = await fetch('/erp/api/inventory/stats', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const json = await res.json();
                setStats(json);
            }
        } catch (e) {
            console.error("Error cargando stats:", e);
        }
    };

    useEffect(() => {
        // Reset page when filter changes
        fetchData(1);
        if (tab === 'balances') fetchStats();
    }, [tab, search, statusFilter]);
    
    const fetchData = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = tab === 'balances' ? '/erp/api/inventory/balances' : '/erp/api/inventory/movements';
            
            // Build query params
            const params = new URLSearchParams({
                page,
                search,
                ...(statusFilter && { status: statusFilter })
            });

            const res = await fetch(`${endpoint}?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const text = await res.text();
            let json;
            
            try {
                json = JSON.parse(text);
            } catch (e) {
                console.error("Respuesta no válida:", text.substring(0, 100));
                throw new Error(`Error de comunicación con el servidor (${res.status}).`);
            }

            if (!res.ok) {
                throw new Error(json.message || `Error del servidor (${res.status})`);
            }
            
            setData(json.data || []);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Centro de Control de Stock</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestión de existencias, auditoría y alertas.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => fetchData()} 
                        className="px-3 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm font-medium"
                    >
                        🔄 Recargar
                    </button>
                    <Link 
                        to="/inventario/vendido-hoy" 
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium shadow"
                    >
                        Ver Ventas del Día
                    </Link>
                </div>
            </div>

            {tab === 'balances' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <KPICard 
                        title="Total Items" 
                        value={stats.total_items || '-'} 
                        color="border-slate-200" 
                        active={statusFilter === ''}
                        onClick={() => setStatusFilter('')}
                    />
                    <KPICard 
                        title="Stock Crítico" 
                        value={stats.critical_stock || '0'} 
                        color="border-red-200" 
                        active={statusFilter === 'critical'}
                        onClick={() => setStatusFilter('critical')}
                    />
                    <KPICard 
                        title="Por Reponer" 
                        value={stats.to_restock || '0'} 
                        color="border-amber-200" 
                        active={statusFilter === 'low'}
                        onClick={() => setStatusFilter('low')}
                    />
                    <KPICard 
                        title="Valor Inventario" 
                        value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(stats.inventory_value || 0)} 
                        color="border-emerald-200" 
                    />
                </div>
            )}
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <Tabs 
                        active={tab} 
                        onChange={setTab} 
                        tabs={[
                            { id: 'balances', label: 'Existencias Actuales' },
                            { id: 'movements', label: 'Auditoría de Movimientos' }
                        ]} 
                    />
                    <div className="mb-4 flex gap-2 items-center">
                         {statusFilter && (
                             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                                Filtro: {statusFilter === 'critical' ? 'Crítico' : 'Por Reponer'}
                                <button onClick={() => setStatusFilter('')} className="hover:text-blue-800">✕</button>
                             </span>
                         )}
                         <input 
                            type="text" 
                            placeholder="Buscar SKU, nombre..." 
                            className="w-64 px-3 py-1.5 text-sm border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {error ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                        <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-lg border border-red-200">
                            <h3 className="font-bold text-lg mb-2">⚠️ Error de Conexión con Backend</h3>
                            <p className="mb-4">{error}</p>
                            <p className="text-sm opacity-75">
                                Laravel caché las rutas antiguas. Necesitas limpiar la caché para que las nuevas funciones de stock aparezcan.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                                <tr>
                                    {tab === 'balances' ? (
                                        <>
                                            <th className="px-6 py-3">Estado</th>
                                            <th className="px-6 py-3">Producto</th>
                                            <th className="px-6 py-3 text-right">Disponible Real</th>
                                            <th className="px-6 py-3 text-right">Reservado</th>
                                            <th className="px-6 py-3 text-center">Acciones</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3">Cuándo</th>
                                            <th className="px-6 py-3">Producto</th>
                                            <th className="px-6 py-3">Movimiento</th>
                                            <th className="px-6 py-3 text-right">Cantidad</th>
                                            <th className="px-6 py-3 text-right">Saldo Final</th>
                                            <th className="px-6 py-3">Usuario</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                {loading && (
                                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">Cargando datos...</td></tr>
                                )}
                                {!loading && data.length === 0 && (
                                    <tr><td colSpan="6" className="p-12 text-center text-slate-400">No se encontraron registros.</td></tr>
                                )}
                                {!loading && data.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                                        {tab === 'balances' ? (
                                            <>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${Number(row.on_hand) <= 0 ? 'bg-red-500' : Number(row.on_hand) <= 2 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                                    <span className="ml-2 text-xs text-slate-500 capitalize">
                                                        {Number(row.on_hand) <= 0 ? 'Agotado' : Number(row.on_hand) <= 2 ? 'Por Reponer' : 'Normal'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800 dark:text-gray-100">{row.product?.nombre}</div>
                                                    <div className="text-xs font-mono text-slate-500">{row.product?.sku_interno || 'S/N'}</div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={`text-lg font-bold font-mono ${Number(row.on_hand) <= 0 ? 'text-red-500' : ''}`}>{row.on_hand}</span>
                                                    <span className="text-xs text-slate-400 ml-1">unid.</span>
                                                </td>
                                                <td className="px-6 py-3 text-right text-slate-500 font-mono">
                                                    0
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold uppercase tracking-wider px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">
                                                        Ajustar
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(row.happened_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-800 dark:text-gray-200">
                                                    {row.product?.nombre}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-3 text-right font-bold ${row.quantity < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {row.quantity > 0 ? '+' : ''}{row.quantity}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-600">
                                                    {row.qty_after}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-slate-500">
                                                    {row.user?.name || 'Sistema'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
