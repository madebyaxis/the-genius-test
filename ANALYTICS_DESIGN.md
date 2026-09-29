# The Genius Test — Anonymous Result Analytics v1

## Goal

Collect enough anonymous behavior data to improve the questionnaire and result model without collecting personally identifying fields.

The public site remains GitHub Pages. Supabase is used only as the write-only analytics database.

## Result screen v2.0

The result page should show four distinct outputs:

1. Closest player — the primary result.
2. One additional similar player — the second-highest similarity score only.
3. Collaboration match — calculated separately from similarity.
4. Most different player — the opposite end of the current play-style model.

### Collaboration match logic

The collaboration score is intentionally different from character similarity.

It combines:

- style cohesion: social game, alliance stability, risk preference, confrontation, pressure response;
- teammate reliability: alliance stability and pressure stability;
- role complementarity: structure reading, precision, creativity, social play, trading, flexibility, leadership;
- friction penalty: two players simultaneously scoring high on leadership, confrontation, and independence.

The primary result, the additional similar player, and the most-different player are excluded from the collaboration slot so the result page provides four distinct pieces of information.

This is a service-model estimate of game-play collaboration, not a claim about real-world relationships between contestants.

## Data flow

Browser
→ generate one random run UUID
→ collect answer indices in memory
→ calculate result locally
→ insert one row into `test_runs`
→ share/copy/rating actions insert rows into `test_events`

The database never needs to return raw rows to the browser.

## test_runs

Store one row only when a user reaches the result page.

Recommended fields:

- `id`: random UUID generated in browser
- `schema_version`
- `test_version`
- `started_at`
- `completed_at`
- `duration_ms`
- `base_answers`: answer index array, e.g. `[2,0,3,...]`
- `adaptive_answers`: up to two adaptive answer records
- `adaptive_used`
- `adaptive_key`
- `top1`, `top1_score`
- `top2`, `top2_score`
- `score_gap`
- `similar_player`
- `ally_player`
- `opposite_player`
- `dominant_traits`
- optional UTM source / medium / campaign

Do not store:

- name
- email
- phone number
- raw IP in the application table
- full user-agent
- device fingerprint
- login identity

## test_events

Separate event table so the public browser never needs UPDATE permission.

Initial events:

- `share_native`
- `share_copy`
- `self_rating` with a 1–5 rating

This lets us measure sharing and perceived result quality without mutating the original result row.

## Security

MVP:

- Supabase Row Level Security enabled
- browser role has INSERT only
- browser has no SELECT / UPDATE / DELETE policy
- strict check constraints on score ranges, array lengths, and event types
- publishable/anon key may exist in frontend; service-role key must never be shipped to GitHub Pages

After meaningful traffic arrives:

- move writes behind a Supabase Edge Function
- validate allowed origin
- add rate limiting / bot protection
- reject oversized payloads and invalid test versions

## Privacy UX

Before launch of analytics, add a short notice such as:

> 테스트 개선을 위해 개인을 식별하지 않는 익명 응답 통계를 저장합니다.

A concise privacy page should explain what is collected, why, retention, and deletion/aggregation policy.

Recommended starting retention: keep raw anonymous answer rows for 180 days, then retain only aggregated statistics unless longer raw-data retention is genuinely needed.

## First dashboard metrics

1. completed tests
2. result distribution by player
3. question answer distribution
4. adaptive-question trigger rate
5. common TOP1↔TOP2 collision pairs
6. median completion time
7. share rate
8. average self-rating by result
9. self-rating by question-answer pattern
10. version-to-version result distribution

## Calibration milestones

- ~30 completed tests: catch obvious wording/distribution problems
- ~100: start inspecting character/result bias and low-quality questions
- several hundred: consider re-estimating trait weights and adaptive thresholds

Do not tune the model merely to force equal real-user result shares; real populations are not expected to be uniform.

## Implementation sequence

1. Create/connect Supabase project.
2. Run `analytics/supabase_schema.sql`.
3. Add browser answer logging and a one-time result insert.
4. Add anonymous 1–5 “Does this feel like me?” rating.
5. Log share/copy events.
6. Build an admin-only aggregate dashboard.
7. Recalibrate only after enough real responses have accumulated.
