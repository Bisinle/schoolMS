import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Edit({ auth, stream }) {
    const { data, setData, put, processing, errors } = useForm({
        name: stream.name || '',
        code: stream.code || '',
        status: stream.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/streams/${stream.id}`);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Edit Stream" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/streams"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h2 className="text-2xl font-semibold text-gray-800">Edit Stream</h2>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Stream Name *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="code" value="Stream Code" />
                                <TextInput
                                    id="code"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    maxLength={10}
                                />
                                <InputError message={errors.code} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">Optional short code for the stream</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status *" />
                                <select
                                    id="status"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <PrimaryButton disabled={processing}>
                                    Update Stream
                                </PrimaryButton>
                                <Link
                                    href="/streams"
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

