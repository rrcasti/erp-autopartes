<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Proveedor extends Model
{
    use HasFactory;

    protected $table = 'proveedores';

    protected $fillable = [
        'codigo',
        'razon_social',
        'nombre_fantasia',
        'cuit_cuil',
        'telefono',
        'telefono_alt',
        'whatsapp',
        'email',
        'web',
        'direccion',
        'localidad',
        'provincia',
        'codigo_postal',
        'condicion_iva',
        'forma_pago_habitual',
        'plazo_pago_dias',
        'observaciones',
        'activo',
        'integration_source',
        'external_id',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    // Relación: un proveedor puede vender muchos productos (vía tabla puente)
    public function productosProveedores()
    {
        return $this->hasMany(ProductoProveedor::class, 'proveedor_id');
    }
}
