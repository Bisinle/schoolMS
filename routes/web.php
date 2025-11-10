<?php

use App\Http\Controllers\Admin\AdminPasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Auth\PasswordChangeController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ExamResultController;
use App\Http\Controllers\GuardianAttendanceController;
use App\Http\Controllers\GuardianChildrenController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportCommentController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DocumentCategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ImpersonationController;
use App\Models\Grade;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
});



//^ Document Categories Routes (Admin only)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/document-categories', [DocumentCategoryController::class, 'index'])->name('document-categories.index');
    Route::get('/document-categories/create', [DocumentCategoryController::class, 'create'])->name('document-categories.create');
    Route::post('/document-categories', [DocumentCategoryController::class, 'store'])->name('document-categories.store');
    Route::get('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'show'])->name('document-categories.show');
    Route::get('/document-categories/{documentCategory}/edit', [DocumentCategoryController::class, 'edit'])->name('document-categories.edit');
    Route::put('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'update'])->name('document-categories.update');
    Route::delete('/document-categories/{documentCategory}', [DocumentCategoryController::class, 'destroy'])->name('document-categories.destroy');
});

//^ Document Verification Routes (Admin only)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::post('/documents/{document}/verify', [DocumentController::class, 'verify'])->name('documents.verify');
    Route::post('/documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');
});

//^ Admin Password Management
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::post('/users/{user}/reset-password', [AdminPasswordController::class, 'generateTemporaryPassword'])
        ->name('admin.users.reset-password');
});

// Fallback route for 404
Route::fallback(function () {
    return Inertia::render('Errors/404');
});

require __DIR__ . '/auth.php';