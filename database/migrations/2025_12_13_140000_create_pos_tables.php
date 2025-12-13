<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Stock Movements (Kardex)
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('variation_id')->nullable(); // Si usas variaciones tabla separada
            // $table->foreignId('deposito_id')->nullable(); // Futuro
            $table->foreignId('user_id')->constrained();
            
            $table->string('type', 50); // 'sale', 'purchase', 'adjustment_pos', 'adjustment_neg', 'return'
            $table->decimal('quantity', 10, 2); // Negativo para salidas, positivo para entradas
            
            // Referencia polimórfica o directa (usaremos directa a sale por ahora para simplicidad mostrador)
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reference_description')->nullable(); // "Venta #123"
            
            $table->timestamps();
        });

        // 2. Cajas Diarias (Sessions)
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained(); // Cajero
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            
            $table->decimal('start_balance', 10, 2)->default(0);
            $table->decimal('end_balance', 10, 2)->nullable();
            $table->decimal('real_balance', 10, 2)->nullable(); // Lo que contó al cerrar
            
            $table->string('status', 20)->default('open'); // open, closed
            $table->timestamps();
        });

        // 3. Movimientos de Caja
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_register_id')->constrained()->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null'); // Vinculo venta
            
            $table->string('type', 20); // income, expense
            $table->decimal('amount', 10, 2);
            $table->string('payment_method', 50); // efectivo, tarjeta, etc.
            $table->string('description')->nullable();
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_registers');
        Schema::dropIfExists('stock_movements');
    }
};
