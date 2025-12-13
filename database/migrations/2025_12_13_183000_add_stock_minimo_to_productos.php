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
        Schema::table('productos', function (Blueprint $table) {
            if (!Schema::hasColumn('productos', 'stock_minimo')) {
                $table->decimal('stock_minimo', 12, 2)->default(0)->after('stock_controlado');
            }
            // Aseguramos costo por si acaso
            if (!Schema::hasColumn('productos', 'precio_costo')) {
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
