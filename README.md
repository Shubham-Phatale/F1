# F1·LIVE

An unofficial F1 stats companion built with React Native and Expo.

## Firestore setup (Predictions & Leaderboard)

Predictions and the leaderboard use Cloud Firestore. Apply the security rules in
[`firestore.rules`](./firestore.rules): Firebase Console → Firestore Database →
Rules → paste → Publish. The rules make predictions/leaderboard publicly readable
and owner-only writable.

**Client-side scoring trade-offs (by design, free Spark tier):** each user's app
scores only its *own* predictions against real race results, and the prediction
deadline is enforced client-side. Firestore rules can't verify a computed score or
know a race's start time, so a determined user could in theory submit late or write
a fake score. For this personal/portfolio app that's acceptable; the upgrade path
for true server-side scoring is a Cloud Function (requires the Blaze plan).

## Disclaimer

This is an unofficial, personal, non-commercial project. It is not affiliated with,
endorsed by, or associated with Formula 1, the FIA, or any Formula 1 team. "F1" and
"Formula 1" are trademarks of Formula One Licensing BV. Race data is provided by the
Ergast/Jolpica API and OpenF1 (CC-BY). Driver images are served via the OpenF1 API.
