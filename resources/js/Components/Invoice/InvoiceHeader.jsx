import { Phone, Mail, MapPin, User } from 'lucide-react';

export default function InvoiceHeader({ school, invoice }) {
    return (
        <div className="bg-gradient-to-r from-orange-50 to-white border-b-4 border-orange-500 p-4 sm:p-6">
            {/* Top Section - School Info & Invoice Title */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                {/* School Info */}
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase mb-2">
                        {school.name}
                    </h1>
                    {school.tagline && (
                        <p className="text-gray-600 italic mb-4 text-sm sm:text-base">{school.tagline}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-700">
                        {(school.phone_primary || school.phone_secondary) && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                <span>
                                    {school.phone_primary}
                                    {school.phone_secondary && ` / ${school.phone_secondary}`}
                                </span>
                            </div>
                        )}
                        
                        {school.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                <span className="break-all">{school.email}</span>
                            </div>
                        )}
                        
                        {school.physical_address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                <span>{school.physical_address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Title */}
                <div className="text-left md:text-right w-full md:w-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-orange-600">INVOICE</h2>
                </div>
            </div>

            {/* Invoice Details - Simple List Style */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-navy to-navy/95 px-4 py-3">
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Invoice Details</h3>
                </div>
                
                <div className="p-4 divide-y divide-gray-100">
                    {/* Invoice Number */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium text-sm">Invoice Number</span>
                        <span className="text-gray-900 font-bold font-mono">{invoice.invoice_number}</span>
                    </div>

                    {/* Invoice Date */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium text-sm">Invoice Date</span>
                        <span className="text-gray-900 font-semibold">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium text-sm">Due Date</span>
                        <span className="text-gray-900 font-semibold">
                            {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Academic Term */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium text-sm">Academic Term</span>
                        <span className="text-gray-900 font-semibold">
                            {invoice.academic_term?.academic_year?.year} - Term {invoice.academic_term?.term_number}
                        </span>
                    </div>
                </div>
            </div>

            {/* Guardian Info */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-navy to-navy/95 px-4 py-3">
                    <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Bill To</h3>
                </div>
                
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-bold text-lg mb-1">{invoice.guardian?.user?.name}</p>
                            <p className="text-gray-600 text-sm">
                                Guardian ID: <span className="font-mono font-semibold">{invoice.guardian?.guardian_number}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}