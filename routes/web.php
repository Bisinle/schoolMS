<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DemoBookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ExamResultController;
use App\Http\Controllers\GuardianAttendanceController;
use App\Http\Controllers\GuardianChildrenController;
use App\Http\Controllers\GuardianQuranTrackingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DocumentCategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\Admin\AdminPasswordController;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\QuranTrackingController;
use App\Http\Controllers\QuranHomeworkController;
use App\Http\Controllers\QuranHomePracticeController;
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
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/grades', [GradeController::class, 'index'])->name('grades.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/grades/create', [GradeController::class, 'create'])->name('grades.create');
        Route::post('/grades', [GradeController::class, 'store'])->name('grades.store');
    });

    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/grades/{grade}', [GradeController::class, 'show'])->name('grades.show');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/grades/{grade}/edit', [GradeController::class, 'edit'])->name('grades.edit');
        Route::put('/grades/{grade}', [GradeController::class, 'update'])->name('grades.update');
        Route::delete('/grades/{grade}', [GradeController::class, 'destroy'])->name('grades.destroy');
        Route::post('/grades/{grade}/restore', [GradeController::class, 'restore'])->name('grades.restore');
        Route::post('/grades/{grade}/assign-teacher', [GradeController::class, 'assignTeacher'])->name('grades.assign-teacher');
        Route::delete('/grades/{grade}/remove-teacher/{teacher}', [GradeController::class, 'removeTeacher'])->name('grades.remove-teacher');
        Route::patch('/grades/{grade}/update-teacher/{teacher}', [GradeController::class, 'updateTeacherAssignment'])->name('grades.update-teacher');
    });

    //^ Student Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
        Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    });

    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    });

    //^ Guardian Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/guardians', [GuardianController::class, 'index'])->name('guardians.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/guardians/create', [GuardianController::class, 'create'])->name('guardians.create');
        Route::post('/guardians', [GuardianController::class, 'store'])->name('guardians.store');
    });

    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/guardians/{guardian}', [GuardianController::class, 'show'])->name('guardians.show');
    });

    Route::middleware(['role:guardian'])->group(function () {
        Route::get('/guardian/children', [GuardianChildrenController::class, 'index'])->name('guardian.children');
        Route::get('/guardian/attendance', [GuardianAttendanceController::class, 'index'])->name('guardian.attendance');

        // Guardian Quran Tracking (read-only, madrasah only)
        Route::middleware(['madrasah.only'])->group(function () {
            Route::get('/guardian/quran-tracking', [GuardianQuranTrackingController::class, 'index'])->name('guardian.quran-tracking');
        });
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/guardians/{guardian}/edit', [GuardianController::class, 'edit'])->name('guardians.edit');
        Route::put('/guardians/{guardian}', [GuardianController::class, 'update'])->name('guardians.update');
        Route::delete('/guardians/{guardian}', [GuardianController::class, 'destroy'])->name('guardians.destroy');
    });

    //^ Teacher Routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
        Route::get('/teachers/{teacher}/edit', [TeacherController::class, 'edit'])->name('teachers.edit');
        Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    //^ USER MANAGEMENT ROUTES
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });

    //^ Attendance Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('/attendance/mark', [AttendanceController::class, 'mark'])->name('attendance.mark');
        Route::get('/attendance/reports', [AttendanceController::class, 'reports'])->name('attendance.reports');
    });

    Route::get('/attendance/student/{student}', [AttendanceController::class, 'studentHistory'])->name('attendance.student-history');

    //^ Subjects Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/subjects', [SubjectController::class, 'index'])->name('subjects.index');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/subjects/create', [SubjectController::class, 'create'])->name('subjects.create');
        Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
        Route::get('/subjects/{subject}/edit', [SubjectController::class, 'edit'])->name('subjects.edit');
        Route::put('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
        Route::post('/subjects/{subject}/assign-grades', [SubjectController::class, 'assignGrades'])->name('subjects.assign-grades');
    });

    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/subjects/{subject}', [SubjectController::class, 'show'])->name('subjects.show');
    });

    //^ Exams Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
        Route::get('/exams/create', [ExamController::class, 'create'])->name('exams.create');
        Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
        Route::get('/exams/{exam}', [ExamController::class, 'show'])->name('exams.show');
        Route::get('/exams/{exam}/edit', [ExamController::class, 'edit'])->name('exams.edit');
        Route::put('/exams/{exam}', [ExamController::class, 'update'])->name('exams.update');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::delete('/exams/{exam}', [ExamController::class, 'destroy'])->name('exams.destroy');
    });

    //^ Exam Results Routes
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/exams/{exam}/results', [ExamResultController::class, 'index'])->name('exam-results.index');
        Route::post('/exams/{exam}/results', [ExamResultController::class, 'store'])->name('exam-results.store');
        Route::put('/exam-results/{examResult}', [ExamResultController::class, 'update'])->name('exam-results.update');
    });

    //^ Reports Routes
    Route::middleware(['role:admin,teacher,guardian'])->group(function () {
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
    });

    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::post('/reports/students/{student}/comments', [ReportController::class, 'saveComment'])->name('reports.saveComment');
        Route::post('/reports/students/{student}/comments/lock', [ReportController::class, 'lockComment'])->name('reports.lockComment');
    });

    //^ School Settings Routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/settings/academic', [SchoolSettingController::class, 'academic'])->name('settings.academic');
        Route::post('/settings/academic', [SchoolSettingController::class, 'updateAcademic'])->name('settings.academic.update');
    });

    //^ API endpoint for subjects by grade
    Route::get('/api/grades/{grade}/subjects', function (Grade $grade) {
        return $grade->subjects()->where('status', 'active')->get();
    });

    //^ Quran Module Routes (Madrasah schools only)
    Route::middleware(['madrasah.only'])->group(function () {
        // Quran Dashboard (all roles)
        Route::middleware(['role:admin,teacher,guardian'])->group(function () {
            Route::get('/quran', [QuranController::class, 'index'])->name('quran.index');
        });

        // Admin and Teacher only routes (must come BEFORE wildcard routes)
        Route::middleware(['role:admin,teacher'])->group(function () {
            Route::get('/quran-tracking', [QuranTrackingController::class, 'index'])->name('quran-tracking.index');
            Route::get('/quran-tracking/create', [QuranTrackingController::class, 'create'])->name('quran-tracking.create');
            Route::post('/quran-tracking', [QuranTrackingController::class, 'store'])->name('quran-tracking.store');
            Route::get('/quran-tracking/{quranTracking}/edit', [QuranTrackingController::class, 'edit'])->name('quran-tracking.edit');
            Route::put('/quran-tracking/{quranTracking}', [QuranTrackingController::class, 'update'])->name('quran-tracking.update');
            Route::delete('/quran-tracking/{quranTracking}', [QuranTrackingController::class, 'destroy'])->name('quran-tracking.destroy');

            // API endpoints for Quran data
            Route::get('/api/quran/surah/{surahNumber}', [QuranTrackingController::class, 'getSurahDetails'])->name('api.quran.surah');
            Route::get('/api/quran/page/{pageNumber}/image', [QuranTrackingController::class, 'getPageImage'])->name('api.quran.page-image');
            Route::get('/api/quran/page/{pageNumber}/details', [QuranTrackingController::class, 'getPageDetails'])->name('api.quran.page-details');
            Route::get('/api/quran/juz', [QuranTrackingController::class, 'getAllJuz'])->name('api.quran.juz');
            Route::get('/api/quran/verse/{surahNumber}/{verseNumber}', [QuranTrackingController::class, 'getVerseText'])->name('api.quran.verse');
        });

        // Read-only routes (admin, teacher, guardian) - wildcard routes come AFTER specific routes
        Route::middleware(['role:admin,teacher,guardian'])->group(function () {
            Route::get('/quran-tracking/student/{student}/report', [QuranTrackingController::class, 'studentReport'])->name('quran-tracking.student-report');
            Route::get('/quran-tracking/{quranTracking}', [QuranTrackingController::class, 'show'])->name('quran-tracking.show');
        });

        // Quran Homework Routes (admin and teacher only)
        Route::middleware(['role:admin,teacher'])->group(function () {
            Route::get('/quran-homework', [QuranHomeworkController::class, 'index'])->name('quran-homework.index');
            Route::get('/quran-homework/create', [QuranHomeworkController::class, 'create'])->name('quran-homework.create');
            Route::post('/quran-homework', [QuranHomeworkController::class, 'store'])->name('quran-homework.store');
            Route::get('/quran-homework/{quranHomework}/edit', [QuranHomeworkController::class, 'edit'])->name('quran-homework.edit');
            Route::put('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'update'])->name('quran-homework.update');
            Route::delete('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'destroy'])->name('quran-homework.destroy');
            Route::post('/quran-homework/{quranHomework}/mark-complete', [QuranHomeworkController::class, 'markComplete'])->name('quran-homework.mark-complete');
        });

        // Quran Homework read-only routes (admin, teacher, guardian)
        Route::middleware(['role:admin,teacher,guardian'])->group(function () {
            Route::get('/quran-homework/student/{student}', [QuranHomeworkController::class, 'studentHomework'])->name('quran-homework.student');
            Route::get('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'show'])->name('quran-homework.show');
        });

        // Quran Home Practice Routes (guardians can CRUD their own, teachers/admins can view)
        Route::middleware(['role:admin,teacher,guardian'])->group(function () {
            Route::get('/quran-home-practice', [QuranHomePracticeController::class, 'index'])->name('quran-home-practice.index');
            Route::get('/quran-home-practice/{quranHomePractice}', [QuranHomePracticeController::class, 'show'])->name('quran-home-practice.show');
            Route::get('/api/quran-home-practice/student/{student}/stats', [QuranHomePracticeController::class, 'studentStats'])->name('quran-home-practice.student-stats');
        });

        // Guardian-only routes for creating/editing home practice
        Route::middleware(['role:guardian'])->group(function () {
            Route::get('/quran-home-practice/create', [QuranHomePracticeController::class, 'create'])->name('quran-home-practice.create');
            Route::post('/quran-home-practice', [QuranHomePracticeController::class, 'store'])->name('quran-home-practice.store');
            Route::get('/quran-home-practice/{quranHomePractice}/edit', [QuranHomePracticeController::class, 'edit'])->name('quran-home-practice.edit');
            Route::put('/quran-home-practice/{quranHomePractice}', [QuranHomePracticeController::class, 'update'])->name('quran-home-practice.update');
            Route::delete('/quran-home-practice/{quranHomePractice}', [QuranHomePracticeController::class, 'destroy'])->name('quran-home-practice.destroy');
        });

        // Quran Schedule Routes (admin and teacher only)
        Route::middleware(['role:admin,teacher'])->group(function () {
            Route::get('/quran-schedule', [QuranScheduleController::class, 'index'])->name('quran-schedule.index');
            Route::get('/quran-schedule/create', [QuranScheduleController::class, 'create'])->name('quran-schedule.create');
            Route::post('/quran-schedule', [QuranScheduleController::class, 'store'])->name('quran-schedule.store');
            Route::get('/quran-schedule/{quranSchedule}/edit', [QuranScheduleController::class, 'edit'])->name('quran-schedule.edit');
            Route::put('/quran-schedule/{quranSchedule}', [QuranScheduleController::class, 'update'])->name('quran-schedule.update');
            Route::post('/quran-schedule/{quranSchedule}/activate', [QuranScheduleController::class, 'activate'])->name('quran-schedule.activate');
            Route::post('/quran-schedule/{quranSchedule}/deactivate', [QuranScheduleController::class, 'deactivate'])->name('quran-schedule.deactivate');
            Route::delete('/quran-schedule/{quranSchedule}', [QuranScheduleController::class, 'destroy'])->name('quran-schedule.destroy');
        });

        // Quran Schedule read-only routes (admin, teacher, guardian)
        Route::middleware(['role:admin,teacher,guardian'])->group(function () {
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
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/document-categories', [DocumentCategoryController::class, 'index'])->name('document-categories.index');
        Route::get('/document-categories/create', [DocumentCategoryController::class, 'create'])->name('document-categories.create');
        Route::post('/document-categories', [DocumentCategoryController::class, 'store'])->name('document-categories.store');
        Route::get('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'show'])->name('document-categories.show');
        Route::get('/document-categories/{documentCategory}/edit', [DocumentCategoryController::class, 'edit'])->name('document-categories.edit');
        Route::put('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'update'])->name('document-categories.update');
        Route::delete('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'destroy'])->name('document-categories.destroy');
    });

    //^ Document Verification Routes (Admin only)
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/documents/{document}/verify', [DocumentController::class, 'verify'])->name('documents.verify');
        Route::post('/documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');
    });

    //^ Admin Password Management
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::post('/users/{user}/reset-password', [AdminPasswordController::class, 'generateTemporaryPassword'])
            ->name('admin.users.reset-password');
    });

    //^ Settings Routes (Admin only)
    Route::middleware(['role:admin'])->prefix('admin/settings')->group(function () {
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
    Route::middleware(['role:admin'])->group(function () {
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
    Route::middleware(['role:guardian'])->group(function () {
        Route::get('/guardian/invoices', [InvoiceController::class, 'index'])->name('guardian.invoices');
        Route::get('/guardian/invoices/{invoice}', [InvoiceController::class, 'show'])->name('guardian.invoices.show');
        Route::get('/guardian/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('guardian.invoices.pdf');
    });
});

// Auth routes are loaded from auth.php
require __DIR__ . '/auth.php';

// Fallback route for 404
Route::fallback(function () {
    return Inertia::render('Errors/404');
});