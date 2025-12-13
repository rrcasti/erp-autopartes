<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequisitionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_requisition_id',
        'supplier_id',
        'product_id',
        'variation_id',
        'suggested_qty',
        'reason',
        'stock_current',
        'avg_daily_sales',
    ];

    public function product()
    {
        return $this->belongsTo(Producto::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Proveedor::class);
    }
}
