<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

try {
    echo "Haciendo nullable la columna 'sku_proveedor'...\n";
    
    // Intento directo con SQL crudo para evitar dependencia doctrine/dbal
    DB::statement("ALTER TABLE productos_proveedores MODIFY sku_proveedor VARCHAR(100) NULL");
    
    echo "EXITO: Columna modificada.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
