<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subfamilias_productos', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('familia_id');

            $table->string('nombre', 100);
            $table->string('slug', 120)->unique();

            $table->text('descripcion')->nullable();
            $table->smallInteger('orden')->default(0);

            $table->boolean('mostrar_en_web')->default(true);
            $table->boolean('activo')->default(true);

            $table->longText('metadata')->nullable();

            $table->timestamps();

            // FK simple (sin cascade para no borrar productos por error)
            $table->foreign('familia_id')
                  ->references('id')
                  ->on('familias_productos');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subfamilias_productos');
    }
};
