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

            // Fix: Definir poNumber antes de usarlo
            $poNumber = 'OC-' . date('Y') . '-' . str_pad((string) (PurchaseOrder::count() + 1), 6, '0', STR_PAD_LEFT);
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
                    $unitPrice = $product->costo_reposicion > 0 ? $product->costo_reposicion : ($product->costo_promedio ?? 0);
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
            
            // Actualizar total
            $po->total_amount = $totalAmount;
            $po->save();
            
            \Illuminate\Support\Facades\Log::info("Step 5: Updating Run and Events");
            // Link to Run
            if($req->replenishment_run_id) {
                $run = \App\Models\ReplenishmentRun::find($req->replenishment_run_id);
                if($run) {
                    $run->purchase_order_id = $po->id;
                    $run->save();
                }
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
    public function sendEmail($id)
    {
         // Stub Email
         $po = PurchaseOrder::findOrFail($id);
         $po->status = 'SENT';
         $po->save();
         
         PurchaseOrderEvent::create([
            'purchase_order_id' => $id,
            'event_type' => 'EMAIL_SENT',
            'data' => json_encode(['to' => 'provider@example.com']),
            'user_id' => Auth::id() ? Auth::id() : 1,
            'happened_at' => date('Y-m-d H:i:s')
        ]);
        
        return response()->json(['success' => true, 'message' => 'Email enviado (Simulado)']);
    }
}
