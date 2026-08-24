<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Grade;
use App\Models\GuardianInvoice;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use Illuminate\Support\Facades\Gate;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\ReportComment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\Room;
use App\Models\TimetableSlot;
use App\Models\AccidentReport;
use App\Models\IncidentReport;
use App\Models\Policy;
use App\Observers\QuranHomeworkObserver;
use App\Policies\AttendancePolicy;
use App\Policies\ExamPolicy;
use App\Policies\ExamResultPolicy;
use App\Policies\GradePolicy;
use App\Policies\GuardianInvoicePolicy;
use App\Policies\StudentPolicy;
use App\Policies\GuardianPolicy;
use App\Policies\ReportCommentPolicy;
use App\Policies\SubjectPolicy;
use App\Policies\TeacherPolicy;
use App\Policies\TimetableTemplatePolicy;
use App\Policies\TimetablePeriodPolicy;
use App\Policies\RoomPolicy;
use App\Policies\TimetableSlotPolicy;
use App\Policies\AccidentReportPolicy;
use App\Policies\IncidentReportPolicy;
use App\Policies\PolicyPolicy;
use App\Policies\QuranHomeworkPolicy;
use App\Policies\QuranSchedulePolicy;
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

        // Create Google Calendar OAuth credentials file from environment variables
        $this->createGoogleCalendarCredentials();

        // Register model observers
        QuranHomework::observe(QuranHomeworkObserver::class);

        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Guardian::class, GuardianPolicy::class);
        Gate::policy(GuardianInvoice::class, GuardianInvoicePolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Subject::class, SubjectPolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(ExamResult::class, ExamResultPolicy::class);
        Gate::policy(ReportComment::class, ReportCommentPolicy::class);

        // Timetable Policies - Added in Phase 4
        Gate::policy(TimetableTemplate::class, TimetableTemplatePolicy::class);
        Gate::policy(TimetablePeriod::class, TimetablePeriodPolicy::class);
        Gate::policy(Room::class, RoomPolicy::class);
        Gate::policy(TimetableSlot::class, TimetableSlotPolicy::class);

        // Reports & Policies - Added in Phase 2 & 3
        Gate::policy(AccidentReport::class, AccidentReportPolicy::class);
        Gate::policy(IncidentReport::class, IncidentReportPolicy::class);
        Gate::policy(Policy::class, PolicyPolicy::class);

        // Quran Policies - Added in restructure Phase 1
        Gate::policy(QuranHomework::class, QuranHomeworkPolicy::class);
        Gate::policy(QuranSchedule::class, QuranSchedulePolicy::class);

        Vite::prefetch(concurrency: 3);
    }

    /**
     * Create Google Calendar OAuth credentials file from environment variables
     * This is needed because GitHub doesn't allow committing credentials files
     */
    protected function createGoogleCalendarCredentials(): void
    {
        $clientId = env('GOOGLE_CLIENT_ID');
        $clientSecret = env('GOOGLE_CLIENT_SECRET');
        $refreshToken = env('GOOGLE_REFRESH_TOKEN');

        // Only create if environment variables are set
        if (!$clientId || !$clientSecret) {
            return;
        }

        $directory = storage_path('app/google-calendar');

        // Create directory if it doesn't exist
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // Create oauth-credentials.json
        $credentialsPath = $directory . '/oauth-credentials.json';
        if (!file_exists($credentialsPath)) {
            $credentials = [
                'web' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uris' => [env('GOOGLE_REDIRECT_URI')],
                    'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri' => 'https://oauth2.googleapis.com/token',
                ]
            ];

            file_put_contents($credentialsPath, json_encode($credentials, JSON_PRETTY_PRINT));
        }

        // Create oauth-token.json if refresh token is available
        $tokenPath = $directory . '/oauth-token.json';
        if ($refreshToken && !file_exists($tokenPath)) {
            $tokenData = [
                'access_token' => '', // Will be refreshed automatically
                'refresh_token' => $refreshToken,
                'scope' => 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                'token_type' => 'Bearer',
                'created' => time(),
            ];

            file_put_contents($tokenPath, json_encode($tokenData, JSON_PRETTY_PRINT));
        }
    }
}
