<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\StockMovement;
use App\Models\StockBalance;
use Carbon\Carbon;

class ReportSoldToday extends Command
{
    protected $signature = 'report:sold-today';
    protected $description = 'Muestra lista de productos vendidos en el día actual con su stock remanente.';

    public function handle()
    {
        $date = Carbon::today();
        $this->info("Reporte de Ventas del día: " . $date->format('d/m/Y'));

        $movements = StockMovement::where('type', 'SALE')
            ->whereDate('happened_at', $date)
            ->with(['product', 'product.proveedor'])
            ->get();

        if ($movements->isEmpty()) {
            $this->warn('No hubo ventas registradas hoy.');
            return;
        }

        $summary = $movements->groupBy('product_id')->map(function ($rows) {
            $first = $rows->first();
            $product = $first->product;
            $qty = $rows->sum(fn($r) => abs($r->quantity));
            
            // Stock Actual (buscamos balance sumado de todos los depósitos)
            $stockNow = StockBalance::where('product_id', $product->id)->sum('on_hand');

            return [
                'sku' => $product->sku_interno,
                'name' => \Illuminate\Support\Str::limit($product->nombre, 40),
                'sold' => $qty,
                'stock' => $stockNow,
                'supplier' => $product->proveedor->razon_social ?? '-',
            ];
        });

        $this->table(
            ['SKU', 'Producto', 'Vendido Hoy', 'Stock Actual', 'Proveedor Sugerido'],
            $summary->toArray()
        );
        
        $this->info("Total Items Diferentes: " . $summary->count());
    }
}
