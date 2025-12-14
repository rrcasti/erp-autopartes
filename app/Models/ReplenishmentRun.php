<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReplenishmentRun extends Model
{
    protected $table = 'replenishment_runs';

    protected $fillable = [
        'run_type', 'status', 'from_at', 'to_at',
        'generated_by', 'generated_at',
        'closed_by', 'closed_at',
        'requisition_id', 'purchase_order_id', // editado
        'suppliers_count', 'items_count', 'notes'
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo('App\Models\PurchaseOrder', 'purchase_order_id');
    }

    protected $casts = [
        'from_at' => 'datetime',
        'to_at' => 'datetime',
        'generated_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function generatedBy()
    {
        return $this->belongsTo('App\Models\User', 'generated_by');
    }

    public function requisition()
    {
        return $this->belongsTo('App\Models\PurchaseRequisition', 'requisition_id');
    }
}
