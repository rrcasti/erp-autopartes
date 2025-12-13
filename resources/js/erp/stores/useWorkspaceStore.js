import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Generador simple de ID local
const generateId = () => 'local_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

export const useWorkspaceStore = create(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            // --- Acciones ---

            addTab: (params) => {
                // params: { type: 'sale'|'quote'..., title?: string, payload?: object }
                const { type, title, payload } = params;
                const newId = generateId();

                const newTab = {
                    id: newId,
                    type, 
                    title: title || getDefaultTitle(type),
                    payload: payload || {},
                    status: 'active', 
                    isDirty: false,
                    isSaving: false,
                    lastSavedAt: null,
                    serverDraftId: null, // null = aún no persistido en DB
                };

                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newId, // Auto focus al crear
                }));
                return newId;
            },

            closeTab: (tabId) => {
                set((state) => {
                    const newTabs = state.tabs.filter((t) => t.id !== tabId);
                    // Si cerramos el activo, activar el último disponible
                    let newActive = state.activeTabId;
                    if (state.activeTabId === tabId) {
                        newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
                    }
                    return { tabs: newTabs, activeTabId: newActive };
                });
            },

            focusTab: (tabId) => {
                set({ activeTabId: tabId });
            },

            minimizeTab: () => {
                // Minimizar la ventana activa (ninguna tiene foco)
                set({ activeTabId: null });
            },

            // Actualiza el payload (datos del formulario) del tab
            updateTabPayload: (tabId, newPayload) => {
                set((state) => ({
                    tabs: state.tabs.map((t) => 
                        t.id === tabId 
                            ? { ...t, payload: { ...t.payload, ...newPayload }, isDirty: true } 
                            : t
                    ),
                }));
            },

            // Actualiza metadatos del tab (título, saving status, serverId)
            updateTabMeta: (tabId, metaUpdates) => {
                set((state) => ({
                    tabs: state.tabs.map((t) => 
                        t.id === tabId ? { ...t, ...metaUpdates } : t
                    ),
                }));
            },
            
            // Reemplaza todos los tabs (usado al cargar drafts del backend)
            setTabs: (tabs) => set({ tabs }),
        }),
        {
            name: 'km21-workspace-v1', // Key en localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                tabs: state.tabs, 
                activeTabId: state.activeTabId 
            }),
        }
    )
);

function getDefaultTitle(type) {
    const titles = {
        sale: 'Nueva Venta',
        quote: 'Nuevo Presupuesto',
        cash: 'Caja Diaria',
        refund: 'Devolución',
        order: 'Pedido',
    };
    return titles[type] || 'Sin Título';
}
