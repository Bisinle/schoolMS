<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //^ Grade Routes - IMPORTANT: create/edit routes MUST come before {grade} route
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
        
        //* Teacher assignment routes
        Route::post('/grades/{grade}/assign-teacher', [GradeController::class, 'assignTeacher'])->name('grades.assign-teacher');
        Route::delete('/grades/{grade}/remove-teacher/{teacher}', [GradeController::class, 'removeTeacher'])->name('grades.remove-teacher');
        Route::patch('/grades/{grade}/update-teacher/{teacher}', [GradeController::class, 'updateTeacherAssignment'])->name('grades.update-teacher');
    });

    //^ Student Routes - IMPORTANT: create/edit routes MUST come before {student} route
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

    //^ Guardian Routes - IMPORTANT: create/edit routes MUST come before {guardian} route
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

    Route::middleware(['role:admin'])->group(function () {
        Route::get('/guardians/{guardian}/edit', [GuardianController::class, 'edit'])->name('guardians.edit');
        Route::put('/guardians/{guardian}', [GuardianController::class, 'update'])->name('guardians.update');
        Route::delete('/guardians/{guardian}', [GuardianController::class, 'destroy'])->name('guardians.destroy');
    });

    //^ Teacher Routes (Admin only) - IMPORTANT: create/edit routes MUST come before {teacher} route
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
        Route::get('/teachers/{teacher}/edit', [TeacherController::class, 'edit'])->name('teachers.edit');
        Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    //^ Attendance Routes - IMPORTANT: specific routes MUST come before {student} route
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('/attendance/mark', [AttendanceController::class, 'mark'])->name('attendance.mark');
        Route::get('/attendance/reports', [AttendanceController::class, 'reports'])->name('attendance.reports');
    });

    // Student attendance history - accessible by admin, teacher, and guardian (with restrictions)
    Route::get('/attendance/student/{student}', [AttendanceController::class, 'studentHistory'])->name('attendance.student-history');
});

require __DIR__.'/auth.php';