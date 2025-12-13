<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehiculos', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('vehiculo_marca_id');
            $table->unsignedBigInteger('vehiculo_modelo_id');

            $table->smallInteger('anio_desde')->nullable();
            $table->smallInteger('anio_hasta')->nullable();

            $table->string('motor', 100)->nullable();   // 1.6, 2.0 TDCi, etc.
            $table->string('version', 120)->nullable(); // Trend, Titanium, 4x4, etc.

            $table->string('codigo_interno', 100)->nullable(); // por si después querés códigos propios
            $table->boolean('activo')->default(true);

            $table->timestamps();

            $table->foreign('vehiculo_marca_id')
                ->references('id')->on('vehiculo_marcas')
                ->onDelete('cascade');

            $table->foreign('vehiculo_modelo_id')
                ->references('id')->on('vehiculo_modelos')
                ->onDelete('cascade');

            // Para evitar duplicados exactos
            $table->unique([
                'vehiculo_marca_id',
                'vehiculo_modelo_id',
                'anio_desde',
                'anio_hasta',
                'motor',
                'version',
            ], 'vehiculos_unq_def');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehiculos');
    }
};
