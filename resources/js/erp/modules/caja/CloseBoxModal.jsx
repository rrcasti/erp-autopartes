import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const CloseBoxModal = ({ isOpen, onClose, onSuccess, cashRegister }) => {
    const [realBalance, setRealBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const expected = cashRegister ? parseFloat(cashRegister.totals.expected_end) : 0;
    const currentReal = parseFloat(realBalance) || 0;
    const difference = currentReal - expected;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cashRegister) return;
        
        setLoading(true);
        setError(null);

        try {
            await axios.post('/erp/api/cash/close', {
                cash_register_id: cashRegister.id,
                real_balance: currentReal
            });
            onSuccess();
            onClose();
            setRealBalance('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cerrar la caja');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !cashRegister) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cerrar Caja (Arqueo)</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Cuenta el dinero físico y confirma el cierre.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Saldo Sistema</span>
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                ${expected.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border ${
                            difference === 0 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                        }`}>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Diferencia</span>
                            <div className={`text-2xl font-bold ${
                                difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                                {difference > 0 ? '+' : ''}
                                ${difference.toLocaleString('es-AR', {minimumFractionDigits: 2})}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Saldo Real (Conte de dinero)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full pl-7 pr-3 py-3 bg-white dark:bg-black border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-lg font-mono"
                                placeholder="0.00"
                                value={realBalance}
                                onChange={(e) => setRealBalance(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Ingresa la cantidad exacta de dinero que tienes en la caja.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || realBalance === ''}
                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
                        >
                            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
