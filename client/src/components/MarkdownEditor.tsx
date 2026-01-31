import React, { useRef } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumTextarea } from "@/components/premium";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, className, rows = 15, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSyntax = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newValue = `${before}${prefix}${selection}${suffix}${after}`;
    onChange(newValue);

    // Restore focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + prefix.length + selection.length + suffix.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBold = () => insertSyntax("**", "**");
  const handleItalic = () => insertSyntax("_", "_");
  const handleList = () => insertSyntax("\n- ");
  const handleH1 = () => insertSyntax("\n# ");
  const handleH2 = () => insertSyntax("\n## ");
  const handleH3 = () => insertSyntax("\n### ");

  const ToolbarButton = ({ icon: Icon, onClick, label }: { icon: any, onClick: () => void, label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className={cn("border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900", className)}>
      <div className="flex items-center gap-1 p-2 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-wrap">
        <ToolbarButton icon={Heading1} onClick={handleH1} label="Heading 1" />
        <ToolbarButton icon={Heading2} onClick={handleH2} label="Heading 2" />
        <ToolbarButton icon={Heading3} onClick={handleH3} label="Heading 3" />
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
        <ToolbarButton icon={Bold} onClick={handleBold} label="Bold" />
        <ToolbarButton icon={Italic} onClick={handleItalic} label="Italic" />
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
        <ToolbarButton icon={List} onClick={handleList} label="Bullet List" />
        <div className="ml-auto text-[10px] uppercase font-black tracking-widest text-slate-400 px-2">
          Markdown Mode
        </div>
      </div>
      <div className="p-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent border-none focus:ring-0 resize-y font-mono text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
