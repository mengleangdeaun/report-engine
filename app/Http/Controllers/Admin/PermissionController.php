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

    // Create a new permission
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'label' => 'required|string|max:255',
            'module' => 'nullable|string|max:255',
        ]);

        $permission = Permission::create([
            'name' => strtolower(trim($request->name)),
            'label' => $request->label,
            'module' => $request->module ?? '',
            'guard_name' => 'web',
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Permission created successfully', 'permission' => $permission], 201);
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