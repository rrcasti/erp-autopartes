import '../../css/app.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from './core/ThemeContext';
import { LayoutShell } from './core/LayoutShell';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { ParamSettingsPage } from './modules/parametros/ParamSettingsPage'; // nueva página de parámetros
import { ProductosListPage } from './modules/productos/ProductosListPage';
import { MostradorPage } from './modules/mostrador/MostradorPage';
import { StockPage } from './modules/stock/StockPage';
import { PurchasesModulePage } from './modules/compras/PurchasesModulePage';
import { SoldTodayPage } from './modules/inventario/SoldTodayPage';
import { ReplenishmentPage } from './modules/inventario/ReplenishmentPage';

const Placeholder = ({ title }) => (
    <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm mt-2 opacity-75">Módulo en desarrollo</p>
        </div>
    </div>
);

const ErpRoutes = () => (
    <LayoutShell>
        <Routes>
            {/* Redirigir /erp a /erp/dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Parámetros -> Apariencia */}
            <Route path="/parametros" element={<ParamSettingsPage />} />

            {/* Productos */}
            <Route path="/productos" element={<ProductosListPage />} />

            {/* Mostrador */}
            <Route path="/mostrador/*" element={<MostradorPage />} />

            {/* Gestión Actual de Stock */}
            <Route path="/stock" element={<StockPage />} />
            <Route path="/inventario/vendido-hoy" element={<SoldTodayPage />} />
            <Route path="/inventario/reposicion" element={<ReplenishmentPage />} />

            {/* Compras */}
            <Route path="/compras/*" element={<PurchasesModulePage />} />

            {/* Rutas Placeholder para secciones futuras */}
            <Route path="/clientes" element={<Placeholder title="Clientes y Talleres" />} />
            <Route path="/cuentas-corrientes" element={<Placeholder title="Cuentas Corrientes" />} />
            <Route path="/caja" element={<Placeholder title="Caja y Gastos" />} />
            
            {/* Catch-all para sub-rutas no definidas */}
            <Route path="*" element={<Placeholder title="Página No Encontrada" />} />
        </Routes>
    </LayoutShell>
);

const ErpApp = () => {
    return (
        <ThemeProvider>
            <BrowserRouter basename="/erp">
                <ErpRoutes />
            </BrowserRouter>
        </ThemeProvider>
    );
};

const rootElement = document.getElementById('erp-root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ErpApp />
        </React.StrictMode>
    );
}
