<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_id',
        'fecha',
        'valido_hasta',
        'total_sin_iva',
        'total_iva',
        'total_final',
        'estado',
        'pdf_path',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'valido_hasta' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
