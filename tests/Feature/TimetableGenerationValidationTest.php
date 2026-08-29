<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\School;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Room;
use App\Models\AcademicTerm;
use App\Models\TimetableTemplate;
use App\Models\LevelDayBlueprint;
use App\Models\TimetablePeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Test Suite for Timetable Generation Validation
 * 
 * Tests all 8 scenarios from Step 10:
 * 1. All requirements met
 * 2. Missing class teacher
 * 3. Missing default room
 * 4. Missing subject curriculum
 * 5. No blueprint
 * 6. No periods generated
 * 7. Multiple errors
 * 8. Warnings only
 */
class TimetableGenerationValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $school;
    protected $user;
    protected $grade;
    protected $academicTerm;
    protected $template;

    protected function setUp(): void
    {
        parent::setUp();

        // Create school
        $this->school = School::factory()->create([
            'name' => 'Test School',
        ]);

        // Create user
        $this->user = User::factory()->create([
            'school_id' => $this->school->id,
            'role' => 'admin',
        ]);

        // Create academic term
        $this->academicTerm = AcademicTerm::factory()->create([
            'school_id' => $this->school->id,
            'is_active' => true,
        ]);

        // Create grade
        $this->grade = Grade::factory()->create([
            'school_id' => $this->school->id,
            'name' => 'Grade 5',
            'level' => 'UPPER PRIMARY',
            'status' => 'active',
        ]);

        // Create template
        $this->template = TimetableTemplate::factory()->create([
            'school_id' => $this->school->id,
            'grade_id' => $this->grade->id,
            'academic_term_id' => $this->academicTerm->id,
            'name' => 'Grade 5 Timetable',
        ]);

        $this->actingAs($this->user);
    }

    /**
     * Test Scenario 1: All requirements met
     * Expected: Validation passes, generate button enabled, generation succeeds
     */
    public function test_scenario_1_all_requirements_met()
    {
        // Setup: Meet all requirements
        $this->setupAllRequirements();

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertTrue($validation['can_generate'], 'Should allow generation when all requirements met');
        $this->assertEmpty($validation['errors'], 'Should have no errors');
        $this->assertNotEmpty($validation['successes'], 'Should show successes');
        
        // Verify successes include all requirements
        $successMessages = implode(' ', $validation['successes']);
        $this->assertStringContainsString('Class teacher assigned', $successMessages);
        $this->assertStringContainsString('Default classroom assigned', $successMessages);
        $this->assertStringContainsString('Blueprint exists', $successMessages);
        $this->assertStringContainsString('Periods generated', $successMessages);
        $this->assertStringContainsString('subjects assigned', $successMessages);

        // Test generation endpoint
        $response = $this->post(route('timetables.templates.generate', $this->template));
        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /**
     * Test Scenario 2: Missing class teacher
     * Expected: Validation fails, clear error shown, button disabled
     */
    public function test_scenario_2_missing_class_teacher()
    {
        // Setup: Meet all requirements EXCEPT class teacher
        $this->setupAllRequirements();
        $this->grade->teachers()->detach(); // Remove class teacher

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation without class teacher');
        $this->assertNotEmpty($validation['errors'], 'Should have errors');
        
        // Find class teacher error
        $classTeacherError = collect($validation['errors'])->first(function ($error) {
            return is_array($error) && $error['type'] === 'class_teacher';
        });
        
        $this->assertNotNull($classTeacherError, 'Should have class teacher error');
        $this->assertEquals('No class teacher assigned', $classTeacherError['message']);
        $this->assertStringContainsString('Go to Grades', $classTeacherError['action']);
        $this->assertStringContainsString('Assign a class teacher', $classTeacherError['action']);

        // Test generation endpoint (should fail)
        $response = $this->post(route('timetables.templates.generate', $this->template));
        $response->assertRedirect();
        $response->assertSessionHas('error');
        
        $errorMessage = session('error');
        $this->assertStringContainsString('Cannot Generate Timetable', $errorMessage);
        $this->assertStringContainsString('No class teacher assigned', $errorMessage);
    }

    /**
     * Test Scenario 3: Missing default room
     * Expected: Validation fails, clear error shown, button disabled
     */
    public function test_scenario_3_missing_default_room()
    {
        // Setup: Meet all requirements EXCEPT default room
        $this->setupAllRequirements();
        $this->grade->update(['default_room_id' => null]);

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation without default room');
        
        // Find default room error
        $defaultRoomError = collect($validation['errors'])->first(function ($error) {
            return is_array($error) && $error['type'] === 'default_room';
        });
        
        $this->assertNotNull($defaultRoomError, 'Should have default room error');
        $this->assertEquals('No default classroom assigned', $defaultRoomError['message']);
        $this->assertStringContainsString('Assign a default room', $defaultRoomError['action']);
    }

    /**
     * Test Scenario 4: Missing subject curriculum
     * Expected: Validation fails, shows which subjects need configuration, button disabled
     */
    public function test_scenario_4_missing_subject_curriculum()
    {
        // Setup: Meet all requirements EXCEPT subject curriculum rules
        $this->setupAllRequirements();
        
        // Create subjects without curriculum rules
        $subject1 = Subject::factory()->create(['school_id' => $this->school->id, 'name' => 'Math']);
        $subject2 = Subject::factory()->create(['school_id' => $this->school->id, 'name' => 'English']);
        
        // grade_subject.sessions_per_week/priority are NOT NULL with DB
        // defaults (4 / 'neutral'), so a real row can never hold null here -
        // 0 is the actual reachable "invalid" case the app's own
        // canGenerateTimetable() check (sessions_per_week <= 0) guards against.
        $this->grade->subjects()->attach($subject1->id, [
            'sessions_per_week' => 0, // Invalid!
            'priority' => 'neutral',
        ]);
        $this->grade->subjects()->attach($subject2->id, [
            'sessions_per_week' => 0, // Invalid!
            'priority' => 'high',
        ]);

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation without curriculum rules');
        
        // Find curriculum rules error
        $curriculumError = collect($validation['errors'])->first(function ($error) {
            return is_array($error) && $error['type'] === 'curriculum_rules';
        });
        
        $this->assertNotNull($curriculumError, 'Should have curriculum rules error');
        $this->assertStringContainsString('subjects missing curriculum rules', $curriculumError['message']);
        $this->assertStringContainsString('Math', $curriculumError['details']); // Should show subject names
        $this->assertStringContainsString('Configure', $curriculumError['action']);
    }

    /**
     * Test Scenario 5: No blueprint
     * Expected: Validation fails, suggests creating blueprint, button disabled
     */
    public function test_scenario_5_no_blueprint()
    {
        // Setup: Meet all requirements EXCEPT blueprint
        $this->setupAllRequirements();
        LevelDayBlueprint::where('school_id', $this->school->id)->delete();

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation without blueprint');

        // Find blueprint error
        $blueprintError = collect($validation['errors'])->first(function ($error) {
            return is_array($error) && $error['type'] === 'blueprint';
        });

        $this->assertNotNull($blueprintError, 'Should have blueprint error');
        $this->assertStringContainsString('No active timetable blueprint', $blueprintError['message']);
        $this->assertStringContainsString('Create blueprint', $blueprintError['action']);
        $this->assertStringContainsString($this->grade->level, $blueprintError['message']);
    }

    /**
     * Test Scenario 6: No periods generated
     * Expected: Validation fails, suggests generating periods from blueprint, button disabled
     */
    public function test_scenario_6_no_periods_generated()
    {
        // Setup: Meet all requirements EXCEPT periods
        $this->setupAllRequirements();
        TimetablePeriod::where('school_id', $this->school->id)->delete();

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation without periods');

        // Find periods error
        $periodsError = collect($validation['errors'])->first(function ($error) {
            return is_array($error) && $error['type'] === 'periods';
        });

        $this->assertNotNull($periodsError, 'Should have periods error');
        $this->assertStringContainsString('No periods generated', $periodsError['message']);
        $this->assertStringContainsString('Generate Periods', $periodsError['action']);
    }

    /**
     * Test Scenario 7: Multiple errors
     * Expected: Shows ALL errors at once, not one-by-one
     */
    public function test_scenario_7_multiple_errors()
    {
        // Setup: Create grade with MULTIPLE missing requirements
        // Don't call setupAllRequirements() - start from scratch

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertFalse($validation['can_generate'], 'Should block generation with multiple errors');
        // The "periods" check only runs once a blueprint exists (you can't
        // check for periods generated from a blueprint that isn't there),
        // so with nothing set up, blueprint and periods errors can't both
        // appear - the maximum here is 4 errors, not 5.
        $this->assertGreaterThanOrEqual(4, count($validation['errors']), 'Should show ALL errors at once');

        // Verify all error types are present
        $errorTypes = collect($validation['errors'])->pluck('type')->toArray();

        $this->assertContains('class_teacher', $errorTypes, 'Should include class teacher error');
        $this->assertContains('default_room', $errorTypes, 'Should include default room error');
        $this->assertContains('subjects', $errorTypes, 'Should include subjects error');
        $this->assertContains('blueprint', $errorTypes, 'Should include blueprint error');

        // Test generation endpoint (should show all errors)
        $response = $this->post(route('timetables.templates.generate', $this->template));
        $response->assertRedirect();
        $response->assertSessionHas('error');

        $errorMessage = session('error');
        $this->assertStringContainsString('Missing Requirements', $errorMessage);
        $this->assertStringContainsString('No class teacher', $errorMessage);
        $this->assertStringContainsString('No default classroom', $errorMessage);
        $this->assertStringContainsString('No subjects assigned', $errorMessage);
    }

    /**
     * Test Scenario 8: Warnings only
     * Expected: Allow generation, show warnings clearly, user can proceed
     */
    public function test_scenario_8_warnings_only()
    {
        // Setup: Meet all requirements, but add conditions that trigger warnings
        $this->setupAllRequirements();

        // Add teacher without subject specializations (triggers warning)
        $teacher = Teacher::factory()->create(['school_id' => $this->school->id]);
        $this->grade->teachers()->attach($teacher->id, ['is_class_teacher' => false]);

        // Test validation
        $validation = $this->grade->canGenerateTimetable();

        // Assertions
        $this->assertTrue($validation['can_generate'], 'Should ALLOW generation with only warnings');
        $this->assertEmpty($validation['errors'], 'Should have NO errors');
        $this->assertNotEmpty($validation['warnings'], 'Should have warnings');

        // Verify warning content
        $warningMessages = collect($validation['warnings'])->map(function ($warning) {
            return is_array($warning) ? $warning['message'] : $warning;
        })->implode(' ');

        $this->assertStringContainsString('subject specializations', $warningMessages);

        // Test generation endpoint (should succeed despite warnings)
        $response = $this->post(route('timetables.templates.generate', $this->template));
        $response->assertRedirect();
        $response->assertSessionHas('success'); // Should succeed!
    }

    /**
     * Test: Multi-tenant data isolation
     * Expected: Validation only checks data from same school
     */
    public function test_multi_tenant_data_isolation()
    {
        // Create another school with complete setup
        $otherSchool = School::factory()->create(['name' => 'Other School']);

        $otherGrade = Grade::factory()->create([
            'school_id' => $otherSchool->id,
            'level' => $this->grade->level, // Same level
        ]);

        // Setup complete requirements for OTHER school
        $otherTeacher = Teacher::factory()->create(['school_id' => $otherSchool->id]);
        $otherGrade->teachers()->attach($otherTeacher->id, ['is_class_teacher' => true]);

        $otherRoom = Room::factory()->create(['school_id' => $otherSchool->id]);
        $otherGrade->update(['default_room_id' => $otherRoom->id]);

        $otherBlueprint = LevelDayBlueprint::factory()->create([
            'school_id' => $otherSchool->id,
            'level' => $otherGrade->level,
            'is_active' => true,
        ]);

        TimetablePeriod::factory()->count(5)->create([
            'school_id' => $otherSchool->id,
            'grade_level' => $otherGrade->level,
            'generated_from_blueprint_id' => $otherBlueprint->id,
        ]);

        // Test validation for OUR grade (should still fail)
        $validation = $this->grade->canGenerateTimetable();

        // Assertions: Should NOT use other school's data
        $this->assertFalse($validation['can_generate'], 'Should not use other school\'s data');
        $this->assertNotEmpty($validation['errors'], 'Should have errors for our school');

        // Verify errors are about OUR school, not other school
        $errorMessages = collect($validation['errors'])->map(function ($error) {
            return is_array($error) ? $error['message'] : $error;
        })->implode(' ');

        $this->assertStringContainsString('No class teacher', $errorMessages);
        $this->assertStringContainsString('No default classroom', $errorMessages);
    }

    /**
     * Test: Frontend receives validation prop
     * Expected: Grid view receives generationValidation prop
     */
    public function test_frontend_receives_validation_prop()
    {
        // Setup: Create grade with missing requirements

        // The "grid" route now just redirects to "show" (grid is the
        // default view rendered by show() - see
        // TimetableTemplateController::grid()'s own docblock).
        $response = $this->get(route('timetables.templates.show', $this->template));

        $response->assertStatus(200);

        // Verify Inertia props include generationValidation
        $response->assertInertia(fn ($page) =>
            $page->has('generationValidation')
                ->where('generationValidation.can_generate', false)
                ->has('generationValidation.errors')
                ->has('generationValidation.warnings')
                ->has('generationValidation.successes')
        );
    }

    /**
     * Helper: Setup all requirements for successful generation
     */
    protected function setupAllRequirements()
    {
        // 1. Assign class teacher
        $teacher = Teacher::factory()->create(['school_id' => $this->school->id]);
        $this->grade->teachers()->attach($teacher->id, ['is_class_teacher' => true]);

        // 2. Assign default room
        $room = Room::factory()->create(['school_id' => $this->school->id]);
        $this->grade->update(['default_room_id' => $room->id]);

        // 3. Assign subjects with curriculum rules
        $subject = Subject::factory()->create(['school_id' => $this->school->id]);
        $this->grade->subjects()->attach($subject->id, [
            'sessions_per_week' => 5,
            'priority' => 'high',
            'must_be_daily' => false,
            'can_repeat_same_day' => false,
        ]);

        // 4. Create active blueprint
        $blueprint = LevelDayBlueprint::factory()->create([
            'school_id' => $this->school->id,
            'level' => $this->grade->level,
            'is_active' => true,
        ]);

        // 5. Generate periods from blueprint
        TimetablePeriod::factory()->count(5)->create([
            'school_id' => $this->school->id,
            'grade_level' => $this->grade->level,
            'generated_from_blueprint_id' => $blueprint->id,
        ]);
    }
}


