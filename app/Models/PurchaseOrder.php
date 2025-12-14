<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'po_number',
        'supplier_id',
        'requisition_id',
        'status', // DRAFT, SENT, RECEIVED, CANCELLED
        'issued_at',
        'expected_at',
        'notes',
        'total_amount',
        'currency',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'issued_at' => 'date',
        'expected_at' => 'date',
        'total_amount' => 'decimal:2',
    ];

    // Relaciones
    public function items()
    {
        return $this->hasMany('App\Models\PurchaseOrderItem');
    }

    public function events()
    {
        return $this->hasMany('App\Models\PurchaseOrderEvent')->orderBy('id', 'desc');
    }

    public function supplier()
    {
        return $this->belongsTo('App\Models\Proveedor', 'supplier_id');
    }

    public function creator()
    {
        return $this->belongsTo('App\Models\User', 'created_by');
    }

    public function requisition()
    {
        return $this->belongsTo('App\Models\PurchaseRequisition');
    }
}
