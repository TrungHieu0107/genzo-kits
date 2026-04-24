import { XmlNode } from '../types';

/**
 * Builds a pipe-separated CSV string from a list of Batch nodes.
 * @param nodes List of Batch nodes to export
 * @returns CSV string
 */
export function buildCsvString(nodes: XmlNode[]): string {
  if (nodes.length === 0) return '';

  // Step 1: Collect dynamic Parameter names
  // We preserve insertion order (first-encountered), do NOT sort as per requirements
  const allParamNames: string[] = [];
  for (const batchNode of nodes) {
    for (const child of batchNode.children) {
      if (child.tag === 'Parameter') {
        const paramName = child.attributes.find(a => a.name === 'name')?.value;
        if (paramName && !allParamNames.includes(paramName)) {
          allParamNames.push(paramName);
        }
      }
    }
  }

  // Step 2: Build header row
  const fixedCols = ['Batch_id', 'Batch_name', 'Batch_class', 'Batch_beanclass'];
  const dynamicCols = allParamNames.map(name => `Batch_Parameter_name_${name}`);
  const header = [...fixedCols, ...dynamicCols].join('|');

  // Helper to escape values
  const escapeValue = (val: string | null): string => {
    if (!val) return '';
    // Strip newlines and escape pipes as per requirements
    return val.replace(/\r?\n|\r/g, ' ').replace(/\|/g, '\\|');
  };

  // Step 3: Build data rows
  const rows = nodes.map(batchNode => {
    // Extract fixed columns from batchNode attributes
    const id = batchNode.attributes.find(a => a.name === 'id')?.value ?? '';
    const name = batchNode.attributes.find(a => a.name === 'name')?.value ?? '';
    const cls = batchNode.attributes.find(a => a.name === 'class')?.value ?? '';
    const beanclass = batchNode.attributes.find(a => a.name === 'beanclass')?.value ?? '';

    // Extract dynamic parameter columns
    const paramMap = new Map<string, string>();
    for (const child of batchNode.children) {
      if (child.tag === 'Parameter') {
        const pName = child.attributes.find(a => a.name === 'name')?.value;
        const pValue = child.text ?? '';
        if (pName) paramMap.set(pName, pValue);
      }
    }

    const dynamicValues = allParamNames.map(n => paramMap.get(n) ?? '');
    
    return [
      escapeValue(id),
      escapeValue(name),
      escapeValue(cls),
      escapeValue(beanclass),
      ...dynamicValues.map(escapeValue)
    ].join('|');
  });

  // Step 4: Assemble
  return [header, ...rows].join('\n');
}
