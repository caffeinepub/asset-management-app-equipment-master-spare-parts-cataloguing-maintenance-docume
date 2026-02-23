# Specification

## Summary
**Goal:** Implement a Spare Part Master with noun-modifier classification in the Cataloguing Module, supporting attribute templates, dynamic attribute management, and advanced search.

**Planned changes:**
- Create backend data structures for Attribute_Master and Spare_Part_Attributes tables
- Implement Excel import for attribute templates with noun-modifier-attribute mappings
- Build dynamic attribute loading based on selected noun and modifier combinations
- Add spare part number validation to prevent duplicates and allow editing existing parts
- Implement auto-generation of spare part numbers and short descriptions
- Support linking the same spare part to multiple equipment records
- Create Cataloguing Module UI with Excel import interface
- Build Spare Part Master form with noun/modifier dropdowns and dynamic attribute fields
- Add spare part number autocomplete for selecting/editing existing parts
- Implement equipment linking interface for multi-equipment associations
- Create advanced search with filters for Equipment No, Tag No, Spare Part No, Spare Name, Description, Model No, Part Number, and Serial Num
- Replace placeholder CataloguingPage.tsx with fully functional Spare Part Master interface

**User-visible outcome:** Users can import attribute templates from Excel, create or edit spare parts using noun-modifier classification with dynamically loaded attributes, link spare parts to multiple equipment, and search spare parts using advanced filters across multiple criteria.
