import { TextComparator } from "./text-comparator/TextComparator";
import { NoteEditor } from "./note-editor/NoteEditor";
import { ArrowRightLeft, FileEdit } from "lucide-react";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  component: React.ComponentType;
}

export const tools: ToolDefinition[] = [
  {
    id: "text-comparator",
    name: "Text Comparator",
    description: "Side-by-side text difference viewer with syntax highlighting.",
    icon: ArrowRightLeft,
    component: TextComparator
  },
  {
    id: "note-editor",
    name: "Note Editor",
    description: "VS Code style editor for .md and .txt files with quick local saving.",
    icon: FileEdit,
    component: NoteEditor
  }
];
