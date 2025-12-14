import React from 'react';

export const CashDashboard = ({ cashRegister }) => {
    const { totals, start_balance, opened_at } = cashRegister;
    
    // Safety check
    if (!totals) return null;

    const kpis = [
        { 
            label: 'Saldo Inicial', 
            value: parseFloat(start_balance), 
            color: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-100 dark:bg-slate-800'
        },
        { 
            label: 'Ingresos', 
            value: totals.income, 
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
            prefix: '+'
        },
        { 
            label: 'Egresos', 
            value: totals.expense, 
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            prefix: '-'
        },
        { 
            label: 'Saldo Esperado', 
            value: totals.expected_end, 
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            bold: true
        },
    ];

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleString('es-AR', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Caja Abierta
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Abierta el {formatDate(opened_at)}
                    </p>
                </div>
                {/* Actions like "Print Summary" could go here */}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className={`${kpi.bg} p-4 rounded-xl border border-transparent dark:border-white/5`}>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            {kpi.label}
                        </p>
                        <p className={`text-2xl ${kpi.bold ? 'font-bold' : 'font-semibold'} ${kpi.color}`}>
                            {kpi.prefix && <span className="text-lg opacity-70 mr-0.5">{kpi.prefix}</span>}
                            ${kpi.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
