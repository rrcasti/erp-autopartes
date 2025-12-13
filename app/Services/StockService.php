<?php

namespace App\Services;

use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Obtiene stock disponible (físico - reservado).
     */
    public function getAvailableStock($productId, $variationId = null, $warehouseId = 1)
    {
        $balance = StockBalance::where('product_id', $productId)
            ->where('variation_id', $variationId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        // Fallback a tabla producto si no hay balance aún (migración progresiva)
        if (!$balance) {
            $prod = Producto::find($productId);
            return $prod ? ($prod->stock_disponible ?? 0) : 0;
        }

        return $balance->on_hand - $balance->reserved;
    }

    /**
     * Descuenta stock por venta confirmada.
     */
    public function applySaleOutflow($sale, $items, $warehouseId = 1, $user = null)
    {
        foreach ($items as $item) {
            $productId = $item->producto_id;
            
            // Fallback: Si no hay ID, buscar por SKU (robustez)
            if (!$productId && $item->sku) {
                $p = Producto::where('sku_interno', $item->sku)->first();
                if ($p) {
                    $productId = $p->id;
                    // Opcional: Actualizar el sale_item con el ID encontrado
                    $item->producto_id = $p->id;
                    $item->save();
                }
            }

            if (!$productId) continue;

            $qty = $item->cantidad;
            // Asumimos variation_id null por ahora si no viene en item
            $variationId = null; 

            // Usemos lock para consistencia
            // 1. Obtener o crear Balance
            $balance = StockBalance::firstOrCreate(
                ['product_id' => $productId, 'variation_id' => $variationId, 'warehouse_id' => $warehouseId],
                ['on_hand' => 0, 'reserved' => 0]
            );

            $before = $balance->on_hand;
            // Si queremos permitir negativo temporalmente:
            $after = $before - $qty;

            // 2. Actualizar Balance
            $balance->on_hand = $after;
            $balance->save();

            // 3. Crear Movimiento
            StockMovement::create([
                'product_id' => $productId,
                'variation_id' => $variationId,
                'warehouse_id' => $warehouseId,
                'user_id' => $user ? $user->id : 1, // Default admin
                'type' => 'SALE',
                'quantity' => -1 * abs($qty),
                'qty_before' => $before,
                'qty_after' => $after,
                'sale_id' => $sale->id,
                'reference_description' => "Venta #" . ($sale->receipt_number ?? $sale->id),
                'unit_cost_snapshot' => 0, // TODO: Implementar Costo Promedio Ponderado
                'happened_at' => now(),
            ]);

            // 4. Actualizar modelo legacy para compatibilidad UI actual
            $prod = Producto::find($productId);
            if ($prod /* && $prod->stock_controlado */) {
                 $prod->stock_disponible = $after;
                 $prod->save();
            }
        }
    }
}
