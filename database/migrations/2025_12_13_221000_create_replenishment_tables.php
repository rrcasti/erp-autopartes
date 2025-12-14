<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla de Backlog Acumulado
        Schema::create('replenishment_backlog', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('supplier_id')->nullable(); // Proveedor preferido para esta repo
            
            $table->integer('pending_qty')->default(0); // Cantidad acumulada pendiente de pedir
            $table->timestamp('last_activity_at')->useCurrent();
            
            $table->timestamps();
            
            // Relaciones
            $table->foreign('product_id')->references('id')->on('productos')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('proveedores')->onDelete('set null');
            
            // Unicidad: 1 fila por producto+proveedor
            $table->unique(['product_id', 'supplier_id'], 'replenishment_bk_unique');
        });

        // 2. Tabla de Eventos (Auditoría de por qué subió o bajó)
        Schema::create('replenishment_events', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('backlog_id');
            
            $table->string('event_type'); // 'SALE_CONFIRMED', 'PURCHASE_RECEIVED', 'MANUAL_ADJUST', 'REQ_GENERATED'
            $table->integer('qty_delta'); // +3, -5, etc.
            
            // Polimorfismo manual simple para referencia
            $table->string('reference_type')->nullable(); // 'sale', 'purchase_order', 'requisition'
            $table->unsignedBigInteger('reference_id')->nullable();
            
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('happened_at')->useCurrent();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->foreign('backlog_id')->references('id')->on('replenishment_backlog')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('replenishment_events');
        Schema::dropIfExists('replenishment_backlog');
    }
};
