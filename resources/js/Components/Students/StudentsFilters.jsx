import { Search } from 'lucide-react';

export default function StudentsFilters({ 
    search, 
    setSearch, 
    gradeId, 
    gender, 
    status, 
    grades,
    onFilterChange,
    onSubmit 
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Grade Filter */}
                    <select
                        value={gradeId}
                        onChange={(e) => onFilterChange('grade', e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                    >
                        <option value="">All Grades</option>
                        {grades.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                                {grade.name}
                            </option>
                        ))}
                    </select>

                    {/* Gender Filter */}
                    <select
                        value={gender}
                        onChange={(e) => onFilterChange('gender', e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                    >
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </form>
        </div>
    );
}