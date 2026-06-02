import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

// Status config for preview table rows
const STATUS = {
    ready:     { label: 'Will import',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
    duplicate: { label: 'Duplicate',    bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
    failed:    { label: 'Failed',       bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
    error:     { label: 'Error',        bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
};

export default function StudentImportModal({ show = false, onClose }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    // 'upload' | 'previewing' | 'preview' | 'importing'
    const [step, setStep] = useState('upload');
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    const readyCount     = previewRows.filter(r => r.status === 'ready').length;
    const duplicateCount = previewRows.filter(r => r.status === 'duplicate').length;
    const failedCount    = previewRows.filter(r => ['failed', 'error'].includes(r.status)).length;

    const handleClose = () => {
        setFile(null);
        setUploadErrors([]);
        setPreviewRows([]);
        setStep('upload');
        onClose();
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) { setFile(selected); setUploadErrors([]); }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
            setFile(dropped);
            setUploadErrors([]);
        } else {
            setUploadErrors([{ reason: 'Please drop an Excel file (.xlsx or .xls)' }]);
        }
    };

    // Step 1 → Step 2: send file to preview endpoint, show results table
    const handlePreview = async (e) => {
        e.preventDefault();
        if (!file) return;

        setStep('previewing');
        setUploadErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('students.import.preview'), formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'X-Requested-With': 'XMLHttpRequest' },
            });
            setPreviewRows(response.data.rows);
            setStep('preview');
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs) {
                setUploadErrors(Object.values(errs).map(msg => ({ reason: msg })));
            } else {
                setUploadErrors([{ reason: 'Failed to parse the file. Please check the format and try again.' }]);
            }
            setStep('upload');
        }
    };

    // Step 2 confirm → re-submit file to real import endpoint
    const handleConfirm = () => {
        if (!file || readyCount === 0) return;
        setStep('importing');

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('students.import'), formData, {
            forceFormData: true,
            onSuccess: () => handleClose(),
            onError: () => setStep('preview'),
            onFinish: () => {},
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
                            <Dialog.Panel className={`w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all ${step === 'preview' ? 'max-w-3xl' : 'max-w-lg'}`}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <Dialog.Title className="text-lg font-semibold text-navy">
                                            {step === 'preview' || step === 'importing' ? 'Review Before Importing' : 'Bulk Import Students'}
                                        </Dialog.Title>
                                    </div>
                                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* ── SCREEN 1: Upload ── */}
                                {(step === 'upload' || step === 'previewing') && (
                                    <>
                                        <div className="mb-5 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                            <p className="text-sm font-medium text-orange-800 mb-1">Step 1 — Download the template</p>
                                            <p className="text-xs text-orange-700 mb-3">
                                                Required columns: <strong>first_name, last_name, gender, grade, guardian_phone</strong>. Optional: date_of_birth, relationship, enrollment_date, status.
                                            </p>
                                            <a href={route('students.import.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors">
                                                <Download className="w-4 h-4" /> Download Template
                                            </a>
                                        </div>

                                        <form onSubmit={handlePreview}>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Step 2 — Upload the filled file</p>
                                            <div
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'}`}
                                            >
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                {file ? (
                                                    <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-1">
                                                        <CheckCircle className="w-4 h-4" /> {file.name}
                                                    </p>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-gray-600">Drag & drop your file here, or <span className="text-orange-600 font-medium">browse</span></p>
                                                        <p className="text-xs text-gray-400 mt-1">Supports .xlsx and .xls files</p>
                                                    </>
                                                )}
                                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                                            </div>

                                            {uploadErrors.length > 0 && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                                                    {uploadErrors.map((err, i) => (
                                                        <p key={i} className="text-xs text-red-700 flex items-start gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {err.reason}
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
                                                    disabled={!file || step === 'previewing'}
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {step === 'previewing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Upload className="w-4 h-4" /> Preview Import</>}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}

                                {/* ── SCREEN 2: Preview table ── */}
                                {(step === 'preview' || step === 'importing') && (
                                    <>
                                        {/* Summary bar */}
                                        <div className="flex items-center gap-4 mb-4 text-sm">
                                            <span className="flex items-center gap-1.5 font-medium text-green-700">
                                                <CheckCircle className="w-4 h-4" /> {readyCount} will import
                                            </span>
                                            {duplicateCount > 0 && (
                                                <span className="flex items-center gap-1.5 text-yellow-700">
                                                    <AlertCircle className="w-4 h-4" /> {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {failedCount > 0 && (
                                                <span className="flex items-center gap-1.5 text-red-700">
                                                    <AlertCircle className="w-4 h-4" /> {failedCount} failed
                                                </span>
                                            )}
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-auto max-h-96 rounded-xl border border-gray-200">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Row</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {previewRows.map((row, i) => {
                                                        const cfg = STATUS[row.status] ?? STATUS.failed;
                                                        return (
                                                            <tr key={i} className={cfg.bg}>
                                                                <td className="px-3 py-2 text-gray-500">{row.row}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.grade}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.guardian_name ?? row.guardian_phone}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span>
                                                                </td>
                                                                <td className={`px-3 py-2 text-xs ${cfg.text}`}>{row.reason ?? '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-5 flex justify-between items-center">
                                            <button onClick={() => setStep('upload')} disabled={step === 'importing'} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                                <ArrowLeft className="w-4 h-4" /> Back
                                            </button>
                                            <div className="flex gap-3">
                                                <button onClick={handleClose} disabled={step === 'importing'} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleConfirm}
                                                    disabled={readyCount === 0 || step === 'importing'}
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {step === 'importing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><CheckCircle className="w-4 h-4" /> Confirm Import ({readyCount})</>}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
