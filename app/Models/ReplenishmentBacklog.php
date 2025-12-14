<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReplenishmentBacklog extends Model
{
    protected $table = 'replenishment_backlog';

    protected $fillable = [
        'product_id',
        'supplier_id',
        'pending_qty',
        'committed_qty', // Nuevo
        'last_activity_at',
    ];

    protected $casts = [
        'last_activity_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo('App\Models\Producto', 'product_id');
    }

    public function supplier()
    {
        return $this->belongsTo('App\Models\Proveedor', 'supplier_id');
    }
}
