import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CashDashboard } from './CashDashboard';
import { CashMovementsTab } from './CashMovementsTab';
import { CashSalesTab } from './CashSalesTab';

export const CashDetailView = ({ registerId, onBack }) => {
    const [cashRegister, setCashRegister] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('movements');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/erp/api/cash/${registerId}`);
                setCashRegister(res.data.data);
            } catch (error) {
                console.error(error);
                alert("No se pudo cargar el detalle de la caja.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [registerId]);

    if (loading || !cashRegister) return <div className="p-8 text-center">Cargando detalle...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    ← Volver
                </button>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Detalle de Caja #{cashRegister.id}
                        <span className="px-2 py-0.5 text-xs rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            Cerrada
                        </span>
                         <a 
                            href={`/erp/api/cash/${cashRegister.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded transition-colors"
                        >
                            🖨️ Imprimir
                        </a>
                    </h2>
                    <p className="text-xs text-slate-500">
                        Cerrada el {new Date(cashRegister.closed_at).toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            <div className="p-6">
                <CashDashboard cashRegister={cashRegister} />
            </div>

            <div className="px-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
                 <button
                    onClick={() => setActiveTab('movements')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'movements'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Movimientos
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'sales'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    Ventas Realizadas
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
                 {activeTab === 'movements' && (
                   <CashMovementsTab registerId={cashRegister.id} />
               )}
               {activeTab === 'sales' && (
                   <CashSalesTab registerId={cashRegister.id} />
               )}
            </div>
        </div>
    );
};
