<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_vehiculo', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('producto_id');
            $table->unsignedBigInteger('vehiculo_id');

            $table->string('observacion', 255)->nullable(); // "Solo lado derecho", "eje trasero", etc.
            $table->boolean('activo')->default(true);

            $table->timestamps();

            $table->foreign('producto_id')
                ->references('id')->on('productos')
                ->onDelete('cascade');

            $table->foreign('vehiculo_id')
                ->references('id')->on('vehiculos')
                ->onDelete('cascade');

            $table->unique(['producto_id', 'vehiculo_id'], 'producto_vehiculo_unq');
            $table->index(['vehiculo_id', 'producto_id'], 'producto_vehiculo_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_vehiculo');
    }
};
