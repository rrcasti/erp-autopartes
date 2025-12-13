import React from 'react';

export const SaleTab = ({ tab }) => {
    return (
        <div className="p-6 text-slate-200">
            <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>
            <p>ID Pestaña: {tab.id}</p>
            <div className="mt-8 p-4 border border-dashed border-slate-700 rounded-lg">
                <p className="text-center text-slate-500">
                    Aquí irá el formulario de ventas: buscador de productos, tabla de ítems y totales.
                </p>
            </div>
        </div>
    );
};
