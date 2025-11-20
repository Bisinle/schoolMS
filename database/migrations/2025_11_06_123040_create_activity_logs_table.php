<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_type'); // created, updated, deleted, password_reset, login, logout
            $table->unsignedBigInteger('user_id'); // The user being acted upon
            $table->unsignedBigInteger('causer_id')->nullable(); // The user performing the action
            $table->string('description');
            $table->json('properties')->nullable(); // Additional data (old values, new values, etc.)
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('causer_id')->references('id')->on('users')->onDelete('set null');
            
            $table->index('log_type');
            $table->index('user_id');
            $table->index('causer_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};