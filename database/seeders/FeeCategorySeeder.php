<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FeeCategory;
use App\Models\Grade;
use App\Models\School;

class FeeCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = School::all();

        foreach ($schools as $school) {
            echo "📚 Creating fee categories for {$school->name}...\n";

            $grades = Grade::where('school_id', $school->id)->get();

            if ($grades->isEmpty()) {
                echo "   ⚠️  No grades found for {$school->name}. Skipping...\n";
                continue;
            }

            // Common fee categories
            $categories = [
                [
                    'category_name' => 'Tuition',
                    'default_amount' => 15000,
                    'is_per_child' => true,
                    'description' => 'Regular tuition fees for academic instruction',
                    'is_active' => true,
                ],
                [
                    'category_name' => 'Transport',
                    'default_amount' => 5000,
                    'is_per_child' => true,
                    'description' => 'School bus transportation fees',
                    'is_active' => true,
                ],
                [
                    'category_name' => 'Lunch',
                    'default_amount' => 3000,
                    'is_per_child' => true,
                    'description' => 'School lunch program fees',
                    'is_active' => true,
                ],
                [
                    'category_name' => 'Sports',
                    'default_amount' => 2000,
                    'is_per_child' => true,
                    'description' => 'Sports and physical education fees',
                    'is_active' => true,
                ],
                [
                    'category_name' => 'Library',
                    'default_amount' => 1000,
                    'is_per_child' => true,
                    'description' => 'Library access and book fees',
                    'is_active' => true,
                ],
            ];

            foreach ($grades as $grade) {
                foreach ($categories as $category) {
                    // Check if category already exists for this grade
                    $exists = FeeCategory::where('school_id', $school->id)
                        ->where('grade_id', $grade->id)
                        ->where('category_name', $category['category_name'])
                        ->exists();

                    if (!$exists) {
                        FeeCategory::create([
                            'school_id' => $school->id,
                            'grade_id' => $grade->id,
                            'category_name' => $category['category_name'],
                            'default_amount' => $category['default_amount'],
                            'is_per_child' => $category['is_per_child'],
                            'description' => $category['description'],
                            'is_active' => $category['is_active'],
                        ]);
                        echo "   ✅ {$category['category_name']} for {$grade->name}\n";
                    } else {
                        echo "   ⏭️  {$category['category_name']} for {$grade->name} already exists\n";
                    }
                }
            }

            echo "\n";
        }

        echo "✅ Fee category seeding completed!\n";
    }
}

