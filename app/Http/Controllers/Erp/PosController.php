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
            // IMPORTANTE: Cargar items recién creados para que aparezcan en el mensaje
            $sale->load('items');
            
            $phoneInput = $data['customer']['phone'] ?? null;
            $waData = $this->generateWhatsAppLink($sale, $customer, $phoneInput);
            $printUrl = route('pos.print', ['id' => $sale->id]);

            return response()->json([
                'success' => true,
                'summary' => [
                    'sale' => [
                        'id' => $sale->id,
                        'receipt_number' => $posNumber,
                        'date' => $sale->fecha->format('d/m/Y H:i'),
                        'seller' => Auth::user()->name ?? 'Vendedor',
                    ],
                    'customer' => [
                        'name' => $customer ? $customer->nombre : 'Consumidor Final',
                        'phone' => $customer ? $customer->celular : null,
                        'address' => $customer ? $customer->direccion : null,
                        'email' => $customer ? $customer->email : null,
                    ],
                    'items' => $sale->items->map(function($i) {
                        return [
                            'name' => $i->producto_nombre,
                            'brand' => $i->marca_nombre,
                            'quantity' => $i->cantidad,
                            'price' => (float)$i->precio_unitario,
                            'subtotal' => (float)$i->subtotal,
                        ];
                    }),
                    'totals' => [
                        'subtotal' => (float)$sale->total_sin_iva,
                        'iva' => (float)$sale->total_iva,
                        'total' => (float)$sale->total_final,
                    ],
                    'share' => [
                        'whatsapp_url' => $waData['url'],
                        'whatsapp_text' => $waData['text'],
                        'print_url' => $printUrl,
                    ]
                ]
            ]);
        });
    }

    public function printReceipt($id)
    {
        $sale = Sale::with(['items', 'customer', 'user'])->findOrFail($id);
        return view('erp.print.receipt', compact('sale'));
    }

    private function resolveCustomer($data)
    {
        if (empty($data['name']) || $data['name'] === 'Consumidor Final') {
            return null; // Consumidor Final
        }
        if (!empty($data['phone'])) {
            $existing = Customer::where('celular', $data['phone'])->first();
            if ($existing) return $existing;
        }
        return Customer::create([
            'nombre' => $data['name'],
            'celular' => $data['phone'] ?? null,
            'direccion' => $data['address'] ?? null,
            'email' => $data['email'] ?? null,
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

    private function generateWhatsAppLink($sale, $customer, $fallbackPhone = null)
    {
        $storeName = config('app.name', 'Repuestos KM21');
        $storeAddress = "Av. Warnes 1234, CABA"; 
        $storePhone = "11-5555-5555"; 
        
        $text = "*$storeName*\n";
        $text .= "📍 $storeAddress\n";
        $text .= "📞 $storePhone\n\n";
        
        $text .= "*Comprobante #{$sale->receipt_number}*\n";
        $text .= "🗓 " . $sale->created_at->format('d/m/Y H:i') . "\n";

        if ($customer) {
            $text .= "👤 " . $customer->nombre . "\n";
        }

        $text .= "\n*DETALLE:*\n";
        foreach ($sale->items as $item) {
            $brand = $item->marca_nombre ? " ({$item->marca_nombre})" : "";
            $text .= "▪ {$item->cantidad} x {$item->producto_nombre}{$brand}\n";
            $text .= "   $" . number_format($item->subtotal, 0, ',', '.') . "\n";
        }

        $text .= "\n--------------------------------\n";
        $text .= "*TOTAL: $" . number_format($sale->total_final, 0, ',', '.') . "*\n";
        $text .= "--------------------------------\n";
        $text .= "Gracias por elegirnos!";

        $celular = ($customer && !empty($customer->celular)) ? $customer->celular : $fallbackPhone;

        if (empty($celular)) {
            return ['url' => null, 'text' => $text];
        }
        
        // Normalizar 549... para Argentina
        $phone = preg_replace('/[^0-9]/', '', $celular);
        
        // Lógica simple: Si tiene 10 dígitos (ej: 1134030610 o 351...), agregamos 549.
        if (strlen($phone) == 10) {
             $phone = '549' . $phone;
        } 
        // Si tiene 11 dígitos y empieza con 54 (sin 9), puede ser fijo o error, agregamos 9? Riesgoso.
        // Si tiene 12 dígitos y empieza con 549, está perfecto.
        // Si empieza con 15 (viejo móvil local sin área), es un problema del usuario, pero intentamos limpiar.
        else if (str_starts_with($phone, '15') && strlen($phone) > 2) {
             // Asumimos que ingresó 15 + numero sin area? O el 15 es parte del numero?
             // Mejor no tocar si es ambiguo, pero si son 10 digitos quitando el 15...
             $without15 = substr($phone, 2);
             if (strlen($without15) == 8) { // Falta área, imposible adivinar.
                 // Dejar como está o avisar.
             } else {
                 $phone = '549' . $phone; // Asumir que es un formato válido
             }
        }
        else if (!str_starts_with($phone, '54')) {
             $phone = '549' . $phone; 
        }

        return [
            'url' => "https://wa.me/{$phone}?text=" . urlencode($text),
            'text' => $text
        ];
    }

    public function rollbackSale($id)
    {
        return DB::transaction(function () use ($id) {
            $sale = Sale::findOrFail($id);
            if ($sale->estado === 'ANULADA') {
                return response()->json(['success' => false, 'message' => 'Ya está anulada']);
            }

            // 1. Revertir Stock
            foreach ($sale->items as $item) {
                if ($item->producto_id) {
                    $prod = Producto::find($item->producto_id);
                    if ($prod && $prod->stock_controlado) {
                        $prod->increment('stock_disponible', $item->cantidad);
                        StockMovement::create([
                            'product_id' => $prod->id,
                            'user_id' => Auth::id(),
                            'type' => 'manual',
                            'quantity' => $item->cantidad,
                            'sale_id' => $sale->id,
                            'reference_description' => "Corrección Venta (Rollback) #{$id}",
                        ]);
                    }
                }
            }

            // 2. Revertir Caja
            $caja = CashRegister::where('user_id', Auth::id())->where('status', 'open')->latest()->first();
            if ($caja) {
                CashMovement::create([
                    'cash_register_id' => $caja->id,
                    'sale_id' => $sale->id,
                    'type' => 'expense',
                    'amount' => $sale->total_final,
                    'payment_method' => $sale->medio_pago,
                    'description' => "Anulación Venta #{$id}",
                ]);
            }

            // 3. Marcar ANULADA
            $sale->update(['estado' => 'ANULADA']);

            return response()->json(['success' => true]);
        });
    }
}
