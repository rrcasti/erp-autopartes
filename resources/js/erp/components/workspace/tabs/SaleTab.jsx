import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../../../stores/useWorkspaceStore';
import { 
    Search, ScanBarcode, User, CreditCard, Printer, Send, 
    Trash2, Plus, Minus, AlertCircle, Check, X, Box, MoreVertical, ShoppingCart, Loader2 
} from 'lucide-react';
import { SearchableSelect } from '../../SearchableSelect'; // Reutilizaremos si sirve, o haremos uno custom para items

export const SaleTab = ({ tab }) => {
    // Conexión con Store Global (Persistencia)
    const { updateTabPayload, updateTabMeta } = useWorkspaceStore();
    
    // Protección defensiva contra datos corruptos en LocalStorage
    const safePayload = tab.payload || {};

    // Estado local derivado del payload (para reactividad rápida en la UI)
    const [items, setItems] = useState(safePayload.items || []);
    const [customer, setCustomer] = useState(safePayload.customer || {});
    const [totals, setTotals] = useState(safePayload.totals || { subtotal: 0, iva: 0, total: 0 });
    const [paymentMethod, setPaymentMethod] = useState(safePayload.paymentMethod || 'efectivo');
    
    // Estado UI efímero
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showVariationSelector, setShowVariationSelector] = useState(false);
    const [selectedProductForVariation, setSelectedProductForVariation] = useState(null);
    const inputScanRef = useRef(null);

    // Auto-save effect: Sincronizar estado local con el Store Global (debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            updateTabPayload(tab.id, { 
                items, 
                customer, 
                totals, 
                paymentMethod 
            });
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [items, customer, totals, paymentMethod]); // Dependencias

    // Focus en scanner al montar
    useEffect(() => {
        if (inputScanRef.current) inputScanRef.current.focus();
    }, []);

    // --- INTEGRACIÓN BACKEND ---

    const apiCall = async (url, data) => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token || ''
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error en servidor');
            return await res.json();
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el sistema');
            return null;
        }
    };

    const handleSearchOrScan = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!searchQuery.trim()) return;
            
            setIsSearching(true);
            setSearchResults([]); // Limpiar previos

            const res = await apiCall('/erp/api/pos/resolve', { query: searchQuery });
            setIsSearching(false);

            if (!res) return;

            if (res.type === 'exact') {
                handleAddItem(res.product);
            } else if (res.type === 'list') {
                setSearchResults(res.results);
                // Si solo hay 1 resultado en la lista, seleccionarlo directo? No, mejor que elija.
            } else {
                alert('Producto no encontrado. Intente búsqueda manual.');
            }
        }
    };

    // --- LÓGICA DE NEGOCIO (Restaurada) ---

    // Calcular totales automáticamente
    useEffect(() => {
        const sub = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        // Asumimos IVA incluido o no según config? 
        // Para MVP: Precio es final. Desglosamos IVA del total (precio / 1.21 * 0.21) o sumamos?
        // El usuario ve "IVA (21%)" en la UI.
        // Si el precio lista es con IVA, entonces desglosamos. 
        // Si es neto, sumamos.
        // Asumiré estilo consumidor final: Precio Lista incluye IVA.
        // Entonces: Total = Suma precios. Subtotal = Total / 1.21. IVA = Total - Subtotal.
        const total = sub;
        const subtotal = total / 1.21;
        const iva = total - subtotal;
        
        setTotals({
            subtotal,
            iva,
            total
        });
    }, [items]);

    const executeSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        // setSearchResults([]); // No limpiar para evitar parpadeo si es predictivo
        
        const res = await apiCall('/erp/api/pos/resolve', { query });
        setIsSearching(false);
        
        if (res && res.type === 'list') {
            setSearchResults(res.results);
        } else if (res && res.type === 'exact') {
            // En predictivo, si es exacto único, ¿agregamos automático? 
            // Mejor mostrarlo en lista para confirmar, salvo que sea un "Enter" explícito.
            // Para mantener simpleza, mostramos como resultado único.
            setSearchResults([res.product]);
        } else {
            setSearchResults([]);
        }
    };

    // Efecto Debounce para búsqueda predictiva
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                executeSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Si hay un solo resultado, seleccionar.
            if (searchResults.length === 1) {
                handleAddItem(searchResults[0]);
                setSearchResults([]);
                setSearchQuery('');
                return;
            }
            // Si no hay resultados pero hay query, intentar búsqueda inmediata (override debounce)
            executeSearch(searchQuery);
        }
    };

    const handleAddItem = (product) => {
        setItems((prevItems) => {
            const existingIndex = prevItems.findIndex(i => i.id === product.id);
            if (existingIndex >= 0) {
                const newItems = [...prevItems];
                newItems[existingIndex].quantity += 1;
                return newItems;
            } else {
                return [...prevItems, { ...product, quantity: 1 }];
            }
        });
        
        // Feedback visual o sonoro podría ir aquí
    };

    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFinalize = async () => {
         // ... (código existente, solo cambio estilos de alertas si quiero, pero lógica js es igual)
        if (items.length === 0) return alert('No hay ítems en la venta');
        // ...
        if (!confirm('¿Confirmar venta por $' + totals.total.toLocaleString() + '?')) return;

        const payload = { items, customer, totals, paymentMethod };
        const res = await apiCall('/erp/api/pos/sale', payload);

        if (res && res.success) {
            if (confirm('Venta #' + res.receipt_number + ' Confirmada. \n¿Imprimir comprobante?')) {
                window.open(res.print_url, '_blank', 'width=400,height=600');
            }
            if (res.whatsapp_url && confirm('¿Enviar por WhatsApp?')) {
                window.open(res.whatsapp_url, '_blank');
            }
            setItems([]);
            setCustomer({});
            setTotals({ subtotal: 0, iva: 0, total: 0 });
            setSearchQuery('');
            if (inputScanRef.current) inputScanRef.current.focus();
        }
    };

    const handleGlobalKeys = (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            inputScanRef.current?.focus();
        }
        if (e.key === 'F9') {
            e.preventDefault();
            handleFinalize();
        }
    };

    return (
        <div className="flex h-full flex-row bg-transparent dark:bg-slate-950 text-slate-900 dark:text-slate-200 w-full overflow-hidden" onKeyDown={handleGlobalKeys} tabIndex={-1}>
            
            {/* IZQUIERDA: Flujo de Venta (Header + Tabla + Footer) */}
            <div className="flex-1 flex flex-col min-w-0 relative border-r border-slate-300 dark:border-slate-800">

                {/* HEADER: BÚSQUEDA (Compacto) */}
                <div className="shrink-0 p-3 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 shadow-sm z-30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            ref={inputScanRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Buscar producto (F2)..."
                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            autoComplete="off"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-indigo-500" size={16} />
                            </div>
                        )}
                        
                        {/* Resultados de Búsqueda (Dropdown dentro del relative) */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-[60vh] overflow-auto z-50 ring-1 ring-black/5">
                                {searchResults.map((prod) => (
                                    <div 
                                        key={prod.id}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            handleAddItem(prod);
                                            setSearchResults([]);
                                            setSearchQuery('');
                                            if (inputScanRef.current) inputScanRef.current.focus();
                                        }}
                                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex justify-between items-center group transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">{prod.name}</span>
                                                <span className="text-[10px] uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded tracking-wide font-mono font-bold">
                                                    {prod.brand_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-400 font-mono mt-0.5">
                                                <span>SKU: {prod.sku || '-'}</span>
                                                <span className={`${prod.stock > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} font-bold ml-1`}>
                                                    Stock: {prod.stock}
                                                </span>
                                                {prod.provider_name && (
                                                    <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]" title={prod.provider_name}>
                                                        | {prod.provider_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/30">
                                            ${prod.price.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Tabla de Ítems */}
                <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950/30 p-0 relative z-10" onClick={() => setSearchResults([])}>
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
                            <Box size={40} className="mb-2 opacity-50" />
                            <p className="text-base font-medium">Buscador listo (F2)</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 shadow-sm z-10 border-b border-slate-300 dark:border-slate-800">
                                <tr className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                                    <th className="py-2 px-3">Producto</th>
                                    <th className="py-2 px-3 w-28">Marca</th>
                                    <th className="py-2 px-3 w-24 text-right">Precio</th>
                                    <th className="py-2 px-3 w-20 text-center">Cant.</th>
                                    <th className="py-2 px-3 w-28 text-right">Subtotal</th>
                                    <th className="py-2 px-3 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 dark:divide-slate-800/50 text-sm bg-white dark:bg-slate-950">
                                {items.map((item, index) => (
                                    <tr key={index} className="group hover:bg-indigo-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="py-2 px-3">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 text-[13px] leading-tight">{item.name}</div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase">
                                                {item.brand_name}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-300 text-[13px]">
                                            ${item.price.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input 
                                                type="text" 
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const newItems = [...items];
                                                    newItems[index].quantity = val;
                                                    setItems(newItems);
                                                }}
                                                className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-900 dark:text-slate-100 font-bold text-xs py-1 outline-none focus:border-indigo-500 font-mono focus:ring-1 focus:ring-indigo-500/50"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[13px]">
                                            ${(item.price * (item.quantity || 0)).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-3 text-center">
                                            <button 
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Comandos */}
                <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-600 font-medium">
                        <span className="flex items-center gap-1">F2 Buscar</span>
                        <span className="flex items-center gap-1">F9 Cobrar</span>
                    </div>
                    {/* Placeholder para estatus conexión o usuario */}
                </div>
            </div>

            {/* DERECHA: Panel Totales (Compacto) */}
            <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-lg">
                
                {/* Cliente */}
                <div className="p-3 border-b border-slate-300 dark:border-slate-800">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <User size={12} /> Cliente
                    </h3>
                    
                    {(!customer.name || customer.name === '') ? (
                         <div className="flex gap-2">
                             <input 
                                 type="text" 
                                 placeholder="Buscar..."
                                 onKeyDown={(e) => {
                                     if(e.key === 'Enter') setCustomer({ name: e.target.value, phone: '', id: null });
                                 }} 
                                 className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                             />
                             <button 
                                 onClick={() => setCustomer({ name: 'Final', id: null })}
                                 className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded border border-slate-300 dark:border-slate-700 transition"
                             >
                                 Final
                             </button>
                         </div>
                    ) : (
                        <div className="bg-indigo-50 dark:bg-slate-800/50 rounded p-2 border border-indigo-200 dark:border-slate-700 flex justify-between items-center group">
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-200 text-sm leading-none">{customer.name}</div>
                                {customer.phone && <div className="text-[10px] text-slate-600 mt-1">{customer.phone}</div>}
                            </div>
                            <button onClick={() => setCustomer({})} className="text-slate-500 hover:text-red-600">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagos / Ajustes */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex-1">
                     <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CreditCard size={12} /> Pago
                    </h3>
                    <div className="grid grid-cols-2 gap-1.5">
                        {['efectivo', 'tarjeta', 'transferencia', 'cta_cte'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`
                                    px-0 py-1.5 rounded text-[11px] font-medium border capitalize transition-all
                                    ${paymentMethod === method 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                        : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                {method.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Totales */}
                <div className="bg-slate-100 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="space-y-1 mb-3 text-xs">
                        <div className="flex justify-between text-slate-700 dark:text-slate-400 font-medium">
                            <span>Subtotal</span>
                            <span>${totals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-700 dark:text-slate-400 font-medium">
                            <span>IVA (21%)</span>
                            <span>${totals.iva.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-4 pt-3 border-t border-slate-300 dark:border-slate-800">
                        <span className="text-slate-900 dark:text-slate-400 font-bold text-sm pb-0.5">Total</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                            ${totals.total.toLocaleString()}
                        </span>
                    </div>

                    <button 
                        onClick={handleFinalize}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                    >
                        Cobrar (F9)
                    </button>
                </div>
            </div>
        </div>
    );
};