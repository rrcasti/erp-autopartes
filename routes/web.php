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

// RUTA TEMPORAL FIX DB RUNS
Route::get('/fix-db-runs', function () {
    try {
        // Forzar borrado para reparar
        \Illuminate\Support\Facades\Schema::dropIfExists('replenishment_runs');

        \Illuminate\Support\Facades\Schema::create('replenishment_runs', function ($table) {
            $table->id();
            $table->string('run_type', 50)->default('AUTO_REPLENISHMENT');
            $table->string('status', 20)->default('DRAFT');
            $table->dateTime('from_at');
            $table->dateTime('to_at');
            $table->unsignedBigInteger('generated_by');
            $table->timestamp('generated_at')->useCurrent();
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->unsignedBigInteger('requisition_id')->nullable();
            $table->integer('suppliers_count')->default(0);
            $table->integer('items_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['run_type', 'status', 'generated_at'], 'run_idx');
            $table->index('requisition_id');
        });
        return "Tabla recreada con éxito. Ya puedes usar el sistema.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

// La ruta de reparación ha sido eliminada. Usar .\runphp.bat reparar_tablas.php si es necesario.



// RUTA TEMPORAL DE FIX COLUMNA (YA EJECUTADO)

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
            Route::get('/inventory/sold-today', [\App\Http\Controllers\Erp\InventoryController::class, 'soldTodayItems']); // Restaurada
            Route::post('/inventory/requisitions/generate', [\App\Http\Controllers\Erp\InventoryController::class, 'generateRequisition']);
            
            // Runs de Reposición (Nuevo Sistema)
            Route::get('/inventory/replenishment/runs', [\App\Http\Controllers\Erp\InventoryController::class, 'listReplenishmentRuns']);
            Route::post('/inventory/replenishment/runs/generate', [\App\Http\Controllers\Erp\InventoryController::class, 'generateReplenishmentRun']);
            Route::post('/inventory/replenishment/runs/{id}/close', [\App\Http\Controllers\Erp\InventoryController::class, 'closeReplenishmentRun']);
            Route::delete('/inventory/replenishment/runs/{id}', [\App\Http\Controllers\Erp\InventoryController::class, 'destroyRun']);
            
            Route::post('/inventory/adjust', [\App\Http\Controllers\Erp\InventoryController::class, 'adjustStock']);

            // --------------------
            // Compras
            // --------------------
            // Ruta vieja (comentada para evitar conflicto)
            // Route::get('/purchases/requisitions', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexRequisitions']);
            // Route::get('/purchases/requisitions/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'showRequisition']);
            // Route::post('/purchases/requisitions/{id}/convert', [\App\Http\Controllers\Erp\PurchasesController::class, 'generateOrderFromRequisition']);
            // Route::get('/purchases/orders', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexOrders']);
            // Route::get('/purchases/orders/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'showOrder']);
            // Route::post('/purchases/orders/{id}/receive', [\App\Http\Controllers\Erp\PurchasesController::class, 'receiveOrder']); 

            // Se mantienen activas las rutas de PurchasesController para READ (listados) que ya arreglamos, pero las de acciones (POST) se anulan en favor del nuevo controlador.
            // Reactivamos SOLO las de lectura corregidas:
            Route::get('/purchases/requisitions', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexRequisitions']);
            Route::get('/purchases/requisitions/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'showRequisition']);
            Route::delete('/purchases/requisitions/{id}', [\App\Http\Controllers\Erp\PurchasesController::class, 'destroyRequisition']);
            Route::get('/purchases/orders', [\App\Http\Controllers\Erp\PurchasesController::class, 'indexOrders']); // Esta ya la corregimos para leer DB real
            
            // --- NUEVO SISTEMA DE ORDENES DE COMPRA REAL ---
            Route::post('/purchase-orders/from-requisition/{requisitionId}', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'createFromRequisition']);
            Route::get('/purchase-orders/{id}', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'show']);
            Route::patch('/purchase-orders/{id}', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'update']);
            Route::post('/purchase-orders/{id}/export', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'export']);
            Route::post('/purchase-orders/{id}/email', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'sendEmail']);
            Route::post('/purchase-orders/{id}/close', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'forceClose']);
            Route::post('/purchase-orders/{id}/reopen', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'reopen']);
            Route::post('/purchase-orders/{id}/receive', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'receiveItems']);
            Route::delete('/purchase-orders/{id}', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'destroy']);
            
            // Adjuntos / Attachments
            Route::get('/purchase-orders/{id}/attachments', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'getAttachments']);
            Route::post('/purchase-orders/{id}/attachments', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'uploadAttachment']);
            Route::delete('/purchase-orders/{id}/attachments/{attachmentId}', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'deleteAttachment']);
            Route::get('/purchase-orders/{id}/attachments/{attachmentId}/download', [\App\Http\Controllers\Erp\PurchaseOrderController::class, 'downloadAttachment']);

            // Users & Roles
            Route::get('/users', [\App\Http\Controllers\Erp\UserController::class, 'index']);
            Route::post('/users', [\App\Http\Controllers\Erp\UserController::class, 'store']); // Create
            Route::get('/users/meta', [\App\Http\Controllers\Erp\UserController::class, 'meta']);
            Route::get('/users/{id}', [\App\Http\Controllers\Erp\UserController::class, 'show']);
            Route::post('/users/{id}', [\App\Http\Controllers\Erp\UserController::class, 'update']);
            Route::delete('/users/{id}', [\App\Http\Controllers\Erp\UserController::class, 'destroy']); // Delete

            // Current User Endpoint for Frontend AuthContext
            Route::get('/me', function (Illuminate\Http\Request $request) {
                $user = $request->user();
                return response()->json([
                    'user' => $user,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]);
            });

            // --------------------
            // Caja Diaria (Daily Cash Box)
            // --------------------
            Route::prefix('cash')->group(function () {
                Route::get('/current', [\App\Http\Controllers\Erp\CashController::class, 'current']);
                Route::post('/open', [\App\Http\Controllers\Erp\CashController::class, 'open']);
                Route::post('/close', [\App\Http\Controllers\Erp\CashController::class, 'close']);
                Route::post('/movements', [\App\Http\Controllers\Erp\CashController::class, 'storeMovement']); // Create manual
                Route::get('/history', [\App\Http\Controllers\Erp\CashController::class, 'history']);
                Route::get('/{id}', [\App\Http\Controllers\Erp\CashController::class, 'show']);
                Route::get('/{id}/movements', [\App\Http\Controllers\Erp\CashController::class, 'movements']);
                Route::get('/{id}/print', [\App\Http\Controllers\Erp\CashController::class, 'printClosure']);
            });

        });

        // Rutas Web ERP (Print, Exports, etc)
        Route::get('/pos/print/{id}', [\App\Http\Controllers\Erp\PosController::class, 'printReceipt'])->name('pos.print');

        Route::get('/debug-tables', function() {
            return response()->json([
                'vehiculo_marcas' => \Illuminate\Support\Facades\Schema::hasTable('vehiculo_marcas'),
                'vehiculo_modelos' => \Illuminate\Support\Facades\Schema::hasTable('vehiculo_modelos'),
                'vehiculos' => \Illuminate\Support\Facades\Schema::hasTable('vehiculos'),
                'producto_vehiculo' => \Illuminate\Support\Facades\Schema::hasTable('producto_vehiculo'),
            ]);
        });

        // SPA shell (Catch-all for React Router) - DEFINE LAST
        Route::get('/{any?}', function () {
            return view('erp.index');
        })->where('any', '^(?!api).*$')->name('erp.index');

    });
});

require __DIR__.'/auth.php';
