import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function GuardianImportModal({ show = false, onClose }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState([]);
    const fileInputRef = useRef(null);

    const handleClose = () => {
        setFile(null);
        setErrors([]);
        setIsUploading(false);
        onClose();
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setErrors([]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
            setFile(dropped);
            setErrors([]);
        } else {
            setErrors([{ reason: 'Please drop an Excel file (.xlsx or .xls)' }]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('guardians.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                handleClose();
            },
            onError: (errs) => {
                setIsUploading(false);
                const errorList = Object.values(errs).map((msg) => ({ reason: msg }));
                setErrors(errorList);
            },
            onFinish: () => setIsUploading(false),
        });
    };

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <Dialog.Title className="text-lg font-semibold text-navy">
                                            Bulk Import Guardians
                                        </Dialog.Title>
                                    </div>
                                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Step 1 — Download template */}
                                <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-sm font-medium text-blue-800 mb-1">Step 1 — Download the template</p>
                                    <p className="text-xs text-blue-600 mb-3">
                                        Fill in the template with guardian details. Required columns: <strong>name, email, phone_number, relationship</strong>. Optional: address, occupation.
                                    </p>
                                    <a
                                        href={route('guardians.import.template')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Template
                                    </a>
                                </div>

                                {/* Step 2 — Upload */}
                                <form onSubmit={handleSubmit}>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Step 2 — Upload the filled file</p>

                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                                            isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        {file ? (
                                            <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> {file.name}
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-600">Drag & drop your file here, or <span className="text-blue-600 font-medium">browse</span></p>
                                                <p className="text-xs text-gray-400 mt-1">Supports .xlsx and .xls files</p>
                                            </>
                                        )}
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                                    </div>

                                    {errors.length > 0 && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                                            {errors.map((err, i) => (
                                                <p key={i} className="text-xs text-red-700 flex items-start gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                    {err.reason}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-5 flex justify-end gap-3">
                                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!file || isUploading}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {isUploading ? 'Importing...' : 'Import Guardians'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

