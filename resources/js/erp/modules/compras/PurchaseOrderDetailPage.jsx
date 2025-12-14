import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const STATUS_MAP = {
    'DRAFT': { label: 'BORRADOR', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'SENT': { label: 'ENVIADA', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'RECEIVED': { label: 'RECIBIDA', color: 'bg-green-100 text-green-800 border-green-200' },
    'CANCELLED': { label: 'CANCELADA', color: 'bg-red-100 text-red-800 border-red-200' },
};

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
        // Agregamos timestamp para evitar cache
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

    const handlePrint = () => {
        window.print();
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

    // Status Badge
    const statusConfig = STATUS_MAP[po.status] || { label: po.status, color: 'bg-gray-100 text-gray-800' };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-auto">
            {/* Estilos Específicos de Impresión para aislar el documento */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { visibility: hidden; }
                    
                    /* Contenedor Principal: Fixed cubriendo todo, bloque normal */
                    #invoice-print-area {
                        visibility: visible;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: auto;
                        margin: 0;
                        padding: 0 !important;
                        display: block !important; /* Romper Flex */
                        background: white;
                        color: black;
                        z-index: 9999;
                        overflow: visible;
                    }
                    
                    /* Resetear anchos internos */
                    .w-full { width: 100% !important; }
                    
                    /* Tabla legible y ancha */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 10px;
                    }
                    
                    th, td {
                        padding: 6px 4px !important;
                        font-size: 11px !important;
                        border: 1px solid #ccc !important;
                        text-align: left;
                    }
                    
                    /* Ajuste de columnas */
                    th:first-child, td:first-child { width: 35% !important; } /* Producto */
                    th:nth-child(2), td:nth-child(2) { width: 15% !important; } /* Proveedor */
                    
                    th.text-right, td.text-right { text-align: right !important; }
                    th.text-center, td.text-center { text-align: center !important; }

                    /* Textos */
                    * { color: black !important; text-shadow: none !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                }
            `}</style>

            <div id="invoice-print-area" className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4 print:mb-4">
                <div>
                     <button onClick={() => navigate('/compras/ordenes')} className="text-sm text-indigo-600 mb-2 hover:underline print:hidden">
                        &larr; Volver a Órdenes
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white print:text-black">
                            {po.po_number || `Orden #${po.id}`}
                        </h1>
                        <span className={`text-xs px-2.5 py-0.5 rounded border uppercase font-bold tracking-wide ${statusConfig.color} print:uppercase print:border-black print:text-black`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    
                    {/* Metadata ampliada */}
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 print:text-black grid grid-cols-2 gap-x-8 gap-y-1">
                        <p>Proveedor: <span className="font-semibold text-gray-900 dark:text-gray-200 print:text-black">{po.supplier?.razon_social || 'Desconocido'}</span></p>
                        <p>Fecha Creación: <span className="font-semibold">{po.created_at ? new Date(po.created_at).toLocaleString() : '-'}</span></p>
                        <p>Creado Por: <span className="font-semibold">{po.creator?.name || 'Sistema'}</span></p>
                        <p>Fecha Emisión: <span className="font-semibold">{po.issued_at ? new Date(po.issued_at).toLocaleDateString() : 'Pendiente'}</span></p>
                    </div>
                </div>
                
                <div className="flex gap-2 print:hidden">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 text-gray-700 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Exportar / PDF
                    </button>
                    {isDraft && (
                        <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Enviar a Proveedor
                        </button>
                    )}
                </div>
            </div>

            {/* Items Table - Scrollable Container */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6 flex flex-col flex-1 min-h-[600px] print:shadow-none print:border-0 print:block print:h-auto print:min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0 print:border-b-2 print:border-black print:bg-white print:px-0">
                    <h2 className="font-bold text-gray-700 dark:text-gray-300 print:text-black text-lg">Detalle de Productos</h2>
                    {isDraft && hasPendingEdits && (
                        <button 
                            onClick={handleSave} 
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow animate-pulse print:hidden"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
                
                {/* Scrollable Area */}
                <div className="overflow-auto flex-1 max-h-[70vh] print:overflow-visible print:max-h-none">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-sm print:static print:bg-transparent print:text-black print:shadow-none print:border-b">
                            <tr>
                                <th className="px-6 py-2 bg-gray-100 dark:bg-slate-700 print:bg-transparent">Producto</th>
                                <th className="px-6 py-2 bg-gray-100 dark:bg-slate-700 print:bg-transparent">Proveedor (Item)</th>
                                <th className="px-6 py-2 bg-gray-100 dark:bg-slate-700 print:bg-transparent">SKU</th>
                                <th className="px-6 py-2 text-right bg-gray-100 dark:bg-slate-700 print:bg-transparent">Cant.</th>
                                <th className="px-6 py-2 text-right bg-gray-100 dark:bg-slate-700 print:bg-transparent">Precio Unit.</th>
                                <th className="px-6 py-2 text-right bg-gray-100 dark:bg-slate-700 print:bg-transparent">Subtotal</th>
                                <th className="px-6 py-2 text-center bg-gray-100 dark:bg-slate-700 print:hidden">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                            {po.items.map(item => {
                                // Check local edits
                                const currentQty = edits[item.id]?.quantity_ordered ?? item.quantity_ordered;
                                const isDeleted = edits[item.id]?.delete;
                                if(isDeleted) return null;
                                
                                const subtotal = currentQty * item.unit_price;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 print:hover:bg-transparent">
                                        <td className="px-6 py-2 font-medium print:text-black">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-2 text-gray-500 text-xs print:text-black">
                                            {item.supplier_name || '-'}
                                        </td>
                                        <td className="px-6 py-2 font-mono text-gray-500 text-xs print:text-black">
                                            {item.product_sku}
                                        </td>
                                        <td className="px-6 py-2 text-right print:text-black">
                                            {isDraft ? (
                                                <input 
                                                    type="number" 
                                                    className="w-16 text-right px-1 py-0.5 border rounded text-slate-800 text-xs font-bold focus:ring-1 focus:ring-indigo-500 print:hidden"
                                                    value={currentQty}
                                                    onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value))}
                                                />
                                            ) : null}
                                            <span className={isDraft ? "hidden print:inline font-bold" : "font-bold"}>{currentQty}</span>
                                        </td>
                                        <td className="px-6 py-2 text-right text-gray-500 print:text-black">
                                            ${parseFloat(item.unit_price).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-2 text-right font-medium text-gray-900 dark:text-white print:text-black">
                                            ${subtotal.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-2 text-center print:hidden">
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
                        {/* Footer de Totales */}
                        <tfoot className="bg-gray-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-600 print:bg-white print:border-black">
                            <tr>
                                <td colSpan="5" className="px-6 py-3 text-right font-bold text-gray-700 dark:text-gray-300 uppercase print:text-black">Totales</td>
                                <td className="px-6 py-3 text-right font-bold text-lg text-emerald-600 dark:text-emerald-400 print:text-black">
                                    ${parseFloat(po.calculated_total || 0).toFixed(2)}
                                </td>
                                <td className="print:hidden"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Historia de Eventos (Oculta al imprimir) */}
            <div className="mt-8 print:hidden">
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
            
            {/* Footer de Impresión (Solo Visible al Imprimir) */}
            <div className="hidden print:block mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
                <p>Generado autom&aacute;ticamente por Sistema ERP KM21 - {new Date().toLocaleString()}</p>
            </div>
            
            </div> {/* Cierre invoice-print-area */}
        </div>
    );
};

export default PurchaseOrderDetailPage;
