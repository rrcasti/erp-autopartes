<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceDraft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkspaceDraftController extends Controller
{
    /**
     * Listar todos los drafts activos del usuario.
     */
    public function index()
    {
        $drafts = WorkspaceDraft::where('user_id', Auth::id())
            ->where('status', 'active')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($drafts);
    }

    /**
     * Crear un nuevo draft.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'nullable|string|max:255',
        ]);

        $draft = WorkspaceDraft::create([
            'user_id' => Auth::id(),
            'type' => $request->type,
            'title' => $request->title ?? 'Sin título',
            'payload' => $request->input('payload', []), // Array vacío por defecto
            'status' => 'active',
            'last_saved_at' => now(),
        ]);

        return response()->json($draft, 201);
    }

    /**
     * Actualizar draft existente (Auto-save).
     */
    public function update(Request $request, $id)
    {
        $draft = WorkspaceDraft::where('user_id', Auth::id())->where('id', $id)->firstOrFail();

        // Validamos solo lo esencial, payload es flexible
        $request->validate([
            'payload' => 'nullable|array',
            'title' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,finalized,discarded',
        ]);

        $data = $request->only(['title', 'status', 'payload']);
        $data['last_saved_at'] = now();

        $draft->update($data);

        return response()->json($draft);
    }

    /**
     * Eliminar o descartar draft.
     */
    public function destroy($id)
    {
        $draft = WorkspaceDraft::where('user_id', Auth::id())->where('id', $id)->firstOrFail();
        $draft->delete();

        return response()->json(['message' => 'Draft eliminado']);
    }
}
