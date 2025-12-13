<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Models\Vehiculo;
use App\Models\Marca;
use App\Models\Sku;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductoApiController extends Controller
{
    /**
     * Listado de productos con filtros y paginación.
     */
    public function index(Request $request)
    {
        $query = Producto::with(['marca', 'proveedor', 'vehiculos.marca', 'vehiculos.modelo'])
            ->orderBy('nombre');

        // Búsqueda simple
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('sku_interno', 'like', "%{$search}%")
                  ->orWhere('codigo_barra', 'like', "%{$search}%");
            });
        }

        // Filtros Vehículo Avanzados
        if ($request->filled('vehiculo_modelo_id') || $request->filled('motor') || $request->filled('anio')) {
            $query->whereHas('vehiculos', function ($q) use ($request) {
                // Modelo
                if ($idModelo = $request->input('vehiculo_modelo_id')) {
                    $q->where(function ($sub) use ($idModelo) {
                         $sub->where('vehiculo_modelo_id', $idModelo)
                             ->orWhereNull('vehiculo_modelo_id');
                    });
                }

                // Año (Lógica Híbrida)
                if ($anio = $request->input('anio')) {
                    $q->where(function ($filter) use ($anio) {
                        // Caso A: Rango Estándar (Tiene Fin o es 'Hasta Hoy' = 0)
                        // Valida que el año buscado esté entre Desde y Hasta
                        $filter->where(function($w) use ($anio) {
                            $w->whereNotNull('anio_desde')
                              ->where('anio_desde', '>', 0)
                              ->where('anio_desde', '<=', $anio)
                              ->where(function($end) use ($anio) {
                                  $end->where('anio_hasta', '>=', $anio)
                                      ->orWhere('anio_hasta', 0);
                              });
                        })
                        // Caso B: Rango "Solo Año" (Fin es NULL)
                        // Asumimos que si no tiene fin, es válido SOLO para el año de inicio exacto.
                        // Esto permite encontrar "Falcon 1980" buscando 1980, pero no buscado 2025.
                        ->orWhere(function($w) use ($anio) {
                            $w->whereNotNull('anio_desde')
                              ->whereNull('anio_hasta')
                              ->where('anio_desde', '=', $anio);
                        });
                    });
                }


                // Motor
                if ($motor = $request->input('motor')) {
                     $q->where('motor', 'like', "%{$motor}%");
                }
            });
        } elseif ($idMarca = $request->input('vehiculo_marca_id')) {
            // Solo marca seleccionada (sin modelo específico)
            $query->whereHas('vehiculos', function ($q) use ($idMarca) {
                $q->where('vehiculo_marca_id', $idMarca);
            });
        }


        // Filtro por Marca de PRODUCTO (no vehículo)
        if ($marcaId = $request->input('marca_id')) {
            $query->where('marca_id', $marcaId);
        }

        $perPage = $request->input('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    /**
     * Búsqueda por código de barras exacto (para lector).
     */
    public function findByBarcode($codigo)
    {
        $producto = Producto::with(['marca', 'vehiculos'])
            ->where('codigo_barra', $codigo)
            ->first();

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        return response()->json($producto);
    }

    /**
     * Store (Crear Producto).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'sku_interno'       => 'nullable|string|max:50|unique:productos,sku_interno',
            'codigo_barra'      => 'nullable|string|max:100|unique:productos,codigo_barra',
            'nombre'            => 'required|string|max:255',
            'descripcion_corta' => 'nullable|string',
            'marca_id'          => 'nullable|integer|exists:marcas,id',
            'proveedor_id'      => 'nullable|integer|exists:proveedores,id',
            
            // Precios
            'precio_lista'      => 'nullable|numeric|min:0',
            'precio_oferta'     => 'nullable|numeric|min:0',
            'moneda'            => 'required|in:ARS,USD',
            
            // Costos
            'costo_promedio'      => 'nullable|numeric|min:0',
            'costo_ultima_compra' => 'nullable|numeric|min:0',
            
            // Impuestos
            'alicuota_iva'      => 'required|numeric|min:0',
            
            // Flags
            'stock_controlado'  => 'boolean',
            'stock_disponible'  => 'nullable|numeric|min:0',
            'activo'            => 'boolean',
        ]);

        // Generar SKU si no viene
        if (empty($data['sku_interno'])) {
            $data['sku_interno'] = Sku::generate('RP'); 
        }

        // Slug
        $data['slug'] = $this->generateSlug($data['nombre']);

        $producto = Producto::create($data);

        return response()->json($producto, 201);
    }

    /**
     * Show.
     */
    public function show(Producto $producto)
    {
        return $producto->load(['marca', 'proveedor', 'vehiculos']);
    }

    /**
     * Update.
     */
    public function update(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'sku_interno'       => 'nullable|string|max:50|unique:productos,sku_interno,'.$producto->id,
            'codigo_barra'      => 'nullable|string|max:100|unique:productos,codigo_barra,'.$producto->id,
            'nombre'            => 'required|string|max:255',
            'descripcion_corta' => 'nullable|string',
            'marca_id'          => 'nullable|integer|exists:marcas,id',
            'proveedor_id'      => 'nullable|integer|exists:proveedores,id',
            
            'precio_lista'      => 'nullable|numeric|min:0',
            'precio_oferta'     => 'nullable|numeric|min:0',
            'moneda'            => 'required|in:ARS,USD',
            
            'costo_promedio'      => 'nullable|numeric|min:0',
            'costo_ultima_compra' => 'nullable|numeric|min:0',
            
            'alicuota_iva'      => 'required|numeric|min:0',
            
            'stock_controlado'  => 'boolean',
            'stock_disponible'  => 'nullable|numeric|min:0',
            'activo'            => 'boolean',
        ]);

        if ($data['nombre'] !== $producto->nombre) {
             $data['slug'] = $this->generateSlug($data['nombre'], $producto->id);
        }

        $producto->update($data);

        return response()->json($producto);
    }

    /**
     * Destroy.
     */
    public function destroy(Producto $producto)
    {
        $producto->delete(); 
        return response()->json(['status' => 'ok']);
    }

    // --- Helpers de compatibilidad ---

    public function vehiculos(Producto $producto)
    {
        return response()->json($producto->vehiculos);
    }

    public function attachVehiculo(Request $request, Producto $producto)
    {
        $req = $request->validate([
            'vehiculo_id' => 'required|exists:vehiculos,id',
            'observacion' => 'nullable|string|max:255'
        ]);

        // Evitar duplicados
        if (!$producto->vehiculos()->where('vehiculo_id', $req['vehiculo_id'])->exists()) {
            $producto->vehiculos()->attach($req['vehiculo_id'], [
                'observacion' => $req['observacion'] ?? null
            ]);
        }

        // Devolver lista actualizada
        return response()->json([
            'status' => 'ok', 
            'vehiculos' => $producto->load('vehiculos.marca','vehiculos.modelo')->vehiculos
        ]);
    }

    public function detachVehiculo(Producto $producto, Vehiculo $vehiculo)
    {
        $producto->vehiculos()->detach($vehiculo->id);
        return response()->json(['status' => 'ok']);
    }

    // --- Auxiliar Slug ---

    private function generateSlug($nombre, $ignoreId = null)
    {
        $slug = Str::slug($nombre);
        $original = $slug;
        $i = 1;
        
        // Verificar unicidad básica (aunque slug no es unique en DB, es buena práctica)
        // Aquí simplificamos
        return $slug;
    }

    /**
     * Listado de Marcas de Productos (ej: Bosch, SKF, etc).
     * Distinto a las marcas de vehículos.
     */
    public function marcas()
    {
        return Marca::orderBy('nombre')->get(['id', 'nombre']);
    }
    
    /**
     * Crear una nueva marca de Producto al vuelo.
     */
    public function storeMarca(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre'
        ]);
        
        $marca = Marca::create([
            'nombre' => $data['nombre'],
            'slug'   => \Illuminate\Support\Str::slug($data['nombre'])
        ]);
        
        return response()->json($marca, 201);
    }
}
