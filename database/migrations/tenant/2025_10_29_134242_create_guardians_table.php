<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('phone_number');
            $table->text('address')->nullable();
            $table->string('occupation')->nullable();
            $table->string('relationship');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};