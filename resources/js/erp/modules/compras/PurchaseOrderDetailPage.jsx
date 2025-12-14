import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AttachmentsModal from './AttachmentsModal';

const STATUS_MAP = {
    'DRAFT': { label: 'BORRADOR', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'SENT': { label: 'ENVIADA', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'RECEIVED': { label: 'RECIBIDA', color: 'bg-green-100 text-green-800 border-green-200' },
    'CANCELLED': { label: 'CANCELADA', color: 'bg-red-100 text-red-800 border-red-200' },
};

// Modal de Envío de Email Profesional
const EmailModal = ({ isOpen, onClose, defaultEmail, onSubmit, loading }) => {
    const [email, setEmail] = useState(defaultEmail || '');
    const [subject, setSubject] = useState('Nueva Orden de Compra');
    const [message, setMessage] = useState('Adjunto encontrará la orden de compra solicitada. Quedamos a la espera de la confirmación.');

    useEffect(() => {
        if(isOpen) {
             setEmail(defaultEmail || '');
        }
    }, [isOpen, defaultEmail]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                {/* Header Discreto */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        Enviar Orden al Proveedor
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 space-y-4">
                    {/* To */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Para (Email Proveedor)</label>
                        <input 
                            type="email" 
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="proveedor@ejemplo.com"
                        />
                    </div>
                    
                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Asunto</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mensaje / Aclaraciones</label>
                        <textarea 
                            rows={5}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none text-slate-900 dark:text-white"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">Se incluirá un resumen de la orden automáticamente.</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => onSubmit({ email, subject, message })}
                        disabled={loading || !email}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando...' : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                Enviar Correo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReceiveModal = ({ isOpen, onClose, items, onSubmit, loading }) => {
    const [createMap, setCreateMap] = useState({});

    // Resetear al abrir
    useEffect(() => {
        if (isOpen && items) {
            // Inicializamos con el remanente (Ordered - Received)
            const initial = {};
            items.forEach(item => {
                const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);
                initial[item.id] = remaining; // Por defecto asumimos llegada completa de lo restante
            });
            setCreateMap(initial);
        }
    }, [isOpen, items]);

    const handleQtyChange = (id, val) => {
        setCreateMap(prev => ({ ...prev, [id]: val }));
    };

    const handleSubmit = () => {
        // Filtramos solo los que tienen > 0
        const payload = [];
        Object.keys(createMap).forEach(key => {
            const val = parseFloat(createMap[key]);
            if (val > 0) {
                payload.push({ id: parseInt(key), receive_qty: val });
            }
        });
        
        if (payload.length === 0) return alert("Ingrese al menos una cantidad mayor a 0.");
        
        onSubmit(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        Recibir Mercadería (Ingreso a Stock)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">&times;</button>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase text-slate-500 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3 text-right">Solicitado</th>
                                <th className="px-4 py-3 text-right">Ya Recibido</th>
                                <th className="px-4 py-3 text-center bg-emerald-50 dark:bg-emerald-900/20 border-l border-emerald-100 w-40">A Ingresar HOY</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {items.map(item => {
                                const remaining = Math.max(0, item.quantity_ordered - item.quantity_received);
                                const currentInput = createMap[item.id] ?? 0;
                                const isFulfilled = remaining === 0;

                                return (
                                    <tr key={item.id} className={isFulfilled ? "bg-slate-50 opacity-60" : ""}>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                            {item.product_name}
                                            <div className="text-xs text-slate-400 font-mono">{item.product_sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{item.quantity_ordered}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{item.quantity_received}</td>
                                        <td className="px-4 py-3 text-center bg-emerald-50/50 border-l border-emerald-100">
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-24 text-center border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-800"
                                                value={currentInput}
                                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Ingreso'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PurchaseOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados de edición local
    const [edits, setEdits] = useState({});
    
    // Email Modal State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Attachments Modal State
    const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);

    // Receive Modal State
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [receiving, setReceiving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = () => {
        setLoading(true);
        fetch(`/erp/api/purchase-orders/${id}`)
           .then(r => r.json())
           .then(data => {
               if(data.error) alert(data.error);
               else setPo(data);
           })
           .catch(e => console.error(e))
           .finally(() => setLoading(false));
    };

    const handleReceiveClick = () => setIsReceiveModalOpen(true);

    const handleSubmitReceive = (itemsPayload) => {
         setReceiving(true);
         const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
         
         fetch(`/erp/api/purchase-orders/${id}/receive`, {
             method: 'POST',
             headers: {
                 'Accept': 'application/json',
                 'Content-Type': 'application/json',
                 'X-CSRF-TOKEN': token || ''
             },
             body: JSON.stringify({ items: itemsPayload })
         })
         .then(r => r.json())
         .then(res => {
             if(res.success) {
                 alert(res.message);
                 setIsReceiveModalOpen(false);
                 loadData();
             } else {
                 alert(res.error || res.message);
             }
         })
         .catch(e => alert("Error de red: " + e))
         .finally(() => setReceiving(false));
    };


    const handleQtyChange = (itemId, newQty) => {
        if (newQty < 0) return;
        setEdits(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], quantity_ordered: newQty }
        }));
    };

    const handleMarkDelete = (itemId) => {
        setEdits(prev => {
            const current = prev[itemId] || {};
            return {
                ...prev,
                [itemId]: { ...current, delete: !current.delete }
            };
        });
    };
    
    const handleSave = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        setSaving(true);
        
        // Prepare payload
        const itemsToUpdate = Object.keys(edits).map(itemId => ({
            id: itemId,
            ...edits[itemId]
        }));
        
        fetch(`/erp/api/purchase-orders/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || ''
            },
            body: JSON.stringify({ items: itemsToUpdate })
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error);
            else {
                setEdits({});
                loadData(); 
            }
        })
        .finally(() => setSaving(false));
    };

    const handlePrint = () => {
        window.print();
    };
    
    const handleEmailClick = () => {
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = (data) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        setSendingEmail(true);
        
        fetch(`/erp/api/purchase-orders/${id}/email`,{ 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token || ''
            },
            body: JSON.stringify(data)
        })
            .then(r => r.json())
            .then(res => {
                if(res.success) {
                    alert(res.message);
                    setIsEmailModalOpen(false);
                    loadData();
                } else {
                    alert('Error: ' + (res.message || res.error));
                }
            })
            .finally(() => setSendingEmail(false));
    };

    const handleReopen = () => {
        if(!confirm('¿Seguro de REABRIR esta orden?\n\n- Pasará a estado BORRADOR.\n- Se VOLVERÁ A COMPROMETER el stock pendiente.\n- Podrás editarla y volver a enviarla.')) return;

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        setSaving(true);
        fetch(`/erp/api/purchase-orders/${id}/reopen`, {
             method: 'POST',
             headers: {'X-CSRF-TOKEN': token || ''}
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error || res.message);
            else {
                alert(res.message);
                loadData();
            }
        })
        .finally(() => setSaving(false));
    };
    
    const handleForceClose = () => {
        const reason = prompt("CIERRE ADMINISTRATIVO Y MANUAL:\n\nEsta acción cerrará la orden y liberará el stock pendiente que no haya ingresado.\n\nIngrese el motivo OBLIGATORIO (Ej: 'Proveedor canceló', 'Compra externa'):");
        
        if (reason === null) return; // Cancelado
        if (!reason || reason.trim().length < 5) return alert('Debe especificar un motivo válido (mínimo 5 caracteres) para la trazabilidad.');

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Mostrar Loading
        setSaving(true);

        fetch(`/erp/api/purchase-orders/${id}/close`, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json',
                 'X-CSRF-TOKEN': token || ''
             },
             body: JSON.stringify({ reason })
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error || res.message);
            else {
                alert(res.message);
                loadData();
            }
        })
        .finally(() => setSaving(false));
    };

    const handleDeleteOrder = () => {
        if(!confirm('ATENCIÓN: ¿Estás seguro de ELIMINAR esta orden permanentemente?\n\nEsta acción revertirá las cantidades "en espera" (backlog) de los productos y eliminará el registro.\n\nEsta acción NO se puede deshacer.')) return;
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/erp/api/purchase-orders/${id}`, { 
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': token || '',
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) {
                alert('Error: ' + res.error);
            } else {
                alert(res.message || 'Orden eliminada.');
                navigate('/compras/ordenes');
            }
        })
        .catch(err => alert('Error de red al intentar eliminar.'));
    };

    if(loading) return <div className="p-10 text-center">Cargando Orden...</div>;
    if(!po) return <div className="p-10 text-center text-red-500">Orden no encontrada.</div>;

    const isDraft = po.status === 'DRAFT';
    const isClosed = po.status === 'CLOSED' || po.status === 'CANCELLED';
    const hasPendingEdits = Object.keys(edits).length > 0;

    // Status Badge
    let statusConfig = STATUS_MAP[po.status] || { label: po.status, color: 'bg-gray-100 text-gray-800' };

    // Detectar si fue reabierta con recepciones parciales previas
    const isReopenedPartial = isDraft && po.items.some(i => parseFloat(i.quantity_received) > 0);
    
    // Override visual status for Reopened Partial
    if (isReopenedPartial) {
        statusConfig = { label: 'REABIERTA', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }

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
                    <button 
                        onClick={() => setIsAttachmentsOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 text-gray-700 text-sm font-medium"
                        title="Adjuntar Documentos (Facturas, Remitos)"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        <span className="hidden sm:inline">Adjuntos</span>
                    </button>

                    {isClosed && (
                        <button 
                            onClick={handleReopen} 
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 rounded shadow text-sm font-medium"
                            title="Deshacer cierre y volver a Borrador"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Reabrir
                        </button>
                    )}
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 text-gray-700 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Exportar
                    </button>
                    {isDraft && (
                        <>
                            <button onClick={handleDeleteOrder} className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded shadow text-sm font-medium" title="Eliminar Orden y revertir stock">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Eliminar
                            </button>
                            <button onClick={handleEmailClick} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                Enviar a Proveedor
                            </button>
                            {!isClosed && (
                                <button onClick={handleReceiveClick} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow text-sm font-bold">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    Recibir Mercadería
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Items Table - Scrollable Container */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6 flex flex-col flex-1 min-h-[600px] print:shadow-none print:border-0 print:block print:h-auto print:min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0 print:border-b-2 print:border-black print:bg-white print:px-0">
                    <h2 className="font-bold text-gray-700 dark:text-gray-300 print:text-black text-lg">Detalle de Productos</h2>
                    <div className="flex items-center gap-2">
                        {!isClosed && (!isDraft || isReopenedPartial) && (
                            <button 
                                onClick={handleForceClose} 
                                className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 px-3 py-1 rounded shadow-sm flex items-center gap-1 transition-all"
                                title="Cerrar orden manualmente"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Cerrar Orden
                            </button>
                        )}
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
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-40">Fecha</th>
                                <th className="px-4 py-3 w-40">Evento</th>
                                <th className="px-4 py-3 w-32">Usuario</th>
                                <th className="px-4 py-3">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {po.events && po.events.length > 0 ? po.events.map(ev => {
                                // Parse data safely
                                let details = {};
                                try {
                                    details = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
                                } catch (e) { details = { raw: ev.data }; }

                                // Color coding for events
                                // Estilo con fondo de color adaptado a modo oscuro (No blanco)
                                const eventColor = {
                                    'CREATED': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600',
                                    'CLOSED': 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-500',
                                    'MANUAL_CLOSE': 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-500',
                                    'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800',
                                    'REOPENED': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
                                    'MANUAL_REOPEN': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
                                    'ATTACHMENT_ADDED': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800', 
                                    'MERCHANDISE_RECEIVED': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
                                    'QTY_CHANGED': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-800',
                                    'EMAIL_SENT': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
                                }[ev.event_type] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';

                                const eventTypeTranslations = {
                                    'CREATED': 'Creada',
                                    'CLOSED': 'Cerrada',
                                    'MANUAL_CLOSE': 'Cierre Manual',
                                    'CANCELLED': 'Cancelada',
                                    'REOPENED': 'Reabierta',
                                    'MANUAL_REOPEN': 'Reapertura Manual',
                                    'ATTACHMENT_ADDED': 'Adjunto Agregado',
                                    'MERCHANDISE_RECEIVED': 'Recepción Mercadería',
                                    'QTY_CHANGED': 'Cambio Cantidad',
                                    'EMAIL_SENT': 'Email Enviado',
                                };

                                return (
                                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(ev.happened_at).toLocaleDateString()} <span className="text-slate-400">{new Date(ev.happened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${eventColor}`}>
                                                {eventTypeTranslations[ev.event_type] || ev.event_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                            {ev.user?.name || 'Sistema'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400 break-words font-mono">
                                            {Object.entries(details || {}).map(([k, v]) => (
                                                <div key={k} className="mb-0.5 last:mb-0">
                                                    <span className="font-semibold text-slate-500">{k}:</span> <span className="text-slate-700 dark:text-slate-300">{JSON.stringify(v).replace(/^"|"$/g, '')}</span>
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">No hay registros de auditoría.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Footer de Impresión (Solo Visible al Imprimir) */}
            <div className="hidden print:block mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
                <p>Generado autom&aacute;ticamente por Sistema ERP KM21 - {new Date().toLocaleString()}</p>
            </div>
            
            </div> {/* Cierre invoice-print-area */}

            <AttachmentsModal 
                isOpen={isAttachmentsOpen} 
                onClose={() => setIsAttachmentsOpen(false)} 
                poId={po.id} 
            />
            
            <EmailModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setIsEmailModalOpen(false)} 
                defaultEmail={po.supplier?.email || ''} 
                onSubmit={handleSendEmail} 
                loading={sendingEmail} 
            />

            <ReceiveModal
                isOpen={isReceiveModalOpen}
                onClose={() => setIsReceiveModalOpen(false)}
                items={po.items || []}
                onSubmit={handleSubmitReceive}
                loading={receiving}
            />
        </div>
    );
};

export default PurchaseOrderDetailPage;
