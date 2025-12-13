import React from 'react';

export const HelpShortcutsModal = ({ open, onClose }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                    <h2 className="text-sm font-semibold">Ayuda & Atajos de Teclado</h2>
                    <button
                        onClick={onClose}
                        className="text-xs px-2 py-1 rounded hover:bg-slate-800"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 text-xs space-y-4">
                    <div>
                        <h3 className="font-semibold mb-1">Atajos globales (planificados)</h3>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                            <li><strong>Ctrl + K</strong> — Abrir búsqueda global</li>
                            <li><strong>Alt + 1</strong> — Ir a Dashboard</li>
                            <li><strong>Alt + 2</strong> — Ir a Mostrador</li>
                            <li><strong>Alt + 3</strong> — Ir a Productos</li>
                            <li><strong>F1</strong> — Abrir esta ayuda</li>
                            <li><strong>Esc</strong> — Cerrar modales / paneles</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-1">Atajos del módulo actual</h3>
                        <p className="text-slate-400">
                            Más adelante, esta sección se llenará automáticamente con los atajos
                            específicos de cada módulo (Productos, Proveedores, etc.).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
