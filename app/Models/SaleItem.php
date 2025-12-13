<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'producto_id',
        'producto_nombre',
        'marca_nombre',
        'codigo_barra',
        'sku',
        'cantidad',
        'precio_unitario',
        'alicuota_iva',
        'subtotal',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
}
