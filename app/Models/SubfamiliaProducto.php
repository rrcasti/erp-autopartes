<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubfamiliaProducto extends Model
{
    use HasFactory;

    protected $table = 'subfamilias_productos';

    protected $fillable = [
        'familia_id',
        'nombre',
        'slug',
        'descripcion',
        'orden',
        'mostrar_en_web',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'mostrar_en_web' => 'boolean',
        'activo'         => 'boolean',
    ];

    public function familia()
    {
        return $this->belongsTo(FamiliaProducto::class, 'familia_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'subfamilia_id');
    }
}
