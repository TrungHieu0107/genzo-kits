import { lazy } from "react";
import { ArrowRightLeft, FileEdit, Settings as SettingsIcon, Database, FolderSearch, Replace, LayoutList } from "lucide-react";


const TextComparator = lazy(() => import("./text-comparator/TextComparator").then(m => ({ default: m.TextComparator })));
const NoteEditor = lazy(() => import("./note-editor/NoteEditor").then(m => ({ default: m.NoteEditor })));
const Settings = lazy(() => import("./settings/Settings").then(m => ({ default: m.Settings })));
const SqlLogParser = lazy(() => import("./sql-log-parser").then(m => ({ default: m.SqlLogParser })));
const FolderSearcher = lazy(() => import("./folder-searcher/FolderSearcher"));
const PropertyRenamer = lazy(() => import("./property-renamer").then(m => ({ default: m.PropertyRenamer })));
const XmlFilter = lazy(() => import("./xml-filter").then(m => ({ default: m.XmlFilterTool })));

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
    id: "sql-log-parser",
    name: "Log SQL Extractor",
    description: "Parse log files to find DAO sessions, reconstruct SQL queries with parameters.",
    icon: Database,
    component: SqlLogParser
  },
  {
    id: "xml-filter",
    name: "XML Filter",
    description: "Filter and visualize large XML files with Shift_JIS support and tree navigation.",
    icon: LayoutList,
    component: XmlFilter
  },
  {
    id: "folder-searcher",
    name: "Folder Searcher",
    description: "Search system directories quickly without freezing the UI.",
    icon: FolderSearch,
    component: FolderSearcher
  },
  {
    id: "property-renamer",
    name: "Property Renamer",
    description: "Batch rename properties across JSP, Java, and JS files.",
    icon: Replace,
    component: PropertyRenamer
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure general and tool-specific preferences.",
    icon: SettingsIcon,
    component: Settings
  }
];

