<?php

namespace App\Services;

use App\Models\ReplenishmentBacklog;
use App\Models\ReplenishmentEvent;
use App\Models\ReplenishmentRun;
use App\Models\Sale;
use App\Models\PurchaseRequisition;
use App\Models\PurchaseRequisitionItem;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;
use App\Models\ProductoProveedor; // Asumiendo este modelo para pivot

class ReplenishmentBacklogService
{
    // ... incrementFromSale se mantiene igual ...
    public function incrementFromSale(Sale $sale, $user)
    {
        foreach ($sale->items as $item) {
            if (!$item->producto_id) continue;
            $product = Producto::find($item->producto_id);
            if (!$product) continue;

            $supplierId = null;
            $pp = DB::table('productos_proveedores')
                    ->where('producto_id', $product->id)
                    ->where('activo', true)
                    ->orderBy('precio_lista', 'asc')
                    ->first();
            
            if ($pp) {
                $supplierId = $pp->proveedor_id;
            }

            $backlog = ReplenishmentBacklog::firstOrCreate(
                ['product_id' => $product->id, 'supplier_id' => $supplierId],
                ['pending_qty' => 0]
            );

            $backlog->increment('pending_qty', $item->cantidad);
            $backlog->touch('last_activity_at');

            ReplenishmentEvent::create([
                'backlog_id' => $backlog->id,
                'event_type' => 'SALE_CONFIRMED',
                'qty_delta' => $item->cantidad,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'user_id' => $user ? $user->id : null,
                'happened_at' => now(),
                'notes' => "Venta #{$sale->id}"
            ]);
        }
    }

    /**
     * Obtener el último Run cerrado para calcular cutoff.
     */
    public function getLastClosedRun()
    {
        return ReplenishmentRun::where('run_type', 'AUTO_REPLENISHMENT')
            ->where('status', 'CLOSED')
            ->latest('to_at')
            ->first();
    }

    /**
     * Obtener Run en borrador si existe.
     */
    public function getOpenDraftRun() 
    {
        return ReplenishmentRun::where('run_type', 'AUTO_REPLENISHMENT')
            ->where('status', 'DRAFT')
            ->latest()
            ->first();
    }

    /**
     * Generar un RUN de reposición (INCREMENTAL: Solo lo nuevo desde el último cierre).
     */
    public function generateReplenishmentRun($user, $options = [])
    {
        // 1. Verificar si ya existe Draft
        $existingDraft = $this->getOpenDraftRun();
        if ($existingDraft && empty($options['force'])) {
            return [
                'run' => $existingDraft,
                'is_existing' => true,
                'message' => 'Ya existe una reposición en curso (Borrador).'
            ];
        }

        // 2. Calcular Rango de Tiempo (Cutoff)
        $lastClosed = $this->getLastClosedRun();
        // Si no hay cierres previos, tomamos desde el principio de los tiempos (o una fecha prudente, ej: inicio año)
        // Para asegurar que agarre todo lo viejo si es la primera vez, usamos fecha muy antigua si es null.
        $fromAt = $lastClosed ? $lastClosed->to_at : \Carbon\Carbon::create(2000, 1, 1); 
        $toAt = now();

        // 3. Obtener Ventas en el Rango (Incremental)
        // Buscamos eventos de venta en este periodo
        $events = ReplenishmentEvent::where('event_type', 'SALE_CONFIRMED')
            ->where('happened_at', '>', $fromAt)
            ->where('happened_at', '<=', $toAt)
            ->get();

        if ($events->isEmpty()) {
            return ['status' => 'empty', 'message' => 'No se registraron nuevas ventas desde el último cierre.'];
        }

        // Agrupar por backlog_id para sumar cantidades
        $deltas = $events->groupBy('backlog_id')->map(function ($row) {
            return $row->sum('qty_delta');
        });

        // Filtrar aquellos con cantidad > 0
        $validBacklogIds = $deltas->filter(function ($qty) { return $qty > 0; })->keys();

        if ($validBacklogIds->isEmpty()) {
            return ['status' => 'empty', 'message' => 'No hay cantidades pendientes para generar.'];
        }

        // Cargar los modelos de Backlog completos (para saber producto y proveedor)
        $backlogItems = ReplenishmentBacklog::whereIn('id', $validBacklogIds)
            ->with(['product', 'supplier'])
            ->get();

        // 4. Crear RUN en DB
        $run = new ReplenishmentRun();
        $run->run_type = 'AUTO_REPLENISHMENT';
        $run->status = 'DRAFT';
        $run->from_at = $fromAt; // Guardamos el rango real que cubrimos
        $run->to_at = $toAt;
        $run->generated_by = $user->id;
        $run->generated_at = now();
        $run->suppliers_count = $backlogItems->pluck('supplier_id')->unique()->count();
        $run->items_count = $validBacklogIds->count(); // Cantidad de productos distintos
        
        $reqIds = [];
        
        DB::transaction(function () use ($backlogItems, $deltas, $user, $run, &$reqIds) {
             $grouped = $backlogItems->groupBy('supplier_id');
             
             $run->save();

             foreach ($grouped as $supplierId => $items) {
                 $req = new PurchaseRequisition();
                 $req->created_by = $user->id; 
                 $req->status = 'draft';
                 $req->notes = "Reposición Auto Run #{$run->id}";
                 if ($supplierId) {
                      $supplierName = isset($items->first()->supplier->razon_social) ? $items->first()->supplier->razon_social : 'Desconocido';
                      $req->notes .= " - Prov: $supplierName";
                 } else {
                      $req->notes .= " - Prov: Varios";
                 }
                 $req->save();
                 $reqIds[] = $req->id;

                 foreach ($items as $b) {
                     // IMPORTANTE: Usamos la cantidad INCREMENTAL calculada ($deltas[$b->id]), no el total acumulado ($b->pending_qty)
                     $qtyForRun = isset($deltas[$b->id]) ? $deltas[$b->id] : 0;
                     
                     if ($qtyForRun > 0) {
                         PurchaseRequisitionItem::create([
                             'purchase_requisition_id' => $req->id,
                             'product_id' => $b->product_id,
                             'quantity' => $qtyForRun,
                             'suggested_qty' => $qtyForRun, // Campo obligatorio
                         ]);
                     }
                 }
                 
                 // Crear evento de traza para el Run
                 ReplenishmentEvent::create([
                    'backlog_id' => $items->first()->id, // Asociamos a uno representativo o creamos loop
                    'event_type' => 'REQ_GENERATED',
                    'qty_delta' => 0,
                    'reference_type' => 'replenishment_run',
                    'reference_id' => $run->id,
                    'user_id' => $user->id,
                    'happened_at' => now(),
                    'notes' => "Run incremental generado"
                 ]);
             }
             
             if (!empty($reqIds)) {
                 $run->requisition_id = $reqIds[0];
                 $run->notes = "Generó requisiciones IDs: " . implode(', ', $reqIds);
                 $run->save();
             }
        });

        return [
            'run' => $run,
            'requisition_ids' => $reqIds,
            'status' => 'created'
        ];
    }

    /**
     * Cerrar un Run (Marcar como procesado y avanzar cutoff).
     */
    public function closeRun($runId, $user)
    {
        $run = ReplenishmentRun::findOrFail($runId);
        
        if ($run->status !== 'DRAFT') {
            throw new \Exception("Solo se pueden cerrar reposiciones en estado Borrador.");
        }

        $run->status = 'CLOSED';
        $run->closed_by = $user->id;
        $run->closed_at = now();
        $run->save();

        return $run;
    }
}
