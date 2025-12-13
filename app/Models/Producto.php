<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Vehiculo;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';

    protected $fillable = [
        'sku_interno',
        'codigo_barra',
        'nombre',
        'descripcion_corta',
        'descripcion_larga',
        'familia_id',
        'subfamilia_id',
        'marca_id',
        'proveedor_id', // Nuevo campo
        'unidad_medida',
        'origen',
        'slug',
        'estado',
        'visible_web',
        'destacado_web',
        'precio_lista',
        'precio_oferta',
        'moneda',
        'alicuota_iva',
        'costo_promedio',
        'costo_ultima_compra',
        'peso_kg',
        'alto_cm',
        'ancho_cm',
        'largo_cm',
        'imagen_principal',
        'galeria_imagenes',
        'video_url',
        'seo_title',
        'seo_description',
        'tags',
        'stock_controlado',
        'stock_disponible',
        'es_kit',
        'activo',
        'integration_source',
        'external_id',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'visible_web'         => 'boolean',
        'destacado_web'       => 'boolean',
        'stock_controlado'    => 'boolean',
        'stock_disponible'    => 'decimal:2',
        'es_kit'              => 'boolean',
        'activo'              => 'boolean',
        'precio_lista'        => 'decimal:2',
        'precio_oferta'       => 'decimal:2',
        'costo_promedio'      => 'decimal:4',
        'costo_ultima_compra' => 'decimal:4',
        'last_synced_at'      => 'datetime',
    ];

    /**
     * Autogenerar SKU interno si viene vacío.
     */
    protected static function booted(): void
    {
        static::creating(function (Producto $producto) {
            if (empty($producto->sku_interno)) {
                $producto->sku_interno = self::generateInternalSku();
            }
        });
    }

    /**
     * Genera un SKU interno tipo RP-000001, RP-000002, etc.
     */
    public static function generateInternalSku(): string
    {
        $nextId = (self::max('id') ?? 0) + 1;

        return 'RP-' . str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }

    public function familia()
    {
        return $this->belongsTo(FamiliaProducto::class, 'familia_id');
    }

    public function subfamilia()
    {
        return $this->belongsTo(SubfamiliaProducto::class, 'subfamilia_id');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function productosProveedores()
    {
        return $this->hasMany(ProductoProveedor::class, 'producto_id');
    }

    /**
     * Vehículos compatibles (marca/modelo/años).
     * Esto usa la tabla pivote producto_vehiculo.
     */
    public function vehiculos()
{
    return $this->belongsToMany(
        Vehiculo::class,
        'producto_vehiculo',
        'producto_id',
        'vehiculo_id'
    )
    ->withTimestamps()
    ->withPivot(['observacion', 'activo']);
}

}
