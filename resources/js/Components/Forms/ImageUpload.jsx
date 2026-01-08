import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function ImageUpload({ 
    label, 
    value, 
    onChange, 
    error, 
    required = false,
    helperText = "PNG, JPG, JPEG up to 2MB",
    currentImage = null,
    name = "image"
}) {
    const [preview, setPreview] = useState(currentImage);

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onChange(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        onChange(null);
        setPreview(null);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="flex items-center gap-4">
                {/* Preview */}
                {preview ? (
                    <div className="relative">
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                )}

                {/* Upload Button */}
                <div>
                    <label className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        {preview ? 'Change Photo' : 'Upload Photo'}
                        <input
                            type="file"
                            name={name}
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleChange}
                            className="hidden"
                        />
                    </label>
                    {helperText && (
                        <p className="text-sm text-gray-500 mt-2">{helperText}</p>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}

