# Specification

## Summary
**Goal:** Add an “Additional Information” text field to all core record types and a “Discipline” dropdown for Equipment, ensuring data persists across upgrades and is supported end-to-end in the UI and APIs.

**Planned changes:**
- Backend: Add a persistent `additionalInformation` text field to Equipment, SparePart, CataloguingRecord, MaintenanceRecord, and Document types; update all create/update/query methods to accept, store, and return it (default to `""` when omitted).
- Backend: Add a persistent `discipline` field to Equipment with allowed values MECHANICAL, ELECTRICAL, INSTRUMENTATION, PIPING; update equipment create/update/query methods and safely handle empty/unknown values for legacy data.
- Backend: Implement upgrade-safe migration so existing stable records receive default values for the new fields without losing existing data.
- Frontend: Add an “Additional Information” multiline textarea to all relevant create/edit forms (Equipment, Spare Parts, Cataloguing, Maintenance, Documents) and persist via updated backend APIs.
- Frontend: Add a “Discipline” dropdown to Equipment Master create flow (and surface it in equipment list/edit flows) with the exact four options.
- Frontend: Update React Query hooks and backend type usage so all affected CRUD operations include the new fields without TypeScript/runtime mismatches.

**User-visible outcome:** Users can enter and view “Additional Information” on all supported record create/edit pages, and select/view/edit an Equipment “Discipline” value from a fixed dropdown; existing records remain intact after upgrade with blank defaults for new fields.
