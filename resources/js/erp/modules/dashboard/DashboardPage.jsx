import React from 'react';

export const DashboardPage = () => {
    return (
        <div className="h-full flex flex-col gap-4 text-sm">
            {/* Encabezado */}
            <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Dashboard
                </h1>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                    Panel principal de RepuestosKm21 ERP. Desde acá vas a poder ver un resumen de
                    ventas, stock y alertas críticas.
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
                        $ 0,00
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        Más adelante, acá vamos a mostrar las ventas reales del ERP.
                    </p>
                </div>

                {/* Productos con stock bajo */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Productos con stock bajo
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                        0
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        Este widget va a alertar cuando el stock esté por debajo del mínimo.
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
                        Más adelante, se conectará a Cuentas Corrientes.
                    </p>
                </div>
            </div>
        </div>
    );
};
