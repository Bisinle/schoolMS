<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use App\Helpers\PasswordGenerator;
use App\Enums\ActivityType;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserManagementService
{
    /**
     * Create a new user
     */
    public function createUser(array $data, User $creator): array
    {
        DB::beginTransaction();

        try {
            $password = null;
            $mustChangePassword = false;

            // Handle password based on setup method
            switch ($data['password_setup_method']) {
                case 'generate':
                    $password = PasswordGenerator::generate(12);
                    $mustChangePassword = true;
                    break;
                
                case 'send_email':
                    // Generate temporary password for email
                    $password = PasswordGenerator::generate(12);
                    $mustChangePassword = true;
                    // TODO: Send email in future
                    break;
                
                case 'custom':
                    $password = $data['password'];
                    $mustChangePassword = $data['must_change_password'] ?? false;
                    break;
            }

            // Create user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'role' => $data['role'],
                'password' => Hash::make($password),
                'created_by' => $creator->id,
                'is_active' => true,
                'must_change_password' => $mustChangePassword,
            ]);

            // Log activity
            ActivityLog::createLog(
                ActivityType::USER_CREATED->value,
                $user->id,
                $creator->id,
                "User account created by {$creator->name}",
                [
                    'role' => $data['role'],
                    'email' => $data['email'],
                ]
            );

            DB::commit();

            return [
                'success' => true,
                'user' => $user,
                'password' => $password, // Return password for display
                'message' => 'User created successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update user
     */
    public function updateUser(User $user, array $data, User $updater): array
    {
        DB::beginTransaction();

        try {
            $changes = [];
            $oldValues = [];

            // Track changes
            if (isset($data['name']) && $data['name'] !== $user->name) {
                $oldValues['name'] = $user->name;
                $changes['name'] = $data['name'];
            }

            if (isset($data['email']) && $data['email'] !== $user->email) {
                $oldValues['email'] = $user->email;
                $changes['email'] = $data['email'];
            }

            if (isset($data['phone']) && $data['phone'] !== $user->phone) {
                $oldValues['phone'] = $user->phone;
                $changes['phone'] = $data['phone'];
            }

            if (isset($data['role']) && $data['role'] !== $user->role) {
                $oldValues['role'] = $user->role;
                $changes['role'] = $data['role'];
                
                // Log role change separately
                ActivityLog::createLog(
                    ActivityType::ROLE_CHANGED->value,
                    $user->id,
                    $updater->id,
                    "Role changed from {$oldValues['role']} to {$changes['role']} by {$updater->name}",
                    ['old_role' => $oldValues['role'], 'new_role' => $changes['role']]
                );
            }

            if (isset($data['is_active']) && $data['is_active'] !== $user->is_active) {
                $oldValues['is_active'] = $user->is_active;
                $changes['is_active'] = $data['is_active'];
                
                // Log activation/deactivation
                $activityType = $data['is_active'] 
                    ? ActivityType::USER_ACTIVATED->value 
                    : ActivityType::USER_DEACTIVATED->value;
                
                ActivityLog::createLog(
                    $activityType,
                    $user->id,
                    $updater->id,
                    $data['is_active'] 
                        ? "User activated by {$updater->name}" 
                        : "User deactivated by {$updater->name}",
                    null
                );
            }

            // Update user
            $user->update($changes);

            // Log general update
            if (!empty($changes)) {
                ActivityLog::createLog(
                    ActivityType::USER_UPDATED->value,
                    $user->id,
                    $updater->id,
                    "User information updated by {$updater->name}",
                    [
                        'changes' => $changes,
                        'old_values' => $oldValues,
                    ]
                );
            }

            DB::commit();

            return [
                'success' => true,
                'user' => $user->fresh(),
                'message' => 'User updated successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(User $user, User $admin): array
    {
        DB::beginTransaction();

        try {
            $newPassword = PasswordGenerator::generate(12);

            $user->update([
                'password' => Hash::make($newPassword),
                'must_change_password' => true,
            ]);

            // Log password reset
            ActivityLog::createLog(
                ActivityType::PASSWORD_RESET->value,
                $user->id,
                $admin->id,
                "Password reset by {$admin->name}",
                null
            );

            DB::commit();

            return [
                'success' => true,
                'password' => $newPassword,
                'message' => 'Password reset successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to reset password: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete user (soft delete)
     */
    public function deleteUser(User $user, User $admin): array
    {
        DB::beginTransaction();

        try {
            // Log deletion
            ActivityLog::createLog(
                ActivityType::USER_DELETED->value,
                $user->id,
                $admin->id,
                "User deleted by {$admin->name}",
                [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'user_role' => $user->role,
                ]
            );

            // Soft delete
            $user->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'User deleted successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ];
        }
    }
}