<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
    echo "Verificando tabla 'productos_proveedores'...\n";

    if (!Schema::hasTable('productos_proveedores')) {
        echo "La tabla NO existe. Creandola...\n";
        
        Schema::create('productos_proveedores', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('producto_id');
            $table->unsignedBigInteger('proveedor_id');

            $table->string('sku_proveedor', 100)->nullable(); // A veces es null
            $table->string('codigo_barra_proveedor', 50)->nullable();
            $table->string('descripcion_proveedor', 255)->nullable();

            // Condiciones de compra
            $table->decimal('precio_lista', 12, 4)->nullable();
            $table->decimal('descuento_1', 5, 2)->default(0.00);
            $table->decimal('descuento_2', 5, 2)->default(0.00);
            $table->decimal('descuento_3', 5, 2)->default(0.00);
            $table->decimal('bonificacion_financiera', 5, 2)->default(0.00);

            $table->string('moneda', 3)->default('ARS');
            $table->smallInteger('plazo_pago_dias')->nullable();

            $table->boolean('es_preferido')->default(false);
            $table->boolean('activo')->default(true);

            $table->date('fecha_lista')->nullable();
            $table->date('fecha_ultima_compra')->nullable();

            $table->string('integration_source', 50)->nullable();
            $table->string('external_id', 100)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->longText('metadata')->nullable();

            $table->timestamps();

            // Índices y FKs
            // Nota: No agrego foreign keys estrictas aquí para evitar errores si las tablas padres tienen otro engine o collation.
            // Pero agrego índices.
            $table->index('producto_id');
            $table->index('proveedor_id');
            $table->index('sku_proveedor');
            
            // Unique
           // $table->unique(['proveedor_id', 'sku_proveedor'], 'uniq_prov_sku'); 
           // Comentado porque sku puede ser null multiples veces. Mejor unique compuesto solo si sku no es null, o manejarlo por app.
        });
        
        echo "EXITO: Tabla 'productos_proveedores' pivote creada.\n";
    } else {
        echo "AVISO: La tabla 'productos_proveedores' YA EXISTE.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
