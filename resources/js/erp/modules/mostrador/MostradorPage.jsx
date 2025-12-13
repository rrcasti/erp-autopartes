import React from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export const MostradorPage = () => {
    const { addTab } = useWorkspaceStore();

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-5">
                <h1 className="text-xl font-semibold text-slate-100">Mostrador</h1>
                <p className="text-sm text-slate-400">Accesos operativos rápidos para atender y cobrar sin fricción.</p>
            </div>

            {/* Grid de cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {/* Ventas (principal) */}
                <div onClick={() => addTab({ type: 'sale' })}
                    className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/10 to-white/0 p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
                    <div className="pointer-events-none absolute -inset-10 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(600px circle at 20% 10%, rgba(99,102,241,0.18), transparent 55%)' }}></div>

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 ring-1 ring-indigo-300/20">
                                    {/* icon placeholder */}
                                    <span className="text-indigo-200 text-sm font-semibold">$</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Ventas</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Cobrar rápido. Productos + marca (variación) + precio. Totales sin IVA y con IVA.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Abrir Pestaña →</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">WhatsApp</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">PDF/Comprobante</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Scanner</span>
                    </div>

                    {/* Sheen sutil */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: 'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.06) 45%, transparent 60%)', transform: 'translateX(-20%)' }}></div>
                </div>

                {/* Caja diaria */}
                <div onClick={() => addTab({ type: 'cash' })}
                    className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-400/8 to-white/0 p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300/25">
                    <div className="pointer-events-none absolute -inset-10 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(600px circle at 20% 10%, rgba(52,211,153,0.14), transparent 55%)' }}></div>

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                                    <span className="text-emerald-200 text-sm font-semibold">₳</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Caja diaria</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Apertura/cierre, ingresos/egresos y resumen por medio de pago.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Abrir Pestaña →</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Apertura</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Cierre</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Movimientos</span>
                    </div>
                </div>

                {/* Presupuestos */}
                <div onClick={() => addTab({ type: 'quote' })}
                    className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-sky-400/8 to-white/0 p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300/25">
                    <div className="pointer-events-none absolute -inset-10 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(600px circle at 20% 10%, rgba(56,189,248,0.12), transparent 55%)' }}></div>

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 ring-1 ring-sky-300/20">
                                    <span className="text-sky-200 text-sm font-semibold">⎘</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Presupuestos</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Crear y enviar por WhatsApp. PDF profesional con cabecera y datos del cliente.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Abrir Pestaña →</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Texto WhatsApp</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">PDF</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10">Historial cliente</span>
                    </div>
                </div>

                {/* Devoluciones */}
                <Link to="/mostrador/devoluciones"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <span className="text-slate-200 text-sm font-semibold">↩</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Devoluciones</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Devolver ítems por venta/comprobante y registrar el movimiento.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Entrar →</span>
                    </div>
                </Link>

                {/* Reservas / Señas */}
                <Link to="/mostrador/reservas"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <span className="text-slate-200 text-sm font-semibold">◎</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Reservas / Señas</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Apartados y cobros parciales para cerrar ventas sin perder al cliente.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Entrar →</span>
                    </div>
                </Link>

                {/* Pedidos por falta de stock */}
                <Link to="/mostrador/pedidos"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <span className="text-slate-200 text-sm font-semibold">▦</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Pedidos</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Registrar pedidos cuando no hay stock y vincularlos al cliente.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Entrar →</span>
                    </div>
                </Link>

                {/* Historial / Utilidades */}
                <Link to="/mostrador/historial"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition
              hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/15">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <span className="text-slate-200 text-sm font-semibold">≡</span>
                                </span>
                                <h2 className="text-base font-semibold text-slate-100">Historial / Utilidades</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-300/90">
                                Buscar cliente, reimprimir, reenviar WhatsApp y repetir operaciones.
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Entrar →</span>
                    </div>
                </Link>

            </div>
        </div>
    );
};
