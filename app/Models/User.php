<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Transaction;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Casts\Attribute;


class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    // app/Models/User.php

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'token_balance',
        'avatar',
        'team_id',
        'email_verified_at', // ✅ Add this to allow mass assignment
        'preferences',
    ];

    public function guardName()
    {
        return 'web';
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    // 2. Relationship to CURRENT active team
    public function currentTeam()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
    public function ownedTeam()
    {
        return $this->hasOne(Team::class, 'user_id');
    }
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];


    public function isSuperAdmin(): bool
    {
        // Check for specific email, ID 1, or super_admin role
        return $this->email === 'mengleangdeaun@gmail.com'
            || $this->id === 1
            || $this->hasRole('super_admin');
    }


    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'banned_at' => 'datetime',
        'settings' => 'array',
        'preferences' => 'array',
        'team_id' => 'integer',
    ];

    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // 1. If null, return null (Frontend handles default)
                if (!$value)
                    return null;

                // 2. If it is already a full link (Google/Facebook), return it
                if (str_starts_with($value, 'http')) {
                    return $value;
                }

                // 3. If it is a local file, add the full localhost domain
                return asset('storage/' . $value);
            }
        );
    }
    // Link to the transactions table
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    public function getStoredPermissionTeamId()
    {
        return $this->team_id;
    }
    public static function getPermissionsTeamId()
    {
        return app(\Spatie\Permission\PermissionRegistrar::class)->getPermissionsTeamId();
    }

    /**
     * Check if the user is banned.
     */
    public function isBanned(): bool
    {
        return !is_null($this->banned_at);
    }
}
