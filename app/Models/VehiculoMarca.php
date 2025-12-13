<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehiculoMarca extends Model
{
    use HasFactory;

    protected $table = 'vehiculo_marcas';

    protected $fillable = [
        'nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function modelos()
    {
        return $this->hasMany(VehiculoModelo::class, 'vehiculo_marca_id');
    }

    public function vehiculos()
    {
        return $this->hasMany(Vehiculo::class, 'vehiculo_marca_id');
    }
}
