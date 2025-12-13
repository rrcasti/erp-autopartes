<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\VehiculoMarca;
use App\Models\VehiculoModelo;
use App\Models\Vehiculo;
use Illuminate\Http\Request;

class VehiculoApiController extends Controller
{
    /**
     * Listado de marcas de vehículos (para combos).
     * GET /erp/api/vehiculos/marcas
     */
    public function marcas(Request $request)
    {
        $marcas = VehiculoMarca::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return response()->json($marcas);
    }

    /**
     * Listado de modelos por marca.
     * GET /erp/api/vehiculos/modelos?vehiculo_marca_id=1
     */
    public function modelos(Request $request)
    {
        $marcaId = (int) $request->query('vehiculo_marca_id');

        if (!$marcaId) {
            return response()->json([
                'message' => 'Falta el parámetro vehiculo_marca_id',
            ], 422);
        }

        $modelos = VehiculoModelo::query()
            ->where('vehiculo_marca_id', $marcaId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'vehiculo_marca_id']);

        return response()->json($modelos);
    }

    /**
     * Listado de “vehículos” concretos (marca+modelo+rango de años)
     * con filtros opcionales.
     *
     * GET /erp/api/vehiculos?vehiculo_marca_id=&vehiculo_modelo_id=&anio=
     */
    public function vehiculos(Request $request)
    {
        $query = Vehiculo::query()
            ->with(['modelo.marca'])
            ->where('activo', true);

        if ($marcaId = (int) $request->query('vehiculo_marca_id')) {
            $query->whereHas('modelo.marca', function ($q) use ($marcaId) {
                $q->where('id', $marcaId);
            });
        }

        if ($modeloId = (int) $request->query('vehiculo_modelo_id')) {
            $query->where('vehiculo_modelo_id', $modeloId);
        }

        // Filtro por año dentro del rango
        if ($anio = (int) $request->query('anio')) {
            $query->where(function ($q) use ($anio) {
                $q->where(function ($q2) use ($anio) {
                    $q2->whereNotNull('anio_desde')
                        ->whereNotNull('anio_hasta')
                        ->where('anio_desde', '<=', $anio)
                        ->where('anio_hasta', '>=', $anio);
                })->orWhere(function ($q2) use ($anio) {
                    // Si solo se cargó anio_desde, lo interpretamos como “desde tal año en adelante”
                    $q2->whereNotNull('anio_desde')
                        ->whereNull('anio_hasta')
                        ->where('anio_desde', '<=', $anio);
                });
            });
        }

        $vehiculos = $query
            ->orderBy('anio_desde')
            ->orderBy('anio_hasta')
            ->orderBy('id')
            ->limit(200) // límite de seguridad para combos
            ->get();

        return response()->json($vehiculos);
    }

    /**
     * Crear un nuevo vehículo.
     * POST /erp/api/vehiculos/crear
     */
    public function crear(Request $request)
    {
        $data = $request->validate([
            'vehiculo_marca_id'  => ['required', 'integer', 'exists:vehiculo_marcas,id'],
            'vehiculo_modelo_id' => ['required', 'integer', 'exists:vehiculo_modelos,id'],
            'anio_desde'         => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'anio_hasta'         => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'motor'              => ['nullable', 'string', 'max:50'],
            'version'            => ['nullable', 'string', 'max:100'],
        ]);

        // Buscar si ya existe este vehículo exacto
        $vehiculoExistente = Vehiculo::where('vehiculo_marca_id', $data['vehiculo_marca_id'])
            ->where('vehiculo_modelo_id', $data['vehiculo_modelo_id'])
            ->where(function ($q) use ($data) {
                if (isset($data['anio_desde'])) {
                    $q->where('anio_desde', $data['anio_desde']);
                } else {
                    $q->whereNull('anio_desde');
                }
            })
            ->where(function ($q) use ($data) {
                if (isset($data['anio_hasta'])) {
                    $q->where('anio_hasta', $data['anio_hasta']);
                } else {
                    $q->whereNull('anio_hasta');
                }
            })
            ->first();

        if ($vehiculoExistente) {
            $vehiculoExistente->load(['marca', 'modelo']);
            return response()->json($vehiculoExistente);
        }

        // Crear nuevo vehículo
        $vehiculo = Vehiculo::create([
            'vehiculo_marca_id'  => $data['vehiculo_marca_id'],
            'vehiculo_modelo_id' => $data['vehiculo_modelo_id'],
            'anio_desde'         => $data['anio_desde'] ?? null,
            'anio_hasta'         => $data['anio_hasta'] ?? null,
            'motor'              => $data['motor'] ?? null,
            'version'            => $data['version'] ?? null,
            'activo'             => true,
        ]);

        $vehiculo->load(['marca', 'modelo']);

        return response()->json($vehiculo, 201);
    }
}
