import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const UserPermissionPanel = ({ user, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    
    // Selection state
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Meta (Available Roles/Permissions)
                const metaRes = await axios.get('/erp/api/users/meta');
                setRoles(metaRes.data.roles);
                setAllPermissions(metaRes.data.permissions);

                // Fetch User specifics (fetch fresh to be sure)
                const userRes = await axios.get(`/erp/api/users/${user.id}`);
                const userData = userRes.data;
                
                setSelectedRoles(userData.roles || []);
                setSelectedPermissions(userData.direct_permissions || []);
            } catch (error) {
                console.error("Error loading permission data:", error);
                alert("Error cargando datos de permisos");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    const handleRoleToggle = (role) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handlePermissionToggle = (perm) => {
        if (selectedPermissions.includes(perm)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
        } else {
            setSelectedPermissions([...selectedPermissions, perm]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`/erp/api/users/${user.id}`, {
                roles: selectedRoles,
                permissions: selectedPermissions
            });
            onSuccess();
        } catch (error) {
            console.error("Error saving user permissions:", error);
            alert("Error guardando cambios.");
            setSaving(false);
        }
    };

    // Group permissions by their prefix (e.g. "view", "manage") or logic module?
    // Better group by "Module" inferred from name.
    // names: view_products, manage_products, access_pos...
    // Logic: extract last word? products, pos, clients, purchases, stock, reports, users, settings.
    
    const groupPermissions = () => {
        const groups = {};
        allPermissions.forEach(p => {
            const parts = p.split('_');
            const action = parts[0]; 
            const module = parts.slice(1).join(' '); // products, clients, etc.
            
            if (!groups[module]) groups[module] = [];
            groups[module].push({ name: p, action: action });
        });
        return groups;
    };

    const permissionGroups = groupPermissions();

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title">
                                    Permisos para: <span className="font-bold text-indigo-600">{user.name}</span>
                                </h3>
                                
                                {loading ? (
                                    <div className="py-10 text-center">Cargando...</div>
                                ) : (
                                    <div className="mt-4 space-y-6">
                                        
                                        {/* ROLES */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Roles (Perfiles)</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {roles.map(role => (
                                                    <label key={role} className={`flex items-center space-x-2 px-3 py-2 rounded border cursor-pointer select-none transition-colors ${
                                                        selectedRoles.includes(role) 
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-200' 
                                                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        <input 
                                                            type="checkbox" 
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            checked={selectedRoles.includes(role)}
                                                            onChange={() => handleRoleToggle(role)}
                                                        />
                                                        <span className="capitalize">{role === 'admin' ? 'Administrador' : (role === 'seller' ? 'Vendedor' : role)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Los roles otorgan un paquete base de permisos.</p>
                                        </div>

                                        <hr className="border-slate-200 dark:border-slate-700" />

                                        {/* PERMISOS */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Permisos Granulares (Overrides)</h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.keys(permissionGroups).map(module => (
                                                    <div key={module} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                        <h5 className="font-semibold text-slate-700 dark:text-slate-300 capitalize mb-2 border-b border-slate-200 pb-1">{module}</h5>
                                                        <div className="space-y-1">
                                                            {permissionGroups[module].map(p => (
                                                                <label key={p.name} className="flex items-center space-x-2">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                                                                        checked={selectedPermissions.includes(p.name)}
                                                                        onChange={() => handlePermissionToggle(p.name)}
                                                                    />
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">{p.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                                Nota: Marcar un permiso aquí lo activará explícitamente para este usuario, independientemente de su rol.
                                            </p>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button" 
                            disabled={saving}
                            onClick={handleSave}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
