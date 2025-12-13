<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Tabla de Balance de Stock (Saldos rápidos)
        if (!Schema::hasTable('stock_balances')) {
            Schema::create('stock_balances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('productos')->onDelete('cascade');
                $table->foreignId('variation_id')->nullable(); 
                $table->foreignId('warehouse_id')->default(1); // 1 = Central por defecto
                
                $table->decimal('on_hand', 10, 2)->default(0);
                $table->decimal('reserved', 10, 2)->default(0);
                
                $table->timestamps();
                
                $table->unique(['product_id', 'variation_id', 'warehouse_id'], 'balance_unique_idx');
            });
        }

        // 2. Mejorar Stock Movements (Recrear para evitar conflictos de drivers)
        // Evitamos hasColumn porque falla en este entorno MySQL/MariaDB específico
        Schema::dropIfExists('stock_movements');
        
        Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('productos')->onDelete('cascade');
                $table->foreignId('variation_id')->nullable(); 
                $table->foreignId('warehouse_id')->nullable(); 
                $table->foreignId('user_id')->constrained('users');
                
                $table->string('type', 50); 
                $table->decimal('quantity', 10, 2); 
                $table->decimal('qty_before', 10, 2)->default(0);
                $table->decimal('qty_after', 10, 2)->default(0);
                $table->decimal('unit_cost_snapshot', 10, 2)->nullable();
                
                $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
                $table->string('reference_description')->nullable(); 
                
                $table->timestamp('happened_at')->useCurrent();
                $table->timestamps();
        });

        // 3. Solicitudes de Compra (Motor de Reposición)
        // Eliminamos si existen para recrear limpio si la migración falló antes
        Schema::dropIfExists('purchase_requisition_items');
        Schema::dropIfExists('purchase_requisitions');
        
        Schema::create('purchase_requisitions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('created_by')->constrained('users');
                $table->string('status', 20)->default('DRAFT'); 
                $table->text('generated_params')->nullable(); // Text por seguridad
                $table->text('notes')->nullable();
                $table->timestamps();
        });

        Schema::create('purchase_requisition_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_requisition_id')->constrained()->onDelete('cascade');
                $table->foreignId('supplier_id')->nullable()->constrained('proveedors'); // Agrupación
                $table->foreignId('product_id')->constrained('productos');
                $table->foreignId('variation_id')->nullable();
                
                $table->decimal('suggested_qty', 10, 2);
                $table->string('reason')->nullable(); 
                
                $table->decimal('stock_current', 10, 2)->nullable();
                $table->decimal('avg_daily_sales', 10, 2)->nullable();
                
                $table->timestamps();
        });

        // 4. Órdenes de Compra (Simple)
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');

        Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supplier_id')->constrained('proveedors');
                $table->foreignId('created_by')->constrained('users');
                $table->string('status', 20)->default('DRAFT'); 
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('received_at')->nullable(); 
                $table->text('notes')->nullable();
                $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_order_id')->constrained()->onDelete('cascade');
                $table->foreignId('product_id')->constrained('productos');
                $table->foreignId('variation_id')->nullable();
                
                $table->decimal('qty_ordered', 10, 2);
                $table->decimal('qty_received', 10, 2)->default(0);
                $table->decimal('unit_cost', 10, 2)->nullable();
                
                $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('purchase_requisition_items');
        Schema::dropIfExists('purchase_requisitions');
        // No borramos stock_balances ni stock_movements en down para no perder datos en rollback accidental
    }
};
