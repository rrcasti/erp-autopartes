<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use App\Models\ProductoProveedor;
use App\Models\Producto;
use Illuminate\Http\Request;

class ProveedorApiController extends Controller
{
    /**
     * GET /erp/api/proveedores
     * Lista de proveedores activos para combos
     */
    public function index()
    {
        $proveedores = Proveedor::where('activo', true)
            ->orderBy('razon_social')
            ->get(['id', 'razon_social', 'nombre_fantasia', 'activo']);

        return response()->json($proveedores);
    }
    
    /**
     * POST /erp/api/proveedores
     * Crear un nuevo proveedor al vuelo
     */
    public function store(Request $request) 
    {
        $data = $request->validate([
            'razon_social' => 'required|string|max:255|unique:proveedores,razon_social'
        ]);
        
        // Crear proveedor mínimo. 
        // Asumimos que otros campos son nullable en la DB
        $proveedor = Proveedor::create([
            'razon_social' => $data['razon_social'],
            'activo' => true
        ]);
        
        return response()->json($proveedor, 201);
    }

    /**
     * GET /erp/api/productos/{producto}/proveedores
     * Proveedores asociados a un producto
     */
    public function proveedoresDeProducto(Producto $producto)
    {
        $producto->load([
            'productosProveedores' => function ($q) {
                $q->where('activo', true);
            },
            'productosProveedores.proveedor'
        ]);

        return response()->json($producto->productosProveedores);
    }

    /**
     * POST /erp/api/productos/{producto}/proveedores
     * Agregar o actualizar proveedor de un producto
     */
    public function attachProveedor(Request $request, Producto $producto)
    {
        $data = $request->validate([
            'proveedor_id'     => ['required', 'integer', 'exists:proveedores,id'],
            'sku_proveedor'    => ['nullable', 'string', 'max:100'],
            'precio_lista'     => ['required', 'numeric', 'min:0'],
            'activo'           => ['sometimes', 'boolean'],
        ]);

        // Buscar si ya existe ProductoProveedor
        $pp = ProductoProveedor::where('producto_id', $producto->id)
            ->where('proveedor_id', $data['proveedor_id'])
            ->first();

        if ($pp) {
            // Actualizar existente
            $pp->update([
                'sku_proveedor' => isset($data['sku_proveedor']) ? $data['sku_proveedor'] : null,
                'precio_lista'  => $data['precio_lista'],
                'activo'        => isset($data['activo']) ? $data['activo'] : true,
            ]);
        } else {
            // Crear nuevo
            $pp = ProductoProveedor::create([
                'producto_id'   => $producto->id,
                'proveedor_id'  => $data['proveedor_id'],
                'sku_proveedor' => isset($data['sku_proveedor']) ? $data['sku_proveedor'] : null,
                'precio_lista'  => $data['precio_lista'],
                'activo'        => isset($data['activo']) ? $data['activo'] : true,
            ]);

            // Actualizar costo_ultima_compra del producto (si es el primero)
            if ($producto->productosProveedores()->where('activo', true)->count() == 1) {
                $producto->costo_ultima_compra = $data['precio_lista'];
                $producto->save();
            }
        }

        // Recargar relación
        $producto->load([
            'productosProveedores' => function ($q) {
                $q->where('activo', true);
            },
            'productosProveedores.proveedor'
        ]);

        return response()->json([
            'status'     => 'ok',
            'proveedores' => $producto->productosProveedores,
        ]);
    }

    /**
     * DELETE /erp/api/productos/{producto}/proveedores/{proveedor}
     * Eliminar proveedor de un producto (baja lógica)
     */
    public function detachProveedor(Producto $producto, Proveedor $proveedor)
    {
        $pp = ProductoProveedor::where('producto_id', $producto->id)
            ->where('proveedor_id', $proveedor->id)
            ->first();

        if ($pp) {
            $pp->activo = false;
            $pp->save();
            // O: $pp->delete(); para eliminar físicamente si prefieres
        }

        return response()->json(['status' => 'ok']);
    }
}
