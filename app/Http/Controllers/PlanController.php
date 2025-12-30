<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    // 1. LIST PLANS (Public or Admin)
    public function index()
    {
        return response()->json(Plan::all());
    }
public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'slug' => 'required|string|unique:plans,slug|alpha_dash',
        'price' => 'required|numeric|min:0',
        'member_limit' => 'required|integer|min:1',
        'max_workspaces' => 'required|integer|min:1',
        'max_tokens' => 'required|integer|min:0',
        'features' => 'nullable|array',
        'is_active' => 'boolean',
        // New Fields
        'description' => 'nullable|string',
        'badge_label' => 'nullable|string|max:50',
        'color_id' => 'nullable|integer',
        'icon_svg' => 'nullable|string',
        'is_popular' => 'boolean'
    ]);

    $plan = Plan::create([
        'name' => $request->name,
        'slug' => $request->slug,
        'price' => $request->price,
        'member_limit' => $request->member_limit,
        'max_tokens' => $request->max_tokens,
        'max_workspaces' => $request->max_workspaces,
        'features' => $request->features ?? [],
        'is_active' => $request->is_active ?? true,
        // New Fields
        'description' => $request->description,
        'badge_label' => $request->badge_label,
        'color_id' => $request->color_id ?? 1,
        'icon_svg' => $request->icon_svg,
        'is_popular' => $request->is_popular ?? false,
    ]);

    return response()->json(['message' => 'Plan created successfully', 'plan' => $plan], 201);
}

public function update(Request $request, $id)
{
    $request->validate([
        'name' => 'required|string',
        'price' => 'required|numeric',
        'member_limit' => 'required|integer',
        'max_workspaces' => 'required|integer',
        'max_tokens' => 'required|integer',
        'features' => 'nullable|array',
        'is_active' => 'boolean',
        // New Fields
        'description' => 'nullable|string',
        'badge_label' => 'nullable|string|max:50',
        'color_id' => 'nullable|integer',
        'icon_svg' => 'nullable|string',
        'is_popular' => 'boolean'
    ]);

    $plan = Plan::findOrFail($id);
    
    $plan->update([
        'name' => $request->name,
        'price' => $request->price,
        'member_limit' => $request->member_limit,
        'max_workspaces'=> $request->max_workspaces, 
        'max_tokens' => $request->max_tokens,
        'features' => $request->features ?? [],
        'is_active' => $request->is_active,
        // New Fields
        'description' => $request->description,
        'badge_label' => $request->badge_label,
        'color_id' => $request->color_id,
        'icon_svg' => $request->icon_svg,
        'is_popular' => $request->is_popular,
    ]);

    return response()->json(['message' => 'Plan updated successfully', 'plan' => $plan]);
}
    

public function getAvailableFeatures()
{
    // We fetch the permissions and ensure 'name' is clearly available
    // as the primary identifier for the frontend.
    return response()->json(
        \Spatie\Permission\Models\Permission::where('is_active', true)
            ->select('id', 'name', 'label', 'module')
            ->get()
    );
}
    // Also, update the destroy method just in case you want to delete later
    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);
        $plan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }
}

