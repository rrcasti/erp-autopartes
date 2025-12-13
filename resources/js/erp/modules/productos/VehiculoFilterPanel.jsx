import React, { useState, useEffect } from 'react';

export const VehiculoFilterPanel = ({ onFilterApply, onClear }) => {
    const [marcas, setMarcas] = useState([]);
    const [modelos, setModelos] = useState([]);
    
    // Estados locales del filtro
    const [marcaId, setMarcaId] = useState('');
    const [modeloId, setModeloId] = useState('');
    const [anio, setAnio] = useState('');
    const [motor, setMotor] = useState('');
    
    const [loadingMarcas, setLoadingMarcas] = useState(false);
    const [loadingModelos, setLoadingModelos] = useState(false);

    // Cargar marcas al inicio
    useEffect(() => {
        loadMarcas();
    }, []);

    // Cargar modelos cuando cambia la marca
    useEffect(() => {
        if (marcaId) {
            loadModelos(marcaId);
        } else {
            setModelos([]);
            setModeloId('');
        }
    }, [marcaId]);

    const loadMarcas = async () => {
        setLoadingMarcas(true);
        try {
            const resp = await fetch('/erp/api/vehiculos/marcas');
            if (resp.ok) {
                const data = await resp.json();
                setMarcas(data);
            }
        } catch (error) {
            console.error("Error cargando marcas", error);
        } finally {
            setLoadingMarcas(false);
        }
    };

    const loadModelos = async (idMarca) => {
        setLoadingModelos(true);
        try {
            const resp = await fetch(`/erp/api/vehiculos/modelos?marca_id=${idMarca}`);
            if (resp.ok) {
                const data = await resp.json();
                setModelos(data);
            }
        } catch (error) {
            console.error("Error cargando modelos", error);
        } finally {
            setLoadingModelos(false);
        }
    };

    const handleSearch = () => {
        onFilterApply({
            vehiculo_marca_id: marcaId,
            vehiculo_modelo_id: modeloId,
            anio,
            motor
        });
    };

    const handleClear = () => {
        setMarcaId('');
        setModeloId('');
        setAnio('');
        setMotor('');
        onClear();
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🚗</span>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Filtrar por Vehículo Compatible
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                {/* MARCA */}
                <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Marca</span>
                    <select
                        value={marcaId}
                        onChange={(e) => {
                            setMarcaId(e.target.value);
                            setModeloId(''); // Reset modelo al cambiar marca
                        }}
                        className="border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                        disabled={loadingMarcas}
                    >
                        <option value="">Todas las marcas</option>
                        {marcas.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                </label>

                {/* MODELO */}
                <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Modelo</span>
                    <select
                        value={modeloId}
                        onChange={(e) => setModeloId(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600 disabled:opacity-50"
                        disabled={!marcaId || loadingModelos}
                    >
                        <option value="">Todos los modelos</option>
                        {modelos.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                </label>
                
                {/* AÑO */}
                <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Año (ej: 2015)</span>
                    <input
                        type="number"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        placeholder="Año exacto"
                        className="border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />
                </label>

                {/* MOTOR */}
                <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Motor (ej: 1.6)</span>
                    <input
                        type="text"
                        value={motor}
                        onChange={(e) => setMotor(e.target.value)}
                        placeholder="Motor..."
                        className="border border-slate-300 rounded px-2 py-1 dark:bg-slate-900 dark:border-slate-600"
                    />
                </label>

                {/* BOTONES */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSearch}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-1 px-3 text-xs font-medium transition-colors flex justify-center items-center gap-1"
                    >
                        <span>🔍</span> Buscar
                    </button>
                    {(marcaId || anio || motor) && (
                        <button
                            onClick={handleClear}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded py-1 px-3 text-xs font-medium transition-colors"
                            title="Limpiar filtros"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
