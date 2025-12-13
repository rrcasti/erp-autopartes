<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehiculo extends Model
{
    use HasFactory;

    protected $table = 'vehiculos';

    protected $fillable = [
        'vehiculo_marca_id',
        'vehiculo_modelo_id',
        'anio_desde',
        'anio_hasta',
        'motor',
        'version',
        'codigo_interno',
        'activo',
    ];

    protected $casts = [
        'anio_desde' => 'integer',
        'anio_hasta' => 'integer',
        'activo'     => 'boolean',
    ];

    public function marca()
    {
        return $this->belongsTo(VehiculoMarca::class, 'vehiculo_marca_id');
    }

    public function modelo()
    {
        return $this->belongsTo(VehiculoModelo::class, 'vehiculo_modelo_id');
    }

    public function productos()
    {
        return $this->belongsToMany(Producto::class, 'producto_vehiculo')
            ->withPivot(['observacion', 'activo'])
            ->withTimestamps();
    }
}
