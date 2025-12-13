import React, { useState } from 'react';
import { 
    ShoppingCart, FileText, Banknote, Package, History, 
    MoreVertical, Minus, X, Loader2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export const WorkspaceWindowHeader = ({ 
    tab, 
    onMinimize, 
    onClose, 
    onRetrySave 
}) => {
    const [showMenu, setShowMenu] = useState(false);

    // Mapeo de iconos por tipo
    const getIcon = (type) => {
        switch (type) {
            case 'sale': return <ShoppingCart size={16} />;
            case 'quote': return <FileText size={16} />;
            case 'cash': return <Banknote size={16} />;
            case 'refund': return <Package size={16} />;
            default: return <History size={16} />;
        }
    };

    // Renderizado del Estado
    const renderStatus = () => {
        if (tab.isSaving) {
            return (
                <div className="flex items-center gap-1.5 text-blue-400">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-[10px] font-medium tracking-wide uppercase">Guardando...</span>
                </div>
            );
        }
        if (tab.isDirty) {
            return (
                <div className="flex items-center gap-1.5 text-amber-400/90" title="Cambios sin guardar">
                    <AlertCircle size={13} />
                    <span className="text-[10px] font-medium tracking-wide uppercase">Sin guardar</span>
                </div>
            );
        }
        // Estado sincronizado
        return (
            <div className="flex items-center gap-1.5 text-emerald-500/80">
                <CheckCircle2 size={13} />
                <span className="text-[10px] font-medium tracking-wide uppercase">Sincronizado</span>
            </div>
        );
    };

    return (
        <div 
            className="window-header relative h-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-3 select-none rounded-t-xl transition-colors group"
            onDoubleClick={(e) => { e.stopPropagation(); onMinimize(); }}
        >
            {/* IZQUIERDA: Identidad */}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                    p-1.5 rounded-lg border shadow-sm transition-colors
                    ${tab.isDirty 
                        ? 'bg-amber-50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-200/80 border-amber-200 dark:border-amber-500/10' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'}
                `}>
                    {getIcon(tab.type)}
                </div>
                
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
                        {tab.title}
                    </span>
                    {renderStatus()}
                </div>
            </div>

            {/* DERECHA: Acciones */}
            <div className="flex items-center gap-1 pl-2 ml-auto" onMouseDown={(e) => e.stopPropagation()}>
                
                {/* Menú Opciones (Opcional) */}
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        title="Opciones"
                    >
                        <MoreVertical size={16} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 flex flex-col">
                                <button className="px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Renombrar pestaña</button>
                                <button className="px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Duplicar</button>
                            </div>
                        </>
                    )}
                </div>

                {/* Separador */}
                <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1"></div>

                {/* Minimizar */}
                <button 
                    onClick={onMinimize} 
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    title="Minimizar"
                >
                    <Minus size={16} />
                </button>

                {/* Cerrar */}
                <button 
                    onClick={() => {
                        if (tab.isDirty && !confirm('¿Cerrar pestaña "' + tab.title + '"? Se perderán los cambios no guardados.')) return;
                        onClose();
                    }} 
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    title="Cerrar"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
