import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SoldTodayPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = () => {
        setLoading(true);
        fetch('/erp/api/inventory/sold-today')
            .then(r => r.json())
            .then(res => setItems(res.data || []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleCreateRequisition = () => {
        // Redirigimos al panel de gestión de RUNS
        navigate('/inventario/reposicion');
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ventas del Día</h1>
                    <p className="text-sm text-slate-500">Listado de productos con movimiento de salida hoy.</p>
                </div>
                <button 
                    onClick={handleCreateRequisition}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow font-medium text-sm flex items-center gap-2"
                    disabled={items.length === 0}
                >
                    📝 Generar Reposición Automática
                </button>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow overflow-auto border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Hora</th>
                            <th className="px-6 py-3">Comprobante</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3">Marca</th>
                            <th className="px-6 py-3 text-right">Cant.</th>
                            <th className="px-6 py-3 text-right">Stock</th>
                            <th className="px-6 py-3">Proveedor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                         {loading ? <tr><td colSpan="8" className="p-4 text-center">Cargando...</td></tr> : 
                          items.length === 0 ? <tr><td colSpan="8" className="p-12 text-center text-slate-400">No se registraron ventas hoy.</td></tr> :
                          items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                  <td className="px-6 py-3 text-xs text-slate-500">{it.time}</td>
                                  <td className="px-6 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">{it.sale_receipt}</td>
                                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{it.sku}</td>
                                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-gray-100">{it.product_name}</td>
                                  <td className="px-6 py-3 text-xs uppercase">{it.brand_name}</td>
                                  <td className="px-6 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{it.sold_qty}</td>
                                  <td className="px-6 py-3 text-right font-mono text-slate-600">{it.current_stock}</td>
                                  <td className="px-6 py-3 text-sm text-slate-500">{it.supplier_name || '-'}</td>
                              </tr>
                          ))
                         }
                    </tbody>
                </table>
            </div>
        </div>
    );
};
