# Branch Notes: fix/67-local-error-feedback

## 1. Discoveries & Deviations
- Resolve #67 by replacing the eight remaining browser alerts with the existing ToastService; preserve action guards and failed form input.
- Compare all origin branches and PRs #224/#190: no admin-dashboard or host-settings edits. Reserve Four in a Row #19 for the other conversation.
- Verify rejected admin actions and lobby validation with component specs, then build the frontend.

## 2. Blockers & Risks (4a)
- Production Angular build passes. Supplemental actual-component/template specs: 20/20 pass (Jasmine/jsdom with restored constructor DI metadata).
- Chromium cannot launch in this executor (socket EPERM); Karma bundles compile, supplemental Karma/jsdom execution stalls. Standard full browser suite remains a CI gate; do not treat the auxiliary runner as browser verification.
- Independent adversarial review: PASS, zero actionable defects; existing toast renderer uses an assertive alert live region and z-index above admin modals.

## 3. Quick Wins (4b)
- Add fallback error text when a rejected request has no message; cover all six rejected admin actions plus missing-message errors and both unchanged lobby guards.

## 4. Deferred Items (4c)
- Existing admin confirmation dialogs and modal accessibility remain outside this alert replacement.
