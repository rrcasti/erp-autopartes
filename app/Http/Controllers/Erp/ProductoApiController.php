<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Models\Vehiculo;
use App\Models\Marca;
use App\Models\VehiculoMarca;
use App\Models\VehiculoModelo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        // Generar SKU Incremental RP-XXXXXX
        if (empty($data['sku_interno'])) {
            $data['sku_interno'] = $this->generateNextSku();
        }

        // Slug
        $data['slug'] = $this->generateSlug($data['nombre']);

        $producto = Producto::create($data);

        // Detección automática de vehículos compatibles
        $this->autoLinkVehicles($producto);

        return response()->json($producto->load(['marca', 'proveedor', 'vehiculos.marca', 'vehiculos.modelo']), 201);
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
             // Opcional: ¿Re-detectar vehículos al cambiar nombre?
             // Por seguridad, no borramos lo existente, solo podríamos agregar nuevos.
        }

        $producto->update($data);

        return response()->json($producto->load(['marca', 'proveedor', 'vehiculos.marca', 'vehiculos.modelo']));
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

        if (!$producto->vehiculos()->where('vehiculo_id', $req['vehiculo_id'])->exists()) {
            $producto->vehiculos()->attach($req['vehiculo_id'], [
                'observacion' => isset($req['observacion']) ? $req['observacion'] : null
            ]);
        }

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
        return Str::slug($nombre);
    }

    // --- Auxiliar SKU Incremental ---
    private function generateNextSku()
    {
        // 1. Intentar encontrar el último SKU para partir de ahí (Usando DB directa para evitar scopes ocultos)
        $last = DB::table('productos')
            ->where('sku_interno', 'like', 'RP-%')
            ->orderByRaw('LENGTH(sku_interno) desc')
            ->orderBy('sku_interno', 'desc')
            ->first();

        $number = 1;
        if ($last && preg_match('/RP-(\d+)/', $last->sku_interno, $matches)) {
            $number = intval($matches[1]) + 1;
        }

        // 2. Loop de seguridad para garantizar unicidad
        $sku = 'RP-' . str_pad($number, 6, '0', STR_PAD_LEFT);
        
        // Verificación directa en BD
        while (DB::table('productos')->where('sku_interno', $sku)->exists()) {
            $number++;
            $sku = 'RP-' . str_pad($number, 6, '0', STR_PAD_LEFT);
        }

        return $sku;
    }

    // --- Auxiliar Detección Automática de Vehículos ---
    private function autoLinkVehicles(Producto $product)
    {
        try {
            $name = strtolower($product->nombre);
        
        // 1. Detectar Marca
        $brands = VehiculoMarca::where('activo', true)->get();
        $foundBrand = null;
        
        foreach($brands as $b) {
            if (str_contains($name, strtolower($b->nombre))) {
                $foundBrand = $b;
                break; // Asumimos la primera marca encontrada
            }
        }
        
        if (!$foundBrand) return;

        // 2. Detectar Modelo
        $models = VehiculoModelo::where('vehiculo_marca_id', $foundBrand->id)->where('activo', true)->get();
        $foundModel = null;
        
        foreach($models as $m) {
            if (str_contains($name, strtolower($m->nombre))) {
                $foundModel = $m;
                break; 
            }
        }

        if (!$foundModel) return;

        // 3. Detectar Año (YYYY)
        preg_match_all('/\b(19|20)\d{2}\b/', $name, $matches);
        $detectedYears = $matches[0];
        
        // 4. Buscar Vehículos compatibles
        $query = Vehiculo::where('vehiculo_marca_id', $foundBrand->id)
                    ->where('vehiculo_modelo_id', $foundModel->id);
        
        $vehicles = collect();
        
        if (!empty($detectedYears)) {
             // Si encontramos años, buscamos vehículos que cubran ese año
             $year = intval($detectedYears[0]);
             
             // Clonamos query base para no afectar el fallback
             $qYear = clone $query;
             $qYear->where(function($q) use ($year) {
                 $q->where('anio_desde', '<=', $year)
                   ->where(function($end) use ($year) {
                       $end->where('anio_hasta', '>=', $year)->orWhereNull('anio_hasta')->orWhere('anio_hasta', 0);
                   });
             });
             
             $vehicles = $qYear->limit(5)->get();
        }

        // Fallback: Si no se encontró nada por año (o no hubo año), traer vehículos del modelo sin filtro de año
        if ($vehicles->isEmpty()) {
            $vehicles = $query->limit(5)->get();
        } 

        if ($vehicles->isNotEmpty()) {
            $product->vehiculos()->syncWithoutDetaching($vehicles->pluck('id'));
        }
        
        } catch (\Exception $e) {
            Log::error("Error en autoLinkVehicles para producto {$product->id}: " . $e->getMessage());
        }
    }

    /**
     * Listado de Marcas de Productos.
     */
    public function marcas()
    {
        return Marca::orderBy('nombre')->get(['id', 'nombre']);
    }
    
    public function storeMarca(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre'
        ]);
        
        $marca = Marca::create([
            'nombre' => $data['nombre'],
            'slug'   => Str::slug($data['nombre'])
        ]);
        
        return response()->json($marca, 201);
    }

    public function familias()
    {
        return \App\Models\FamiliaProducto::orderBy('nombre')->get(['id', 'nombre']);
    }

}
