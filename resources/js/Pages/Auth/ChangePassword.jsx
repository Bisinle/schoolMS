// import { useForm } from '@inertiajs/react';
// import { useState } from 'react';
// import GuestLayout from '@/Components/GuestLayout';
// import InputError from '@/Components/InputError';
// import InputLabel from '@/Components/InputLabel';
// import PrimaryButton from '@/Components/PrimaryButton';
// import TextInput from '@/Components/TextInput';
// import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// export default function ChangePassword({ mustChange }) {
//     const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//     const [showNewPassword, setShowNewPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//     const { data, setData, put, processing, errors, reset } = useForm({
//         current_password: '',
//         password: '',
//         password_confirmation: '',
//     });

//     const getPasswordStrength = (password) => {
//         if (!password) return { strength: 0, label: '', color: '' };

//         let strength = 0;
//         if (password.length >= 8) strength++;
//         if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
//         if (/\d/.test(password)) strength++;
//         if (/[!@#$%^&*]/.test(password)) strength++;

//         const levels = [
//             { strength: 0, label: 'Very Weak', color: 'bg-red-500' },
//             { strength: 1, label: 'Weak', color: 'bg-orange-500' },
//             { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
//             { strength: 3, label: 'Good', color: 'bg-blue-500' },
//             { strength: 4, label: 'Strong', color: 'bg-green-500' },
//         ];

//         return levels[strength];
//     };

//     const passwordStrength = getPasswordStrength(data.password);

//     const requirements = [
//         { met: data.password.length >= 8, text: 'At least 8 characters' },
//         { met: /[A-Z]/.test(data.password), text: 'One uppercase letter' },
//         { met: /[a-z]/.test(data.password), text: 'One lowercase letter' },
//         { met: /\d/.test(data.password), text: 'One number' },
//         { met: /[!@#$%^&*]/.test(data.password), text: 'One special character (!@#$%^&*)' },
//     ];

//     const submit = (e) => {
//         e.preventDefault();
//         put(route('password.update'), { onSuccess: () => reset() });
//     };

//     return (
//         <GuestLayout>
//             <div className="mb-6 text-center">
//                 <h2 className="text-3xl font-bold text-[#0b1a34] mb-2">
//                     {mustChange ? 'Create Your New Password' : 'Change Password'}
//                 </h2>
//                 <p className="text-gray-600">
//                     {mustChange
//                         ? 'You must create a new password before continuing.'
//                         : 'Update your password to keep your account secure.'}
//                 </p>
//             </div>

//             {mustChange && (
//                 <div className="mb-6 bg-yellow-50 border-l-4 border-[#f97316] p-4 rounded">
//                     <div className="flex">
//                         <div className="flex-shrink-0">
//                             <svg
//                                 className="h-5 w-5 text-[#f97316]"
//                                 viewBox="0 0 20 20"
//                                 fill="currentColor"
//                             >
//                                 <path
//                                     fillRule="evenodd"
//                                     d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                                     clipRule="evenodd"
//                                 />
//                             </svg>
//                         </div>
//                         <div className="ml-3">
//                             <p className="text-sm text-yellow-800">
//                                 <strong>Security Required:</strong> Your administrator has reset your password. Please create a new one now.
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <form onSubmit={submit} className="space-y-6">
//                 {/* Current Password */}
//                 <div>
//                     <InputLabel htmlFor="current_password" value="Current Password" />
//                     <div className="relative mt-1">
//                         <TextInput
//                             id="current_password"
//                             type={showCurrentPassword ? 'text' : 'password'}
//                             name="current_password"
//                             value={data.current_password}
//                             className="block w-full pr-10"
//                             autoComplete="current-password"
//                             onChange={(e) => setData('current_password', e.target.value)}
//                         />
//                         <button
//                             type="button"
//                             className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                             onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                         >
//                             {showCurrentPassword ? (
//                                 <EyeOff className="h-5 w-5 text-gray-400" />
//                             ) : (
//                                 <Eye className="h-5 w-5 text-gray-400" />
//                             )}
//                         </button>
//                     </div>
//                     <InputError message={errors.current_password} className="mt-2" />
//                 </div>

//                 {/* New Password */}
//                 <div>
//                     <InputLabel htmlFor="password" value="New Password" />
//                     <div className="relative mt-1">
//                         <TextInput
//                             id="password"
//                             type={showNewPassword ? 'text' : 'password'}
//                             name="password"
//                             value={data.password}
//                             className="block w-full pr-10"
//                             autoComplete="new-password"
//                             onChange={(e) => setData('password', e.target.value)}
//                         />
//                         <button
//                             type="button"
//                             className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                             onClick={() => setShowNewPassword(!showNewPassword)}
//                         >
//                             {showNewPassword ? (
//                                 <EyeOff className="h-5 w-5 text-gray-400" />
//                             ) : (
//                                 <Eye className="h-5 w-5 text-gray-400" />
//                             )}
//                         </button>
//                     </div>

//                     {/* Password Strength */}
//                     {data.password && (
//                         <div className="mt-2">
//                             <div className="flex items-center justify-between mb-1">
//                                 <span className="text-sm text-gray-600">Password Strength:</span>
//                                 <span
//                                     className={`text-sm font-medium ${
//                                         passwordStrength.strength <= 1
//                                             ? 'text-red-600'
//                                             : passwordStrength.strength === 2
//                                             ? 'text-yellow-600'
//                                             : passwordStrength.strength === 3
//                                             ? 'text-blue-600'
//                                             : 'text-green-600'
//                                     }`}
//                                 >
//                                     {passwordStrength.label}
//                                 </span>
//                             </div>
//                             <div className="w-full bg-gray-200 rounded-full h-2">
//                                 <div
//                                     className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
//                                     style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     <InputError message={errors.password} className="mt-2" />
//                 </div>

//                 {/* Confirm Password */}
//                 <div>
//                     <InputLabel htmlFor="password_confirmation" value="Confirm New Password" />
//                     <div className="relative mt-1">
//                         <TextInput
//                             id="password_confirmation"
//                             type={showConfirmPassword ? 'text' : 'password'}
//                             name="password_confirmation"
//                             value={data.password_confirmation}
//                             className="block w-full pr-10"
//                             autoComplete="new-password"
//                             onChange={(e) => setData('password_confirmation', e.target.value)}
//                         />
//                         <button
//                             type="button"
//                             className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         >
//                             {showConfirmPassword ? (
//                                 <EyeOff className="h-5 w-5 text-gray-400" />
//                             ) : (
//                                 <Eye className="h-5 w-5 text-gray-400" />
//                             )}
//                         </button>
//                     </div>
//                     <InputError message={errors.password_confirmation} className="mt-2" />
//                 </div>

//                 {/* Password Requirements */}
//                 <div className="bg-gray-50 rounded-lg p-4">
//                     <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
//                     <ul className="space-y-1">
//                         {requirements.map((req, index) => (
//                             <li key={index} className="flex items-center text-sm">
//                                 {req.met ? (
//                                     <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
//                                 ) : (
//                                     <XCircle className="h-4 w-4 text-gray-300 mr-2" />
//                                 )}
//                                 <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
//                                     {req.text}
//                                 </span>
//                             </li>
//                         ))}
//                     </ul>
//                 </div>

//                 <div className="flex items-center justify-end">
//                     <PrimaryButton className="w-full justify-center" disabled={processing}>
//                         {processing ? 'Updating...' : 'Update Password'}
//                     </PrimaryButton>
//                 </div>
//             </form>
//         </GuestLayout>
//     );
// }
