import React, { useState } from 'react';
import { HelpShortcutsModal } from './HelpShortcutsModal';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { WorkspaceManager } from '../components/workspace/WorkspaceManager';

export const LayoutShell = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className="h-screen w-screen flex bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Área principal */}
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onShowHelp={() => setShowHelp(true)}
                />

                <main className="flex-1 min-h-0 overflow-hidden">
                    <div className="h-full w-full overflow-auto p-4 bg-slate-50 dark:bg-slate-900">
                        {children}
                    </div>
                </main>
            </div>

            <WorkspaceManager />
            
            <HelpShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
};
