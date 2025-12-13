import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente Select con búsqueda y creación al vuelo.
 * 
 * Props:
 * - value: ID seleccionado actual.
 * - options: Array de objetos {id, label} o {id, nombre}.
 * - onChange: Callback (newValue) => {}.
 * - onCreate: Callback async (newItemLabel) => {}. Retorna el nuevo item creado {id, label}.
 * - placeholder: Texto placeholder.
 * - label: Etiqueta opcional.
 * - className: Clases adicionales.
 */
export const SearchableSelect = ({ 
    value, 
    options = [], 
    onChange, 
    onCreate, 
    placeholder = "Seleccionar...", 
    className = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creationLoading, setCreationLoading] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Normalizar opciones a {id, label}
    const normalizedOptions = options.map(opt => ({
        id: opt.id,
        label: opt.nombre || opt.razon_social || opt.label || 'Item sin nombre'
    }));

    // Encontrar el label seleccionado
    const selectedItem = normalizedOptions.find(o => o.id == value);

    useEffect(() => {
        // Cerrar al hacer click fuera
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtrar opciones
    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Manejar selección
    const handleSelect = (item) => {
        onChange(item.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Manejar creación
    const handleCreate = async () => {
        if (!searchTerm || creationLoading) return;
        
        // Verificar duplicados visuales antes de llamar a crear (aunque el backend debe validar)
        const exactMatch = normalizedOptions.find(o => o.label.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
            handleSelect(exactMatch);
            return;
        }

        if (onCreate) {
            setCreationLoading(true);
            try {
                // onCreate debe retornar el nuevo objeto creado {id, label/nombre}
                const newItem = await onCreate(searchTerm);
                if (newItem && newItem.id) {
                    onChange(newItem.id);
                    setIsOpen(false);
                    setSearchTerm('');
                }
            } catch (e) {
                console.error("Error creando item:", e);
                alert("Error al crear: " + e.message);
            } finally {
                setCreationLoading(false);
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Input visible */}
            <div 
                className={`
                    w-full flex items-center justify-between border rounded px-2 py-1 bg-white dark:bg-slate-900 
                    ${disabled ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800' : 'cursor-text border-slate-300 dark:border-slate-600'}
                `}
                onClick={() => !disabled && setIsOpen(true)}
            >
                {/* Si está abierto, mostramos input de texto para buscar. Si cerrado, el valor seleccionado o placeholder */}
                {isOpen ? (
                    <input
                        autoFocus
                        type="text"
                        className="w-full text-[11px] bg-transparent outline-none text-slate-700 dark:text-slate-200"
                        placeholder="Buscar o crear..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // Si hay 1 coincidencia exacta o seleccionada (aquí simplificado a la primera filtrada)
                                if (filteredOptions.length > 0 && !onCreate) {
                                    handleSelect(filteredOptions[0]);
                                } else if (onCreate) {
                                    // Intentar crear si no hay match perfecto o si el usuario quiere forzarlo
                                    handleCreate();
                                }
                            }
                            if (e.key === 'Escape') setIsOpen(false);
                        }}
                    />
                ) : (
                    <span className={`text-[11px] truncate ${!selectedItem ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                )}
                
                <span className="text-[10px] text-slate-400 ml-1">▼</span>
            </div>

            {/* Dropdown flotante */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.length === 0 && !creationLoading && (
                        <div className="px-2 py-2 text-[11px] text-slate-500 text-center">
                            No encontrado.
                            {onCreate && searchTerm && (
                                <button 
                                    className="block mt-1 w-full text-blue-600 hover:underline font-bold"
                                    onClick={handleCreate}
                                >
                                    + Crear "{searchTerm}"
                                </button>
                            )}
                        </div>
                    )}

                    {creationLoading && (
                        <div className="px-2 py-2 text-[11px] text-center text-slate-500">Creando...</div>
                    )}
                    
                    {filteredOptions.map(opt => (
                        <div 
                            key={opt.id}
                            className={`
                                px-2 py-1 text-[11px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700
                                ${selectedItem?.id === opt.id ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''}
                            `}
                            onClick={() => handleSelect(opt)}
                        >
                            {opt.label}
                        </div>
                    ))}
                    
                    {/* Opción explícita de crear siempre visible si hay texto y no es match exacto */}
                    {onCreate && searchTerm && filteredOptions.every(o => o.label.toLowerCase() !== searchTerm.toLowerCase()) && !creationLoading && filteredOptions.length > 0 && (
                         <div 
                            className="px-2 py-1 text-[11px] cursor-pointer text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium border-t border-slate-100 dark:border-slate-700"
                            onClick={handleCreate}
                        >
                            + Crear "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
