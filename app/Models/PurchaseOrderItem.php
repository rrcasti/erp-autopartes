<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'supplier_sku',
        'quantity_ordered',
        'quantity_received',
        'unit_price',
        'tax_rate',
    ];

    protected $casts = [
        'quantity_ordered' => 'decimal:2',
        'quantity_received' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo('App\Models\Producto');
    }

    public function order()
    {
        return $this->belongsTo('App\Models\PurchaseOrder', 'purchase_order_id');
    }
}
