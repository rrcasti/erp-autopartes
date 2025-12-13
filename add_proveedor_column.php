<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

try {
    echo "Agregando columna 'proveedor_id' a tabla 'productos'...\n";

    if (Schema::hasTable('productos')) {
        Schema::table('productos', function (Blueprint $table) {
            if (!Schema::hasColumn('productos', 'proveedor_id')) {
                $table->unsignedBigInteger('proveedor_id')->nullable()->after('marca_id');
                $table->index('proveedor_id');
                // No forzamos foreign key estricta para evitar bloqueos si hay datos inconsistentes, 
                // pero idealmente: $table->foreign('proveedor_id')->references('id')->on('proveedores');
            }
        });
        echo "EXITO: Columna 'proveedor_id' agregada.\n";
    } else {
        echo "ERROR: Tabla 'productos' no encontrada.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
