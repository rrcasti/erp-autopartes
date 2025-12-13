import React from 'react';
import { useTheme } from '../../core/ThemeContext';

export const ParamSettingsPage = () => {
    const { theme, setTheme } = useTheme();

    const handleChange = (e) => {
        setTheme(e.target.value);
    };

    return (
        <div className="h-full flex flex-col gap-4 text-xs">
            <div>
                <h1 className="text-lg font-semibold">Parámetros del sistema</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Configuración general del ERP. Por ahora, comenzamos con la apariencia
                    (modo claro / oscuro). Más adelante acá vamos a sumar moneda, impuestos,
                    formatos de impresión, etc.
                </p>
            </div>

            <div className="max-w-md bg-white border border-slate-200 rounded-lg p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                <h2 className="text-sm font-semibold mb-2">Apariencia</h2>

                <div className="space-y-2">
                    <p className="text-slate-600 dark:text-slate-300">
                        Elegí cómo querés ver el ERP:
                    </p>

                    <div className="flex flex-col gap-1">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="radio"
                                name="theme"
                                value="light"
                                checked={theme === 'light'}
                                onChange={handleChange}
                            />
                            <span>Modo claro</span>
                        </label>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="radio"
                                name="theme"
                                value="dark"
                                checked={theme === 'dark'}
                                onChange={handleChange}
                            />
                            <span>Modo oscuro</span>
                        </label>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="radio"
                                name="theme"
                                value="system"
                                checked={theme === 'system'}
                                onChange={handleChange}
                            />
                            <span>Usar configuración del sistema operativo</span>
                        </label>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        Esta preferencia se guarda en este equipo para tu usuario. Más
                        adelante podemos persistirlo también en la base de datos.
                    </p>
                </div>
            </div>
        </div>
    );
};
