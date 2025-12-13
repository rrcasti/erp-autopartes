import React from 'react';
import { Rnd } from 'react-rnd';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { SaleTab } from './tabs/SaleTab';
import { QuoteTab } from './tabs/QuoteTab';
import { WorkspaceWindowHeader } from './WorkspaceWindowHeader';

export const WorkspaceWindow = ({ tab, isActive }) => {
    const { focusTab, closeTab, minimizeTab } = useWorkspaceStore();

    // -------------------------------------------------------------
    // MINIMIZADO REAL (UX Requirement A)
    // -------------------------------------------------------------
    // Si la ventana no es la activa, NO se renderiza en el DOM.
    if (!isActive) return null;

    // Mapping de contenido
    const renderContent = () => {
        switch (tab.type) {
            case 'sale': return <SaleTab tab={tab} />;
            case 'quote': return <QuoteTab tab={tab} />;
            case 'cash': return <div className="p-10 text-center text-emerald-400">Módulo Caja Diaria (Próximamente)</div>;
            default: return <div className="p-10 text-center text-slate-500">Módulo {tab.type}</div>;
        }
    };

    return (
        <Rnd
            default={{
                x: 260, // Desplazado a la derecha para no tapar sidebar
                y: 70,  // Justo debajo del header
                width: 1050, // Más ancho para aprovechar el espacio
                height: 500, // Altura ajustada para no dejar espacio vacío
            }}
            minWidth={400}
            minHeight={300}
            bounds="window" // Restaurado a window para evitar conflicto con contenedor padre sin dimensiones
            dragHandleClassName="window-header"
            onDragStart={() => focusTab(tab.id)}
            onMouseDown={() => focusTab(tab.id)}
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
            style={{ zIndex: 100 }}
        >
            {/* Header Profesional Refactorizado */}
            <WorkspaceWindowHeader 
                tab={tab}
                onMinimize={minimizeTab}
                onClose={() => closeTab(tab.id)}
            />

            {/* Content Body */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                {renderContent()}
            </div>
        </Rnd>
    );
};
