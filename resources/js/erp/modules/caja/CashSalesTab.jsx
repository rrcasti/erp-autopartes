import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const CashSalesTab = ({ registerId }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            setLoading(true);
            // We fetch movements that HAVE a sale, which acts as our link
            const res = await axios.get(`/erp/api/cash/${registerId}/movements?has_sale=true`);
            setSales(res.data.data);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (registerId) fetchSales();
    }, [registerId]);

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Ventas Registradas en esta Caja</h3>
            
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium">Hora</th>
                            <th className="px-4 py-3 font-medium"># Venta</th>
                            <th className="px-4 py-3 font-medium">Cliente</th>
                            <th className="px-4 py-3 font-medium">Método Pago</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {loading ? (
                             <tr><td colSpan="6" className="p-4 text-center">Cargando...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan="6" className="p-4 text-center text-slate-500">No hay ventas registradas en esta apertura.</td></tr>
                        ) : (
                            sales.map(m => {
                                const sale = m.sale;
                                if (!sale) return null; // Should not happen given has_sale=true

                                return (
                                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(sale.fecha).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                            {sale.observaciones || `#${sale.id}`}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {sale.customer ? sale.customer.nombre : 'Consumidor Final'}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                                            {sale.medio_pago}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">
                                            ${parseFloat(sale.total_final).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <a 
                                                href={`/erp/pos/print/${sale.id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-semibold"
                                            >
                                                Ver Comprobante
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
