# AutoFinAI: Vehicle Lending Demo — PRD v2.0

**Company:** Crux Auto Finance Pvt. Ltd. | **Platform:** Web (responsive) | **Supersedes:** PRD v1.0 **Status:** Draft for client review | **Nature:** Demo. All integrations are mocked, all data is synthetic.

> **Compliance note.** Regulatory references below reflect the RBI position as understood in Sept 2026. This document is not legal advice. Crux's compliance team must confirm applicability (NBFC layer, fixed vs floating rate, LSP/DSA involvement) before any production use. Items marked **\[VERIFY\]** need that confirmation.

---

## 1. What changed from v1 (summary)

| # | v1 | v2 |
| --- | --- | --- |
| 1 | Name + PAN "login", non-empty validation only | Light sign-up (mobile OTP + name + terms) straight to the dashboard. PAN verification, KYC and bureau consents are captured later, at the start of the loan application (Step 5) |
| 2 | Journey ends in an instant "sanction" driven only by vehicle data | Vehicle valuation is only step 3 of 8. Sanction follows KYC, bureau pull, income/FOIR checks and a real decision (approve / counter-offer / refer / decline) |
| 3 | Borrower gets the maximum loan; no choice | Borrower selects amount and tenure (EMI slider moves from "future" to P0) |
| 4 | Pricing = one base rate | Risk-based rate, fees, GST, APR, amortisation schedule |
| 5 | No KFS, sanction letter, agreement or signature | KFS shown before acceptance; sanction letter; e-signed agreement; repayment mandate |
| 6 | "Accept" = loan exists | Lifecycle: Offered → Accepted → Mandate set → Disbursed → Active → Closed, with cooling-off exit |
| 7 | Used vehicle: colour, engine CC, coarse odometer band | Registration no., owner count, exact odometer, insurance validity, seller type, hypothecation handling with closure conditions |
| 8 | Dealer/agent is "future" | Dealer-assisted mode is P0 (dealers are the primary channel for 2W/4W lending) |
| 9 | Dashboard lists sanctioned loans only | All statuses incl. drafts, referred, declined (with reasons), documents, grievance |
| 10 | Admin portal is "future" | Minimal credit-officer referral queue is P1 (needed to demo the referral path) |
| 11 | "Intelligent"/"AI"/"instant sanction" positioning | Removed. The engine is rule-based; claims must match reality |

---

## 2. Scope

**In scope:** Individual borrowers, personal-use 2W and 4W, new and used, purchase from a dealer (new and used) or from an individual seller (used). **Out of scope (demo):** Commercial/taxi vehicles, top-up/refinance on an owned vehicle, co-lending, real bureau/KYC/payment integrations, collections and recovery. **Open scope question:** Is a co-applicant/guarantor required? (Default: P2, not built.)

### Personas

| Persona | Role in demo | Priority |
| --- | --- | --- |
| Borrower | Self-serve journey | P0 |
| Dealer / agent | Starts and assists an application at the counter. Borrower still gives consent on their own phone | P0 |
| Credit officer | Works the referral queue and records override reasons | P1 |

---

## 3. Corrected end-to-end journey

```
A. Access         → Mobile OTP · name · terms → Dashboard (no PAN, KYC or bureau consent yet)
B. Asset          → 2W/4W · New/Used · (used: seller type)
C. Vehicle        → Catalogue-driven details
D. Valuation      → Indicative collateral value, LTV, max amount, max tenure
E. Loan setup     → Borrower picks amount + tenure, sees EMI and down payment
F. Applicant/KYC  → PAN + consents (KYC, bureau) → profile, income, obligations, KYC, documents, bank
G. Decision       → Bureau + policy rules → Approve / Counter-offer / Refer / Decline
H. Offer & sign   → Sanction letter + KFS → acknowledge → e-sign → e-mandate
I. Pre-disbursal  → Insurance, dealer invoice/margin, (used) inspection + ownership transfer
J. Disbursal      → To dealer/seller (end beneficiary), cooling-off window starts
K. Post-disbursal → RC with hypothecation, servicing, prepayment, closure NOC
```

Stepper shows 8 steps: **1 Asset · 2 Vehicle · 3 Valuation · 4 Loan Setup · 5 Applicant & KYC · 6 Decision · 7 Offer & Sign · 8 Disbursal**. Steps 1-3 keep v1 behaviour with the fixes below.

### Application status model

`Draft → Submitted → In Review → Referred | Declined | Offered → Accepted (Signed) → Mandate Set → Pending Disbursal → Disbursed (Active) → Closed` Side exits: `Expired` (offer validity lapsed), `Withdrawn`, `Cooled-off (exited)`. Rules: "Sanctioned" only means status ≥ Offered. Reference number is issued at **Submitted**; sanction reference is issued at **Offered**.

---

## 4. Functional requirements

Priority: **P0** = required for client demo, **P1** = should have, **P2** = nice to have.

### 4.1 A. Sign-up (light) and privacy

- **AUTH-1 (P0)** Sign-up/login with mobile number + OTP (mock OTP `123456`; 3 attempts, 30-second resend, lockout message) and **name**. Nothing else is asked. On success the borrower lands on the dashboard immediately.
- **AUTH-2 (P0)** One un-ticked checkbox: "I agree to the Terms and have read the Privacy Notice" (covers creating the account and storing mobile and name only). **No PAN, no KYC consent and no bureau consent at sign-up.** PAN capture moves to APP-0.
- **AUTH-3 (P0, moved)** Purpose-specific consents (KYC, bureau, application data) are **not** captured at sign-up. They are captured at the start of Step 5 (**APP-0**), at the moment the data is needed. Marketing consent stays separate and optional and is never a condition of anything.
- **AUTH-4 (P0)** Privacy notice link, and visible "withdraw consent / delete my data" entry in profile (mock action with confirmation).
- **AUTH-5 (P0)** PAN, once entered in Step 5, is masked everywhere (`ABCP****4F`). Session timeout at 10 minutes idle with resume-draft.
- **AUTH-6 (P0)** Footer on every screen: company name, RBI registration placeholder, grievance officer name/email/phone placeholder, "DEMO: simulated data" banner.

### 4.2 Borrower home

- **HOME-1 (P0)** Greeting, **New loan** CTA, and a list of **all** applications with status chips (not sanctioned-only): reference, vehicle, amount, tenure, EMI, status, last updated.
- **HOME-2 (P0)** Draft applications resume at the last completed step. Declined applications show the principal reasons in plain language.
- **HOME-3 (P1)** Loan detail page for Active loans: EMI schedule, paid/outstanding, next due date, documents (sanction letter, KFS, agreement), prepayment/foreclosure quote.
- **HOME-4 (P0)** Grievance card: how to raise a complaint, escalation path, RBI Complaint Management System pointer.
- **HOME-5 (P0)** Logout clears the session. Persisted drafts are keyed to the mobile number (mock persistence, see §8).
- **HOME-6 (P0)** The dashboard is reachable immediately after sign-up, with an empty state and a **New loan** CTA. It is **never gated** on PAN, KYC or consent. Those are requested only when the borrower starts a loan application (Step 5).

### 4.3 B. Asset category

- **AST-1 (P0)** Vehicle type (2W/4W) and condition (New/Used) as in v1.
- **AST-2 (P0)** For Used: **seller type** (Dealer / Individual). Individual sellers trigger extra ownership-transfer conditions later.
- **AST-3 (P0)** Use type = Personal. Commercial selection shows "not supported in this demo".
- **AST-4 (P0)** Changing category after data entry shows a confirmation ("This will clear vehicle and valuation details") before reset. Silent resets are removed.

### 4.4 C. Vehicle details

**New vehicle**

- **NEW-1 (P0)** Make → Model → Variant → Fuel as **cascading selects** from a catalogue. Free text is removed, so invalid combinations cannot exist.
- **NEW-2 (P0)** City/RTO selection. **Ex-showroom price is auto-filled** from the catalogue by variant + city, not typed by the borrower.
- **NEW-3 (P0)** RTO/road tax computed from a rule table (state, fuel, price slab; EV exemptions configurable). Insurance premium is an estimate, editable only within a band. Optional items (accessories, extended warranty, handling) are separate line items, **unchecked by default**.
- **NEW-4 (P0)** On-road price = ex-showroom + road tax + insurance + selected extras. Show breakdown.
- **NEW-5 (P0)** Dealer name/ID and quotation/proforma invoice number (mock upload). In dealer mode, dealer ID is pre-filled.

**Used vehicle**

- **USD-1 (P0)** Registration number (format-validated, state derived), date of first registration, manufacture year, Make/Model/Variant/Fuel (cascading), **owner count**, **exact odometer reading** (bands are derived internally; thresholds differ for 2W and 4W), insurance validity date.
- **USD-2 (P0)** Agreed purchase price and seller type (from AST-2).
- **USD-3 (P0)** Hypothecation status Clear / Active. **Active** requires existing financier name and creates a mandatory pre-disbursal condition: *loan closure proof, NOC and Form 35 before funds are released*. It is not a dead end and not silently ignored.
- **USD-4 (P1)** Chassis number and engine number (last 5 digits) for title verification. Photo uploads (mock) for front, rear, odometer, RC.
- **USD-5 (P1)** Colour and Engine CC become optional/derived from the catalogue. They add friction and no underwriting value.
- **USD-6 (P0)** Mock RC lookup returns owner name, hypothecation status, fitness/insurance validity. A mismatch with borrower-entered data raises a flag in the decision step.

### 4.5 D. Valuation and eligibility (collateral only)

- **VAL-1 (P0)** Output is labelled **"Indicative valuation. Subject to credit assessment and, for used vehicles, physical inspection."** It must not be described as a sanction or approval.
- **VAL-2 (P0)** Funding base:
  - New: on-road price (capped at invoice/quotation).
  - Used: `min(agreed price, computed market value)`.
- **VAL-3 (P0)** Used market value = `reference price × (1 − cumulative depreciation[age]) × odometer factor × owner factor`. Age = (application date − first registration date) / 365.25. Separate parameter tables for 2W and 4W (§6). Rules live in a **config file**, not in components.
- **VAL-4 (P0)** `Max loan = funding base × LTV`. `Max tenure = min(policy tenure cap, age-at-maturity cap − vehicle age)`. Also constrain by borrower age at maturity once DOB is known (re-check in step 5).
- **VAL-5 (P0)** Hard ineligibility outcomes with a clear message: vehicle age beyond cap, active hypothecation without a closure path, funding base below minimum ticket.
- **VAL-6 (P0)** Screen shows inputs used, depreciation applied, LTV, max amount, max tenure, **and the required down payment range**.
- **VAL-7 (P1)** Adapter interface so a real valuation source (e.g. Indian Blue Book) can replace the mock.

### 4.6 E. Loan setup (moved up from "future scope")

- **LS-1 (P0)** Borrower selects **loan amount** (between minimum ticket and Max loan) and **tenure** (6-month steps up to Max tenure). Live EMI, down payment, and total interest update as sliders move.
- **LS-2 (P0)** Displayed rate is labelled **"Indicative rate. Final rate is set after credit assessment."** Do not present the base rate as the customer's rate.
- **LS-3 (P0)** Optional add-ons (credit life insurance etc.) are **never pre-selected** and never required for approval.

### 4.7 F. Applicant profile and KYC

- **APP-0 (P0)** **First thing in Step 5**, before any KYC data is collected:
  1. **PAN entry.** Regex `^[A-Z]{5}[0-9]{4}[A-Z]$`, 4th character `P`. Mocked verification returns name-match: Match / Partial / Mismatch. Mismatch offers a correction path (borrower confirms the PAN name replaces the sign-up name). Masked after entry (AUTH-5).
  2. **Three separate, un-pre-ticked consents:** (a) KYC, (b) credit bureau check, (c) processing personal data for this application. Each states its purpose. Log consent ID, version, timestamp, channel and application reference.
  3. Bureau consent is **per application**: a new application asks again and is not silently reused. Declining a consent stops the application with a clear message and keeps the draft. It does not affect the dashboard or Steps 1 to 4.
- **APP-0a (P1)** Limit drop-off at this step: pre-fill name and mobile from sign-up, save progress per section, and show a short "what we need and why" summary.
- **APP-1 (P0)** Fields: DOB, employment type (Salaried / Self-employed), employer or business name, net monthly income, existing monthly EMIs, residence type, current address + pincode, email, bank account (number, IFSC, name). Auto-fetch name from PAN verification.
- **APP-2 (P0)** Age gate: minimum 21 at application, maximum 65 (salaried) / 70 (self-employed) at loan maturity (config). Failure re-opens tenure selection or declines with reason.
- **KYC-1 (P0)** Mock Aadhaar offline e-KYC / DigiLocker flow. Only masked last 4 digits are retained. PAN and address proof are captured as OVDs.
- **KYC-2 (P0)** Mock CKYC lookup: if found, skip re-collection.
- **KYC-3 (P1)** Mock document upload: income proof (payslip/ITR/bank statement), RC copy (used), invoice/quotation (new). Show upload state and rejection reason (e.g. "blurred").
- **KYC-4 (P2)** Mock OCR and video/selfie KYC. Bank-statement analysis via a mock Account Aggregator flow.

### 4.8 G. Underwriting and decision

- **UW-1 (P0)** Mock bureau pull using the consent captured in APP-0. Returns score, active EMIs, delinquency flag, or **no-hit (new-to-credit)**.
- **UW-2 (P0)** Policy engine (rules in config, §6.4): score bands, FOIR = (existing EMIs + proposed EMI) / net monthly income, age gates, negative-list/fraud check (mock), RC/data mismatch flags, LTV recheck.
- **UW-3 (P0)** Four outcomes, each with its own UI:
  1. **Approved**: proceeds to offer.
  2. **Approved with changes (counter-offer)**: lower amount and/or tenure and/or higher rate with reasons; borrower can accept, modify, or withdraw.
  3. **Referred**: goes to the credit-officer queue; borrower sees "Under review" with expected turnaround.
  4. **Declined**: principal reasons in plain language, in writing on-screen and downloadable. No dead-end: show what could change the outcome where policy allows.
- **UW-4 (P0)** Every decision stores reason codes, rule versions, and inputs (audit trail). Decision is deterministic and explainable. **No "AI" branding unless a model is actually used.**
- **UW-5 (P1)** Credit officer queue: list, application view (bureau summary, flags), approve / counter / decline with **mandatory override reason**, full audit log.
- **UW-6 (P0)** **Demo persona selector**: outcomes are driven by mock PAN (§7) so every path can be shown on demand.

### 4.9 H. Offer, KFS, e-sign, mandate

- **OFR-1 (P0)** Offer screen shows: amount, tenure, rate type (fixed/floating), interest rate, EMI, first EMI date, processing fee + GST, other fees/charges, penal charge terms, prepayment/foreclosure terms, insurance (if any), cooling-off period, **APR**, total interest, total amount payable, offer validity date.
- **OFR-2 (P0)** **Key Fact Statement is generated and displayed before the borrower accepts**, in the standard KFS structure, plus a full amortisation schedule. Available in English + Hindi (P1 for Hindi).
- **OFR-3 (P0)** Sanction letter (PDF) generated at Offered status with sanction reference `SL-YYYY-######` issued by the service layer, not the UI.
- **OFR-4 (P0)** Acceptance sequence: view KFS (must scroll/open) → tick explicit acceptance → **e-sign** (mock Aadhaar eSign with OTP) → agreement + KFS + sanction letter delivered to registered mobile/email (mock). A single "Accept" button is removed. **\[VERIFY\]** whether the client's e-sign method satisfies the current Digital Lending Directions.
- **OFR-5 (P0)** Repayment mandate: mock e-NACH / UPI Autopay setup against the bank account from APP-1, with account-holder name match. First EMI date shown.
- **OFR-6 (P0)** Offer expiry: after N days (config, default 7) status → Expired, and the borrower is prompted to refresh.
- **OFR-7 (P0)** Charges are itemised. GST is a separate line. No charge appears in the agreement that is absent from the KFS.

### 4.10 I. Pre-disbursal

- **PRE-1 (P0)** Checklist with per-item status:
  - Comprehensive insurance with lender's hypothecation noted (mock upload/verify).
  - **New:** dealer invoice matches quotation; margin money (down payment) received by dealer (mock receipt).
  - **Used from dealer:** inspection/valuation report, dealer invoice.
  - **Used from individual:** seller KYC, transfer papers (Forms 29/30), seller consent, existing-loan closure if Active hypothecation (Form 35/NOC).
- **PRE-2 (P0)** Used-vehicle inspection outcome can **change the value** (e.g. −8%), which re-runs LTV and may reduce the loan amount. Show the revised figures and require re-acceptance if the amount changes.
- **PRE-3 (P1)** Officer view of checklist to clear conditions.

### 4.11 J. Disbursal and cooling-off

- **DIS-1 (P0)** Disbursal screen shows the **beneficiary** (dealer or seller bank account, from invoice) and amount. It is never shown as going to an intermediary, aggregator or DSA.
- **DIS-2 (P0)** **Cooling-off window** (Board-configurable, minimum 1 day, disclosed in KFS): borrower sees "Exit without penalty" action (repay principal + proportionate interest; a disclosed one-time processing fee may apply). **\[VERIFY\]** how this maps to asset-backed vehicle loans where funds have already gone to a dealer.
- **DIS-3 (P0)** Timeline: Disbursed → hypothecation initiated at RTO (Form 34) → RC with HP endorsement received (borrower upload, mock) → status Active/Complete.

### 4.12 K. Servicing (P1)

- **SRV-1** EMI schedule, mock payment history, overdue state.
- **SRV-2** Part-prepayment and foreclosure quote. Charges are per the KFS rate type; floating-rate individual loans carry **zero** pre-payment charge. Fixed-rate charges, if any, must be disclosed in sanction letter, agreement and KFS. **\[VERIFY\]** rate type with client.
- **SRV-3** Penal charge shown as a flat, separate line. It is not compounded and not added to the interest rate. **\[VERIFY\]**
- **SRV-4** Closure: NOC and Form 35 status tracker.

### 4.13 Dealer-assisted mode (P0)

- **DLR-1** Mock dealer login (dealer ID, name). Dealer starts the application; the **borrower receives the sign-up OTP on their own phone and later gives the Step 5 KYC/bureau consents on their own device**.
- **DLR-2** Dealer sees status and next action for their applications only. Dealer **never sees** bureau score, income documents beyond what's needed, or full PAN.
- **DLR-3** Dealer payout/commission is **not** displayed to the borrower or in the borrower's flow.
- **DLR-4** Any fees/payments to a dealer or agent are borne by the lender, not charged to the borrower **\[VERIFY\]**.

---

## 5. Cross-cutting requirements

### 5.1 Compliance and trust

- **CMP-1** Consent ledger (APP-0) queryable per application, with withdrawal support.
- **CMP-2** Immutable audit trail for consents, decisions, overrides, KFS versions shown, and signatures.
- **CMP-3** Data minimisation: collect only what a rule or regulation needs. No Aadhaar number stored; masked PAN in UI and logs.
- **CMP-4** No dark patterns: no pre-ticked boxes, no bundled insurance, no countdown pressure, no "instant approval" claims.
- **CMP-5** Plain-language, borrower-readable error and rejection messages.
- **CMP-6** Language toggle English/Hindi for KFS and key screens (P1). The KFS must be in a language the borrower understands.
- **CMP-7** WCAG 2.1 AA for forms and disclosures. Responsive down to 360 px (dealer counter usage is often on phones/tablets).
- **CMP-8** Every screen that shows money states whether it is **indicative** or **final**.

### 5.2 Demo-only safeguards

- Persistent "DEMO: simulated data, no real loan" banner. Use only synthetic PAN/mobile numbers.
- Resettable demo state ("Reset demo" in footer) to rerun scenarios.

---

## 6. Calculation and policy specification

> All numbers below are **illustrative placeholders**. Replace with Crux's board-approved credit policy before showing them as real.

### 6.1 EMI

`EMI = P × r × (1+r)^n / ((1+r)^n − 1)`, where `r = annual rate / 12 / 100` and `n` = months. If `r = 0`, `EMI = P / n`. Money is stored as integer paise (or a decimal library). Round EMI to the nearest rupee; final instalment absorbs the rounding difference. Schedule is **reducing balance**. First EMI date and any broken-period interest are explicit.

### 6.2 APR (for KFS)

APR = annualised IRR on cash flows: `+ (P − upfront fees and charges incl. GST)` at t0, `− EMI` each month. Contingent charges (penal, late fees) are excluded. Include processing fee, verification/documentation charges, and any mandatory financed premium. Annualisation convention (nominal ×12 vs effective) must be confirmed **\[VERIFY\]**. Show APR next to interest rate everywhere.

### 6.3 Valuation parameters (illustrative)

|  | New 2W | New 4W | Used 2W | Used 4W |
| --- | --- | --- | --- | --- |
| Funding base | On-road | On-road | min(price, value) | min(price, value) |
| Max LTV | 85% | 90% | 60% | 70% |
| Max tenure (months) | 48 | 84 | 36 | 60 |
| Max vehicle age at maturity | n/a | n/a | 8 yrs | 12 yrs |
| Min / max ticket | ₹20k / ₹3L | ₹1.5L / ₹40L | ₹15k / ₹2L | ₹1L / ₹25L |

Cumulative depreciation by age (years):

| Age | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4W | 15% | 25% | 32% | 38% | 44% | 50% | 55% | 60% | 64% | 68% |
| 2W | 15% | 27% | 37% | 45% | 52% | 58% | 63% | 68% | n/a | n/a |

Odometer factor: 4W `<30k` 1.00, `30-60k` 0.95, `>60k` 0.88. 2W `<15k` 1.00, `15-30k` 0.95, `>30k` 0.88. Owner factor: 1 owner 1.00, 2 owners 0.95, 3+ owners 0.88.

### 6.4 Underwriting rules (illustrative)

| Rule | Condition | Outcome | Reason code |
| --- | --- | --- | --- |
| Bureau score ≥ 750 |  | Base rate | – |
| Bureau score 700–749 |  | Base + 1.5% | – |
| Bureau score 650–699 |  | Refer | R02 |
| Bureau score \< 650 | with history | Decline | R01 |
| No-hit (new to credit) |  | Refer; max LTV −10 pts | R03 |
| FOIR ≤ 50% |  | Pass | – |
| FOIR 50–60% |  | Counter-offer (lower amount/longer tenure within cap) | R04 |
| FOIR > 60% |  | Decline | R05 |
| Negative-list hit |  | Decline | R06 |
| RC/data mismatch |  | Refer | R07 |
| Age at maturity beyond cap |  | Reduce tenure or decline | R08 |

Base rates (illustrative): New 4W 9.5%, Used 4W 13.5%, New 2W 13.0%, Used 2W 18.0%. Processing fee 1% + GST (min ₹1,000).

---

## 7. Demo personas (mock PAN → outcome)

The mock PAN is typed at the start of Step 5 (APP-0), so the persona is selected there, not at sign-up.

| Mock PAN | Persona | Bureau | Outcome shown |
| --- | --- | --- | --- |
| `ABCPD1001A` | Salaried, strong profile | 780 | Approved, base rate, straight-through |
| `ABCPD2002B` | Thin file | No-hit | Referred, officer approves with reduced LTV |
| `ABCPD3003C` | Stretched obligations | 720, FOIR 56% | Counter-offer (lower amount) |
| `ABCPD4004D` | Weak history | 640 | Declined with reasons |
| `ABCPD5005E` | Negative-list hit | – | Declined (fraud flag), neutral borrower wording |

Additional scripted scenarios:

1. **Used 4W, Active hypothecation** → approved with condition; disbursal blocked until closure proof.
2. **Used vehicle over age cap** → tenure reduced or ineligible at valuation.
3. **Inspection value drop** → amount reduced, re-acceptance required.
4. **Cooling-off exit** after disbursal.
5. **Offer expiry** → Expired status and refresh prompt.
6. **Dealer-assisted 2W** → dealer starts, borrower consents on own phone, disbursal to dealer.

---

## 8. Technical specification

**Keep:** React 19, TypeScript, Vite, Tailwind CSS v4, framer-motion, lucide-react, oxlint, Plus Jakarta Sans.

**Add / change:**

- **Routing:** React Router with one URL per step (`/apply/asset`, `/apply/vehicle`, …). Browser back/forward and refresh must not lose progress. A pure in-memory state machine will fail this on the first refresh.
- **State:** Single application store (Zustand or reducer) with the status model in §3. Persist drafts to `sessionStorage`/`localStorage` **only because data is synthetic**. Production must not persist PII client-side.
- **Service layer:** All external calls (OTP, PAN, KYC, bureau, RC, valuation, e-sign, mandate, disbursal) go through typed adapter interfaces with mock implementations (e.g. MSW or local adapters). Real APIs replace mocks without UI changes.
- **Rules as config:** §6 tables in versioned JSON/TS config, loaded by pure functions. Decision output includes rule version.
- **Forms/validation:** react-hook-form + zod schemas shared with the service layer.
- **Money:** integer paise or `decimal.js`. No floating-point currency maths.
- **Documents:** Sanction letter, KFS, agreement, and amortisation schedule as PDFs (client-side generation is acceptable for the demo).
- **Testing:** Unit tests (Vitest) for EMI, APR, depreciation, FOIR, age/tenure caps with known-answer cases. E2E (Playwright) covering all §7 scenarios.
- **Security (demo hygiene):** synthetic data only; masked PAN in UI/logs; no secrets in the bundle; CSP headers.
- **Reference IDs:** generated by the service layer, sequence-based, never client-random.

---

## 9. Regulatory traceability

| Requirement | Basis | Status in v2 |
| --- | --- | --- |
| KFS before acceptance; APR disclosed; all charges itemised | RBI KFS Directions (Apr 2024); RBI Digital Lending Directions 2025 | OFR-1/2/7 |
| Loan documents delivered digitally, borrower signature | Digital Lending Directions 2025; IT Act e-sign | OFR-4 **\[VERIFY method\]** |
| Cooling-off exit, minimum 1 day, disclosed in KFS | Digital Lending Directions 2025 | DIS-2 |
| Disbursal to borrower or end-beneficiary, not third-party/LSP | Digital Lending Directions 2025 | DIS-1 |
| No automatic limit increase | Digital Lending Directions 2025 | Not implemented (by design) |
| Creditworthiness assessed before lending | Digital Lending Directions 2025; NBFC lending policy | Step 6 |
| Consent, purpose limitation, data minimisation, deletion | DPDP Act 2023 and Rules; Digital Lending Directions data provisions | APP-0, AUTH-2/4, CMP-3 **\[VERIFY\]** |
| KYC (OVD-based, PAN is not KYC on its own) | RBI KYC Master Direction | KYC-1/2 |
| Prepayment charges: none on floating-rate individual loans (sanctioned/renewed on/after 1 Jan 2026); other charges disclosed upfront | RBI Pre-payment Charges Directions 2025 | SRV-2 **\[VERIFY rate type\]** |
| Penal charges: no compounding, no rate add-on | RBI Fair Lending Practice directions (2023) | SRV-3 **\[VERIFY\]** |
| Rejection communicated with reasons | Fair Practices Code | UW-3 **\[VERIFY\]** |
| Bureau reporting (fortnightly) | RBI/CIC directions | Backend, out of demo scope |
| Grievance redressal officer and escalation displayed | Fair Practices Code; Digital Lending Directions | AUTH-6, HOME-4 |
| Hypothecation via RTO (Form 34/35) | Motor Vehicles Act s.51; CMV Rules | I/K stages |
| AI/model governance (if ML used later) | RBI FREE-AI framework (recommendations) | UW-4 |
| Marketing claims match actual process | Fair practices / consumer protection | §1 row 11 |

---

## 10. Phasing

**P0 (client demo):** AUTH-1..6, HOME-1/2/4/5/6, AST-1..4, NEW-1..5, USD-1..3/6, VAL-1..6, LS-1..3, APP-0/1/2, KYC-1/2, UW-1..4/6, OFR-1..7, PRE-1/2, DIS-1..3, DLR-1..3, CMP-1..5/7/8, routing + service layer + rules-as-config, calculation unit tests, §7 scenarios. **P1:** HOME-3, USD-4/5, VAL-7, KYC-3, UW-5, PRE-3, SRV-1..4, Hindi, DLR-4. **P2:** KYC-4, co-applicant, real integrations, refinance/top-up, commercial vehicles.

---

## 11. Open questions for the client

1. NBFC layer and current RBI registration status? (Determines applicable directions and disclosures.)
2. Fixed or floating rate? (Decides foreclosure/pre-payment treatment.)
3. Are any DSAs, dealers, or fintechs acting as LSPs in the journey? (Triggers LSP disclosure and payment-flow rules.)
4. Is Crux the lender-of-record, or is any co-lending or partner-bank arrangement planned?
5. Will insurance be sold by Crux (corporate-agent rules) or only verified?
6. Are commercial 4W (taxi/goods) in demo scope?
7. Which demo audience: credit head, product, or tech? This decides whether §4.8/UW-5 depth or the borrower UX gets the polish.
8. Real credit-policy tables for §6, or should placeholders be used?