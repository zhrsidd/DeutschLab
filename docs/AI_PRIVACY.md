# DeutschLab AI privacy (v1.1)

## Off by default, optional always

AI is off until you turn it on in Settings → AI feedback and add your own Gemini API key. Every lesson,
checkpoint, Review session, the planner, backups and progress work offline without it. Before the first
cloud request DeutschLab shows a short notice and asks you to confirm; you can withdraw ("Ask me
again") in Settings.

## What is sent to Google, and when

Only when you press a button (Assess with AI, Transcribe with AI, Send, Finish and summarise):

| Action | Sent |
|---|---|
| Writing feedback | your current draft, the task prompt/cues/checklist, a short curriculum summary |
| Transcription | the recording you made (compressed audio) |
| Speaking feedback | the transcript (as shown, possibly edited by you), the task, the curriculum summary |
| Tutor turn | your message, up to 12 recent messages, settings, the curriculum summary and introduced vocabulary |

The curriculum summary contains your current week, completed lesson titles, mastered weeks and lesson
titles with open-mistake counts. It never contains mistake answers, drafts of other lessons, review
items, dates of study, your name or any other table. Existing learner records are never uploaded.

## Google's handling

- On the **free tier**, Google may use submitted content to improve its products (Gemini API pricing
  page, "Used to improve our products: Yes"). Don't include personal details you wouldn't share.
- DeutschLab sends `store: false`, so Google does not keep the interaction for later retrieval through
  the API. This does not delete anything from Google's systems, and DeutschLab cannot confirm or
  request deletion of data Google keeps under its terms.
- The API key is sent only to Google, in a request header, over HTTPS.

## Recordings

Recording starts only when you press Record (macOS asks for microphone permission once). The audio is
kept in memory as one compressed clip so you can listen back; it is never written to disk and is
released when you press Delete recording or leave the screen. Audio is uploaded only if you press
Transcribe with AI (or "Use my recording" in the tutor). Retaining recordings is not offered.

## On this Mac

- `ai_assessments`: assessed text, transcript origin, validated feedback, model, time.
- `ai_tutor_sessions`: conversation messages and summaries.
- `ai_usage`: request time, feature, model, outcome and reported token counts.
- `app_state.ai_settings`: switch, consent time, models and limits.

These are included in JSON backups and snapshots like other learner data. **Delete AI history** in
Settings removes the three AI tables' rows; lessons, scores, Review and drafts are not touched. The API
key is in the macOS Keychain only; **Remove key** deletes it.
