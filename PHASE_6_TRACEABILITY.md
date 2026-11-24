# PHASE 6 TRACEABILITY — epicRider

**Baseline:** `bec9911862470796354e3175486b36d1b9d4a75e`  
**Status:** Planned traceability; implementation evidence is NOT YET ASSESSED.  
**Authority:** `MASTER_CONTROL.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `USE_CASES.md`, `UX_REQUIREMENTS.md`, `DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `API_ARCHITECTURE.md`.

| Requirement / use case | Phase 6 slice | Planned implementation boundary | Planned verification | Deferred / limitation |
|---|---|---|---|---|
| REQ-003 | Home/Event + five-item core navigation shell | workspace Home, Event list/detail/create; Asset explicit unavailable state; reuse Team/Profile | route/component/HTTP tests, IA map, screenshots | Full five-page end-to-end capability remains PARTIAL until Asset Phase 8 |
| REQ-007 | active event context and safe switch | visible event context + picker for multiple active assignments; revalidate server-side | multi-assignment integration/UI tests; cross-event negative tests | Offline/stale draft queue is OD-07; unsaved draft warning only if a real draft flow exists |
| REQ-050 | runtime event assignment boundary | EventAssignment links Membership to Event; active membership + assignment required for non-owner reads | DB constraints, policy/API matrix, IDOR tests | OD-130 overlap policy remains OPEN |
| UC-1006 | assign crew and switch context | owner assigns active workspace membership; member sees own assignments; revoke is auditable | create/revoke/switch integration and UI tests | no schedule-conflict rule, no new Event Manager role |
| UC-2002 | create event in workspace | basic event fields: name, start/end schedule, location; DRAFT-only initial state | validation, HTTP create/list/detail, audit tests | full event lifecycle is unapproved candidate C-3 |
| UC-2007 | Home dashboard and quota/license status | real event/member counts; license only through authorized path; quota explicitly TBD | query authorization + data provenance tests + screenshots | tasks Phase 10; assets Phase 8; quota numbers OD-05 |
| UXR-01 / UXR-02 | predictable core IA and terminology | Home/Event/Asset/Team/Profile labels; one canonical location per screen | IA map + nav tests + terminology review | tier-specific additions remain later-phase work |
| UXR-03 | first-run workspace orientation | workspace creation/open routes land on workspace Home without breaking invitation flows | onboarding route tests + task walkthrough | no new auth provider/recovery work |
| UXR-04 | event context/safe switch | shell indicator, picker for 2+ assignments, recheck on every event read | responsive UI + authorization tests | unsaved draft prompt only if drafts exist; OD-07 offline deferred |
| UXR-09 / UXR-10 | responsive web and form usability | target breakpoints, touch targets, labeled single-column forms | screenshots + responsive audit + form tests | native app delivery OD-02 |
| UXR-12 | accessibility aspects | keyboard/focus/labels/headings/error association for Phase 6 screens | automated scan + manual keyboard checklist | no full WCAG 2.2 AA claim without full audit |
| UXR-13 | complete UI states | loading/empty/error/success/denied/stale as relevant | state matrix + component tests | offline/sync pending only if supported; no offline claim |
| UXR-14 | anti-mockup | no dead controls, fake chart or fake operational data | manual anti-mock review | Asset placeholder clearly states unavailable |
| UXR-15 | i18n | Indonesian default, English dictionary parity | dictionary parity test + hard-coded string scan | none |
| UXR-16 / OD-07 | offline honesty | online behavior only; error state when unavailable | copy/behavior scan | offline-first queue/sync deferred |
| UXR-17 / REQ-091 | task-based usability evidence | record task walkthroughs and limitations | evaluation notes with completion/errors | if no real participants, label NOT TESTED; no user-research claim |
| UXR-18 / OD-02 | client-neutral web | responsive browser UI and API boundary remain client-neutral | route/API contract review | Android/iOS/Windows technology remains OPEN |
| UXR-20 | confirmation and audit | confirm assignment revocation; audit event/assignment mutations | UI confirmation + audit tests | no event close/delete action in Phase 6 |
| REQ-006 / UC-2005 | not in Phase 6 | no asset CRUD | ensure no asset model/API introduced | Phase 8 |
| REQ-008 / UC-2006 | not in Phase 6 | no chat/rundown/report/notification feature | scope scan | Phase 10 |
| REQ-009 / OD-05 | not in Phase 6 | no numeric quota or seat enforcement | source and UI scan | owner exclusion accepted; base quota TBD |
| OD-01 / ADR-006 | development/test only | current SQLite only for local/test migration | docs + migration test | production DB decision OPEN |
| OD-02 / ADR-007 | client-neutral | no mobile stack selection | docs scan | OPEN |
| OD-122 | owner/member only | no new roles or dynamic role editor | permission/preset diff | OPEN |
| OD-130 | no conflict decision | no overlap block/auto-resolution | API/service test review | OPEN |
| ADR-017 / D-2 | create replay behavior | use existing mechanism if present; otherwise document/stop affected mutation if unapproved TTL/retention is needed | replay test or blocker evidence | PROPOSED; no invented TTL |

## Traceability status rules

- Planned rows are not implementation evidence.
- Update this file with exact source paths, test names, CI run, screenshots and archive hashes after implementation.
- Do not mark a requirement VERIFIED solely because a route, component or model exists.
- REQ-003 remains PARTIAL until the full five-page end-to-end acceptance is actually met.
