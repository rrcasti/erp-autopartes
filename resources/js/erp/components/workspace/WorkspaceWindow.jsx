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
                x: window.innerWidth / 2 - 450,
                y: window.innerHeight / 2 - 325,
                width: 900,
                height: 650,
            }}
            minWidth={400}
            minHeight={300}
            bounds="window"
            dragHandleClassName="window-header"
            onDragStart={() => focusTab(tab.id)}
            onMouseDown={() => focusTab(tab.id)}
            className="flex flex-col bg-slate-900 border border-slate-700/80 shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/5"
            style={{ zIndex: 100 }} // Asegurar que flote sobre todo
        >
            {/* Header Profesional Refactorizado */}
            <WorkspaceWindowHeader 
                tab={tab}
                onMinimize={minimizeTab}
                onClose={() => closeTab(tab.id)}
            />

            {/* Content Body */}
            <div className="flex-1 bg-slate-950/50 overflow-hidden relative">
                {renderContent()}
            </div>
        </Rnd>
    );
};
