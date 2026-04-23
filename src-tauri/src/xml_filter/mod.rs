use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct XmlNode {
    pub id: String,           // generated UUID for React key
    pub tag: String,
    pub attributes: Vec<XmlAttr>,
    pub text: Option<String>,
    pub children: Vec<XmlNode>,
    pub depth: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct XmlAttr {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FilterQuery {
    pub tag: Option<String>,        // contains, case-insensitive
    pub attr_name: Option<String>,
    pub attr_value: Option<String>,
    pub text: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FilteredResult {
    pub node: XmlNode,
    pub matched_by: String,   // "self" | "child"
    pub matched_children: Vec<FilteredResult>,
}


pub mod parser;
pub mod filter;

#[tauri::command]
pub fn parse_xml_file(path: String) -> Result<Vec<XmlNode>, String> {
    parser::parse_xml_file(path)
}

#[tauri::command]
pub fn filter_xml_nodes(
    nodes: Vec<XmlNode>,
    query: FilterQuery
) -> Result<Vec<FilteredResult>, String> {
    Ok(filter::filter_xml_nodes(nodes, &query))
}

