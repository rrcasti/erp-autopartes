<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuoteItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_id',
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

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
}
