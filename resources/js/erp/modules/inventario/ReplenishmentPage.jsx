import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const ReplenishmentPage = () => {
    const [history, setHistory] = useState([]);
    const [draftRun, setDraftRun] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // ... loadData y handlers igual ...
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/erp/api/inventory/replenishment/runs');
            const json = await res.json();
            if (json.success) {
                const allRuns = json.data;
                const active = allRuns.find(r => r.status === 'DRAFT');
                setDraftRun(active || null);
                setHistory(allRuns.filter(r => r.status !== 'DRAFT'));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleGenerate = async (force = false) => {
        if (!confirm('¿Generar nueva reposición basada en el backlog pendiente?')) return;
        
        try {
            const res = await fetch('/erp/api/inventory/replenishment/runs/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ force })
            });
            const json = await res.json();
            
            if (json.success) {
                if (json.is_existing) {
                    alert('Ya existe una reposición en curso. Mostrando borrador actual.');
                } else {
                    alert('Reposición generada con éxito.');
                }
                loadData();
            } else {
                alert('No se pudo generar: ' + json.message);
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    const handleCloseRun = async (runId) => {
        if (!confirm('ATENCIÓN: ¿Cerrar este ciclo de reposición?\n\nAl cerrar, confirmas que ya has procesado las compras. El sistema marcará un PUNTO DE CORTE.\nLa próxima reposición comenzará a contar desde este momento.')) return;

        try {
            const res = await fetch(`/erp/api/inventory/replenishment/runs/${runId}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const json = await res.json();
            if (json.success) {
                alert('Ciclo cerrado correctamente.');
                loadData();
            } else {
                alert('Error al cerrar: ' + json.message);
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reposición Automática</h1>
                    <p className="text-sm text-slate-500">Gestión de ciclos de compra acumulativos.</p>
                </div>
                {!draftRun && (
                    <button 
                        onClick={() => handleGenerate(false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow font-medium"
                    >
                        + Generar Nueva Reposición
                    </button>
                )}
            </div>

            {/* SECCIÓN RUN ACTIVO */}
            {draftRun && (
                <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow border-l-4 border-amber-500 p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-amber-600 mb-2">⚠️ Reposición en Curso (Borrador)</h2>
                            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                <p><strong>Generado el:</strong> {new Date(draftRun.generated_at).toLocaleString()}</p>
                                <p><strong>Rango cubierto:</strong> {new Date(draftRun.from_at).toLocaleString()} ➜ {new Date(draftRun.to_at).toLocaleString()}</p>
                                <p><strong>Items:</strong> {draftRun.items_count} productos de {draftRun.suppliers_count} proveedores.</p>
                                <p className="mt-2 text-xs bg-slate-100 p-2 rounded inline-block">{draftRun.notes}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {/* Botón Ver Requisición */}
                            {draftRun.requisition_id && (
                                <Link 
                                    to={`/compras/solicitudes/${draftRun.requisition_id}`} 
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-center text-sm font-medium"
                                >
                                    Ver Requisición #{draftRun.requisition_id}
                                </Link>
                            )}
                            
                            <button 
                                onClick={() => handleCloseRun(draftRun.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow text-sm font-bold"
                            >
                                ✅ Cerrar Reposición
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORIAL */}
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Historial de Cierres</h3>
            <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded shadow border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Generado</th>
                            <th className="px-6 py-3">Cerrado</th>
                            <th className="px-6 py-3">Items</th>
                            <th className="px-6 py-3">Requisición</th>
                            <th className="px-6 py-3">Generado Por</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? <tr><td colSpan="7" className="p-4 text-center">Cargando...</td></tr> : 
                         history.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-400">No hay historial.</td></tr> :
                         history.map(run => (
                             <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                 <td className="px-6 py-3 font-mono text-xs">#{run.id}</td>
                                 <td className="px-6 py-3">
                                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${run.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                         {run.status}
                                     </span>
                                 </td>
                                 <td className="px-6 py-3 text-xs text-slate-500">
                                     {new Date(run.generated_at).toLocaleDateString()}
                                 </td>
                                 <td className="px-6 py-3 text-xs text-slate-500">
                                     {run.closed_at ? new Date(run.closed_at).toLocaleDateString() : '-'}
                                 </td>
                                 <td className="px-6 py-3 font-bold">{run.items_count}</td>
                                 <td className="px-6 py-3 text-xs">
                                     {run.requisition_id ? (
                                         <Link to={`/compras/solicitudes/${run.requisition_id}`} className="text-indigo-600 hover:text-indigo-800 font-bold underline">
                                             REQ #{run.requisition_id}
                                         </Link>
                                     ) : '-'}
                                 </td>
                                 <td className="px-6 py-3 text-xs">
                                     {run.generated_by?.name || 'User ' + run.generated_by}
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
