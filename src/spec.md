# Specification

## Summary
**Goal:** Enable the spare part cataloguing system to use uploaded Excel files as the source for attribute definitions instead of static templates.

**Planned changes:**
- Parse uploaded Excel file to extract attribute definitions (names, types, validation rules)
- Store parsed attribute definitions in backend state for spare part cataloguing
- Update Spare Part Master form to dynamically render fields based on loaded attribute definitions
- Connect AttributeTemplateImport component to process uploaded file and update the form schema

**User-visible outcome:** Users can upload an Excel file containing attribute definitions, and the Spare Part Master form will immediately adapt to display the attributes from that file with proper field types and validation rules.
