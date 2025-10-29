# School Management System (SMS) - Project Context

## Project Overview
A Laravel 11 + Breeze + Inertia.js + React school management system with role-based access control for Admins, Teachers, and Guardians.

## Tech Stack
- **Backend**: Laravel 11
- **Auth**: Laravel Breeze with Inertia
- **Frontend**: React with Inertia.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: SQLite (development)
- **UI Components**: Headless UI (for modals)

## Design Theme
- **Primary Color**: Dark Navy Blue (`#0b1a34`)
- **Accent Color**: Orange (`#f97316`)
- **Background**: White (`#ffffff`)
- **Sidebar**: Dark navy with white text, orange hover/active states
- **Buttons**: Orange with white text
- **Design Style**: Modern, sleek, professional

## Database Schema

### Users Table
```
id, name, email, password, role (enum: admin, teacher, guardian), 
email_verified_at, remember_token, timestamps
```

### Teachers Table
```
id, user_id (FK), employee_number (unique), phone_number, address, 
qualification, subject_specialization, date_of_joining, 
status (enum: active, inactive), timestamps
```

### Guardians Table
```
id, user_id (FK), phone_number, address, occupation, 
relationship, timestamps
```

### Students Table
```
id, admission_number (unique), first_name, last_name, 
gender (enum: male, female), date_of_birth, guardian_id (FK), 
class_name, enrollment_date, status (enum: active, inactive), timestamps
```

## User Roles & Permissions

### Admin
- Full CRUD on Students, Teachers, Guardians
- Access to all dashboards
- Can view all data

### Teacher
- View Students and Guardians (read-only)
- Cannot create/edit/delete

### Guardian
- View only their own children
- View their own profile
- No access to other students/guardians

## File Structure

### Backend (Laravel)
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   ├── StudentController.php
│   │   ├── GuardianController.php
│   │   └── TeacherController.php
│   └── Middleware/
│       └── RoleMiddleware.php
├── Models/
│   ├── User.php
│   ├── Student.php
│   ├── Guardian.php
│   └── Teacher.php
└── Policies/
    ├── StudentPolicy.php
    ├── GuardianPolicy.php
    └── TeacherPolicy.php

database/
├── migrations/
│   ├── *_create_users_table.php
│   ├── *_create_teachers_table.php
│   ├── *_create_guardians_table.php
│   └── *_create_students_table.php
└── seeders/
    └── DatabaseSeeder.php

routes/
└── web.php
```

### Frontend (React/Inertia)
```
resources/js/
├── Components/
│   └── ConfirmationModal.jsx
├── Layouts/
│   └── AuthenticatedLayout.jsx
└── Pages/
    ├── Dashboard.jsx
    ├── Students/
    │   ├── Index.jsx
    │   ├── Create.jsx
    │   ├── Edit.jsx
    │   └── Show.jsx
    ├── Guardians/
    │   ├── Index.jsx
    │   ├── Create.jsx
    │   ├── Edit.jsx
    │   └── Show.jsx
    └── Teachers/
        ├── Index.jsx
        ├── Create.jsx
        ├── Edit.jsx
        └── Show.jsx
```

## Key Features Implemented

### 1. Authentication & Authorization
- Laravel Breeze with Inertia React stack
- Role-based middleware: `role:admin`, `role:teacher`, `role:guardian`
- Policies for Students, Guardians, Teachers
- Middleware registered in `bootstrap/app.php`

### 2. CRUD Operations
- **Students**: Full CRUD with guardian search feature
- **Guardians**: Full CRUD with student relationships
- **Teachers**: Full CRUD with employee management
- All with pagination, search, and filters

### 3. UI Components
- Reusable ConfirmationModal for delete actions
- Responsive sidebar navigation
- Modern card-based dashboards
- Form validation with error messages
- Search functionality with real-time filtering

### 4. Dashboards (Role-Specific)
- **Admin Dashboard**: Total stats, recent students table
- **Teacher Dashboard**: Student stats, recent students
- **Guardian Dashboard**: Their children list, profile info

## Routes Structure
```php
// Students
GET    /students                  - Index (Admin, Teacher)
GET    /students/create           - Create Form (Admin only)
POST   /students                  - Store (Admin only)
GET    /students/{student}        - Show (Admin, Teacher)
GET    /students/{student}/edit   - Edit Form (Admin only)
PUT    /students/{student}        - Update (Admin only)
DELETE /students/{student}        - Delete (Admin only)

// Guardians (same pattern as Students)
// Teachers (Admin only - all routes)
```

## Seeded Test Data
```
Admin:
- Email: admin@sms.com
- Password: password

Teachers:
- teacher@sms.com / password
- sarah.teacher@sms.com / password

Guardians:
- guardian1@sms.com / password (Michael Johnson)
- guardian2@sms.com / password (Sarah Williams)

Students:
- STD001: Emma Johnson (Grade 3)
- STD002: James Johnson (Grade 5)
- STD003: Olivia Williams (Grade 4)
```

## Important Code Patterns

### 1. Form Input Pattern (NO InputField component due to focus issues)
```jsx
<div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
        Field Label <span className="text-red-500">*</span>
    </label>
    <input
        type="text"
        value={data.field_name}
        onChange={(e) => setData('field_name', e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
    />
    {errors.field_name && (
        <p className="mt-1 text-sm text-red-600">{errors.field_name}</p>
    )}
</div>
```

### 2. Inertia Form Pattern
```jsx
const { data, setData, post, processing, errors } = useForm({
    field1: '',
    field2: '',
});

const handleSubmit = (e) => {
    e.preventDefault();
    post('/route');
};
```

### 3. Delete with Confirmation Modal
```jsx
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const confirmDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
};

const handleDelete = () => {
    router.delete(`/items/${selectedItem.id}`, {
        onSuccess: () => {
            setShowDeleteModal(false);
            setSelectedItem(null);
        },
    });
};
```

## Configuration Files

### tailwind.config.js
```js
colors: {
    navy: {
        DEFAULT: '#0b1a34',
        dark: '#081426',
        light: '#0f2247',
    },
    orange: {
        DEFAULT: '#f97316',
        dark: '#ea580c',
        light: '#fb923c',
    },
}
```

### bootstrap/app.php
```php
$middleware->alias([
    'role' => RoleMiddleware::class,
]);
```

## Known Issues & Solutions

### Issue 1: Input Focus Jumping
**Problem**: When using nested component for inputs, focus jumps after each keystroke.
**Solution**: Write inputs directly without wrapper components. No `InputField` component pattern.

### Issue 2: 404 on Create Routes
**Problem**: `/students/create` returns 404 because `/students/{student}` catches it first.
**Solution**: Always define create routes BEFORE parameterized routes in `web.php`.

### Issue 3: Form Values Not Showing
**Problem**: Form fields show undefined on edit pages.
**Solution**: Always provide fallback: `value={data.field || ''}`

## Installation Commands
```bash
# Fresh install
composer create-project laravel/laravel school-management-system
cd school-management-system

# Install Breeze with React
composer require laravel/breeze --dev
php artisan breeze:install react

# Install dependencies
npm install lucide-react @headlessui/react

# Database
php artisan migrate:fresh --seed

# Development
npm run dev
php artisan serve
```

## Common Commands
```bash
# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Fresh database
php artisan migrate:fresh --seed

# Build assets
npm run dev      # Development
npm run build    # Production
```

## Current Phase: Phase 1 Complete ✅

### Implemented:
- ✅ Authentication with Breeze + Inertia + React
- ✅ Role-based middleware and policies
- ✅ Complete Student CRUD with guardian search
- ✅ Complete Guardian CRUD with student relationships
- ✅ Complete Teacher CRUD (admin only)
- ✅ Role-specific dashboards
- ✅ Modern UI with dark navy + orange theme
- ✅ Confirmation modals for deletes
- ✅ Pagination and search
- ✅ Responsive design with mobile menu

### Not Yet Implemented:
- Classes management
- Subjects management
- Attendance tracking
- Grade/Results management
- Reports generation
- Notifications
- Calendar/Events
- File uploads (documents, photos)

## Next Steps (Future Phases)

### Phase 2 (Suggested):
- Classes/Sections management
- Subject management
- Teacher-Class assignments
- Timetable/Schedule

### Phase 3 (Suggested):
- Attendance tracking
- Grade/Results management
- Report cards

### Phase 4 (Suggested):
- Fees management
- Payment tracking
- Notifications system

## Important Notes

1. **No Axios**: Using Inertia's built-in methods (`router.get`, `router.post`, etc.) instead of Axios
2. **File Uploads**: Not implemented yet - will need to add later
3. **Email Verification**: Disabled in current setup
4. **API Routes**: None implemented - all routes are web routes with Inertia
5. **Real-time Features**: Not implemented - no WebSockets/Pusher yet

## Model Relationships
```php
User
├── hasOne(Guardian)
└── hasOne(Teacher)

Guardian
├── belongsTo(User)
└── hasMany(Students)

Student
└── belongsTo(Guardian)

Teacher
└── belongsTo(User)
```

## Custom Tailwind Classes Used
- `bg-navy` - Dark navy background
- `bg-orange` - Orange background
- `text-navy` - Navy text
- `text-orange` - Orange text
- `hover:bg-orange` - Orange hover state
- `focus:ring-orange` - Orange focus ring

## Project Status
- **Current Version**: Phase 1 MVP
- **Environment**: Development
- **Database**: SQLite
- **State**: Fully functional, ready for testing
- **Last Updated**: 2025-10-29

---

## Quick Start After Context Upload

1. Verify all files are in place
2. Run `composer install` and `npm install`
3. Copy `.env.example` to `.env`
4. Run `php artisan key:generate`
5. Run `php artisan migrate:fresh --seed`
6. Run `npm run dev` and `php artisan serve`
7. Login with admin@sms.com / password

---

**END OF CONTEXT DOCUMENT**