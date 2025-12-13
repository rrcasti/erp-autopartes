import React, { useState, useEffect } from 'react';
import { SearchableSelect } from '../../components/SearchableSelect';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

/**
 * Componente para gestionar proveedores de un producto.
 * Permite ver, agregar y eliminar proveedores con sus costos.
 */
export const ProveedoresManager = ({ productoId, onUpdate }) => {
    const [proveedores, setProveedores] = useState([]);
    const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
    const [selectedProveedor, setSelectedProveedor] = useState('');
    const [skuProveedor, setSkuProveedor] = useState('');
    const [precioLista, setPrecioLista] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProveedoresDisponibles();
        if (productoId) {
            fetchProveedoresDelProducto();
        }
    }, [productoId]);

    const fetchProveedoresDisponibles = async () => {
        try {
            const resp = await fetch('/erp/api/proveedores', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (resp.ok) {
                const data = await resp.json();
                setProveedoresDisponibles(data);
            }
        } catch (e) {
            console.error('Error cargando proveedores:', e);
        }
    };

    const fetchProveedoresDelProducto = async () => {
        try {
            const resp = await fetch(`/erp/api/productos/${productoId}/proveedores`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (resp.ok) {
                const data = await resp.json();
                setProveedores(data);
            }
        } catch (e) {
            console.error('Error cargando proveedores del producto:', e);
        }
    };


    const handleCreateProveedor = async (razon_social) => {
        const resp = await fetch('/erp/api/proveedores', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ razon_social })
        });

        if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(errData.message || 'Error al crear proveedor'); 
        }

        const newProv = await resp.json();
        setProveedoresDisponibles(prev => [...prev, newProv].sort((a,b) => a.razon_social.localeCompare(b.razon_social)));
        return newProv; // Retorna {id, razon_social...}
    };

    const handleAgregarProveedor = async () => {
        if (!productoId) {
            setError('Primero debes crear el producto');
            return;
        }

        if (!selectedProveedor || !precioLista) {
            setError('Completa todos los campos obligatorios');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const resp = await fetch(`/erp/api/productos/${productoId}/proveedores`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    proveedor_id: selectedProveedor,
                    sku_proveedor: skuProveedor || null,
                    precio_lista: parseFloat(precioLista),
                }),
            });

            if (!resp.ok) {
                throw new Error('Error al agregar proveedor');
            }

            const data = await resp.json();
            setProveedores(data.proveedores);
            
            // Limpiar formulario
            setSelectedProveedor('');
            setSkuProveedor('');
            setPrecioLista('');

            if (onUpdate) {
                onUpdate(data.proveedores);
            }
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarProveedor = async (proveedorId) => {
        if (!window.confirm('¿Eliminar este proveedor?')) {
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`/erp/api/productos/${productoId}/proveedores/${proveedorId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error('Error al eliminar proveedor');
            }

            // Actualizar lista eliminando el proveedor
            const nuevosProveedores = proveedores.filter((p) => p.proveedor_id !== proveedorId);
            setProveedores(nuevosProveedores);

            if (onUpdate) {
                onUpdate(nuevosProveedores);
            }
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                🧾 Proveedores del Producto
            </h3>

            {/* Lista de proveedores asociados */}
            {/* Lista de proveedores asociados */}
            {proveedores && proveedores.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {proveedores.map((pp) => (
                        <div
                            key={pp.id}
                            className="inline-flex items-center gap-2 text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm"
                        >
                            <span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {pp.proveedor?.razon_social || pp.proveedor?.nombre_fantasia || '?'}
                                </span>
                                {pp.sku_proveedor && (
                                    <span className="ml-1 text-slate-500 dark:text-slate-400">
                                        [{pp.sku_proveedor}]
                                    </span>
                                )}
                                <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    $ {parseFloat(pp.precio_lista || 0).toFixed(2)}
                                </span>
                            </span>
                            <button
                                onClick={() => handleEliminarProveedor(pp.proveedor_id)}
                                className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                                disabled={loading}
                                title="Eliminar proveedor"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar proveedor */}
            <div className="text-[11px] space-y-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                    Agregar proveedor:
                </p>

                <div className="grid grid-cols-3 gap-2">
                    <div className="relative z-50">
                        <SearchableSelect
                            value={selectedProveedor}
                            options={proveedoresDisponibles}
                            onChange={(val) => setSelectedProveedor(val)}
                            onCreate={handleCreateProveedor}
                            placeholder="Proveedor..."
                            disabled={!productoId}
                        />
                    </div>

                    <input
                        type="text"
                        value={skuProveedor}
                        onChange={(e) => setSkuProveedor(e.target.value)}
                        placeholder="SKU Prov."
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                        disabled={!productoId}
                    />

                    <input
                        type="number"
                        step="0.01"
                        value={precioLista}
                        onChange={(e) => setPrecioLista(e.target.value)}
                        placeholder="Costo $"
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                        disabled={!productoId}
                    />
                </div>

                <button
                    onClick={handleAgregarProveedor}
                    disabled={!productoId || !selectedProveedor || !precioLista || loading}
                    className="w-full px-2 py-1 rounded bg-blue-600 text-white text-[11px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Agregando...' : '+ Agregar proveedor'}
                </button>

                {error && <div className="text-[10px] text-rose-600 dark:text-rose-400">{error}</div>}

                {!productoId && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        💡 Primero crea el producto para poder agregar proveedores.
                    </p>
                )}
            </div>
        </div>
    );
};
