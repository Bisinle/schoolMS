import { Link } from "@inertiajs/react";
import { Target } from "lucide-react";
import { ProgressBar } from "@/Components/UI";

export default function ExamCompletionChart({ examsWithCompletion }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-lg font-semibold text-navy flex items-center">
                    <Target className="w-5 h-5 mr-2 text-orange" />
                    Recent Exam Completion Status
                </h3>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {examsWithCompletion && examsWithCompletion.length > 0 ? (
                    examsWithCompletion.map((exam) => (
                        <Link
                            key={exam.id}
                            href={`/exams/${exam.id}/results`}
                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h4 className="font-medium text-navy text-sm mb-1">
                                        {exam.subject}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                        {exam.grade}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            exam.completion_rate === 100
                                                ? "bg-green-100 text-green-800"
                                                : exam.completion_rate >= 50
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {exam.completion_rate}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>
                                    {exam.students_marked} of {exam.total_students} students marked
                                </span>
                            </div>
                            <ProgressBar
                                percentage={exam.completion_rate}
                                color={
                                    exam.completion_rate === 100
                                        ? "green-500"
                                        : exam.completion_rate >= 50
                                        ? "yellow-500"
                                        : "red-500"
                                }
                            />
                        </Link>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        No exam data available
                    </p>
                )}
            </div>
        </div>
    );
}

