import React, { useEffect, useRef } from 'react';
import { CheckCircle, Printer, MessageCircle, Copy, FileText, ArrowLeft, Mail, Edit3 } from 'lucide-react';

export const SaleSummaryPanel = ({ summary, onNewSale, onEditSale }) => {
    const btnNewSaleRef = useRef(null);

    // Auto-focus en botón nueva venta al montar
    useEffect(() => {
        if (btnNewSaleRef.current) btnNewSaleRef.current.focus();
    }, []);

    if (!summary) return null;

    const { sale, customer, items, totals, share } = summary;

    const handleWhatsApp = () => {
        if (share.whatsapp_url) window.open(share.whatsapp_url, '_blank');
        else alert('Cliente sin celular registrado para WhatsApp');
    };

    const handlePrint = () => {
        if (share.print_url) window.open(share.print_url, '_blank', 'width=400,height=600');
    };

    const handleCopy = () => {
        if (share.whatsapp_text) {
            navigator.clipboard.writeText(share.whatsapp_text)
                .then(() => alert('Resumen copiado al portapapeles'))
                .catch(() => alert('Error al copiar'));
        }
    };

    const handleEdit = () => {
        if (confirm('¿Desea ANULAR esta venta y volver al formulario para corregirla?\nEsta acción es irreversible.')) {
            onEditSale(sale.id);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200 absolute inset-0 z-50 font-sans">
            
            {/* Header Success */}
            <div className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2 shadow-md relative overflow-hidden shrink-0 flex items-center justify-between min-h-[60px]">
                <div className="relative z-10 flex flex-col justify-center h-full">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider leading-none">Confirmada</span>
                         <span className="text-emerald-100 text-[11px] font-medium leading-none flex gap-2 items-center">
                            <span>#{sale.receipt_number}</span> 
                            <span className="opacity-50">•</span>
                            <span>{sale.date}</span>
                         </span>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight leading-none mt-1">Comprobante Emitido</h1>
                </div>
                <div className="opacity-20 shrink-0">
                    <CheckCircle size={32} />
                </div>
            </div>

            {/* Actions Toolbar - ARREGLADO: Botones con altura fija h-8 para evitar cortes */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 flex gap-2 shadow-sm shrink-0 overflow-x-auto items-center whitespace-nowrap scrollbar-hide h-[48px]">
                <button 
                    onClick={handleWhatsApp} 
                    className={`h-8 px-3 rounded text-[11px] font-bold flex items-center gap-2 transition-colors border shadow-sm shrink-0 ${
                        share.whatsapp_url 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                        : 'bg-emerald-600/50 text-white/50 border-emerald-600/50 cursor-not-allowed'
                    }`}
                >
                    <MessageCircle size={14} /> WhatsApp
                </button>
                
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                
                <button 
                    onClick={handlePrint} 
                    className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-600 shrink-0"
                >
                    <Printer size={14} /> Imprimir
                </button>
                
                <button 
                    onClick={handleCopy} 
                    className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-600 shrink-0"
                >
                     <Copy size={14} /> Copiar
                </button>
                
                <button 
                    onClick={() => alert('Envío por email próximamente')} 
                    disabled={!customer.email} 
                    className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-600 disabled:opacity-50 shrink-0"
                >
                     <Mail size={14} /> Email
                </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-auto p-3 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl mx-auto h-full content-start">
                    
                    {/* Columna Izq: Cliente + Totales */}
                    <div className="space-y-3">
                        {/* Cliente Card */}
                        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <FileText size={12} /> Cliente
                            </h3>
                            <div className="text-slate-900 dark:text-white font-bold text-sm truncate">
                                {customer.name}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono truncate">
                                {customer.phone}
                            </div>
                        </div>

                        {/* Totales Card */}
                        <div className="bg-slate-100 dark:bg-slate-900/50 rounded p-3 border border-slate-200 dark:border-slate-700">
                             <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>${totals.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>IVA</span>
                                    <span>${totals.iva.toLocaleString()}</span>
                                </div>
                             </div>
                             <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between items-end">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">Total</span>
                                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">${totals.total.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>

                    {/* Columna Der: Ítems */}
                    <div className="md:col-span-2 h-full min-h-0 flex flex-col">
                        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-slate-50 dark:bg-slate-700/30 px-3 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detalle de Productos ({items.length})</h3>
                            </div>
                            <div className="overflow-auto flex-1 p-0">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-slate-500 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Descripción / Marca</th>
                                            <th className="px-3 py-2 font-medium text-center w-16">Cant.</th>
                                            <th className="px-3 py-2 font-medium text-right w-24">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="px-3 py-2">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[250px]" title={item.name}>{item.name}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <span className="text-slate-400 font-semibold">Marca:</span>
                                                        <span className="font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-1 rounded">{item.brand || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-center font-mono text-slate-600 dark:text-slate-400 align-top pt-2.5">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right font-bold font-mono text-slate-900 dark:text-slate-200 align-top pt-2.5">${item.subtotal.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0 w-full mb-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 h-[45px] min-h-[45px]">
                 <button 
                    onClick={handleEdit}
                    className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 text-[10px] font-bold flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                     <Edit3 size={13} /> Corregir Venta
                </button>
                <div className="flex gap-2">
                    <button 
                        ref={btnNewSaleRef}
                        onClick={onNewSale}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded shadow-sm flex items-center gap-2 transform active:scale-[0.98] transition-all text-xs"
                    >
                        Nueva Venta (Esc)
                    </button>
                </div>
            </div>
        </div>
    );
};
