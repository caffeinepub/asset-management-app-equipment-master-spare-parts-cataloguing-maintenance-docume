# Specification

## Summary
**Goal:** Add edit and delete functionality for asset management records (equipment, spare parts, maintenance, cataloguing, and documents) across backend operations and frontend UI.

**Planned changes:**
- Implement backend update and delete methods for Equipment, including cascading deletion of related records keyed by equipmentNumber (spare parts, cataloguing, maintenance, documents).
- Implement backend update and delete methods for Spare Parts (by partNumber and any additional identifier needed by current storage).
- Implement backend update and delete methods for Maintenance records (by maintenanceId) and ensure reports reflect changes.
- Implement backend update and delete methods for Cataloguing records (by equipmentNumber and a stable identifier such as record index).
- Implement backend document deletion by docId (and optionally update documentType metadata by docId).
- Extend React Query hooks to add update/delete mutations for each record type and invalidate the appropriate query keys after successful mutations.
- Add Edit/Delete actions with confirmation dialogs in the Equipment List page and ensure edits refresh the list.
- Add Edit/Delete actions with confirmation dialogs for Spare Parts, including editing name, description, quantity, and supplier.
- Add Edit/Delete actions with confirmation dialogs for Maintenance records, including editing maintenanceType, status, lastMaintenanceDate, and nextMaintenanceDate.
- Add Edit/Delete actions for Cataloguing records to load an existing record into the form for editing and allow deletion with confirmation.
- Add Delete actions with confirmation for Documents (and optionally an Edit action for documentType if supported by the backend), while keeping download unchanged.

**User-visible outcome:** Users can edit or delete equipment, spare parts, maintenance records, cataloguing records, and documents from their respective pages (with confirmation for deletions), and lists/reports refresh to reflect changes with English UI messages.
