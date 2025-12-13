<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Agregando columna 'proveedor_id' (RAW SQL)...\n";
    
    // SQL Directo para evitar errores de Docrine/Schema en MySQL viejos
    try {
        DB::statement("ALTER TABLE productos ADD COLUMN proveedor_id BIGINT UNSIGNED NULL AFTER marca_id");
        echo "Columna agregada.\n";
    } catch (\Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
             echo "La columna ya existe (ignorado).\n";
        } else {
             throw $e;
        }
    }

    try {
        DB::statement("CREATE INDEX productos_proveedor_id_index ON productos(proveedor_id)");
        echo "Indice creado.\n";
    } catch (\Exception $e) {
         // Indice duplicado suele tener otro mensaje, ignoramos por ahora si falla levemente
         echo "Aviso indice: " . $e->getMessage() . "\n";
    }

    echo "EXITO TOTAL.\n";

} catch (\Exception $e) {
    echo "ERROR FATAL: " . $e->getMessage() . "\n";
}
