
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
                $req = \App\Models\PurchaseRequisition::find($po->requisition_id);
                if ($req) {
                    // Si queremos que se pueda volver a procesar
                    // $req->status = 'Generated'; // O el estado previo. 
                    // En este sistema basic, liberamos el link en ReplenishmentRun mas abajo y la req queda suelta.
                }
            }

            // 3. Desvincular de Reposición (si existe)
            $run = \App\Models\ReplenishmentRun::where('purchase_order_id', $po->id)->first();
            if($run) {
                $run->purchase_order_id = null;
                $run->save();
            }

            // 4. Borrar hijos
            $po->items()->delete();
            $po->events()->delete();
            
            // 5. Borrar Orden
            $po->delete();

            DB::commit();
            return response()->json(['message' => 'Orden eliminada correctamente.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }
