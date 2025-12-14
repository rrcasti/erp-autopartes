<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variation_id',
        'warehouse_id',
        'user_id',
        'type',
        'quantity',
        'qty_before',
        'qty_after',
        'unit_cost_snapshot',
        'sale_id',
        'reference_description',
        'happened_at',
    ];

    protected $casts = [
        'happened_at' => 'datetime',
        'qty_before' => 'decimal:2',
        'qty_after' => 'decimal:2',
        'quantity' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Producto::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
