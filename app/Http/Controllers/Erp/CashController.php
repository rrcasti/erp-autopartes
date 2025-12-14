<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CashRegister;
use App\Models\CashMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CashController extends Controller
{
    /**
     * Get the current open cash register for the authenticated user.
     */
    public function current()
    {
        try {
            $userId = Auth::id();
            $cashRegister = CashRegister::where('user_id', $userId)
                ->where('status', 'open')
                ->latest()
                ->first();

            if (!$cashRegister) {
                return response()->json(['data' => null]);
            }

            return response()->json(['data' => $this->enrichCashRegister($cashRegister)]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Open a new cash register.
     */
    public function open(Request $request)
    {
        try {
            $request->validate([
                'start_balance' => 'required|numeric|min:0',
            ]);

            $userId = Auth::id();

            // Check if user already has an open register
            $existing = CashRegister::where('user_id', $userId)
                ->where('status', 'open')
                ->first();

            if ($existing) {
                return response()->json(['error' => 'Ya tienes una caja abierta.'], 400);
            }

            $cashRegister = CashRegister::create([
                'user_id' => $userId,
                'opened_at' => now(),
                'start_balance' => $request->start_balance,
                'status' => 'open',
            ]);

            return response()->json(['data' => $this->enrichCashRegister($cashRegister)], 201);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Close the current cash register.
     */
    public function close(Request $request)
    {
        try {
            $request->validate([
                'cash_register_id' => 'required|exists:cash_registers,id',
                'real_balance' => 'required|numeric|min:0',
            ]);

            $cashRegister = CashRegister::where('id', $request->cash_register_id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            if ($cashRegister->status !== 'open') {
                return response()->json(['error' => 'Esta caja ya está cerrada.'], 400);
            }

            // Calculate totals
            $totals = $this->calculateTotals($cashRegister);
            $endBalance = $totals['expected_end'];

            $cashRegister->update([
                'closed_at' => now(),
                'end_balance' => $endBalance,
                'real_balance' => $request->real_balance,
                'status' => 'closed',
            ]);

            return response()->json(['data' => $this->enrichCashRegister($cashRegister)]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get details of a specific cash register.
     */
    public function show($id)
    {
        try {
            $cashRegister = CashRegister::with(['movements.cashRegister']) // optimization
                ->where('id', $id)
                // Allow admin or owner. For now, checking permission 'view_reports' for others could be an option.
                // Assuming simple ownership check for now + allow admin role (if needed later)
                ->where(function ($q) {
                    $q->where('user_id', Auth::id());
                    // OR check role admin if we implemented global view
                })
                ->firstOrFail();

            return response()->json(['data' => $this->enrichCashRegister($cashRegister)]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Caja no encontrada o acceso denegado.'], 404);
        }
    }

    /**
     * Store a manual movement (Income/Expense).
     */
    public function storeMovement(Request $request)
    {
        try {
            $request->validate([
                'cash_register_id' => 'required|exists:cash_registers,id',
                'type' => 'required|in:income,expense',
                'amount' => 'required|numeric|gt:0',
                'payment_method' => 'required|string',
                'description' => 'required|string',
            ]);

            $cashRegister = CashRegister::where('id', $request->cash_register_id)
                ->where('user_id', Auth::id())
                ->where('status', 'open')
                ->firstOrFail();

            $movement = CashMovement::create([
                'cash_register_id' => $cashRegister->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'description' => $request->description,
                'sale_id' => null, // Manual movement
            ]);

            return response()->json(['data' => $movement], 201);

        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List movements for a cash register.
     */
    public function movements($id, Request $request)
    {
        try {
            $query = CashMovement::where('cash_register_id', $id);

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }
            if ($request->has('has_sale')) {
                if ($request->has_sale == 'true') {
                    $query->whereNotNull('sale_id');
                    $query->with(['sale.customer']); // Eager load for Sales Tab
                }
                else $query->whereNull('sale_id');
            }

            $movements = $query->latest()->paginate(50);
            return response()->json($movements);

        } catch (\Throwable $e) {
             return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * History of closed cash registers.
     */
    public function history(Request $request)
    {
        try {
            $query = CashRegister::with('movements')
                ->where('user_id', Auth::id())
                ->where('status', 'closed')
                ->latest('closed_at');

            if ($request->has('from')) {
                $query->whereDate('opened_at', '>=', $request->from);
            }
            if ($request->has('to')) {
                $query->whereDate('opened_at', '<=', $request->to);
            }

            $history = $query->paginate(20);
            
            // Enrich collection
            $history->getCollection()->transform(function ($item) {
                // Determine difference if end_balance and real_balance exist
                $diff = 0;
                if ($item->end_balance !== null && $item->real_balance !== null) {
                    $diff = $item->real_balance - $item->end_balance;
                }
                $item->difference = $diff;
                return $item;
            });

            return response()->json($history);

        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // --- Private Helper ---
    
    private function calculateTotals(CashRegister $register)
    {
        $movements = $register->movements; // Assuming eager loaded or accessible
        $income = $movements->where('type', 'income')->sum('amount');
        $expense = $movements->where('type', 'expense')->sum('amount');
        
        return [
            'income' => $income,
            'expense' => $expense,
            'expected_end' => $register->start_balance + $income - $expense,
            'sales_count' => $movements->whereNotNull('sale_id')->count(), 
        ];
    }

    private function enrichCashRegister(CashRegister $register)
    {
        $totals = $this->calculateTotals($register);
        
        $register->totals = $totals;
        
        // Calculate difference on the fly for open or closed registers if data available
        // For open registers, difference is usually calculated against what user inputs in UI, check later.
        if ($register->status === 'closed' && $register->real_balance !== null) {
            $register->difference = $register->real_balance - $register->end_balance;
        } else {
            $register->difference = 0; 
        }

        return $register;
    }

    /**
     * Print view for the cash register closure.
     */
    public function printClosure($id)
    {
        $cashRegister = CashRegister::with(['movements', 'user'])->findOrFail($id);
        $totals = $this->calculateTotals($cashRegister);
        
        // Difference logic
        $difference = 0;
        if ($cashRegister->status === 'closed' && $cashRegister->real_balance !== null) {
            $difference = $cashRegister->real_balance - $cashRegister->end_balance;
        }

        return view('erp.cash.print', compact('cashRegister', 'totals', 'difference'));
    }
}
