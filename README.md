# 🎮 GameZone Arcade - Console Station Reservation System

> **Backend Development Fundamentals (BDF) · Modules 1 to 3 Group Assignment**  
> **Theme 16 of 30:** Console Stations  
> **Course Code:** STCSE2AG01 | **Section:** CSE2A | **Group:** 1 of 15  

---

## 📌 Problem Statement & Solution

### 🚨 The Client Brief
> *"Console stations run first come, first served. Players queue for hours while some stations stay empty. Please build us a system that fixes this."*

### 💡 The Solution
**GameZone Arcade Backend** is a high-performance RESTful API built with **Express.js** and an **SQLite** relational database. It replaces chaotic queues with an automated station reservation platform:
- **Gamers** can register and manage their arcade profiles.
- **Console Stations** across multiple platforms (PlayStation 5, Xbox Series X/S, Nintendo Switch, Steam Deck) are inventoried and searchable.
- **Bookings** link gamers to consoles over specific date ranges.
- **Twist Rule ("Free on this date"):** Real-time availability endpoint (`GET /consoles/available?date=YYYYMMDD`) instantly reveals all unbooked stations for any selected calendar date, completely eliminating empty stations and long wait times.

---

## 👥 Who Does What (Role Distribution & Ownership)

| Part | Responsibility | Primary Files Owned | Assigned Member |
| :--- | :--- | :--- | :--- |
| **1. Server & Routes** | Express initialization, router mounting, HTTP status codes, centralized error handling | `server.js` | Member 1 |
| **2. Database** | SQLite schema (3 tables), foreign key constraints, connection pool, seeding script | `db/database.js`, `db/seed.js` | Member 2 |
| **3. REST Endpoints** | Console CRUD (`GET`, `POST`, `PUT`, `DELETE`) & The Join Endpoint (`GET /bookings`) | `routes/consoles.js`, `routes/bookings.js` | Member 3 |
| **4. Validation & Search** | Input payload sanitization, clear error messaging, query filtering (`?platform=...`) | `middleware/validator.js`, `routes/consoles.js` | Member 4 |
| **5. Twist Rule** | "Free on this date" logic, date normalization (`YYYYMMDD`), Tests 1, 2, 3 compliance | `middleware/validator.js`, `routes/consoles.js`, `test/twist.test.js` | Member 5 |
| **6. Postman & README** | Postman collection (`postman_collection.json`), automated tests, and project documentation | `postman_collection.json`, `README.md` | Member 6 |

---

## 🌀 The Twist: "Free on this date"

### Twist Rules:
1. Every booking requires a valid `start_date` and `end_date`.
2. **Test 1:** If `end_date` is before `start_date`, the API immediately rejects the request with **HTTP 400 Bad Request** and an explicit error message.
3. **Availability Endpoint:** `GET /consoles/available?date=YYYYMMDD` returns all console stations that do **not** have an active booking covering the queried date.
4. Flexible date parsing supports both **YYYYMMDD** (e.g. `20261111`), **YYYY-MM-DD** (`2026-11-11`), and textual dates (`11 Nov`, `11 Nov 2026`).

### Verification of Core Tests:
- **Test 1 (End before start → 400):**  
  `POST /bookings` with `start_date: "20261115"`, `end_date: "20261110"` returns `400 Bad Request`.
- **Test 2 (Console 4 booked 10 to 12 Nov; date=11 Nov → 200, Console 4 missing):**  
  `GET /consoles/available?date=20261111` returns `200 OK` listing stations, with **Console 4 missing**.
- **Test 3 (available?date=13 Nov → 200, Console 4 listed):**  
  `GET /consoles/available?date=20261113` returns `200 OK` with **Console 4 listed**.

---

## 🗄️ Database Architecture & ER Model

SQLite database schema with relational foreign keys:

```
+--------------------+        +--------------------+        +--------------------+
|       GAMERS       |        |      BOOKINGS      |        |      CONSOLES      |
+--------------------+        +--------------------+        +--------------------+
| id (PK, INT, AUTO) | 1    * | id (PK, INT, AUTO) | *    1 | id (PK, INT, AUTO) |
| name (TEXT)        |<-------| gamer_id (FK, INT) |------->| name (TEXT)        |
| email (TEXT, UNIQ) |        | console_id (FK,INT)|        | platform (TEXT)    |
| created_at (DATET) |        | start_date (TEXT)  |        | status (TEXT)      |
+--------------------+        | end_date (TEXT)    |        +--------------------+
                              | created_at (DATET) |
                              +--------------------+
```

### Foreign Key Constraints
`PRAGMA foreign_keys = ON;` is enforced. Deleting a console or gamer cascades or preserves relational integrity.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-github-repo-link>
cd "Group Assignment 1"
npm install
```

### 3. Seed Sample Database
Populate initial gamers, console stations (including Console 4: PlayStation 5 Pro), and the reference booking for Twist testing:
```bash
npm run seed
```

### 4. Start the Express Server
```bash
npm start
```
The server starts at `http://localhost:3000`.

### 5. Run Automated Test Suite
Execute the built-in automated test suite covering all 25 assertions:
```bash
npm test
```

---

## 📡 API Reference

### 1. Consoles Endpoints

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/consoles` | `200` | List all console stations |
| `GET` | `/consoles?platform=PlayStation` | `200` | Filter consoles by platform name |
| `GET` | `/consoles?search=Switch` | `200` | Search consoles by name or platform |
| `GET` | `/consoles/available?date=YYYYMMDD` | `200` / `400` | **Twist Endpoint:** List consoles free on date |
| `GET` | `/consoles/:id` | `200` / `404` | Get single console by ID |
| `POST` | `/consoles` | `201` / `400` | Add new console (`name`, `platform` required) |
| `PUT` | `/consoles/:id` | `200` / `400` / `404` | Update console name, platform, or status |
| `DELETE` | `/consoles/:id` | `200` / `404` | Delete console by ID |

#### Example: Add Console (`POST /consoles`)
**Request Body:**
```json
{
  "name": "Station 7 - Nintendo Switch OLED",
  "platform": "Nintendo Switch"
}
```
**Response (201 Created):**
```json
{
  "id": 7,
  "name": "Station 7 - Nintendo Switch OLED",
  "platform": "Nintendo Switch",
  "status": "active"
}
```

---

### 2. Bookings & Join Endpoint

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/bookings` | `200` | **Join Endpoint:** All bookings with gamer and console details |
| `GET` | `/bookings/:id` | `200` / `404` | Single booking with joined names |
| `POST` | `/bookings` | `201` / `400` / `404` | Create booking (enforces `end_date >= start_date`) |
| `DELETE` | `/bookings/:id` | `200` / `404` | Cancel / delete booking |

#### Example: The Join Endpoint (`GET /bookings`)
```sql
SELECT 
  b.id, b.gamer_id, g.name AS gamer_name, g.email AS gamer_email,
  b.console_id, c.name AS console_name, c.platform AS console_platform,
  b.start_date, b.end_date, b.created_at
FROM bookings b
JOIN gamers g ON b.gamer_id = g.id
JOIN consoles c ON b.console_id = c.id
ORDER BY b.start_date DESC;
```
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "gamer_id": 1,
    "gamer_name": "Alex Mercer",
    "gamer_email": "alex.mercer@gmail.com",
    "console_id": 4,
    "console_name": "Station 4 - PlayStation 5 Pro",
    "console_platform": "PlayStation 5",
    "start_date": "2026-11-10",
    "end_date": "2026-11-12",
    "created_at": "2026-11-13 16:15:00"
  }
]
```

---

### 3. Gamers Endpoints

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/gamers` | `200` | List all registered gamers |
| `GET` | `/gamers/:id` | `200` / `404` | Get gamer by ID |
| `POST` | `/gamers` | `201` / `400` | Register gamer (`name`, `email` required) |
| `PUT` | `/gamers/:id` | `200` / `400` / `404` | Update gamer details |
| `DELETE` | `/gamers/:id` | `200` / `404` | Delete gamer profile |

---

## 🧪 Postman Collection Setup

1. Open **Postman**.
2. Click **Import** (top left).
3. Select `postman_collection.json` located in the root of this project.
4. Ensure the collection variable `baseUrl` is set to `http://localhost:3000`.
5. Run the **Twist Tests** folder or the entire collection with the **Postman Collection Runner** — all tests will execute and turn green!

---

## 🎤 Demo Day Guide (3 Minutes & Individual Q&A)

### ⏱️ 3-Minute Live Demo Script
- **Minute 0:00 - 0:45 (Overview & Architecture):** Show the server running on port 3000, explain SQLite tables (`gamers`, `consoles`, `bookings`), and demonstrate the problem solved.
- **Minute 0:45 - 1:45 (The Twist Tests):**
  1. Trigger `POST /bookings` with `end_date < start_date` → Show **400 Bad Request** error (Test 1).
  2. Trigger `GET /consoles/available?date=20261111` → Show **Console 4 is missing** because of the 10-12 Nov booking (Test 2).
  3. Trigger `GET /consoles/available?date=20261113` → Show **Console 4 is listed** because the booking has ended (Test 3).
- **Minute 1:45 - 2:30 (CRUD & Join Endpoint):**
  1. Demonstrate `GET /consoles?platform=PlayStation` showing platform search.
  2. Call `GET /bookings` showing the SQL `JOIN` returning `gamer_name` and `console_name`.
  3. Create a console with `POST /consoles` (201) and attempt with missing fields (400 validation error).
- **Minute 2:30 - 3:00 (Postman & Test Suite):** Run `npm test` showing 25/25 automated tests passing.

---

### 💬 Individual Q&A Cheat-Sheet

#### Member 1: Server and Routes
- **Q:** *Why did you place `router.get('/available', ...)` before `router.get('/:id', ...)`?*
- **A:** *"In Express, routing matches in the order routes are declared. If `/:id` was declared first, Express would treat `'available'` as an ID parameter and attempt to query console ID `'available'`, resulting in a 400 or 404 error instead of invoking the twist handler."*

#### Member 2: Database & Queries
- **Q:** *How did you enforce foreign key constraints in SQLite, and how are tables related?*
- **A:** *"By default, SQLite disables foreign key checks. We execute `PRAGMA foreign_keys = ON;` immediately on database connection. The `bookings` table links to `gamers(id)` and `consoles(id)` with `ON DELETE CASCADE` to prevent orphaned reservations."*

#### Member 3: REST Endpoints & Join
- **Q:** *Explain the SQL JOIN query used in the bookings endpoint.*
- **A:** *"We perform an `INNER JOIN` from `bookings` to `gamers` on `bookings.gamer_id = gamers.id` and to `consoles` on `bookings.console_id = consoles.id`. This combines relational data in one query, returning `gamer_name` and `console_name` without requiring multiple frontend requests."*

#### Member 4: Validation and Search
- **Q:** *How is validation handled for missing fields, and how does search work?*
- **A:** *"We implemented middleware (`validateConsole`, `validateGamer`, `validateBooking`). If required fields are missing or whitespace, it halts execution and returns a descriptive 400 Bad Request JSON response. Search uses SQL parameterized queries with `LIKE %query%` and `LOWER()` for safe, case-insensitive filtering."*

#### Member 5: Twist Rule ("Free on this date")
- **Q:** *How did you determine if a console is available on a specific date?*
- **A:** *"A booking covers date $D$ if `start_date <= D AND end_date >= D`. We run a subquery to find all `console_id`s with active bookings covering date $D$, and select all consoles `WHERE id NOT IN (subquery)`. Date inputs are normalized so `YYYYMMDD`, `YYYY-MM-DD`, and textual dates like `11 Nov` are parsed reliably."*

#### Member 6: Postman and README
- **Q:** *How does your Postman collection verify that Test 2 and Test 3 pass automatically?*
- **A:** *"Each Postman request contains JavaScript test scripts in the 'Tests' tab using `pm.test()` and `pm.expect()`. For Test 2, it verifies that `response.consoles.find(c => c.id === 4)` is undefined. For Test 3, it verifies that Console 4 is present with `id === 4`."*

---

## 📂 Project Directory Structure

```
├── package.json               # Project manifest, dependencies, and npm scripts
├── server.js                  # Main Express app, route mounting, error handling
├── gamezone.db                # SQLite database file
├── .gitignore                 # Excludes node_modules and logs
├── postman_collection.json    # Complete Postman collection with automated test scripts
├── README.md                  # Comprehensive project documentation
├── db/
│   ├── database.js            # SQLite database connection & schema initialization
│   └── seed.js                # Initial seed data (gamers, consoles, twist bookings)
├── middleware/
│   └── validator.js           # Date normalizer and input validation middleware
├── routes/
│   ├── consoles.js            # Console CRUD, platform search, and /available twist route
│   ├── gamers.js              # Gamer registration and CRUD
│   └── bookings.js            # Bookings CRUD and the relational Join endpoint
└── test/
    └── twist.test.js          # Automated end-to-end test suite (25 assertions)
```

---

## 🏆 Assessment Rubric Coverage (100 Marks)

- **70 Marks (Group Deliverables):**
  - [x] Express server with standard status codes (200, 201, 400, 404, 500)
  - [x] SQLite database with 3 related tables (`gamers`, `consoles`, `bookings`)
  - [x] Full CRUD on consoles (`name`, `platform`)
  - [x] Join endpoint (`GET /bookings` with `gamer_name` & `console_name`)
  - [x] Input validation on add and update with clear error messages
  - [x] Search consoles by query parameter (`?platform=...`)
  - [x] Twist Rule: Test 1 (End before start → 400) passes
  - [x] Twist Rule: Test 2 (11 Nov → Console 4 missing) passes
  - [x] Twist Rule: Test 3 (13 Nov → Console 4 listed) passes
  - [x] Postman Collection (`postman_collection.json`) with automated test assertions
  - [x] Detailed `README.md` with setup, architecture, and API docs
- **30 Marks (Individual Component):**
  - [x] Clear role separation across all 6 members
  - [x] Ready-to-answer Q&A prep for the 3-minute live demo

