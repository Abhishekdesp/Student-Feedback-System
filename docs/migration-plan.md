# Student Feedback System — PHP to MERN Migration Plan

## Executive Summary
This document outlines the complete architectural analysis of the existing PHP/MySQL **Student Feedback System** workspace and defines the migration strategy for a full **MERN stack** rewrite inside the `mern/` directory.

---

## 1. Page and Endpoint Inventory

The following table catalogs every page, endpoint, purpose, HTTP method, inputs, outputs, and access control roles in the legacy PHP codebase:

| File Name / Endpoint | Purpose / Functionality | HTTP Method | Inputs | Outputs | Access Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.php` | Root entry point; redirects user to `login.php`. | `GET` | None | `302 Redirect` to `login.php` | Public |
| `login.php` | Main login page & authentication handler for both Students and Admin/Teachers. | `GET` / `POST` | **POST**: `username`, `password`, `role` (`'student'`, `'teacher'`, `'auto'`), `role_toggle` | **GET**: HTML Login page with tab toggle.<br>**POST Success**: Sets `$_SESSION` (`loggedin`, `role`, `username`, `year`) & `302 Redirect` (`dashboard.php` or `Homepage.php`).<br>**POST Error**: HTML with alert message. | Public / Unauthenticated |
| `studentlogin.php` | Legacy student login redirect shortcut. | `GET` | None | `302 Redirect` to `login.php` | Public |
| `logout.php` | Ends user session and logs out. | `GET` / `POST` | None | Destroys session (`session_unset()`, `session_destroy()`), `302 Redirect` to `login.php` | Authenticated (`Student` / `Admin`) |
| `Homepage.php` | Admin Dashboard displaying aggregate metrics, subject response charts, AI sentiment breakdown, anonymous comments modal, export & clear forms. | `GET` | `$_SESSION` (`loggedin`, `role`) | HTML Dashboard with stats cards, Chart.js graphs, AI summary badges, modals, and AJAX action triggers. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `dashboard.php` | Student Dashboard listing available faculty/subject surveys for the student's year and submission status. | `GET` / `POST` | **POST**: `subjectSelect` | **GET**: HTML subject cards with badges (`Submitted`, `Pending`, `Inactive`).<br>**POST**: Validates submission status; sets `$_SESSION['selected_subject']` and `302 Redirect` to `shomepage.php`. | Student (`$_SESSION['username']` set) |
| `shomepage.php` | Student Feedback Survey form page for selected subject; processes rating grid and optional AI sentiment text feedback. | `GET` / `POST` | **POST**: `response[<question_id>]` (1-5 ratings), `user_comment` (optional string) | **GET**: HTML survey form with dynamic JS progress bar.<br>**POST**: Updates subject response tallies, increments submission counter, runs AI sentiment analysis on comment, saves to `feedback_comments`, shows alert and JS timeout redirect to `dashboard.php`. | Student (`$_SESSION['username']` set) |
| `process.php` | Legacy POST action endpoint for survey submission. | `POST` | `response[<questionId>]` (array of ratings 1-5) | Increments `<subject>_responses` table tallies and `302 Redirect` to `dashboard.php` (or text validation error). | Student (`$_SESSION['selected_subject']`) |
| `add_faculty.php` | Admin page for registering new faculty & subject assignments, creating dynamic response tables, and viewing the faculty directory. | `GET` / `POST` | **POST**: `addFaculty`=1, `name`, `designation`, `email`, `scheme`, `semester`, `mobile`, `year`, `subject` | **POST**: Inserts record into `faculty.faculty`, creates `<subject>_responses` table with 5 default questions, alters `student` table to add `<SUBJECT>_submitted` column, renders success alert.<br>**GET**: Renders tabbed UI with directory & live JS search. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `show_faculty.php` | Legacy redirect shortcut to faculty directory tab. | `GET` | None | `302 Redirect` to `add_faculty.php?tab=list` | Admin / Teacher |
| `questions.php` | Admin management page for creating and deleting survey questions in the `questions` database. | `GET` / `POST` | **POST**: `new_question` (string) OR `delete_id` (integer) | Renders HTML table of active survey questions with deletion buttons and add question input form. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `show_questions.php` | Legacy session questions viewer. | `GET` | `$_SESSION['questions']` | HTML table rendering `$_SESSION['questions']` and unsetting session key. | Public / Session |
| `Sample.php` | AJAX toggle endpoint & UI for turning faculty survey status ON (1) or OFF (0). | `GET` | **GET**: `id` (integer), `state` (0 or 1) | **AJAX GET**: Updates `faculty.faculty` status column, returns plain text (`"Database updated successfully"`).<br>**Standard GET**: Renders HTML status control table. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `sconnect.php` | Admin CSV/Excel student roster batch import upload page. | `GET` | None | HTML drag-and-drop file upload UI with link to `download_template.php`. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `import.php` | CSV file processing endpoint for batch student roster import into `student` database. | `GET` / `POST` | **POST**: `file` (multipart CSV), `year` (`'First'`, `'Second'`, `'Third'`) | Reads CSV (`sname`, `password`), executes upsert into `student.student` table, renders HTML success summary with count of imported records. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `download_template.php` | Sample CSV template generator endpoint. | `GET` | None | HTTP Header `Content-Type: text/csv` attachment `sample_students.csv` with columns (`id`, `sname`, `year`, `password`). | Public / Admin |
| `file_import_handler.php` | AJAX Excel generation endpoint; injects live database ratings into an uploaded Excel template using PhpSpreadsheet and streams file back. | `POST` | **POST**: `file` (uploaded `.xlsx` template), `faculty_name`, `subject_name` | Binary stream download of populated `<SUBJECT>.xlsx` spreadsheet (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`). | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `clear_database_handler.php` | AJAX endpoint to clear feedback counts, comments, and student submission flags for a subject. | `POST` | **POST**: `table` (e.g. `'ajp_responses'`), `subject_name` (e.g. `'AJP'`) | Resets columns to 0 in `<subject>_responses`, deletes rows in `feedback_comments`, resets `<SUBJECT>_submitted = 0` in `student`, returns text message. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `settings.php` | Admin page for toggling Cloud AI (Google Gemini 1.5 Flash) vs. Offline Lexicon NLP engine and viewing environment details. | `GET` / `POST` | **POST**: `save_ai_settings`=1, `use_external_ai` (checkbox boolean) | Updates `admin.system_settings` table, calls `AISentimentEngine::setExternalAiConfig`, renders tabbed HTML settings UI. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |
| `seed_demo_data.php` | Seeder script to initialize all 5 databases, tables, and realistic sample data for demo testing. | `GET` / `POST` | **POST** or `GET`: `auto` | Creates databases & tables, seeds 1 admin, 4 faculty, 5 questions, 5 students, populates ratings across 4 response tables and 12 AI-analyzed comments. | Admin / Teacher (`$_SESSION['loggedin'] === true`) |

---

## 2. Full MySQL Structure (5 Databases & Dynamic Tables)

The legacy application utilizes 5 distinct MySQL databases (configured in `setup.sql` and `_dbconfig.php`):

```
MySQL Instance
├── admin
│   ├── admin
│   └── system_settings
├── faculty
│   └── faculty
├── student
│   └── student (with dynamic <SUBJECT>_submitted columns)
├── questions
│   └── questions
└── responses
    ├── <subject>_responses (dynamically created per subject, e.g. ajp_responses)
    └── feedback_comments
```

### 2.1 Database Schemas

#### 1. `admin` Database
- **`admin` Table**:
  - `id`: `INT AUTO_INCREMENT PRIMARY KEY`
  - `username`: `VARCHAR(255) NOT NULL UNIQUE`
  - `password`: `VARCHAR(255) NOT NULL` (stored as plaintext, e.g. `'admin123'`)
- **`system_settings` Table** (created on demand):
  - `setting_name`: `VARCHAR(100) PRIMARY KEY`
  - `setting_value`: `TEXT NOT NULL` (e.g., `'use_external_ai'` -> `'1'`)

#### 2. `faculty` Database
- **`faculty` Table**:
  - `id`: `INT PRIMARY KEY AUTO_INCREMENT`
  - `name`: `VARCHAR(255) NOT NULL` (Faculty full name, e.g., `'Dr. Rajesh Sharma'`)
  - `designation`: `VARCHAR(255) NOT NULL` (e.g., `'Professor & HOD'`)
  - `email`: `VARCHAR(255) NOT NULL`
  - `scheme`: `VARCHAR(255) NOT NULL` (e.g., `'K-Scheme'`, `'I-Scheme'`)
  - `semester`: `VARCHAR(255) NOT NULL` (e.g., `'5'`, `'3'`, `'1'`)
  - `mobile`: `VARCHAR(20) NOT NULL`
  - `year`: `VARCHAR(50) NOT NULL` (Academic year: `'First'`, `'Second'`, `'Third'`)
  - `subject`: `VARCHAR(255)` / `VARCHAR(100) NOT NULL UNIQUE` (Subject code in uppercase, e.g., `'AJP'`, `'WT'`, `'DBMS'`)
  - `status`: `INT DEFAULT 1` (`1` = Survey Open / Active, `0` = Survey Closed / Inactive)

#### 3. `student` Database
- **`student` Table**:
  - `id`: `INT PRIMARY KEY AUTO_INCREMENT`
  - `sname`: `VARCHAR(255) NOT NULL` (Student name, used as login username)
  - `year`: `VARCHAR(50) NOT NULL` (`'First'`, `'Second'`, `'Third'`)
  - `password`: `VARCHAR(255) NOT NULL` (Plaintext password)
  - `imported`: `BOOLEAN DEFAULT FALSE`
  - **Dynamic Submission Tracking Columns**: Whenever a new subject (e.g., `AJP`) is added in `add_faculty.php`, an `ALTER TABLE` statement dynamically adds:
    - `<SUBJECT>_submitted`: `INT DEFAULT 0` (e.g. `AJP_submitted`, `WT_submitted`). Value `0` = pending submission, `1` = submitted.

#### 4. `questions` Database
- **`questions` Table**:
  - `id`: `INT PRIMARY KEY AUTO_INCREMENT`
  - `questions`: `VARCHAR(255) NOT NULL` (The survey question prompt text)

#### 5. `responses` Database
- **Dynamic `<subject>_responses` Tables** (e.g. `ajp_responses`, `wt_responses`, `dbms_responses`, `oop_responses`):
  - Created dynamically when a subject is added in `add_faculty.php` or seeded in `seed_demo_data.php`:
    ```sql
    CREATE TABLE IF NOT EXISTS `<subject>_responses` (
        id INT PRIMARY KEY AUTO_INCREMENT,
        Questions VARCHAR(255) DEFAULT '',
        excellent INT DEFAULT 0,
        very_good INT DEFAULT 0,
        good INT DEFAULT 0,
        poor INT DEFAULT 0,
        bad INT DEFAULT 0,
        Counter INT DEFAULT 0
    );
    ```
  - **Structure & Row Conventions**:
    - Each row `id` (1 to N) maps to a question ID from the `questions` table.
    - Columns `excellent`, `very_good`, `good`, `poor`, `bad` hold aggregate vote counts across all students for that question.
    - Column `Counter` on line `id = 1` stores total unique student survey submissions for this subject.
- **`feedback_comments` Table**:
  - `id`: `INT PRIMARY KEY AUTO_INCREMENT`
  - `subject`: `VARCHAR(50) NOT NULL` (Subject code, e.g. `'AJP'`)
  - `comment`: `TEXT NOT NULL` (Qualitative text written by student)
  - `sentiment`: `VARCHAR(20) NOT NULL` (`'Positive'`, `'Neutral'`, `'Constructive'`)
  - `sentiment_score`: `FLOAT DEFAULT 0`
  - `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### 2.2 How Dynamic Response Tables Are Created and Queried
1. **Creation**:
   When an admin adds a faculty member with subject `AJP` in `add_faculty.php`, the system:
   - Sanitizes the subject code to lowercase (`$tbl_name = "ajp_responses"`).
   - Executes `CREATE TABLE IF NOT EXISTS ajp_responses (...)`.
   - Inserts default rows for questions 1 through 5.
   - Executes `ALTER TABLE student ADD COLUMN AJP_submitted INT DEFAULT 0` on the `student` database.
2. **Dynamic Discovery**:
   In `Homepage.php`, the admin dashboard queries `information_schema.tables WHERE table_name LIKE '%_responses'` on the `responses` schema to list all active subject response tables.
3. **Aggregation Query**:
   For each discovered table (e.g., `ajp_responses`), `Homepage.php` calculates:
   ```sql
   SELECT 
       SUM(excellent) AS total_ex, 
       SUM(very_good) AS total_vg, 
       SUM(good) AS total_g, 
       SUM(poor) AS total_p, 
       SUM(bad) AS total_b,
       MAX(Counter) AS total_submissions
   FROM `ajp_responses`;
   ```
   Weighted average rating formula:
   $$\text{Weighted Score} = (5 \times \text{excellent}) + (4 \times \text{very\_good}) + (3 \times \text{good}) + (2 \times \text{poor}) + (1 \times \text{bad})$$
   $$\text{Average Rating} = \frac{\text{Weighted Score}}{\text{total\_ex} + \text{total\_vg} + \text{total\_g} + \text{total\_p} + \text{total\_b}}$$

---

## 3. Auth and Session Logic

### 3.1 Session Lifecycle and Variables
The legacy app relies on PHP native session storage via `session_start()`. The session state maintains:
- `$_SESSION['loggedin']`: `bool` (`true` when authenticated as Admin/Teacher).
- `$_SESSION['role']`: `string` (`'student'` or `'teacher'`).
- `$_SESSION['username']`: `string` (Student's `sname` or Admin's `username`).
- `$_SESSION['year']`: `string` (Student academic year: `'First'`, `'Second'`, `'Third'`).
- `$_SESSION['selected_subject']`: `string` (Subject code currently being evaluated, e.g. `'AJP'`).

### 3.2 Login Flow (`login.php`)
```
[User Submits Login Form]
       │
       ├──> Role: 'student' (or 'auto')
       │      ├── Query: SELECT * FROM student WHERE LOWER(sname)=LOWER('$u') AND password='$p'
       │      └── If Match: Set $_SESSION['role']='student', $_SESSION['username']=$row['sname'], $_SESSION['year']=$row['year']
       │           └── Redirect -> dashboard.php
       │
       └──> Role: 'teacher' / 'admin' (or 'auto')
              ├── Query: SELECT * FROM admin WHERE LOWER(username)=LOWER('$u') AND password='$p'
              └── If Match: Set $_SESSION['loggedin']=true, $_SESSION['role']='teacher', $_SESSION['username']=$row['username']
                   └── Redirect -> Homepage.php
```

### 3.3 Access Control Guards
- **Admin / Teacher Protected Pages** (`Homepage.php`, `add_faculty.php`, `questions.php`, `sconnect.php`, `Sample.php`, `settings.php`, `seed_demo_data.php`, `file_import_handler.php`, `clear_database_handler.php`):
  ```php
  if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
      header("Location: login.php");
      exit();
  }
  ```
- **Student Protected Pages** (`dashboard.php`, `shomepage.php`):
  ```php
  if (!isset($_SESSION['username'])) {
      header("Location: login.php");
      exit();
  }
  ```

---

## 4. AISentimentEngine.php Deep Dive

The `AISentimentEngine` class (`ai_sentiment_engine.php`) handles student qualitative comment analysis using a dual-engine architecture: a live Cloud AI provider (Google Gemini 1.5 Flash) with an automatic fallback to a zero-cost Offline Lexicon NLP engine.

```
                   [Incoming Student Comment]
                                │
                  Is Cloud AI Enabled & Key Present?
                                │
                   ┌────────────┴────────────┐
                 YES                        NO
                   │                         │
      [Call Google Gemini API]      [Run Offline Lexicon NLP]
                   │                         │
             API Success?                    │
           ┌───────┴───────┐                 │
         YES              NO                 │
           │               └─────────────────┤
    Return Gemini Result            Tokenize & Clean
                                    Score Positive vs Constructive
                                    Apply Score Thresholds
                                    Return Offline Result
```

### 4.1 Interface & Configuration Methods
- `public static $use_external_ai = true;`
- `public static $api_provider = 'gemini';`
- `public static $api_key = '';`
- `setExternalAiConfig($enabled, $provider, $apiKey)`: Configures external AI toggle. If `$apiKey` is empty, reads `getenv('GEMINI_API_KEY')`.

### 4.2 Cloud AI Request & Response Handling
- **Google Gemini Call**:
  - **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}`
  - **Payload**:
    ```json
    {
      "contents": [
        {
          "parts": [
            { "text": "Classify the sentiment of this student feedback as ONLY one word: Positive, Neutral, or Constructive. Comment: \"<comment_text>\"" }
          ]
        }
      ]
    }
    ```
  - **Execution**: cURL POST request with a 5-second timeout.
  - **Response Parsing**: Decodes `$json['candidates'][0]['content']['parts'][0]['text']`. Executes regex matching for `/Positive|Neutral|Constructive/i`.
  - **Output Array**:
    - `sentiment`: `'Positive'`, `'Neutral'`, or `'Constructive'`
    - `score`: `1.0`
    - `badge`: `'bg-success'` (Positive), `'bg-warning text-dark'` (Constructive), `'bg-info'` (Neutral)
    - `engine`: `'Gemini 1.5 Flash'`

### 4.3 Offline Lexicon Algorithm
When Cloud AI is disabled or fails, `analyzeOffline($text)` runs:
1. **Tokenization & Normalization**:
   - Lowercases input: `strtolower(...)`.
   - Strips non-alphanumeric characters: `preg_replace('/[^a-zA-Z0-9\s]/', '', $text)`.
   - Splits text by spaces: `explode(' ', $clean_text)`.
2. **Word Lists**:
   - **Positive Words** (27 words): `excellent`, `great`, `amazing`, `helpful`, `clear`, `interactive`, `punctual`, `supportive`, `best`, `engaging`, `thorough`, `expert`, `passionate`, `kind`, `friendly`, `well`, `good`, `awesome`, `understandable`, `effective`, `inspiring`, `organized`, `dedicated`, `patient`, `approachable`, `fair`, `superb`.
   - **Constructive Words** (22 words): `improve`, `slow`, `fast`, `confusing`, `unclear`, `difficult`, `tough`, `hard`, `strict`, `more`, `less`, `assignments`, `speed`, `pace`, `late`, `volume`, `doubt`, `explain`, `homework`, `exam`, `practice`, `slides`.
3. **Scoring Formula & Thresholds**:
   - Matches count: `$pos_count` and `$con_count`.
   - Total hits: `$total_hits = $pos_count + $con_count`.
   - If `$total_hits === 0`: returns `Neutral` (score `0.0`, engine `'Offline Lexicon'`).
   - Net score:
     $$\text{Net Score} = \frac{\$pos\_count - \$con\_count}{\max(1, \$total\_hits)}$$
   - **Threshold Rules**:
     - `Net Score > 0.1` $\rightarrow$ **`Positive`** (`bg-success`)
     - `Net Score < -0.1` OR `$con_count > $pos_count` $\rightarrow$ **`Constructive`** (`bg-warning text-dark`)
     - Otherwise ($-0.1 \le \text{Net Score} \le 0.1$) $\rightarrow$ **`Neutral`** (`bg-info`)

---

## 5. `file_import_handler.php` & Excel Cell Coordinates

`file_import_handler.php` handles Excel export report generation. It receives an uploaded `.xlsx` template, queries `faculty` and `responses` databases, modifies specific cell coordinates using `PhpSpreadsheet`, and streams the resulting workbook for download.

### Exact Cell Coordinate Mapping Table:

| Cell Coordinate | Value Written / Formula | Data Source |
| :--- | :--- | :--- |
| **`B9`** | `"Name of Staff: " . $faculty_name` | Form POST `faculty_name` / `SELECT name FROM faculty WHERE subject = '$subject_name'` |
| **`C10`** | `$counter` (Total Submissions count) | Column `counter` from row 0 of `<subject>_responses` |
| **`B12`** | `"Course: " . $subject_name` | Form POST `subject_name` (e.g. `"AJP"`) |
| **`H12`** | `"Class: CM " . $semester . $scheme` | `SELECT semester, scheme FROM faculty WHERE subject = '$subject_name'` (e.g. `"Class: CM 5K-Scheme"`) |
| **`B17` to `B21`** | Question prompt text string | `questions` column from row $i$ ($i = 0 \dots N-1$) of `<subject>_responses` |
| **`C17` to `C21`** | Count of **Excellent** votes | `excellent` column from row $i$ of `<subject>_responses` |
| **`D17` to `D21`** | Count of **Very Good** votes | `very_good` column from row $i$ of `<subject>_responses` |
| **`E17` to `E21`** | Count of **Good** votes | `good` column from row $i$ of `<subject>_responses` |
| **`F17` to `F21`** | Count of **Poor** votes | `poor` column from row $i$ of `<subject>_responses` |
| **`G17` to `G21`** | Count of **Bad** votes | `bad` column from row $i$ of `<subject>_responses` |

---

## 6. `seed_demo_data.php` Data Analysis

`seed_demo_data.php` creates all 5 databases/tables and seeds realistic test data:

1. **Admin Credentials**:
   - Username: `admin`, Password: `admin123`.
2. **Faculty Records (4 entries)**:
   - ID 1: Dr. Rajesh Sharma | `Professor & HOD` | `rajesh.sharma@college.edu` | K-Scheme | Sem 5 | Year: Third | Subject: `AJP` | Status: 1
   - ID 2: Prof. Anita Roy | `Associate Professor` | `anita.roy@college.edu` | K-Scheme | Sem 5 | Year: Third | Subject: `WT` | Status: 1
   - ID 3: Dr. Vikram Mehta | `Assistant Professor` | `vikram.mehta@college.edu` | I-Scheme | Sem 3 | Year: Second | Subject: `DBMS` | Status: 1
   - ID 4: Prof. Neha Gupta | `Assistant Professor` | `neha.gupta@college.edu` | K-Scheme | Sem 1 | Year: First | Subject: `OOP` | Status: 1
3. **Survey Questions (5 standard questions)**:
   - Q1: *"Punctuality and regularity in taking lectures and practicals?"*
   - Q2: *"Clarity of explanation and domain expertise?"*
   - Q3: *"Accessibility and willingness to assist students outside class hours?"*
   - Q4: *"Fairness and transparency in evaluation and internal assessments?"*
   - Q5: *"Use of interactive teaching aids, slides, and real-world examples?"*
4. **Student Users (5 entries)**:
   - ID 1: `Aarav` | Third Year | Password: `746Hb67V`
   - ID 2: `Ananya` | Second Year | Password: `4qRvyxj9`
   - ID 3: `Kabir` | Third Year | Password: `cRkrlBZc`
   - ID 4: `Diya` | First Year | Password: `MseOVfS0`
   - ID 5: `Rohan` | Third Year | Password: `VbEa5Thi`
5. **Subject Response Tables**:
   - Creates `ajp_responses`, `wt_responses`, `dbms_responses`, `oop_responses`.
   - Populates vote distributions using random ranges (`rand(15,28)` excellent, `rand(10,22)` very_good, `rand(4,12)` good, `rand(1,4)` poor, `rand(0,2)` bad).
6. **Qualitative Feedback Comments (`feedback_comments`)**:
   - Seeds 12 sample student comments across AJP, WT, DBMS, and OOP.
   - Runs `AISentimentEngine::analyzeSentiment()` on each comment during seeding to store calculated sentiment labels and scores.

---

## 7. Proposed MongoDB Schema Mapping

To eliminate anti-patterns like dynamic MySQL database tables (`<subject>_responses`) and dynamic user table columns (`<SUBJECT>_submitted`), the MERN stack rewrite will use a unified MongoDB database.

```
MongoDB Database: student_feedback_db
├── users (Admin, Faculty, Student)
├── subjects (Subject metadata & Faculty assignments)
├── questions (Survey question prompts)
├── responses (Individual & aggregate survey submissions)
└── system_settings (AI and configuration toggles)
```

### Collection Mappings:

#### 1. `users` Collection
Replaces `admin.admin` and `student.student` tables.
```typescript
interface IUser {
  _id: Types.ObjectId;
  username: string; // sname for students, username for admin
  password: string; // bcrypt hash
  role: 'admin' | 'teacher' | 'student';
  studentDetails?: {
    academicYear: 'First' | 'Second' | 'Third';
    isImported: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```
*Old $\rightarrow$ New Mapping*:
- `admin.admin.username` $\rightarrow$ `users.username` (`role: 'admin'`)
- `student.student.sname` $\rightarrow$ `users.username` (`role: 'student'`)
- `student.student.year` $\rightarrow$ `users.studentDetails.academicYear`
- `student.student.password` $\rightarrow$ `users.password` (bcrypt hashed)

#### 2. `subjects` Collection
Replaces `faculty.faculty` table.
```typescript
interface ISubject {
  _id: Types.ObjectId;
  code: string; // Upper-case unique subject code (e.g. "AJP")
  name?: string;
  facultyName: string;
  facultyDesignation: string;
  facultyEmail: string;
  facultyMobile: string;
  scheme: string; // e.g. "K-Scheme"
  semester: string; // e.g. "5"
  academicYear: 'First' | 'Second' | 'Third';
  status: boolean; // true = Survey Active, false = Inactive
  createdAt: Date;
  updatedAt: Date;
}
```
*Old $\rightarrow$ New Mapping*:
- `faculty.faculty.subject` $\rightarrow$ `subjects.code`
- `faculty.faculty.name` $\rightarrow$ `subjects.facultyName`
- `faculty.faculty.status` $\rightarrow$ `subjects.status` (1 $\rightarrow$ true, 0 $\rightarrow$ false)

#### 3. `questions` Collection
Replaces `questions.questions` table.
```typescript
interface IQuestion {
  _id: Types.ObjectId;
  text: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. `responses` Collection
Replaces dynamic `<subject>_responses` tables, `student.<SUBJECT>_submitted` columns, and `feedback_comments` table.
```typescript
interface IResponse {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId; // ref: 'Subject'
  subjectCode: string; // Denormalized for fast queries (e.g., "AJP")
  studentId: Types.ObjectId; // ref: 'User'
  ratings: {
    questionId: Types.ObjectId; // ref: 'Question'
    rating: 1 | 2 | 3 | 4 | 5; // 5=excellent, 4=very_good, 3=good, 2=poor, 1=bad
  }[];
  userComment?: string;
  sentiment?: {
    label: 'Positive' | 'Neutral' | 'Constructive';
    score: number;
    engine: string;
  };
  submittedAt: Date;
}
```
*Benefits over Legacy PHP*:
- **No DDL Table Creations**: Adding a new subject code requires zero database structural changes.
- **Checking Student Submission**: Simple index query `responses.exists({ studentId, subjectId })` replaces reading dynamically generated table columns like `student.AJP_submitted`.
- **Aggregation**: MongoDB Aggregation Pipeline computes `excellent`, `very_good`, `good`, `poor`, `bad` counts dynamically per subject on demand.

#### 5. `system_settings` Collection
Replaces `admin.system_settings` table.
```typescript
interface ISystemSetting {
  _id: Types.ObjectId;
  key: string; // e.g. "use_external_ai"
  value: any;
}
```

---

## 8. Risks, Ambiguities, and Clarifications

### 8.1 Technical & Operational Risks
1. **Plaintext Passwords in Legacy MySQL**:
   - The PHP system stores passwords in plain unhashed text (`admin123`, `746Hb67V`).
   - *Mitigation*: The MERN backend will use `bcrypt` password hashing for all new user registrations and convert legacy demo data passwords to bcrypt hashes during seeder execution.
2. **Dynamic Spreadsheet Generation in Node.js**:
   - `file_import_handler.php` relies on PHP's `PhpOffice\PhpSpreadsheet` to edit uploaded `.xlsx` files at cell coordinates `B9`, `B12`, `H12`, `C10`, and `B17:G21`.
   - *Mitigation*: The Express server will use `exceljs` to parse, manipulate, and stream Excel workbooks, matching exact cell coordinate requirements.
3. **AI Provider Fallback Parity**:
   - The sentiment engine must fall back to the offline lexicon algorithm seamlessly if `GEMINI_API_KEY` is missing or fails.
   - *Mitigation*: Implement an equivalent `AISentimentService` TypeScript class with identical positive/constructive word arrays and scoring threshold math ($\text{Net Score} > 0.1$).

### 8.2 Questions & Clarifications for Review
1. **User Authentication Model**:
   - In PHP, students log in with their Student Name (`sname`) as the username. Should the MERN app enforce unique usernames for students or introduce roll numbers / email credentials?
2. **Excel Template Management**:
   - In the PHP code, `file_import_handler.php` expects the user to upload an existing Excel template file via POST, injects data into it, and returns the modified Excel file. Should the MERN app store a default master template on the server to allow one-click report downloads without requiring an uploaded file?
3. **Legacy Multi-Database Setup**:
   - The PHP app attempts to connect to 5 separate MySQL databases (`admin`, `faculty`, `student`, `questions`, `responses`). Can we confirm that unified MongoDB collections inside a single database (`student_feedback_db`) are fully approved?

---
*Migration Plan Plan created at `mern/docs/migration-plan.md`.*
