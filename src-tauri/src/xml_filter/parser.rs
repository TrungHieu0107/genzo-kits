use quick_xml::events::Event;
use quick_xml::reader::Reader;
use crate::xml_filter::{XmlNode, XmlAttr};
use std::fs;
use encoding_rs::SHIFT_JIS;

pub fn parse_xml_file(path: String) -> Result<Vec<XmlNode>, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Decode Shift_JIS as requested
    let (decoded, _, _) = SHIFT_JIS.decode(&bytes);
    let content = decoded.into_owned();

    let mut reader = Reader::from_str(&content);
    reader.config_mut().check_comments = false;

    let mut stack: Vec<XmlNode> = Vec::new();
    let mut roots: Vec<XmlNode> = Vec::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => {
                let tag = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let mut attributes = Vec::new();
                for attr in e.attributes() {
                    if let Ok(a) = attr {
                        attributes.push(XmlAttr {
                            name: String::from_utf8_lossy(a.key.as_ref()).into_owned(),
                            value: String::from_utf8_lossy(&a.value).into_owned(),
                        });
                    }
                }
                let depth = stack.len();
                let node = XmlNode {
                    id: uuid::Uuid::new_v4().to_string(),
                    tag,
                    attributes,
                    text: None,
                    children: Vec::new(),
                    depth,
                };
                stack.push(node);
            }
            Ok(Event::Empty(e)) => {
                let tag = String::from_utf8_lossy(e.name().as_ref()).into_owned();
                let mut attributes = Vec::new();
                for attr in e.attributes() {
                    if let Ok(a) = attr {
                        attributes.push(XmlAttr {
                            name: String::from_utf8_lossy(a.key.as_ref()).into_owned(),
                            value: String::from_utf8_lossy(&a.value).into_owned(),
                        });
                    }
                }
                let depth = stack.len();
                let node = XmlNode {
                    id: uuid::Uuid::new_v4().to_string(),
                    tag,
                    attributes,
                    text: None,
                    children: Vec::new(),
                    depth,
                };
                if let Some(parent) = stack.last_mut() {
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            }
            Ok(Event::Text(e)) => {
                let text = e.unescape().map(|c| c.into_owned()).unwrap_or_default();
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    if let Some(node) = stack.last_mut() {
                        if let Some(existing) = &mut node.text {
                            existing.push_str(trimmed);
                        } else {
                            node.text = Some(trimmed.to_string());
                        }
                    }
                }
            }
            Ok(Event::End(_)) => {
                if let Some(node) = stack.pop() {
                    if let Some(parent) = stack.last_mut() {
                        parent.children.push(node);
                    } else {
                        roots.push(node);
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("Error at position {}: {:?}", reader.buffer_position(), e)),
            _ => (), // Skip comments and other events
        }
        buf.clear();
    }

    Ok(roots)
}
