<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Guardian;
use Illuminate\Support\Facades\Hash;

class GuardianSeeder extends Seeder
{
    public function run(): void
    {
        $guardians = [
            ['name' => 'Bashir Isse', 'gender' => 'male'],
            ['name' => 'Hassan Adam', 'gender' => 'male'],
            ['name' => 'Abdullahi Dheere', 'gender' => 'male'],
            ['name' => 'Abdirizak', 'gender' => 'male'],
            ['name' => 'Abdinasir Abubakar', 'gender' => 'male'],
            ['name' => 'Fatima Hassan', 'gender' => 'female'],
            ['name' => 'Habiba Maalim', 'gender' => 'female'],
            ['name' => 'Hodhan Mohamed', 'gender' => 'female'],
            ['name' => 'Burhaan Bade', 'gender' => 'male'],
            ['name' => 'Ismail Hersi', 'gender' => 'male'],
        ];

        foreach ($guardians as $index => $g) {
            $user = User::create([
                'name' => $g['name'],
                'email' => strtolower(str_replace(' ', '', $g['name'])) . '@example.com',
                'password' => Hash::make('password'),
                'role' => 'guardian',
            ]);

            Guardian::create([
                'user_id' => $user->id,
                'phone_number' => '0712' . str_pad($index + 100000, 6, '0', STR_PAD_LEFT),
                'address' => 'Nairobi, Kenya',
                'occupation' => $g['gender'] === 'male' ? 'Business Owner' : 'Teacher',
                'relationship' => $g['gender'] === 'male' ? 'father' : 'mother',
            ]);
        }

        $this->command->info('✅ 10 Guardians (and their Users) seeded successfully!');
    }
}
