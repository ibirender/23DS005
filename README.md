# 📢 Notification System – Frontend (Stage 2)

## 🚀 Overview

This project implements the frontend for a notification system using **React/Next.js** and **Material UI**.
It displays notifications with support for filtering, pagination, and status tracking (New vs Viewed).

---

## 🛠️ Tech Stack

* React / Next.js
* Material UI (MUI)
* REST API Integration
* CSS (No external UI libraries used)

---

## 📂 Project Structure

```
PLACEMENT_INTERVIEW/
│
├── notification_app_fe/     # Frontend implementation (Stage 2)
├── notification_app_be/     # Backend (if used)
├── logging_middleware/      # Middleware
├── stage1/                  # Previous stage
├── stage2_next_mui/         # Final UI implementation
└── README.md
```

---

## ⚙️ Features

* 📌 Display notifications list
* 🔍 Filter by type:

  * Event
  * Result
  * Placement
* 📄 Pagination support (`limit`, `page`)
* 🆕 Distinguish **New vs Viewed**
* ✅ “Mark as Viewed” functionality (stored in browser)
* 📱 Fully responsive (Desktop + Mobile)

---

## 🌐 API Used

```
http://20.207.122.201/evaluation-service/notifications
```

### Query Params:

* `limit`
* `page`
* `notification_type`

---

## ▶️ How to Run Locally

```bash
cd notification_app_fe
npm install
npm run dev
```

App will run on:

```
http://localhost:3000
```

---

## 🎥 Demo Video
https://drive.google.com/file/d/181l5L9jy93V2w1b-CkF81yl809e8AtPX/view?usp=sharing

---

## 📌 Notes

* UI built using Material UI only (as per instructions)
* No ShadCN or external UI libraries used
* Focus on clean UX and performance

---

## 👤 Author

Birender Kumar
