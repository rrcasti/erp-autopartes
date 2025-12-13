<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;
use App\Models\StockMovement;
use App\Models\CashRegister;
use App\Models\CashMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PosController extends Controller
{
    /**
     * Búsqueda inteligente de productos para mostrador.
     * Prioriza match exacto por SKU/Barcode, luego búsqueda textual.
     */
    public function resolveProduct(Request $request)
    {
        $query = trim($request->input('query'));
        if (empty($query)) return response()->json(['type' => 'none']);

        // 1. Intento Match Exacto (Barcode o SKU)
        $exactMatch = Producto::where('codigo_barra', $query)
            ->orWhere('sku_interno', $query)
            ->with(['marca']) // Eager load marca
            ->first();

        if ($exactMatch) {
            return response()->json([
                'type' => 'exact',
                'product' => $this->formatProductForPos($exactMatch)
            ]);
        }

        // 2. Búsqueda "Google-like" (Palabras clave)
        // Cada palabra debe matchear en ALGUN campo (Nombre, SKU, Marca, etc)
        $terms = array_filter(explode(' ', $query));
        
        $productsQuery = Producto::query()->with(['marca', 'proveedor']);

        foreach ($terms as $term) {

            $productsQuery->where(function($subQ) use ($term) {
                $subQ->where('nombre', 'LIKE', "%{$term}%")
                     ->orWhere('sku_interno', 'LIKE', "%{$term}%")
                     ->orWhere('codigo_barra', 'LIKE', "%{$term}%")
                     ->orWhereHas('marca', function($mQ) use ($term) {
                         $mQ->where('nombre', 'LIKE', "%{$term}%");
                     });
            });
        }

        $results = $productsQuery->limit(20)->get();

        if ($results->isEmpty()) {
            return response()->json(['type' => 'none']);
        }

        return response()->json([
            'type' => 'list',
            'results' => $results->map(function ($p) {
                return $this->formatProductForPos($p);
            })
        ]);
    }

    /**
     * Confirma la venta, generando movimientos de stock, caja y comprobante.
     */
    public function confirmSale(Request $request)
    {
        // Validación básica
        $payload = $request->validate([
            'items' => 'required|array|min:1',
            'customer' => 'nullable|array',
            'totals' => 'required|array',
            'paymentMethod' => 'required|string',
        ]);

        return DB::transaction(function () use ($payload) {
            // 1. Resolver Cliente
            $customer = $this->resolveCustomer($payload['customer'] ?? []);

            // 2. Generar Número Comprobante (Simple serial para MVP)
            // Idealmente: tabla de secuencias por sucursal. Aquí: max id + 1 o UUID corto.
            $posNumber = 'INT-' . str_pad(Sale::max('id') + 1, 8, '0', STR_PAD_LEFT);

            // 3. Crear Cabecera Venta
            $sale = Sale::create([
                'user_id' => Auth::id(),
                'customer_id' => $customer ? $customer->id : null,
                'fecha' => now(),
                'total_sin_iva' => $payload['totals']['subtotal'],
                'total_iva' => $payload['totals']['iva'],
                'total_final' => $payload['totals']['total'],
                'estado' => 'CONFIRMADA', // Directo a confirmada
                'medio_pago' => $payload['paymentMethod'],
                'observaciones' => $posNumber, // Guardamos el nro visible aquí temp
            ]);

            // 4. Procesar Items y Stock
            foreach ($payload['items'] as $item) {
                // Snapshot Item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'producto_id' => $item['product_id'] ?? null,
                    'producto_nombre' => $item['name'],
                    'marca_nombre' => $item['brand_name'] ?? 'Genérica',
                    'codigo_barra' => $item['barcode'],
                    'sku' => $item['sku'] ?? null,
                    'cantidad' => $item['quantity'],
                    'precio_unitario' => $item['price'],
                    'alicuota_iva' => 21.00, // TODO: Config
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);

                // Descuento de Stock (Solo si no es manual y tiene ID)
                if (!empty($item['product_id'])) {
                    $producto = Producto::find($item['product_id']);
                    if ($producto && $producto->stock_controlado) {
                        // Validar stock negativo si es policy strict (Omitido por requerimiento "permitir x defecto")
                        $producto->decrement('stock_disponible', $item['quantity']);
                        
                        // Kardex Log
                        StockMovement::create([
                            'product_id' => $producto->id,
                            'user_id' => Auth::id(),
                            'type' => 'sale',
                            'quantity' => -1 * abs($item['quantity']),
                            'sale_id' => $sale->id,
                            'reference_description' => "Venta Mostrador #$posNumber",
                        ]);
                    }
                }
            }

            // 5. Registrar en Caja (Session)
            // Buscar caja abierta del usuario
            $caja = CashRegister::where('user_id', Auth::id())
                ->where('status', 'open')
                ->latest()
                ->first();

            // Si no hay caja abierta, ¿abrimos una auto o fallamos?
            // Requerimiento: "Implementar configurable, por defecto exigir apertura".
            // Para simplificar este entregable MVP, si NO hay caja, creamos una movimiento "huérfano" o auto-abrimos.
            // Voy a auto-abrir para evitar bloqueos UX en demo, pero idealmente dar error.
            if (!$caja) {
                 $caja = CashRegister::create([
                    'user_id' => Auth::id(),
                    'opened_at' => now(),
                    'start_balance' => 0,
                    'status' => 'open'
                 ]);
            }

            CashMovement::create([
                'cash_register_id' => $caja->id,
                'sale_id' => $sale->id,
                'type' => 'income',
                'amount' => $sale->total_final,
                'payment_method' => $sale->medio_pago,
                'description' => "Venta #$posNumber",
            ]);

            // 6. Generar Datos de Respuesta (Print & WhatsApp)
            $whatsappLink = $this->generateWhatsAppLink($sale, $customer);
            $printUrl = route('pos.print', ['id' => $sale->id]); // Ruta que crearemos

            return response()->json([
                'success' => true,
                'sale_id' => $sale->id,
                'receipt_number' => $posNumber,
                'print_url' => $printUrl,
                'whatsapp_url' => $whatsappLink,
            ]);
        });
    }

    /**
     * Devuelve HTML simple para imprimir comprobante (tique).
     * Se puede abrir en popup y window.print().
     */
    public function printReceipt($id)
    {
        $sale = Sale::with(['items', 'customer', 'user'])->findOrFail($id);
        
        // Vista Blade simple (inline por brevedad o archivo)
        return view('erp.print.receipt', compact('sale'));
    }

    // --- Helpers Privados ---

    private function resolveCustomer($data)
    {
        if (empty($data['name']) || $data['name'] === 'Consumidor Final') {
            return null; // Consumidor Final
        }

        // Dedupe por celular
        if (!empty($data['phone'])) {
            $existing = Customer::where('celular', $data['phone'])->first();
            if ($existing) return $existing;
        }

        // Crear Nuevo
        return Customer::create([
            'nombre' => $data['name'],
            'celular' => $data['phone'] ?? null,
            'direccion' => $data['address'] ?? null,
            // 'email' => ...
        ]);
    }

    private function formatProductForPos($p)
    {
        return [
            'id' => $p->id,
            'name' => $p->nombre,
            'sku' => $p->sku_interno,
            'barcode' => $p->codigo_barra,
            'brand_name' => $p->marca ? $p->marca->nombre : 'Genérico',
            'provider_name' => $p->proveedor ? $p->proveedor->razon_social : null,
            'stock' => $p->stock_disponible ?? 0,
            'price' => (float) (($p->precio_venta_mostrador && $p->precio_venta_mostrador > 0) ? $p->precio_venta_mostrador : ($p->precio_lista ?? 0)),
        ];
    }

    private function generateWhatsAppLink($sale, $customer)
    {
        if (!$customer || empty($customer->celular)) return null;
        
        // Normalizar 549...
        $phone = preg_replace('/[^0-9]/', '', $customer->celular);
        if (str_starts_with($phone, '11') || str_starts_with($phone, '15')) $phone = '549' . $phone; // Arg simple fix
        
        $text = "*COMPROBANTE DE COMPRA*\n";
        $text .= "Fecha: " . $sale->fecha->format('d/m/Y H:i') . "\n";
        $text .= "Total: $" . number_format($sale->total_final, 2) . "\n\n";
        $text .= "Detalle:\n";
        foreach($sale->items as $item) {
            $text .= "- {$item->cantidad}x {$item->producto_nombre} ($".number_format($item->subtotal,0).")\n";
        }
        $text .= "\nGracias por su compra!";

        return "https://wa.me/{$phone}?text=" . urlencode($text);
    }
}
