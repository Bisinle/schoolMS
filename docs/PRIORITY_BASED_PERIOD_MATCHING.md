# Priority-Based Period Matching System

## Overview

The Priority-Based Period Matching system intelligently matches subjects to time periods based on cognitive load and student alertness patterns. This ensures high-priority subjects (Math, Science) are scheduled during morning hours when students are most alert, while low-priority subjects (Arts, PE) are scheduled in the afternoon.

---

## Architecture

### 1. **Priority Bands**

#### Period Priority Bands (Blueprint Periods)
Periods are assigned one of three priority bands:

| Band | Description | Best For | Time of Day |
|------|-------------|----------|-------------|
| `morning_high` | High cognitive load | Math, Science, Languages | 8:00 AM - 11:00 AM |
| `neutral` | Moderate cognitive load | Social Studies, General subjects | 11:00 AM - 2:00 PM |
| `afternoon_low` | Low cognitive load | Arts, PE, Music, Activities | 2:00 PM - 4:00 PM |

#### Subject Priorities (Grade-Subject Pivot)
Subjects are assigned priorities in the `grade_subject` pivot table:

| Priority | Maps To Band | Examples |
|----------|--------------|----------|
| `high` | `morning_high` | Mathematics, Science, English |
| `neutral` | `neutral` | Social Studies, Kiswahili |
| `low` | `afternoon_low` | Art, PE, Music |

---

## Implementation

### 2. **Core Components**

#### A. `HasPriorityBand` Trait
**Location:** `app/Models/Traits/HasPriorityBand.php`

Provides mapping and utility methods:
- `mapPriorityToBand()` - Convert subject priority to period band
- `mapBandToPriority()` - Convert period band to subject priority
- `priorityMatchesBand()` - Check if priority matches band
- `getPriorityBandLabel()` - Get human-readable labels
- `getPriorityBandColor()` - Get UI color classes

#### B. `Subject` Model Enhancement
**Location:** `app/Models/Subject.php`

New methods:
- `getPriorityForGrade($gradeId)` - Get subject priority for specific grade
- `getPriorityBandForGrade($gradeId)` - Get mapped priority band
- `matchesPriorityBand($gradeId, $periodBand)` - Check if subject matches period
- `getRecommendedTimeForGrade($gradeId)` - Get scheduling recommendation

#### C. `PriorityBasedPeriodAllocator` Service
**Location:** `app/Services/Timetable/PriorityBasedPeriodAllocator.php`

Core allocation service providing:
- `getPeriodsByPriorityBand()` - Group periods by band
- `getSubjectsByPriority()` - Group subjects by priority
- `getOptimalPeriodsForSubject()` - Find best periods for a subject
- `isPairingOptimal()` - Validate subject-period pairing
- `getTemplateAllocationStats()` - Calculate matching statistics
- `getRecommendations()` - Generate improvement suggestions

---

## Usage

### 3. **Setting Up Priorities**

#### Step 1: Configure Period Blueprints
When creating a blueprint, assign priority bands to lesson periods:

```php
BlueprintPeriod::create([
    'period_type' => 'lesson',
    'priority_band' => 'morning_high',  // For first periods
    'is_teachable' => true,
    // ...
]);
```

#### Step 2: Assign Subject Priorities
When assigning subjects to grades, set their priority:

```php
$grade->subjects()->attach($subjectId, [
    'sessions_per_week' => 5,
    'priority' => 'high',  // Math should be in morning
    'must_be_daily' => true,
]);
```

---

## Features

### 4. **Automatic Matching**

The `TimetableGenerationService` automatically uses priority matching:

```php
// In allocateRemainingSubjects()
$compatibleSubject = $subjectPool->first(function ($item) use ($slot) {
    // Priority matching
    return $this->priorityMatches($item['priority'], $slot->priority_band);
});
```

### 5. **Visual Feedback**

The Grid view displays:
- **Match Percentage**: Overall quality of priority matching
- **Perfect Matches**: Subjects in ideal time slots
- **Acceptable Matches**: Subjects in neutral periods
- **Poor Matches**: Subjects in suboptimal periods
- **Recommendations**: Actionable suggestions for improvement

### 6. **Quality Metrics**

```php
$stats = [
    'total_slots' => 35,
    'perfect_matches' => 25,      // 71%
    'acceptable_matches' => 8,    // 23%
    'poor_matches' => 2,          // 6%
    'match_percentage' => 94.3,   // (perfect + acceptable) / total
];
```

---

## Benefits

### 7. **Educational Benefits**
- ✅ **Cognitive Optimization**: High-focus subjects when students are most alert
- ✅ **Better Learning Outcomes**: Subjects taught at optimal times
- ✅ **Reduced Fatigue**: Low-energy subjects in afternoon
- ✅ **Consistent Schedule**: Predictable daily rhythm

### 8. **Administrative Benefits**
- ✅ **Automated Scheduling**: Smart allocation reduces manual work
- ✅ **Quality Metrics**: Measurable timetable quality
- ✅ **Recommendations**: Actionable improvement suggestions
- ✅ **Flexibility**: Override when needed for special cases

---

## Example Workflow

### 9. **Complete Setup**

1. **Create Blueprint** with priority bands
2. **Assign Subjects** to grade with priorities
3. **Generate Timetable** - automatic priority matching
4. **Review Stats** - check match percentage
5. **Follow Recommendations** - improve suboptimal slots
6. **Publish** - deploy optimized timetable

---

## API Reference

### 10. **Key Methods**

```php
// Check if pairing is optimal
$allocator->isPairingOptimal($subject, $period, $gradeId);
// Returns: ['is_optimal' => true, 'reason' => '...', 'match_quality' => 'perfect']

// Get statistics
$allocator->getTemplateAllocationStats($template);
// Returns: ['total_slots', 'perfect_matches', 'match_percentage', ...]

// Get recommendations
$allocator->getRecommendations($template);
// Returns: [['type' => 'warning', 'message' => '...', 'action' => '...']]
```

---

## Future Enhancements

- [ ] Machine learning to optimize based on student performance
- [ ] Teacher preference integration
- [ ] Room availability consideration
- [ ] Multi-grade optimization
- [ ] Historical performance tracking

