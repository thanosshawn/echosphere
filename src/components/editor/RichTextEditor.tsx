
// src/components/editor/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, type Editor, Mark } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';

import { 
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, 
  Pilcrow, Code, Quote, Underline as UnderlineIcon, Link as LinkIcon, 
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Droplet, EyeOff
} from 'lucide-react';
import { Toggle } from "@/components/ui/toggle";
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

// Custom Spoiler Mark
const Spoiler = Mark.create({
  name: 'spoiler',
  
  inclusive: true,

  parseHTML() {
    return [{ tag: 'span[data-spoiler]', class: 'spoiler' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-spoiler': true, class: cn('spoiler', HTMLAttributes.class) }, 0];
  },

  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});


interface RichTextEditorProps {
  initialContent?: string;
  onChange: (htmlContent: string) => void;
  editable?: boolean;
}

const RichTextEditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return; // User cancelled
    if (url === '') { // User wants to remove link
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter the URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const toggleColor = (color: string) => {
    if (color === 'default') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border border-input bg-transparent p-2 rounded-t-md">
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="Toggle Heading 1"><Heading1 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Toggle Heading 2"><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Toggle Heading 3"><Heading3 className="h-4 w-4" /></Toggle>
      
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Toggle bold"><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Toggle italic"><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} aria-label="Toggle underline"><UnderlineIcon className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Toggle strikethrough"><Strikethrough className="h-4 w-4" /></Toggle>
      
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()} aria-label="Align left"><AlignLeft className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()} aria-label="Align center"><AlignCenter className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()} aria-label="Align right"><AlignRight className="h-4 w-4" /></Toggle>

      <Toggle size="sm" onPressedChange={setLink} aria-label="Set link"><LinkIcon className="h-4 w-4" /></Toggle>
      <Toggle size="sm" onPressedChange={addImage} aria-label="Add image"><ImageIcon className="h-4 w-4" /></Toggle>

      <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()} aria-label="Toggle paragraph"><Pilcrow className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} aria-label="Toggle bullet list"><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Toggle ordered list"><ListOrdered className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('codeBlock')} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} aria-label="Toggle code block"><Code className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Toggle blockquote"><Quote className="h-4 w-4" /></Toggle>
      
      <Toggle size="sm" pressed={editor.isActive('spoiler')} onPressedChange={() => editor.chain().focus().toggleSpoiler().run()} aria-label="Toggle spoiler"><EyeOff className="h-4 w-4" /></Toggle>

      {/* Basic Color Picker Example */}
      <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-muted-foreground">Color:</span>
          <button type="button" onClick={() => toggleColor('default')} className={cn("h-5 w-5 rounded border", editor.isActive('textStyle') && !editor.isActive('textStyle', { color: '#FF0000' }) && !editor.isActive('textStyle', { color: '#0000FF' }) && !editor.isActive('textStyle', { color: '#008000' }) ? "ring-2 ring-primary" : "")} style={{ backgroundColor: 'hsl(var(--foreground))' }} aria-label="Default color"></button>
          <button type="button" onClick={() => toggleColor('#FF0000')} className={cn("h-5 w-5 rounded border", editor.isActive('textStyle', { color: '#FF0000' }) ? "ring-2 ring-primary" : "")} style={{ backgroundColor: '#FF0000' }} aria-label="Red color"></button>
          <button type="button" onClick={() => toggleColor('#0000FF')} className={cn("h-5 w-5 rounded border", editor.isActive('textStyle', { color: '#0000FF' }) ? "ring-2 ring-primary" : "")} style={{ backgroundColor: '#0000FF' }} aria-label="Blue color"></button>
          <button type="button" onClick={() => toggleColor('#008000')} className={cn("h-5 w-5 rounded border", editor.isActive('textStyle', { color: '#008000' }) ? "ring-2 ring-primary" : "")} style={{ backgroundColor: '#008000' }} aria-label="Green color"></button>
      </div>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent = '', onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure starter kit options if needed
        // Example: heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false, // default is true, set to false if you want to handle clicks differently
        autolink: true,
      }),
      Image.configure({
        inline: false, // Allows images to be on their own line
        allowBase64: false, // For security, disallow base64 images unless you have a specific need
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle, // Required for Color extension
      Color,
      Spoiler, // Custom spoiler extension
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // Apply Tailwind Typography classes here or on the parent rendering div
        class: 'ProseMirror focus:outline-none w-full rounded-b-md border-input border-t-0 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
      },
      // handleClickOn for spoiler tags to reveal them in the editor
      handleClickOn(view, pos, node, nodePos, event, direct) {
        if (node.type.name === 'spoiler' && event.target instanceof HTMLElement && event.target.closest('.spoiler')) {
           event.target.closest('.spoiler')?.classList.toggle('revealed');
           return true; // Prevent default Tiptap behavior if needed
        }
        return false;
      }
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

    