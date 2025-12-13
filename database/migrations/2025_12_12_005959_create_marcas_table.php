<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marcas', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('nombre', 100);
            $table->string('slug', 120)->unique();

            $table->text('descripcion')->nullable();
            $table->string('web_url', 255)->nullable();
            $table->string('logo_path', 255)->nullable();

            $table->smallInteger('orden')->default(0);
            $table->boolean('mostrar_en_web')->default(true);
            $table->boolean('activo')->default(true);

            $table->longText('metadata')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marcas');
    }
};
