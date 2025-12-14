import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const CashHistory = ({ onBack, onViewDetail }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/erp/api/cash/history', { params: filters });
            setHistory(res.data.data); // Pagination data is in res.data, data items in res.data.data
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [filters]);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        ← Volver
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historial de Cajas</h2>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="date" 
                        value={filters.from}
                        onChange={e => setFilters({...filters, from: e.target.value})}
                        className="px-3 py-1 text-sm border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    <input 
                        type="date" 
                        value={filters.to}
                        onChange={e => setFilters({...filters, to: e.target.value})}
                        className="px-3 py-1 text-sm border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Apertura</th>
                                <th className="px-6 py-4">Cierre</th>
                                <th className="px-6 py-4 text-right">Saldo Inicial</th>
                                <th className="px-6 py-4 text-right">Saldo Final (Teórico)</th>
                                <th className="px-6 py-4 text-right">Saldo Real</th>
                                <th className="px-6 py-4 text-right">Diferencia</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center">Cargando...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron cajas cerradas en este rango.</td></tr>
                            ) : (
                                history.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(item.opened_at).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {item.closed_at ? new Date(item.closed_at).toLocaleString('es-AR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            ${parseFloat(item.start_balance).toLocaleString('es-AR', {minimumFractionDigits:2})}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            ${parseFloat(item.end_balance).toLocaleString('es-AR', {minimumFractionDigits:2})}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-200">
                                            ${parseFloat(item.real_balance).toLocaleString('es-AR', {minimumFractionDigits:2})}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${
                                            parseFloat(item.difference) === 0 ? 'text-green-500' : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                            {parseFloat(item.difference) > 0 ? '+' : ''}
                                            ${parseFloat(item.difference).toLocaleString('es-AR', {minimumFractionDigits:2})}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => onViewDetail(item.id)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
