import React, { useEffect, useState } from 'react';

export const DashboardPage = () => {
    const [stats, setStats] = useState({ sales_today: 0, low_stock_count: 0 });

    useEffect(() => {
        fetch('/erp/api/inventory/stats')
            .then(r => r.json())
            .then(data => {
                if(data.sales_today !== undefined) setStats(data);
            })
            .catch(err => console.error('Error cargando stats', err));
    }, []);

    return (
        <div className="h-full flex flex-col gap-4 text-sm">
            {/* Encabezado */}
            <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Dashboard
                </h1>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                    Resumen de operación en tiempo real.
                </p>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ventas del día */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Ventas del día
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(stats.sales_today)}
                    </div>
                </div>

                {/* Productos con stock bajo */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Productos con stock bajo
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                        {stats.low_stock_count}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        Productos por debajo del mínimo configurado.
                    </p>
                </div>

                {/* Clientes con deuda vencida */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Clientes con deuda vencida
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
                        0
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        Próximamente
                    </p>
                </div>
            </div>
        </div>
    );
};
