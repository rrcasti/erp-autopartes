import React from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ShoppingCart, FileText, Banknote, Package, History, X, Minus } from 'lucide-react';

export const WorkspaceDock = () => {
    const { tabs, activeTabId, focusTab, minimizeTab, closeTab } = useWorkspaceStore();

    if (tabs.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'sale': return <ShoppingCart size={16} />;
            case 'quote': return <FileText size={16} />;
            case 'cash': return <Banknote size={16} />;
            case 'refund': return <Package size={16} />;
            default: return <History size={16} />;
        }
    };

    const getStatusIndicator = (tab) => {
        if (tab.isSaving) return <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />;
        if (tab.isDirty) return <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
        return null;
    };

    return (
        <div className="fixed bottom-1 right-1 z-[60] flex justify-end pointer-events-none">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/60 shadow-xl shadow-black/50 rounded-xl px-1 py-1 flex items-center gap-1 max-w-[90vw] overflow-x-auto pointer-events-auto">
                
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;
                    return (
                        <div
                            key={tab.id}
                            onClick={() => isActive ? minimizeTab() : focusTab(tab.id)}
                            title={tab.title}
                            className={`
                                group relative flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all duration-200 border select-none
                                ${isActive 
                                    ? 'bg-slate-800 text-slate-100 border-slate-700/50 shadow-sm' 
                                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                                }
                            `}
                        >
                            {/* Icon & Status Wrapper */}
                            <div className="relative flex items-center justify-center">
                                <div className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                    {/* Iconos reducidos aprox 30% (16 -> 14) */}
                                    {React.cloneElement(getIcon(tab.type), { size: 14 })}
                                </div>
                                <div className="absolute -top-0.5 -right-0.5">
                                    {getStatusIndicator(tab)}
                                </div>
                            </div>
                            
                            {/* Title (Más pequeño) */}
                            <span className={`text-[11px] font-medium whitespace-nowrap max-w-[100px] truncate transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                                {tab.title}
                            </span>

                            {/* Actions (hover) */}
                            <div className={`flex items-center gap-1 ml-0.5 transition-all ${isActive ? 'w-auto opacity-100' : 'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 overflow-hidden'}`}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (tab.isDirty && !confirm('¿Cerrar pestaña "' + tab.title + '" sin guardar cambios? perderás el progreso.')) return;
                                        closeTab(tab.id);
                                    }}
                                    className="p-0.5 rounded bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
