# TripBudget — Product Requirements Document

## 1. Product Overview
TripBudget is a mobile-first application that lets a group of travelers record shared trip expenses and see, at any moment, who paid what, how much each person owes, and who should receive money. It is a bookkeeping and calculation tool for group travel spending — not a payment system.

## 2. Problem Statement
Groups traveling together struggle to track who paid for what, how expenses should be divided, and who still owes whom once the trip is over. This is usually done manually (mental math, spreadsheets, chat threads), which is slow and error-prone.

## 3. Product Goal
Let a group record shared expenses during a trip and have the app automatically calculate each member's balance and the minimum set of payments needed to settle up.

## 4. Target Users
- Groups of friends, family, or colleagues traveling together.
- One primary user ("trip owner") who manages the trip and records expenses on behalf of the group.
- Users who want a fast, low-friction way to log a cost the moment it happens (e.g., mid-meal, at a gas station).

## 5. Core User Journey
Create Trip → Add Members → Record Expenses → Split Expenses → Calculate Balances → Settlement

1. User creates a trip (name, destination, dates, notes).
2. User adds the people traveling on that trip.
3. As spending happens, the user records each expense: what it was, how much, who paid, and who it should be split between.
4. The app calculates, at any time, the total spent, each member's fair share, and each member's running balance.
5. The app tells the group the smallest set of payments needed to bring everyone's balance to zero.
6. As real-world payments are made, the user marks them as paid. When no balances remain, the trip shows an "all settled" state.

## 6. MVP Scope
**In scope:**
- Single-device, single-user-operated trip management (no per-member login).
- Creating and viewing trips (upcoming and past).
- Adding members by name only.
- Recording expenses with equal-split among selected members.
- Automatic balance calculation and simplified settlement suggestions.
- Manually marking a settlement as paid (a record-keeping action only).
- Local persistence (localStorage) so data survives a page refresh.

**Out of scope:** see Section 17.

## 7. Features

### 7.1 Home
Purpose: give the user an at-a-glance understanding of their current trip and recent spending within a few seconds — not a full dashboard.

Contents:
- Personalized greeting ("Good evening, {name}") with a supporting line ("Ready for your next trip?").
- Notification icon and profile/avatar icon in the top-right (profile/settings live behind the avatar, not in the bottom nav).
- **Current Trip card**: the single active/most-recent trip, showing trip icon, name, date range, traveler count, and total spending. Tapping it or its "View trip →" link opens Trip Detail. This card is the visual focal point of the screen.
  - If there is no active trip, show the "No active trip" empty state (Section 7.11) instead of the card.
- **Quick actions**: four shortcuts — Add Expense, Members, Settlement, Summary. Add Expense is visually emphasized as the most frequent action.
- **Recent activity**: a short list of the most recent expenses across the current trip (icon, name, payer, date, amount). Tapping a row opens Expense Detail. A "See all" link opens the Expense List.

### 7.2 Trips
Purpose: let the user browse every trip they've created.

Contents:
- Title "My Trips" with a "+" action in the top-right that opens Create Trip.
- Trips grouped into three sections: **Upcoming**, **Active**, **Past Trips**. Each trip is shown as a card with icon, name, date range, traveler count, and amount spent. A status badge visually distinguishes upcoming/active from completed trips, but the distinction should stay subtle (color/label only, not a different layout).
- If a section has no trips, it is omitted (not shown as an empty box).
- If the user has no trips at all, show the "No trips" empty state.
- Tapping a trip card opens Trip Detail.

### 7.3 Create Trip
Purpose: capture the minimum information needed to start a trip, quickly.

Fields:
- Trip name (required)
- Location/destination (required)
- Start date (required)
- End date (required)
- Notes (optional)

Behavior:
- Primary action "Create Trip" saves the trip and immediately continues to Add Members — a new trip is not useful until it has members.
- Form should stay short; no additional fields beyond those listed.

### 7.4 Add Members
Purpose: define who is sharing costs on this trip.

Contents:
- Supporting text: "Who's joining this trip?"
- A list of added members (name + avatar initial).
- "+ Add member" control to add another person by name.
- Primary action "Continue" moves to Trip Detail for the newly created trip.

Constraints:
- Members are names only — no accounts, login, or contact info.
- At least one member should be required before continuing (the trip owner should typically add themselves as a member too, since they can be a payer/participant in splits).

### 7.5 Trip Detail
Purpose: the central hub for a single trip — its summary, members, and expenses.

Contents:
- Header with back navigation, trip name, and an overflow ("⋮") menu (edit/delete trip — see Section 18 ambiguities).
- Hero summary: trip icon, name, date range, traveler count.
- **Spending Summary**: total spending for the trip, and the per-person equal share of that total, both shown prominently.
- **Members**: compact list/avatars of everyone on the trip.
- **Recent Expenses**: a short list of the trip's most recent expenses (icon, category/name, payer, amount), with a "See all" link to the full Expense List.
- Primary action "+ Add Expense", pre-filled to this trip.

### 7.6 Add Expense
Purpose: record a cost in as few steps as possible. This is the single most important interaction in the app.

Fields:
- Expense name ("What did you spend on?")
- Amount (large numeric input, optimized for a numeric keypad)
- Category — single-select from a fixed list: Food, Transport, Ticket, Accommodation, Shopping, Other
- Paid by — a single member from the trip
- Split between — multi-select of trip members (defaults to all members selected)

Behavior:
- As soon as an amount and a set of split members exist, the app shows the computed per-person share live (e.g., "Split 4 ways — Rp40.000 each").
- Date defaults automatically to today; the trip is pre-selected when the screen is opened from Trip Detail (no trip picker needed in that path).
- Primary action "Add Expense" saves the expense, shows a confirmation (toast: "Expense added"), and returns to Trip Detail.
- Screen must stay short — no fields beyond those listed.

### 7.7 Expense List
Purpose: let the user browse and filter all expenses for a trip.

Contents:
- Title "Expenses", with filter controls for category: All, Food, Transport, Tickets, Accommodation, Other.
- Expenses grouped by date (e.g., "Today", "Yesterday"), each row showing category icon, expense name, payer, and amount.
- If no expenses exist for the trip/filter, show the "No expenses" empty state.
- Tapping a row opens Expense Detail.

### 7.8 Expense Detail
Purpose: show the full record of a single expense and allow correction.

Contents:
- Expense name, category, and amount (prominent).
- "Paid by" — the payer.
- "Split between" — each participating member with their individual share amount.
- Actions: **Edit** (returns to a pre-filled Add Expense form) and **Delete** (removes the expense after confirmation).

### 7.9 Balance
(Referred to as "Wallet" in the prototype; see Section 18 — treat "Balance" and "Wallet" as the same screen.)

Purpose: answer "what is my current financial position on this trip?"

Contents:
- **You owe** summary: total amount the user currently owes, followed by a line-item breakdown per person ("You owe {member}: {amount}").
- **You will receive** summary: total amount owed to the user, followed by a line-item breakdown per person ("{member} owes you: {amount}").
- Each line item has a "Mark as paid" action.
- Visual treatment distinguishes "owe" from "will receive" without using aggressive red/green — calm, restrained color use only.
- A "View full settlement" action opens the Settlement screen.
- If the user has no outstanding balances in either direction, show the "All settled" success state.

### 7.10 Settlement
Purpose: show the full group settlement plan, not just the current user's slice of it.

Contents:
- Short explanation of how the total and per-person share were derived (e.g., "Based on {total} total across {n} people ({share} each), here's the simplest way to settle up.").
- **Payments to make**: a list of simplified, minimum-count payments between members (e.g., "Putra → Karina: Rp65.000"), each with a "Mark as paid" action.
- When a payment is marked as paid, its row shows a completed state (e.g., dimmed, checkmark, disabled action) and a confirmation message (e.g., "Putra paid Karina Rp65.000").
- When every payment in the trip is marked paid, replace the list with the "All settled" success state.

### 7.11 Empty States
Every list-based screen has a dedicated empty state rather than a blank screen:
- **No active trip** (Home): "No active trip" / "Plan your next adventure" / "+ Create Trip".
- **No trips** (Trips): "No trips yet" / "Your next adventure starts here." / "+ Create Trip".
- **No expenses** (Expense List): "No expenses yet" / "Start tracking your group spending." / "+ Add Expense".
- **All settled** (Balance/Settlement): "All settled" / "No outstanding payments."
Empty states should always explain what the user can do next and should read as an invitation, not an error.

### 7.12 Success State
- **Expense added**: brief toast confirmation after saving an expense.
- **Payment marked as paid**: the corresponding row updates to a visibly completed state and a toast confirms the action (e.g., "Payment marked as completed" / "{payer} paid {recipient} {amount}").
- **All settled**: a dedicated full-state screen (checkmark, "All settled", "No outstanding payments.") shown once nothing remains to be paid.

## 8. Data Model

**Trip**
- id (unique identifier)
- name
- destination
- start date
- end date
- notes (optional)
- members (list of Member ids)
- expenses (list of Expense ids)
- status (upcoming / active / past) — derived from dates, not manually set
- total spending — derived from its expenses
- balances — derived (see Section 10)
- settlement status (settled / not settled) — derived (see Section 11)

**Member**
- id (unique identifier)
- name
- trip id (the trip this member belongs to)

**Expense**
- id (unique identifier)
- trip id
- name
- amount
- category (Food / Transport / Ticket / Accommodation / Shopping / Other)
- paid by (Member id)
- split between (list of Member ids)
- date (defaults to today at creation)

## 9. Expense Splitting Rules
- MVP supports **equal splitting only**, among whichever members are selected for that expense (not necessarily every trip member).
- Per-person share for an expense = amount ÷ number of selected members.
- If the division does not divide evenly, the remainder is allocated so the total of all shares still equals the original amount exactly (e.g., add the leftover cent/rupiah to one share rather than losing it to rounding).
- An expense must have at least one member selected in "split between," and a payer must be one of the trip's members (the payer does not have to be included in the split).

## 10. Balance Calculation Rules
For each member, per trip:
- **Total should pay** = sum of that member's share across every expense they're included in the split of.
- **Total already paid** = sum of amounts that member paid as the payer across all expenses.
- **Net balance** = Total already paid − Total should pay.
  - Positive net balance → the member is owed money ("will receive").
  - Negative net balance → the member owes money ("you owe").
  - Zero → the member is settled.
- The trip-level "per person" figure shown in Trip Detail (e.g., Rp95.000) is the total trip spending divided evenly by the number of trip members, for quick reference — it is illustrative and separate from the actual per-expense balance calculation above, which can differ if not everyone is included in every expense.

## 11. Settlement Rules
- Settlement translates each member's net balance into a minimum set of direct payments between members (a standard debt-simplification: those who owe pay those who are owed until all balances reach zero, minimizing the number of transactions).
- A settlement entry is a directional record: payer → recipient → amount.
- "Mark as paid" only changes that settlement entry's status to "paid" in the app's records — it does not move money, integrate with any bank, or process a transaction.
- Once a settlement entry is marked paid, it is removed from outstanding balances and reflected as paid history for the trip.
- When every settlement entry for a trip is paid (i.e., every member's net balance is zero), the trip's settlement status becomes "All settled."

## 12. Navigation Structure
Bottom navigation (always visible except within a modal-style flow like Add Expense's members bottom sheet, if used):
- **Home**
- **Trips**
- **Add** — opens Add Expense directly; visually emphasized (larger, raised, filled) compared to the other three items.
- **Balance**

Profile/settings are accessed via the avatar icon in the top-right of Home (and similar top bars), not via the bottom navigation.

Secondary navigation: back arrows on detail/form screens return to the screen that opened them (e.g., Expense Detail → Trip Detail; Add Members → Create Trip going back, Trip Detail going forward).

## 13. UI/UX Requirements
- Mobile-first, single-column layouts; no desktop-style multi-panel dashboards.
- Adding an expense must be reachable in at most two taps from Home (bottom nav "Add," or the Home quick action).
- Financial totals (trip total, per-person share, owe/receive amounts) are always the visually largest text on their screen.
- Category selection and member selection should feel lightweight (chip/checklist style), not like separate full-page pickers.
- Numeric amount entry should use a numeric-optimized input.
- Every destructive action (delete expense) should be confirmed before completing.
- Every state-changing action (add expense, mark as paid) gives immediate visual feedback (toast, updated row, or new screen state).
- Plain, conversational microcopy: "You owe" instead of "Outstanding balance," "You will receive" instead of "Receivable balance," "Add expense" instead of "Input transaction," "Create a new trip" instead of "Create a new travel expenditure group."

## 14. Design System
- **Style**: Clean Outdoor × Modern Finance × Friendly Travel — clean, calm, modern, friendly, premium but not corporate or bank-like.
- **Color**:
  - Background: warm off-white
  - Surface/cards: white
  - Primary: forest/deep natural green (primary buttons, active nav, positive states)
  - Accent: warm yellow/orange (secondary highlights, e.g., upcoming-trip badges)
  - Text: dark charcoal (primary), muted gray (secondary/metadata)
  - "Owe" and "receive" states use restrained, non-alarming tints rather than saturated red/green.
- **Typography**: a modern sans-serif (Inter, Plus Jakarta Sans, or Geist), with a clear scale — large for totals/amounts, medium for section headers/card titles, small for metadata.
- **Shape**: cards ~16–20px radius, buttons ~12–16px radius, inputs ~12–14px radius, chips/badges pill-shaped. Borders and shadows stay subtle.
- **Components** (shared across screens): buttons (primary/ghost), cards (trip card, mini trip card, stat card), input fields, amount field, avatars, category chips, member rows with checkboxes, tabs/filters, list rows (expense/activity), balance/debt rows, bottom navigation, toasts, empty-state blocks, success/confirmation blocks.

## 15. Sample Data
Trip: **Sibayak**, North Sumatra, 12–13 October 2026.
Members: Nopi, Novita, Karina, Putra.
Expenses:
- Fuel — Rp120.000 (paid by Nopi)
- Food — Rp160.000 (paid by Karina)
- Entrance Ticket — Rp80.000 (paid by Novita)
- Parking — Rp20.000 (paid by Putra)

Total: Rp380.000. Split equally 4 ways: Rp95.000 per person.
Resulting simplified settlement (all four expenses split among all four members): Putra owes Karina Rp65.000 and owes Nopi Rp10.000; Novita's and everyone else's balances net out accordingly.

Past trip example (for the Trips screen): **Sibuatan**, 17–18 August 2026, 5 people, Rp750.000 spent.

## 16. MVP Technical Constraints
- No backend service; all data is stored and read from the browser (localStorage or equivalent local state).
- No user accounts or authentication; a single trip owner operates the app on one device.
- Data must persist across a page refresh/app reload.
- No real-time sync between multiple devices/users.

## 17. Out of Scope
The following are explicitly excluded from the MVP and should not be designed or implemented:
- Payment gateway or in-app payment processing
- Digital wallet or holding real money
- Bank account integration
- Maps or location services
- Hotel or flight booking
- Itinerary planning
- Chat or messaging between members
- AI travel planning/recommendations
- GPS tracking
- Social feed
- Complex/push notification systems
- Per-member accounts, login, or permissions
- Unequal/custom-ratio expense splitting (percentage or itemized splits)

## 18. Acceptance Criteria
- User can create a trip with a name, destination, start date, and end date.
- User can add one or more members to a trip by name.
- User can record an expense with a name, amount, category, payer, and a set of members to split between.
- User can select which members participate in a given expense's split.
- System calculates each participant's equal share of an expense correctly, with no rounding loss.
- System calculates, per member, the total they should pay, the total they've already paid (as payer), and their resulting net balance.
- User can view, per trip, who owes money and who is owed money (Balance screen).
- System produces a simplified settlement list (minimum number of payments) that resolves all balances to zero.
- User can mark an individual settlement payment as paid, and this does not trigger any real payment or external transaction.
- Once every settlement payment for a trip is marked paid, the app displays an "All settled" state instead of any outstanding balance.
- User can edit or delete an existing expense, and balances/settlement recalculate accordingly.
- Empty states are shown (with a clear next action) when a trip has no expenses, when the user has no trips, or when a trip has no active trip.
- All trip, member, and expense data persists after refreshing the browser (localStorage).

## 19. Future Improvements
(Explicitly not part of MVP; listed for later consideration only.)
- Custom/unequal expense splits (by percentage or fixed amount per person).
- Multi-device sync or shared access for all trip members (accounts/auth).
- Exporting a trip summary (PDF/CSV) or sharing a read-only trip summary link.
- Multiple currencies per trip.
- Receipt photo attachments on expenses.
- Editing/removing members after expenses already reference them.
- Push notifications for new expenses or payment reminders.
