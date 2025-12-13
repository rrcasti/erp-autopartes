<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductoProveedor extends Model
{
    use HasFactory;

    protected $table = 'productos_proveedores';

    protected $fillable = [
        'producto_id',
        'proveedor_id',
        'sku_proveedor',
        'codigo_barra_proveedor',
        'descripcion_proveedor',
        'precio_lista',
        'descuento_1',
        'descuento_2',
        'descuento_3',
        'bonificacion_financiera',
        'moneda',
        'plazo_pago_dias',
        'es_preferido',
        'activo',
        'fecha_lista',
        'fecha_ultima_compra',
        'integration_source',
        'external_id',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'precio_lista'          => 'decimal:4',
        'descuento_1'           => 'decimal:2',
        'descuento_2'           => 'decimal:2',
        'descuento_3'           => 'decimal:2',
        'bonificacion_financiera' => 'decimal:2',
        'es_preferido'          => 'boolean',
        'activo'                => 'boolean',
        'fecha_lista'           => 'date',
        'fecha_ultima_compra'   => 'date',
        'last_synced_at'        => 'datetime',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }
}
