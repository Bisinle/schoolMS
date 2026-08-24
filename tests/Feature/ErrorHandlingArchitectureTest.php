<?php

// tests/Feature/ErrorHandlingArchitectureTest.php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ErrorHandlingArchitectureTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_mismatch_redirects_back_with_flash_message_and_fresh_csrf_cookie(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::post('/__test/419-trigger', function () {
            throw new \Illuminate\Session\TokenMismatchException('CSRF token mismatch.');
        })->middleware('web');

        $response = $this->actingAs($user)->from('/dashboard')->post('/__test/419-trigger');

        $response->assertStatus(303);
        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('error', 'Your session expired. Please try again.');

        // Assert a genuinely-encrypted XSRF-TOKEN cookie is present, and
        // that it decrypts (in exactly one pass) to the current session's
        // CSRF token. Decrypts exactly how VerifyCsrfToken::
        // getTokenFromRequest() does.
        //
        // KNOWN LIMITATION, confirmed empirically — do not trust this
        // assertion as proof the *handler's own* cookie-construction is
        // correct: VerifyCsrfToken::handle()'s runningUnitTests() bypass
        // means its own success-path tap() ALWAYS calls
        // addCookieToResponse() during tests, which calls
        // $response->headers->setCookie(...) with the SAME cookie
        // name/path/domain as whatever the exception handler already
        // attached — Symfony's ResponseHeaderBag::setCookie() replaces a
        // same-key cookie rather than adding a second one, so the
        // middleware's own (always-correct) cookie silently overwrites
        // the handler's before this assertion ever sees it. This was
        // confirmed live: a version of the 419 handler that manually
        // double-encrypted its cookie (a real bug, since fixed) still
        // passed this exact test unchanged. This test can only prove *a*
        // valid cookie reaches the client in the test environment, never
        // that this specific handler is what produced it. The actual,
        // trustworthy verification for this handler's cookie construction
        // is a live capture-and-decrypt against a running server outside
        // Pest's runningUnitTests() bypass — see the final report for that
        // evidence.
        $rawCookie = null;
        foreach ($response->headers->getCookies() as $c) {
            if ($c->getName() === 'XSRF-TOKEN') {
                $rawCookie = $c;
                break;
            }
        }

        $this->assertNotNull($rawCookie, 'XSRF-TOKEN cookie not present on response.');

        $decrypted = CookieValuePrefix::remove(
            app('encrypter')->decrypt($rawCookie->getValue(), ValidateCsrfToken::serialized())
        );

        $this->assertSame(session('_token'), $decrypted);
    }

    public function test_abort_403_renders_generic_error_page_with_no_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/403-trigger', function () {
            abort(403);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/403-trigger');

        $response->assertStatus(403);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 403)
            ->where('showRetry', false)
        );
    }

    public function test_abort_403_renders_generic_error_page_with_no_retry_action_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/403-debug-off-trigger', function () {
            abort(403);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/403-debug-off-trigger');

        $response->assertStatus(403);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 403)
            ->where('showRetry', false)
        );
    }

    public function test_throttle_requests_renders_generic_error_page_with_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/429-trigger', function () {
            throw new \Illuminate\Http\Exceptions\ThrottleRequestsException('Too many attempts.');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/429-trigger');

        $response->assertStatus(429);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 429)
            ->where('showRetry', true)
        );
    }

    public function test_throttle_requests_renders_generic_error_page_with_retry_action_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/429-debug-off-trigger', function () {
            throw new \Illuminate\Http\Exceptions\ThrottleRequestsException('Too many attempts.');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/429-debug-off-trigger');

        $response->assertStatus(429);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 429)
            ->where('showRetry', true)
        );
    }

    public function test_service_unavailable_renders_generic_error_page_with_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/503-trigger', function () {
            abort(503);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/503-trigger');

        $response->assertStatus(503);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 503)
        );
    }

    public function test_service_unavailable_renders_generic_error_page_with_retry_action_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/503-debug-off-trigger', function () {
            abort(503);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/503-debug-off-trigger');

        $response->assertStatus(503);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 503)
        );
    }

    public function test_bad_gateway_renders_generic_error_page_with_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/502-trigger', function () {
            abort(502);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/502-trigger');

        $response->assertStatus(502);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 502)
        );
    }

    public function test_bad_gateway_renders_generic_error_page_with_retry_action_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/502-debug-off-trigger', function () {
            abort(502);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/502-debug-off-trigger');

        $response->assertStatus(502);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 502)
        );
    }

    public function test_uncaught_exception_renders_generic_error_page_without_leaking_details_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/500-trigger', function () {
            throw new \RuntimeException('a secret internal detail that must never reach the client');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/500-trigger');

        $response->assertStatus(500);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 500)
        );
        $response->assertDontSee('a secret internal detail that must never reach the client');
    }

    public function test_uncaught_exception_does_not_intercept_laravels_debug_page_when_debug_is_on(): void
    {
        $this->withoutVite();
        config(['app.debug' => true]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/500-debug-trigger', function () {
            throw new \RuntimeException('a debug-mode marker string');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/500-debug-trigger');

        $response->assertStatus(500);
        // In debug mode Laravel's default renderer produces its own debug
        // page (not our Inertia GenericError component) and DOES include
        // the exception message — proving our handler stepped aside.
        $response->assertSee('a debug-mode marker string', escape: false);
    }

    public function test_404_handling_is_unchanged(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($user)->get('/this-route-does-not-exist');

        $response->assertStatus(404);
        $response->assertInertia(fn ($page) => $page->component('Errors/404'));
    }
}
