<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePurchaseOrderSystem extends Migration
{
    public function up()
    {
        // 1. Agregar committed_qty a replenishment_backlog
        if (Schema::hasTable('replenishment_backlog')) {
            Schema::table('replenishment_backlog', function (Blueprint $table) {
                if (!Schema::hasColumn('replenishment_backlog', 'committed_qty')) {
                    $table->decimal('committed_qty', 10, 2)->default(0)->after('pending_qty');
                }
            });
        }

        // 2. Agregar purchase_order_id a replenishment_runs
        if (Schema::hasTable('replenishment_runs')) {
            Schema::table('replenishment_runs', function (Blueprint $table) {
                if (!Schema::hasColumn('replenishment_runs', 'purchase_order_id')) {
                    $table->unsignedBigInteger('purchase_order_id')->nullable()->after('requisition_id');
                    $table->index('purchase_order_id');
                }
            });
        }

        // 3. Crear tabla purchase_orders
        if (!Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->string('po_number', 50)->unique();
                $table->unsignedBigInteger('supplier_id')->nullable();
                $table->unsignedBigInteger('requisition_id')->nullable();
                $table->string('status', 20)->default('DRAFT');
                $table->date('issued_at')->nullable();
                $table->date('expected_at')->nullable();
                $table->text('notes')->nullable();
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->string('currency', 3)->default('ARS');
                $table->unsignedBigInteger('created_by');
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->index(['supplier_id', 'status']);
            });
        }

        // 4. Crear tabla purchase_order_items
        if (!Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('purchase_order_id');
                $table->unsignedBigInteger('product_id');
                $table->string('supplier_sku', 50)->nullable();
                $table->decimal('quantity_ordered', 10, 2);
                $table->decimal('quantity_received', 10, 2)->default(0);
                $table->decimal('unit_price', 12, 2)->default(0);
                $table->decimal('tax_rate', 5, 2)->default(0);
                $table->timestamps();

                $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
                $table->index('product_id');
            });
        }

        // 5. Crear tabla purchase_order_events (Auditoría)
        if (!Schema::hasTable('purchase_order_events')) {
            Schema::create('purchase_order_events', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('purchase_order_id');
                $table->string('event_type', 50);
                $table->text('data')->nullable(); // Compatibilidad MySQL viejo (antes json)
                $table->unsignedBigInteger('user_id');
                $table->timestamp('happened_at')->useCurrent();
                
                $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('purchase_order_events');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        
        if (Schema::hasColumn('replenishment_runs', 'purchase_order_id')) {
            Schema::table('replenishment_runs', function (Blueprint $table) {
                $table->dropColumn('purchase_order_id');
            });
        }
        
        if (Schema::hasColumn('replenishment_backlog', 'committed_qty')) {
            Schema::table('replenishment_backlog', function (Blueprint $table) {
                $table->dropColumn('committed_qty');
            });
        }
    }
}
