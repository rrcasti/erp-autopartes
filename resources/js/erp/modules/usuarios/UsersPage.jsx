import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPermissionPanel } from './UserPermissionPanel';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';

export const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States for Modals
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
    
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/erp/api/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Error cargando usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handlers
    const handleManagePermissions = (user) => {
        setSelectedUserForPermissions(user);
        setIsPanelOpen(true);
    };

    const handleEditData = (user) => {
        setSelectedUserForEdit(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (user) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        try {
            await axios.delete(`/erp/api/users/${user.id}`);
            alert("Usuario eliminado correctamente.");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(error.response?.data?.message || "Error al eliminar usuario.");
        }
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setSelectedUserForPermissions(null);
    };

    const handleUserUpdated = () => {
        fetchUsers();
        setIsPanelOpen(false);
        setSelectedUserForPermissions(null);
        setIsEditModalOpen(false);
        setSelectedUserForEdit(null);
    };

    const handleUserCreated = () => {
        fetchUsers();
        setIsCreateModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Usuarios y Roles</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow"
                >
                    + Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Roles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Permisos Directos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Cargando...</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {user.roles && user.roles.length > 0 ? (
                                        user.roles.map(role => (
                                            <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-1">
                                                {role === 'admin' ? 'Administrador' : (role === 'seller' ? 'Vendedor' : role)}
                                            </span>
                                        ))
                                    ) : <span className="text-slate-400 italic">Sin rol</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                    {user.direct_permissions && user.direct_permissions.length > 0 ? (
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                            {user.direct_permissions.length} Overrides
                                        </span>
                                    ) : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => handleEditData(user)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded"
                                        title="Editar nombre, email y contraseña"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleManagePermissions(user)}
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded"
                                        title="Gestionar roles y permisos"
                                    >
                                        Permisos
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-2 py-1"
                                    >
                                        X
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isPanelOpen && selectedUserForPermissions && (
                <UserPermissionPanel 
                    user={selectedUserForPermissions} 
                    onClose={handleClosePanel} 
                    onSuccess={handleUserUpdated} 
                />
            )}

            {isEditModalOpen && selectedUserForEdit && (
                <UserEditModal
                    user={selectedUserForEdit}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleUserUpdated}
                />
            )}

            {isCreateModalOpen && (
                <UserCreateModal 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onSuccess={handleUserCreated} 
                />
            )}
        </div>
    );
};
