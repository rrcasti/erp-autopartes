
import React, { useEffect, useRef, useState } from 'react';
import { CompatibilidadesManager } from './CompatibilidadesManager';
import { VehiculoFilterPanel } from './VehiculoFilterPanel';
import { SearchableSelect } from '../../components/SearchableSelect';

const csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
    '';

const emptyProduct = {
    id: null,
    sku_interno: '',
    codigo_barra: '',
    nombre: '',
    descripcion_corta: '',
    marca_id: null,
    proveedor_id: null,
    familia_id: null,
    subfamilia_id: null,
    unidad_medida: 'UNIDAD', // Default
    origen: 'NACIONAL',      // Default
    estado: 'NUEVO',         // Default
    
    // Precios
    precio_lista: '',
    precio_oferta: '',
    moneda: 'ARS',
    
    // Costos
    costo_promedio: '',
    costo_ultima_compra: '',
    
    alicuota_iva: '21.00',
    
    // Flags
    stock_controlado: true,
    stock_disponible: '',
    es_kit: false,
    activo: true,
    visible_web: true,
    destacado_web: false,
};

// HELPER: Renderizar compatibilidad inteligente
const renderCompatibilidad = (vehiculos, filters) => {
    if (!vehiculos || vehiculos.length === 0) return <span className="text-slate-400">-</span>;

    let list = [...vehiculos];

    // ORDEN INTELIGENTE: Si hay filtro de modelo, priorizar coincidencia
    if (filters?.vehiculo_modelo_id) {
        list.sort((a, b) => {
            const aMatch = String(a.vehiculo_modelo_id) === String(filters.vehiculo_modelo_id);
            const bMatch = String(b.vehiculo_modelo_id) === String(filters.vehiculo_modelo_id);
            return bMatch - aMatch; // true (1) va primero
        });
    } else if (filters?.vehiculo_marca_id) {
         list.sort((a, b) => {
            const aMatch = String(a.vehiculo_marca_id) === String(filters.vehiculo_marca_id);
            const bMatch = String(b.vehiculo_marca_id) === String(filters.vehiculo_marca_id);
            return bMatch - aMatch;
        });
    }

    const MAX_SHOW = 2; // Mostrar máx 2 líneas
    const visible = list.slice(0, MAX_SHOW);
    const hasMore = list.length > MAX_SHOW;

    return (
        <div className="flex flex-col gap-0.5 leading-tight">
            {visible.map(v => {
                const range = (v.anio_desde || v.anio_hasta) 
                    ? `(${v.anio_desde || '...'} - ${v.anio_hasta || '...'})`
                    : '';
                const motor = v.motor ? v.motor : '';
                return (
                    <div key={v.id} className="truncate max-w-[200px]" title={`${v.marca?.nombre} ${v.modelo?.nombre} ${range} ${motor}`}>
                        <span className="font-semibold text-sky-700 dark:text-sky-400">{v.marca?.nombre} {v.modelo?.nombre}</span> 
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">{range} {motor}</span>
                    </div>
                );
            })}
            {hasMore && (
                <span className="text-[10px] text-slate-400 italic">
                    +{list.length - MAX_SHOW} vehículos más...
                </span>
            )}
        </div>
    );
};

export const ProductosListPage = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState(emptyProduct);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [vehiculoFilters, setVehiculoFilters] = useState({});

    // Catálogos auxiliares
    const [marcasProductos, setMarcasProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    
    // Estados auxiliares
    const [familias, setFamilias] = useState([]);
    const [modelos, setModelos] = useState([]);

    const barcodeRef = useRef(null);

    // Cargar productos y catálogos iniciales
    useEffect(() => {
        fetchProductos();
        fetchMarcasProductos();
        fetchFamilias();
        fetchProveedores();
    }, [page, search, vehiculoFilters]);

    // Cargar productos
    useEffect(() => {
        fetchProductos();
    }, [page, search, vehiculoFilters]);

    const fetchProductos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                q: search,
                page: page.toString(),
                per_page: '50',
                ...vehiculoFilters, // Agregar filtros de vehículo al request
            });

            const resp = await fetch(`/erp/api/productos?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error('Error al cargar productos');
            }

            const json = await resp.json();
            setProductos(json.data || []);
            setMeta(json.meta || null);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarcasProductos = async () => {
        try {
            const resp = await fetch('/erp/marcas-productos', {
                headers: { 'Accept': 'application/json' }
            });
            if (resp.ok) {
                const data = await resp.json();
                setMarcasProductos(data);
            }
        } catch (e) {
            console.error('Error cargando marcas productos', e);
        }
    };

    const fetchFamilias = async () => {
        try {
            const resp = await fetch('/erp/api/familias', {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const data = await resp.json();
                setFamilias(data);
            }
        } catch (e) {
            console.error('Error cargando familias', e);
        }
    };

    const fetchProveedores = async () => {
        try {
            const resp = await fetch('/erp/api/proveedores', { 
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });
            if (resp.ok) {
                const data = await resp.json();
                setProveedores(data);
            }
        } catch (e) {
            console.error('Error cargando proveedores', e);
        }
    };

    const handleCreateMarca = async (nombre) => {
        const resp = await fetch('/erp/api/marcas-productos', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ nombre })
        });
        
        if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(errData.message || 'Error al crear la marca');
        }

        const newMarca = await resp.json();
        // Agregamos a la lista localmente
        setMarcasProductos(prev => [...prev, newMarca].sort((a,b) => a.nombre.localeCompare(b.nombre)));
        return newMarca;
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
        setProveedores(prev => [...prev, newProv].sort((a,b) => a.razon_social.localeCompare(b.razon_social)));
        return newProv;
    };

    // Abrir modal nuevo producto
    const handleNew = () => {
        setEditing(false);
        setFormData(emptyProduct);
        setModalOpen(true);
    };


    // Abrir modal edición
    const handleEdit = async (producto) => {
        setEditing(true);
        setLoading(true);
        setError(null);

        try {
            // Cargar el producto completo con sus relaciones (vehiculos incluidos)
            const resp = await fetch(`/erp/api/productos/${producto.id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error('Error al cargar el producto');
            }

            const productoCompleto = await resp.json();

            setFormData({
                ...emptyProduct,
                ...productoCompleto,
                // Normalizamos numéricos a string para los inputs
                precio_lista:
                    productoCompleto.precio_lista !== null && productoCompleto.precio_lista !== undefined
                        ? String(productoCompleto.precio_lista)
                        : '',
                precio_oferta:
                    productoCompleto.precio_oferta !== null && productoCompleto.precio_oferta !== undefined
                        ? String(productoCompleto.precio_oferta)
                        : '',
                costo_promedio:
                    productoCompleto.costo_promedio !== null &&
                    productoCompleto.costo_promedio !== undefined
                        ? String(productoCompleto.costo_promedio)
                        : '',
                costo_ultima_compra:
                    productoCompleto.costo_ultima_compra !== undefined
                        ? String(productoCompleto.costo_ultima_compra)
                        : '',
                alicuota_iva:
                    productoCompleto.alicuota_iva !== null &&
                    productoCompleto.alicuota_iva !== undefined
                        ? String(productoCompleto.alicuota_iva)
                        : '21.00',
                stock_disponible:
                    productoCompleto.stock_disponible !== null &&
                    productoCompleto.stock_disponible !== undefined
                        ? String(productoCompleto.stock_disponible)
                        : '',
            });

            setModalOpen(true);
        } catch (e) {
            console.error(e);
            setError('No se pudo cargar el producto completo');
        } finally {
            setLoading(false);
        }
    };


    // Guardar (crear/editar)
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const method = editing ? 'PUT' : 'POST';
            const url = editing
                ? `/erp/api/productos/${formData.id}`
                : '/erp/api/productos';

            const bodyPayload = {
                sku_interno: formData.sku_interno || null,
                codigo_barra: formData.codigo_barra || null,
                nombre: formData.nombre,
                descripcion_corta: formData.descripcion_corta || null,
                marca_id: formData.marca_id || null,
                proveedor_id: formData.proveedor_id || null,
                
                // STOCK
                stock_disponible: formData.stock_disponible !== '' && formData.stock_disponible !== null 
                    ? Number(formData.stock_disponible) 
                    : null,

                // PRECIOS DE VENTA
                precio_lista:
                    formData.precio_lista !== '' && formData.precio_lista !== null
                        ? Number(formData.precio_lista)
                        : null,
                precio_oferta:
                    formData.precio_oferta !== '' && formData.precio_oferta !== null
                        ? Number(formData.precio_oferta)
                        : null,
                moneda: formData.moneda || 'ARS',

                // COSTOS INTERNOS
                costo_promedio:
                    formData.costo_promedio !== '' &&
                    formData.costo_promedio !== null
                        ? Number(formData.costo_promedio)
                        : null,
                costo_ultima_compra:
                    formData.costo_ultima_compra !== '' &&
                    formData.costo_ultima_compra !== null
                        ? Number(formData.costo_ultima_compra)
                        : null,

                // IVA
                alicuota_iva:
                    formData.alicuota_iva !== '' &&
                    formData.alicuota_iva !== null
                        ? Number(formData.alicuota_iva)
                        : null,

                // FLAGS
                stock_controlado: !!formData.stock_controlado,
                activo: !!formData.activo,
            };

            const resp = await fetch(url, {
                method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify(bodyPayload),
            });

            if (!resp.ok) {
                const errJson = await resp.json().catch(() => null);
                const msg =
                    errJson?.message ||
                    'Error al guardar el producto. Revisá los datos.';
                throw new Error(msg);
            }

            // Obtener el producto creado/actualizado con sus relaciones (incluyendo vehículos)
            const productoGuardado = await resp.json();
            
            // SIEMPRE actualizar formData con el producto guardado para mostrar compatibilidades
            setFormData({
                ...formData,
                ...productoGuardado,
                // Mantener los valores numéricos como strings para los inputs
                precio_lista: productoGuardado.precio_lista !== null ? String(productoGuardado.precio_lista) : '',
                precio_oferta: productoGuardado.precio_oferta !== null ? String(productoGuardado.precio_oferta) : '',
                costo_promedio: productoGuardado.costo_promedio !== null ? String(productoGuardado.costo_promedio) : '',
                costo_ultima_compra: productoGuardado.costo_ultima_compra !== null ? String(productoGuardado.costo_ultima_compra) : '',
                alicuota_iva: productoGuardado.alicuota_iva !== null ? String(productoGuardado.alicuota_iva) : '21.00',
            });
            
            // Cambiar a modo edición si estábamos creando
            if (!editing) {
                setEditing(true);
            }
            
            // Refrescar la lista en background
            fetchProductos();
            
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // Baja lógica
    const handleDelete = async (producto) => {
        if (!window.confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) {
            return;
        }
        try {
            const resp = await fetch(`/erp/api/productos/${producto.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error('No se pudo dar de baja el producto.');
            }

            await fetchProductos();
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    // Lector de código de barras: Enter dispara búsqueda
    const handleBarcodeKeyDown = async (e) => {
        if (e.key !== 'Enter' || !e.target.value.trim()) return;

        const codigo = e.target.value.trim();
        e.target.value = '';

        try {
            const resp = await fetch(
                `/erp/api/productos-barcode/${encodeURIComponent(codigo)}`,
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }
            );

            if (resp.ok) {
                const producto = await resp.json();
                // Abrimos directamente la edición
                handleEdit(producto);
            } else if (resp.status === 404) {
                if (
                    window.confirm(
                        `No se encontró producto con código ${codigo}. ¿Crear uno nuevo con este código de barras?`
                    )
                ) {
                    handleNew();
                    setFormData((prev) => ({
                        ...prev,
                        codigo_barra: codigo,
                    }));
                }
            } else {
                throw new Error('Error al buscar por código de barras.');
            }
        } catch (e) {
            console.error(e);
            alert(e.message);
        }
    };

    return (
        <div className="h-full flex flex-col gap-3 text-xs">
            {/* Encabezado */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Productos
                    </h1>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        Listado maestro de productos del ERP. Desde acá podés crear, editar,
                        dar de baja y buscar por código de barras.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleNew}
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60"
                        disabled={loading}
                    >
                        + Nuevo producto
                    </button>
                </div>
            </div>

            {/* Panel de Filtros Avanzados por Vehículo */}
            <div className="mt-4">
                <VehiculoFilterPanel 
                    onFilterApply={(filters) => {
                        setVehiculoFilters(filters);
                        setPage(1); 
                    }}
                    onClear={() => {
                        setVehiculoFilters({});
                        setPage(1);
                    }}
                />
            </div>

            {/* Barra de búsqueda + lector */}
            <div className="flex flex-wrap gap-2 items-center">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    placeholder="Buscar por SKU, código de barras o nombre..."
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-500/30 focus:border-blue-500 w-72 dark:bg-slate-900 dark:border-slate-600"
                />
                <input
                    type="text"
                    ref={barcodeRef}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanear código de barras (lector)"
                    className="text-xs bg-white border border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-emerald-500/30 focus:border-emerald-500 w-64 dark:bg-slate-900 dark:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    El lector escribe el código y envía Enter automáticamente.
                </span>
            </div>

            {error && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400">
                    {error}
                </div>
            )}

            {/* Tabla */}
            <div className="flex-1 min-h-0 overflow-auto border border-slate-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700">
                <table className="min-w-full text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        <tr>
                            <th className="px-2 py-1 text-left w-32">SKU interno</th>
                            <th className="px-2 py-1 text-left w-32">Código barras</th>
                            <th className="px-2 py-1 text-left">Nombre</th>
                            <th className="px-2 py-1 text-left w-40">Proveedor</th>
                            <th className="px-2 py-1 text-left w-48">Compatibilidad</th>
                            <th className="px-2 py-1 text-left w-28">Marca</th>
                            <th className="px-2 py-1 text-right w-24">Precio lista</th>
                            <th className="px-2 py-1 text-center w-20">Activo</th>
                            <th className="px-2 py-1 text-right w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                                >
                                    Cargando productos...
                                </td>
                            </tr>
                        )}

                        {!loading && productos.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-2 py-3 text-center text-slate-500 dark:text-slate-400"
                                >
                                    No se encontraron productos.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            productos.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                                    onDoubleClick={() => handleEdit(p)}
                                >
                                    <td className="px-2 py-1 font-mono text-[11px]">
                                        {p.sku_interno}
                                    </td>
                                    <td className="px-2 py-1 font-mono text-[11px]">
                                        {p.codigo_barra || '-'}
                                    </td>
                                    <td className="px-2 py-1 font-medium text-slate-700 dark:text-slate-200">{p.nombre}</td>
                                    
                                    {/* COLUMNA PROVEEDOR */}
                                    <td className="px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200">
                                        {p.proveedor?.razon_social || '-'}
                                    </td>

                                    <td className="px-2 py-1 text-[10px]">
                                        {renderCompatibilidad(p.vehiculos, vehiculoFilters)}
                                    </td>
                                    <td className="px-2 py-1">
                                        {p.marca?.nombre || '-'}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                        {p.precio_lista != null ? `$ ${p.precio_lista}` : '-'}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                        {p.activo ? (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-1 text-right space-x-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(p);
                                            }}
                                            className="px-2 py-0.5 rounded border border-slate-300 text-[11px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(p);
                                            }}
                                            className="px-2 py-0.5 rounded border border-rose-300 text-[11px] text-rose-700 hover:bg-rose-50 dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-900/40"
                                        >
                                            Baja
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación simple */}
            {meta && meta.last_page > 1 && (
                <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    <div>
                        Página {meta.current_page} de {meta.last_page} — {meta.total} productos
                    </div>
                    <div className="space-x-1">
                        <button
                            disabled={meta.current_page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-2 py-0.5 rounded border border-slate-300 disabled:opacity-40 dark:border-slate-600"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() =>
                                setPage((p) => Math.min(meta.last_page, p + 1))
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 disabled:opacity-40 dark:border-slate-600"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Modal alta/edición */}
            {modalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg w-full max-w-4xl shadow-lg flex flex-col max-h-[90vh]">
                        {/* Header fijo */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="font-semibold text-lg dark:text-slate-100">
                                {editing ? 'Editar producto' : 'Nuevo producto'}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 text-2xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cuerpo scrolleable */}
                        <div className="overflow-y-auto px-6 py-4 flex-1 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* COLUMNA 1: Datos Básicos */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                                        Datos Básicos
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="flex flex-col gap-0.5">
                                            <span>SKU interno</span>
                                            <input
                                                type="text"
                                                value={formData.sku_interno}
                                                onChange={(e) => setFormData({...formData, sku_interno: e.target.value})}
                                                placeholder="Autogenerado"
                                                className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-0.5">
                                            <span>Código de barras</span>
                                            <input
                                                type="text"
                                                value={formData.codigo_barra}
                                                onChange={(e) => setFormData({...formData, codigo_barra: e.target.value})}
                                                className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                            />
                                        </label>
                                    </div>

                                    <label className="flex flex-col gap-0.5">
                                        <span>Nombre del producto *</span>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                            className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600 font-medium"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-0.5 z-50">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Marca del Producto</span>
                                        <SearchableSelect
                                            value={formData.marca_id}
                                            options={marcasProductos}
                                            onChange={(val) => setFormData({...formData, marca_id: val})}
                                            onCreate={handleCreateMarca}
                                            placeholder="Buscar o crear marca..."
                                        />
                                    </label>

                                    <label className="flex flex-col gap-0.5 z-40">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Proveedor Principal</span>
                                        <SearchableSelect
                                            value={formData.proveedor_id}
                                            options={proveedores}
                                            onChange={(val) => setFormData({...formData, proveedor_id: val})}
                                            onCreate={handleCreateProveedor}
                                            placeholder="Buscar o crear proveedor..."
                                        />
                                    </label>

                                    <label className="flex flex-col gap-0.5">
                                        <span>Descripción corta / Notas</span>
                                        <textarea
                                            rows="2"
                                            value={formData.descripcion_corta || ''}
                                            onChange={(e) => setFormData({...formData, descripcion_corta: e.target.value})}
                                            className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600 resize-none"
                                        />
                                    </label>
                                </div>

                                {/* COLUMNA 2: Precios, Costos y Stock */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                                        Precios y Stock
                                    </h3>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="flex flex-col gap-0.5">
                                            <span>Precio Lista (Venta)</span>
                                            <input
                                                type="number" step="0.01"
                                                value={formData.precio_lista || ''}
                                                onChange={(e) => setFormData({...formData, precio_lista: e.target.value})}
                                                className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-0.5">
                                            <span>Precio Oferta</span>
                                            <input
                                                type="number" step="0.01"
                                                value={formData.precio_oferta || ''}
                                                onChange={(e) => setFormData({...formData, precio_oferta: e.target.value})}
                                                className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="flex flex-col gap-0.5">
                                            <span>Costo </span>
                                            <input
                                                type="number" step="0.01"
                                                value={formData.costo_promedio || ''}
                                                onChange={(e) => setFormData({...formData, costo_promedio: e.target.value})}
                                                className="border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                                            />
                                        </label>
                                        <div className="flex flex-col gap-0.5">
                                            <span>Moneda / IVA</span>
                                            <div className="flex gap-1">
                                                <select
                                                    value={formData.moneda}
                                                    onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                                                    className="w-16 border border-slate-300 rounded px-1 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                                >
                                                    <option value="ARS">ARS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={formData.alicuota_iva}
                                                    onChange={(e) => setFormData({...formData, alicuota_iva: e.target.value})}
                                                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-slate-600"
                                                    placeholder="%"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.stock_controlado}
                                                    onChange={(e) => setFormData({...formData, stock_controlado: e.target.checked})}
                                                />
                                                <span>Controlar stock</span>
                                            </label>
                                            
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.activo}
                                                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                                />
                                                <span>Activo</span>
                                            </label>
                                        </div>

                                        {formData.stock_controlado && (
                                            <label className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">Stock Disponible Actual</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.stock_disponible || ''}
                                                    onChange={(e) => setFormData({...formData, stock_disponible: e.target.value})}
                                                    className="border border-blue-300 rounded px-2 py-1 text-[11px] dark:bg-slate-900 dark:border-blue-700 font-bold"
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="my-4 border-slate-200 dark:border-slate-700" />

                        {/* Gestor de Compatibilidades con Vehículos */}
                        <CompatibilidadesManager
                            productoId={formData.id}
                            vehiculos={formData.vehiculos || []}
                            onUpdate={(nuevosVehiculos) => {
                                setFormData({
                                    ...formData,
                                    vehiculos: nuevosVehiculos,
                                });
                            }}
                        />

                        </div>
                        {/* Fin del cuerpo scrolleable */}

                        {/* Footer fijo con botones */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            {error && (
                                <div className="text-[11px] text-rose-600 dark:text-rose-400">
                                    {error}
                                </div>
                            )}

                            <div className="ml-auto space-x-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded border border-slate-300 text-sm dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Guardando...'
                                        : editing
                                        ? 'Guardar cambios'
                                        : 'Crear producto'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
