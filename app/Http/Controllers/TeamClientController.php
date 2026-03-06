<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Report;
use App\Models\FacebookAdReport;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TeamClientController extends Controller
{
    /**
     * List all clients for the current team.
     */
    public function index()
    {
        $team = Auth::user()->currentTeam;

        if (!$team) {
            return response()->json(['message' => 'No active workspace found'], 404);
        }

        $clients = $team->clients()
            ->withCount(['reports', 'facebookAdReports'])
            ->latest()
            ->get();

        return response()->json($clients);
    }

    /**
     * Store a new client.
     */
    public function store(Request $request)
    {
        $team = Auth::user()->currentTeam;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('clients', 'email'),
                Rule::unique('users', 'email'),
            ],
            'password' => 'required|string|min:8',
        ]);

        $client = $team->clients()->create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Client created successfully',
            'client' => $client
        ], 201);
    }

    /**
     * Update client details.
     */
    public function update(Request $request, Client $client)
    {
        $this->authorizeOwner($client);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('clients', 'email')->ignore($client->id),
                Rule::unique('users', 'email'),
            ],
            'password' => 'nullable|string|min:8',
            'is_active' => 'required|boolean',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'is_active' => $request->is_active,
        ];

        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        $client->update($data);

        return response()->json([
            'message' => 'Client updated successfully',
            'client' => $client
        ]);
    }

    /**
     * Delete a client.
     */
    public function destroy(Client $client)
    {
        $this->authorizeOwner($client);

        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }

    /**
     * Get reports available for assignment.
     */
    public function getAvailableReports()
    {
        $team = Auth::user()->currentTeam;

        $standardReports = Report::where('team_id', $team->id)
            ->with('page:id,name')
            ->latest()
            ->get(['id', 'page_id', 'created_at']);

        $facebookReports = FacebookAdReport::where('team_id', $team->id)
            ->latest()
            ->get(['id', 'account_name', 'file_name', 'created_at']);

        $pages = Page::where('team_id', $team->id)
            ->latest()
            ->get(['id', 'name', 'platform', 'avatar']);

        return response()->json([
            'standard' => $standardReports,
            'facebook' => $facebookReports,
            'pages' => $pages,
        ]);
    }

    /**
     * Assign reports to a client.
     */
    public function assignReports(Request $request, Client $client)
    {
        $this->authorizeOwner($client);

        $request->validate([
            'report_ids' => 'array',
            'facebook_report_ids' => 'array',
            'page_ids' => 'array',
        ]);

        // Sync polymorphic relationships
        $client->reports()->sync($request->report_ids ?? []);
        $client->facebookAdReports()->sync($request->facebook_report_ids ?? []);
        $client->pages()->sync($request->page_ids ?? []);

        return response()->json(['message' => 'Reports assigned successfully']);
    }

    /**
     * Get assigned items for a client
     */
    public function getAssignedItems(Client $client)
    {
        $this->authorizeOwner($client);

        return response()->json([
            'report_ids' => $client->reports()->pluck('reportable_id'),
            'facebook_report_ids' => $client->facebookAdReports()->pluck('reportable_id'),
            'page_ids' => $client->pages()->pluck('reportable_id'),
        ]);
    }

    /**
     * Helper to ensure only the workspace owner/admin can manage its clients.
     */
    protected function authorizeOwner(Client $client)
    {
        $user = Auth::user();
        $team = $user->currentTeam;

        if ($client->team_id !== $team->id) {
            abort(403, 'Unauthorized action.');
        }

        // Ideally check if user is owner/admin of this team
        if ($team->user_id !== $user->id && !$team->members()->where('user_id', $user->id)->wherePivot('role', 'admin')->exists()) {
            abort(403, 'Unauthorized action.');
        }
    }
}
