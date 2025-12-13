import React, { useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { WorkspaceDock } from './WorkspaceDock';
import { WorkspaceWindow } from './WorkspaceWindow';

export const WorkspaceManager = () => {
    const { tabs, activeTabId } = useWorkspaceStore();

    // TODO: Cargar drafts del servidor aquí en el futuro

    return (
        <>
            {/* Capa de Ventanas Flotantes */}
            <div className="fixed inset-0 pointer-events-none z-[45]">
                {tabs.map((tab) => (
                    <div key={tab.id} className="pointer-events-auto">
                        <WorkspaceWindow tab={tab} isActive={tab.id === activeTabId} />
                    </div>
                ))}
            </div>

            {/* Dock Inferior */}
            <WorkspaceDock />
        </>
    );
};
