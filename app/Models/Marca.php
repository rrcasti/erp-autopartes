<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Marca extends Model
{
    use HasFactory;

    protected $table = 'marcas';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'web_url',
        'logo_path',
        'orden',
        'mostrar_en_web',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'mostrar_en_web' => 'boolean',
        'activo'         => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }
}
