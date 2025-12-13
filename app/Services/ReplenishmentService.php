<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\StockBalance;
use App\Models\PurchaseRequisition;
use App\Models\PurchaseRequisitionItem;
use Carbon\Carbon;

class ReplenishmentService
{
    /**
     * Genera requisición de compra basada en stock bajo y ventas recientes.
     */
    public function generatePurchaseRequisition($user, $daysWindow = 30)
    {
        // 1. Identificar productos a reponer
        // Estrategia MVP A: Productos bajo mínimo (configurado en producto)
        // Estrategia MVP B: Productos con stock <= 0
        
        // Usaremos Estrategia Híbrida:
        // Buscar productos stock_controlado=true donde stock_disponible <= stock_minimo (o 2 si null)
        
        $products = Producto::where('stock_controlado', true)
            ->where(function($q) {
                $q->whereRaw('stock_disponible <= IFNULL(stock_minimo, 2)');
            })
            ->with('proveedor')
            ->get();
            
        if ($products->isEmpty()) {
            return null;
        }

        // 2. Crear Cabecera
        $requisition = PurchaseRequisition::create([
            'created_by' => $user->id,
            'status' => 'DRAFT',
            'generated_params' => ['reason' => 'Low Stock Auto-Gen', 'window' => $daysWindow],
            'notes' => 'Generado automáticamente por sistema de reposición.',
        ]);

        // 3. Crear Items
        foreach ($products as $p) {
            $currentStock = $p->stock_disponible;
            $min = $p->stock_minimo ?? 2;
            $ideal = $p->stock_ideal ?? ($min * 3); // Si no hay ideal, x3 del mínimo
            
            $suggested = max(1, $ideal - $currentStock);

            PurchaseRequisitionItem::create([
                'purchase_requisition_id' => $requisition->id,
                'supplier_id' => $p->proveedor_id, // Puede ser null
                'product_id' => $p->id,
                'variation_id' => null,
                'suggested_qty' => $suggested,
                'reason' => "Stock ($currentStock) debajo de Mínimo ($min)",
                'stock_current' => $currentStock,
                'avg_daily_sales' => 0, // TODO: Calcular con StockMovements
            ]);
        }
        
        return $requisition;
    }
}
