import { BarChart3 } from "lucide-react";
import { ProgressBar } from "@/Components/UI";

export default function StudentsByGradeChart({ studentsByGrade }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-lg font-semibold text-navy flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-orange" />
                    Students by Grade
                </h3>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {studentsByGrade && studentsByGrade.length > 0 ? (
                    studentsByGrade.map((grade, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {grade.name}
                                </span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-navy">
                                        {grade.count}/{grade.capacity}
                                    </span>
                                    <span
                                        className={`ml-2 text-xs ${
                                            grade.percentage > 90
                                                ? "text-red-600"
                                                : grade.percentage > 70
                                                ? "text-yellow-600"
                                                : "text-green-600"
                                        }`}
                                    >
                                        ({grade.percentage}%)
                                    </span>
                                </div>
                            </div>
                            <ProgressBar
                                percentage={grade.percentage}
                                color={
                                    grade.percentage > 90
                                        ? "red-500"
                                        : grade.percentage > 70
                                        ? "yellow-500"
                                        : "green-500"
                                }
                            />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        No grade data available
                    </p>
                )}
            </div>
        </div>
    );
}

