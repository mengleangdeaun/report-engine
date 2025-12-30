<?php

namespace App\Http\Controllers;

use App\Models\Color;
use Illuminate\Http\Request;

class ColorController extends Controller
{
    public function index()
    {
        return response()->json(Color::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'hex_code' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'is_active' => 'boolean'
        ]);

        $color = Color::create($request->all());
        return response()->json($color, 201);
    }

    public function update(Request $request, $id)
    {
        $color = Color::findOrFail($id);
        $request->validate([
            'name' => 'string|max:50',
            'hex_code' => ['string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'is_active' => 'boolean'
        ]);

        $color->update($request->all());
        return response()->json($color);
    }

// Inside ColorController.php

public function destroy($id)
{
    $color = Color::findOrFail($id);

    // Safety check using the model method we created
    if ($color->inUse()) {
        return response()->json([
            'message' => 'Cannot delete this color. It is currently assigned to one or more Plans.'
        ], 422);
    }

    $color->delete();
    return response()->json(['message' => 'Color removed successfully']);
}
}
