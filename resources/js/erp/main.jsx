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

const ErpRoutes = () => (
    <LayoutShell>
        <Routes>
            {/* Redirigir /erp a /erp/dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Parámetros -> Apariencia */}
            <Route path="/parametros" element={<ParamSettingsPage />} />

            {/* aquí después sumamos productos, proveedores, etc. */}
            {/* Productos */}
            <Route path="/productos" element={<ProductosListPage />} />

            {/* Mostrador (Nuevo) */}
            <Route path="/mostrador/*" element={<MostradorPage />} />
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
