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

    public function indexRequisitions()
    {
        // Listar requisiciones
        $reqs = PurchaseRequisition::with('user')->latest()->get();
        
        // Mapear para frontend
        $data = $reqs->map(function($r) {
            return [
                'id' => $r->id,
                'created_at' => $r->created_at,
                'expected_total' => 0, // Calcular si hay precios
                'status' => $r->status, // draft, approved, converted
                'supplier' => null // TODO: Relation
            ];
        });
        
        return response()->json(['data' => $data]);
    }

    public function showRequisition($id)
    {
        $req = PurchaseRequisition::with('items.product')->findOrFail($id);
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
        // Si no tenemos modelo Order, devolvemos array vacío
        return response()->json(['data' => []]);
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
