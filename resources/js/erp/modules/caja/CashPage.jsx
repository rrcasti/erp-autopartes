import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { OpenBoxModal } from './OpenBoxModal';
import { CloseBoxModal } from './CloseBoxModal';
import { CashDashboard } from './CashDashboard';
import { CashMovementsTab } from './CashMovementsTab';
import { CashSalesTab } from './CashSalesTab';
import { CashHistory } from './CashHistory';
import { CashDetailView } from './CashDetailView';

export const CashPage = () => {
    const [cashRegister, setCashRegister] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('movements');
    
    // Navigation State
    const [view, setView] = useState('main'); // 'main', 'history', 'detail'
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);

    // Modals
    const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const fetchCurrentCash = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/erp/api/cash/current');
            setCashRegister(res.data.data); // data can be null if closed
        } catch (error) {
            console.error("Error fetching cash register:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'main') fetchCurrentCash();
    }, [view]);

    const handleRefresh = () => {
        fetchCurrentCash();
    };

    if (view === 'history') {
        return (
            <CashHistory 
                onBack={() => setView('main')} 
                onViewDetail={(id) => {
                    setSelectedHistoryId(id);
                    setView('detail');
                }}
            />
        );
    }

    if (view === 'detail' && selectedHistoryId) {
        return (
            <CashDetailView 
                registerId={selectedHistoryId} 
                onBack={() => setView('history')} 
            />
        );
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // View: Closed Box (Initial State)
    if (!cashRegister) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-100 dark:border-slate-700">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🔒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        La Caja está Cerrada
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Debes abrir la caja para comenzar a registrar operaciones de venta y movimientos de dinero.
                    </p>
                    <button
                        onClick={() => setIsOpenModalOpen(true)}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02]"
                    >
                        Abrir Nueva Caja
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                            onClick={() => setView('history')}
                        >
                            Ver Historial de Cajas Cerradas
                        </button>
                    </div>
                </div>

                <OpenBoxModal 
                    isOpen={isOpenModalOpen}
                    onClose={() => setIsOpenModalOpen(false)}
                    onSuccess={(newRegister) => setCashRegister(newRegister)}
                />
            </div>
        );
    }

    // View: Open Box (Dashboard)
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
           {/* Header & Dashboard */}
           <div className="bg-white dark:bg-slate-900 shadow-sm z-10">
               <CashDashboard cashRegister={cashRegister} />
               
               {/* Controls Bar */}
               <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('movements')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'movements'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Movimientos
                        </button>
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'sales'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Ventas ({cashRegister.totals.sales_count})
                        </button>
                    </div>

                    <div className="flex gap-2">
                         <button 
                            onClick={handleRefresh}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            title="Actualizar datos"
                        >
                            ↻
                        </button>
                        <button
                            onClick={() => setIsCloseModalOpen(true)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            Cerrar Caja
                        </button>
                    </div>
               </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 overflow-auto">
               {activeTab === 'movements' && (
                   <CashMovementsTab 
                        registerId={cashRegister.id} 
                        onMovementCreated={handleRefresh} 
                   />
               )}
               {activeTab === 'sales' && (
                   <CashSalesTab registerId={cashRegister.id} />
               )}
           </div>

           <CloseBoxModal 
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                cashRegister={cashRegister}
                onSuccess={() => {
                    handleRefresh(); // Should fetch and see it's null now? Not exactly, setCashRegister(null) manually is faster but refresh is safer.
                    setCashRegister(null);
                }}
           />
        </div>
    );
};
