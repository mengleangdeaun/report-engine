<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    // List all permissions for the table
public function index(Request $request)
{
    $query = Permission::orderBy('module')->orderBy('name');

    // If 'only_active' is passed, filter the list (used for Plan/Role settings)
    if ($request->has('only_active')) {
        $query->where('is_active', true);
    }

    return response()->json($query->get());
}

// ... inside the class ...

public function toggleStatus($id)
{
    // Find the permission or return 404
    $permission = \Spatie\Permission\Models\Permission::findOrFail($id);
    
    // Switch the boolean
    $permission->is_active = !$permission->is_active;
    $permission->save();

    return response()->json([
        'message' => 'Status updated',
        'is_active' => $permission->is_active
    ]);
}

    // Update the Label and Module
    public function update(Request $request, $id)
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'module' => 'required|string|max:255',
        ]);

        $permission = Permission::findOrFail($id);
        
        // We generally DON'T update 'name' because it's hardcoded in your @can() checks
        $permission->update([
            'label' => $request->label,
            'module' => $request->module,
        ]);

        return response()->json(['message' => 'Permission metadata updated', 'permission' => $permission]);
    }

    // Optional: Delete permission if you stopped using a feature
    public function destroy($id)
    {
        Permission::findOrFail($id)->delete();
        return response()->json(['message' => 'Permission removed']);
    }
}