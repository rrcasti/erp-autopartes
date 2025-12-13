<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Erp\ProductoApiController;
use App\Http\Controllers\Erp\VehiculoApiController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Página pública inicial (puede quedar como está)
Route::get('/', function () {
    return view('welcome');
});

// RUTA TEMPORAL DE FIX COLUMNA (Borrar tras usar)
// RUTA TEMPORAL DE FIX COLUMNA (Borrar tras usar)
Route::get('/fix-db-column', function () {
    try {
        // Intento directo con SQL crudo (MySQL)
        // Ignoramos error si ya existe (Duplicate column name)
        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE productos 
            ADD COLUMN proveedor_id BIGINT UNSIGNED NULL AFTER marca_id,
            ADD INDEX (proveedor_id);
        ");
        return "Columna proveedor_id AGREGADA con éxito (SQL RAW).";
    } catch (\Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            return "La columna proveedor_id YA EXISTE (Detectado por error duplicate).";
        }
        return "Error SQL: " . $e->getMessage();
    }
});
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Rutas protegidas por login
Route::middleware('auth')->group(function () {

    // Perfil de usuario (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |--------------------------------------------------------------------------
    | ERP RepuestosKm21
    |--------------------------------------------------------------------------
    | Prefijo /erp para la SPA y /erp/api para los endpoints JSON.
    |--------------------------------------------------------------------------
    */

    // Vista principal ERP (React)
    Route::prefix('erp')->group(function () {



        // API del ERP
        Route::prefix('api')->group(function () {

            // --------------------
            // Productos CRUD
            // --------------------
            Route::get('/marcas-productos', [ProductoApiController::class, 'marcas']);
            Route::post('/marcas-productos', [ProductoApiController::class, 'storeMarca']); // Nuevo
            
            Route::get('/productos', [ProductoApiController::class, 'index']);
            Route::post('/productos', [ProductoApiController::class, 'store']);
            Route::get('/productos/{producto}', [ProductoApiController::class, 'show']);
            Route::put('/productos/{producto}', [ProductoApiController::class, 'update']);
            Route::delete('/productos/{producto}', [ProductoApiController::class, 'destroy']);

            // Compatibilidad producto ↔ vehículo (PENDIENTE: Crear Controller)
            // Route::get('/productos/{producto}/vehiculos', [\App\Http\Controllers\Erp\ProductoVehiculoApiController::class, 'index']);
            // Route::post('/productos/{producto}/vehiculos-sync', [\App\Http\Controllers\Erp\ProductoVehiculoApiController::class, 'sync']);
            // Búsqueda por código de barras
            Route::get(
                '/productos-barcode/{codigo}',
                [ProductoApiController::class, 'findByBarcode']
            );

            // Compatibilidad producto ↔ vehículo (Legacy method names fixes)
            // Nota: Arriba usamos ProductoVehiculoApiController, aquí abajo ProductoApiController directo.
            // Mantenemos ambos por si el frontend llama a alguno específico, aunque idealmente deberíamos unificar.
            // Por consistencia con ProductoApiController@vehiculos que añadimos en paso previo:
            // Route::get('/productos/{producto}/vehiculos', [ProductoApiController::class, 'vehiculos']); 
            // ELIMINADO duplicado, el de arriba vale si existe el controller. Pero espera, en pasos anteriores usé ProductoApiController para vehiculos.
            // Para no romper nada de lo que acabo de escribir en ProductoApiController, usaré sus métodos.
            
            Route::get('/productos/{producto}/vehiculos-list', [ProductoApiController::class, 'vehiculos']); // Renombrado para evitar conflicto ruta
            Route::post('/productos/{producto}/vehiculos', [ProductoApiController::class, 'attachVehiculo']);
            Route::delete(
                '/productos/{producto}/vehiculos/{vehiculo}',
                [ProductoApiController::class, 'detachVehiculo']
            );
            
            // --------------------
            // Catálogo de Vehículos
            // --------------------
            Route::get('/vehiculos/marcas', [VehiculoApiController::class, 'marcas']);
            Route::get('/vehiculos/modelos', [VehiculoApiController::class, 'modelos']);
            Route::get('/vehiculos', [VehiculoApiController::class, 'vehiculos']);
            Route::post('/vehiculos/crear', [VehiculoApiController::class, 'crear']);

            // --------------------
            // Proveedores
            // --------------------
            Route::apiResource('proveedores', \App\Http\Controllers\Erp\ProveedorApiController::class);

            // --------------------
            // Workspace / Mostrador
            // --------------------
            Route::apiResource('drafts', \App\Http\Controllers\Erp\WorkspaceDraftController::class);
            Route::get('/proveedores', [\App\Http\Controllers\Erp\ProveedorApiController::class, 'index']);
            Route::post('/proveedores', [\App\Http\Controllers\Erp\ProveedorApiController::class, 'store']); // Nuevo
            
            Route::get('/productos/{producto}/proveedores', [\App\Http\Controllers\Erp\ProveedorApiController::class, 'proveedoresDeProducto']);
            Route::post('/productos/{producto}/proveedores', [\App\Http\Controllers\Erp\ProveedorApiController::class, 'attachProveedor']);
            Route::delete('/productos/{producto}/proveedores/{proveedor}', [\App\Http\Controllers\Erp\ProveedorApiController::class, 'detachProveedor']);

            // --------------------
            // Punto de Venta (POS)
            // --------------------
            Route::post('/pos/resolve', [\App\Http\Controllers\Erp\PosController::class, 'resolveProduct']);
            Route::post('/pos/sale', [\App\Http\Controllers\Erp\PosController::class, 'confirmSale']);
            Route::post('/pos/sale/{id}/rollback', [\App\Http\Controllers\Erp\PosController::class, 'rollbackSale']);
            
            // --------------------
            // Inventario
            // --------------------
            Route::get('/inventory/stats', [\App\Http\Controllers\Erp\InventoryController::class, 'stats']);
            Route::get('/inventory/balances', [\App\Http\Controllers\Erp\InventoryController::class, 'balances']);
            Route::get('/inventory/movements', [\App\Http\Controllers\Erp\InventoryController::class, 'movements']);
            Route::get('/inventory/sold-today', [\App\Http\Controllers\Erp\InventoryController::class, 'soldTodayItems']);
            Route::post('/inventory/requisitions/generate', [\App\Http\Controllers\Erp\InventoryController::class, 'generateRequisition']);

            // --------------------
            // Compras
            // --------------------
            Route::get('/purchases/requisitions', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexRequisitions']);
            Route::get('/purchases/requisitions/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'showRequisition']);
            Route::post('/purchases/requisitions/{id}/convert', [\App\Http\Controllers\Erp\PurchasesController::class, 'generateOrderFromRequisition']);
            Route::get('/purchases/orders', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexOrders']);
            Route::get('/purchases/orders/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'showOrder']);
            Route::post('/purchases/orders/{id}/receive', [\App\Http\Controllers\Erp\PurchasesController::class, 'receiveOrder']);

        });

        // Rutas Web ERP (Print, Exports, etc)
        Route::get('/pos/print/{id}', [\App\Http\Controllers\Erp\PosController::class, 'printReceipt'])->name('pos.print');

        // SPA shell (Catch-all for React Router) - DEFINE LAST
        Route::get('/{any?}', function () {
            return view('erp.index');
        })->where('any', '^(?!api).*$')->name('erp.index');

    });
});

require __DIR__.'/auth.php';
