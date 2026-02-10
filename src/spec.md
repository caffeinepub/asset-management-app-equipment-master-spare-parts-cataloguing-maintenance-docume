# Specification

## Summary
**Goal:** Fix the equipment creation flow so authenticated users can create equipment successfully, and provide clear, actionable error messages when creation fails (especially for auth/access-control issues).

**Planned changes:**
- Fix the backend `createEquipment` authorization/access-control logic so a signed-in Internet Identity user can create equipment and receive a new `equipmentNumber`.
- Update the frontend Equipment Master submission flow to surface the real underlying error from `createEquipment` (e.g., unauthorized vs. trap) instead of always showing “Failed to create equipment”.
- Prevent anonymous users from submitting the Equipment Master form and show a clear message that sign-in is required to save equipment.
- Harden actor/access-control initialization handling so initialization failures are surfaced to the UI and the app uses the correct actor after login/logout (avoiding stale identity causing authorization failures).
- Ensure the Equipment List updates to include newly created equipment without requiring a hard refresh.

**User-visible outcome:** Signed-in users can save new equipment from the Equipment Master form and immediately see it in the Equipment List; if they’re signed out or initialization/auth fails, the UI explains the specific reason and guides them to sign in or retry.
