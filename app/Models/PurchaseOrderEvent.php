<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderEvent extends Model
{
    use HasFactory;

    public $timestamps = false; // Solo happened_at

    protected $fillable = [
        'purchase_order_id',
        'event_type',
        'data',
        'user_id',
        'happened_at'
    ];

    protected $casts = [
        'data' => 'array',
        'happened_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo('App\Models\User');
    }
}
