<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('sku_interno', 50)->unique();
            $table->string('codigo_barra', 50)->nullable();

            $table->string('nombre', 200);
            $table->string('descripcion_corta', 255)->nullable();
            $table->text('descripcion_larga')->nullable();

            $table->unsignedBigInteger('familia_id')->nullable();
            $table->unsignedBigInteger('subfamilia_id')->nullable();
            $table->unsignedBigInteger('marca_id')->nullable();

            $table->string('unidad_medida', 20)->default('unidad');
            $table->string('origen', 20)->nullable();

            $table->string('slug', 220)->unique();

            $table->string('estado', 20)->default('activo'); // activo, borrador, archivado
            $table->boolean('visible_web')->default(false);
            $table->boolean('destacado_web')->default(false);

            // Precios de venta base (pensando también en web)
            $table->decimal('precio_lista', 12, 2)->nullable();
            $table->decimal('precio_oferta', 12, 2)->nullable();
            $table->string('moneda', 3)->default('ARS');
            $table->decimal('alicuota_iva', 5, 2)->default(21.00);

            // Costos internos
            $table->decimal('costo_promedio', 12, 4)->nullable();
            $table->decimal('costo_ultima_compra', 12, 4)->nullable();

            // Datos físicos
            $table->decimal('peso_kg', 8, 3)->nullable();
            $table->decimal('alto_cm', 8, 2)->nullable();
            $table->decimal('ancho_cm', 8, 2)->nullable();
            $table->decimal('largo_cm', 8, 2)->nullable();

            // Contenido web
            $table->string('imagen_principal', 255)->nullable();
            $table->longText('galeria_imagenes')->nullable(); // JSON array
            $table->string('video_url', 255)->nullable();

            $table->string('seo_title', 255)->nullable();
            $table->string('seo_description', 255)->nullable();
            $table->longText('tags')->nullable(); // lista o JSON

            // Control
            $table->boolean('stock_controlado')->default(true);
            $table->boolean('es_kit')->default(false);
            $table->boolean('activo')->default(true);

            // Integración / n8n
            $table->string('integration_source', 50)->nullable();
            $table->string('external_id', 100)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->longText('metadata')->nullable();

            $table->timestamps();

            // Índices y FK
            $table->index('familia_id');
            $table->index('subfamilia_id');
            $table->index('marca_id');

            $table->foreign('familia_id')->references('id')->on('familias_productos');
            $table->foreign('subfamilia_id')->references('id')->on('subfamilias_productos');
            $table->foreign('marca_id')->references('id')->on('marcas');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
