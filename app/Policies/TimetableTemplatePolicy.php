<?php

namespace App\Policies;

use App\Models\TimetableTemplate;
use App\Models\User;

class TimetableTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('timetable-templates.manage');
    }

    /**
     * Teacher-viewing-own-grade's-template branch dropped here (2026-08-26,
     * Phase 5) per the decision on Phase 2 disagreement #2: dead grant, no
     * route ever reached it — Templates have no view tier at all today
     * (disagreement #5, reproduced as-is).
     */
    public function view(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('timetable-templates.manage');
    }

    public function update(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage') && $timetableTemplate->isDraft();
    }

    public function delete(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage') && $timetableTemplate->isDraft();
    }

    public function restore(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    public function forceDelete(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    /**
     * Determine whether the user can regenerate timetable slots.
     *
     * Intentionally NOT restricted to draft status — admins need to be able to
     * regenerate a published timetable after updating the blueprint or curriculum.
     * Manually-created slots are preserved; only auto-generated ones are replaced.
     */
    public function regenerate(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    /**
     * Determine whether the user can manage slots on the timetable
     * (bulk teacher changes, individual slot edits on published templates).
     *
     * NOT restricted to draft — slot-level edits (e.g. assigning a substitute
     * teacher) must be possible on a published, live timetable.
     */
    public function manageSlots(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    public function publish(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage') && $timetableTemplate->isDraft();
    }

    public function archive(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage');
    }

    public function unarchive(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage') && $timetableTemplate->status === 'archived';
    }

    public function deleteArchived(User $user, TimetableTemplate $timetableTemplate): bool
    {
        return $user->can('timetable-templates.manage') && $timetableTemplate->status === 'archived';
    }
}
