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
        'user_id',
        'type',
        'quantity',
        'sale_id',
        'reference_description',
    ];

    public function product()
    {
        return $this->belongsTo(Producto::class);
    }
}
