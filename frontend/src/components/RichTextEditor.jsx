import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle, FontFamily } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Eraser,
} from 'lucide-react'

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Sans-serif', value: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { label: 'Serif (display)', value: 'Fraunces, Georgia, serif' },
  { label: 'Monospace', value: '"JetBrains Mono", monospace' },
]

const COLORS = [
  '#1C1917', '#57534E', '#F59E0B', '#D97706', '#059669', '#0EA5E9',
  '#6366F1', '#A855F7', '#E11D48', '#EAB308',
]

const TbButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-8 h-8 rounded-md flex items-center justify-center text-ink-700 transition-colors
      ${active ? 'bg-saffron-100 text-saffron-800' : 'hover:bg-ink-100'}
      disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const Divider = () => <span className="w-px h-5 bg-ink-200 mx-1" />

export const RichTextEditor = ({ value, onChange, placeholder, minHeight = 160 }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // TipTap's "empty" state is "<p></p>" — normalise to empty string
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'prose-content focus:outline-none px-3 py-2.5',
        style: `min-height:${minHeight}px;`,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  })

  // Keep external `value` updates in sync (e.g. when switching menu cards)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ''
    if (incoming !== current && incoming !== '' && incoming !== '<p></p>') {
      editor.commands.setContent(incoming, false)
    }
    if (!incoming && current && current !== '<p></p>') {
      editor.commands.clearContent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  const setFont = (family) => editor.chain().focus().setFontFamily(family || null).run()

  return (
    <div className="rounded-xl border border-ink-200 bg-white focus-within:border-saffron-400 focus-within:ring-4 focus-within:ring-saffron-500/15 transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-ink-100 bg-ink-50/40 rounded-t-xl">
        <select
          className="text-xs px-2 py-1 rounded-md border border-ink-200 bg-white text-ink-700"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => setFont(e.target.value)}
          title="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        <Divider />

        <TbButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </TbButton>

        <Divider />

        <TbButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </TbButton>

        <Divider />

        <TbButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="w-4 h-4" />
        </TbButton>

        <Divider />

        <TbButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className="w-4 h-4" />
        </TbButton>
        <TbButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className="w-4 h-4" />
        </TbButton>

        <Divider />

        {/* Color picker */}
        <div className="flex items-center gap-0.5">
          <input
            type="color"
            value={editor.getAttributes('textStyle').color || '#1C1917'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-7 h-7 rounded-md border border-ink-200 bg-white cursor-pointer p-0.5"
            title="Text colour"
          />
          <div className="hidden md:flex gap-0.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="w-5 h-5 rounded-full border border-ink-100 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <Divider />

        <TbButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().unsetColor().unsetFontFamily().setTextAlign('left').run()}
          title="Clear formatting"
        >
          <Eraser className="w-4 h-4" />
        </TbButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
