<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'cash_register_id',
        'sale_id',
        'type',
        'amount',
        'payment_method',
        'description',
    ];

    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
