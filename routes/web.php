<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DemoBookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentImportController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\GuardianImportController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherTimetableController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\StreamController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ExamResultController;
use App\Http\Controllers\GuardianAttendanceController;
use App\Http\Controllers\GuardianChildrenController;
use App\Http\Controllers\GuardianQuranHomeworkController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DocumentCategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\Admin\AdminPasswordController;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\QuranHomeworkController;
use App\Http\Controllers\QuranScheduleController;
use App\Http\Controllers\FeeManagementController;
use App\Http\Controllers\TransportRouteController;
use App\Http\Controllers\TuitionFeeController;
use App\Http\Controllers\UniversalFeeController;
use App\Http\Controllers\GuardianFeePreferenceController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Settings\SchoolProfileController;
use App\Http\Controllers\Settings\AcademicYearController;
use App\Http\Controllers\Settings\AcademicTermController;
use App\Http\Controllers\Settings\SystemPreferencesController;
use App\Http\Controllers\TimetableTemplateController;
use App\Http\Controllers\TimetablePeriodController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\TimetableSlotController;
use App\Http\Controllers\TeacherAvailabilityController;
use App\Http\Controllers\LevelDayBlueprintController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\AccidentReportController;
use App\Http\Controllers\IncidentReportController;
use App\Models\Grade;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application.
| All school management functionality is now in this file.
|
*/

// Public Home Page
Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();

        // Redirect super admins to super admin dashboard
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard');
        }

        // Redirect school users to school dashboard
        return redirect()->route('dashboard');
    }
    return Inertia::render('Home');
})->name('home');

// Demo Booking Routes
Route::get('/demo-booking', function () {
    return Inertia::render('DemoBooking');
})->name('demo.booking');

Route::post('/demo-booking', [DemoBookingController::class, 'submit'])
    ->name('demo.booking.submit');

Route::get('/demo-booking/success', function () {
    return Inertia::render('DemoSuccess');
})->name('demo.success');

// Legal Pages
Route::get('/privacy-policy', function () {
    return Inertia::render('PrivacyPolicy');
})->name('privacy-policy');

Route::get('/terms-of-service', function () {
    return Inertia::render('TermsOfService');
})->name('terms-of-service');

// School Inactive Page
Route::get('/school-inactive', function () {
    return Inertia::render('Errors/SchoolInactive', [
        'message' => 'Your school subscription has expired or been deactivated. Please contact your administrator.'
    ]);
})->name('school.inactive');

// All authenticated school routes (excludes super admins)
Route::middleware(['auth', 'school.admin', 'school.active'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //^ Grade Routes
    Route::middleware(['user.active', 'permission:grades.view'])->group(function () {
        Route::get('/grades', [GradeController::class, 'index'])->name('grades.index');
    });

    Route::middleware(['user.active', 'permission:grades.create'])->group(function () {
        Route::get('/grades/create', [GradeController::class, 'create'])->name('grades.create');
        Route::post('/grades', [GradeController::class, 'store'])->name('grades.store');
    });

    Route::middleware(['user.active', 'permission:grades.view'])->group(function () {
        Route::get('/grades/{grade}', [GradeController::class, 'show'])->name('grades.show');
    });

    Route::middleware(['user.active', 'permission:grades.update'])->group(function () {
        Route::get('/grades/{grade}/edit', [GradeController::class, 'edit'])->name('grades.edit');
        Route::put('/grades/{grade}', [GradeController::class, 'update'])->name('grades.update');
        Route::post('/grades/{grade}/restore', [GradeController::class, 'restore'])->name('grades.restore');
        Route::post('/grades/{grade}/assign-teacher', [GradeController::class, 'assignTeacher'])->name('grades.assign-teacher');
        Route::delete('/grades/{grade}/remove-teacher/{teacher}', [GradeController::class, 'removeTeacher'])->name('grades.remove-teacher');
        Route::patch('/grades/{grade}/update-teacher/{teacher}', [GradeController::class, 'updateTeacherAssignment'])->name('grades.update-teacher');
    });

    // Curriculum mapping is a narrower carve-out than grades.update — Head
    // Teacher holds grades.manage-curriculum without the rest of grade
    // editing (see GradePolicy::manageCurriculum()).
    Route::middleware(['user.active', 'permission:grades.update|grades.manage-curriculum'])->group(function () {
        Route::get('/grades/{grade}/curriculum', [GradeController::class, 'manageCurriculum'])->name('grades.curriculum.manage');
        Route::post('/grades/{grade}/curriculum', [GradeController::class, 'updateCurriculum'])->name('grades.curriculum.update');
    });

    Route::middleware(['user.active', 'permission:grades.delete'])->group(function () {
        Route::delete('/grades/{grade}', [GradeController::class, 'destroy'])->name('grades.destroy');
    });

    //^ Student Routes
    Route::middleware(['user.active', 'permission:students.view'])->group(function () {
        Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    });

    Route::middleware(['user.active', 'permission:students.create'])->group(function () {
        Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
        Route::post('/students', [StudentController::class, 'store'])->name('students.store');
        Route::get('/students/import/template', [StudentImportController::class, 'downloadTemplate'])->name('students.import.template');
        Route::post('/students/import/preview', [StudentImportController::class, 'preview'])->name('students.import.preview');
        Route::post('/students/import', [StudentImportController::class, 'import'])->name('students.import');
    });

    Route::middleware(['user.active', 'permission:students.view'])->group(function () {
        Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    });

    Route::middleware(['user.active', 'permission:students.update'])->group(function () {
        Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::patch('/students/{student}/deactivate', [StudentController::class, 'deactivate'])->name('students.deactivate');
        Route::patch('/students/{student}/reactivate', [StudentController::class, 'reactivate'])->name('students.reactivate');
    });

    Route::middleware(['user.active', 'permission:students.delete'])->group(function () {
        Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    });

    //^ Guardian Routes
    Route::middleware(['user.active', 'permission:guardians.view'])->group(function () {
        Route::get('/guardians', [GuardianController::class, 'index'])->name('guardians.index');
    });

    Route::middleware(['user.active', 'permission:guardians.view-inactive'])->group(function () {
        Route::get('/guardians/inactive', [GuardianController::class, 'inactive'])->name('guardians.inactive');
    });

    Route::middleware(['user.active', 'permission:guardians.create'])->group(function () {
        Route::get('/guardians/create', [GuardianController::class, 'create'])->name('guardians.create');
        Route::post('/guardians', [GuardianController::class, 'store'])->name('guardians.store');
        Route::get('/guardians/import/template', [GuardianImportController::class, 'downloadTemplate'])->name('guardians.import.template');
        Route::post('/guardians/import/preview', [GuardianImportController::class, 'preview'])->name('guardians.import.preview');
        Route::post('/guardians/import', [GuardianImportController::class, 'import'])->name('guardians.import');
    });

    Route::middleware(['user.active', 'permission:guardians.view'])->group(function () {
        Route::get('/guardians/{guardian}', [GuardianController::class, 'show'])->name('guardians.show');
    });

    Route::middleware(['user.active', 'permission:guardian-children.view'])->group(function () {
        Route::get('/guardian/children', [GuardianChildrenController::class, 'index'])->name('guardian.children');
    });

    Route::middleware(['user.active', 'permission:attendance.view-own-children'])->group(function () {
        Route::get('/guardian/attendance', [GuardianAttendanceController::class, 'index'])->name('guardian.attendance');
    });

    // Guardian Quran Tracking (read-only, madrasah only)
    Route::middleware(['user.active', 'permission:quran-homework.view-own', 'madrasah.only'])->group(function () {
        Route::get('/guardian/quran-homework', [GuardianQuranHomeworkController::class, 'index'])->name('guardian.quran-homework');
    });

    Route::middleware(['user.active', 'permission:guardians.update'])->group(function () {
        Route::get('/guardians/{guardian}/edit', [GuardianController::class, 'edit'])->name('guardians.edit');
        Route::put('/guardians/{guardian}', [GuardianController::class, 'update'])->name('guardians.update');
        Route::patch('/guardians/{guardian}/deactivate', [GuardianController::class, 'deactivate'])->name('guardians.deactivate');
        Route::patch('/guardians/{guardian}/reactivate', [GuardianController::class, 'reactivate'])->name('guardians.reactivate');
    });

    Route::middleware(['user.active', 'permission:guardians.delete'])->group(function () {
        Route::delete('/guardians/{guardian}', [GuardianController::class, 'destroy'])->name('guardians.destroy');
    });

    //^ Teacher Routes
    Route::middleware(['user.active', 'permission:teachers.create'])->group(function () {
        Route::get('/teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
    });

    Route::middleware(['user.active', 'permission:teachers.view'])->group(function () {
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
    });

    Route::middleware(['user.active', 'permission:teachers.update'])->group(function () {
        Route::get('/teachers/{teacher}/edit', [TeacherController::class, 'edit'])->name('teachers.edit');
        Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
    });

    Route::middleware(['user.active', 'permission:teachers.delete'])->group(function () {
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    //^ USER MANAGEMENT ROUTES
    Route::middleware(['user.active', 'permission:users.create'])->group(function () {
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
    });

    Route::middleware(['user.active', 'permission:users.view'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    Route::middleware(['user.active', 'permission:users.update'])->group(function () {
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    });

    Route::middleware(['user.active', 'permission:users.delete'])->group(function () {
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::middleware(['user.active', 'permission:users.reset-password'])->group(function () {
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    });

    Route::middleware(['user.active', 'permission:users.toggle-status'])->group(function () {
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });

    //^ Attendance Routes
    Route::middleware(['user.active', 'permission:attendance.view'])->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/attendance/reports', [AttendanceController::class, 'reports'])->name('attendance.reports');
    });

    Route::middleware(['user.active', 'permission:attendance.create'])->group(function () {
        Route::post('/attendance/mark', [AttendanceController::class, 'mark'])->name('attendance.mark');
    });

    Route::get('/attendance/student/{student}', [AttendanceController::class, 'studentHistory'])->name('attendance.student-history');

    //^ Subjects Routes
    Route::middleware(['user.active', 'permission:subjects.create'])->group(function () {
        Route::get('/subjects/create', [SubjectController::class, 'create'])->name('subjects.create');
        Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
    });

    Route::middleware(['user.active', 'permission:subjects.view'])->group(function () {
        Route::get('/subjects', [SubjectController::class, 'index'])->name('subjects.index');
        Route::get('/subjects/{subject}', [SubjectController::class, 'show'])->name('subjects.show');
    });

    Route::middleware(['user.active', 'permission:subjects.update'])->group(function () {
        Route::get('/subjects/{subject}/edit', [SubjectController::class, 'edit'])->name('subjects.edit');
        Route::put('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::post('/subjects/{subject}/assign-grades', [SubjectController::class, 'assignGrades'])->name('subjects.assign-grades');
    });

    Route::middleware(['user.active', 'permission:subjects.delete'])->group(function () {
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
    });

    //^ Stream Routes
    Route::middleware(['user.active', 'permission:streams.create'])->group(function () {
        Route::get('/streams/create', [StreamController::class, 'create'])->name('streams.create');
        Route::post('/streams', [StreamController::class, 'store'])->name('streams.store');
    });

    Route::middleware(['user.active', 'permission:streams.view'])->group(function () {
        Route::get('/streams', [StreamController::class, 'index'])->name('streams.index');
        Route::get('/streams/{stream}', [StreamController::class, 'show'])->name('streams.show');
    });

    Route::middleware(['user.active', 'permission:streams.update'])->group(function () {
        Route::get('/streams/{stream}/edit', [StreamController::class, 'edit'])->name('streams.edit');
        Route::put('/streams/{stream}', [StreamController::class, 'update'])->name('streams.update');
        Route::post('/streams/{stream}/unlink', [StreamController::class, 'unlink'])->name('streams.unlink');
    });

    Route::middleware(['user.active', 'permission:streams.delete'])->group(function () {
        Route::delete('/streams/{stream}', [StreamController::class, 'destroy'])->name('streams.destroy');
    });

    //^ Exams Routes
    Route::middleware(['user.active', 'permission:exams.create'])->group(function () {
        Route::get('/exams/create', [ExamController::class, 'create'])->name('exams.create');
        Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
    });

    Route::middleware(['user.active', 'permission:exams.view'])->group(function () {
        Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
        Route::get('/exams/{exam}', [ExamController::class, 'show'])->name('exams.show');
    });

    Route::middleware(['user.active', 'permission:exams.update'])->group(function () {
        Route::get('/exams/{exam}/edit', [ExamController::class, 'edit'])->name('exams.edit');
        Route::put('/exams/{exam}', [ExamController::class, 'update'])->name('exams.update');
    });

    Route::middleware(['user.active', 'permission:exams.delete'])->group(function () {
        Route::delete('/exams/{exam}', [ExamController::class, 'destroy'])->name('exams.destroy');
    });

    //^ Exam Results Routes
    Route::middleware(['user.active', 'permission:exam-results.view'])->group(function () {
        Route::get('/exams/{exam}/results', [ExamResultController::class, 'index'])->name('exam-results.index');
    });

    Route::middleware(['user.active', 'permission:exam-results.create'])->group(function () {
        Route::post('/exams/{exam}/results', [ExamResultController::class, 'store'])->name('exam-results.store');
    });

    Route::middleware(['user.active', 'permission:exam-results.update'])->group(function () {
        Route::put('/exam-results/{examResult}', [ExamResultController::class, 'update'])->name('exam-results.update');
    });

    //^ Reports Routes
    Route::middleware(['user.active', 'permission:reports.view'])->group(function () {
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
    });

    // saveComment/lockComment route-level gate is intentionally coarse
    // (admin OR teacher, matching the old role:admin,teacher exactly) —
    // ReportController's own inline logic (untouched, see worksheet Phase 2
    // disagreement #10) does the real per-comment-type, class-teacher-scoped
    // enforcement that a route permission can't express.
    Route::middleware(['user.active', 'permission:report-comments.create|reports.headteacher-comment'])->group(function () {
        Route::post('/reports/students/{student}/comments', [ReportController::class, 'saveComment'])->name('reports.saveComment');
        Route::post('/reports/students/{student}/comments/lock', [ReportController::class, 'lockComment'])->name('reports.lockComment');
    });

    Route::middleware(['user.active', 'permission:report-comments.unlock'])->group(function () {
        Route::post('/reports/students/{student}/comments/unlock', [ReportController::class, 'unlockComment'])->name('reports.unlockComment');
    });

    //^ School Settings Routes
    Route::middleware(['user.active', 'permission:settings.manage'])->group(function () {
        Route::get('/settings/academic', [SchoolSettingController::class, 'academic'])->name('settings.academic');
        Route::post('/settings/academic', [SchoolSettingController::class, 'updateAcademic'])->name('settings.academic.update');
    });

    //^ Blueprint Routes (Admin only)
    Route::middleware(['user.active', 'permission:timetable-dashboard.view'])->group(function () {
        Route::get('/blueprints', [LevelDayBlueprintController::class, 'index'])->name('blueprints.index');
        Route::get('/blueprints/create', [LevelDayBlueprintController::class, 'create'])->name('blueprints.create');
        Route::post('/blueprints', [LevelDayBlueprintController::class, 'store'])->name('blueprints.store');
        Route::get('/blueprints/{blueprint}', [LevelDayBlueprintController::class, 'show'])->name('blueprints.show');
        Route::get('/blueprints/{blueprint}/edit', [LevelDayBlueprintController::class, 'edit'])->name('blueprints.edit');
        Route::put('/blueprints/{blueprint}', [LevelDayBlueprintController::class, 'update'])->name('blueprints.update');
        Route::delete('/blueprints/{blueprint}', [LevelDayBlueprintController::class, 'destroy'])->name('blueprints.destroy');
        Route::post('/blueprints/{blueprint}/toggle-active', [LevelDayBlueprintController::class, 'toggleActive'])->name('blueprints.toggle-active');

        // Period generation routes
        Route::post('/blueprints/{blueprint}/generate-periods', [LevelDayBlueprintController::class, 'generatePeriods'])->name('blueprints.generate-periods');
        Route::post('/blueprints/{blueprint}/regenerate-periods', [LevelDayBlueprintController::class, 'regeneratePeriods'])->name('blueprints.regenerate-periods');
        Route::get('/blueprints/{blueprint}/generation-status', [LevelDayBlueprintController::class, 'generationStatus'])->name('blueprints.generation-status');

        // Bulk delete periods by level
        Route::post('/blueprints/bulk-delete-preview', [LevelDayBlueprintController::class, 'bulkDeletePreview'])->name('blueprints.bulk-delete-preview');
        Route::post('/blueprints/bulk-delete-by-level', [LevelDayBlueprintController::class, 'bulkDeleteByLevel'])->name('blueprints.bulk-delete-by-level');
    });

    //^ Timetable Routes
    Route::prefix('timetables')->group(function () {
        // Teacher's Personal Timetable (Teachers only - strict data partitioning)
        Route::middleware(['user.active', 'permission:timetable-schedule.view-own'])->group(function () {
            Route::get('/my-timetable', [TeacherTimetableController::class, 'index'])->name('timetables.my-timetable');
        });

        // Timetable Dashboard (Admin only)
        Route::middleware(['user.active', 'permission:timetable-dashboard.view'])->group(function () {
            Route::get('/dashboard', [TimetableTemplateController::class, 'dashboard'])->name('timetables.dashboard');
        });

        // Timetable Templates (Admin only - teachers should not access templates)
        Route::middleware(['user.active', 'permission:timetable-templates.manage'])->group(function () {
            Route::get('/templates', [TimetableTemplateController::class, 'index'])->name('timetables.templates.index');
            Route::get('/templates/create', [TimetableTemplateController::class, 'create'])->name('timetables.templates.create');
            Route::get('/templates/grade/{grade}/select-stream', [TimetableTemplateController::class, 'selectStream'])->name('timetables.templates.select-stream');
            Route::get('/templates/grade/{grade}/create', [TimetableTemplateController::class, 'createWithStream'])->name('timetables.templates.create-with-stream');
            Route::post('/templates', [TimetableTemplateController::class, 'store'])->name('timetables.templates.store');
            Route::get('/templates/{template}', [TimetableTemplateController::class, 'show'])->name('timetables.templates.show');
            Route::get('/templates/{template}/grid', [TimetableTemplateController::class, 'grid'])->name('timetables.templates.grid');
            Route::get('/templates/{template}/compliance', [TimetableTemplateController::class, 'complianceReport'])->name('timetables.templates.compliance');
            Route::get('/templates/{template}/edit', [TimetableTemplateController::class, 'edit'])->name('timetables.templates.edit');
            Route::put('/templates/{template}', [TimetableTemplateController::class, 'update'])->name('timetables.templates.update');
            Route::delete('/templates/{template}', [TimetableTemplateController::class, 'destroy'])->name('timetables.templates.destroy');
            Route::post('/templates/{template}/publish', [TimetableTemplateController::class, 'publish'])->name('timetables.templates.publish');
            Route::post('/templates/{template}/archive', [TimetableTemplateController::class, 'archive'])->name('timetables.templates.archive');
            Route::post('/templates/{template}/unarchive', [TimetableTemplateController::class, 'unarchive'])->name('timetables.templates.unarchive');
            Route::delete('/templates/{template}/delete-archived', [TimetableTemplateController::class, 'deleteArchived'])->name('timetables.templates.delete-archived');
            Route::get('/grades/{grade}/validate-generation', [TimetableTemplateController::class, 'validateGeneration'])->name('grades.validate-generation');
            Route::post('/templates/{template}/generate', [TimetableTemplateController::class, 'generate'])->name('timetables.templates.generate');
            Route::post('/templates/{template}/bulk-update-teacher', [TimetableTemplateController::class, 'bulkUpdateTeacher'])->name('timetables.templates.bulk-update-teacher');
            Route::post('/templates/{template}/regenerate', [TimetableTemplateController::class, 'regenerate'])->name('timetables.templates.regenerate');
        });

        // Timetable Periods (Admin only for create/edit/delete, Teachers can view)
        Route::middleware(['user.active', 'permission:timetable-periods.manage'])->group(function () {
            Route::get('/periods/create', [TimetablePeriodController::class, 'create'])->name('timetables.periods.create');
            Route::post('/periods', [TimetablePeriodController::class, 'store'])->name('timetables.periods.store');
            Route::get('/periods/{period}/edit', [TimetablePeriodController::class, 'edit'])->name('timetables.periods.edit');
            Route::put('/periods/{period}', [TimetablePeriodController::class, 'update'])->name('timetables.periods.update');
            Route::delete('/periods/{period}', [TimetablePeriodController::class, 'destroy'])->name('timetables.periods.destroy');
        });

        Route::middleware(['user.active', 'permission:timetable-periods.view'])->group(function () {
            Route::get('/periods', [TimetablePeriodController::class, 'index'])->name('timetables.periods.index');
            Route::get('/periods/{period}', [TimetablePeriodController::class, 'show'])->name('timetables.periods.show');
        });

        // Rooms (Admin only for create/edit/delete, Teachers can view)
        Route::middleware(['user.active', 'permission:timetable-rooms.manage'])->group(function () {
            Route::get('/rooms/create', [RoomController::class, 'create'])->name('timetables.rooms.create');
            Route::post('/rooms', [RoomController::class, 'store'])->name('timetables.rooms.store');
            Route::get('/rooms/{room}/edit', [RoomController::class, 'edit'])->name('timetables.rooms.edit');
            Route::put('/rooms/{room}', [RoomController::class, 'update'])->name('timetables.rooms.update');
            Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])->name('timetables.rooms.destroy');
        });

        Route::middleware(['user.active', 'permission:timetable-rooms.view'])->group(function () {
            Route::get('/rooms', [RoomController::class, 'index'])->name('timetables.rooms.index');
            Route::get('/rooms/{room}', [RoomController::class, 'show'])->name('timetables.rooms.show');
        });

        // Timetable Slots (Admin only for create/edit/delete, Teachers can view)
        Route::middleware(['user.active', 'permission:timetable-slots.manage'])->group(function () {
            Route::get('/slots/create', [TimetableSlotController::class, 'create'])->name('timetables.slots.create');
            Route::post('/slots', [TimetableSlotController::class, 'store'])->name('timetables.slots.store');
            Route::get('/slots/{slot}/edit', [TimetableSlotController::class, 'edit'])->name('timetables.slots.edit');
            Route::put('/slots/{slot}', [TimetableSlotController::class, 'update'])->name('timetables.slots.update');
            Route::delete('/slots/{slot}', [TimetableSlotController::class, 'destroy'])->name('timetables.slots.destroy');
        });

        Route::middleware(['user.active', 'permission:timetable-slots.view'])->group(function () {
            Route::get('/slots', [TimetableSlotController::class, 'index'])->name('timetables.slots.index');
            Route::get('/slots/{slot}', [TimetableSlotController::class, 'show'])->name('timetables.slots.show');
        });

        // Teacher Availability (Teachers can manage their own, Admins can manage all)
        Route::middleware(['user.active', 'permission:timetable-availability.manage'])->group(function () {
            Route::get('/availability', [TeacherAvailabilityController::class, 'index'])->name('timetables.availability.index');
            Route::get('/availability/create', [TeacherAvailabilityController::class, 'create'])->name('timetables.availability.create');
            Route::post('/availability', [TeacherAvailabilityController::class, 'store'])->name('timetables.availability.store');
            Route::get('/availability/{availability}', [TeacherAvailabilityController::class, 'show'])->name('timetables.availability.show');
            Route::get('/availability/{availability}/edit', [TeacherAvailabilityController::class, 'edit'])->name('timetables.availability.edit');
            Route::put('/availability/{availability}', [TeacherAvailabilityController::class, 'update'])->name('timetables.availability.update');
            Route::delete('/availability/{availability}', [TeacherAvailabilityController::class, 'destroy'])->name('timetables.availability.destroy');
        });
    });

    //^ API endpoint for subjects by grade
    Route::get('/api/grades/{grade}/subjects', function (Grade $grade) {
        return $grade->subjects()->where('status', 'active')->get();
    });

    //^ Quran Module Routes (Madrasah schools only)
    Route::middleware(['madrasah.only'])->group(function () {
        // Quran Dashboard (all roles)
        Route::middleware(['user.active', 'permission:quran-dashboard.view'])->group(function () {
            Route::get('/quran', [QuranController::class, 'index'])->name('quran.index');
        });

        // Admin and Teacher only routes (must come BEFORE wildcard routes)
        Route::middleware(['user.active', 'permission:quran-homework.view'])->group(function () {
            Route::get('/quran-homework', [QuranHomeworkController::class, 'index'])->name('quran-homework.index');

            Route::get('/api/quran/surah/{surahNumber}', [QuranHomeworkController::class, 'getSurahDetails'])->name('api.quran.surah');
            Route::get('/api/quran/page/{pageNumber}/image', [QuranHomeworkController::class, 'getPageImage'])->name('api.quran.page-image');
            Route::get('/api/quran/page/{pageNumber}/details', [QuranHomeworkController::class, 'getPageDetails'])->name('api.quran.page-details');
            Route::get('/api/quran/page/{pageNumber}/verses', [QuranHomeworkController::class, 'getPageVerses'])->name('api.quran.page-verses');
            Route::get('/api/quran/page-range', [QuranHomeworkController::class, 'getPageRange'])->name('api.quran.page-range');
            Route::get('/api/quran/juz', [QuranHomeworkController::class, 'getAllJuz'])->name('api.quran.juz');
            Route::get('/api/quran/verse/{surahNumber}/{verseNumber}', [QuranHomeworkController::class, 'getVerseText'])->name('api.quran.verse');
            Route::get('/api/quran/homework/next-from/{student}', [QuranHomeworkController::class, 'nextFrom'])->name('api.quran.homework.next-from');
        });

        Route::middleware(['user.active', 'permission:quran-homework.create'])->group(function () {
            Route::get('/quran-homework/create', [QuranHomeworkController::class, 'create'])->name('quran-homework.create');
            Route::post('/quran-homework', [QuranHomeworkController::class, 'store'])->name('quran-homework.store');
        });

        Route::middleware(['user.active', 'permission:quran-homework.update'])->group(function () {
            Route::get('/quran-homework/{quranHomework}/edit', [QuranHomeworkController::class, 'edit'])->name('quran-homework.edit');
            Route::put('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'update'])->name('quran-homework.update');
            Route::delete('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'destroy'])->name('quran-homework.destroy');
            Route::post('/quran-homework/{quranHomework}/grade', [QuranHomeworkController::class, 'grade'])->name('quran-homework.grade');
            Route::post('/quran-homework/{quranHomework}/mark-ungraded', [QuranHomeworkController::class, 'markUngraded'])->name('quran-homework.mark-ungraded');
        });

        // Read-only routes (admin, teacher, guardian) - wildcard routes come AFTER specific routes
        Route::middleware(['user.active', 'permission:quran-homework.view|quran-homework.view-own'])->group(function () {
            Route::get('/quran-homework/student/{student}/report', [QuranHomeworkController::class, 'studentReport'])->name('quran-homework.student-report');
            Route::get('/quran-homework/student/{student}', [QuranHomeworkController::class, 'studentHomework'])->name('quran-homework.student');
            Route::get('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'show'])->name('quran-homework.show');
        });

        // Quran Schedule Routes (admin and teacher only)
        Route::middleware(['user.active', 'permission:quran-schedule.view-all'])->group(function () {
            Route::get('/quran-schedule', [QuranScheduleController::class, 'index'])->name('quran-schedule.index');
        });

        Route::middleware(['user.active', 'permission:quran-schedule.create'])->group(function () {
            Route::get('/quran-schedule/create', [QuranScheduleController::class, 'create'])->name('quran-schedule.create');
            Route::post('/quran-schedule', [QuranScheduleController::class, 'store'])->name('quran-schedule.store');
        });

        Route::middleware(['user.active', 'permission:quran-schedule.update'])->group(function () {
            Route::get('/quran-schedule/{quranSchedule}/edit', [QuranScheduleController::class, 'edit'])->name('quran-schedule.edit');
            Route::put('/quran-schedule/{quranSchedule}', [QuranScheduleController::class, 'update'])->name('quran-schedule.update');
            Route::post('/quran-schedule/{quranSchedule}/activate', [QuranScheduleController::class, 'activate'])->name('quran-schedule.activate');
            Route::post('/quran-schedule/{quranSchedule}/deactivate', [QuranScheduleController::class, 'deactivate'])->name('quran-schedule.deactivate');
            Route::delete('/quran-schedule/{quranSchedule}', [QuranScheduleController::class, 'destroy'])->name('quran-schedule.destroy');
        });

        // Quran Schedule read-only routes (admin, teacher, guardian) — the
        // Policy applies guardian's own-children scoping on top of this.
        Route::middleware(['user.active', 'permission:quran-schedule.view'])->group(function () {
            Route::get('/quran-schedule/{quranSchedule}', [QuranScheduleController::class, 'show'])->name('quran-schedule.show');
        });
    });

    //^ Documents Routes
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/documents/create', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::get('/documents/{document}/edit', [DocumentController::class, 'edit'])->name('documents.edit');
    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview'])->name('documents.preview');

    //^ User Impersonation Routes
    Route::impersonate();

    //^ Document Categories Routes (Admin only)
    Route::middleware(['user.active', 'permission:document-categories.manage'])->group(function () {
        Route::get('/document-categories/create', [DocumentCategoryController::class, 'create'])->name('document-categories.create');
        Route::post('/document-categories', [DocumentCategoryController::class, 'store'])->name('document-categories.store');
        Route::get('/document-categories/{documentCategory}/edit', [DocumentCategoryController::class, 'edit'])->name('document-categories.edit');
        Route::put('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'update'])->name('document-categories.update');
        Route::delete('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'destroy'])->name('document-categories.destroy');
    });

    Route::middleware(['user.active', 'permission:document-categories.view'])->group(function () {
        Route::get('/document-categories', [DocumentCategoryController::class, 'index'])->name('document-categories.index');
        Route::get('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'show'])->name('document-categories.show');
    });

    //^ Document Verification Routes (Admin only)
    Route::middleware(['user.active', 'permission:documents.verify'])->group(function () {
        Route::post('/documents/{document}/verify', [DocumentController::class, 'verify'])->name('documents.verify');
    });

    Route::middleware(['user.active', 'permission:documents.reject'])->group(function () {
        Route::post('/documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');
    });

    //^ Admin Password Management
    Route::middleware(['user.active', 'permission:users.reset-password'])->prefix('admin')->group(function () {
        Route::post('/users/{user}/reset-password', [AdminPasswordController::class, 'generateTemporaryPassword'])
            ->name('admin.users.reset-password');
    });

    //^ Settings Routes (Admin only)
    Route::middleware(['user.active', 'permission:settings.manage'])->prefix('admin/settings')->group(function () {
        // School Profile
        Route::get('/profile', [SchoolProfileController::class, 'index'])->name('settings.profile');
        Route::put('/profile', [SchoolProfileController::class, 'update'])->name('settings.profile.update');
        Route::delete('/profile/logo', [SchoolProfileController::class, 'deleteLogo'])->name('settings.profile.delete-logo');

        // Academic Years
        Route::get('/academic-years', [AcademicYearController::class, 'index'])->name('settings.academic-years');
        Route::post('/academic-years', [AcademicYearController::class, 'store'])->name('settings.academic-years.store');
        Route::put('/academic-years/{academicYear}', [AcademicYearController::class, 'update'])->name('settings.academic-years.update');
        Route::delete('/academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])->name('settings.academic-years.destroy');
        Route::post('/academic-years/{academicYear}/toggle-active', [AcademicYearController::class, 'toggleActive'])->name('settings.academic-years.toggle-active');

        // Academic Terms
        Route::get('/academic-terms', [AcademicTermController::class, 'index'])->name('settings.academic-terms');
        Route::post('/academic-terms', [AcademicTermController::class, 'store'])->name('settings.academic-terms.store');
        Route::put('/academic-terms/{academicTerm}', [AcademicTermController::class, 'update'])->name('settings.academic-terms.update');
        Route::delete('/academic-terms/{academicTerm}', [AcademicTermController::class, 'destroy'])->name('settings.academic-terms.destroy');
        Route::post('/academic-terms/{academicTerm}/toggle-active', [AcademicTermController::class, 'toggleActive'])->name('settings.academic-terms.toggle-active');

        // System Preferences
        Route::get('/preferences', [SystemPreferencesController::class, 'index'])->name('settings.preferences');
        Route::put('/preferences', [SystemPreferencesController::class, 'update'])->name('settings.preferences.update');
    });

    //^ Fee Management Routes (Admin only)
    Route::middleware(['user.active', 'permission:fees.manage'])->group(function () {
        // Fee Management Dashboard
        Route::get('/fees', [FeeManagementController::class, 'index'])->name('fees.index');

        // Bulk Invoice Generation
        Route::get('/fees/bulk-generate', [FeeManagementController::class, 'bulkGenerate'])->name('fees.bulk-generate');
        Route::post('/fees/bulk-generate', [FeeManagementController::class, 'processBulkGenerate'])->name('fees.process-bulk-generate');

        // Transport Routes
        Route::get('/transport-routes', [TransportRouteController::class, 'index'])->name('transport-routes.index');
        Route::post('/transport-routes', [TransportRouteController::class, 'store'])->name('transport-routes.store');
        Route::put('/transport-routes/{transportRoute}', [TransportRouteController::class, 'update'])->name('transport-routes.update');
        Route::delete('/transport-routes/{transportRoute}', [TransportRouteController::class, 'destroy'])->name('transport-routes.destroy');
        Route::post('/transport-routes/{transportRoute}/toggle-status', [TransportRouteController::class, 'toggleStatus'])->name('transport-routes.toggle-status');

        // Tuition Fees
        Route::get('/tuition-fees', [TuitionFeeController::class, 'index'])->name('tuition-fees.index');
        Route::post('/tuition-fees', [TuitionFeeController::class, 'store'])->name('tuition-fees.store');
        Route::post('/tuition-fees/bulk', [TuitionFeeController::class, 'bulkStore'])->name('tuition-fees.bulk-store');
        Route::put('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'update'])->name('tuition-fees.update');
        Route::delete('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'destroy'])->name('tuition-fees.destroy');
        Route::post('/tuition-fees/{tuitionFee}/toggle-status', [TuitionFeeController::class, 'toggleStatus'])->name('tuition-fees.toggle-status');

        // Universal Fees
        Route::get('/universal-fees', [UniversalFeeController::class, 'index'])->name('universal-fees.index');
        Route::post('/universal-fees', [UniversalFeeController::class, 'store'])->name('universal-fees.store');
        Route::post('/universal-fees/bulk', [UniversalFeeController::class, 'bulkStore'])->name('universal-fees.bulk-store');
        Route::put('/universal-fees/{universalFee}', [UniversalFeeController::class, 'update'])->name('universal-fees.update');
        Route::delete('/universal-fees/{universalFee}', [UniversalFeeController::class, 'destroy'])->name('universal-fees.destroy');
        Route::post('/universal-fees/{universalFee}/toggle-status', [UniversalFeeController::class, 'toggleStatus'])->name('universal-fees.toggle-status');

        // Guardian Fee Preferences
        Route::get('/fee-preferences', [GuardianFeePreferenceController::class, 'index'])->name('fee-preferences.index');
        Route::get('/fee-preferences/{guardian}/edit', [GuardianFeePreferenceController::class, 'edit'])->name('fee-preferences.edit');
        Route::put('/fee-preferences/{guardian}', [GuardianFeePreferenceController::class, 'update'])->name('fee-preferences.update');
        Route::delete('/fee-preferences/{feePreference}', [GuardianFeePreferenceController::class, 'destroy'])->name('fee-preferences.destroy');
        Route::post('/fee-preferences/bulk-apply-defaults', [GuardianFeePreferenceController::class, 'bulkApplyDefaults'])->name('fee-preferences.bulk-apply-defaults');
        Route::get('/fee-preferences/{guardian}/history', [GuardianFeePreferenceController::class, 'history'])->name('fee-preferences.history');

        // Invoice Management
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
        Route::post('/invoices/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::post('/invoices/clear-all', [InvoiceController::class, 'clearAll'])->name('invoices.clearAll');
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        Route::put('/invoices/{invoice}/line-items', [InvoiceController::class, 'updateLineItems'])->name('invoices.updateLineItems');
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

        // Payment Management
        Route::get('/invoices/{invoice}/payments/create', [PaymentController::class, 'create'])->name('payments.create');
        Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    });

    //^ Guardian Invoice Routes (Guardians can view their own invoices)
    Route::middleware(['user.active', 'permission:fees.view-own-invoices'])->group(function () {
        Route::get('/guardian/invoices', [InvoiceController::class, 'index'])->name('guardian.invoices');
        Route::get('/guardian/invoices/{invoice}', [InvoiceController::class, 'show'])->name('guardian.invoices.show');
        Route::get('/guardian/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('guardian.invoices.pdf');
    });
});

// Auth routes are loaded from auth.php
require __DIR__ . '/auth.php';

//^ Policies & Regulations Routes
Route::middleware(['auth'])->prefix('policies')->name('policies.')->group(function () {
    Route::get('/', [PolicyController::class, 'index'])->name('index');

    // Admin-only routes
    Route::middleware(['user.active', 'permission:policies.manage'])->group(function () {
        Route::get('/create', [PolicyController::class, 'create'])->name('create');
        Route::post('/', [PolicyController::class, 'store'])->name('store');
        Route::get('/{policy}/edit', [PolicyController::class, 'edit'])->name('edit');
        Route::put('/{policy}', [PolicyController::class, 'update'])->name('update');
        Route::delete('/{policy}', [PolicyController::class, 'destroy'])->name('destroy');
        Route::post('/{policy}/publish', [PolicyController::class, 'publish'])->name('publish');
        Route::get('/{policy}/revisions', [PolicyController::class, 'revisions'])->name('revisions');
    });

    // Public routes (all authenticated users)
    Route::get('/{policy}', [PolicyController::class, 'show'])->name('show');
    Route::post('/{policy}/acknowledge', [PolicyController::class, 'acknowledge'])->name('acknowledge');
});

//^ Accident Reports Routes
Route::middleware(['auth'])->prefix('accident-reports')->name('accident-reports.')->group(function () {
    Route::get('/', [AccidentReportController::class, 'index'])->name('index');
    Route::get('/create', [AccidentReportController::class, 'create'])->name('create');
    Route::post('/', [AccidentReportController::class, 'store'])->name('store');
    Route::get('/{accidentReport}', [AccidentReportController::class, 'show'])->name('show');
    Route::get('/{accidentReport}/edit', [AccidentReportController::class, 'edit'])->name('edit');
    Route::put('/{accidentReport}', [AccidentReportController::class, 'update'])->name('update');
    Route::post('/{accidentReport}/review', [AccidentReportController::class, 'review'])->name('review');
    Route::delete('/{accidentReport}', [AccidentReportController::class, 'destroy'])->name('destroy');
});

//^ Incident Reports Routes
Route::middleware(['auth'])->prefix('incident-reports')->name('incident-reports.')->group(function () {
    Route::get('/', [IncidentReportController::class, 'index'])->name('index');
    Route::get('/create', [IncidentReportController::class, 'create'])->name('create');
    Route::post('/', [IncidentReportController::class, 'store'])->name('store');
    Route::get('/{incidentReport}', [IncidentReportController::class, 'show'])->name('show');
    Route::get('/{incidentReport}/edit', [IncidentReportController::class, 'edit'])->name('edit');
    Route::put('/{incidentReport}', [IncidentReportController::class, 'update'])->name('update');
    Route::post('/{incidentReport}/status', [IncidentReportController::class, 'updateStatus'])->name('updateStatus');
    Route::delete('/{incidentReport}', [IncidentReportController::class, 'destroy'])->name('destroy');
});

// Fallback route for 404
Route::fallback(function () {
    // Inertia::render() defaults to a 200 response - without an explicit
    // status code here, every genuinely nonexistent route would return
    // the 404 page's content with an HTTP 200, which is wrong for SEO,
    // monitoring, and any client that checks the status code rather than
    // the page content.
    return Inertia::render('Errors/404')->toResponse(request())->setStatusCode(404);
});