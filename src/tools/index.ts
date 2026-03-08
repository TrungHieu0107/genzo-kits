import { TextComparator } from "./text-comparator/TextComparator";
import { NoteEditor } from "./note-editor/NoteEditor";
import { Settings } from "./settings/Settings";
import { ArrowRightLeft, FileEdit, Settings as SettingsIcon } from "lucide-react";

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
    description: "Side-by-side text difference viewer with native granular tracking.",
    icon: ArrowRightLeft,
    component: TextComparator
  },
  {
    id: "note-editor",
    name: "Note Editor",
    description: "VS Code style editor for .md and .txt files with quick local saving.",
    icon: FileEdit,
    component: NoteEditor
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure general and tool-specific preferences.",
    icon: SettingsIcon,
    component: Settings
  }
];
