import React, { useState } from 'react';
import axios from 'axios';

export const OpenBoxModal = ({ isOpen, onClose, onSuccess }) => {
    const [startBalance, setStartBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('/erp/api/cash/open', {
                start_balance: parseFloat(startBalance) || 0
            });
            onSuccess(res.data.data);
            onClose();
            setStartBalance('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al abrir la caja');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Abrir Caja Diaria</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Ingresa el saldo inicial para comenzar las operaciones.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Saldo Inicial Efectivo ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            placeholder="0.00"
                            value={startBalance}
                            onChange={(e) => setStartBalance(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || startBalance === ''}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
                        >
                            {loading ? 'Abriendo...' : 'Abrir Caja'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
