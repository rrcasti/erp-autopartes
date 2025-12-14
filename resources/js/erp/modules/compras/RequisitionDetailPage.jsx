import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RequisitionDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [req, setReq] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/erp/api/purchases/requisitions/${id}`)
            .then(r => r.json())
            .then(res => {
                if(res.data) setReq(res.data);
                else setReq(res);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [id]);

    const handleCreatePO = () => {
        if(!confirm('¿Generar Orden de Compra ahora? Esto comprometerá el stock pendiente y evitará futuras sugerencias duplicadas.')) return;
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        fetch(`/erp/api/purchase-orders/from-requisition/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token || ''
            }
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) {
                alert(res.error);
                if(res.po_id) navigate(`/compras/ordenes/${res.po_id}`);
            }
            else {
                alert('Orden Generada #' + res.po_id);
                navigate(`/compras/ordenes/${res.po_id}`);
            }
        })
        .catch(console.error);
    };

    if(loading) return <div className="p-8 text-center text-slate-500">Cargando detalle REQ-{id}...</div>;
    if(!req) return <div className="p-8 text-center text-red-500">No se encontró la requisición o error de carga.</div>;

    const items = req.items || [];

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={() => navigate('/compras/solicitudes')} className="text-sm text-indigo-600 mb-2 hover:underline">
                        &larr; Volver al listado
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Solicitud REQ-{req.id}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Estado: <span className="font-bold uppercase">{req.status}</span> | 
                        Fecha: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    {req.status !== 'converted' ? (
                        <button 
                            onClick={handleCreatePO}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow font-medium"
                        >
                            Generar Orden de Compra
                        </button>
                    ) : (
                        <span className="text-emerald-600 font-bold border border-emerald-200 bg-emerald-50 px-3 py-1 rounded">
                            Orden Generada
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Items de Reposición</h3>
                    <span className="text-sm text-slate-500">{items.length} items</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300">
                        <tr>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Cód. Prov.</th>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-right">Cant. Actual</th>
                            <th className="px-6 py-3 text-right">A Pedir</th>
                            <th className="px-6 py-3">Proveedor Asignado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-3 font-mono text-xs font-bold">{item.product_sku || item.product?.sku || '-'}</td>
                                <td className="px-6 py-3 font-mono text-xs text-slate-500">{item.supplier_code || '-'}</td>
                                <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                                    {item.product_name || item.product?.name || 'Producto Desconocido'}
                                </td>
                                <td className="px-6 py-3 text-right text-slate-500">
                                    {item.product?.stock_qty || '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-indigo-600">
                                    {item.suggested_qty || item.quantity}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-500">
                                    {req.notes || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p><strong>Información:</strong> Al generar la Orden de Compra, las cantidades sugeridas se marcarán como "Comprometidas" (Committed) en el sistema. Esto evitará que futuras reposiciones vuelvan a pedir estos mismos productos mientras esperas que lleguen.</p>
            </div>
        </div>
    );
};

export default RequisitionDetailPage;
