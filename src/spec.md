# Specification

## Summary
**Goal:** Add automatic equipment number previewing during equipment creation and improve equipment searching/filtering across the app.

**Planned changes:**
- Add an authenticated backend query to fetch the next auto-generated equipment number without modifying any data.
- Update the create-equipment (Equipment Master) UI to show a read-only “Equipment # (auto-generated)” field populated from the backend and refreshed after successful creation.
- Update the create success message/toast to include the created equipment number returned by the backend.
- Add an Equipment List page search input that filters results client-side without reload, matching equipment number, tag number, name, location, manufacturer, model, and serial number.
- Add a discipline filter on the Equipment List page that can be combined with text search, including a distinct empty state when no matches are found.
- Enhance the EquipmentLookup dropdown UX with type-to-filter support (by equipment number, tag number, and name) and a clear “no matches” state.

**User-visible outcome:** Users can see the next equipment number before creating equipment, create equipment knowing the assigned number, and quickly find/select equipment using expanded search and filtering in the list and lookup dropdowns.
