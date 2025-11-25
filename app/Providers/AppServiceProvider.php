<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Grade;
use App\Models\QuranTracking;
use Illuminate\Support\Facades\Gate;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\ReportComment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Observers\QuranTrackingObserver;
use App\Policies\AttendancePolicy;
use App\Policies\ExamPolicy;
use App\Policies\ExamResultPolicy;
use App\Policies\GradePolicy;
use App\Policies\StudentPolicy;
use App\Policies\GuardianPolicy;
use App\Policies\ReportCommentPolicy;
use App\Policies\SubjectPolicy;
use App\Policies\TeacherPolicy;
use App\External\QuranApiClient;
use App\External\QuranComApiClient;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind QuranApiClient interface to concrete implementation
        $this->app->bind(QuranApiClient::class, QuranComApiClient::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Increase memory limit as a safety measure
        ini_set('memory_limit', '256M');

        // Register model observers
        QuranTracking::observe(QuranTrackingObserver::class);

        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Guardian::class, GuardianPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Subject::class, SubjectPolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(ExamResult::class, ExamResultPolicy::class);
        Gate::policy(ReportComment::class, ReportCommentPolicy::class);

        Vite::prefetch(concurrency: 3);
    }
}
