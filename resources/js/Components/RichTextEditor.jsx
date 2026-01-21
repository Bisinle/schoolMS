import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo,
    Palette,
    Type,
} from 'lucide-react';

export default function RichTextEditor({ value, onChange, error, placeholder = 'Start writing...' }) {
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const [currentColor, setCurrentColor] = React.useState('#000000');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            FontFamily,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setColor = (color) => {
        editor.chain().focus().setColor(color).run();
        setCurrentColor(color);
        setShowColorPicker(false);
    };

    const MenuButton = ({ onClick, active, children, title, disabled }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                active ? 'bg-gray-200 dark:bg-gray-600' : ''
            }`}
            title={title}
        >
            {children}
        </button>
    );

    const colors = [
        { name: 'Black', value: '#000000' },
        { name: 'Dark Gray', value: '#444444' },
        { name: 'Gray', value: '#888888' },
        { name: 'Light Gray', value: '#CCCCCC' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Red', value: '#FF0000' },
        { name: 'Orange', value: '#FF8800' },
        { name: 'Yellow', value: '#FFFF00' },
        { name: 'Green', value: '#00FF00' },
        { name: 'Teal', value: '#00CCCC' },
        { name: 'Blue', value: '#0000FF' },
        { name: 'Purple', value: '#8800FF' },
        { name: 'Pink', value: '#FF00FF' },
        { name: 'Brown', value: '#8B4513' },
        { name: 'Dark Red', value: '#CC0000' },
        { name: 'Dark Green', value: '#00CC00' },
        { name: 'Dark Blue', value: '#0000CC' },
        { name: 'Navy', value: '#000080' },
    ];

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    active={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                <MenuButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
                    <LinkIcon className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={addImage} title="Add Image">
                    <ImageIcon className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Color Picker */}
                <div className="relative">
                    <MenuButton
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        active={showColorPicker}
                        title="Text Color"
                    >
                        <Palette className="w-4 h-4" style={{ color: currentColor }} />
                    </MenuButton>
                    {showColorPicker && (
                        <>
                            {/* Backdrop to close color picker when clicking outside */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowColorPicker(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-20 min-w-[280px]">
                                <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Select Text Color
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setColor(color.value)}
                                            className={`w-10 h-10 rounded-md border-2 hover:scale-110 transition-all duration-200 flex items-center justify-center ${
                                                currentColor === color.value
                                                    ? 'border-blue-500 ring-2 ring-blue-300'
                                                    : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        >
                                            {currentColor === color.value && (
                                                <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Custom Color
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={currentColor}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={currentColor}
                                            onChange={(e) => setColor(e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Clear Formatting */}
                <MenuButton
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                    title="Clear Formatting"
                >
                    <Type className="w-4 h-4" />
                </MenuButton>

                <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </MenuButton>
            </div>

            {/* Editor Content */}
            <div className="bg-white dark:bg-gray-900">
                <EditorContent editor={editor} />
            </div>

            {/* Error Message */}
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

            {/* Custom Styles for Editor Content */}
            <style jsx>{`
                :global(.ProseMirror) {
                    outline: none;
                }
                :global(.ProseMirror h1) {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 0.67em;
                    margin-bottom: 0.67em;
                }
                :global(.ProseMirror h2) {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 0.83em;
                    margin-bottom: 0.83em;
                }
                :global(.ProseMirror h3) {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 1em;
                }
                :global(.ProseMirror p) {
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                }
                :global(.ProseMirror ul),
                :global(.ProseMirror ol) {
                    padding-left: 2em;
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                }
                :global(.ProseMirror ul) {
                    list-style-type: disc;
                }
                :global(.ProseMirror ol) {
                    list-style-type: decimal;
                }
                :global(.ProseMirror li) {
                    margin-top: 0.25em;
                    margin-bottom: 0.25em;
                }
                :global(.ProseMirror a) {
                    color: #2563eb;
                    text-decoration: underline;
                }
                :global(.ProseMirror img) {
                    max-width: 100%;
                    height: auto;
                }
                :global(.ProseMirror strong) {
                    font-weight: bold;
                }
                :global(.ProseMirror em) {
                    font-style: italic;
                }
                :global(.ProseMirror u) {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

