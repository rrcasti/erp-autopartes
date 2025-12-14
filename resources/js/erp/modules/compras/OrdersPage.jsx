import React, { useEffect, useState } from 'react';

const ReceiveModal = ({ order, onClose, onSuccess }) => {
    const [items, setItems] = useState(
        order.items?.map(i => ({ 
            product_id: i.product_id, 
            name: i.product?.nombre,
            qty_pending: i.quantity_ordered - i.quantity_received, 
            qty_to_receive: i.quantity_ordered - i.quantity_received 
        })) || []
    );

    const handleSubmit = async () => {
        if(!confirm('¿Confirmar el ingreso de mercadería al stock?')) return;

        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const payload = {
            received_items: items.map(m => ({ product_id: m.product_id, qty: Number(m.qty_to_receive) }))
        };
        
        try {
            const resp = await fetch(`/erp/api/purchases/orders/${order.id}/receive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                alert('Error: ' + JSON.stringify(res));
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Recibir Mercadería - OC #{order.id}</h3>
                
                <div className="flex-1 overflow-auto border rounded dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Producto</th>
                                <th className="px-4 py-2 text-right">Pedido</th>
                                <th className="px-4 py-2 text-right">Pendiente</th>
                                <th className="px-4 py-2 text-right w-32">A Ingresar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {items.map((item, idx) => (
                                <tr key={item.product_id}>
                                    <td className="px-4 py-2 max-w-xs">{item.name}</td>
                                    <td className="px-4 py-2 text-right text-slate-500">{item.qty_pending + (item.qty_ordered_original || 0)}</td> 
                                    <td className="px-4 py-2 text-right font-medium">{item.qty_pending}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            min="0"
                                            max={item.qty_pending}
                                            className="w-full border rounded px-2 py-1 text-right dark:bg-slate-700 dark:border-slate-600"
                                            value={item.qty_to_receive}
                                            onChange={e => {
                                                const newItems = [...items];
                                                newItems[idx].qty_to_receive = e.target.value;
                                                setItems(newItems);
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium">Confirmar Ingreso</button>
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
            const resp = await fetch(`/erp/api/purchases/orders/${id}`);
            const data = await resp.json();
            setSelectedOrder(data);
        } catch(e) { alert('Error cargando detalle'); }
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
