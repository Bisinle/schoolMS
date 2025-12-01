import { Phone, Mail, MapPin } from 'lucide-react';

export default function InvoiceHeader({ school, invoice }) {
    return (
        <div className="bg-gradient-to-r from-orange-50 to-white border-b-4 border-orange-500 p-6 mb-6">
            <div className="flex justify-between items-start">
                {/* School Info */}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 uppercase">
                        {school.name}
                    </h1>
                    {school.tagline && (
                        <p className="text-gray-600 italic mt-1">{school.tagline}</p>
                    )}
                    
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        {(school.phone_primary || school.phone_secondary) && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-orange-600" />
                                <span>
                                    {school.phone_primary}
                                    {school.phone_secondary && ` / ${school.phone_secondary}`}
                                </span>
                            </div>
                        )}
                        
                        {school.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-orange-600" />
                                <span>{school.email}</span>
                            </div>
                        )}
                        
                        {school.physical_address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-600" />
                                <span>{school.physical_address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Title */}
                <div className="text-right">
                    <h2 className="text-4xl font-bold text-orange-600">INVOICE</h2>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Invoice Number</p>
                    <p className="text-gray-900 font-mono font-bold">{invoice.invoice_number}</p>
                </div>
                <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Invoice Date</p>
                    <p className="text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Due Date</p>
                    <p className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Term</p>
                    <p className="text-gray-900">
                        {invoice.academic_term?.academic_year?.year} - Term {invoice.academic_term?.term_number}
                    </p>
                </div>
            </div>

            {/* Guardian Info */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 uppercase text-xs font-semibold mb-1">Bill To</p>
                <p className="text-gray-900 font-bold text-lg">{invoice.guardian?.user?.name}</p>
                <p className="text-gray-600 text-sm">Guardian ID: {invoice.guardian?.guardian_number}</p>
            </div>
        </div>
    );
}

