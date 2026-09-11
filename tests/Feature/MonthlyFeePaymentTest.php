<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeePayment;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeePaymentTest extends TestCase
{
    use RefreshDatabase;

    private function makeGuardian(School $school): Guardian
    {
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);

        return Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id]);
    }

    public function test_a_payment_row_can_be_created_with_the_full_breakdown(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $payment = MonthlyFeePayment::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'amount' => 48000,
            'applied_to_arrears' => 0,
            'applied_to_current_month' => 16000,
            'applied_to_credit' => 32000,
            'received_at' => '2026-09-11',
        ]);

        $this->assertSame('48000.00', $payment->amount);
        $this->assertSame('32000.00', $payment->applied_to_credit);
        $this->assertSame('2026-09-11', $payment->received_at->format('Y-m-d'));
    }

    public function test_a_correction_row_references_the_entry_it_corrects(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);
        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 9, 'expected_amount' => 16000, 'amount_collected' => 16000,
        ]);

        $correction = MonthlyFeePayment::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'amount' => -16000,
            'applied_to_current_month' => -16000,
            'received_at' => now()->toDateString(),
            'corrects_entry_id' => $entry->id,
        ]);

        $this->assertSame($entry->id, $correction->correctsEntry->id);
    }

    public function test_monthly_fee_setting_defaults_credit_balance_to_zero(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $setting = MonthlyFeeSetting::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'expected_fee' => 8000,
        ]);

        $this->assertSame('0.00', $setting->credit_balance);
    }

    public function test_monthly_fee_entry_defaults_credit_applied_to_zero(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 8000,
        ]);

        $this->assertSame('0.00', $entry->credit_applied);
    }
}
