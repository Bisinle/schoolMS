import { Phone, Mail, MapPin, User, Calendar, FileText, CreditCard } from 'lucide-react';

export default function InvoiceHeader({ school, invoice }) {
    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-red-100 text-red-700 border-red-200',
            'partial': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'paid': 'bg-green-100 text-green-700 border-green-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50/50 border-b-4 border-orange-500 p-4 sm:p-6 lg:p-8">
            {/* Top Section - School Info & Invoice Title */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6 sm:mb-8">
                {/* School Info */}
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy uppercase mb-2 tracking-tight">
                        {school.name}
                    </h1>
                    {school.tagline && (
                        <p className="text-gray-600 italic mb-4 text-sm sm:text-base font-medium">{school.tagline}</p>
                    )}
                    
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
                        {(school.phone_primary || school.phone_secondary) && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="font-semibold">
                                    {school.phone_primary}
                                    {school.phone_secondary && ` / ${school.phone_secondary}`}
                                </span>
                            </div>
                        )}
                        
                        {school.email && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="break-all font-semibold">{school.email}</span>
                            </div>
                        )}
                        
                        {school.physical_address && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="font-semibold">{school.physical_address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Title & Status */}
                <div className="text-left lg:text-right w-full lg:w-auto">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-orange-600 mb-3 tracking-tight">INVOICE</h2>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 font-bold text-sm uppercase tracking-wider shadow-sm ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                    </div>
                </div>
            </div>

            {/* Invoice Details & Bill To - Side by Side on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Invoice Details Card */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-navy via-navy/95 to-navy/90 px-4 sm:px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-white font-black text-base sm:text-lg uppercase tracking-wide">Invoice Details</h3>
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 space-y-4">
                        {/* Invoice Number */}
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                            <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-navy" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Invoice Number</p>
                                <p className="text-navy font-black font-mono text-sm sm:text-base truncate">{invoice.invoice_number}</p>
                            </div>
                        </div>

                        {/* Invoice Date */}
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                            <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-navy" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Invoice Date</p>
                                <p className="text-gray-900 font-bold text-sm sm:text-base">
                                    {new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-white rounded-xl border-2 border-orange-200">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-orange-600 font-black uppercase tracking-wider mb-1">Due Date</p>
                                <p className="text-orange-600 font-black text-sm sm:text-base">
                                    {new Date(invoice.due_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Academic Term */}
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                            <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-navy" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Academic Term</p>
                                <p className="text-gray-900 font-bold text-sm sm:text-base">
                                    {invoice.academic_term?.academic_year?.year} - Term {invoice.academic_term?.term_number}
                                </p>
                            </div>
                        </div>

                        {/* Payment Plan */}
                        {invoice.payment_plan && (
                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Payment Plan</p>
                                    <p className="text-green-700 font-bold text-sm sm:text-base capitalize">
                                        {invoice.payment_plan.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bill To Card */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 px-4 sm:px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/40">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-white font-black text-base sm:text-lg uppercase tracking-wide">Bill To</h3>
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-5">
                        {/* Guardian Info Card */}
                        <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50/50 rounded-2xl border-2 border-orange-200 p-4 sm:p-5">
                            {/* Guardian Name */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <span className="text-white font-black text-xl sm:text-2xl">
                                        {invoice.guardian?.first_name?.[0]}{invoice.guardian?.last_name?.[0]}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Parent/Guardian</p>
                                    <h4 className="text-navy font-black text-lg sm:text-xl truncate">
                                        {invoice.guardian?.first_name} {invoice.guardian?.last_name}
                                    </h4>
                                    <p className="text-gray-600 font-mono font-bold text-sm">
                                        ID: {invoice.guardian?.guardian_number}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-3 pt-4 border-t-2 border-orange-200">
                                {invoice.guardian?.phone_number && (
                                    <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-orange-100">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-bold mb-0.5">Phone</p>
                                            <p className="text-gray-900 font-bold text-sm truncate">{invoice.guardian.phone_number}</p>
                                        </div>
                                    </div>
                                )}

                                {invoice.guardian?.email && (
                                    <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-orange-100">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-bold mb-0.5">Email</p>
                                            <p className="text-gray-900 font-bold text-sm truncate">{invoice.guardian.email}</p>
                                        </div>
                                    </div>
                                )}

                                {invoice.guardian?.physical_address && (
                                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-orange-100">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 font-bold mb-0.5">Address</p>
                                            <p className="text-gray-900 font-bold text-sm leading-relaxed">{invoice.guardian.physical_address}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Students Count */}
                                <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg border-2 border-orange-600 shadow-md mt-4">
                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/40">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-orange-100 font-bold uppercase tracking-wider">Students Covered</p>
                                        <p className="text-white font-black text-base">
                                            {invoice.line_items?.length || 0} {invoice.line_items?.length === 1 ? 'Student' : 'Students'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}