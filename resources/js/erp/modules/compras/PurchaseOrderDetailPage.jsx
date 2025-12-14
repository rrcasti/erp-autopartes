import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PurchaseOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados de edición local
    const [edits, setEdits] = useState({});

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = () => {
        setLoading(true);
        fetch(`/erp/api/purchase-orders/${id}`)
            .then(r => r.json())
            .then(data => {
                setPo(data);
                setEdits({});
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleQtyChange = (itemId, newQty) => {
        if (newQty < 0) return;
        setEdits(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], quantity_ordered: newQty }
        }));
    };

    const handleDeleteItem = (itemId) => {
        if(!confirm('¿Eliminar este ítem de la orden? La cantidad pendiente volverá a sugerirse en futuras reposiciones.')) return;
        
        setEdits(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], delete: true }
        }));
        
        // Auto-save inmediato para delete
        saveChanges([{ id: itemId, delete: true }]);
    };
    
    const handleSave = () => {
         // Convertir edits object a array
         const itemsToUpdate = Object.keys(edits).map(itemId => ({
             id: itemId,
             ...edits[itemId]
         }));
         
         if(itemsToUpdate.length === 0) return;
         saveChanges(itemsToUpdate);
    };

    const saveChanges = (itemsPayload) => {
        setSaving(true);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        fetch(`/erp/api/purchase-orders/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || ''
            },
            body: JSON.stringify({ items: itemsPayload })
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error);
            else {
                loadData(); // Recargar para confirmar cambios
            }
        })
        .finally(() => setSaving(false));
    };

    const handleExport = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/erp/api/purchase-orders/${id}/export`,{ method: 'POST', headers: {'X-CSRF-TOKEN': token || ''} })
            .then(r => r.json())
            .then(res => {
                alert('Export generado. (Simulación: Abriría PDF)');
                // window.open(res.url, '_blank');
            });
    };
    
    const handleEmail = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if(!confirm('¿Enviar Orden de Compra por email al proveedor?')) return;
        
        fetch(`/erp/api/purchase-orders/${id}/email`,{ method: 'POST', headers: {'X-CSRF-TOKEN': token || ''} })
            .then(r => r.json())
            .then(res => {
                alert(res.message);
                loadData();
            });
    };

    if(loading) return <div className="p-10 text-center">Cargando Orden...</div>;
    if(!po) return <div className="p-10 text-center text-red-500">Orden no encontrada.</div>;

    const isDraft = po.status === 'DRAFT';
    const hasPendingEdits = Object.keys(edits).length > 0;

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                     <button onClick={() => navigate('/compras/ordenes')} className="text-sm text-indigo-600 mb-2 hover:underline">
                        &larr; Volver a Órdenes
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {po.po_number || `Orden #${po.id}`}
                        <span className={`text-xs px-2 py-1 rounded uppercase ${
                            po.status==='DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                            po.status==='SENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                        }`}>
                            {po.status}
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm">Proveedor: <span className="font-semibold text-gray-700 dark:text-gray-300">{po.supplier?.razon_social || 'Desconocido'}</span></p>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 text-gray-700 text-sm font-medium">
                        🖨️ Exportar / PDF
                    </button>
                    {isDraft && (
                        <button onClick={handleEmail} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow text-sm font-medium">
                            ✉️ Enviar a Proveedor
                        </button>
                    )}
                </div>
            </div>

            {/* Items Table - Scrollable Container */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6 flex flex-col flex-1 min-h-[600px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0">
                    <h2 className="font-bold text-gray-700 dark:text-gray-300">Items Ordenados</h2>
                    {isDraft && hasPendingEdits && (
                        <button 
                            onClick={handleSave} 
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow animate-pulse"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
                
                {/* Scrollable Area */}
                <div className="overflow-auto flex-1 max-h-[70vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-2 bg-gray-100 dark:bg-slate-700">Producto</th>
                                <th className="px-6 py-2 bg-gray-100 dark:bg-slate-700">SKU</th>
                                <th className="px-6 py-2 text-right bg-gray-100 dark:bg-slate-700">Cant. Pedida</th>
                                <th className="px-6 py-2 text-right bg-gray-100 dark:bg-slate-700">Precio Unit. (Est)</th>
                                <th className="px-6 py-2 text-center bg-gray-100 dark:bg-slate-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {po.items.map(item => {
                                // Check local edits
                                const currentQty = edits[item.id]?.quantity_ordered ?? item.quantity_ordered;
                                const isDeleted = edits[item.id]?.delete;
                                if(isDeleted) return null;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-2 font-medium">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-2 font-mono text-gray-500 text-xs">
                                            {item.product_sku}
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            {isDraft ? (
                                                <input 
                                                    type="number" 
                                                    className="w-16 text-right px-1 py-0.5 border rounded text-slate-800 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                                                    value={currentQty}
                                                    onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value))}
                                                />
                                            ) : (
                                                <span className="font-bold">{item.quantity_ordered}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-2 text-right text-gray-500">
                                            ${item.unit_price}
                                        </td>
                                        <td className="px-6 py-2 text-center">
                                            {isDraft && (
                                                <button 
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                    title="Eliminar item"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historia de Eventos */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-700 mb-4 px-2">Historial de Auditoría</h3>
                <div className="bg-gray-50 dark:bg-slate-900 rounded p-4 space-y-3">
                    {po.events && po.events.length > 0 ? po.events.map(ev => (
                        <div key={ev.id} className="flex text-xs text-gray-600 gap-4 border-b border-gray-200 pb-2 last:border-0">
                            <span className="font-mono">{new Date(ev.happened_at).toLocaleString()}</span>
                            <span className="font-bold text-blue-600">{ev.event_type}</span>
                            <span>{ev.user?.name || 'Usuario'}</span>
                            <span className="text-gray-400 truncate max-w-xs">{JSON.stringify(ev.data)}</span>
                        </div>
                    )) : <p className="text-gray-400 text-sm">Sin eventos registrados.</p>}
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderDetailPage;
