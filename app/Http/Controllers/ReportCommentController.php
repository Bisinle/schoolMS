<?php

namespace App\Http\Controllers;

use App\Models\ReportComment;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ReportCommentController extends Controller
{
    use AuthorizesRequests;

    public function store(Request $request)
    {
        $this->authorize('create', ReportComment::class);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'term' => 'required|in:1,2,3,yearly',
            'academic_year' => 'required|integer',
            'teacher_comment' => 'nullable|string',
            'headteacher_comment' => 'nullable|string',
        ]);

        ReportComment::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'term' => $validated['term'],
                'academic_year' => $validated['academic_year'],
            ],
            [
                'teacher_comment' => $validated['teacher_comment'],
                'headteacher_comment' => $validated['headteacher_comment'],
            ]
        );

        return back()->with('success', 'Comment saved successfully.');
    }

    public function update(Request $request, ReportComment $reportComment)
    {
        $this->authorize('update', $reportComment);

        $validated = $request->validate([
            'teacher_comment' => 'nullable|string',
            'headteacher_comment' => 'nullable|string',
        ]);

        // Check if comments are locked
        if (!$reportComment->canEditTeacherComment($request->user())) {
            return back()->withErrors([
                'teacher_comment' => 'Teacher comment is locked.'
            ]);
        }

        if (!$reportComment->canEditHeadteacherComment($request->user())) {
            return back()->withErrors([
                'headteacher_comment' => 'Headteacher comment is locked.'
            ]);
        }

        $reportComment->update($validated);

        return back()->with('success', 'Comment updated successfully.');
    }

    public function lock(Request $request, ReportComment $reportComment)
    {
        $this->authorize('manageLock', $reportComment);

        $validated = $request->validate([
            'comment_type' => 'required|in:teacher,headteacher',
        ]);

        if ($validated['comment_type'] === 'teacher') {
            $reportComment->update([
                'teacher_comment_locked_at' => now(),
                'teacher_locked_by' => $request->user()->id,
            ]);
        } else {
            $reportComment->update([
                'headteacher_comment_locked_at' => now(),
                'headteacher_locked_by' => $request->user()->id,
            ]);
        }

        return back()->with('success', 'Comment locked successfully.');
    }

    public function unlock(Request $request, ReportComment $reportComment)
    {
        $this->authorize('manageLock', $reportComment);

        $validated = $request->validate([
            'comment_type' => 'required|in:teacher,headteacher',
        ]);

        if ($validated['comment_type'] === 'teacher') {
            $reportComment->update([
                'teacher_comment_locked_at' => null,
                'teacher_locked_by' => null,
            ]);
        } else {
            $reportComment->update([
                'headteacher_comment_locked_at' => null,
                'headteacher_locked_by' => null,
            ]);
        }

        return back()->with('success', 'Comment unlocked successfully.');
    }
}