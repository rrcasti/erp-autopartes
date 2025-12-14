import React, { useEffect, useState } from 'react';

const ReceiveModal = ({ order, onClose, onSuccess }) => {
    const [items, setItems] = useState(
        order.items?.map(i => ({ 
            id: i.id, // ID del item pivote
            product_id: i.product_id, 
            name: i.product?.nombre || i.product_name,
            qty_pending: i.quantity_ordered - i.quantity_received, 
            qty_to_receive: Math.max(0, i.quantity_ordered - i.quantity_received),
            new_cost: i.unit_price || 0
        })) || []
    );

    const handleSubmit = async () => {
        if(!confirm('¿Confirmar el ingreso de mercadería al stock con los costos actualizados?')) return;

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const payload = {
            items: items.filter(m => m.qty_to_receive > 0).map(m => ({ 
                id: m.id, 
                receive_qty: Number(m.qty_to_receive),
                new_cost: Number(m.new_cost)
            }))
        };
        
        if (payload.items.length === 0) return alert("Ingrese al menos una cantidad.");

        try {
            const resp = await fetch(`/erp/api/purchase-orders/${order.id}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token || ''
                },
                body: JSON.stringify(payload)
            });
            const res = await resp.json();
            if(resp.ok) {
                alert(res.message);
                onSuccess();
                onClose();
            } else {
                alert('Error: ' + (res.message || res.error || 'Desconocido'));
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Recibir Mercadería - OC #{order.id}</h3>
                
                <div className="flex-1 overflow-auto border rounded dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2">Producto</th>
                                <th className="px-4 py-2 text-right">Pedido</th>
                                <th className="px-4 py-2 text-right">Pendiente</th>
                                <th className="px-4 py-2 text-right w-28">A Ingresar</th>
                                <th className="px-4 py-2 text-right w-32">Costo (Unit.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {items.map((item, idx) => (
                                <tr key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-2 max-w-xs font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                                    <td className="px-4 py-2 text-right text-slate-500">{item.qty_pending + (item.qty_ordered_original || 0)}</td> 
                                    <td className="px-4 py-2 text-right font-bold">{item.qty_pending}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            min="0"
                                            max={item.qty_pending}
                                            className="w-full border rounded px-2 py-1 text-right font-bold text-emerald-600 bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500"
                                            value={item.qty_to_receive}
                                            onChange={e => {
                                                const newItems = [...items];
                                                newItems[idx].qty_to_receive = e.target.value;
                                                setItems(newItems);
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                                <span className="text-gray-500 sm:text-xs">$</span>
                                            </div>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                className="block w-full rounded border-gray-300 pl-5 px-2 py-1 text-right focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                value={item.new_cost}
                                                onChange={e => {
                                                    const newItems = [...items];
                                                    newItems[idx].new_cost = e.target.value;
                                                    setItems(newItems);
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium shadow-sm transition-colors">
                        Confirmar Ingreso y Costos
                    </button>
                </div>
            </div>
        </div>
    );
};

export const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const loadData = () => {
        setLoading(true);
        fetch('/erp/api/purchases/orders')
            .then(r => r.json())
            .then(res => setOrders(res.data || []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleOpenReceive = async (id) => {
        // Fetch full detail with items
        try {
            const resp = await fetch(`/erp/api/purchase-orders/${id}`);
            if(!resp.ok) throw new Error('Error fetch');
            const data = await resp.json();
            setSelectedOrder(data);
        } catch(e) { alert('Error cargando detalle: ' + e.message); }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Órdenes de Compra</h1>
            
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow overflow-auto border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-3"># OC</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Proveedor</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                         {loading ? <tr><td colSpan="6" className="p-4 text-center">Cargando...</td></tr> : 
                          orders.length === 0 ? <tr><td colSpan="6" className="p-12 text-center text-slate-400">No hay órdenes generadas.</td></tr> :
                          orders.map(o => (
                              <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                  <td className="px-6 py-3 font-mono text-xs font-bold">{o.po_number || `OC-${o.id}`}</td>
                                  <td className="px-6 py-3">{new Date(o.issued_at).toLocaleDateString()}</td>
                                  <td className="px-6 py-3 font-medium">{o.supplier?.razon_social || 'Desconocido'}</td>
                                  <td className="px-6 py-3 font-mono text-slate-900 dark:text-white">${o.total_amount || 0}</td>
                                  <td className="px-6 py-3 text-xs uppercase font-bold tracking-wider text-slate-500">{o.status}</td>
                                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                                      <a 
                                          href={`/erp/compras/ordenes/${o.id}`}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded shadow flex items-center"
                                      >
                                          Ver Detalle
                                      </a>

                                      {o.status !== 'received' && (
                                          <button 
                                              onClick={() => handleOpenReceive(o.id)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded shadow"
                                          >
                                              Recibir Mercadería
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))
                         }
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <ReceiveModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onSuccess={() => { loadData(); }} 
                />
            )}
        </div>
    );
};
