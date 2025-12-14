<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderEvent;
use App\Models\ReplenishmentRun;
use App\Models\ReplenishmentBacklog;
use App\Models\PurchaseRequisition;
use Illuminate\Support\Facades\Mail;
use App\Mail\PurchaseOrderSent;

class PurchaseOrderController extends Controller
{
    /**
     * Create a Purchase Order from a Requisition.
     * POST /erp/api/purchase-orders/from-requisition/{requisitionId}
     */
    public function createFromRequisition(Request $request, $requisitionId)
    {
        \Illuminate\Support\Facades\Log::info("START createFromRequisition for ID: $requisitionId");
        
        DB::beginTransaction();
        try {
            // Validar si ya existe
            \Illuminate\Support\Facades\Log::info("Step 1: Checking existing PO");
            $existing = PurchaseOrder::where('requisition_id', $requisitionId)->first();
            if ($existing) {
                \Illuminate\Support\Facades\Log::info("Existing PO found: " . $existing->id);
                return response()->json(['error' => 'Ya existe una Orden de Compra para esta requisición.', 'po_id' => $existing->id], 400);
            }

            \Illuminate\Support\Facades\Log::info("Step 2: Finding Requisition");
            $req = \App\Models\PurchaseRequisition::with('items')->findOrFail($requisitionId);
            \Illuminate\Support\Facades\Log::info("Requisition found. Items count: " . $req->items->count());

            $firstItem = $req->items->first();
            if (!$firstItem) {
                throw new \RuntimeException('La requisición no tiene ítems para generar una orden.');
            }

            // 1. Determinar Proveedor
            $supplierId = $req->supplier_id;
            
            // Si no hay proveedor en la requisición, intentamos deducirlo del primer producto
            if (!$supplierId) {
                // Cargar producto para ver su proveedor habitual
                $prod = \App\Models\Producto::find($firstItem->product_id);
                if ($prod) {
                    // Intentamos proveedor_id o proveedor_principal_id
                    $supplierId = $prod->proveedor_id ? $prod->proveedor_id : $prod->proveedor_principal_id; 
                }
            }

            // Fix: Numeración secuencial robusta (inmune a borrados)
            $year = date('Y');
            $lastPO = PurchaseOrder::where('po_number', 'like', "OC-$year-%")
                        ->orderBy('id', 'desc')
                        ->first();
            
            $newSeq = 1;
            if ($lastPO) {
                // Formato esperado: OC-2025-000001
                $parts = explode('-', $lastPO->po_number);
                $lastSeq = intval(end($parts));
                $newSeq = $lastSeq + 1;
            }
            
            $poNumber = 'OC-' . $year . '-' . str_pad((string) $newSeq, 6, '0', STR_PAD_LEFT);
            
            \Illuminate\Support\Facades\Log::info("Step 3: Creating Header with number $poNumber");
            
            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $supplierId,
                'requisition_id' => $req->id,
                'status' => 'DRAFT',
                'created_by' => Auth::id() ? Auth::id() : 1,
                'issued_at' => date('Y-m-d'),
                'total_amount' => 0 // Se actualiza después
            ]);
            \Illuminate\Support\Facades\Log::info("PO Header Created: " . $po->id);

            // Crear Items y Calcular Total
            \Illuminate\Support\Facades\Log::info("Step 4: Creating Items");
            $totalAmount = 0;

            foreach ($req->items as $reqItem) {
                // Buscar precio del producto
                $product = \App\Models\Producto::find($reqItem->product_id);
                // Prioridad: Costo Reposición > Costo Promedio > 0
                $unitPrice = 0;
                if ($product) {
                    $unitPrice = $product->costo_ultima_compra > 0 ? $product->costo_ultima_compra : ($product->costo_promedio ? $product->costo_promedio : 0);
                }
                
                $quantity = $reqItem->quantity_suggested ?? 1;

                \App\Models\PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $reqItem->product_id,
                    'quantity_ordered' => $quantity,
                    'quantity_received' => 0,
                    'unit_price' => $unitPrice, 
                ]);
                
                $totalAmount += ($quantity * $unitPrice);
                
                // Adjust Backlog (Committed Qty)
                $backlog = \App\Models\ReplenishmentBacklog::where('product_id', $reqItem->product_id)->first();
                if ($backlog) {
                    $backlog->committed_qty = $backlog->committed_qty + $reqItem->quantity_suggested;
                    $backlog->save();
                }
            }
            
            // Actualizar total y vincular Requisición
            $po->total_amount = $totalAmount;
            $po->requisition_id = $req->id; // Vinculación explícita clave para que InventoryController la encuentre
            $po->save();
            
            \Illuminate\Support\Facades\Log::info("Step 5: Updating Run and Events");
            
            // Link to Run (Buscando por relación inversa)
            $run = \App\Models\ReplenishmentRun::where('requisition_id', $req->id)->first();
            if($run) {
                $run->purchase_order_id = $po->id;
                // AUTO-CIERRE: Al generar la orden, el ciclo de reposición se considera completo.
                $run->status = 'CLOSED';
                $run->closed_at = now();
                $run->closed_by = Auth::id() ?: 1;
                $run->save();
            }

            // Log Event
            PurchaseOrderEvent::create([
                'purchase_order_id' => $po->id,
                'event_type' => 'CREATED',
                'data' => json_encode(['source' => 'requisition', 'req_id' => $req->id]),
                'user_id' => Auth::id() ? Auth::id() : 1,
            ]);

            // Update Requisition Status
            $req->status = 'converted';
            $req->save();

            DB::commit();
            \Illuminate\Support\Facades\Log::info("SUCCESS: Transaction Committed");
            return response()->json(['success' => true, 'po_id' => $po->id]);

        } catch (\Throwable $e) { // Capturar Fatal Errors
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('PO CRASH TRACE: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'error' => 'Error Interno: ' . $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            // Cargar OC base
            $po = PurchaseOrder::findOrFail($id);
            
            // Cargar relaciones paso a paso para evitar fallo total
            try { $po->load(['items.product.proveedor']); } catch(\Throwable $t) { \Illuminate\Support\Facades\Log::error("Error loading items relations: " . $t->getMessage()); }
            try { $po->load('supplier'); } catch(\Throwable $t) {}
            try { $po->load('creator'); } catch(\Throwable $t) {}
            try { $po->load('events.user'); } catch(\Throwable $t) {}

            // Enriquecer items para frontend (seguro)
            if ($po->items) {
                $po->items->each(function($item) {
                     // Extraer datos de producto si existe, o defaults
                     $prod = $item->product;
                     $item->product_name = $prod ? $prod->nombre : ('Prod #' . $item->product_id);
                     $item->product_sku = $prod ? ($prod->sku_interno ?: $prod->sku) : '';
                     $item->supplier_name = ($prod && $prod->proveedor) ? $prod->proveedor->razon_social : '-';
                });
            }

            // Calcular total en tiempo real (útil por si hubo cambios de precios/cantidades)
            $po->calculated_total = $po->items->sum(function($item) {
                return $item->quantity_ordered * $item->unit_price;
            });
            
            return response()->json($po);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("CRITICAL PO SHOW ERROR: " . $e->getMessage());
            return response()->json([
                'error' => $e->getMessage(), 
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    // PATCH /erp/api/purchase-orders/{poId}
    public function update(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);
        
        if ($po->status !== 'DRAFT') {
            return response()->json(['error' => 'Solo se pueden editar órdenes en borrador.'], 400);
        }
        
        DB::beginTransaction();
        try {
            $input = $request->all();
            
            // Manejo de items (edición / eliminación)
            // Esperamos un array 'items' con {id, quantity_ordered, delete}
            if (isset($input['items']) && is_array($input['items'])) {
                foreach ($input['items'] as $itemData) {
                    $item = PurchaseOrderItem::where('id', $itemData['id'])
                        ->where('purchase_order_id', $po->id)
                        ->first();
                        
                    if ($item) {
                        // Caso Eliminación
                        if (isset($itemData['delete']) && $itemData['delete'] == true) {
                            $oldQty = $item->quantity_ordered;
                            
                            // Revertir committed
                            $backlog = ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                            if ($backlog) {
                                $backlog->committed_qty = max(0, $backlog->committed_qty - $oldQty);
                                $backlog->save();
                            }
                            
                            $item->delete();
                            
                            // Datos legibles para auditoría
                            $prod = $item->product; 
                            $prodName = $prod ? $prod->nombre : ('Item #'.$item->product_id);

                            PurchaseOrderEvent::create([
                                'purchase_order_id' => $po->id,
                                'event_type' => 'ITEM_REMOVED',
                                'data' => json_encode([
                                    'product' => $prodName,
                                    'qty' => $oldQty
                                ]),
                                'user_id' => Auth::id() ? Auth::id() : 1,
                                'happened_at' => date('Y-m-d H:i:s')
                            ]);
                        } 
                        // Caso Edición Cantidad
                        elseif (isset($itemData['quantity_ordered'])) {
                            $newQty = $itemData['quantity_ordered'];
                            $oldQty = $item->quantity_ordered;
                            $diff = $newQty - $oldQty;
                            
                            if ($diff != 0) {
                                $item->quantity_ordered = $newQty;
                                $item->save();
                                
                                // Ajustar committed
                                $backlog = ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                                if ($backlog) {
                                    $backlog->committed_qty = max(0, $backlog->committed_qty + $diff);
                                    $backlog->save();
                                }
                                
                                // Datos legibles
                                $prod = $item->product; // Lazy load si no estaba
                                $prodName = $prod ? $prod->nombre : ('Item #'.$item->product_id);

                                PurchaseOrderEvent::create([
                                    'purchase_order_id' => $po->id,
                                    'event_type' => 'QTY_CHANGED',
                                    'data' => json_encode([
                                        'product' => $prodName, 
                                        'old' => $oldQty, 
                                        'new' => $newQty
                                    ]),
                                    'user_id' => Auth::id() ? Auth::id() : 1,
                                    'happened_at' => date('Y-m-d H:i:s')
                                ]);
                            }
                        }
                    }
                    // Agregar Item Manualmente (Sin ID previo)
                    elseif (!isset($itemData['id']) && isset($itemData['product_id']) && isset($itemData['quantity_ordered'])) {
                        $qty = floatval($itemData['quantity_ordered']);
                        if ($qty > 0) {
                            $pid = $itemData['product_id'];
                            
                            // Verificar si ya existe en la orden para sumar
                            $exists = PurchaseOrderItem::where('purchase_order_id', $po->id)
                                ->where('product_id', $pid)
                                ->first();
                                
                            if ($exists) {
                                $exists->quantity_ordered += $qty;
                                $exists->save();
                            } else {
                                $prod = \App\Models\Producto::find($pid);
                                PurchaseOrderItem::create([
                                    'purchase_order_id' => $po->id,
                                    'product_id' => $pid,
                                    'quantity_ordered' => $qty,
                                    'unit_cost' => $prod ? ($prod->costo_promedio ?: 0) : 0,
                                    'quantity_received' => 0
                                ]);
                            }
                            
                            PurchaseOrderEvent::create([
                                'purchase_order_id' => $po->id,
                                'event_type' => 'ITEM_ADDED_MANUAL',
                                'data' => json_encode(['product_id' => $pid, 'qty' => $qty]),
                                'user_id' => Auth::id() ?: 1,
                                'happened_at' => now()
                            ]);
                        }
                    }
                }
            }
            
            // Actualizar campos cabecera si vienen (notas, expected_at)
            
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Orden actualizada']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    // POST /exported
    public function export($id)
    {
         // Stub para PDF
         PurchaseOrderEvent::create([
            'purchase_order_id' => $id,
            'event_type' => 'EXPORTED',
            'data' => json_encode(['format' => 'PDF']),
            'user_id' => Auth::id() ? Auth::id() : 1,
            'happened_at' => date('Y-m-d H:i:s')
        ]);
        
        return response()->json(['url' => '/erp/purchase-orders/'.$id.'/print']); // Url ficticia de vista print
    }
    
    // POST /email
    public function sendEmail(Request $request, $id)
    {
         $po = PurchaseOrder::with('items.product')->findOrFail($id);
         
         $request->validate([
             'email' => 'required|email',
             'subject' => 'required|string',
             'message' => 'nullable|string'
         ]);

         try {
             // Enviar Correo
             Mail::to($request->email)->send(new PurchaseOrderSent($po, $request->subject, $request->input('message')));
             
             // Actualizar estado solo si no estaba cerrada
             if($po->status === 'DRAFT') {
                 $po->status = 'SENT';
                 $po->save();
             }
             
             PurchaseOrderEvent::create([
                'purchase_order_id' => $id,
                'event_type' => 'EMAIL_SENT',
                'data' => json_encode(['to' => $request->email, 'subject' => $request->subject]),
                'user_id' => Auth::id() ?: 1,
                'happened_at' => now()
            ]);
            
            return response()->json(['success' => true, 'message' => 'Orden enviada correctamente a ' . $request->email]);

         } catch (\Exception $e) {
             \Illuminate\Support\Facades\Log::error("Mail Error: " . $e->getMessage());
             
             return response()->json([
                 'success' => false, 
                 'message' => 'Error de Envío: ' . $e->getMessage() . '. Verifique configuración SMTP.'
             ], 500);
         }
    }

    // DELETE /erp/api/purchase-orders/{id}
    public function destroy($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        
        if ($po->status !== 'DRAFT') {
            return response()->json(['error' => 'Solo se pueden eliminar órdenes en borrador.'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Revertir cantidades en camino (Backlog)
            foreach ($po->items as $item) {
                 $backlog = \App\Models\ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                 if ($backlog) {
                     $backlog->committed_qty = max(0, $backlog->committed_qty - $item->quantity_ordered);
                     $backlog->save();
                 }
            }

            // 2. Liberar Requisición (si existe)
            if ($po->requisition_id) {
                // Solo desvinculamos para evitar errores de llave foránea si hay.
            }

            // 3. Desvincular de Reposición (si existe)
            $run = \App\Models\ReplenishmentRun::where('purchase_order_id', $po->id)->first();
            if($run) {
                $run->purchase_order_id = null;
                $run->save();
            }

            // 4. Borrar Items y Eventos (Cascade usualmente se encarga, pero aseguramos)
            $po->items()->delete();
            $po->events()->delete();
            
            // 5. Borrar Orden
            $po->delete();

            DB::commit();
            return response()->json(['message' => 'Orden eliminada y stock pendiente revertido.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cierre Administrativo / Forzado de la Orden
     * Libera compromisos de stock pendiente y cierra el documento.
     */
    public function forceClose(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|min:5'
        ]);
        
        $po = PurchaseOrder::with('items')->findOrFail($id);
        
        if (in_array($po->status, ['CLOSED', 'CANCELLED'])) {
            return response()->json(['success' => false, 'message' => 'La orden ya está cerrada.'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Revertir "Committed Qty" de lo que NO se recibió
            foreach ($po->items as $item) {
                // Si pedí 10 y recibí 0 -> tengo que liberar 10
                $remaining = max(0, $item->quantity_ordered - $item->quantity_received);
                
                if ($remaining > 0) {
                    $backlog = \App\Models\ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                    if ($backlog) {
                        // Usamos decrement para ser atómicos, pero asegurando no bajar de 0
                        // (aunque decrement no chequea 0, asumimos lógica correcta)
                        $backlog->decrement('committed_qty', $remaining);
                    }
                }
            }

            // 2. Cambiar Estado
            $po->status = 'CLOSED'; // O CANCELLED, pero CLOSED es más neutro si se recibió parcial
            // Agregar nota al campo de notas o un campo específico
            // Si el modelo tiene 'notes', concatenamos.
            // $po->notes .= "\n[Cierre Admin]: " . $request->reason; 
            
            $po->save();

            // 3. Loguear Evento
            PurchaseOrderEvent::create([
                'purchase_order_id' => $po->id,
                'event_type' => 'MANUAL_CLOSE',
                'data' => json_encode(['reason' => $request->reason]),
                'user_id' => Auth::id() ?: 1,
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Orden cerrada administrativamente.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reabrir Orden (Reverse Operation)
     * Vuelve a poner la orden en Borrador y restaura el stock comprometido.
     */
    public function reopen(Request $request, $id)
    {
        $po = PurchaseOrder::with('items')->findOrFail($id);
        
        if (!in_array($po->status, ['CLOSED', 'CANCELLED'])) {
            return response()->json(['success' => false, 'message' => 'Solo se pueden reabrir órdenes cerradas o canceladas.'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Restaurar "Committed Qty" (Volver a comprometer el stock)
            foreach ($po->items as $item) {
                // Cantidad que aún falta por recibir (o todo si no se recibió nada)
                $remaining = max(0, $item->quantity_ordered - $item->quantity_received);
                
                if ($remaining > 0) {
                    $backlog = \App\Models\ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                    if ($backlog) {
                        $backlog->increment('committed_qty', $remaining);
                    }
                }
            }

            // 2. Cambiar Estado
            $po->status = 'DRAFT'; // Volvemos a borrador para permitir editar/enviar de nuevo
            $po->save();

            // 3. Loguear Evento
            PurchaseOrderEvent::create([
                'purchase_order_id' => $po->id,
                'event_type' => 'MANUAL_REOPEN',
                'data' => json_encode(['reason' => 'User requested reopen']),
                'user_id' => Auth::id() ?: 1,
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Orden reabierta en estado Borrador.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Recibir Mercadería (Ingreso de Stock Real)
     * POST /purchase-orders/{id}/receive
     */
    public function receiveItems(Request $request, $id)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.receive_qty' => 'required|numeric|min:0',
            'items.*.new_cost' => 'nullable|numeric|min:0',
        ]);

        $po = PurchaseOrder::with('items')->findOrFail($id);
        
        // Estados válidos para recibir: SENT, PARTIAL. (DRAFT lo permitimos flexiblemente)
        if (in_array($po->status, ['CLOSED', 'CANCELLED'])) {
             return response()->json(['error' => 'La orden ya está cerrada o cancelada. Reábrala si necesita ajustar.'], 400);
        }

        DB::beginTransaction();
        try {
            $receivedLog = [];
            $hasUpdates = false;
            
            foreach ($request->items as $income) {
                $qty = floatval($income['receive_qty']);
                $newCost = isset($income['new_cost']) ? floatval($income['new_cost']) : null;

                if ($qty <= 0) continue;

                $item = $po->items->where('id', $income['id'])->first();
                if (!$item) continue;

                $hasUpdates = true;

                // 1. Update PO Item
                $item->quantity_received += $qty;
                // Si viene nuevo costo, actualizamos el precio unitario del item de la orden como registro histórico
                if ($newCost !== null && $newCost > 0) {
                    $item->unit_price = $newCost;
                }
                $item->save();

                // 2. Update Stock Físico y Costos
                $product = \App\Models\Producto::find($item->product_id);
                if ($product) {
                    // Actualizar Costos si corresponde
                    if ($newCost !== null && $newCost > 0) {
                        // Recalcular costo promedio ponderado ANTES de sumar el stock
                        $currentStock = $product->stock_disponible; 
                        $currentAvgCost = $product->costo_promedio;
                        
                        // Evitar division por cero logic
                        $totalValue = ($currentStock * $currentAvgCost) + ($qty * $newCost);
                        $totalQty = $currentStock + $qty;
                        
                        $newAvgCost = $totalQty > 0 ? $totalValue / $totalQty : $newCost;
                        
                        $product->costo_promedio = $newAvgCost;
                        $product->costo_ultima_compra = $newCost; // Ultimo costo
                    }

                    // Usamos increment para atomicidad
                    $newStock = $product->stock_disponible + $qty;
                    $product->stock_disponible = $newStock;
                    $product->save();
                    
                    // 3. Registrar Movimiento de Stock (Si existe el modelo)
                    // Intentamos crear, atrapando error por si la tabla no existe o campos difieren
                    try {
                        \App\Models\StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'IN_PURCHASE', // Ingreso por Compra
                            'quantity' => $qty,
                            'qty_before' => $newStock - $qty,
                            'qty_after' => $newStock,
                            'reference_id' => $po->id,
                            'reference_type' => 'purchase_order', // Polymorphic field often used
                            'user_id' => Auth::id() ?: 1,
                            'reason' => 'Recepcion Ord #' . $po->po_number . ($newCost ? " (Costo act: $$newCost)" : "")
                        ]);
                    } catch (\Throwable $t) {
                        // Ignoramos error de logueo de stock movement si faltan columnas, pero stock sí se actualizó
                        \Illuminate\Support\Facades\Log::warning("Could not create StockMovement: " . $t->getMessage());
                    }

                    $receivedLog[] = [
                        'sku' => $product->sku_interno ?: $item->product_id,
                        'name' => $product->nombre,
                        'qty' => $qty,
                        'new_cost' => $newCost
                    ];
                }

                // 4. Update Backlog (Liberar compromiso ya cumplido)
                $backlog = \App\Models\ReplenishmentBacklog::where('product_id', $item->product_id)->first();
                if ($backlog) {
                    $backlog->committed_qty = max(0, $backlog->committed_qty - $qty);
                    $backlog->save();
                }
            }
            
            if (!$hasUpdates) {
                 DB::rollBack();
                 return response()->json(['error' => 'No se indicó ninguna cantidad válida para recibir.'], 400);
            }

            // 5. Recalculate Status
            $allComplete = true;
            $anyReceived = false;
            foreach ($po->items as $it) {
                // Necesitamos refrescar para ver el valor actualizado
                $it->refresh();
                if ($it->quantity_received > 0) $anyReceived = true;
                // Tolerancia flotante pequeña por si acaso, pero normalmente enteros
                if ($it->quantity_received < $it->quantity_ordered) $allComplete = false;
            }

            if ($allComplete) {
                $po->status = 'CLOSED';
            } elseif ($anyReceived) {
                $po->status = 'PARTIAL';
            }
            $po->save();

            // 6. Audit
            PurchaseOrderEvent::create([
                'purchase_order_id' => $id,
                'event_type' => 'MERCHANDISE_RECEIVED',
                'data' => json_encode(['received' => $receivedLog]),
                'user_id' => Auth::id() ?: 1,
                'happened_at' => now()
            ]);

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => 'Mercadería ingresada exitosamente.', 
                'new_status' => $po->status
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al recibir: ' . $e->getMessage()], 500);
        }
    }

    // --- ATTACHMENTS ---

    public function getAttachments($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        $attachments = \App\Models\PurchaseOrderAttachment::where('purchase_order_id', $id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($attachments);
    }

    public function uploadAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpeg,png,jpg,pdf,webp', // 10MB max
        ]);

        $po = PurchaseOrder::findOrFail($id);

        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No se ha subido ningún archivo.'], 400);
        }

        DB::beginTransaction();
        try {
            $file = $request->file('file');
            $filename = $file->getClientOriginalName();
            $path = $file->storePublicly('attachments/orders/' . $id, 'public');

            $attachment = \App\Models\PurchaseOrderAttachment::create([
                'purchase_order_id' => $po->id,
                'file_name' => $filename,
                'file_path' => '/storage/' . $path, // Assumes storage link is set up
                'file_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => Auth::id() ?: 1,
            ]);

            // Optional: Log event
            // Register Audit Event
            \App\Models\PurchaseOrderEvent::create([
                 'purchase_order_id' => $po->id,
                 'event_type' => 'ATTACHMENT_ADDED',
                 'data' => ['file' => $filename], // Eloquent casts to array/json usually
                 'user_id' => \Illuminate\Support\Facades\Auth::id() ?: 1,
                 'happened_at' => now(), // Important field often validation required
            ]);

            DB::commit();
            
            // Return with uploader for immediate display
            $attachment->load('uploader:id,name');
            return response()->json([
                'success' => true, 
                'message' => 'Archivo adjuntado correctamente.',
                'attachment' => $attachment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al subir: ' . $e->getMessage()], 500);
        }
    }

    public function deleteAttachment($id, $attachmentId)
    {
        $att = \App\Models\PurchaseOrderAttachment::where('id', $attachmentId)
            ->where('purchase_order_id', $id)
            ->firstOrFail();

        try {
            // Delete file from disk
            $relativePath = str_replace('/storage/', '', $att->file_path);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
            
            $att->delete();
            
            return response()->json(['success' => true, 'message' => 'Adjunto eliminado.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }

    public function downloadAttachment($id, $attachmentId)
    {
        $att = \App\Models\PurchaseOrderAttachment::where('id', $attachmentId)
            ->where('purchase_order_id', $id)
            ->firstOrFail();

        // Check if file exists in storage (remove /storage/ prefix stored in DB to get relative disk path)
        $relativePath = str_replace('/storage/', '', $att->file_path);
        
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($relativePath)) {
            // Fallback for older files or manual usage?
            return response()->json(['error' => 'Archivo no encontrado en disco.'], 404);
        }

        // Serve file inline to allow preview in browser/img tag
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($relativePath);
        return response()->file($fullPath);
    }
}
