# Validation record — 10 October 2026

The refreshed MoneyCanvas MVP demonstration was checked in Chromium at desktop and mobile sizes.

- All 54 complete answer combinations reached the correct result workspace, without missing values or numerical errors.
- All four workspaces passed at 390 × 844, with no page or canvas overflow. Credit card tiles intentionally scroll horizontally on mobile.
- Allocation changes, pointer/keyboard slider input, housing horizons and appreciation presets, funding-source selection, runway months, card selection, and first/renewal year controls were exercised.
- Follow-up summaries update to the current controls. Changing a result clears summaries from previous assumptions.
- Back, restart, and scenario selection passed.
- Normal-motion checks verified the two-second thinking delay, partial streamed text, analysis progress before result reveal, skip control, follow-up streaming, double-click guard, and scenario cancellation during response generation.
- Reduced-motion settings skip decorative timing and animation.
- Five financial tests and JavaScript syntax checks passed. Browser tests observed zero runtime errors.
- Desktop workspaces and the mobile layout were visually reviewed.

Run `npm test` and `npm run check` for model and syntax checks. With the local preview running at port 4173, use `npm ci`, `npx playwright install chromium`, then `npm run test:ui`. Set `BASE_URL` to check a hosted deployment. Screenshots are written to the ignored `test-results/screenshots/` folder.

These are software checks, not research interviews or participant validation. The optional browser-agent actions now await the same UI transitions; they do not connect to an LLM.

## Card references

Selected issuer terms were checked on 10 October 2026. The app provides product links and explains its simplified budget model.

- [HDFC Millennia](https://www.hdfc.bank.in/credit-cards/millennia-credit-card), including linked CashPoints terms.
- [SBI cashback revision effective April 2026](https://www.sbicard.com/cashback-revised).
- [SBI fees and waiver conditions](https://www.sbicard.com/en/most-important-terms-and-conditions.page).
- [Amazon Pay ICICI Bank](https://www.icici.bank.in/personal-banking/cards/credit-card/amazon-pay-credit-card).
