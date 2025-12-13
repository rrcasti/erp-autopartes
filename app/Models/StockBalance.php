<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variation_id',
        'warehouse_id',
        'on_hand',
        'reserved',
    ];

    protected $casts = [
        'on_hand' => 'decimal:2',
        'reserved' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Producto::class);
    }
}
