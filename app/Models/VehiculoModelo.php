<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehiculoModelo extends Model
{
    use HasFactory;

    protected $table = 'vehiculo_modelos';

    protected $fillable = [
        'vehiculo_marca_id',
        'nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function marca()
    {
        return $this->belongsTo(VehiculoMarca::class, 'vehiculo_marca_id');
    }

    public function vehiculos()
    {
        return $this->hasMany(Vehiculo::class, 'vehiculo_modelo_id');
    }
}
