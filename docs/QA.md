# Validation record

Verified on 3 October 2026 with Node.js and Chromium.

- Five financial-model tests passed: loan amortization, equal-budget bonus paths, home costs and remaining debt, emergency cash shortfalls, and card reward/fee/redemption rules.
- All 54 complete combinations of predefined answers reached a decision canvas without missing values, NaN, or infinity.
- All four scenarios passed at a 390 × 844 mobile viewport with no horizontal page or result overflow.
- All four sliders responded to keyboard changes and continuous pointer dragging.
- Follow-up summaries and explanation replies worked; changing assumptions cleared summaries made using earlier values.
- Previous-answer navigation, restart, and returning to scenario selection worked.
- No browser runtime errors were observed.
- Desktop welcome, comparison outputs, and mobile layout were visually reviewed.
- The optional WebMCP registration/action adapter passed a browser-stub test for registration, state updates, and invalid scenario rejection. The two tools also appeared in the Codex in-app browser's tool inventory; the stub test is not a certification of compatibility with every WebMCP implementation.

Run `npm test` and `npm run check` for local calculation/syntax checks. With the preview running at port 4173, install development dependencies using `npm ci`, install Chromium using `npx playwright install chromium`, and run `npm run test:ui` to repeat browser checks. Screenshots are written to the ignored `test-results/screenshots/` folder.

These are software checks, not participant interviews or user research. No claim of real prototype validation by target users is made.
