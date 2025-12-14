import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const StatusBadge = ({ status }) => {
    const colors = {
        draft: 'bg-slate-100 text-slate-800',
        approved: 'bg-blue-100 text-blue-800',
        converted: 'bg-emerald-100 text-emerald-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status] || colors.draft}`}>
            {status}
        </span>
    );
};

export const RequisitionsPage = () => {
    const [reqs, setReqs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        fetch('/erp/api/purchases/requisitions')
            .then(r => r.json())
            .then(res => setReqs(res.data || []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleConvert = (id) => {
        if(!confirm('¿Estás seguro de convertir este borrador en una ORDEN DE COMPRA oficial?\nEsta acción no se puede deshacer.')) return;
        
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        fetch(`/erp/api/purchase-orders/from-requisition/${id}`, { 
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json', // Importante para recibir JSON en caso de error
                 'X-CSRF-TOKEN': token || ''
            }
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error);
            else {
                alert('Orden Generada #' + res.po_id);
                loadData();
                // Navegar a la orden
                // window.location.hash = `/compras/ordenes/${res.po_id}`; // Si usas HashRouter
                // O via navigate si tuviera hook, pero aqui no lo tiene fácil. 
            }
        });
    };

    const handleDelete = (id) => {
        if(!confirm('¿Seguro de eliminar esta Requisición?\n\nSi fue generada automáticamente, esto revertirá parcialmente el proceso de solicitud.')) return;
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/erp/api/purchases/requisitions/${id}`, {
             method: 'DELETE',
             headers: {
                 'Accept': 'application/json',
                 'Content-Type': 'application/json',
                 'X-CSRF-TOKEN': token || ''
             }
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) alert(res.error);
            else {
                alert(res.message || 'Eliminada.');
                loadData();
            }
        })
        .catch(err => alert('Error de red.'));
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Requisiciones de Compra</h1>
                <p className="text-sm text-slate-500">Borradores generados manual o automáticamente pendientes de aprobación.</p>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow overflow-auto border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-3"># ID</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Proveedor Sugerido</th>
                            <th className="px-6 py-3">Monto Estimado</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                         {loading ? <tr><td colSpan="6" className="p-4 text-center">Cargando...</td></tr> : 
                          reqs.length === 0 ? <tr><td colSpan="6" className="p-12 text-center text-slate-400">No hay requisiciones pendientes.</td></tr> :
                          reqs.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                  <td className="px-6 py-3 font-mono text-xs">
                                      <Link to={`/compras/solicitudes/${r.id}`} className="text-indigo-600 hover:text-indigo-900 font-bold hover:underline">
                                          REQ-{r.id}
                                      </Link>
                                  </td>
                                  <td className="px-6 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                                  <td className="px-6 py-3 font-medium">{r.supplier?.razon_social || 'Desconocido'}</td>
                                  <td className="px-6 py-3 font-mono">${Number(r.expected_total || 0).toFixed(2)}</td>
                                  <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                                  <td className="px-6 py-3 text-right">
                                      <div className="flex justify-end items-center gap-2">
                                          <button 
                                              onClick={() => handleDelete(r.id)} 
                                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition" 
                                              title="Eliminar Solicitud"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                          
                                          {r.status !== 'converted' && (
                                              <button 
                                                  onClick={() => handleConvert(r.id)}
                                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded shadow"
                                              >
                                                  Generar Orden
                                              </button>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))
                         }
                    </tbody>
                </table>
            </div>
        </div>
    );
};
