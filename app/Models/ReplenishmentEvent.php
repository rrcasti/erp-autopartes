<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReplenishmentEvent extends Model
{
    protected $table = 'replenishment_events';

    protected $fillable = [
        'backlog_id',
        'event_type', // SALE_CONFIRMED, PURCHASE_RECEIVED
        'qty_delta',
        'reference_type',
        'reference_id',
        'user_id',
        'happened_at',
        'notes',
    ];

    protected $casts = [
        'happened_at' => 'datetime',
    ];

    public function backlog()
    {
        return $this->belongsTo('App\Models\ReplenishmentBacklog', 'backlog_id');
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'user_id');
    }
}
