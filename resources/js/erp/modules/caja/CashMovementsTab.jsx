import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const CashMovementsTab = ({ registerId, onMovementCreated }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // New movement state
    const [newType, setNewType] = useState('expense');
    const [newAmount, setNewAmount] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [submitting, setSubmitting] = useState(false);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/erp/api/cash/${registerId}/movements`);
            setMovements(res.data.data);
        } catch (error) {
            console.error("Error fetching movements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (registerId) fetchMovements();
    }, [registerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/erp/api/cash/movements', {
                cash_register_id: registerId,
                type: newType,
                amount: parseFloat(newAmount),
                payment_method: paymentMethod,
                description: newDesc
            });
            setShowAddForm(false);
            setNewAmount('');
            setNewDesc('');
            fetchMovements();
            if (onMovementCreated) onMovementCreated(); // Refresh dashboard totals
        } catch (error) {
            alert('Error al crear movimiento: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Ultimos Movimientos</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                >
                    {showAddForm ? 'Cancelar' : '+ Nuevo Movimiento'}
                </button>
            </div>

            {/* Inline Add Form */}
            {showAddForm && (
                <div className="mb-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Registrar Movimiento Manual</h4>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Tipo</label>
                            <select 
                                value={newType} 
                                onChange={e => setNewType(e.target.value)}
                                className="w-full text-sm px-2 py-2 rounded border bg-white dark:bg-black dark:border-slate-700 dark:text-white"
                            >
                                <option value="expense">Egreso (Gasto/Retiro)</option>
                                <option value="income">Ingreso (Aporte)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Monto</label>
                            <input 
                                type="number" step="0.01" min="0" required 
                                value={newAmount} 
                                onChange={e => setNewAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full text-sm px-2 py-2 rounded border bg-white dark:bg-black dark:border-slate-700 dark:text-white"
                            />
                        </div>
                         <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Método</label>
                            <select 
                                value={paymentMethod} 
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full text-sm px-2 py-2 rounded border bg-white dark:bg-black dark:border-slate-700 dark:text-white"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="tarjeta">Tarjeta</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Descripción</label>
                            <input 
                                type="text" required 
                                value={newDesc} 
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="Motivo..."
                                className="w-full text-sm px-2 py-2 rounded border bg-white dark:bg-black dark:border-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm"
                            >
                                {submitting ? '...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Hora</th>
                            <th className="px-4 py-3 font-medium">Tipo</th>
                            <th className="px-4 py-3 font-medium">Descripción</th>
                            <th className="px-4 py-3 font-medium">Ref. Venta</th>
                            <th className="px-4 py-3 font-medium text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {loading ? (
                             <tr><td colSpan="5" className="p-4 text-center">Cargando...</td></tr>
                        ) : movements.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-slate-500">No hay movimientos registrados.</td></tr>
                        ) : (
                            movements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-slate-500">
                                        {new Date(m.created_at).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            m.type === 'income' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {m.type === 'income' ? 'Ingreso' : 'Egreso'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {m.description}
                                        <div className="text-xs text-slate-400">{m.payment_method}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                        {m.sale_id ? `#${m.sale_id}` : '-'}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${
                                        m.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {m.type === 'income' ? '+' : '-'}
                                        ${parseFloat(m.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
