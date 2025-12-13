<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FamiliaProducto extends Model
{
    use HasFactory;

    protected $table = 'familias_productos';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'icono',
        'color_hex',
        'orden',
        'mostrar_en_web',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'mostrar_en_web' => 'boolean',
        'activo'         => 'boolean',
    ];

    public function subfamilias()
    {
        return $this->hasMany(SubfamiliaProducto::class, 'familia_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'familia_id');
    }
}
