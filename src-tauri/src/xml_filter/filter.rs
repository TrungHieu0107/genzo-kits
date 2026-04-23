use crate::xml_filter::{XmlNode, FilterQuery, FilteredResult};

pub fn filter_xml_nodes(
    nodes: Vec<XmlNode>,
    query: &FilterQuery
) -> Vec<FilteredResult> {
    let mut results = Vec::new();
    
    // Check if query is actually filtering anything
    let is_empty_query = query.tag.as_deref().unwrap_or("").is_empty() && 
                         query.attr_name.as_deref().unwrap_or("").is_empty() && 
                         query.attr_value.as_deref().unwrap_or("").is_empty() && 
                         query.text.as_deref().unwrap_or("").is_empty();

    for node in nodes {
        if is_empty_query {
            // Return everything as "self" matches with all children
            results.push(map_all_to_result(&node));
        } else {
            let (matched_self, matched_children) = check_match(&node, query);
            
            if matched_self {
                results.push(FilteredResult {
                    node: node.clone(),
                    matched_by: "self".to_string(),
                    matched_children,
                });
            } else if !matched_children.is_empty() {
                results.push(FilteredResult {
                    node: node.clone(),
                    matched_by: "child".to_string(),
                    matched_children,
                });
            }
        }
    }
    
    results
}

fn map_all_to_result(node: &XmlNode) -> FilteredResult {
    FilteredResult {
        node: node.clone(),
        matched_by: "self".to_string(),
        matched_children: node.children.iter().map(map_all_to_result).collect(),
    }
}

fn check_match(node: &XmlNode, query: &FilterQuery) -> (bool, Vec<FilteredResult>) {
    let mut matched_self = true;
    
    if let Some(tag_q) = &query.tag {
        if !tag_q.is_empty() && !node.tag.to_lowercase().contains(&tag_q.to_lowercase()) {
            matched_self = false;
        }
    }
    
    if matched_self {
        if let Some(attr_name_q) = &query.attr_name {
            if !attr_name_q.is_empty() && !node.attributes.iter().any(|a| a.name.to_lowercase().contains(&attr_name_q.to_lowercase())) {
                matched_self = false;
            }
        }
    }
    
    if matched_self {
        if let Some(attr_val_q) = &query.attr_value {
            if !attr_val_q.is_empty() && !node.attributes.iter().any(|a| a.value.to_lowercase().contains(&attr_val_q.to_lowercase())) {
                matched_self = false;
            }
        }
    }
    
    if matched_self {
        if let Some(text_q) = &query.text {
            if !text_q.is_empty() {
                if let Some(node_text) = &node.text {
                    if !node_text.to_lowercase().contains(&text_q.to_lowercase()) {
                        matched_self = false;
                    }
                } else {
                    matched_self = false;
                }
            }
        }
    }
    
    let mut matched_children = Vec::new();
    for child in &node.children {
        let (child_self, child_nested_matched) = check_match(child, query);
        if child_self {
            matched_children.push(FilteredResult {
                node: child.clone(),
                matched_by: "self".to_string(),
                matched_children: child_nested_matched,
            });
        } else if !child_nested_matched.is_empty() {
            matched_children.push(FilteredResult {
                node: child.clone(),
                matched_by: "child".to_string(),
                matched_children: child_nested_matched,
            });
        }
    }
    
    (matched_self, matched_children)
}
