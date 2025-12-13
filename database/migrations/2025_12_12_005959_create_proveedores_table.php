<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 50)->nullable();
            $table->string('razon_social', 255);
            $table->string('nombre_fantasia', 255)->nullable();
            $table->string('cuit_cuil', 20)->nullable();
            $table->string('condicion_iva', 50)->nullable(); // RI, Monotributo, etc.

            // Contacto
            $table->string('telefono', 50)->nullable();
            $table->string('telefono_alt', 50)->nullable();
            $table->string('whatsapp', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('web', 255)->nullable();

            // Dirección
            $table->string('direccion', 255)->nullable();
            $table->string('localidad', 100)->nullable();
            $table->string('provincia', 100)->nullable();
            $table->string('codigo_postal', 20)->nullable();

            // Comercial
            $table->string('forma_pago_habitual', 100)->nullable();
            $table->smallInteger('plazo_pago_dias')->nullable();
            $table->text('observaciones')->nullable();

            $table->boolean('activo')->default(true);

            // Integración
            $table->string('integration_source', 50)->nullable();
            $table->string('external_id', 100)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->longText('metadata')->nullable();

            $table->timestamps();
            
            $table->index('razon_social');
            $table->index('cuit_cuil');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
