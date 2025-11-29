import { Search, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ReportsFilters({
    search,
    setSearch,
    gradeId,
    gender,
    grades,
    onFilterChange,
    onSubmit
}) {
    const [showFilters, setShowFilters] = useState(false);

    const activeFiltersCount = [search, gradeId, gender].filter(Boolean).length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Mobile Filter Header - Only visible on mobile */}
            <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-100"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange to-orange-dark rounded-xl flex items-center justify-center">
                        <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900">Filters</p>
                        {activeFiltersCount > 0 && (
                            <p className="text-xs text-orange font-semibold">
                                {activeFiltersCount} active
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Filter Form - Hidden on mobile by default, always visible on desktop */}
            <form
                onSubmit={onSubmit}
                className={`p-4 sm:p-6 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                        />
                    </div>

                    {/* Grade Filter */}
                    <select
                        value={gradeId}
                        onChange={(e) => onFilterChange('grade', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all"
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                    >
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-orange text-white rounded-xl hover:bg-orange-dark transition-colors font-bold"
                    >
                        Apply Filters
                    </button>
                </div>
            </form>
        </div>
    );
}