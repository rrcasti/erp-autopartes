<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('replenishment_runs', function (Blueprint $table) {
            $table->id();
            
            $table->string('run_type', 50)->default('AUTO_REPLENISHMENT'); // 'AUTO_REPLENISHMENT'
            $table->string('status', 20)->default('DRAFT'); // 'DRAFT', 'CLOSED', 'CANCELLED'
            
            $table->dateTime('from_at');
            $table->dateTime('to_at');
            
            $table->unsignedBigInteger('generated_by');
            $table->timestamp('generated_at')->useCurrent();
            
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->unsignedBigInteger('requisition_id')->nullable();
            // $table->unsignedBigInteger('purchase_order_id')->nullable(); // Futuro
            
            $table->integer('suppliers_count')->default(0);
            $table->integer('items_count')->default(0);
            
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indices
            $table->index(['run_type', 'status', 'generated_at']);
            $table->index('requisition_id');
            // FK user
            // $table->foreign('generated_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('replenishment_runs');
    }
};
