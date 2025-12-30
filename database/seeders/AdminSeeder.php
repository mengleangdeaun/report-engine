<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Team;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        // 1. Find or Create the Admin User
        $adminEmail = 'mengleangdeaun@gmail.com';
        $user = User::where('email', $adminEmail)->first();

        if (!$user) {
            $user = User::create([
                'name' => 'Super Admin',
                'email' => $adminEmail,
                'password' => Hash::make('11121314'), // Change this!
                'email_verified_at' => now(), // ✅ Prevents verification redirect loop
            ]);
        }

        // 2. Ensure a Default Team/Workspace exists for the Admin
        $team = Team::firstOrCreate(
            ['id' => 1], 
            ['name' => 'Admin Workspace', 'user_id' => $user->id]
        );

        $user->team_id = $team->id;
        $user->save();

        // 3. ✅ THE KEY STEP: Set Spatie Team Context
        // This ensures the 'team_id' is populated in model_has_roles table
        setPermissionsTeamId($team->id);

        // 4. Create Standard Roles for this Team
        $roles = ['admin', 'user', 'member'];

        foreach ($roles as $roleName) {
            Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
                'team_id' => $team->id // ✅ Roles must belong to a team in your setup
            ]);
        }

        // 5. Assign the Admin Role
        $user->assignRole('admin');

        $this->command->info('Admin role and standard roles ("user", "member") assigned to ' . $user->email);
    }
}