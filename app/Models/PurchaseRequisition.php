<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'status',
        'generated_params',
        'notes',
    ];

    protected $casts = [
        'generated_params' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseRequisitionItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function purchaseOrder()
    {
        return $this->hasOne(PurchaseOrder::class, 'requisition_id');
    }
}
