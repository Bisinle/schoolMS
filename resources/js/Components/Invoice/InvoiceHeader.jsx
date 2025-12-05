import { Phone, Mail, MapPin, User, Calendar, FileText, CreditCard } from 'lucide-react';

export default function InvoiceHeader({ school, invoice }) {
    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-red-100 text-red-700 border-red-300',
            'partial': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'paid': 'bg-green-100 text-green-700 border-green-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <div className="bg-white border-b-2 border-gray-300 p-4 sm:p-6 lg:p-8">
            {/* Top Section - School Info & Invoice Title */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-6 border-b-2 border-gray-200">
                {/* School Info */}
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase mb-2">
                        {school.name}
                    </h1>
                    {school.tagline && (
                        <p className="text-gray-600 mb-4 text-sm">{school.tagline}</p>
                    )}
                    
                    <div className="space-y-1.5 text-sm text-gray-700">
                        {(school.phone_primary || school.phone_secondary) && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span>
                                    {school.phone_primary}
                                    {school.phone_secondary && ` / ${school.phone_secondary}`}
                                </span>
                            </div>
                        )}
                        
                        {school.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="break-all">{school.email}</span>
                            </div>
                        )}
                        
                        {school.physical_address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                <span>{school.physical_address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Title & Status */}
                <div className="text-left md:text-right">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">INVOICE</h2>
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-md border font-bold text-xs uppercase ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                    </div>
                </div>
            </div>

            {/* Invoice Details & Bill To - Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Invoice Details */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-300">
                        Invoice Details
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                        {/* Invoice Number */}
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600 font-medium">Invoice Number:</span>
                            <span className="text-gray-900 font-bold font-mono">{invoice.invoice_number}</span>
                        </div>

                        {/* Invoice Date */}
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600 font-medium">Invoice Date:</span>
                            <span className="text-gray-900 font-semibold">
                                {new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex justify-between py-2 bg-gray-50 px-3 -mx-3 rounded">
                            <span className="text-gray-900 font-bold">Due Date:</span>
                            <span className="text-gray-900 font-bold">
                                {new Date(invoice.due_date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>

                        {/* Academic Term */}
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600 font-medium">Academic Term:</span>
                            <span className="text-gray-900 font-semibold">
                                {invoice.academic_term?.academic_year?.year} - Term {invoice.academic_term?.term_number}
                            </span>
                        </div>

                        {/* Payment Plan */}
                        {invoice.payment_plan && (
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600 font-medium">Payment Plan:</span>
                                <span className="text-gray-900 font-semibold capitalize">
                                    {invoice.payment_plan.replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill To */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-300">
                        Bill To
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        {/* Guardian Name */}
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Parent/Guardian</p>
                            <h4 className="text-gray-900 font-bold text-lg">
                                {invoice.guardian?.user?.name || `${invoice.guardian?.first_name || ''} ${invoice.guardian?.last_name || ''}`.trim() || 'N/A'}
                            </h4>
                            <p className="text-gray-600 font-mono text-sm mt-1">
                                {invoice.guardian?.guardian_number || invoice.guardian?.guardian_id || 'N/A'}
                            </p>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2.5 text-sm">
                            {(invoice.guardian?.phone_number || invoice.guardian?.user?.phone) && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700">
                                        {invoice.guardian?.phone_number || invoice.guardian?.user?.phone}
                                    </span>
                                </div>
                            )}

                            {(invoice.guardian?.email || invoice.guardian?.user?.email) && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-gray-700 break-all">
                                        {invoice.guardian?.email || invoice.guardian?.user?.email}
                                    </span>
                                </div>
                            )}

                            {invoice.guardian?.physical_address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-sm">
                                        {invoice.guardian?.physical_address}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Students Count */}
                        {invoice.line_items?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Students:</span>
                                    <span className="text-gray-900 font-bold">
                                        {invoice.line_items.length} {invoice.line_items.length === 1 ? 'Student' : 'Students'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}