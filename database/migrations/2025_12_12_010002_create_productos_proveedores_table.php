<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos_proveedores', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('producto_id');
            $table->unsignedBigInteger('proveedor_id');

            $table->string('sku_proveedor', 100);
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

            // Integración / importaciones
            $table->string('integration_source', 50)->nullable();
            $table->string('external_id', 100)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->longText('metadata')->nullable();

            $table->timestamps();

            // Índices y FKs
            $table->foreign('producto_id')->references('id')->on('productos');
            $table->foreign('proveedor_id')->references('id')->on('proveedores');

            $table->index('sku_proveedor');
            $table->index('producto_id');
            $table->index('proveedor_id');

            $table->unique(['proveedor_id', 'sku_proveedor'], 'uniq_proveedor_sku');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos_proveedores');
    }
};
