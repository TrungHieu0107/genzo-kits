export interface XmlAttr {
  name: string;
  value: string;
}

export interface XmlNode {
  id: string;
  tag: string;
  attributes: XmlAttr[];
  text: string | null;
  children: XmlNode[];
  depth: number;
}

export interface FilterQuery {
  tag: string | null;
  attr_name: string | null;
  attr_value: string | null;
  text: string | null;
}

export interface FilteredResult {
  node: XmlNode;
  matched_by: 'self' | 'child';
  matched_children: FilteredResult[];
}

export interface XmlFile {
  path: string;
  name: string;
  encoding: 'UTF-8' | 'Shift_JIS';
}
