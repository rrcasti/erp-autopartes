import React, { useEffect, useState } from 'react';

const AttachmentsModal = ({ isOpen, onClose, poId }) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null); // { url, type, name }

    useEffect(() => {
        if (isOpen && poId) loadAttachments();
    }, [isOpen, poId]);

    const loadAttachments = () => {
        setLoading(true);
        fetch(`/erp/api/purchase-orders/${poId}/attachments`)
            .then(r => r.json())
            .then(data => setAttachments(data))
            .finally(() => setLoading(false));
    };

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tamaño/tipo si se desea (aunque backend valida)
        if (file.size > 10 * 1024 * 1024) return alert('El archivo excede 10MB');

        const formData = new FormData();
        formData.append('file', file);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        setUploading(true);
        fetch(`/erp/api/purchase-orders/${poId}/attachments`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': token || '' },
            body: formData
        })
        .then(r => r.json())
        .then(res => {
            if (res.error) alert(res.error);
            else {
                setAttachments(prev => [res.attachment, ...prev]);
                // Limpiar input
                e.target.value = null;
            }
        })
        .catch(err => alert('Error de red'))
        .finally(() => setUploading(false));
    };

    const handleDelete = (attId) => {
        if (!confirm('¿Eliminar adjunto?')) return;
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Optimistic update
        setAttachments(prev => prev.filter(a => a.id !== attId));

        fetch(`/erp/api/purchase-orders/${poId}/attachments/${attId}`, {
            method: 'DELETE',
            headers: { 
                'X-CSRF-TOKEN': token || '',
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(res => {
            if(res.error) {
                alert(res.error);
                loadAttachments(); // Revertir
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            {/* Main Modal */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        Documentos Adjuntos
                    </h3>
                    <div className="flex items-center gap-3">
                        <label className={`cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow flex items-center gap-1 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {uploading ? 'Subiendo...' : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    Subir Archivo
                                </>
                            )}
                            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,.pdf" />
                        </label>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl leading-none">&times;</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4">
                    {loading ? (
                        <div className="flex justify-center p-10"><span className="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent"></span></div>
                    ) : attachments.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                            <p>No hay documentos adjuntos.</p>
                            <p className="text-xs mt-1">Sube facturas, remitos o comprobantes aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {attachments.map(att => {
                                const isImage = att.file_type?.startsWith('image/');
                                return (
                                    <div key={att.id} className="group relative bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                                        
                                        {/* Preview Thumbnail */}
                                        <div 
                                            className="h-32 bg-slate-50 dark:bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden relative"
                                            onClick={() => setPreviewFile({ url: `/erp/api/purchase-orders/${poId}/attachments/${att.id}/download`, type: att.file_type, name: att.file_name })}
                                        >
                                            {isImage ? (
                                                <img src={`/erp/api/purchase-orders/${poId}/attachments/${att.id}/download`} alt={att.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <span className="text-red-500 font-bold text-xs uppercase border-2 border-red-500 rounded px-1">PDF</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-2 text-xs">
                                            <p className="font-semibold truncate text-slate-700 dark:text-gray-300 pointer-events-none" title={att.file_name}>{att.file_name}</p>
                                            <div className="flex justify-between items-center mt-1 text-slate-400 text-[10px]">
                                                <span>{(att.file_size / 1024).toFixed(1)} KB</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Viewer (Overlay within Modal or on top) */}
            {previewFile && (
                <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col animate-in fade-in duration-200">
                    <div className="h-14 flex justify-between items-center px-4 text-white shrink-0">
                        <span className="font-mono text-sm">{previewFile.name}</span>
                        <div className="flex gap-4">
                            <a href={previewFile.url} download className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                Descargar
                            </a>
                            <button onClick={() => setPreviewFile(null)} className="text-white hover:text-gray-300 p-2 bg-white/10 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                        {previewFile.type?.startsWith('image/') ? (
                            <img src={previewFile.url} className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                        ) : (
                            <iframe src={previewFile.url} className="w-full h-full bg-white rounded" title="PDF Preview"></iframe>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttachmentsModal;
