import React, { useState, useEffect } from 'react';

const csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

/**
 * Componente para gestionar compatibilidades de vehículos en un producto.
 * Permite ver, agregar y eliminar compatibilidades.
 */
export const CompatibilidadesManager = ({ productoId, vehiculos, onUpdate }) => {
    const [marcas, setMarcas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

    const [selectedMarca, setSelectedMarca] = useState('');
    const [selectedModelo, setSelectedModelo] = useState('');
    const [anioDesde, setAnioDesde] = useState('');
    const [anioHasta, setAnioHasta] = useState('');
    const [motor, setMotor] = useState('');
    const [version, setVersion] = useState('');
    const [observacion, setObservacion] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar marcas al montar
    useEffect(() => {
        fetchMarcas();
    }, []);

    // Cargar modelos cuando cambia la marca
    useEffect(() => {
        if (selectedMarca) {
            fetchModelos(selectedMarca);
        } else {
            setModelos([]);
        }
    }, [selectedMarca]);

    // Cargar vehículos cuando cambia el modelo
    useEffect(() => {
        if (selectedModelo) {
            fetchVehiculos(selectedMarca, selectedModelo);
        } else {
            setVehiculosDisponibles([]);
        }
    }, [selectedModelo]);

    const fetchMarcas = async () => {
        try {
            const resp = await fetch('/erp/api/vehiculos/marcas', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (resp.ok) {
                const data = await resp.json();
                setMarcas(data);
            }
        } catch (e) {
            console.error('Error cargando marcas:', e);
        }
    };

    const fetchModelos = async (marcaId) => {
        try {
            const resp = await fetch(`/erp/api/vehiculos/modelos?vehiculo_marca_id=${marcaId}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (resp.ok) {
                const data = await resp.json();
                setModelos(data);
            }
        } catch (e) {
            console.error('Error cargando modelos:', e);
        }
    };

    const fetchVehiculos = async (marcaId, modeloId) => {
        try {
            const resp = await fetch(
                `/erp/api/vehiculos?vehiculo_marca_id=${marcaId}&vehiculo_modelo_id=${modeloId}`,
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }
            );
            if (resp.ok) {
                const data = await resp.json();
                setVehiculosDisponibles(data);
            }
        } catch (e) {
            console.error('Error cargando vehículos:', e);
        }
    };

    const handleAgregarCompatibilidad = async () => {
        if (!productoId) {
            setError('Primero debes crear el producto');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Si hay un vehículo específico seleccionado de la lista
            if (vehiculosDisponibles.length > 0 && anioDesde) {
                const vehiculoExacto = vehiculosDisponibles.find(
                    (v) =>
                        v.anio_desde == anioDesde &&
                        (v.anio_hasta == anioHasta || (!v.anio_hasta && !anioHasta))
                );

                if (vehiculoExacto) {
                    await agregarVehiculo(vehiculoExacto.id);
                    limpiarFormulario();
                    return;
                }
            }

            // Si no existe el vehículo exacto, crearlo primero
            const nuevoVehiculo = await crearVehiculo();
            if (nuevoVehiculo) {
                await agregarVehiculo(nuevoVehiculo.id);
                limpiarFormulario();
            }
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const crearVehiculo = async () => {
        const resp = await fetch('/erp/api/vehiculos/crear', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                vehiculo_marca_id: selectedMarca,
                vehiculo_modelo_id: selectedModelo,
                anio_desde: anioDesde || null,
                anio_hasta: anioHasta || null,
                motor: motor || null,
                version: version || null,
            }),
        });

        if (!resp.ok) {
            throw new Error('Error al crear el vehículo');
        }

        return await resp.json();
    };

    const agregarVehiculo = async (vehiculoId) => {
        const resp = await fetch(`/erp/api/productos/${productoId}/vehiculos`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                vehiculo_id: vehiculoId,
                observacion: observacion || null,
            }),
        });

        if (!resp.ok) {
            throw new Error('Error al agregar la compatibilidad');
        }

        const data = await resp.json();
        onUpdate(data.vehiculos);
    };

    const handleEliminarCompatibilidad = async (vehiculoId) => {
        if (!window.confirm('¿Eliminar esta compatibilidad?')) {
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`/erp/api/productos/${productoId}/vehiculos/${vehiculoId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error('Error al eliminar la compatibilidad');
            }

            // Actualizar la lista eliminando el vehículo
            const nuevosVehiculos = vehiculos.filter((v) => v.id !== vehiculoId);
            onUpdate(nuevosVehiculos);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        setSelectedMarca('');
        setSelectedModelo('');
        setAnioDesde('');
        setAnioHasta('');
        setMotor('');
        setVersion('');
        setObservacion('');
        setVehiculosDisponibles([]);
        setModelos([]);
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                🚗 Compatibilidad con Vehículos
            </h3>

            {/* Lista de compatibilidades existentes */}
            {/* Lista de compatibilidades existentes */}
            {vehiculos && vehiculos.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {vehiculos.map((v) => (
                        <div
                            key={v.id}
                            className="inline-flex items-center gap-2 text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full border border-blue-200 dark:border-blue-700 shadow-sm"
                        >
                            <span>
                                <span className="font-bold text-blue-900 dark:text-blue-100">{v.marca?.nombre}</span>{' '}
                                <span className="text-blue-800 dark:text-blue-200">{v.modelo?.nombre}</span>
                                {(v.anio_desde || v.anio_hasta) && (
                                    <span className="ml-1 text-blue-700 dark:text-blue-300">
                                        ({v.anio_desde || '?'}-{v.anio_hasta || '+'})
                                    </span>
                                )}
                                {v.motor && <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-bold">[{v.motor}]</span>}
                            </span>
                            <button
                                onClick={() => handleEliminarCompatibilidad(v.id)}
                                className="text-blue-400 hover:text-red-500 font-bold ml-1"
                                disabled={loading}
                                title="Eliminar compatibilidad"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar compatibilidad manualmente */}
            <div className="text-[11px] space-y-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                    Agregar compatibilidad manualmente:
                </p>

                <div className="grid grid-cols-4 gap-2">
                    {/* FILA 1 */}
                    <select
                        value={selectedMarca}
                        onChange={(e) => {
                            setSelectedMarca(e.target.value);
                            setSelectedModelo('');
                        }}
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    >
                        <option value="">Marca...</option>
                        {marcas.map((m) => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={selectedModelo}
                        onChange={(e) => setSelectedModelo(e.target.value)}
                        disabled={!selectedMarca}
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600 disabled:opacity-50"
                    >
                        <option value="">Modelo...</option>
                        {modelos.map((m) => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={anioDesde}
                        onChange={(e) => setAnioDesde(e.target.value)}
                        placeholder="Año desde"
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />

                    <input
                        type="number"
                        value={anioHasta}
                        onChange={(e) => setAnioHasta(e.target.value)}
                        placeholder="Año hasta"
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />

                    {/* FILA 2 */}
                    <input
                        type="text"
                        value={motor}
                        onChange={(e) => setMotor(e.target.value)}
                        placeholder="Motor"
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />

                    <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="Versión"
                        className="text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />

                    <input
                        type="text"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Observación (opcional)"
                        className="col-span-2 text-[11px] border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />
                </div>

                <button
                    onClick={handleAgregarCompatibilidad}
                    disabled={!selectedMarca || !selectedModelo || loading}
                    className="w-full px-2 py-1 rounded bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Agregando...' : '+ Agregar compatibilidad'}
                </button>

                {error && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">{error}</div>
                )}

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    💡 El sistema detecta automáticamente al guardar, pero puedes agregar más manualmente.
                </p>
            </div>
        </div>
    );
};
