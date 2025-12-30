<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Team;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
public function run(): void
{
    // 1. Clear cache
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    // 2. Create the User FIRST (So ID 1 exists)
    $admin = \App\Models\User::create([
        'name' => 'Super Admin',
        'email' => 'mengleangdeaun@gmail.com',
        'password' => bcrypt('11121314'),
        'email_verified_at' => now(),
    ]);

    // 3. Create the Team (Linking to the User ID created above)
    $team = \App\Models\Team::create([
        'name' => 'Admin Workspace',
        'user_id' => $admin->id,
        'plan_type' => 'pro',
    ]);

    // 4. Update the User to point to this as their current team
    $admin->update(['team_id' => $team->id]);

    // 5. ✅ THE MAGIC LINE: Set context for Spatie
    setPermissionsTeamId($team->id);

    // 6. Create Roles inside this team context
    $adminRole = \Spatie\Permission\Models\Role::create([
        'name' => 'admin', 
        'team_id' => $team->id,
        'guard_name' => 'web'
    ]);

    // 7. Assign the Role (This will now have team_id = 1)
    $admin->assignRole($adminRole);
}
}