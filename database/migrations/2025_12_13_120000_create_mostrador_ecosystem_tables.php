<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Clientes (Customers)
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('nombre');
                $table->string('email')->nullable();
                $table->string('direccion')->nullable();
                $table->string('celular')->nullable()->index(); // Clave para búsqueda rápida
                $table->string('telefono_fijo')->nullable();
                $table->string('cuit')->nullable();
                $table->string('tipo_iva')->default('CONSUMIDOR_FINAL');
                $table->text('notas')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 2. Borradores de Espacio de Trabajo (Workspace Drafts)
        if (!Schema::hasTable('workspace_drafts')) {
            Schema::create('workspace_drafts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('type', 50); // 'sale', 'quote', 'cash', 'refund', 'order'
                $table->string('title')->nullable();
                $table->longText('payload')->nullable(); // JSON en string (MySQL legacy fix)
                $table->string('status', 20)->default('active'); // active, finalized, discarded
                $table->timestamp('last_saved_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Ventas (Sales) - Cabecera
        if (!Schema::hasTable('sales')) {
            Schema::create('sales', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained(); // Vendedor
                $table->foreignId('customer_id')->nullable()->constrained();
                
                $table->dateTime('fecha');
                $table->decimal('total_sin_iva', 12, 2)->default(0);
                $table->decimal('total_iva', 12, 2)->default(0);
                $table->decimal('total_final', 12, 2)->default(0);
                
                $table->string('estado', 20)->default('completed'); // completed, cancelled
                $table->string('medio_pago', 50)->nullable(); // efectivo, debito, credito, etc.
                
                $table->text('observaciones')->nullable();
                $table->timestamps();
            });
        }

        // 4. Items de Venta (Sale Items)
        if (!Schema::hasTable('sale_items')) {
            Schema::create('sale_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('sale_id')->constrained()->onDelete('cascade');
                $table->foreignId('producto_id')->nullable()->constrained(); // Nullable si se borra el producto base
                
                // Snapshots (Por si cambia el producto original)
                $table->string('producto_nombre');
                $table->string('marca_nombre')->nullable(); // La variación elegida
                $table->string('codigo_barra')->nullable();
                $table->string('sku')->nullable();

                $table->decimal('cantidad', 8, 2);
                $table->decimal('precio_unitario', 12, 2); // Precio al momento de venta
                $table->decimal('alicuota_iva', 5, 2)->default(21.00);
                $table->decimal('subtotal', 12, 2);

                $table->timestamps();
            });
        }

        // 5. Presupuestos (Quotes)
        if (!Schema::hasTable('quotes')) {
            Schema::create('quotes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained();
                $table->foreignId('customer_id')->nullable()->constrained();
                
                $table->dateTime('fecha');
                $table->dateTime('valido_hasta')->nullable();
                
                $table->decimal('total_sin_iva', 12, 2)->default(0);
                $table->decimal('total_iva', 12, 2)->default(0);
                $table->decimal('total_final', 12, 2)->default(0);
                
                $table->string('estado', 20)->default('draft'); // draft, sent, accepted, rejected
                $table->string('pdf_path')->nullable(); // Ruta al archivo generado
                
                $table->text('notas')->nullable();
                $table->timestamps();
            });
        }

        // 6. Items de Presupuesto (Quote Items)
        if (!Schema::hasTable('quote_items')) {
            Schema::create('quote_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('quote_id')->constrained()->onDelete('cascade');
                $table->foreignId('producto_id')->nullable()->constrained();
                
                // Snapshots
                $table->string('producto_nombre');
                $table->string('marca_nombre')->nullable();
                $table->string('codigo_barra')->nullable();
                $table->string('sku')->nullable();

                $table->decimal('cantidad', 8, 2);
                $table->decimal('precio_unitario', 12, 2);
                $table->decimal('alicuota_iva', 5, 2)->default(21.00);
                $table->decimal('subtotal', 12, 2);

                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('workspace_drafts');
        Schema::dropIfExists('customers');
    }
};
