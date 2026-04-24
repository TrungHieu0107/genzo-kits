import { XmlNode, FilteredResult } from '../types';

/**
 * Recursively finds all nodes with a specific tag in a list of FilteredResults.
 */
export const getAllNodesByTag = (results: FilteredResult[], tag: string): XmlNode[] => {
  let nodes: XmlNode[] = [];
  for (const r of results) {
    if (r.node.tag === tag) {
      nodes.push(r.node);
    } else if (r.matched_children) {
      nodes = nodes.concat(getAllNodesByTag(r.matched_children, tag));
    }
  }
  // Remove duplicates if any (e.g. nested matches)
  return Array.from(new Set(nodes.map(n => n.id))).map(id => nodes.find(n => n.id === id)!);
};

/**
 * Recursively finds all nodes with a specific tag in a list of XmlNodes.
 */
export const findNodesRecursive = (nodes: XmlNode[], tag: string): XmlNode[] => {
  let found: XmlNode[] = [];
  for (const n of nodes) {
    if (n.tag === tag) {
      found.push(n);
    }
    if (n.children) {
      found = found.concat(findNodesRecursive(n.children, tag));
    }
  }
  return found;
};

/**
 * Gets unique parameter names from a list of Batch nodes.
 */
export const getUniqueParamNames = (nodes: XmlNode[]): string[] => {
  const names: string[] = [];
  for (const node of nodes) {
    for (const child of node.children) {
      if (child.tag === 'Parameter') {
        const name = child.attributes.find(a => a.name === 'name')?.value;
        if (name && !names.includes(name)) {
          names.push(name);
        }
      }
    }
  }
  return names;
};
