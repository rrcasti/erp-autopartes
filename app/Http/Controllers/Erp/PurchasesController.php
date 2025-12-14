<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PurchaseRequisition;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchasesController extends Controller
{
    // --- REQUISICIONES ---

    public function destroyRequisition($id)
    {
        try {
            $req = PurchaseRequisition::findOrFail($id);
            // El usuario quiere control total: Se permite borrar CUALQUIER estado.
            
            DB::transaction(function () use ($req) {
                 // 1. Desvincular Órdenes de Compra asociadas (para no dejar referencias rotas)
                 \App\Models\PurchaseOrder::where('requisition_id', $req->id)->update(['requisition_id' => null]);

                 // 2. Desvincular Runs de Reposición
                 \App\Models\ReplenishmentRun::where('requisition_id', $req->id)->update(['requisition_id' => null]);

                 // 3. Borrar
                 $req->items()->delete();
                 $req->delete();
            });
            
            return response()->json(['message' => 'Solicitud eliminada correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }

    public function indexRequisitions()
    {
        \Illuminate\Support\Facades\Log::info("INDEX REQUISITIONS HIT");
        try {
            // Listar requisiciones
            $reqs = PurchaseRequisition::with('creator')->latest()->get();
            \Illuminate\Support\Facades\Log::info("Requisitions found: " . $reqs->count());
            
            // Mapear para frontend
            $data = $reqs->map(function($r) {
                return [
                    'id' => $r->id,
                    'created_at' => $r->created_at,
                    'expected_total' => 0, 
                    'status' => $r->status,
                    'supplier' => null,
                    'created_by_name' => $r->creator ? $r->creator->name : 'Sistema'
                ];
            });
            
            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("INDEX REQ ERROR: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function showRequisition($id)
    {
        // Cargar items, producto y la relación de precios/códigos de proveedor
        $req = PurchaseRequisition::with(['items.product.productosProveedores'])->findOrFail($id);
        
        // Transformar items para facilitar consumo en frontend
        $req->items->transform(function($item) {
            $prod = $item->product;
            
            // Intentar buscar el código de proveedor específico si existe
            $supplierCode = '-';
            if ($prod && $prod->productosProveedores) {
                 // Tomamos el primero disponible
                 $pivot = $prod->productosProveedores->first();
                 if ($pivot) {
                     $supplierCode = !empty($pivot->codigo_producto) ? $pivot->codigo_producto : '-';
                 }
            }

            // Inyectar datos planos al item para el frontend
            // Usamos 'sku_interno' ya que 'sku' no existe en el modelo Producto
            $item->product_sku = $prod ? $prod->sku_interno : 'N/A';
            // Nombre existe como 'nombre'
            $item->product_name = $prod ? $prod->nombre : 'Producto no encontrado (ID: '.$item->product_id.')';
            $item->supplier_code = $supplierCode;
            
            return $item;
        });

        return response()->json($req);
    }
    
    public function generateOrderFromRequisition($id)
    {
        // ConvertirREQ a OC
        // Si no existe tabla Orders, simulamos
        return response()->json([
            'success' => true,
            'order_id' => 1000 + $id,
            'message' => 'Orden generada (Simulada)'
        ]);
    }
    
    // --- ORDENES DE COMPRA ---
    
    public function indexOrders()
    {
        try {
            $orders = \App\Models\PurchaseOrder::with(['supplier', 'creator'])->latest()->get();
            
            $data = $orders->map(function($o) {
                return [
                    'id' => $o->id,
                    'po_number' => $o->po_number,
                    'issued_at' => $o->issued_at,
                    'supplier_name' => $o->supplier ? $o->supplier->nombre : 'Desconocido',
                    'total_amount' => $o->total_amount,
                    'status' => $o->status,
                    'item_count' => $o->items()->count(),
                ];
            });

            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
             return response()->json(['data' => [], 'error' => $e->getMessage()]);
        }
    }

    public function showOrder($id)
    {
        return response()->json(['id' => $id, 'items' => []]);
    }
    
    public function receiveOrder($id)
    {
        // Recibir mercadería (Stock In)
        return response()->json(['success' => true, 'message' => 'Mercadería recibida (Simulado)']);
    }
}
