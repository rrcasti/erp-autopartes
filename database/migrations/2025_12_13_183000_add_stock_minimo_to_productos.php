<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix for SQLSTATE[42S22]: Column not found: 1054 Unknown column 'generation_expression'
        // We avoid Schema::hasColumn() which triggers Doctrine DBAL introspection
        
        $hasStockMin = count(\Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM productos LIKE 'stock_minimo'")) > 0;
        $hasPrecioCosto = count(\Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM productos LIKE 'precio_costo'")) > 0;

        Schema::table('productos', function (Blueprint $table) use ($hasStockMin, $hasPrecioCosto) {
            if (!$hasStockMin) {
                $table->decimal('stock_minimo', 12, 2)->default(0)->after('stock_controlado');
            }
            if (!$hasPrecioCosto) {
                 $table->decimal('precio_costo', 12, 2)->nullable()->after('precio_lista');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            if (Schema::hasColumn('productos', 'stock_minimo')) {
                $table->dropColumn('stock_minimo');
            }
            if (Schema::hasColumn('productos', 'precio_costo')) {
                $table->dropColumn('precio_costo');
            }
        });
    }
};
