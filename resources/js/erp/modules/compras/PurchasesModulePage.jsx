import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { RequisitionsPage } from './RequisitionsPage';
import { OrdersPage } from './OrdersPage';

export const PurchasesModulePage = () => {
    const location = useLocation();
    
    // Simple helper para tabs
    const TabLink = ({ to, label, exact = false }) => {
        const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
            <Link 
                to={to} 
                className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
                    isActive 
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'
                }`}
            >
                {label}
            </Link>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            {/* Header / Tabs */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                 <div className="flex max-w-2xl mx-auto">
                    <TabLink to="/erp/compras/solicitudes" label="Solicitudes & Reposición" />
                    <TabLink to="/erp/compras/ordenes" label="Órdenes de Compra" />
                 </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <Routes>
                    <Route path="/" element={<Navigate to="solicitudes" replace />} />
                    <Route path="solicitudes" element={<RequisitionsPage />} />
                    <Route path="ordenes" element={<OrdersPage />} />
                </Routes>
            </div>
        </div>
    );
};
