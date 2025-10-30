<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Grade;
use Illuminate\Support\Facades\Gate;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\Teacher;
use App\Policies\AttendancePolicy;
use App\Policies\GradePolicy;
use App\Policies\StudentPolicy;
use App\Policies\GuardianPolicy;
use App\Policies\TeacherPolicy;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Guardian::class, GuardianPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Vite::prefetch(concurrency: 3);
    }
}
