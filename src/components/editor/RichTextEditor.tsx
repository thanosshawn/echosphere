
// src/components/editor/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Pilcrow, Code, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (htmlContent: string) => void;
  editable?: boolean;
}

const RichTextEditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border border-input bg-transparent p-2 rounded-t-md">
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Toggle Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Toggle Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Toggle Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        aria-label="Toggle paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Toggle code block"
        >
        <Code className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Toggle blockquote"
        >
        <Quote className="h-4 w-4" />
      </Toggle>
      {/* Add more buttons for other formatting options as needed */}
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent = '', onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions if you don't need them
        // heading: { levels: [1, 2, 3] },
        // codeBlock: false, // example
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none min-h-[150px] w-full rounded-b-md border border-input border-t-0 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
  });

  return (
    <div className="rounded-md shadow-sm">
      {editable && <RichTextEditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
