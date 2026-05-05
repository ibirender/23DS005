# Stage 1 — Priority Inbox (Top N Unread)

This document explains the approach used to compute the **top ‘N’ most important unread notifications** using the provided Notification API, without any database queries (as required).

## Goal

Users miss important notifications because of high volume. The Priority Inbox always shows the **top N unread notifications first**, where priority is determined by a combination of:

- **Weight**: `Placement > Result > Event`
- **Recency**: more recent notifications are more important

## Data Source

- **Notifications API**: `GET http://20.207.122.201/evaluation-service/notifications`
- **Auth**: `Authorization: Bearer <access_token>`

The API returns objects like:

- `ID`
- `Type` (`Placement | Result | Event`)
- `Message`
- `Timestamp` (`YYYY-MM-DD HH:mm:ss`)

## Priority Scoring

Each notification is assigned a score:

\[
\text{score} = \text{typeWeight(Type)} + \text{recencyScore(Timestamp)}
\]

### Type weights

- `Placement` = 3
- `Result` = 2
- `Event` = 1

This ensures **type dominates**, and recency breaks ties.

### Recency score (bounded, smooth)

Recency uses exponential decay so that:
- values stay in \( (0, 1] \)
- “very old” items don’t incorrectly outrank recent items of the same type

\[
\text{recencyScore} = 0.5^{\frac{\text{ageHours}}{\text{halfLifeHours}}}
\]

`halfLifeHours` is set to **24** (tunable).

## Finding Top N Efficiently (streaming)

New notifications keep arriving. To maintain the top 10 (or top N) efficiently:

- Use a **min-heap of size N**
- Stream through notifications:
  - push until heap is full
  - for each new item, if its score is greater than heap-min, replace heap-min

Complexity:

- **Time**: \( O(M \log N) \) for \( M \) notifications
- **Space**: \( O(N) \)

This scales well even if the API returns many notifications.

## Unread vs Read (frontend responsibility)

The prompt expects distinguishing unread/read at the frontend level in later stages. For Stage 1, the script computes priority for fetched notifications. In Stage 2, “viewed/unviewed” is maintained in UI state (and can be persisted in local storage if needed).

## Implementation Notes (code)

Stage 1 runnable script:

- `stage1/priority_inbox.js`

Run:

```bash
# PowerShell
$env:AUTH_TOKEN="<access_token>"
node stage1/priority_inbox.js
```

The output prints “Priority Inbox (top 10)” which can be screenshotted for submission.
