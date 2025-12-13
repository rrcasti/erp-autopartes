<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehiculo_modelos', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('vehiculo_marca_id');
            $table->string('nombre', 120);
            $table->boolean('activo')->default(true);

            $table->timestamps();

            $table->foreign('vehiculo_marca_id')
                ->references('id')->on('vehiculo_marcas')
                ->onDelete('cascade');

            $table->unique(['vehiculo_marca_id', 'nombre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehiculo_modelos');
    }
};
