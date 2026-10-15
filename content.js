/* Course content for the Zero-to-Pro Data Engineering hub.
   Lesson shape: { id, phase, week, topic, title, minutes, predict:{q,a}, body (HTML), ex:[...], cards:[[front, back]], feynman, connect }
   Exercise shape: { id, kind: "sql" | "py" | "text", q, starter, sol, hints:[3], ordered } */

const PHASES = [
  { id: "basics",   name: "Start from zero",       level: "Beginner",        weeks: "Week 1" },
  { id: "sql",      name: "SQL",                   level: "Beginner",        weeks: "Weeks 1–5" },
  { id: "python",   name: "Python and pandas",     level: "Beginner",        weeks: "Weeks 6–8" },
  { id: "tools",    name: "Tools of the trade",    level: "Intermediate",    weeks: "Week 8" },
  { id: "etl",      name: "Pipelines (ETL)",       level: "Intermediate",    weeks: "Week 9" },
  { id: "model",    name: "Data modeling",         level: "Intermediate",    weeks: "Week 10" },
  { id: "spark",    name: "Big data with Spark",   level: "Advanced",        weeks: "Week 11" },
  { id: "airflow",  name: "Scheduling with Airflow", level: "Advanced",      weeks: "Week 12" },
  { id: "cloud",    name: "Docker, cloud and CI/CD", level: "Advanced",      weeks: "Weeks 13–14" },
  { id: "job",      name: "Portfolio and interviews", level: "Interview-ready", weeks: "Weeks 15–16" }
];

const TOPICS = ["Basics", "SQL", "Python", "pandas", "Tools", "Pipelines", "Modeling", "Spark", "Airflow", "Docker & Cloud", "Interview"];

/* ---------- Practice database (SQLite in the browser; reset before every run) ---------- */
const SEED_SQL = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, country TEXT, signup_date TEXT);
INSERT INTO customers VALUES
 (1,'Amara Okafor','Lagos','Nigeria','2025-01-14'),
 (2,'Ben Carter','Chicago','USA','2025-02-03'),
 (3,'Chen Li','Toronto','Canada','2025-02-20'),
 (4,'Diana Mbeki','Kinshasa','DR Congo','2025-03-11'),
 (5,'Eva Rossi','Chicago','USA','2025-04-02'),
 (6,'Farid Haddad',NULL,'USA','2025-05-19'),
 (7,'Grace Kim','Toronto','Canada','2025-06-07'),
 (8,'Hugo Silva','Lagos','Nigeria','2025-07-23');

CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, amount REAL, status TEXT);
INSERT INTO orders VALUES
 (101,1,'2025-02-01',120,'delivered'),
 (102,1,'2025-02-15',80,'delivered'),
 (103,2,'2025-02-10',450,'delivered'),
 (104,2,'2025-03-05',300,'returned'),
 (105,3,'2025-03-12',60,'delivered'),
 (106,1,'2025-03-20',210,'delivered'),
 (107,4,'2025-04-01',115,'delivered'),
 (108,3,'2025-04-18',330,'shipped'),
 (109,2,'2025-04-22',150,'delivered'),
 (110,4,'2025-05-02',40,'cancelled'),
 (111,5,'2025-05-10',500,'delivered'),
 (112,5,'2025-05-11',75,'delivered'),
 (113,5,'2025-05-12',30,'delivered'),
 (114,7,'2025-06-20',180,'shipped'),
 (115,3,'2025-06-25',NULL,'pending'),
 (116,1,'2025-07-01',85,'delivered');

CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
INSERT INTO products VALUES
 (1,'Laptop stand','Accessories',45),
 (2,'USB-C hub','Accessories',30),
 (3,'Mechanical keyboard','Peripherals',120),
 (4,'Wireless mouse','Peripherals',40),
 (5,'27-inch monitor','Displays',300),
 (6,'Webcam','Peripherals',75);

CREATE TABLE order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER);
INSERT INTO order_items VALUES
 (101,3,1),(102,4,2),(103,5,1),(103,3,1),(103,2,1),(104,5,1),(105,2,2),
 (106,3,1),(106,1,2),(107,4,1),(107,6,1),(108,5,1),(108,2,1),(109,6,2),
 (110,4,1),(111,5,1),(111,3,1),(111,4,2),(112,6,1),(113,2,1),(114,1,4),
 (115,3,1),(116,1,1),(116,4,1);

CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales'),(3,'Finance'),(4,'Legal');

CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, hire_date TEXT, manager_id INTEGER);
INSERT INTO employees VALUES
 (1,'Amani Diallo',1,95000,'2019-03-01',NULL),
 (2,'Bea Novak',1,88000,'2020-06-15',1),
 (3,'Chidi Obi',1,88000,'2021-01-10',1),
 (4,'Dana Park',1,72000,'2023-02-20',1),
 (5,'Eli Moreau',2,65000,'2018-09-05',NULL),
 (6,'Fatou Sow',2,71000,'2022-04-11',5),
 (7,'Gabe Ortiz',2,58000,'2024-01-08',5),
 (8,'Hana Sato',3,80000,'2017-11-30',NULL),
 (9,'Ibra Kone',3,62000,'2023-07-19',8),
 (10,'Jo Lee',NULL,50000,'2025-01-06',NULL);

CREATE TABLE logins (user_id INTEGER, login_date TEXT);
INSERT INTO logins VALUES
 (1,'2025-06-01'),(1,'2025-06-02'),(1,'2025-06-03'),(1,'2025-06-05'),
 (2,'2025-06-01'),(2,'2025-06-03'),(2,'2025-06-03'),(2,'2025-06-04'),
 (3,'2025-06-10'),(3,'2025-06-11'),(3,'2025-06-12'),(3,'2025-06-13');
`;

const SCHEMA = [
  ["customers", "id, name, city, country, signup_date", "8 people who signed up to an online store. Farid has no city (NULL)."],
  ["orders", "id, customer_id, order_date, amount, status", "16 orders. customer_id points to customers.id. Order 115 has no amount yet."],
  ["products", "id, name, category, price", "6 products in 3 categories."],
  ["order_items", "order_id, product_id, quantity", "Which products are in each order (an order can have several)."],
  ["departments", "id, name", "4 departments. Legal has no employees."],
  ["employees", "id, name, dept_id, salary, hire_date, manager_id", "10 employees. Jo Lee has no department yet."],
  ["logins", "user_id, login_date", "Days users logged in to an app (has one duplicate row)."]
];

/* Shared CSV used by the Python lessons */
const ORDERS_CSV = `order_id,customer,city,order_date,amount,status
101,Amara Okafor,Lagos,2025-02-01,120,delivered
102,Amara Okafor,Lagos,2025-02-15,80,delivered
103,Ben Carter,Chicago,2025-02-10,450,delivered
104,Ben Carter,Chicago,2025-03-05,300,returned
105,Chen Li,Toronto,2025-03-12,60,delivered
107,Diana Mbeki,Kinshasa,2025-04-01,115,delivered
111,Eva Rossi,Chicago,2025-05-10,500,delivered
114,Grace Kim,Toronto,2025-06-20,180,shipped`;

const MESSY_CSV = `order_id,customer,city,order_date,amount
1001,Kasai Foods,Kinshasa,2026-01-03,$120.00
1002,Kasai Foods,kinshasa ,2026-01-10,80
1003,Lualaba Mining,Kolwezi,2026-01-04,450
1003,Lualaba Mining,Kolwezi,2026-01-04,450
1004,Bandal Print,KINSHASA,2026-01-15,
1005,Goma Coffee,Goma,2026-01-20,95.5
1006,Matadi Port Co,,2026-02-01,$300
1007,Goma Coffee, goma,2026-03-01,40`;

const PY_ORDERS = `import pandas as pd
from io import StringIO

csv_text = """${ORDERS_CSV}"""
df = pd.read_csv(StringIO(csv_text))
`;

const PY_MESSY = `import pandas as pd
from io import StringIO

csv_text = """${MESSY_CSV}"""
df = pd.read_csv(StringIO(csv_text))
`;

/* ---------- Lessons ---------- */
const LESSONS = [

/* ======================= PHASE: START FROM ZERO ======================= */
{ id:"b1", phase:"basics", week:1, topic:"Basics", minutes:20, title:"How to learn with this hub",
  predict:{ q:"Which helps you remember more a week later: re-reading your notes three times, or closing your notes and trying to write down what you remember?",
    a:"Closing the notes and trying to remember. It feels harder and you will get things wrong, but that effort is exactly what makes memory stick. Re-reading feels easy, and that ease tricks you into thinking you know it." },
  body:`
<p>You are starting from zero, and that is fine. Everyone who works in data started where you are. This hub teaches you step by step, and it uses the learning methods from the PsychToons video <i>Psychology of Intelligence: Learn Anything So Fast It's Almost Unfair</i>. The big idea of the video: <b>learning that feels hard is learning that lasts</b>.</p>
<h4>The seven rules this hub follows</h4>
<table class="mini"><tr><th>Method</th><th>What it means</th><th>Where you'll see it here</th></tr>
<tr><td><b>Desirable difficulty</b></td><td>Struggle a bit before you get help. The effort builds memory.</td><td>Every lesson starts with a <i>Predict first</i> question. Answers stay locked until you try.</td></tr>
<tr><td><b>Active recall</b></td><td>Pull information out of your head instead of putting it in again.</td><td><i>Check yourself</i> questions in each lesson and the daily blank-page recall.</td></tr>
<tr><td><b>Spaced repetition</b></td><td>Review just before you would forget: after 1, 3, 7, 14, then 30 days.</td><td>The <i>Review</i> tab. Cards from finished lessons come back on schedule.</td></tr>
<tr><td><b>Interleaving</b></td><td>Mix different topics in one practice session.</td><td>The <i>Practice</i> tab mixes problems from every lesson you've done, without labels.</td></tr>
<tr><td><b>Feynman technique</b></td><td>Explain it in plain words, like to a 12-year-old. Where you get stuck is the gap.</td><td>The <i>Explain it simply</i> box at the end of every lesson.</td></tr>
<tr><td><b>Track your gaps</b></td><td>Write down every mistake and go back to it.</td><td>The <i>Gaps</i> tab fills automatically when you miss something.</td></tr>
<tr><td><b>Connect ideas</b></td><td>Link new ideas to things you already know.</td><td>The <i>Connect it</i> question in every lesson.</td></tr></table>
<h4>Your daily routine (about 2 hours on weekdays)</h4>
<ol><li><b>Review</b> due flashcards (10–15 min).</li>
<li><b>Blank-page recall</b>: write what you remember from your last lesson, without looking (5–10 min).</li>
<li><b>Mixed practice</b>: two or three problems from earlier lessons (15–20 min).</li>
<li><b>One new lesson</b>: predict, learn, try, check, explain, connect (45–60 min).</li></ol>
<p>On weekends (4–5 hours) do two lessons and a longer practice set. The full course is 16 weeks. Some weeks will feel slow. That is normal and it is not a sign you're bad at this. Mistakes are part of the method: every one you log is something you won't forget.</p>
<div class="analogy"><b>Think of it like the gym.</b> Lifting a weight that is too easy does nothing. Lifting one that is a bit too heavy, with good form, builds muscle. Here, "a bit too heavy" means trying a problem before you feel ready.</div>`,
  ex:[
   { id:"b1e1", kind:"text", q:"Write your study plan for this week: which days, what time, and where you will study. Then write one thing that usually stops you from studying, and what you'll do about it.",
     sol:"Example: Monday–Friday 7:00–9:00 pm at my desk, phone in another room. Saturday and Sunday 10:00 am–2:00 pm. What stops me: I get tired after work. My fix: I'll start with the 10-minute flashcard review, which is easy, so I get going. If I'm very tired I'll do a quick session: review + recall + one practice problem.",
     hints:["Be specific: a day and a time works better than 'when I can'.","Think about what happened the last time you planned to study and didn't.","Write a backup plan for tired days, like a 30-minute quick session."] }
  ],
  cards:[
   ["Why does this hub hide answers until you try?","Struggling first (desirable difficulty) makes the memory stronger than just reading the answer."],
   ["What is active recall?","Pulling information out of your memory (quizzing yourself) instead of re-reading it."],
   ["What is spaced repetition?","Reviewing at growing intervals (1, 3, 7, 14, 30 days), right before you'd forget."],
   ["What is interleaving?","Mixing different topics in one practice session, so you learn to choose the right method."],
   ["What is the Feynman technique?","Explaining something in plain words as if to a beginner. Where you get stuck shows what you don't understand yet."]
  ],
  feynman:"Explain to a friend why re-reading notes feels productive but doesn't work very well.",
  connect:"Think of a skill you already learned well (a sport, a language, cooking, a game). Which of the seven methods did you use without knowing it?" },

{ id:"b2", phase:"basics", week:1, topic:"Basics", minutes:30, title:"What a data engineer does",
  predict:{ q:"A company has sales data in its app, in its payment system and in spreadsheets. The boss wants one dashboard with all of it, updated every morning. Whose job is it to make sure the data arrives every morning, clean and complete?",
    a:"The data engineer's. Analysts build the dashboard and answer questions with it, but the data engineer builds and runs the pipelines that collect, clean and deliver the data on time." },
  body:`
<p>Every company creates data all day: purchases, clicks, payments, deliveries, sensor readings. That data is born in many different places and in messy shapes. <b>A data engineer builds the systems that move data from where it is created to where it is useful, and makes sure it is correct and on time.</b></p>
<div class="analogy"><b>Think of a city's water system.</b> Water comes from rivers and wells (the <i>sources</i>). Pipes carry it (the <i>pipelines</i>). A treatment plant cleans it (the <i>transformations</i>). Tanks store it (the <i>data warehouse</i>). Homes use it (analysts, dashboards, machine learning). The data engineer is the engineer who designs and maintains the pipes and the plant. If the water stops or comes out dirty, they get the call.</div>
<h4>The path data takes</h4>
<pre class="flow">App database ─┐
Payments API ─┼──► Pipeline: Extract → Transform → Load ──► Data warehouse ──► Dashboards, reports, ML
Spreadsheets ─┘          (runs every night, on a schedule)</pre>
<h4>Who does what</h4>
<table class="mini"><tr><th>Role</th><th>Main question</th><th>Main tools</th></tr>
<tr><td>Data engineer</td><td>Is the data there, correct and on time?</td><td>SQL, Python, Spark, Airflow, cloud, Docker</td></tr>
<tr><td>Data analyst</td><td>What happened and why?</td><td>SQL, Excel, Power BI / Tableau</td></tr>
<tr><td>Data scientist</td><td>What will happen? Can we predict it?</td><td>Python, statistics, machine learning</td></tr></table>
<h4>The tools you will learn, and why each exists</h4>
<ul>
<li><b>SQL</b>: the language for asking questions of data in tables. Used every single day. Most tested in interviews.</li>
<li><b>Python</b> (with <b>pandas</b>): for writing pipeline code, cleaning data and automating work.</li>
<li><b>Spark</b>: for data too big for one computer; it splits work across many machines.</li>
<li><b>Airflow</b>: a scheduler that runs your pipelines at the right time, in the right order, and retries when they fail.</li>
<li><b>Docker</b>: packages your code so it runs the same everywhere.</li>
<li><b>Cloud (AWS)</b>: rented computers and storage, so companies don't have to buy servers.</li>
<li><b>Data modeling</b>: designing tables so data is easy and fast to use.</li></ul>
<p>That is also the order of this course: the most-tested, most-used skills first.</p>
<h4>What interviews test</h4>
<p>Nearly every data engineering interview has a SQL round. Most have Python. Many ask about data modeling, ETL design and one big-data tool. All of them ask you to explain the projects on your resume in detail.</p>`,
  ex:[
   { id:"b2e1", kind:"text", q:"In your own words: describe the path data takes from the moment someone clicks 'Buy' in an online store until the sales number shows up on the manager's dashboard the next morning. Name at least three steps.",
     sol:"1) The click creates a new row in the store's app database (the order). 2) Overnight, a pipeline extracts yesterday's new orders from that database. 3) It transforms them: removes test orders, fixes formats, joins customer and product details, adds up totals. 4) It loads the clean data into the data warehouse. 5) The dashboard reads from the warehouse, so in the morning the manager sees yesterday's sales. A scheduler (like Airflow) starts the pipeline every night, and alerts someone if it fails.",
     hints:["Where is the order saved first, right after the click?","Something has to copy it, clean it and put it somewhere for analysis. What are those three actions called?","Extract → Transform → Load into a warehouse, then the dashboard reads the warehouse."] }
  ],
  cards:[
   ["What does a data engineer do, in one sentence?","Builds and runs the systems (pipelines) that move data from where it's created to where it's used, correct and on time."],
   ["What is a data pipeline?","A series of automated steps that moves data from a source, transforms it, and loads it into a destination."],
   ["What is a data warehouse?","A central database designed for analysis, where clean data from many sources is stored."],
   ["Data engineer vs data analyst?","Engineer: makes the data available, reliable and on time. Analyst: uses that data to answer business questions."],
   ["Which skill is tested in almost every data engineering interview?","SQL."]
  ],
  feynman:"Explain what a data engineer does to a family member who has never heard of the job, using an everyday comparison.",
  connect:"Think of an app you use daily (a bank, a shop, a ride app). What data does it create when you use it, and who inside that company would want to see it?" },

{ id:"b3", phase:"basics", week:1, topic:"Basics", minutes:30, title:"Data as tables, files and keys",
  predict:{ q:"A spreadsheet of customers has the columns name, city and signup date. What does one row represent?",
    a:"One customer. A row is one thing (one record). Columns are the facts we store about each thing." },
  body:`
<p>Most data you will work with is shaped like a <b>table</b>: a grid with rows and columns, just like a spreadsheet.</p>
<ul><li>A <b>row</b> (also called a <i>record</i>) is one thing: one customer, one order, one trip.</li>
<li>A <b>column</b> (also called a <i>field</i>) is one fact about every thing: the name, the city, the price.</li>
<li>Each column has a <b>data type</b>: text (<code>'Lagos'</code>), whole number (<code>8</code>), decimal number (<code>45.50</code>), date (<code>2025-03-11</code>), or true/false.</li></ul>
<p>Here is part of the <code>customers</code> table you'll use in this course:</p>
<table class="mini"><tr><th>id</th><th>name</th><th>city</th><th>country</th></tr>
<tr><td>1</td><td>Amara Okafor</td><td>Lagos</td><td>Nigeria</td></tr>
<tr><td>2</td><td>Ben Carter</td><td>Chicago</td><td>USA</td></tr>
<tr><td>4</td><td>Diana Mbeki</td><td>Kinshasa</td><td>DR Congo</td></tr></table>
<h4>Keys: how tables point to each other</h4>
<p>A <b>primary key</b> is a column whose value is unique for every row, so it identifies that row. In <code>customers</code> it's <code>id</code>: no two customers share an id, even if two people have the same name.</p>
<p>A <b>foreign key</b> is a column that holds another table's primary key, to link the two. The <code>orders</code> table has <code>customer_id</code>. Order 103 has <code>customer_id = 2</code>, which means "this order belongs to customer 2, Ben Carter".</p>
<table class="mini"><tr><th>id</th><th>customer_id</th><th>order_date</th><th>amount</th><th>status</th></tr>
<tr><td>103</td><td>2</td><td>2025-02-10</td><td>450</td><td>delivered</td></tr>
<tr><td>104</td><td>2</td><td>2025-03-05</td><td>300</td><td>returned</td></tr></table>
<p>Why not just write Ben's name in every order? Because if Ben changes his name, you'd have to fix hundreds of rows. With a key, you fix it once in <code>customers</code>.</p>
<h4>Data in files: CSV and JSON</h4>
<p>Data often travels as files. A <b>CSV</b> (comma-separated values) file is a table written as text, one row per line:</p>
<pre>id,name,city
1,Amara Okafor,Lagos
2,Ben Carter,Chicago</pre>
<p><b>JSON</b> is how most web systems (APIs) send data. It uses names and values, and can nest things inside each other:</p>
<pre>{"id": 103, "customer": {"id": 2, "name": "Ben Carter"}, "items": ["monitor", "keyboard", "hub"]}</pre>
<p>A big part of data engineering is turning messy files like these into clean tables.</p>
<p><b>NULL</b> means "no value / unknown". Farid in our customers table has a NULL city: we don't know where he lives. NULL is not zero and not empty text. You'll learn to handle it carefully.</p>`,
  ex:[
   { id:"b3e1", kind:"text", q:"Look at the orders table above. (1) What does one row represent? (2) Which column is the primary key? (3) Which column is a foreign key, and which table does it point to? (4) What data type is each column?",
     sol:"(1) One order. (2) id — every order has a unique id. (3) customer_id is a foreign key pointing to customers.id. (4) id: whole number; customer_id: whole number; order_date: date; amount: decimal number; status: text.",
     hints:["A primary key must be unique for every row. Which column can never repeat?","A foreign key holds another table's id.","customer_id points to customers. Dates look like 2025-02-10."] }
  ],
  cards:[
   ["What is a row? What is a column?","Row: one record/thing (one customer). Column: one fact stored about every record (city)."],
   ["What is a primary key?","A column whose value is unique for every row, so it identifies the row (e.g. customers.id)."],
   ["What is a foreign key?","A column holding another table's primary key, linking the tables (e.g. orders.customer_id → customers.id)."],
   ["CSV vs JSON?","CSV: a table as plain text, one row per line, values separated by commas. JSON: name/value pairs that can be nested; common in APIs."],
   ["What does NULL mean?","No value / unknown. It is not 0 and not empty text."]
  ],
  feynman:"Explain primary and foreign keys using a school: students, classes, and how a class list points to students.",
  connect:"Think of a spreadsheet you have used (at work, school, or for money). What was one row? Was there a column that worked like an id?" },

{ id:"b4", phase:"basics", week:1, topic:"SQL", minutes:30, title:"Your first SQL query",
  predict:{ q:"If a database is a filing cabinet full of tables, what do you think this command does?  SELECT * FROM customers;",
    a:"It shows every column (*) of every row in the customers table. SELECT means 'show me', * means 'all columns', FROM says which table." },
  body:`
<p>A <b>database</b> is a program that stores tables safely and lets many people read and change them at once. Popular ones: <b>PostgreSQL</b> (very common in data engineering, free), MySQL, SQL Server, Snowflake, BigQuery.</p>
<p><b>SQL</b> (say "sequel" or "S-Q-L") is the language you use to talk to a database. It reads almost like English:</p>
<pre>SELECT name, city
FROM customers;</pre>
<p>"Select the name and city columns from the customers table."</p>
<ul><li><code>SELECT</code> lists the columns you want. <code>*</code> means all of them.</li>
<li><code>FROM</code> names the table.</li>
<li>The <code>;</code> ends the statement.</li>
<li>Keywords like SELECT aren't case-sensitive (<code>select</code> works too), but writing them in capitals makes queries easier to read.</li>
<li>Spaces and new lines don't matter. Put each part on its own line so it's readable.</li></ul>
<h4>How to use the editor</h4>
<p>Below is a real database running inside this page (SQLite, a small cousin of PostgreSQL; the SQL is almost identical). The database resets every time you click <b>Run</b>, so you can't break anything.</p>
<ul><li><b>Run</b> (or Ctrl/Cmd + Enter) shows your result.</li>
<li><b>Check</b> compares your result with the correct one.</li>
<li><b>Hint</b> gives three hints, one at a time. Try before you use them.</li>
<li>The full list of tables is in the <b>Playground</b> tab.</li></ul>`,
  ex:[
   { id:"b4e1", kind:"sql", q:"Show everything in the products table.", starter:"", sol:"SELECT * FROM products;",
     hints:["Which keyword shows data? Which symbol means 'all columns'?","SELECT * FROM ...","SELECT * FROM products;"] },
   { id:"b4e2", kind:"sql", q:"Show only the name and salary of every employee.", starter:"", sol:"SELECT name, salary FROM employees;",
     hints:["List the column names after SELECT, separated by a comma.","The table is called employees.","SELECT name, salary FROM employees;"] }
  ],
  cards:[
   ["What is SQL?","The language used to ask questions of (and change) data stored in database tables."],
   ["What does * mean in SELECT *?","All columns."],
   ["What do SELECT and FROM do?","SELECT lists the columns to show; FROM names the table to read from."],
   ["Name a database very common in data engineering.","PostgreSQL (others: MySQL, SQL Server, Snowflake, BigQuery)."]
  ],
  feynman:"Explain what SELECT name FROM customers; does, word by word, to someone who has never seen code.",
  connect:"If your old workplace or school had a database of people, write one SELECT query someone there might have wanted to run." },

/* ======================= PHASE: SQL ======================= */
{ id:"s1", phase:"sql", week:1, topic:"SQL", minutes:40, title:"Choosing columns: aliases, math and DISTINCT",
  predict:{ q:"How could you show each product's price with 16% tax added, without changing the data in the table?",
    a:"Do the math right in SELECT: SELECT name, price * 1.16 FROM products; SQL calculates a new column for the result only. The table stays unchanged." },
  body:`
<p>SELECT can do more than pick columns. It can calculate, rename and remove duplicates.</p>
<h4>Calculated columns and aliases</h4>
<pre>SELECT name, price, price * 1.16 AS price_with_tax
FROM products;</pre>
<p>Math works as you'd expect: <code>+ - * /</code>. <code>AS</code> gives the result column a name (an <b>alias</b>). Without it, the column would be called <code>price * 1.16</code>.</p>
<p>Careful with division: in many databases, <code>7 / 2</code> gives <code>3</code> when both are whole numbers. Write <code>7 / 2.0</code> or <code>7 * 1.0 / 2</code> to get <code>3.5</code>.</p>
<h4>DISTINCT removes duplicates</h4>
<pre>SELECT DISTINCT country FROM customers;</pre>
<p>Without DISTINCT you'd see USA three times and Nigeria twice. With it, each country appears once.</p>
<h4>LIMIT shows only the first few rows</h4>
<pre>SELECT * FROM orders LIMIT 5;</pre>
<p>Real tables can have billions of rows. LIMIT is how you peek at a table safely. (SQL Server writes it <code>SELECT TOP 5 *</code> instead.)</p>
<h4>ROUND tidies numbers</h4>
<pre>SELECT name, ROUND(price * 1.16, 2) AS price_with_tax FROM products;</pre>`,
  ex:[
   { id:"s1e1", kind:"sql", q:"Show each product's name and its price with 16% tax added, in a column called price_with_tax.", sol:"SELECT name, price * 1.16 AS price_with_tax FROM products;",
     hints:["You need two columns: one existing, one calculated.","Multiply price by 1.16 and give it a name with AS.","SELECT name, price * 1.16 AS price_with_tax FROM products;"] },
   { id:"s1e2", kind:"sql", q:"List each country that has customers, once each.", sol:"SELECT DISTINCT country FROM customers;",
     hints:["You want to remove repeated values.","The keyword goes right after SELECT.","SELECT DISTINCT country FROM customers;"] },
   { id:"s1e3", kind:"sql", q:"Each employee earns 12 monthly payments. Show each employee's name and monthly salary (salary divided by 12), rounded to 0 decimals, as monthly.", sol:"SELECT name, ROUND(salary / 12.0) AS monthly FROM employees;",
     hints:["Division in SELECT, plus ROUND.","Watch out: salary / 12 with whole numbers may drop the decimals. Use 12.0.","SELECT name, ROUND(salary / 12.0) AS monthly FROM employees;"] }
  ],
  cards:[
   ["What does AS do in SELECT price * 2 AS double_price?","Gives the result column a name (an alias)."],
   ["What does DISTINCT do?","Removes duplicate rows from the result, so each value (or combination) appears once."],
   ["How do you look at only the first 10 rows?","LIMIT 10 at the end (SQL Server: SELECT TOP 10)."],
   ["Why can 7 / 2 return 3?","Integer division: both are whole numbers. Use 7 / 2.0 to get 3.5."]
  ],
  feynman:"Explain the difference between changing data in a table and calculating a new column in SELECT.",
  connect:"Where have you seen a 'calculated column' before, like a formula in Excel? How is that like price * 1.16?" },

{ id:"s2", phase:"sql", week:2, topic:"SQL", minutes:45, title:"Filtering rows with WHERE",
  predict:{ q:"How might you ask for only the customers who live in Chicago?",
    a:"Add a WHERE condition: SELECT * FROM customers WHERE city = 'Chicago'; WHERE keeps only rows where the condition is true. Text goes inside single quotes." },
  body:`
<p>SELECT picks columns. <b>WHERE picks rows.</b> It keeps only the rows where the condition is true.</p>
<pre>SELECT name, price
FROM products
WHERE price > 50;</pre>
<h4>Comparisons</h4>
<p><code>=</code> equal, <code>&lt;&gt;</code> or <code>!=</code> not equal, <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code>. Text and dates go in <b>single quotes</b>: <code>city = 'Lagos'</code>, <code>order_date &gt;= '2025-04-01'</code>.</p>
<h4>Combining conditions</h4>
<pre>WHERE status = 'delivered' AND amount >= 100   -- both must be true
WHERE city = 'Lagos' OR city = 'Toronto'         -- either can be true
WHERE NOT status = 'cancelled'</pre>
<p>When you mix AND and OR, use parentheses. <code>WHERE a OR b AND c</code> means <code>a OR (b AND c)</code>, which is often not what you meant.</p>
<h4>Shortcuts</h4>
<pre>WHERE city IN ('Lagos', 'Toronto')          -- same as two ORs
WHERE amount BETWEEN 100 AND 300             -- includes 100 and 300
WHERE name LIKE '%key%'                      -- contains "key"
WHERE name LIKE 'W%'                         -- starts with W</pre>
<p>In LIKE, <code>%</code> means "any characters" and <code>_</code> means "exactly one character". In PostgreSQL LIKE is case-sensitive; use <code>ILIKE</code> to ignore case.</p>
<p><code>--</code> starts a comment: SQL ignores the rest of the line.</p>`,
  ex:[
   { id:"s2e1", kind:"sql", q:"Show all products that cost more than 50.", sol:"SELECT * FROM products WHERE price > 50;",
     hints:["You need WHERE with a comparison.","The column is price.","SELECT * FROM products WHERE price > 50;"] },
   { id:"s2e2", kind:"sql", q:"Show the id and amount of delivered orders with an amount of at least 100.", sol:"SELECT id, amount FROM orders WHERE status = 'delivered' AND amount >= 100;",
     hints:["Two conditions that must both be true.","Text values go in single quotes: 'delivered'. 'At least' means >=.","SELECT id, amount FROM orders WHERE status = 'delivered' AND amount >= 100;"] },
   { id:"s2e3", kind:"sql", q:"Show the names of customers who live in Lagos or Toronto, using IN.", sol:"SELECT name FROM customers WHERE city IN ('Lagos', 'Toronto');",
     hints:["IN takes a list in parentheses.","Each city is text, so each needs single quotes.","SELECT name FROM customers WHERE city IN ('Lagos', 'Toronto');"] },
   { id:"s2e4", kind:"sql", q:"Show all products whose name contains the word 'mouse' or starts with 'USB'.", sol:"SELECT * FROM products WHERE name LIKE '%mouse%' OR name LIKE 'USB%';",
     hints:["Use LIKE twice, joined with OR.","% means 'anything'. 'Contains' needs % on both sides; 'starts with' needs it only at the end.","WHERE name LIKE '%mouse%' OR name LIKE 'USB%'"] }
  ],
  cards:[
   ["SELECT picks columns. What picks rows?","WHERE — it keeps only rows where the condition is true."],
   ["What quotes does SQL use for text values?","Single quotes: 'Lagos'. (Double quotes are for column names in PostgreSQL.)"],
   ["Is BETWEEN 100 AND 300 inclusive?","Yes: it includes 100 and 300."],
   ["In LIKE, what do % and _ mean?","% = any number of characters; _ = exactly one character."],
   ["Why use parentheses with AND and OR?","AND is evaluated before OR, so a OR b AND c means a OR (b AND c). Parentheses make your meaning explicit."]
  ],
  feynman:"Explain WHERE using a real-life example of filtering, like sorting mail or a shop's 'filter by price' button.",
  connect:"Think of a website filter you've used (price range, size, location). Write the WHERE clause it might be running." },

{ id:"s3", phase:"sql", week:2, topic:"SQL", minutes:30, title:"NULL: the missing value",
  predict:{ q:"Farid has no city (it's NULL). Will  WHERE city = NULL  find him?",
    a:"No. NULL means 'unknown', and comparing anything to unknown gives unknown, not true. You must write WHERE city IS NULL." },
  body:`
<p><b>NULL</b> means the value is missing or unknown. It is not 0, not empty text <code>''</code>, and not the word "NULL".</p>
<p>Because NULL is unknown, normal comparisons don't work on it. Is an unknown city equal to Chicago? Unknown. Is it equal to another unknown? Also unknown. So <code>city = NULL</code> is never true.</p>
<pre>SELECT * FROM customers WHERE city IS NULL;      -- correct
SELECT * FROM customers WHERE city IS NOT NULL;  -- everyone with a city</pre>
<h4>NULL spreads through math</h4>
<p><code>NULL + 5</code> is NULL. Order 115 has a NULL amount, so <code>amount * 1.16</code> is also NULL for it.</p>
<h4>COALESCE gives a fallback</h4>
<pre>SELECT id, COALESCE(amount, 0) AS amount FROM orders;</pre>
<p>COALESCE returns the first value that is not NULL. Here: the amount if there is one, otherwise 0. (SQL Server also has <code>ISNULL(amount, 0)</code>.)</p>
<h4>NULL hides from filters</h4>
<p><code>WHERE city &lt;&gt; 'Chicago'</code> does <b>not</b> return Farid, because his city is unknown. If you want him too: <code>WHERE city &lt;&gt; 'Chicago' OR city IS NULL</code>. This is a classic interview trap.</p>`,
  ex:[
   { id:"s3e1", kind:"sql", q:"Find the customers who have no city.", sol:"SELECT * FROM customers WHERE city IS NULL;",
     hints:["= NULL doesn't work.","There is a special phrase for checking missing values.","WHERE city IS NULL"] },
   { id:"s3e2", kind:"sql", q:"Show every order's id and amount, with missing amounts shown as 0, in a column called amount.", sol:"SELECT id, COALESCE(amount, 0) AS amount FROM orders;",
     hints:["You need a function that replaces NULL with a fallback.","COALESCE(column, fallback).","SELECT id, COALESCE(amount, 0) AS amount FROM orders;"] },
   { id:"s3e3", kind:"sql", q:"Show the names of all customers who do NOT live in Chicago — including the customer whose city is unknown.", sol:"SELECT name FROM customers WHERE city <> 'Chicago' OR city IS NULL;",
     hints:["Run WHERE city <> 'Chicago' first and count the rows. Who is missing?","The NULL row needs its own condition.","WHERE city <> 'Chicago' OR city IS NULL"] }
  ],
  cards:[
   ["How do you find rows where a column is missing?","WHERE col IS NULL (never = NULL)."],
   ["What is NULL + 5?","NULL. NULL spreads through math."],
   ["What does COALESCE(a, b) return?","The first value that isn't NULL: a if it has a value, otherwise b."],
   ["Does WHERE city <> 'Chicago' return rows where city is NULL?","No. Comparing NULL gives unknown, so those rows are filtered out. Add OR city IS NULL."]
  ],
  feynman:"Explain why 'unknown = unknown' is not true, using a real example (two people whose ages you don't know).",
  connect:"Think of a form you've filled in with an optional field you skipped. How should a report treat that missing answer?" },

{ id:"s4", phase:"sql", week:2, topic:"SQL", minutes:25, title:"Sorting with ORDER BY",
  predict:{ q:"If you don't ask for any order, will a database always return rows in the same order?",
    a:"No. Without ORDER BY, the order is not guaranteed and can change. If order matters, always write ORDER BY." },
  body:`
<pre>SELECT name, price
FROM products
ORDER BY price DESC;</pre>
<ul><li><code>ASC</code> = smallest first (the default). <code>DESC</code> = largest first.</li>
<li>Sort by several columns: <code>ORDER BY dept_id, salary DESC</code> sorts by department first, then by salary (highest first) inside each department.</li>
<li>You can sort by an alias: <code>ORDER BY price_with_tax</code>.</li></ul>
<h4>Top N</h4>
<pre>SELECT name, price FROM products ORDER BY price DESC LIMIT 3;</pre>
<p>"The 3 most expensive products." ORDER BY first, then LIMIT.</p>
<p>Where do NULLs go? PostgreSQL puts them last when sorting ASC; SQLite and SQL Server put them first. You can say <code>NULLS LAST</code> in PostgreSQL to be explicit.</p>`,
  ex:[
   { id:"s4e1", kind:"sql", ordered:true, q:"Show the name and price of the 3 most expensive products, most expensive first.", sol:"SELECT name, price FROM products ORDER BY price DESC LIMIT 3;",
     hints:["Sort, then keep only some rows.","DESC puts the biggest first. LIMIT goes at the very end.","ORDER BY price DESC LIMIT 3"] },
   { id:"s4e2", kind:"sql", ordered:true, q:"Show employees' name, dept_id and salary, sorted by dept_id (smallest first), then by salary (highest first) within each department. Leave out employees with no department.", sol:"SELECT name, dept_id, salary FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id, salary DESC;",
     hints:["You need WHERE (to drop the missing department) and ORDER BY with two columns.","IS NOT NULL. Each column in ORDER BY can have its own direction.","WHERE dept_id IS NOT NULL ORDER BY dept_id, salary DESC"] }
  ],
  cards:[
   ["Is row order guaranteed without ORDER BY?","No. Always use ORDER BY when order matters."],
   ["ASC vs DESC?","ASC: smallest/earliest/A first (default). DESC: largest/latest/Z first."],
   ["How do you get the top 5 by price?","ORDER BY price DESC LIMIT 5."]
  ],
  feynman:"Explain why a database doesn't keep rows 'in order' the way a list on paper does.",
  connect:"What 'top 10' lists have you seen at work or online? Write the ORDER BY ... LIMIT that would produce one." },

{ id:"s5", phase:"sql", week:2, topic:"SQL", minutes:40, title:"Counting and adding: aggregate functions",
  predict:{ q:"How many orders are there in total? Guess what the SQL for that looks like.",
    a:"SELECT COUNT(*) FROM orders; COUNT(*) counts rows. It squeezes the whole table into a single number." },
  body:`
<p><b>Aggregate functions</b> turn many rows into one value:</p>
<table class="mini"><tr><th>Function</th><th>Gives</th></tr>
<tr><td><code>COUNT(*)</code></td><td>number of rows</td></tr>
<tr><td><code>COUNT(col)</code></td><td>number of rows where col is not NULL</td></tr>
<tr><td><code>COUNT(DISTINCT col)</code></td><td>number of different non-NULL values</td></tr>
<tr><td><code>SUM(col)</code> / <code>AVG(col)</code></td><td>total / average (NULLs are skipped)</td></tr>
<tr><td><code>MIN(col)</code> / <code>MAX(col)</code></td><td>smallest / largest</td></tr></table>
<pre>SELECT COUNT(*) AS orders,
       COUNT(amount) AS orders_with_amount,
       SUM(amount) AS total,
       ROUND(AVG(amount), 2) AS average
FROM orders;</pre>
<p>This returns <b>one row</b>. COUNT(*) is 16 but COUNT(amount) is 15, because one amount is NULL.</p>
<p>WHERE runs <b>before</b> the aggregate, so you can total just some rows:</p>
<pre>SELECT SUM(amount) FROM orders WHERE status = 'delivered';</pre>`,
  ex:[
   { id:"s5e1", kind:"sql", q:"How many orders are there?", sol:"SELECT COUNT(*) FROM orders;",
     hints:["One function counts rows.","COUNT(*)","SELECT COUNT(*) FROM orders;"] },
   { id:"s5e2", kind:"sql", q:"Show the total amount and the average amount of delivered orders only (two columns).", sol:"SELECT SUM(amount), AVG(amount) FROM orders WHERE status = 'delivered';",
     hints:["Two aggregate functions in SELECT, and a filter.","WHERE filters before adding up.","SELECT SUM(amount), AVG(amount) FROM orders WHERE status = 'delivered';"] },
   { id:"s5e3", kind:"sql", q:"How many different customers have placed at least one order?", sol:"SELECT COUNT(DISTINCT customer_id) FROM orders;",
     hints:["Customers appear many times in orders. You want each counted once.","COUNT can take DISTINCT inside the parentheses.","SELECT COUNT(DISTINCT customer_id) FROM orders;"] }
  ],
  cards:[
   ["COUNT(*) vs COUNT(col)?","COUNT(*) counts all rows; COUNT(col) counts rows where col is not NULL."],
   ["Do SUM and AVG include NULLs?","No, they skip NULL values."],
   ["How do you count unique customers in orders?","COUNT(DISTINCT customer_id)."],
   ["Does WHERE run before or after aggregation?","Before. It filters rows first, then the aggregate runs on what's left."]
  ],
  feynman:"Explain why COUNT(*) and COUNT(amount) give different numbers on the orders table.",
  connect:"Think of a number a manager might ask for every week (total sales, number of new customers). Which aggregate gives it?" },

{ id:"s6", phase:"sql", week:3, topic:"SQL", minutes:45, title:"GROUP BY: totals per group",
  predict:{ q:"SUM(amount) gives one total for all orders. What do you need if you want a total for each customer instead?",
    a:"GROUP BY customer_id. It splits the rows into one group per customer, and the aggregate runs once for each group." },
  body:`
<p><b>GROUP BY</b> splits rows into groups that share a value, then runs the aggregate once per group. You get one result row per group.</p>
<pre>SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status;</pre>
<div class="analogy"><b>Think of sorting laundry.</b> You put clothes into piles by color (GROUP BY color), then count each pile (COUNT(*)). You end up with one line per color, not one per sock.</div>
<h4>The golden rule</h4>
<p>Every column in SELECT must either be in the GROUP BY or be inside an aggregate function. This fails in PostgreSQL:</p>
<pre>SELECT customer_id, order_date, SUM(amount)   -- order_date: which one? there are many per customer
FROM orders GROUP BY customer_id;</pre>
<p>(SQLite allows it and picks a random value, which is worse: it silently gives you nonsense. Follow the rule anyway.)</p>
<h4>Group by more than one column</h4>
<pre>SELECT customer_id, status, COUNT(*)
FROM orders
GROUP BY customer_id, status;</pre>
<p>One row for each combination of customer and status.</p>`,
  ex:[
   { id:"s6e1", kind:"sql", q:"Show each order status and how many orders have it.", sol:"SELECT status, COUNT(*) FROM orders GROUP BY status;",
     hints:["One row per status.","SELECT the grouping column and the count.","SELECT status, COUNT(*) FROM orders GROUP BY status;"] },
   { id:"s6e2", kind:"sql", q:"Show each customer_id and the total amount they've ordered.", sol:"SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id;",
     hints:["Group by the customer.","SUM goes in SELECT; the customer column goes in both SELECT and GROUP BY.","SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id;"] },
   { id:"s6e3", kind:"sql", q:"Show each department id with its number of employees and its highest salary. Leave out employees with no department.", sol:"SELECT dept_id, COUNT(*), MAX(salary) FROM employees WHERE dept_id IS NOT NULL GROUP BY dept_id;",
     hints:["Two aggregates per group, and a filter before grouping.","WHERE comes before GROUP BY.","SELECT dept_id, COUNT(*), MAX(salary) FROM employees WHERE dept_id IS NOT NULL GROUP BY dept_id;"] }
  ],
  cards:[
   ["What does GROUP BY do?","Splits rows into groups sharing a value and runs the aggregate once per group: one result row per group."],
   ["The GROUP BY golden rule?","Every selected column must be in GROUP BY or inside an aggregate function."],
   ["How do you count orders per customer per status?","GROUP BY customer_id, status with COUNT(*)."]
  ],
  feynman:"Explain GROUP BY using a classroom: the teacher wants the average grade for each class, not for the whole school.",
  connect:"Name a report you've seen that showed 'per something' totals (per month, per store, per product). What was it grouped by?" },

{ id:"s7", phase:"sql", week:3, topic:"SQL", minutes:40, title:"HAVING, and the order SQL really runs in",
  predict:{ q:"You want customers with more than 2 orders. Can you write  WHERE COUNT(*) > 2 ?",
    a:"No. WHERE runs before the groups exist, so it can't see COUNT. Use HAVING, which filters after grouping: GROUP BY customer_id HAVING COUNT(*) > 2." },
  body:`
<p><b>WHERE filters rows before grouping. HAVING filters groups after grouping.</b></p>
<pre>SELECT customer_id, COUNT(*) AS orders
FROM orders
WHERE status <> 'cancelled'      -- 1. drop cancelled rows
GROUP BY customer_id             -- 2. make groups
HAVING COUNT(*) > 2;             -- 3. keep big groups</pre>
<h4>The order SQL actually runs</h4>
<p>You write SELECT first, but the database runs the parts in this order:</p>
<pre class="flow">FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT</pre>
<p>This explains a lot of errors:</p>
<ul><li>You can't use a SELECT alias in WHERE, because WHERE runs before SELECT has named anything.</li>
<li>You can use an alias in ORDER BY, because ORDER BY runs after SELECT.</li>
<li>Aggregates can't go in WHERE, because groups don't exist yet.</li></ul>
<p>Interviewers ask about this order all the time. Learn it by heart; it's on a flashcard.</p>`,
  ex:[
   { id:"s7e1", kind:"sql", q:"Show the customer_id of every customer with more than 2 orders, with their number of orders.", sol:"SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) > 2;",
     hints:["Group per customer, then filter the groups.","HAVING goes after GROUP BY.","GROUP BY customer_id HAVING COUNT(*) > 2"] },
   { id:"s7e2", kind:"sql", q:"Only counting orders from 2025-03-01 onward, show each status whose total amount is over 500, with that total.", sol:"SELECT status, SUM(amount) FROM orders WHERE order_date >= '2025-03-01' GROUP BY status HAVING SUM(amount) > 500;",
     hints:["One condition is about rows (the date), one is about groups (the total).","Row condition → WHERE. Group condition → HAVING.","WHERE order_date >= '2025-03-01' GROUP BY status HAVING SUM(amount) > 500"] }
  ],
  cards:[
   ["WHERE vs HAVING?","WHERE filters rows before grouping; HAVING filters groups after grouping (and can use aggregates)."],
   ["In what order does SQL run a query?","FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT."],
   ["Why can't you use a SELECT alias in WHERE?","WHERE runs before SELECT, so the alias doesn't exist yet."]
  ],
  feynman:"Explain the difference between WHERE and HAVING using a sports league: filtering players vs filtering teams.",
  connect:"Think of a question like 'which stores sold more than X last month?' Which part is WHERE and which is HAVING?" },

{ id:"s8", phase:"sql", week:3, topic:"SQL", minutes:50, title:"JOIN: combining tables",
  predict:{ q:"The orders table has customer_id but not the customer's name. How could you show each order with the customer's name?",
    a:"JOIN the two tables, matching orders.customer_id to customers.id. Each order row gets the matching customer's columns attached." },
  body:`
<p>Data is split across tables (remember keys from lesson 3). <b>JOIN</b> puts it back together for a query.</p>
<pre>SELECT o.id, o.amount, c.name
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id;</pre>
<ul><li><code>orders AS o</code> gives the table a short nickname (alias). You can drop <code>AS</code>: <code>orders o</code>.</li>
<li><code>ON</code> says how rows match: an order's customer_id equals a customer's id.</li>
<li>Write <code>o.id</code> and <code>c.name</code> to say which table each column comes from. Both tables have an <code>id</code>, so you must.</li></ul>
<div class="analogy"><b>Think of matching name tags.</b> Each order holds a tag with a customer number. JOIN walks through the orders, finds the customer with that number, and staples their details to the order.</div>
<p><code>JOIN</code> on its own means <b>INNER JOIN</b>: only rows that find a match are kept. Customers who never ordered won't appear. Next lesson fixes that.</p>
<p>After joining, everything you learned still works: WHERE, GROUP BY, ORDER BY.</p>
<pre>SELECT c.city, SUM(o.amount) AS total
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.city;</pre>`,
  ex:[
   { id:"s8e1", kind:"sql", q:"Show every order's id together with the name of the customer who placed it.", sol:"SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id;",
     hints:["Join orders to customers.","The ON condition matches orders.customer_id to customers.id.","SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id;"] },
   { id:"s8e2", kind:"sql", ordered:true, q:"Show each customer's name and their total order amount, highest total first.", sol:"SELECT c.name, SUM(o.amount) AS total FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.name ORDER BY total DESC;",
     hints:["Join first, then group, then sort.","GROUP BY c.name, SUM(o.amount).","... GROUP BY c.name ORDER BY total DESC;"] },
   { id:"s8e3", kind:"sql", q:"Show each employee's name with the name of their department (only employees who have a department).", sol:"SELECT e.name, d.name FROM employees e JOIN departments d ON d.id = e.dept_id;",
     hints:["Which column in employees points to departments?","employees.dept_id = departments.id","SELECT e.name, d.name FROM employees e JOIN departments d ON d.id = e.dept_id;"] }
  ],
  cards:[
   ["What does an INNER JOIN return?","Only rows that have a match in both tables."],
   ["What does ON do in a JOIN?","Says how rows match between the tables (e.g. c.id = o.customer_id)."],
   ["Why write o.id instead of id after a join?","Both tables may have a column with that name; the prefix says which table it comes from."]
  ],
  feynman:"Explain a JOIN using two lists on paper: a class list with student numbers, and a grades list with student numbers.",
  connect:"In a job or project you know, which two kinds of records would someone need to join to answer a common question?" },

{ id:"s9", phase:"sql", week:3, topic:"SQL", minutes:45, title:"LEFT JOIN and finding what's missing",
  predict:{ q:"Which customers have never placed an order? Will an INNER JOIN of customers and orders show them?",
    a:"No. INNER JOIN drops customers with no matching order. A LEFT JOIN keeps them (with NULLs in the order columns), and then WHERE o.id IS NULL finds exactly those customers." },
  body:`
<p><b>LEFT JOIN keeps every row from the left table</b> (the one after FROM), even when there's no match on the right. Where nothing matches, the right side's columns are NULL.</p>
<pre>SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;</pre>
<p>Farid and Hugo appear with <code>order_id = NULL</code>.</p>
<h4>The "anti-join": find rows with no match</h4>
<pre>SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;</pre>
<p>This pattern (customers with no orders, products never sold, employees with no manager) appears in interviews constantly.</p>
<h4>Counting with LEFT JOIN</h4>
<p>To count orders per customer including zeros, count a column from the right table: <code>COUNT(o.id)</code>. <code>COUNT(*)</code> would count the NULL row as 1.</p>
<h4>Other joins</h4>
<ul><li><b>RIGHT JOIN</b>: keeps every row from the right table. Rarely used; just swap the tables and use LEFT.</li>
<li><b>FULL OUTER JOIN</b>: keeps all rows from both sides.</li>
<li><b>CROSS JOIN</b>: every row paired with every row. Useful occasionally, dangerous on big tables.</li></ul>`,
  ex:[
   { id:"s9e1", kind:"sql", q:"Find the names of customers who have never placed an order.", sol:"SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;",
     hints:["Keep all customers, then look for the ones with nothing attached.","LEFT JOIN orders, then check for NULL on the orders side.","... LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;"] },
   { id:"s9e2", kind:"sql", q:"Show every department's name and its number of employees — including departments with zero employees.", sol:"SELECT d.name, COUNT(e.id) FROM departments d LEFT JOIN employees e ON e.dept_id = d.id GROUP BY d.name;",
     hints:["Which table must keep all its rows? Put it after FROM.","COUNT(*) would count 1 for an empty department. Count a column from employees.","SELECT d.name, COUNT(e.id) FROM departments d LEFT JOIN employees e ON e.dept_id = d.id GROUP BY d.name;"] },
   { id:"s9e3", kind:"sql", q:"Show every employee's name with their department's name, including employees who have no department.", sol:"SELECT e.name, d.name FROM employees e LEFT JOIN departments d ON d.id = e.dept_id;",
     hints:["Now employees must keep all rows.","employees goes after FROM; LEFT JOIN departments.","SELECT e.name, d.name FROM employees e LEFT JOIN departments d ON d.id = e.dept_id;"] }
  ],
  cards:[
   ["What does a LEFT JOIN return?","All rows from the left table, plus matching right rows; NULLs on the right where nothing matches."],
   ["How do you find customers with no orders?","customers LEFT JOIN orders ... WHERE orders.id IS NULL (an anti-join). Or NOT EXISTS."],
   ["Counting per group after a LEFT JOIN: COUNT(*) or COUNT(right.id)?","COUNT(right.id), so groups with no match count 0, not 1."]
  ],
  feynman:"Explain why a LEFT JOIN can return more rows than the left table has. (Hint: one customer, many orders.)",
  connect:"Where would 'find what's missing' matter in a real business? (Unpaid invoices, products never sold, staff without training…)" },

{ id:"s10", phase:"sql", week:4, topic:"SQL", minutes:45, title:"Joining many tables, and the row-multiplying trap",
  predict:{ q:"Order 103 contains 3 different products. If you join orders to order_items, how many rows will order 103 become?",
    a:"3 rows: one for each product in it. Joins multiply rows when one row matches many. If you then SUM(orders.amount), order 103's amount is counted 3 times." },
  body:`
<p>Real questions often need three or four tables. Just chain the joins:</p>
<pre>SELECT o.id, p.name, oi.quantity
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
WHERE o.id = 103;</pre>
<p><code>order_items</code> is a <b>bridge table</b>: one order has many products, and one product is in many orders. The bridge holds one row per (order, product) pair.</p>
<h4>The fan-out trap</h4>
<p>Before any join, ask: <b>"What does one row of my result represent?"</b> This is called the <b>grain</b>.</p>
<ul><li><code>orders</code>: one row = one order.</li>
<li><code>orders JOIN order_items</code>: one row = one product line inside an order.</li></ul>
<p>So this is wrong; it counts order amounts once per product line:</p>
<pre>SELECT SUM(o.amount) FROM orders o JOIN order_items oi ON oi.order_id = o.id;  -- too big!</pre>
<p>To get revenue by product, calculate at the item grain instead: <code>SUM(oi.quantity * p.price)</code>.</p>
<p>A quick self-check after every join: count the rows. If the number jumped unexpectedly, you have fan-out.</p>`,
  ex:[
   { id:"s10e1", kind:"sql", q:"For order 103, show each product's name and the quantity ordered.", sol:"SELECT p.name, oi.quantity FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = 103;",
     hints:["Which table says what's in an order? Which has product names?","Join order_items to products, filter to order 103.","SELECT p.name, oi.quantity FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = 103;"] },
   { id:"s10e2", kind:"sql", q:"Show the total quantity sold for each product category.", sol:"SELECT p.category, SUM(oi.quantity) FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.category;",
     hints:["Quantity is in order_items; category is in products.","Join, then GROUP BY category and SUM the quantity.","SELECT p.category, SUM(oi.quantity) FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.category;"] },
   { id:"s10e3", kind:"sql", ordered:true, q:"Show each product's name and its revenue (quantity × price), highest revenue first.", sol:"SELECT p.name, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC;",
     hints:["Revenue per item line is quantity * price. Add those up per product.","SUM(oi.quantity * p.price), GROUP BY p.name.","... GROUP BY p.name ORDER BY revenue DESC;"] }
  ],
  cards:[
   ["What is the grain of a table or query?","What one row represents (one order, one order line, one customer per day…)."],
   ["What is fan-out in a join?","When one row matches many rows, so rows multiply; sums of the 'one' side get counted several times."],
   ["What is a bridge table?","A table linking two others in a many-to-many relationship, e.g. order_items between orders and products."]
  ],
  feynman:"Explain the fan-out trap with a real example: a restaurant bill with 3 dishes, joined to a list of dishes.",
  connect:"Think of a report in your past where a number looked 'too big'. Could fan-out have been the reason?" },

{ id:"s11", phase:"sql", week:4, topic:"SQL", minutes:40, title:"CASE WHEN: if/then inside SQL",
  predict:{ q:"How could a query label each order 'small' or 'large' depending on its amount?",
    a:"With CASE: CASE WHEN amount >= 300 THEN 'large' ELSE 'small' END. It's SQL's if/then/else, and it creates a new column." },
  body:`
<pre>SELECT id, amount,
  CASE
    WHEN amount IS NULL THEN 'unknown'
    WHEN amount < 100   THEN 'small'
    WHEN amount < 300   THEN 'medium'
    ELSE 'large'
  END AS size
FROM orders;</pre>
<ul><li>Conditions are checked <b>top to bottom</b>; the first true one wins. That's why the second line can say <code>&lt; 300</code> without also saying <code>&gt;= 100</code>.</li>
<li><code>ELSE</code> catches everything else. Without ELSE, unmatched rows get NULL.</li>
<li>Always end with <code>END</code>.</li></ul>
<h4>Conditional aggregation: a favorite interview trick</h4>
<p>Put CASE inside SUM to count or add only some rows, side by side in one query:</p>
<pre>SELECT customer_id,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
  SUM(CASE WHEN status <> 'delivered' THEN 1 ELSE 0 END) AS not_delivered
FROM orders
GROUP BY customer_id;</pre>
<p>This turns rows into columns, which is called a <b>pivot</b>. (PostgreSQL also has the shorter <code>COUNT(*) FILTER (WHERE status = 'delivered')</code>.)</p>`,
  ex:[
   { id:"s11e1", kind:"sql", q:"Show each order's id, amount and a size column: 'unknown' if amount is NULL, 'small' under 100, 'medium' under 300, otherwise 'large'.", sol:"SELECT id, amount, CASE WHEN amount IS NULL THEN 'unknown' WHEN amount < 100 THEN 'small' WHEN amount < 300 THEN 'medium' ELSE 'large' END AS size FROM orders;",
     hints:["CASE with several WHEN lines, then ELSE, then END.","Check NULL first, then go from smallest to largest.","CASE WHEN amount IS NULL THEN 'unknown' WHEN amount < 100 THEN 'small' ..."] },
   { id:"s11e2", kind:"sql", q:"For each customer_id, show the number of delivered orders and the number of orders that are not delivered, in two columns.", sol:"SELECT customer_id, SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered, SUM(CASE WHEN status <> 'delivered' THEN 1 ELSE 0 END) AS not_delivered FROM orders GROUP BY customer_id;",
     hints:["Group by customer; each column is a SUM of a CASE.","CASE gives 1 when the row should count and 0 otherwise.","SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)"] }
  ],
  cards:[
   ["What is CASE WHEN?","SQL's if/then/else: CASE WHEN cond THEN value ... ELSE value END."],
   ["In a CASE, if two WHEN conditions are true, which wins?","The first one (they are checked top to bottom)."],
   ["How do you count only delivered orders per customer next to all orders?","SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) inside a GROUP BY (conditional aggregation)."]
  ],
  feynman:"Explain CASE WHEN using a shipping price list: under 1 kg costs X, under 5 kg costs Y, else Z.",
  connect:"What categories or labels did a business you know put on its customers or products? Write the CASE that would assign them." },

{ id:"s12", phase:"sql", week:4, topic:"SQL", minutes:45, title:"Subqueries: a query inside a query",
  predict:{ q:"How would you find products more expensive than the average price — without calculating the average yourself and typing it in?",
    a:"Put a query inside the query: WHERE price > (SELECT AVG(price) FROM products). The inner query runs first and gives the average." },
  body:`
<p>A <b>subquery</b> is a SELECT inside another SELECT, in parentheses.</p>
<h4>1. A single value in WHERE</h4>
<pre>SELECT name, price FROM products
WHERE price > (SELECT AVG(price) FROM products);</pre>
<h4>2. A list with IN</h4>
<pre>SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE amount > 300);</pre>
<h4>3. A table in FROM</h4>
<pre>SELECT AVG(total) FROM (
  SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id
) AS t;</pre>
<h4>4. EXISTS</h4>
<pre>SELECT name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);</pre>
<p>This inner query mentions <code>c.id</code> from the outer query. That's a <b>correlated subquery</b>: it runs once per outer row.</p>
<h4>The NOT IN trap</h4>
<p>If the list inside <code>NOT IN (...)</code> contains a single NULL, the whole thing returns no rows (remember: comparing with unknown is unknown). <b>Prefer NOT EXISTS</b>. Interviewers love this one.</p>`,
  ex:[
   { id:"s12e1", kind:"sql", q:"Show the name and price of products priced above the average product price.", sol:"SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);",
     hints:["The average comes from its own SELECT.","Put that SELECT in parentheses after >.","WHERE price > (SELECT AVG(price) FROM products)"] },
   { id:"s12e2", kind:"sql", q:"Using IN with a subquery, show the names of customers who placed at least one order over 300.", sol:"SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE amount > 300);",
     hints:["The inner query gives a list of customer ids.","WHERE id IN (SELECT customer_id FROM orders WHERE ...)","SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE amount > 300);"] },
   { id:"s12e3", kind:"sql", q:"Find the second-highest distinct salary among employees (one value).", sol:"SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);",
     hints:["The second highest is the biggest salary that is smaller than the biggest.","Use MAX twice: once inside a subquery.","SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);"] }
  ],
  cards:[
   ["What is a subquery?","A SELECT inside another query, in parentheses; its result is used by the outer query."],
   ["What is a correlated subquery?","A subquery that refers to the outer query's row, so it runs once per outer row."],
   ["Why prefer NOT EXISTS over NOT IN?","If the NOT IN list contains a NULL, it returns no rows at all. NOT EXISTS doesn't have this problem."],
   ["How do you find the second-highest salary?","MAX(salary) WHERE salary < (SELECT MAX(salary) ...), or DENSE_RANK() and keep rank 2."]
  ],
  feynman:"Explain a subquery using a two-step question you'd ask a librarian: 'Who wrote the most popular book? Now show me all their books.'",
  connect:"Write a two-step business question from your experience where the answer to step 1 is needed for step 2." },

{ id:"s13", phase:"sql", week:4, topic:"SQL", minutes:45, title:"CTEs: building queries in steps",
  predict:{ q:"Your query has a subquery inside a subquery inside a subquery, and it's impossible to read. What would make it clearer?",
    a:"Name each step and write them one after another, top to bottom. That's what a CTE (WITH ... AS) does." },
  body:`
<p>A <b>CTE</b> (Common Table Expression) gives a name to a query so you can use it like a table in the next step.</p>
<pre>WITH customer_totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, t.total
FROM customer_totals t
JOIN customers c ON c.id = t.customer_id
WHERE t.total > 400;</pre>
<p>Read it like a recipe: "Step 1: make customer totals. Step 2: attach names and keep big totals."</p>
<h4>Several steps</h4>
<pre>WITH step1 AS ( ... ),
     step2 AS ( SELECT ... FROM step1 ... )
SELECT ... FROM step2;</pre>
<p>Separate CTEs with commas. Each can use the ones before it.</p>
<h4>How to attack a hard question</h4>
<ol><li>Write in plain words the steps you need.</li>
<li>Turn each step into a CTE, and run it on its own to check it.</li>
<li>Combine them in the final SELECT.</li></ol>
<p>This is exactly how strong candidates solve interview questions: out loud, step by step. CTEs are also how tools like <b>dbt</b> organize real pipelines (week 14).</p>`,
  ex:[
   { id:"s13e1", kind:"sql", q:"Find employees who earn more than the average salary of their own department. Show name, salary and the department average (rounded to 0 decimals).", sol:"WITH dept_avg AS (SELECT dept_id, AVG(salary) AS avg_sal FROM employees GROUP BY dept_id) SELECT e.name, e.salary, ROUND(d.avg_sal) FROM employees e JOIN dept_avg d ON d.dept_id = e.dept_id WHERE e.salary > d.avg_sal;",
     hints:["Step 1: average per department. Step 2: compare each employee to their department's average.","Make step 1 a CTE, then JOIN it to employees on dept_id.","WITH dept_avg AS (SELECT dept_id, AVG(salary) AS avg_sal FROM employees GROUP BY dept_id) SELECT ..."] },
   { id:"s13e2", kind:"sql", q:"Show the names of customers whose total order amount is above the average customer total.", sol:"WITH totals AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id) SELECT c.name FROM totals t JOIN customers c ON c.id = t.customer_id WHERE t.total > (SELECT AVG(total) FROM totals);",
     hints:["Step 1: total per customer. Step 2: average of those totals. Step 3: compare.","You can use a CTE inside a subquery: (SELECT AVG(total) FROM totals).","WITH totals AS (...) SELECT c.name FROM totals t JOIN customers c ... WHERE t.total > (SELECT AVG(total) FROM totals);"] }
  ],
  cards:[
   ["What is a CTE?","A named temporary result defined with WITH name AS (...), used like a table in the rest of the query."],
   ["How do you write two CTEs?","WITH a AS (...), b AS (... FROM a ...) SELECT ... — separated by commas."],
   ["CTE vs subquery?","Same power mostly, but CTEs are named and read top-to-bottom, so complex logic is easier to read and test."]
  ],
  feynman:"Explain a CTE using cooking: preparing ingredients in separate bowls before combining them.",
  connect:"Take a report you know that needed several steps (filter, total, compare). Write the steps as CTE names." },

{ id:"s14", phase:"sql", week:5, topic:"SQL", minutes:55, title:"Window functions 1: ranking",
  predict:{ q:"You want every employee's row AND their department's average salary next to it. GROUP BY would collapse the rows. What else could work?",
    a:"A window function: AVG(salary) OVER (PARTITION BY dept_id). It calculates across related rows but keeps every row." },
  body:`
<p>Window functions are the most important "intermediate" SQL topic for interviews. They calculate across a group of related rows <b>without collapsing them</b>.</p>
<pre>SELECT name, dept_id, salary,
  AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg
FROM employees;</pre>
<ul><li><code>OVER (...)</code> makes it a window function.</li>
<li><code>PARTITION BY dept_id</code> means "look only at rows in the same department". It's like GROUP BY, but every row stays.</li>
<li><code>OVER ()</code> with nothing inside means "all rows".</li></ul>
<h4>Ranking functions</h4>
<pre>SELECT name, dept_id, salary,
  ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn,
  RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS drnk
FROM employees;</pre>
<p>Engineering has salaries 95,000, 88,000, 88,000, 72,000 (a tie!):</p>
<table class="mini"><tr><th>salary</th><th>ROW_NUMBER</th><th>RANK</th><th>DENSE_RANK</th></tr>
<tr><td>95,000</td><td>1</td><td>1</td><td>1</td></tr><tr><td>88,000</td><td>2</td><td>2</td><td>2</td></tr>
<tr><td>88,000</td><td>3</td><td>2</td><td>2</td></tr><tr><td>72,000</td><td>4</td><td>4</td><td>3</td></tr></table>
<h4>Top N per group (the most common interview pattern)</h4>
<p>You can't put a window function in WHERE (it runs before SELECT). So compute it in a CTE, then filter:</p>
<pre>WITH ranked AS (
  SELECT name, dept_id, salary,
    DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT * FROM ranked WHERE rnk <= 2;</pre>`,
  ex:[
   { id:"s14e1", kind:"sql", q:"Show each employee's name, dept_id, salary and their department's average salary (as dept_avg), keeping every employee row. Leave out employees with no department.", sol:"SELECT name, dept_id, salary, AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees WHERE dept_id IS NOT NULL;",
     hints:["GROUP BY would collapse rows. Use OVER.","AVG(salary) OVER (PARTITION BY ...)","AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg"] },
   { id:"s14e2", kind:"sql", q:"Show the top 2 earners in each department (ties share a place), with name, dept_id, salary and their rank. Leave out employees with no department.", sol:"WITH ranked AS (SELECT name, dept_id, salary, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk FROM employees WHERE dept_id IS NOT NULL) SELECT * FROM ranked WHERE rnk <= 2;",
     hints:["Rank inside each department, highest salary first. Which function lets ties share without skipping?","You can't filter a window function in WHERE directly. Wrap it in a CTE.","WITH ranked AS (SELECT ..., DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk ...) SELECT * FROM ranked WHERE rnk <= 2;"] },
   { id:"s14e3", kind:"sql", q:"Show each customer's single most recent order: customer_id, order id and order_date.", sol:"WITH r AS (SELECT customer_id, id, order_date, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn FROM orders) SELECT customer_id, id, order_date FROM r WHERE rn = 1;",
     hints:["'Most recent per customer' is top 1 per group.","ROW_NUMBER, partitioned by customer, newest date first.","... ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn ... WHERE rn = 1"] }
  ],
  cards:[
   ["What does a window function do differently from GROUP BY?","It calculates across related rows but keeps every row (no collapsing)."],
   ["ROW_NUMBER vs RANK vs DENSE_RANK on ties 100, 100, 90?","ROW_NUMBER 1,2,3 · RANK 1,1,3 · DENSE_RANK 1,1,2."],
   ["What does PARTITION BY do?","Splits rows into groups; the window function restarts in each group."],
   ["How do you get the top N per group?","Rank with ROW_NUMBER/DENSE_RANK OVER (PARTITION BY g ORDER BY x DESC) in a CTE, then WHERE rank <= N."]
  ],
  feynman:"Explain the difference between GROUP BY and PARTITION BY without using either word.",
  connect:"Where would 'top 3 per group' be useful in a business you know? (Top products per store, best salespeople per region…)" },

{ id:"s15", phase:"sql", week:5, topic:"SQL", minutes:50, title:"Window functions 2: running totals, LAG and LEAD",
  predict:{ q:"How could a query show, for each of a customer's orders, how much they have spent so far in total?",
    a:"A running total: SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date). Adding ORDER BY inside OVER makes the sum add up row by row." },
  body:`
<h4>Running totals</h4>
<pre>SELECT customer_id, order_date, amount,
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total
FROM orders;</pre>
<p>When OVER has an ORDER BY, the sum covers "all rows up to this one". That's a running (cumulative) total.</p>
<h4>LAG and LEAD: look at the previous or next row</h4>
<pre>SELECT customer_id, order_date, amount,
  LAG(amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount,
  LEAD(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_amount
FROM orders;</pre>
<p>The first order of each customer has no previous one, so <code>prev_amount</code> is NULL. Typical uses: change since last month, days between visits, spotting drops.</p>
<h4>Date differences</h4>
<p>Dates differ between databases. In PostgreSQL you subtract dates directly: <code>order_date - LAG(order_date) OVER (...)</code> gives days. In SQLite (this page) convert first: <code>julianday(order_date) - julianday(LAG(order_date) OVER (...))</code>.</p>
<h4>Moving averages (good to know)</h4>
<pre>AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)</pre>
<p>The average of this row and the two before it.</p>`,
  ex:[
   { id:"s15e1", kind:"sql", q:"For each order, show customer_id, order_date, amount and the customer's running total of amount (ordered by date).", sol:"SELECT customer_id, order_date, amount, SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total FROM orders;",
     hints:["SUM as a window function, restarting for each customer.","Adding ORDER BY inside OVER makes it cumulative.","SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)"] },
   { id:"s15e2", kind:"sql", q:"For each order, show customer_id, order_date and the number of days since that customer's previous order (use julianday in this page).", sol:"SELECT customer_id, order_date, julianday(order_date) - julianday(LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)) AS days_since_prev FROM orders;",
     hints:["You need the previous order's date for the same customer.","LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date).","julianday(order_date) - julianday(LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date))"] }
  ],
  cards:[
   ["How do you write a running total in SQL?","SUM(x) OVER (PARTITION BY group ORDER BY date)."],
   ["What do LAG and LEAD do?","Return a value from the previous (LAG) or next (LEAD) row in the window's order."],
   ["Why is LAG NULL on the first row of each partition?","There's no previous row in that group."],
   ["How do you find days between two dates in PostgreSQL?","Subtract them: date2 - date1 (gives a number of days)."]
  ],
  feynman:"Explain LAG using a bank statement: each line shows today's balance and you want yesterday's next to it.",
  connect:"Name a 'compared to last time' number that matters in a business you know (month-over-month sales, weight change, delivery time)." },

{ id:"s16", phase:"sql", week:5, topic:"SQL", minutes:35, title:"Working with dates and text",
  predict:{ q:"Dates in this database look like '2025-03-20'. How would you get just the month, to count orders per month?",
    a:"Use a date function to cut out the year and month, like strftime('%Y-%m', order_date) in SQLite or DATE_TRUNC('month', order_date) in PostgreSQL, then GROUP BY it." },
  body:`
<p>Every database has date and text functions. The ideas are the same everywhere; the names differ a little. Learn the PostgreSQL names for interviews, and look up the rest when you need them.</p>
<table class="mini"><tr><th>Task</th><th>PostgreSQL</th><th>SQLite (this page)</th></tr>
<tr><td>Month of a date</td><td><code>DATE_TRUNC('month', d)</code> or <code>EXTRACT(MONTH FROM d)</code></td><td><code>strftime('%Y-%m', d)</code></td></tr>
<tr><td>Year</td><td><code>EXTRACT(YEAR FROM d)</code></td><td><code>strftime('%Y', d)</code></td></tr>
<tr><td>Today</td><td><code>CURRENT_DATE</code></td><td><code>date('now')</code></td></tr>
<tr><td>Add 7 days</td><td><code>d + INTERVAL '7 days'</code></td><td><code>date(d, '+7 days')</code></td></tr>
<tr><td>Days between</td><td><code>d2 - d1</code></td><td><code>julianday(d2) - julianday(d1)</code></td></tr></table>
<h4>Text functions (same in most databases)</h4>
<pre>UPPER(name), LOWER(name)        -- change case
LENGTH(name)                    -- number of characters
TRIM(name)                      -- remove spaces at both ends
SUBSTR(name, 1, 3)              -- first 3 characters (SUBSTRING in PostgreSQL)
REPLACE(name, 'a', 'b')         -- swap text
first || ' ' || last            -- glue text together (CONCAT() also works)</pre>
<p>Cleaning text (extra spaces, mixed upper/lower case) is a daily data engineering job. You'll do the same in Python later.</p>`,
  ex:[
   { id:"s16e1", kind:"sql", q:"Count the orders in each month. Show the month as text like '2025-03' and the count.", sol:"SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) FROM orders GROUP BY month;",
     hints:["Turn each date into its year-month, then group.","strftime('%Y-%m', order_date) in this page.","SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) FROM orders GROUP BY month;"] },
   { id:"s16e2", kind:"sql", q:"Show one column called label for each customer: their name in capital letters, a space, and their city in parentheses, or '(unknown)' if the city is missing. Example: AMARA OKAFOR (Lagos)", sol:"SELECT UPPER(name) || ' (' || COALESCE(city, 'unknown') || ')' AS label FROM customers;",
     hints:["Glue pieces of text together with ||.","UPPER for the name; COALESCE for the missing city.","UPPER(name) || ' (' || COALESCE(city, 'unknown') || ')'"] }
  ],
  cards:[
   ["How do you get the month from a date in PostgreSQL?","DATE_TRUNC('month', d) for the first day of the month, or EXTRACT(MONTH FROM d) for the number."],
   ["How do you glue text together in SQL?","With || (or CONCAT()): first || ' ' || last."],
   ["Which function removes spaces at the start and end of text?","TRIM()."]
  ],
  feynman:"Explain why grouping by the full date doesn't give monthly totals, and what you need to do instead.",
  connect:"Think of messy text you've seen in real data (names typed differently, extra spaces). Which functions would clean it?" },

{ id:"s17", phase:"sql", week:5, topic:"SQL", minutes:50, title:"Creating and changing data",
  predict:{ q:"So far you've only read data. What do you think the commands are to add new rows, change rows, and remove rows?",
    a:"INSERT adds rows, UPDATE changes them, DELETE removes them. CREATE TABLE makes a new table. Pipelines use these to load data." },
  body:`
<p>Data engineers don't only read data; pipelines <b>write</b> it. These commands are how data gets loaded.</p>
<h4>Create a table</h4>
<pre>CREATE TABLE suppliers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  country TEXT
);</pre>
<p>Each column has a type. <b>Constraints</b> protect the data: <code>PRIMARY KEY</code> (unique id), <code>NOT NULL</code> (must have a value), <code>UNIQUE</code>, <code>REFERENCES other(id)</code> (a foreign key that must exist).</p>
<h4>Add, change, remove rows</h4>
<pre>INSERT INTO suppliers (id, name, country) VALUES (1, 'Kivu Tech', 'DR Congo');
UPDATE products SET price = price * 1.10 WHERE category = 'Peripherals';
DELETE FROM orders WHERE status = 'cancelled';</pre>
<p><b>Danger:</b> UPDATE or DELETE without WHERE changes <i>every</i> row. Always write the WHERE first, and run it as a SELECT to see which rows you'll hit.</p>
<h4>Upsert: insert, or update if it already exists</h4>
<pre>INSERT INTO products (id, name, category, price) VALUES (2, 'USB-C hub', 'Accessories', 35)
ON CONFLICT (id) DO UPDATE SET price = excluded.price;</pre>
<p>This is how pipelines load data safely more than once: running it twice doesn't create duplicates. (Same syntax in PostgreSQL. SQL Server uses MERGE.)</p>
<h4>Transactions: all or nothing</h4>
<pre>BEGIN;
DELETE FROM daily_sales WHERE day = '2025-06-01';
INSERT INTO daily_sales ...;
COMMIT;   -- or ROLLBACK; to undo everything since BEGIN</pre>
<p>If the pipeline crashes between BEGIN and COMMIT, nothing is saved half-way. In this page the database resets on every Run, so experiment freely.</p>`,
  ex:[
   { id:"s17e1", kind:"sql", q:"Create a table suppliers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT). Insert (1, 'Kivu Tech', 'DR Congo') and (2, 'Lake Supply', 'Kenya'). Finally select everything from it.", sol:"CREATE TABLE suppliers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);\nINSERT INTO suppliers VALUES (1, 'Kivu Tech', 'DR Congo'), (2, 'Lake Supply', 'Kenya');\nSELECT * FROM suppliers;",
     hints:["Three statements, each ending with ;","CREATE TABLE ..., then INSERT INTO suppliers VALUES (...), (...);","End with SELECT * FROM suppliers; — the checker looks at the last result."] },
   { id:"s17e2", kind:"sql", q:"Raise the price of every product in the 'Peripherals' category by 10%. Then show the name and price of the Peripherals products.", sol:"UPDATE products SET price = price * 1.10 WHERE category = 'Peripherals';\nSELECT name, price FROM products WHERE category = 'Peripherals';",
     hints:["UPDATE ... SET ... WHERE ...","price = price * 1.10, and don't forget the WHERE.","Then SELECT name, price FROM products WHERE category = 'Peripherals';"] },
   { id:"s17e3", kind:"sql", q:"Write an upsert: insert product (2, 'USB-C hub', 'Accessories', 35), and if id 2 already exists, update its price instead. Then show product 2.", sol:"INSERT INTO products (id, name, category, price) VALUES (2, 'USB-C hub', 'Accessories', 35) ON CONFLICT (id) DO UPDATE SET price = excluded.price;\nSELECT * FROM products WHERE id = 2;",
     hints:["A plain INSERT fails because id 2 exists. Which clause handles the conflict?","ON CONFLICT (id) DO UPDATE SET ...","excluded.price means 'the price I tried to insert'."] }
  ],
  cards:[
   ["What do INSERT, UPDATE and DELETE do?","INSERT adds rows; UPDATE changes existing rows; DELETE removes rows."],
   ["What happens if you run UPDATE or DELETE without WHERE?","It changes or deletes every row in the table."],
   ["What is an upsert?","Insert a row, or update it if it already exists (INSERT ... ON CONFLICT DO UPDATE; MERGE in SQL Server)."],
   ["What does a transaction (BEGIN ... COMMIT) guarantee?","All statements succeed together or none do (ROLLBACK). No half-finished changes."],
   ["Name three column constraints.","PRIMARY KEY, NOT NULL, UNIQUE (also FOREIGN KEY / REFERENCES, CHECK)."]
  ],
  feynman:"Explain why a pipeline should use a transaction when it deletes and re-inserts a day of data.",
  connect:"Think of a time something was saved twice or half-saved (a double payment, a duplicate message). How would an upsert or transaction have prevented it?" },

{ id:"s18", phase:"sql", week:5, topic:"SQL", minutes:60, title:"Interview SQL patterns",
  predict:{ q:"Interviewers love: 'Find users who logged in on 3 or more days in a row.' Which tool from earlier lessons might help?",
    a:"Window functions. A neat trick: subtract ROW_NUMBER from the date. Consecutive days all get the same result, so you can GROUP BY it and count." },
  body:`
<p>Most SQL interview questions are a handful of patterns in disguise. You know all the pieces now.</p>
<table class="mini"><tr><th>Pattern</th><th>Tool</th></tr>
<tr><td>Top N per group</td><td>ROW_NUMBER / DENSE_RANK in a CTE, filter rank ≤ N</td></tr>
<tr><td>Find duplicates</td><td>GROUP BY all columns HAVING COUNT(*) > 1</td></tr>
<tr><td>Remove duplicates, keep one</td><td>ROW_NUMBER() OVER (PARTITION BY key ORDER BY ...) = 1</td></tr>
<tr><td>Rows with no match</td><td>LEFT JOIN ... WHERE right.id IS NULL, or NOT EXISTS</td></tr>
<tr><td>Nth highest</td><td>DENSE_RANK = N</td></tr>
<tr><td>Change vs previous period</td><td>LAG</td></tr>
<tr><td>Running total</td><td>SUM() OVER (ORDER BY ...)</td></tr>
<tr><td>Percent of total</td><td>x * 100.0 / SUM(x) OVER ()</td></tr>
<tr><td>Consecutive days (streaks)</td><td>date minus ROW_NUMBER, then GROUP BY</td></tr>
<tr><td>Pivot rows to columns</td><td>SUM(CASE WHEN ...)</td></tr></table>
<h4>The streak trick</h4>
<pre>user 1 dates:  06-01  06-02  06-03  06-05
row_number:      1      2      3      4
date - rn:     05-31  05-31  05-31  06-01   ← same value = same streak</pre>
<h4>How to answer in an interview</h4>
<ol><li><b>Clarify:</b> "Can there be ties? Duplicates? NULLs?"</li>
<li><b>State the grain:</b> "My result has one row per user."</li>
<li><b>Build in CTE steps</b> and say what each does, out loud.</li>
<li><b>Check edge cases:</b> empty groups, ties, NULLs, duplicates.</li></ol>
<p>Practice on <a href="https://datalemur.com/questions" target="_blank" rel="noopener">DataLemur</a> and <a href="https://leetcode.com/studyplan/top-sql-50/" target="_blank" rel="noopener">LeetCode SQL 50</a> from now on: two or three problems a week.</p>`,
  ex:[
   { id:"s18e1", kind:"sql", q:"The logins table has a duplicated row. Find any (user_id, login_date) pair that appears more than once, and how many times.", sol:"SELECT user_id, login_date, COUNT(*) FROM logins GROUP BY user_id, login_date HAVING COUNT(*) > 1;",
     hints:["Group by every column that should be unique together.","Then keep groups with more than one row.","GROUP BY user_id, login_date HAVING COUNT(*) > 1"] },
   { id:"s18e2", kind:"sql", q:"Show each product's name and its share of total revenue as a percent, rounded to 1 decimal (revenue = quantity × price).", sol:"WITH r AS (SELECT p.name, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.name) SELECT name, ROUND(revenue * 100.0 / SUM(revenue) OVER (), 1) AS pct FROM r;",
     hints:["Step 1: revenue per product (you did this in lesson 10). Step 2: divide by the grand total.","The grand total next to every row: SUM(revenue) OVER ().","ROUND(revenue * 100.0 / SUM(revenue) OVER (), 1)"] },
   { id:"s18e3", kind:"sql", q:"Find the user_ids of users who logged in on at least 3 consecutive days. (Watch out for the duplicate row.)", sol:"WITH d AS (SELECT DISTINCT user_id, login_date FROM logins), g AS (SELECT user_id, julianday(login_date) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp FROM d) SELECT DISTINCT user_id FROM g GROUP BY user_id, grp HAVING COUNT(*) >= 3;",
     hints:["First remove duplicates, or the streak math breaks.","Number each user's days with ROW_NUMBER; subtract it from the date (julianday). Same result = same streak.","GROUP BY user_id, grp HAVING COUNT(*) >= 3"] }
  ],
  cards:[
   ["How do you find duplicate rows?","GROUP BY the columns that should be unique, HAVING COUNT(*) > 1."],
   ["How do you remove duplicates but keep one row per key?","ROW_NUMBER() OVER (PARTITION BY key ORDER BY ...) in a CTE, keep rn = 1."],
   ["How do you compute percent of total per row?","x * 100.0 / SUM(x) OVER ()."],
   ["What is the trick for consecutive-day streaks?","date minus ROW_NUMBER() per user: consecutive days share the same value. GROUP BY it and count."],
   ["Four steps to answer a SQL interview question?","Clarify (ties, NULLs, duplicates) → state the grain → build in CTE steps out loud → check edge cases."]
  ],
  feynman:"Explain the 'date minus row number' streak trick to a friend using a calendar.",
  connect:"Which of these patterns would have helped in a past job or project (duplicates in a spreadsheet, top sellers, streaks)?" },

/* ======================= PHASE: PYTHON ======================= */
{ id:"p1", phase:"python", week:6, topic:"Python", minutes:40, title:"Python first steps",
  predict:{ q:"What do you think  print(2 + 3 * 4)  shows?",
    a:"14. Python follows normal math order: multiplication before addition. print() shows the result on the screen." },
  body:`
<p>SQL asks questions of data in a database. <b>Python</b> is a general programming language: data engineers use it to fetch data from websites and files, clean it, and glue the steps of a pipeline together. It's the most popular language in data.</p>
<p>Python runs right in this page. The first time you click Run it downloads (about 10 MB, then it's cached).</p>
<h4>print and variables</h4>
<pre>print("Hello")
city = "Lagos"          # a variable: a name for a value
orders = 3
price = 45.5
print(city, orders, price)</pre>
<p><code>#</code> starts a comment. A <b>variable</b> is a label you stick on a value so you can use it later. Use lowercase names with underscores: <code>total_amount</code>.</p>
<h4>Types</h4>
<ul><li><code>str</code> text: <code>"Lagos"</code> (single or double quotes)</li>
<li><code>int</code> whole number: <code>3</code></li>
<li><code>float</code> decimal: <code>45.5</code></li>
<li><code>bool</code> True or False</li>
<li><code>None</code> no value (like NULL in SQL)</li></ul>
<p><code>type(x)</code> tells you the type. <code>int("3")</code>, <code>float("4.5")</code> and <code>str(3)</code> convert between them. Text from files always starts as <code>str</code>, so you'll convert a lot.</p>
<h4>Math and f-strings</h4>
<pre>total = 45 * 4
print(total / 3)        # 60.0  (division always gives a float)
print(total // 7)       # 25    (whole-number division)
print(round(10 / 3, 2)) # 3.33
name = "Ada"
print(f"{name} has {orders} orders")   # f-string: values go inside {}</pre>
<p>Python cares about exact spelling and capitals: <code>Print</code> is an error, <code>print</code> works. Error messages are normal; read the last line, it usually tells you what's wrong.</p>`,
  ex:[
   { id:"p1e1", kind:"py", q:"Create a variable name with the value 'Ada' and a variable orders with the value 3. Use an f-string to print exactly:  Ada has 3 orders", starter:"name = \n", sol:"name = 'Ada'\norders = 3\nprint(f'{name} has {orders} orders')",
     hints:["Text goes in quotes; numbers don't.","An f-string starts with f before the quote and puts variables in {}.","print(f'{name} has {orders} orders')"] },
   { id:"p1e2", kind:"py", q:"A product costs 45 and a customer buys 4. Print the total with 16% tax added, rounded to 2 decimals.", starter:"price = 45\nqty = 4\n", sol:"price = 45\nqty = 4\nprint(round(price * qty * 1.16, 2))",
     hints:["Multiply price, quantity and 1.16.","round(value, 2) rounds to 2 decimals.","print(round(price * qty * 1.16, 2))"] },
   { id:"p1e3", kind:"py", q:"The value amount_text = '120.50' came from a file, so it's text. Convert it to a number, add 10 to it, and print the result.", starter:"amount_text = '120.50'\n", sol:"amount_text = '120.50'\nprint(float(amount_text) + 10)",
     hints:["'120.50' + 10 is an error: you can't add text and a number.","Which function turns text into a decimal number?","print(float(amount_text) + 10)"] }
  ],
  cards:[
   ["What is a variable in Python?","A name that refers to a value, e.g. city = 'Lagos'."],
   ["Name Python's basic types.","str (text), int (whole number), float (decimal), bool (True/False), None (no value)."],
   ["What is an f-string?","A string starting with f where values in {} are filled in: f'{name} has {n} orders'."],
   ["How do you turn the text '4.5' into a number?","float('4.5') (int('4') for whole numbers)."],
   ["What is Python's equivalent of SQL NULL?","None."]
  ],
  feynman:"Explain what a variable is, using labels on storage boxes.",
  connect:"Think of a repetitive task you've done on a computer (copying numbers between files, renaming things). Why might code be better for it?" },

{ id:"p2", phase:"python", week:6, topic:"Python", minutes:45, title:"Lists and loops",
  predict:{ q:"You have the prices [45, 30, 120]. How could you add 10% to each one without writing a separate line for each?",
    a:"Use a loop: for p in prices: print(p * 1.10). A loop repeats the same steps for each item in a list." },
  body:`
<h4>Lists</h4>
<pre>prices = [45, 30, 120, 40]
print(prices[0])      # 45   (counting starts at 0!)
print(prices[-1])     # 40   (last item)
print(len(prices))    # 4
prices.append(300)    # add to the end
print(sum(prices), min(prices), max(prices))</pre>
<h4>for loops</h4>
<pre>for p in prices:
    print(p * 1.10)</pre>
<p>The indented lines (4 spaces) run once for each item. <b>Indentation matters in Python</b>: it's how Python knows which lines are inside the loop.</p>
<h4>Building a result in a loop</h4>
<pre>total = 0
for p in prices:
    if p > 50:
        total = total + p     # or: total += p
print(total)</pre>
<h4>List comprehensions: a loop in one line</h4>
<pre>with_tax = [p * 1.16 for p in prices]
big = [p for p in prices if p > 50]</pre>
<p><code>range(5)</code> gives 0, 1, 2, 3, 4, handy for "do this 5 times".</p>`,
  ex:[
   { id:"p2e1", kind:"py", q:"Given the list of order amounts, print the total of all amounts, then (on a new line) how many amounts are over 100.", starter:"amounts = [120, 80, 450, 300, 60, 115, 500, 30]\n", sol:"amounts = [120, 80, 450, 300, 60, 115, 500, 30]\nprint(sum(amounts))\nprint(len([a for a in amounts if a > 100]))",
     hints:["sum() adds up a list. For the count, keep only the big ones.","A list comprehension with if can filter: [a for a in amounts if a > 100].","print(sum(amounts)) then print(len([...]))"] },
   { id:"p2e2", kind:"py", q:"Print each product name in capital letters, one per line. (Text has a method .upper().)", starter:"products = ['laptop stand', 'usb-c hub', 'webcam']\n", sol:"products = ['laptop stand', 'usb-c hub', 'webcam']\nfor p in products:\n    print(p.upper())",
     hints:["Loop over the list.","Inside the loop, call .upper() on each name.","for p in products:\n    print(p.upper())"] }
  ],
  cards:[
   ["What index is the first item in a Python list?","0. (The last is -1.)"],
   ["How does Python know which lines are inside a loop?","Indentation (usually 4 spaces)."],
   ["What is a list comprehension?","A one-line loop that builds a list: [x * 2 for x in nums if x > 0]."],
   ["How do you add an item to a list?","my_list.append(item)."]
  ],
  feynman:"Explain a for loop using a teacher marking a pile of exams one by one.",
  connect:"What job in your past was 'do the same thing to every item in a list'? How would a loop describe it?" },

{ id:"p3", phase:"python", week:6, topic:"Python", minutes:45, title:"Dictionaries: data with labels",
  predict:{ q:"A list stores items by position (0, 1, 2…). What if you want to look things up by a name, like a customer's city by their name?",
    a:"Use a dictionary: cities = {'Amara': 'Lagos', 'Ben': 'Chicago'}; cities['Ben'] gives 'Chicago'. Dictionaries store key → value pairs." },
  body:`
<pre>customer = {"id": 2, "name": "Ben Carter", "city": "Chicago"}
print(customer["name"])          # Ben Carter
customer["city"] = "Boston"      # change a value
customer["vip"] = True           # add a new key
print(customer.get("phone", "none"))   # safe lookup with a default</pre>
<p>A <b>dictionary</b> (dict) maps <b>keys</b> to <b>values</b>. Asking for a key that doesn't exist with <code>d["phone"]</code> is an error; <code>.get()</code> returns a default instead.</p>
<h4>A list of dicts is a table</h4>
<pre>orders = [
    {"id": 101, "customer": "Amara", "amount": 120},
    {"id": 103, "customer": "Ben",   "amount": 450},
    {"id": 102, "customer": "Amara", "amount": 80},
]</pre>
<p>Each dict is a row; the keys are the columns. This is exactly what JSON looks like, and it's how data arrives from most APIs.</p>
<h4>Looping and grouping by hand</h4>
<pre>totals = {}
for o in orders:
    c = o["customer"]
    totals[c] = totals.get(c, 0) + o["amount"]
print(totals)        # {'Amara': 200, 'Ben': 450}

for name, total in totals.items():
    print(name, total)</pre>
<p>That loop is a GROUP BY written by hand. pandas will do it in one line later, but knowing how it works underneath helps you in interviews.</p>`,
  ex:[
   { id:"p3e1", kind:"py", q:"Using the orders list, build a dictionary of total amount per customer, then print each customer and total on its own line, sorted by customer name, like:  Amara 200", starter:"orders = [\n    {'id': 101, 'customer': 'Amara', 'amount': 120},\n    {'id': 103, 'customer': 'Ben', 'amount': 450},\n    {'id': 102, 'customer': 'Amara', 'amount': 80},\n    {'id': 105, 'customer': 'Chen', 'amount': 60},\n    {'id': 104, 'customer': 'Ben', 'amount': 300},\n]\n", sol:"orders = [\n    {'id': 101, 'customer': 'Amara', 'amount': 120},\n    {'id': 103, 'customer': 'Ben', 'amount': 450},\n    {'id': 102, 'customer': 'Amara', 'amount': 80},\n    {'id': 105, 'customer': 'Chen', 'amount': 60},\n    {'id': 104, 'customer': 'Ben', 'amount': 300},\n]\ntotals = {}\nfor o in orders:\n    totals[o['customer']] = totals.get(o['customer'], 0) + o['amount']\nfor name in sorted(totals):\n    print(name, totals[name])",
     hints:["Start with an empty dict and add each order's amount to its customer's running total.","totals.get(name, 0) gives 0 the first time you see a customer.","Loop over sorted(totals) and print(name, totals[name])."] }
  ],
  cards:[
   ["What is a Python dictionary?","A collection of key → value pairs, e.g. {'city': 'Lagos'}; look up with d['city']."],
   ["d['x'] vs d.get('x', 0)?","d['x'] errors if the key is missing; d.get('x', 0) returns the default 0."],
   ["How is a list of dicts like a table?","Each dict is a row and its keys are the columns (it's also the shape of JSON)."],
   ["How do you loop over keys and values of a dict?","for key, value in d.items():"]
  ],
  feynman:"Explain the difference between a list and a dictionary using a numbered parking lot vs a phone contact list.",
  connect:"What information in your life is naturally key → value? (Contacts, prices, passwords…) Write it as a dict." },

{ id:"p4", phase:"python", week:6, topic:"Python", minutes:45, title:"Decisions and functions",
  predict:{ q:"You need the same 'clean up a city name' logic in ten places in your code. What's better than copying it ten times?",
    a:"Write it once as a function (def clean_city(text): ...) and call it wherever you need it. If the rule changes, you fix one place." },
  body:`
<h4>if / elif / else</h4>
<pre>amount = 250
if amount is None:
    size = "unknown"
elif amount < 100:
    size = "small"
elif amount < 300:
    size = "medium"
else:
    size = "large"</pre>
<p>Same idea as SQL's CASE WHEN. Comparisons: <code>== != &lt; &gt; &lt;= &gt;=</code>. Combine with <code>and</code>, <code>or</code>, <code>not</code>. Use <code>is None</code> to check for None.</p>
<h4>Functions</h4>
<pre>def size_label(amount):
    if amount is None:
        return "unknown"
    if amount < 100:
        return "small"
    return "large"

print(size_label(40))     # small</pre>
<ul><li><code>def</code> defines a function; the values in parentheses are its <b>parameters</b>.</li>
<li><code>return</code> sends the answer back and ends the function.</li>
<li>Functions make code reusable, readable, and <b>testable</b>: you can check <code>size_label(40) == "small"</code> automatically (you'll do that in week 14).</li></ul>
<h4>Text methods you'll use constantly</h4>
<pre>"  kinshasa ".strip()     # "kinshasa"
"kinshasa".title()        # "Kinshasa"
"A,B,C".split(",")        # ["A", "B", "C"]
"$120".replace("$", "")   # "120"</pre>`,
  ex:[
   { id:"p4e1", kind:"py", q:"Write a function size_label(amount) that returns 'unknown' for None, 'small' under 100, 'medium' under 300, else 'large'. Then print the label for each amount in the list, one per line.", starter:"def size_label(amount):\n    # your code here\n    pass\n\nfor a in [40, None, 150, 300]:\n    print(size_label(a))\n", sol:"def size_label(amount):\n    if amount is None:\n        return 'unknown'\n    if amount < 100:\n        return 'small'\n    if amount < 300:\n        return 'medium'\n    return 'large'\n\nfor a in [40, None, 150, 300]:\n    print(size_label(a))",
     hints:["Check None first — comparing None < 100 is an error in Python.","Each check can return right away.","if amount is None: return 'unknown' ... return 'large'"] },
   { id:"p4e2", kind:"py", q:"Write clean_city(text): remove spaces at both ends and make it Title Case; if text is None or empty after stripping, return 'Unknown'. Print the cleaned version of each city in the list, one per line.", starter:"def clean_city(text):\n    pass\n\nfor c in ['  kinshasa ', 'GOMA', None, '   ', 'lubumbashi']:\n    print(clean_city(c))\n", sol:"def clean_city(text):\n    if text is None or text.strip() == '':\n        return 'Unknown'\n    return text.strip().title()\n\nfor c in ['  kinshasa ', 'GOMA', None, '   ', 'lubumbashi']:\n    print(clean_city(c))",
     hints:["Handle the bad cases first: None, or only spaces.","text.strip() removes spaces; .title() fixes the capitals.","return text.strip().title()"] }
  ],
  cards:[
   ["Python's equivalent of SQL CASE WHEN?","if / elif / else."],
   ["What does return do?","Sends a value back from a function and ends it."],
   ["Why write functions in a pipeline?","Reuse, readability, and testing: one place to fix, and you can check them automatically."],
   ["How do you check for None in Python?","x is None (not x == None)."]
  ],
  feynman:"Explain a function using a coffee machine: inputs, what happens inside, and the output.",
  connect:"Write the name of three functions a data pipeline for a business you know would need (e.g. clean_phone_number)." },

{ id:"p5", phase:"python", week:7, topic:"Python", minutes:50, title:"Reading CSV and JSON, and handling errors",
  predict:{ q:"You're adding up amounts from a file with 10,000 rows, and row 5,000 says 'N/A' instead of a number. What happens if your code does float('N/A')?",
    a:"Python raises an error (ValueError) and the whole program stops. You can catch it with try/except, skip or log that row, and keep going." },
  body:`
<p>Data arrives as files and API responses. Python has built-in tools for both.</p>
<h4>CSV with the csv module</h4>
<pre>import csv
with open("orders.csv") as f:          # opens and auto-closes the file
    for row in csv.DictReader(f):      # each row is a dict
        print(row["customer"], row["amount"])</pre>
<p>Every value from a CSV is <b>text</b>. <code>row["amount"]</code> is <code>"120"</code>, not <code>120</code>. Convert it.</p>
<p>In this page there are no files, so the exercises pretend: <code>io.StringIO(text)</code> makes a piece of text behave like an open file.</p>
<h4>JSON</h4>
<pre>import json
data = json.loads('{"id": 1, "items": ["hub", "mouse"]}')   # text → Python dict
print(data["items"][0])                                      # hub
text = json.dumps(data)                                      # Python → text</pre>
<h4>try / except: don't let one bad row kill the pipeline</h4>
<pre>total, bad = 0, 0
for row in rows:
    try:
        total += float(row["amount"])
    except ValueError:
        bad += 1           # count it, log it, keep going
print(total, bad)</pre>
<p>Good pipelines don't silently ignore bad data: they count it, log it, and fail loudly if there's too much of it.</p>`,
  ex:[
   { id:"p5e1", kind:"py", q:"Read the CSV text with csv.DictReader. Add up the amounts that are valid numbers, and count the rows that aren't. Print the total, then the number of bad rows.", starter:"import csv, io\n\ntext = '''order_id,amount\n1,120\n2,80.5\n3,N/A\n4,450\n5,\n6,60'''\n\n", sol:"import csv, io\n\ntext = '''order_id,amount\n1,120\n2,80.5\n3,N/A\n4,450\n5,\n6,60'''\n\ntotal, bad = 0, 0\nfor row in csv.DictReader(io.StringIO(text)):\n    try:\n        total += float(row['amount'])\n    except ValueError:\n        bad += 1\nprint(total)\nprint(bad)",
     hints:["csv.DictReader(io.StringIO(text)) gives you one dict per row.","float('N/A') and float('') both raise ValueError.","Wrap total += float(row['amount']) in try/except ValueError."] },
   { id:"p5e2", kind:"py", q:"Parse the JSON text and print how many orders have status 'delivered'.", starter:"import json\n\ntext = '[{\"id\": 1, \"status\": \"delivered\"}, {\"id\": 2, \"status\": \"shipped\"}, {\"id\": 3, \"status\": \"delivered\"}]'\n\n", sol:"import json\n\ntext = '[{\"id\": 1, \"status\": \"delivered\"}, {\"id\": 2, \"status\": \"shipped\"}, {\"id\": 3, \"status\": \"delivered\"}]'\n\norders = json.loads(text)\nprint(len([o for o in orders if o['status'] == 'delivered']))",
     hints:["json.loads turns the text into a list of dicts.","Filter the list with a comprehension.","print(len([o for o in orders if o['status'] == 'delivered']))"] }
  ],
  cards:[
   ["What type is every value read from a CSV?","Text (str). Convert numbers and dates yourself."],
   ["json.loads vs json.dumps?","loads: JSON text → Python object. dumps: Python object → JSON text."],
   ["What does try/except do?","Runs code and, if a specific error happens, runs the except block instead of crashing."],
   ["Why use 'with open(...) as f'?","It closes the file automatically, even if an error happens."]
  ],
  feynman:"Explain why a pipeline should count and report bad rows instead of silently skipping them.",
  connect:"Think of a file you've received that had mistakes in it. What would your code need to handle?" },

{ id:"p6", phase:"python", week:7, topic:"pandas", minutes:55, title:"pandas: tables in Python",
  predict:{ q:"You just wrote a whole loop to total amounts per customer. What would be nice to have instead?",
    a:"A table tool that does GROUP BY in one line. That's pandas: df.groupby('customer')['amount'].sum()." },
  body:`
<p><b>pandas</b> brings tables to Python. Its table is called a <b>DataFrame</b>. If you know SQL, you already know most of what it does; only the spelling is different.</p>
<pre>import pandas as pd
df = pd.read_csv("orders.csv")    # in this page: pd.read_csv(StringIO(csv_text))
df.head()        # first 5 rows
df.shape         # (rows, columns)
df.info()        # column types and missing values
df.describe()    # min, max, mean of number columns</pre>
<p>Run <code>head</code>, <code>info</code> and <code>describe</code> first on every new dataset. Always look before you change anything.</p>
<h4>SQL → pandas</h4>
<table class="mini"><tr><th>SQL</th><th>pandas</th></tr>
<tr><td><code>SELECT customer, amount</code></td><td><code>df[["customer", "amount"]]</code></td></tr>
<tr><td><code>WHERE amount &gt; 100</code></td><td><code>df[df["amount"] &gt; 100]</code></td></tr>
<tr><td><code>WHERE a AND b</code></td><td><code>df[(cond_a) &amp; (cond_b)]</code> — use &amp; and |, with parentheses</td></tr>
<tr><td><code>ORDER BY amount DESC</code></td><td><code>df.sort_values("amount", ascending=False)</code></td></tr>
<tr><td><code>LIMIT 3</code></td><td><code>df.head(3)</code></td></tr>
<tr><td>new column <code>amount * 1.16 AS t</code></td><td><code>df["t"] = df["amount"] * 1.16</code></td></tr>
<tr><td><code>COUNT(*)</code>, <code>SUM</code>, <code>AVG</code></td><td><code>len(df)</code>, <code>df["amount"].sum()</code>, <code>.mean()</code></td></tr></table>
<p>One column (<code>df["amount"]</code>) is called a <b>Series</b>. Two square brackets (<code>df[["a", "b"]]</code>) give you a smaller DataFrame.</p>`,
  ex:[
   { id:"p6e1", kind:"py", q:"The orders CSV is already loaded into df. Print the number of rows, then (on the next line) the average amount rounded to 2 decimals.", starter:PY_ORDERS + "\n", sol:PY_ORDERS + "\nprint(len(df))\nprint(round(df['amount'].mean(), 2))",
     hints:["len(df) counts rows.","df['amount'].mean() gives the average.","print(round(df['amount'].mean(), 2))"] },
   { id:"p6e2", kind:"py", q:"Print the customer and amount columns of delivered orders over 100, sorted by amount from largest to smallest. Print it with  print(result.to_string(index=False)).", starter:PY_ORDERS + "\n", sol:PY_ORDERS + "\nresult = df[(df['status'] == 'delivered') & (df['amount'] > 100)].sort_values('amount', ascending=False)[['customer', 'amount']]\nprint(result.to_string(index=False))",
     hints:["Filter with two conditions joined by &, each in parentheses.","Then sort_values('amount', ascending=False) and pick two columns with [['customer', 'amount']].","df[(df['status'] == 'delivered') & (df['amount'] > 100)].sort_values(...)[['customer', 'amount']]"] }
  ],
  cards:[
   ["What is a pandas DataFrame?","A table (rows and named columns) in Python."],
   ["First three things to run on a new DataFrame?","df.head(), df.info(), df.describe()."],
   ["pandas for WHERE amount > 100?","df[df['amount'] > 100]."],
   ["How do you combine two conditions in pandas?","(cond1) & (cond2) for AND, | for OR — each condition in parentheses."],
   ["pandas for ORDER BY amount DESC?","df.sort_values('amount', ascending=False)."]
  ],
  feynman:"Explain what pandas is to someone who knows Excel but has never coded.",
  connect:"Pick an Excel task you've done (filter, sort, total). Write the pandas line that does it." },

{ id:"p7", phase:"python", week:7, topic:"pandas", minutes:60, title:"pandas: cleaning messy data",
  predict:{ q:"A CSV has '$120.00' in one row and '80' in another in the amount column. What type will pandas give that column, and why is that a problem?",
    a:"pandas will treat the whole column as text (object), because '$120.00' isn't a number. You can't add text, so you must remove the $ and convert the column to numbers." },
  body:`
<p>Real data is always messy. Cleaning it is a core data engineering job. Here's the checklist, in order:</p>
<ol>
<li><b>Duplicates</b>: <code>df.duplicated().sum()</code> to count, <code>df = df.drop_duplicates()</code> to remove.</li>
<li><b>Types</b>: <code>pd.to_numeric(col, errors="coerce")</code> turns bad values into NaN instead of crashing. <code>pd.to_datetime(col, errors="coerce")</code> for dates.</li>
<li><b>Text</b>: <code>df["city"].str.strip().str.title()</code> fixes spaces and capitals. <code>.str.replace("$", "", regex=False)</code> removes symbols.</li>
<li><b>Missing values</b>: <code>df.isna().sum()</code> counts them per column. Then either <code>df.dropna(subset=["amount"])</code> or <code>df["city"].fillna("Unknown")</code>. Decide based on what the data means.</li>
<li><b>Check</b>: compare row counts before and after each step. Never lose rows without knowing why.</li></ol>
<p>pandas calls missing values <b>NaN</b> (for numbers) or None. They behave like SQL NULL: <code>sum()</code> and <code>mean()</code> skip them.</p>
<pre>before = len(df)
df = df.drop_duplicates()
print("removed duplicates:", before - len(df))</pre>
<p>Chaining keeps steps readable:</p>
<pre>df["city"] = df["city"].fillna("").str.strip().str.title().replace("", "Unknown")</pre>`,
  ex:[
   { id:"p7e1", kind:"py", q:"Clean the messy CSV (already loaded into df): remove duplicate rows, turn amount into a number (remove '$'), and drop rows with no amount. Print the number of rows left, then the total amount.", starter:PY_MESSY + "\nprint(df)\n", sol:PY_MESSY + "\ndf = df.drop_duplicates()\ndf['amount'] = pd.to_numeric(df['amount'].astype(str).str.replace('$', '', regex=False), errors='coerce')\ndf = df.dropna(subset=['amount'])\nprint(len(df))\nprint(df['amount'].sum())",
     hints:["Order: duplicates → types → missing values.","df['amount'].astype(str).str.replace('$', '', regex=False), then pd.to_numeric(..., errors='coerce').","df = df.dropna(subset=['amount']); print(len(df)); print(df['amount'].sum())"] },
   { id:"p7e2", kind:"py", q:"Standardize the city column in the messy data: strip spaces, Title Case, and fill missing cities with 'Unknown'. Print the count of rows per city using  print(df['city'].value_counts().sort_index().to_string()).", starter:PY_MESSY + "\n", sol:PY_MESSY + "\ndf['city'] = df['city'].fillna('').str.strip().str.title().replace('', 'Unknown')\nprint(df['city'].value_counts().sort_index().to_string())",
     hints:["Missing cities are NaN. Fill them before using .str methods, or handle after.","fillna('') then .str.strip().str.title(), then replace empty text with 'Unknown'.","df['city'] = df['city'].fillna('').str.strip().str.title().replace('', 'Unknown')"] }
  ],
  cards:[
   ["How do you count and remove duplicate rows in pandas?","df.duplicated().sum(); df = df.drop_duplicates()."],
   ["What does errors='coerce' do in pd.to_numeric?","Turns values that can't be converted into NaN instead of raising an error."],
   ["How do you count missing values per column?","df.isna().sum()."],
   ["dropna vs fillna?","dropna removes rows with missing values; fillna replaces them with a value you choose."],
   ["Data-cleaning checklist order?","Duplicates → types → text → missing values → check row counts."]
  ],
  feynman:"Explain why you should compare row counts before and after each cleaning step.",
  connect:"Describe the messiest data you've ever seen (a form, a spreadsheet, a list). Which cleaning steps would fix it?" },

{ id:"p8", phase:"python", week:8, topic:"pandas", minutes:55, title:"pandas: groupby and merge",
  predict:{ q:"What do you think the pandas version of  SELECT city, SUM(amount) FROM orders GROUP BY city  looks like?",
    a:"df.groupby('city')['amount'].sum() — group by city, take the amount column, add it up." },
  body:`
<h4>groupby = GROUP BY</h4>
<pre>df.groupby("city")["amount"].sum()

df.groupby("city", as_index=False).agg(
    total=("amount", "sum"),
    orders=("order_id", "count"),
    average=("amount", "mean"),
)</pre>
<p>The second form uses <b>named aggregations</b>: each output column says <code>name=(column, function)</code>. <code>as_index=False</code> keeps city as a normal column.</p>
<h4>merge = JOIN</h4>
<pre>result = orders.merge(customers, left_on="customer_id", right_on="id", how="left")</pre>
<p><code>how</code> can be <code>"inner"</code>, <code>"left"</code>, <code>"right"</code> or <code>"outer"</code>, just like SQL. If the key has the same name in both tables, use <code>on="customer_id"</code>.</p>
<p>The fan-out trap from SQL lesson 10 exists here too. Check <code>len(result)</code> after every merge. pandas can check for you: <code>validate="many_to_one"</code> raises an error if the right side has duplicate keys.</p>
<h4>Other useful tools</h4>
<pre>df.pivot_table(index="city", columns="status", values="amount", aggfunc="sum")   # pivot
df.rename(columns={"amount": "amount_usd"})
pd.concat([df_jan, df_feb])        # stack tables on top of each other (UNION ALL)</pre>`,
  ex:[
   { id:"p8e1", kind:"py", q:"Total amount per city, largest first. Print it with  print(result.to_string(index=False))  where result has columns city and total.", starter:PY_ORDERS + "\n", sol:PY_ORDERS + "\nresult = df.groupby('city', as_index=False).agg(total=('amount', 'sum')).sort_values('total', ascending=False)\nprint(result.to_string(index=False))",
     hints:["groupby('city', as_index=False) then .agg(total=('amount', 'sum')).","Then sort_values('total', ascending=False).","result = df.groupby('city', as_index=False).agg(total=('amount', 'sum')).sort_values('total', ascending=False)"] },
   { id:"p8e2", kind:"py", q:"Merge the two DataFrames so every order gets its customer's country (left join on customer_id). Then print the total amount per country with  print(result.to_string(index=False)), sorted by country, columns country and amount.", starter:"import pandas as pd\n\norders = pd.DataFrame({'order_id': [1, 2, 3, 4, 5], 'customer_id': [1, 2, 1, 3, 9], 'amount': [120, 450, 80, 60, 30]})\ncustomers = pd.DataFrame({'customer_id': [1, 2, 3], 'country': ['Nigeria', 'USA', 'Canada']})\n\n", sol:"import pandas as pd\n\norders = pd.DataFrame({'order_id': [1, 2, 3, 4, 5], 'customer_id': [1, 2, 1, 3, 9], 'amount': [120, 450, 80, 60, 30]})\ncustomers = pd.DataFrame({'customer_id': [1, 2, 3], 'country': ['Nigeria', 'USA', 'Canada']})\n\nm = orders.merge(customers, on='customer_id', how='left')\nm['country'] = m['country'].fillna('Unknown')\nresult = m.groupby('country', as_index=False)['amount'].sum().sort_values('country')\nprint(result.to_string(index=False))",
     hints:["orders.merge(customers, on='customer_id', how='left').","Customer 9 doesn't exist, so its country is NaN. groupby drops NaN keys by default — fill it first (e.g. 'Unknown') so you don't lose that 30.","m.groupby('country', as_index=False)['amount'].sum().sort_values('country')"] }
  ],
  cards:[
   ["pandas for GROUP BY city with SUM(amount)?","df.groupby('city')['amount'].sum() or .agg(total=('amount', 'sum'))."],
   ["pandas for a LEFT JOIN?","a.merge(b, on='key', how='left')."],
   ["How do you catch fan-out in a pandas merge?","Check len() before and after, or use validate='many_to_one'."],
   ["Does groupby keep rows where the group key is NaN?","No, by default it drops them (use dropna=False or fill them first)."]
  ],
  feynman:"Explain merge and groupby to someone who knows SQL, in two sentences.",
  connect:"Your resume mentions pandas or Python data work? Describe one real merge or groupby it involved, or one you could have used." },

{ id:"p9", phase:"python", week:8, topic:"pandas", minutes:60, title:"Mini project: clean, summarize, save",
  predict:{ q:"You get a messy CSV every morning and your manager wants a clean summary by city. What steps would your script do, in order?",
    a:"1) Read the file. 2) Clean it: duplicates, types, text, missing values. 3) Summarize: group by city. 4) Write the result to a new file (or a database). 5) Print or log what happened (row counts)." },
  body:`
<p>Time to put Python and pandas together. This is a <b>mini pipeline</b>: read → clean → summarize → save. Every real pipeline has this shape; later lessons just make each step bigger, scheduled and more reliable.</p>
<pre>import pandas as pd

def extract(path):
    return pd.read_csv(path)

def transform(df):
    df = df.drop_duplicates().copy()
    df["amount"] = pd.to_numeric(df["amount"].astype(str).str.replace("$", "", regex=False), errors="coerce")
    df["city"] = df["city"].fillna("").str.strip().str.title().replace("", "Unknown")
    df = df.dropna(subset=["amount"])
    return df.groupby("city", as_index=False).agg(total=("amount", "sum"), orders=("order_id", "count"))

def load(df, path):
    df.to_csv(path, index=False)

raw = extract("orders_messy.csv")
summary = transform(raw)
load(summary, "summary_by_city.csv")
print(f"read {len(raw)} rows, wrote {len(summary)} cities")</pre>
<p>Notice the three functions: <b>extract</b>, <b>transform</b>, <b>load</b>. That's the ETL you'll study next phase. Splitting code like this makes each step easy to test and replace.</p>
<p>Want to run real files? Open <a href="https://colab.research.google.com/" target="_blank" rel="noopener">Google Colab</a> (free), upload a CSV from <a href="https://www.kaggle.com/datasets" target="_blank" rel="noopener">Kaggle datasets</a>, and try this code on it.</p>`,
  ex:[
   { id:"p9e1", kind:"py", q:"Write transform(df) that cleans the messy data (duplicates, '$' amounts, cities, missing amounts) and returns total and number of orders per city, sorted by city. Then print the summary as CSV text with  print(summary.to_csv(index=False)).", starter:PY_MESSY + "\ndef transform(df):\n    # clean, then summarize\n    return df\n\nsummary = transform(df)\nprint(summary.to_csv(index=False))\n", sol:PY_MESSY + "\ndef transform(df):\n    df = df.drop_duplicates().copy()\n    df['amount'] = pd.to_numeric(df['amount'].astype(str).str.replace('$', '', regex=False), errors='coerce')\n    df['city'] = df['city'].fillna('').str.strip().str.title().replace('', 'Unknown')\n    df = df.dropna(subset=['amount'])\n    return df.groupby('city', as_index=False).agg(total=('amount', 'sum'), orders=('order_id', 'count')).sort_values('city')\n\nsummary = transform(df)\nprint(summary.to_csv(index=False))",
     hints:["Reuse your cleaning steps from lesson 7, then a groupby from lesson 8.","agg(total=('amount', 'sum'), orders=('order_id', 'count')), then sort_values('city').","Clean city before grouping, or 'kinshasa ' and 'KINSHASA' become separate groups."] }
  ],
  cards:[
   ["The three steps of a pipeline?","Extract (read the source) → Transform (clean, join, summarize) → Load (write to the target)."],
   ["Why split a script into extract/transform/load functions?","Each step is easier to read, test, fix and replace on its own."],
   ["How do you write a DataFrame to CSV without the row numbers?","df.to_csv('file.csv', index=False)."]
  ],
  feynman:"Walk through your mini pipeline out loud as if explaining it to an interviewer, in under one minute.",
  connect:"What daily or weekly report in a job you know could be produced automatically by a script like this?" },

/* ======================= PHASE: TOOLS ======================= */
{ id:"t1", phase:"tools", week:8, topic:"Tools", minutes:45, title:"The command line",
  predict:{ q:"Data engineers spend a lot of time typing commands into a black window instead of clicking. Why do you think that is?",
    a:"Commands can be repeated, scripted and automated, and servers usually have no screen to click on. Everything from running Python to deploying pipelines happens through commands." },
  body:`
<p>The <b>terminal</b> (or command line, or shell) is a text window where you type commands. On Mac open <i>Terminal</i>; on Windows install <i>Git Bash</i> or use <i>PowerShell</i>; on Linux open <i>Terminal</i>.</p>
<h4>Moving around</h4>
<table class="mini"><tr><th>Command</th><th>Does</th></tr>
<tr><td><code>pwd</code></td><td>show which folder you're in ("print working directory")</td></tr>
<tr><td><code>ls</code></td><td>list files here (<code>dir</code> in Windows cmd)</td></tr>
<tr><td><code>cd projects</code></td><td>go into the folder "projects"</td></tr>
<tr><td><code>cd ..</code></td><td>go up one folder</td></tr>
<tr><td><code>mkdir pipeline</code></td><td>make a new folder</td></tr>
<tr><td><code>touch extract.py</code></td><td>make an empty file (<code>ni extract.py</code> in PowerShell)</td></tr>
<tr><td><code>cp a.csv b.csv</code> / <code>mv a.csv data/</code></td><td>copy / move or rename</td></tr>
<tr><td><code>rm old.csv</code></td><td>delete — there is no trash can, it's gone</td></tr>
<tr><td><code>cat file.csv</code> / <code>head file.csv</code></td><td>show a file / its first lines</td></tr></table>
<h4>Running things</h4>
<pre>python3 extract.py            # run a Python script (python on Windows)
pip install pandas            # install a Python package
python3 extract.py --date 2025-06-01   # pass options (flags)</pre>
<h4>Paths</h4>
<p>An <b>absolute path</b> starts from the top: <code>/Users/ada/projects/pipeline/data.csv</code>. A <b>relative path</b> starts from where you are: <code>data/data.csv</code>. Most "file not found" errors come from running a script from the wrong folder.</p>
<p>Tip: press <b>Tab</b> to auto-complete names and the <b>up arrow</b> to repeat the last command. Practice for 20 minutes on your own computer this week.</p>`,
  ex:[
   { id:"t1e1", kind:"text", q:"Write the commands to: create a folder called pipeline, go into it, create a file called extract.py, list the folder's contents, and run the script with Python.",
     sol:"mkdir pipeline\ncd pipeline\ntouch extract.py\nls\npython3 extract.py",
     hints:["Five commands, one per line.","mkdir, cd, touch, ls, python3.","mkdir pipeline / cd pipeline / touch extract.py / ls / python3 extract.py"] }
  ],
  cards:[
   ["What do pwd, ls and cd do?","pwd: show current folder. ls: list files. cd: change folder (cd .. goes up)."],
   ["How do you run a Python script from the terminal?","python3 script.py (python on Windows)."],
   ["Absolute vs relative path?","Absolute starts from the root (/Users/...); relative starts from the current folder (data/file.csv)."],
   ["Is a file deleted with rm in the trash?","No. rm deletes permanently."]
  ],
  feynman:"Explain why servers are controlled with typed commands instead of a mouse.",
  connect:"What computer task do you repeat often that a single command could do?" },

{ id:"t2", phase:"tools", week:8, topic:"Tools", minutes:45, title:"Git and GitHub",
  predict:{ q:"You change your pipeline and it breaks. You'd love to go back to yesterday's working version. What kind of tool would make that easy?",
    a:"Version control. Git saves snapshots (commits) of your code so you can see every change and go back. GitHub stores those snapshots online and lets teams work together." },
  body:`
<p><b>Git</b> tracks changes to your code. <b>GitHub</b> is a website that hosts Git projects online. Every data engineering job uses them, and your GitHub profile is your portfolio.</p>
<h4>The core loop</h4>
<pre>git init                      # start tracking this folder (once)
git status                    # what changed?
git add extract.py            # choose changes to save (stage them)
git commit -m "Add extract step"   # save a snapshot with a message
git push                      # upload commits to GitHub</pre>
<div class="analogy"><b>Think of a video game save.</b> <code>add</code> picks what goes into the save, <code>commit</code> saves the game with a note, <code>push</code> uploads the save to the cloud. You can always load an older save.</div>
<h4>Starting with GitHub</h4>
<ol><li>Create an account at <a href="https://github.com" target="_blank" rel="noopener">github.com</a>.</li>
<li>Create a new repository (a project), e.g. <code>taxi-pipeline</code>.</li>
<li>Follow the commands GitHub shows to connect your folder (<code>git remote add origin ...</code>, <code>git push -u origin main</code>).</li></ol>
<h4>Working in a team</h4>
<p>Teams don't change <code>main</code> directly. They make a <b>branch</b> (<code>git switch -c add-quality-checks</code>), commit there, push, and open a <b>pull request</b> so a teammate reviews the change before it's merged.</p>
<h4>Never commit secrets</h4>
<p>Passwords and keys go in a <code>.env</code> file listed in <code>.gitignore</code>, never in Git. Bots scan GitHub for leaked keys within minutes.</p>
<p>Learn by doing: <a href="https://learngitbranching.js.org/" target="_blank" rel="noopener">Learn Git Branching</a> is a free visual game.</p>`,
  ex:[
   { id:"t2e1", kind:"text", q:"You have a folder with pipeline.py and want it on GitHub in a new repository you already created at github.com/you/taxi-pipeline. Write the commands, in order.",
     sol:"git init\ngit add pipeline.py\ngit commit -m \"Add pipeline\"\ngit branch -M main\ngit remote add origin https://github.com/you/taxi-pipeline.git\ngit push -u origin main",
     hints:["Start tracking, stage, commit — then connect to GitHub and push.","git init, git add, git commit -m \"...\"","git remote add origin <url>, then git push -u origin main"] }
  ],
  cards:[
   ["Git vs GitHub?","Git: tool that tracks code changes on your computer. GitHub: website that hosts Git repositories online for sharing and teamwork."],
   ["What do git add, commit and push do?","add: stage changes; commit: save a snapshot with a message; push: upload commits to the remote (GitHub)."],
   ["What is a pull request?","A request to merge a branch's changes, so teammates can review them first."],
   ["Where do passwords and API keys go?","In environment variables / a .env file listed in .gitignore — never in Git."]
  ],
  feynman:"Explain Git commits to someone using the idea of saving versions of a document (essay_v1, essay_v2…), and why Git is better.",
  connect:"Have you ever lost work or overwritten a file by mistake? How would Git have saved you?" },

{ id:"t3", phase:"tools", week:8, topic:"Tools", minutes:60, title:"Set up your computer",
  predict:{ q:"Two projects need different versions of pandas. If you install packages for the whole computer, what problem could happen?",
    a:"They'd fight: upgrading pandas for one project could break the other. A virtual environment gives each project its own separate set of packages." },
  body:`
<p>From the next phase on you'll build a real project on your own computer. Set it up this week. Tick each step as you finish it.</p>
<ol>
<li><b>Python 3.12</b> from <a href="https://www.python.org/downloads/" target="_blank" rel="noopener">python.org</a>. On Windows, tick "Add Python to PATH". Check: <code>python3 --version</code>.</li>
<li><b>VS Code</b> from <a href="https://code.visualstudio.com/" target="_blank" rel="noopener">code.visualstudio.com</a>, plus its Python extension. This is where you'll write code.</li>
<li><b>Git</b> from <a href="https://git-scm.com/downloads" target="_blank" rel="noopener">git-scm.com</a>. Check: <code>git --version</code>. Then set your name: <code>git config --global user.name "Your Name"</code>.</li>
<li><b>PostgreSQL</b> from <a href="https://www.postgresql.org/download/" target="_blank" rel="noopener">postgresql.org</a> (or wait for Docker in week 13). Remember the password you set.</li>
<li>A <b>GitHub</b> account.</li></ol>
<h4>Virtual environments</h4>
<pre>mkdir taxi-pipeline && cd taxi-pipeline
python3 -m venv .venv               # create the environment (once)
source .venv/bin/activate           # turn it on (Windows: .venv\\Scripts\\activate)
pip install pandas sqlalchemy psycopg2-binary
pip freeze > requirements.txt       # record exact package versions</pre>
<p>Anyone (or any server) can now recreate your setup with <code>pip install -r requirements.txt</code>. Add <code>.venv</code> to <code>.gitignore</code>; never commit it.</p>
<p>Stuck on an install error? Copy the last line of the error into a search engine, or ask Claude Code in your study folder. Setup problems are normal and are part of the job.</p>`,
  ex:[
   { id:"t3e1", kind:"text", q:"After installing everything, run these and paste what you see: python3 --version, git --version, and (inside an activated virtual environment) pip list. If something failed, write the error's last line.",
     sol:"Example:\nPython 3.12.4\ngit version 2.45.1\nPackage    Version\n---------- -------\npandas     2.2.2\nnumpy      2.0.0\n...\nIf python3 isn't found on Windows, try python --version, or reinstall with 'Add to PATH' ticked.",
     hints:["Open a new terminal window after installing, so it sees the new programs.","Activate the venv first: source .venv/bin/activate (Mac/Linux) or .venv\\Scripts\\activate (Windows).","If a command isn't found, the program isn't installed or isn't on your PATH."] }
  ],
  cards:[
   ["What is a virtual environment?","A separate set of Python packages for one project, so projects don't break each other."],
   ["How do you create and activate a venv?","python3 -m venv .venv, then source .venv/bin/activate (Windows: .venv\\Scripts\\activate)."],
   ["What is requirements.txt for?","Lists the exact packages a project needs, so anyone can install them with pip install -r requirements.txt."]
  ],
  feynman:"Explain virtual environments using separate toolboxes for separate jobs.",
  connect:"Write down your computer type (Mac/Windows) and anything that went wrong during setup, so you can explain it later." },

/* ======================= PHASE: ETL ======================= */
{ id:"e1", phase:"etl", week:9, topic:"Pipelines", minutes:45, title:"ETL, ELT, batch and streaming",
  predict:{ q:"A bank needs to block a stolen card within seconds. A company's sales report is read once each morning. Should both pipelines work the same way?",
    a:"No. Fraud detection needs streaming (process each event as it happens). The sales report is fine as batch (process a day's data once, overnight). Batch is simpler and cheaper, so use it unless you truly need real time." },
  body:`
<h4>ETL vs ELT</h4>
<ul><li><b>ETL</b> (Extract, Transform, Load): clean and reshape the data <i>before</i> loading it into the warehouse. Classic approach; you did this in Python.</li>
<li><b>ELT</b> (Extract, Load, Transform): load the raw data first, then transform it <i>inside</i> the warehouse with SQL. Common today because cloud warehouses (Snowflake, BigQuery, Redshift) are powerful. Tools like <b>dbt</b> manage those SQL transformations.</li></ul>
<h4>Batch vs streaming</h4>
<table class="mini"><tr><th></th><th>Batch</th><th>Streaming</th></tr>
<tr><td>When</td><td>On a schedule (every night, every hour)</td><td>Continuously, event by event</td></tr>
<tr><td>Delay</td><td>Minutes to a day</td><td>Seconds</td></tr>
<tr><td>Tools</td><td>Python, SQL, Spark, Airflow</td><td>Kafka, Spark Streaming, Flink</td></tr>
<tr><td>Example</td><td>Daily sales report</td><td>Fraud alerts, live tracking</td></tr></table>
<h4>Where data lives</h4>
<ul><li><b>Source systems</b>: app databases, APIs, files, event logs.</li>
<li><b>Data lake</b>: cheap storage for raw files of any kind (e.g. Amazon S3).</li>
<li><b>Data warehouse</b>: clean, structured tables for analysis (Snowflake, BigQuery, Redshift, PostgreSQL for small cases).</li>
<li><b>Lakehouse</b>: a mix of both (Databricks, Delta Lake, Iceberg).</li></ul>
<h4>File formats</h4>
<p><b>CSV</b>: simple, readable, no types, big. <b>JSON</b>: nested, from APIs. <b>Parquet</b>: columnar, compressed, keeps types; the standard for big data. Reading 2 columns from a 100-column Parquet file only reads those 2 columns.</p>
<p>Free course to go deeper: the <a href="https://github.com/DataTalksClub/data-engineering-zoomcamp" target="_blank" rel="noopener">Data Engineering Zoomcamp</a>.</p>`,
  ex:[
   { id:"e1e1", kind:"text", q:"For each, say batch or streaming, and why: (a) monthly invoices to customers, (b) showing a delivery driver's live location on a map, (c) a dashboard of yesterday's website visits, (d) alerting when a factory machine overheats.",
     sol:"(a) Batch — once a month is fine. (b) Streaming — the location must update every few seconds. (c) Batch — yesterday's data, read once a day. (d) Streaming — an alert that comes hours late is useless.",
     hints:["Ask: how quickly does someone need the result?","If minutes or hours late is fine, it's batch.","Live maps and safety alerts can't wait."] }
  ],
  cards:[
   ["ETL vs ELT?","ETL transforms before loading into the warehouse; ELT loads raw data first and transforms inside the warehouse (often with SQL/dbt)."],
   ["Batch vs streaming?","Batch processes chunks on a schedule (simpler, cheaper). Streaming processes events continuously within seconds."],
   ["Data lake vs data warehouse?","Lake: cheap storage of raw files of any kind (S3). Warehouse: clean, structured tables for analysis (Snowflake, BigQuery)."],
   ["Why is Parquet popular?","Columnar and compressed, keeps data types, so queries read only the needed columns — fast and cheap."]
  ],
  feynman:"Explain batch vs streaming using mail: a daily postal delivery vs a phone call.",
  connect:"Your resume mentions ETL. Was that pipeline batch or streaming? ETL or ELT? Where did data come from and land?" },

{ id:"e2", phase:"etl", week:9, topic:"Pipelines", minutes:60, title:"Build a pipeline that loads a database",
  predict:{ q:"Your cleaned data is in a pandas DataFrame. How do you think it gets into a database table?",
    a:"pandas can write it directly: df.to_sql('table_name', connection). Then anyone can query it with SQL." },
  body:`
<p>Now the full loop: <b>extract</b> a file, <b>transform</b> with pandas, <b>load</b> into a database, and <b>query</b> it with SQL. This page runs it with SQLite; on your computer you'll use PostgreSQL. The code is nearly the same.</p>
<pre>import sqlite3
import pandas as pd

conn = sqlite3.connect(":memory:")     # PostgreSQL: sqlalchemy.create_engine("postgresql://user:pw@localhost/db")

def extract():
    return pd.read_csv("orders.csv")

def transform(df):
    df = df.drop_duplicates()
    df["order_date"] = pd.to_datetime(df["order_date"]).dt.strftime("%Y-%m-%d")
    return df

def load(df):
    df.to_sql("orders", conn, if_exists="replace", index=False)

load(transform(extract()))
print(pd.read_sql("SELECT city, SUM(amount) AS total FROM orders GROUP BY city", conn))</pre>
<ul><li><code>if_exists="replace"</code> drops and recreates the table; <code>"append"</code> adds rows (careful: running twice duplicates them — next lesson fixes that).</li>
<li><code>pd.read_sql</code> runs a query and returns a DataFrame.</li>
<li>For big loads into PostgreSQL, the fastest way is the <code>COPY</code> command.</li></ul>
<h4>Your portfolio project starts now</h4>
<p>On your own computer, start <b>taxi-pipeline</b>: download one month of <a href="https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page" target="_blank" rel="noopener">NYC taxi trip data</a>, write extract.py, transform.py and load.py, and load it into PostgreSQL. The <a href="https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/01-docker-terraform" target="_blank" rel="noopener">Zoomcamp module 1</a> walks through exactly this. Push it to GitHub.</p>`,
  ex:[
   { id:"e2e1", kind:"py", q:"Finish the pipeline: load the cleaned DataFrame into a SQLite table called orders, then use pd.read_sql to print the total amount per status, ordered by status. Print with  print(result.to_string(index=False)).", starter:PY_ORDERS + "import sqlite3\nconn = sqlite3.connect(':memory:')\n\ndef transform(df):\n    return df.drop_duplicates()\n\ndef load(df):\n    # write df to the 'orders' table\n    pass\n\nload(transform(df))\nresult = None  # query the table\n", sol:PY_ORDERS + "import sqlite3\nconn = sqlite3.connect(':memory:')\n\ndef transform(df):\n    return df.drop_duplicates()\n\ndef load(df):\n    df.to_sql('orders', conn, if_exists='replace', index=False)\n\nload(transform(df))\nresult = pd.read_sql('SELECT status, SUM(amount) AS total FROM orders GROUP BY status ORDER BY status', conn)\nprint(result.to_string(index=False))",
     hints:["df.to_sql(table_name, connection, if_exists='replace', index=False).","pd.read_sql(query_text, conn) returns a DataFrame.","SELECT status, SUM(amount) AS total FROM orders GROUP BY status ORDER BY status"] }
  ],
  cards:[
   ["How do you write a DataFrame to a database table?","df.to_sql('table', connection, if_exists='replace' or 'append', index=False)."],
   ["How do you run SQL from Python into a DataFrame?","pd.read_sql('SELECT ...', connection)."],
   ["What's the fastest way to bulk load into PostgreSQL?","The COPY command."],
   ["Danger of if_exists='append'?","Running the pipeline twice inserts the same rows twice (duplicates)."]
  ],
  feynman:"Explain your pipeline's three functions, and why the database at the end matters to the people who use the data.",
  connect:"Compare this pipeline with one from your resume: where was it bigger, and what extra steps did it need?" },

{ id:"e3", phase:"etl", week:9, topic:"Pipelines", minutes:60, title:"Reliable pipelines: idempotency, increments, quality checks",
  predict:{ q:"Your daily pipeline crashed halfway through loading. You fix the bug and run it again. What might go wrong?",
    a:"The rows loaded before the crash get loaded again, so you get duplicates. A good pipeline is idempotent: running it twice gives the same result as running it once." },
  body:`
<p>Anyone can write a pipeline that works once. A data engineer makes it work <b>every day, safely</b>. Three ideas do most of the work:</p>
<h4>1. Idempotency</h4>
<p>Running the job again with the same input gives the same result: no duplicates, no missing rows. Two common ways:</p>
<pre>-- a) delete-then-insert the slice you own, in one transaction
BEGIN;
DELETE FROM trips WHERE trip_date = '2025-06-01';
INSERT INTO trips SELECT ... WHERE trip_date = '2025-06-01';
COMMIT;

-- b) upsert on a unique key
INSERT INTO trips (...) VALUES (...)
ON CONFLICT (trip_id) DO UPDATE SET fare = excluded.fare;</pre>
<h4>2. Incremental loads</h4>
<p>A <b>full load</b> reprocesses everything each run. Simple, but slow as data grows. An <b>incremental load</b> processes only what's new since last time, using a <b>watermark</b> (e.g. the latest <code>updated_at</code> already loaded) or a date partition (just yesterday).</p>
<h4>3. Data quality checks</h4>
<p>Check the data and <b>fail loudly</b> when something's wrong, before bad data reaches a dashboard:</p>
<ul><li>Row count above zero (and close to yesterday's).</li>
<li>Key columns not NULL and unique.</li>
<li>Values in range: fare ≥ 0, dates not in the future.</li>
<li>Expected columns exist with the right types.</li></ul>
<h4>Also</h4>
<ul><li><b>Logging</b>: print or log row counts at each step, so you can see what happened at 3 a.m.</li>
<li><b>Secrets</b> in environment variables, not in code.</li>
<li><b>Retries</b> for flaky things like network calls (Airflow does this for you in week 12).</li></ul>`,
  ex:[
   { id:"e3e1", kind:"py", q:"Write check_quality(df) that returns a list of problems: 'no rows' if empty, 'duplicate order_id' if any order_id repeats, 'null amount' if any amount is missing, 'negative amount' if any amount < 0. Print the problems found in the sample data, one per line.", starter:"import pandas as pd\n\ndf = pd.DataFrame({'order_id': [1, 2, 2, 3], 'amount': [120, None, 50, -5]})\n\ndef check_quality(df):\n    problems = []\n    # your checks\n    return problems\n\nfor p in check_quality(df):\n    print(p)\n", sol:"import pandas as pd\n\ndf = pd.DataFrame({'order_id': [1, 2, 2, 3], 'amount': [120, None, 50, -5]})\n\ndef check_quality(df):\n    problems = []\n    if len(df) == 0:\n        problems.append('no rows')\n    if df['order_id'].duplicated().any():\n        problems.append('duplicate order_id')\n    if df['amount'].isna().any():\n        problems.append('null amount')\n    if (df['amount'] < 0).any():\n        problems.append('negative amount')\n    return problems\n\nfor p in check_quality(df):\n    print(p)",
     hints:["One if per check, appending a message to the list.","df['order_id'].duplicated().any(), df['amount'].isna().any().","(df['amount'] < 0).any() for negatives. Keep the checks in the order given."] },
   { id:"e3e2", kind:"text", q:"Interview question: 'Your daily job loads yesterday's trips. It failed after loading half the rows. How do you make sure re-running it doesn't create duplicates?' Write your answer.",
     sol:"Make the load idempotent. Option 1: in one transaction, delete all rows for that trip_date, then insert the day's rows, then commit — a crash rolls everything back, and a re-run replaces the day cleanly. Option 2: upsert on a unique key (trip_id) with INSERT ... ON CONFLICT DO UPDATE. Better still, load into a staging table first, run quality checks (row counts, no NULL keys), then swap or merge into the final table.",
     hints:["Name the property you want.","Either clear what this run owns before writing, or merge on a unique key.","Transactions make it all-or-nothing."] }
  ],
  cards:[
   ["What does idempotent mean for a pipeline?","Running it again with the same input gives the same result — no duplicates, no drift."],
   ["Two ways to make a load idempotent?","Delete-then-insert the slice in one transaction, or upsert (INSERT ... ON CONFLICT DO UPDATE / MERGE)."],
   ["Full vs incremental load?","Full reloads everything; incremental loads only new/changed data since the last run, using a watermark or date partition."],
   ["Name four data-quality checks.","Row count > 0 (and normal), keys not NULL, keys unique, values in a valid range."],
   ["What is a watermark in incremental loading?","The highest value (e.g. updated_at) already loaded; the next run loads only rows after it."]
  ],
  feynman:"Explain idempotency using an elevator button: pressing it five times still calls one elevator.",
  connect:"In your past work, what would have happened if a data job ran twice by accident? How would you prevent it?" },

/* ======================= PHASE: MODELING ======================= */
{ id:"m1", phase:"model", week:10, topic:"Modeling", minutes:45, title:"Two kinds of databases: OLTP and OLAP",
  predict:{ q:"A shop's app database stores each customer's address once. Its analytics warehouse repeats the city on millions of sales rows. Is the warehouse badly designed?",
    a:"No. The app database is designed for fast, safe writes (no repetition). The warehouse is designed for fast reading and analysis, where fewer joins matter more than saving space." },
  body:`
<table class="mini"><tr><th></th><th>OLTP (the app's database)</th><th>OLAP (the warehouse)</th></tr>
<tr><td>Purpose</td><td>Run the business: place orders, update accounts</td><td>Analyze the business: reports, trends</td></tr>
<tr><td>Queries</td><td>Many small reads/writes of single rows</td><td>Few big reads over millions of rows</td></tr>
<tr><td>Design</td><td>Normalized: each fact stored once</td><td>Denormalized: repeated on purpose, fewer joins</td></tr>
<tr><td>Examples</td><td>PostgreSQL, MySQL behind an app</td><td>Snowflake, BigQuery, Redshift</td></tr></table>
<h4>Normalization in plain words</h4>
<p>Normalization means splitting data into tables so <b>each fact lives in exactly one place</b>.</p>
<ul><li><b>1st normal form</b>: one value per cell (no "hub, mouse, webcam" in a single cell — make rows instead).</li>
<li><b>2nd</b>: every column depends on the <i>whole</i> key (in order_items, the product's name depends only on product_id, so it belongs in products).</li>
<li><b>3rd</b>: no column depends on another non-key column (a customer's country depends on their city? then cities get their own table).</li></ul>
<p>Why? If Ben's address is stored on 300 order rows, changing it means 300 updates, and missing one leaves the data contradicting itself. That's called an <b>update anomaly</b>.</p>
<p>Analytics flips the priority: data is written once in batches and read constantly, so the warehouse <b>denormalizes</b> into a <b>star schema</b>. That's next.</p>`,
  ex:[
   { id:"m1e1", kind:"text", q:"This flat table repeats a lot: order_id, order_date, customer_name, customer_email, customer_city, product_name, product_price, quantity. Split it into normalized tables. Name each table, its columns, and its key.",
     sol:"customers(customer_id PK, name, email, city)\nproducts(product_id PK, name, price)\norders(order_id PK, customer_id FK → customers, order_date)\norder_items(order_id FK → orders, product_id FK → products, quantity) — key: (order_id, product_id)",
     hints:["Look for groups of columns about the same thing: customer, product, order.","Each thing gets its own table and an id; link them with foreign keys.","One order can have many products, so you need a bridge table."] }
  ],
  cards:[
   ["OLTP vs OLAP?","OLTP: the app's database for many small transactions (normalized). OLAP: the warehouse for big analytical reads (denormalized)."],
   ["What is normalization?","Organizing tables so each fact is stored in exactly one place, avoiding duplication and update anomalies."],
   ["What is an update anomaly?","When the same fact is stored in many rows and an update misses some, so the data contradicts itself."],
   ["Why do warehouses denormalize?","Data is written in batches and read constantly; fewer joins make queries simpler and faster."]
  ],
  feynman:"Explain normalization using a school that writes a teacher's phone number on every student's file.",
  connect:"Think of a spreadsheet you've used that repeated information on every row. What went wrong (or could) when something changed?" },

{ id:"m2", phase:"model", week:10, topic:"Modeling", minutes:60, title:"Star schemas: facts, dimensions and grain",
  predict:{ q:"You're designing tables for taxi trip analysis. Before choosing any columns, what's the first question to answer?",
    a:"The grain: what does one row of the main (fact) table represent? Here, one completed trip. Every other decision follows from that." },
  body:`
<p>The <b>star schema</b> is the most common way to model a data warehouse, from Ralph Kimball's "dimensional modeling". Interviewers ask about it all the time.</p>
<pre class="flow">            dim_date
               │
dim_zone ── fact_trips ── dim_vendor
               │
        dim_payment_type</pre>
<ul><li>A <b>fact table</b> sits in the middle. It records events and holds <b>measures</b> (numbers you add up: fare, distance, tip) plus <b>foreign keys</b> to dimensions. It's long: millions or billions of rows.</li>
<li><b>Dimension tables</b> surround it. They hold <b>descriptions</b> you filter and group by: date (day of week, month, holiday), zone (name, borough), vendor. They're short and wide.</li></ul>
<h4>The four design steps (Kimball)</h4>
<ol><li><b>Pick the business process</b>: taxi trips.</li>
<li><b>Declare the grain</b>: one row per completed trip.</li>
<li><b>Identify the dimensions</b>: when, where from, where to, which vendor, how paid.</li>
<li><b>Identify the facts</b>: fare, tip, distance, duration, passengers.</li></ol>
<h4>Surrogate keys and the date dimension</h4>
<p>Dimensions usually get a <b>surrogate key</b>: a meaningless id made by the warehouse (zone_key = 1, 2, 3…), instead of the source system's id. It protects you when sources change and enables history (next lesson). A <b>date dimension</b> has one row per day with ready-made columns (is_weekend, month_name, fiscal_quarter), so nobody has to calculate them in every query.</p>
<p><b>Snowflake schema</b>: dimensions split into more tables (zone → borough). Saves space, costs joins. Star is the usual default.</p>
<p>Read more: <a href="https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/" target="_blank" rel="noopener">Kimball dimensional modeling techniques</a>. Draw yours with <a href="https://dbdiagram.io/" target="_blank" rel="noopener">dbdiagram.io</a>.</p>`,
  ex:[
   { id:"m2e1", kind:"text", q:"Design a star schema for NYC taxi trips. State the grain, list the fact table's columns, and list at least three dimension tables with their columns.",
     sol:"Grain: one row per completed trip.\nfact_trips: trip_id, pickup_date_key, pickup_zone_key, dropoff_zone_key, vendor_key, payment_type_key, passenger_count, trip_distance, duration_min, fare_amount, tip_amount, total_amount\ndim_date: date_key, date, day_of_week, month, quarter, year, is_weekend, is_holiday\ndim_zone: zone_key, zone_id, zone_name, borough, service_zone\ndim_vendor: vendor_key, vendor_id, vendor_name\ndim_payment_type: payment_type_key, code, description",
     hints:["Start with the grain: what is one row?","Numbers you add up go in the fact; descriptions you filter by go in dimensions.","Pickup and dropoff zones are two foreign keys to the same dim_zone."] },
   { id:"m2e2", kind:"text", q:"For an online store (like the practice database), what would be the grain of fact_sales, and which dimensions would it have? Why is the grain 'order line' better than 'order' if you want sales by product?",
     sol:"Grain: one row per order line (one product in one order). Dimensions: dim_date, dim_customer, dim_product, maybe dim_store/channel. Measures: quantity, unit_price, line_amount. With an 'order' grain, an order with 3 products is one row, so you can't say how much each product sold without splitting it again — the finer grain answers both product and order questions.",
     hints:["What's the smallest event you'd want to analyze?","Remember order_items: one row per product per order.","A finer grain can always be rolled up; a coarser grain can't be split."] }
  ],
  cards:[
   ["Fact vs dimension table?","Fact: events with measures (amount, qty) and foreign keys; long. Dimension: descriptive attributes to filter/group by (date, customer); short and wide."],
   ["What is the first step when designing a fact table?","Declare the grain: what one row represents."],
   ["Kimball's four design steps?","Pick the business process → declare the grain → identify dimensions → identify facts."],
   ["What is a surrogate key?","A meaningless id generated by the warehouse for a dimension row, instead of the source system's id."],
   ["Star vs snowflake schema?","Star: denormalized dimensions joined directly to the fact. Snowflake: dimensions normalized into more tables (more joins)."]
  ],
  feynman:"Explain a star schema using a receipt: what's the fact, and what are the dimensions?",
  connect:"Pick a report from your experience. Sketch the fact table and dimensions behind it." },

{ id:"m3", phase:"model", week:10, topic:"Modeling", minutes:45, title:"Changing dimensions and fact types",
  predict:{ q:"A customer moves from Kinshasa to Lubumbashi. If you just overwrite their city, what happens to last year's sales report by city?",
    a:"Last year's sales would suddenly show under Lubumbashi, which is wrong. To keep history, you add a new version of the customer instead of overwriting — a 'slowly changing dimension type 2'." },
  body:`
<h4>Slowly changing dimensions (SCD)</h4>
<p>Dimension values change slowly over time: people move, products get renamed, employees change departments. How you handle it is a design choice:</p>
<table class="mini"><tr><th>Type</th><th>What happens</th><th>History?</th></tr>
<tr><td>Type 0</td><td>Never change it (e.g. original signup date)</td><td>—</td></tr>
<tr><td>Type 1</td><td>Overwrite the old value</td><td>Lost</td></tr>
<tr><td>Type 2</td><td>Add a new row with a new surrogate key; mark the old one ended</td><td>Kept</td></tr>
<tr><td>Type 3</td><td>Keep a "previous value" column</td><td>One step only</td></tr></table>
<pre>dim_customer (SCD Type 2)
customer_key | customer_id | city        | valid_from | valid_to   | is_current
101          | 4           | Kinshasa    | 2025-03-11 | 2026-01-31 | false
245          | 4           | Lubumbashi  | 2026-02-01 | 9999-12-31 | true</pre>
<p>Old sales point to key 101 (Kinshasa), new sales to key 245 (Lubumbashi). Both reports stay correct. This is why surrogate keys matter.</p>
<h4>Types of fact tables</h4>
<ul><li><b>Transaction</b>: one row per event (a sale, a trip). Most common.</li>
<li><b>Periodic snapshot</b>: one row per thing per period (each account's balance at the end of each day).</li>
<li><b>Accumulating snapshot</b>: one row per process that gets updated as it moves (order placed → shipped → delivered dates).</li></ul>
<p><b>Conformed dimensions</b>: share the same dim_date and dim_customer across many fact tables, so numbers from different reports line up.</p>`,
  ex:[
   { id:"m3e1", kind:"text", q:"An employee moves from Sales to Engineering on 2026-04-01. Using SCD Type 2, show what the employee dimension rows look like before and after, and explain what happens to payroll facts from March.",
     sol:"Before: (employee_key 7, employee_id 6, dept 'Sales', valid_from 2022-04-11, valid_to 9999-12-31, is_current true).\nAfter: row 7 is closed: valid_to 2026-03-31, is_current false. New row: (employee_key 31, employee_id 6, dept 'Engineering', valid_from 2026-04-01, valid_to 9999-12-31, is_current true).\nMarch payroll facts still point to key 7, so they stay under Sales. April onward point to key 31 (Engineering).",
     hints:["Type 2 never overwrites: it closes the old row and adds a new one.","You need valid_from, valid_to and is_current columns, and a new surrogate key.","Facts keep the key that was current when they happened."] }
  ],
  cards:[
   ["SCD Type 1 vs Type 2?","Type 1 overwrites (history lost). Type 2 adds a new row with a new surrogate key and validity dates (history kept)."],
   ["Which columns does an SCD Type 2 dimension need?","A surrogate key, the natural/source id, valid_from, valid_to, is_current."],
   ["Three types of fact tables?","Transaction (one row per event), periodic snapshot (one row per thing per period), accumulating snapshot (one row per process, updated as it progresses)."],
   ["What is a conformed dimension?","A dimension shared by several fact tables (e.g. one dim_date), so their numbers line up."]
  ],
  feynman:"Explain SCD Type 2 using a passport history: old passports aren't destroyed; a new one is issued with new dates.",
  connect:"What changes slowly in a business you know (prices, addresses, job titles)? Which SCD type would you choose for each?" },

/* ======================= PHASE: SPARK ======================= */
{ id:"k1", phase:"spark", week:11, topic:"Spark", minutes:50, title:"Why Spark exists: thinking in partitions",
  predict:{ q:"pandas loads all your data into one computer's memory. What happens when the data is 2 terabytes and your laptop has 16 GB of memory?",
    a:"It can't fit, so pandas fails or crawls. Spark splits the data into pieces (partitions) and processes them in parallel on many machines, each holding only part of the data." },
  body:`
<p><b>Apache Spark</b> processes data that's too big or too slow for one machine. You write code that looks like pandas or SQL; Spark splits the work across a <b>cluster</b> of computers.</p>
<pre class="flow">Driver (your program, makes the plan)
   ├── Executor 1: partitions 1–4
   ├── Executor 2: partitions 5–8
   └── Executor 3: partitions 9–12</pre>
<ul><li>The data is split into <b>partitions</b> (chunks). Each partition is processed by one task on one executor. More partitions → more parallel work.</li>
<li>The <b>driver</b> builds a plan and hands tasks to <b>executors</b>.</li></ul>
<h4>Lazy evaluation</h4>
<p>Spark doesn't run anything when you write <code>filter</code> or <code>groupBy</code>. These are <b>transformations</b>: they only add steps to the plan. Work starts when you call an <b>action</b>: <code>count()</code>, <code>show()</code>, <code>collect()</code>, <code>write</code>. Waiting lets Spark optimize the whole plan first (for example, filtering before reading unnecessary columns).</p>
<h4>Narrow vs wide transformations</h4>
<ul><li><b>Narrow</b> (filter, select, withColumn): each partition is processed on its own. Fast.</li>
<li><b>Wide</b> (groupBy, join, orderBy, distinct): rows with the same key must meet, so data moves between machines. This is a <b>shuffle</b>: network + disk, the slowest part of most Spark jobs.</li></ul>
<div class="analogy"><b>Think of 30 students</b>, each holding a pile of colored cards. "Remove the red cards" (filter) — everyone does it at their own desk at once. "Make one pile per color" (groupBy) — everyone has to get up and walk cards across the room. That walking is the shuffle.</div>
<p>When pandas is enough (under a few GB), use pandas: it's simpler. Spark shines at hundreds of GB and up.</p>`,
  ex:[
   { id:"k1e1", kind:"text", q:"Mark each as narrow or wide, and say which cause a shuffle: filter(fare > 0), groupBy('zone').sum('fare'), withColumn('tip_pct', tip/fare), join(zones, 'zone_id'), orderBy('fare'), select('fare', 'tip').",
     sol:"Narrow (no shuffle): filter, withColumn, select.\nWide (shuffle): groupBy, join (unless the small side is broadcast), orderBy (a global sort).",
     hints:["Ask: can each partition do this alone, without seeing other partitions?","Anything that needs all rows with the same key together needs a shuffle.","Sorting everything in order also needs data from all partitions."] }
  ],
  cards:[
   ["How is Spark different from pandas?","Spark splits data into partitions processed in parallel across a cluster, and evaluates lazily; pandas runs in one machine's memory, immediately."],
   ["Transformation vs action in Spark?","Transformations (filter, select, groupBy) build the plan lazily. Actions (count, show, write) run it."],
   ["What is a shuffle?","Moving data between partitions/machines so rows with the same key meet (groupBy, join, orderBy). Slow: network and disk."],
   ["Narrow vs wide transformation?","Narrow: each partition processed alone (filter, select). Wide: needs data from other partitions, causing a shuffle (groupBy, join)."],
   ["What are the driver and executors?","Driver: runs your program and plans the work. Executors: worker processes that run tasks on partitions."]
  ],
  feynman:"Explain a shuffle using the classroom card example, then explain why Spark waits (lazy evaluation) before doing anything.",
  connect:"Your resume mentions Spark. What size of data was it, what did the job do, and why wasn't pandas enough?" },

{ id:"k2", phase:"spark", week:11, topic:"Spark", minutes:60, title:"Writing PySpark",
  predict:{ q:"You know  df.groupby('city')['amount'].sum()  in pandas. What do you guess the PySpark version looks like?",
    a:"df.groupBy('city').agg(F.sum('amount')) — almost the same idea, with slightly different names (groupBy with a capital B, functions from pyspark.sql.functions)." },
  body:`
<p><b>PySpark</b> is Spark's Python interface. Its DataFrame API reads like a mix of pandas and SQL.</p>
<pre>from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("taxi").getOrCreate()
trips = spark.read.parquet("trips_2025_06.parquet")   # or .csv(path, header=True, inferSchema=True)

clean = (trips
    .filter(F.col("fare_amount") > 0)
    .withColumn("tip_pct", F.col("tip_amount") / F.col("fare_amount"))
    .select("pickup_zone_id", "fare_amount", "tip_pct"))

by_zone = (clean
    .groupBy("pickup_zone_id")
    .agg(F.count("*").alias("trips"), F.round(F.avg("fare_amount"), 2).alias("avg_fare"))
    .orderBy(F.desc("trips")))

by_zone.show(10)                                         # action: now it runs
by_zone.write.mode("overwrite").parquet("out/by_zone")   # action</pre>
<table class="mini"><tr><th>pandas</th><th>PySpark</th></tr>
<tr><td><code>df[df.fare &gt; 0]</code></td><td><code>df.filter(F.col("fare") &gt; 0)</code></td></tr>
<tr><td><code>df["x"] = ...</code></td><td><code>df.withColumn("x", ...)</code></td></tr>
<tr><td><code>df.groupby("k").agg(...)</code></td><td><code>df.groupBy("k").agg(...)</code></td></tr>
<tr><td><code>a.merge(b, on="k", how="left")</code></td><td><code>a.join(b, "k", "left")</code></td></tr>
<tr><td><code>df.sort_values("x")</code></td><td><code>df.orderBy("x")</code></td></tr></table>
<p>Prefer SQL? <code>trips.createOrReplaceTempView("trips")</code> then <code>spark.sql("SELECT ...")</code>. Same engine, same speed.</p>
<h4>Performance basics interviewers ask about</h4>
<ul><li><b>Broadcast join</b>: joining a huge table to a tiny one? <code>big.join(F.broadcast(small), "zone_id")</code> copies the tiny table to every executor, so the huge one doesn't shuffle.</li>
<li><b>Filter and select early</b>, so less data moves.</li>
<li><b>Parquet + partitioning</b>: <code>.write.partitionBy("trip_date")</code> lets later queries skip whole folders.</li>
<li><b>Skew</b>: if one key has most of the rows, one task does most of the work and everything waits for it.</li>
<li><code>cache()</code> keeps a DataFrame in memory if you reuse it several times.</li></ul>
<p><b>Practice:</b> open <a href="https://colab.research.google.com/" target="_blank" rel="noopener">Google Colab</a>, run <code>!pip install pyspark</code>, and follow the <a href="https://spark.apache.org/docs/latest/api/python/getting_started/quickstart_df.html" target="_blank" rel="noopener">PySpark DataFrame quickstart</a>. Then rewrite your project's transform step in PySpark. <a href="https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/05-batch" target="_blank" rel="noopener">Zoomcamp module 5</a> does this with taxi data.</p>`,
  ex:[
   { id:"k2e1", kind:"text", q:"Write PySpark code that reads orders.csv (with a header), keeps delivered orders, and computes total amount and number of orders per city, largest total first. Then say which steps cause a shuffle.",
     sol:"from pyspark.sql import SparkSession, functions as F\nspark = SparkSession.builder.getOrCreate()\norders = spark.read.csv('orders.csv', header=True, inferSchema=True)\nresult = (orders\n    .filter(F.col('status') == 'delivered')\n    .groupBy('city')\n    .agg(F.sum('amount').alias('total'), F.count('*').alias('orders'))\n    .orderBy(F.desc('total')))\nresult.show()\n# Shuffles: groupBy (rows of each city must meet) and orderBy (global sort). filter is narrow. Nothing runs until show().",
     hints:["spark.read.csv(path, header=True, inferSchema=True).","filter → groupBy → agg → orderBy, with F.sum, F.count, F.desc.","groupBy and orderBy are wide."] },
   { id:"k2e2", kind:"text", q:"Interview question: 'Your Spark job joins a 500 GB trips table to a 2 MB zones table and is slow. What do you try first, and why?'",
     sol:"Broadcast the small table: trips.join(F.broadcast(zones), 'zone_id'). Spark copies the 2 MB table to every executor, so the 500 GB table is joined in place, with no shuffle. Also: filter trips and select only needed columns before the join, make sure the data is Parquet, and check the Spark UI for skew (one task much slower than the rest).",
     hints:["One side is tiny. Does the huge side really need to move?","Send the small table to every machine instead.","F.broadcast(zones)"] }
  ],
  cards:[
   ["PySpark for filter + new column + group?","df.filter(F.col('x') > 0).withColumn('y', ...).groupBy('k').agg(F.sum('x'))."],
   ["What is a broadcast join and when do you use it?","Copying a small table to every executor so the big table doesn't shuffle; use when one side is small (MBs)."],
   ["Why write output partitioned by date?","Later queries filtering on date can skip whole folders (partition pruning)."],
   ["What is data skew?","When one key has far more rows than others, so one task does most of the work and slows the whole job."],
   ["How do you run SQL in Spark?","df.createOrReplaceTempView('t'), then spark.sql('SELECT ... FROM t')."]
  ],
  feynman:"Explain a broadcast join using a phone book: would you mail every phone number to one person, or give everyone a copy of a one-page list?",
  connect:"Describe how you'd talk about your project's Spark step in an interview: input size, what it did, and one performance choice you made." },

/* ======================= PHASE: AIRFLOW ======================= */
{ id:"a1", phase:"airflow", week:12, topic:"Airflow", minutes:60, title:"Scheduling pipelines with Airflow",
  predict:{ q:"Your pipeline must run every day at 6 a.m.: extract first, then transform, then load. If extract fails, it should retry and email you. What kind of tool would you want?",
    a:"An orchestrator: it runs tasks on a schedule, in the right order, retries failures and alerts you. Apache Airflow is the most widely used one." },
  body:`
<p><b>Apache Airflow</b> schedules and monitors pipelines. You describe the pipeline in Python as a <b>DAG</b>.</p>
<p><b>DAG</b> = Directed Acyclic Graph: tasks connected by arrows (directed), with no loops (acyclic). <code>extract → transform → load</code> is a DAG.</p>
<pre>from datetime import datetime, timedelta
from airflow.decorators import dag, task

@dag(
    schedule="0 6 * * *",              # cron: minute hour day month weekday → every day 06:00
    start_date=datetime(2026, 1, 1),
    catchup=False,
    default_args={"retries": 2, "retry_delay": timedelta(minutes=5)},
)
def taxi_pipeline():

    @task
    def extract(ds=None):              # ds = the run's logical date, e.g. "2026-06-01"
        return f"raw/trips_{ds}.parquet"

    @task
    def transform(path):
        return path.replace("raw", "clean")

    @task
    def load(path):
        print("loading", path)

    load(transform(extract()))         # sets the order: extract → transform → load

taxi_pipeline()</pre>
<h4>Key ideas</h4>
<ul><li><b>Scheduler</b>: starts DAG runs on time. <b>Workers</b> run the tasks. The <b>web UI</b> shows green (success) and red (failed) boxes for every run.</li>
<li><b>Logical date</b> (<code>ds</code>): the data period a run is for. The 06:00 run on June 2 processes June 1's data. Tasks should use it instead of "today", so re-runs process the right day.</li>
<li><b>Backfill</b>: running the DAG for past dates (e.g. load all of last month). Works only if tasks are <b>idempotent</b> (lesson e3).</li>
<li><b>Retries</b> and alerts handle flaky failures automatically.</li>
<li><b>Operators</b>: ready-made task types (PythonOperator, BashOperator, PostgresOperator, SparkSubmitOperator). <b>Sensors</b> wait for something (a file to arrive).</li>
<li>Airflow <b>orchestrates</b>: it tells other systems what to do. Heavy processing belongs in Spark, the warehouse or a container, not inside the Airflow worker.</li></ul>
<h4>Cron in 30 seconds</h4>
<pre>"0 6 * * *"     every day at 06:00
"0 7 * * 1"     every Monday at 07:00
"*/15 * * * *"  every 15 minutes
"0 0 1 * *"     the 1st of every month at midnight</pre>
<p><b>Practice:</b> the <a href="https://airflow.apache.org/docs/apache-airflow/stable/tutorial/fundamentals.html" target="_blank" rel="noopener">official Airflow tutorial</a> and the free <a href="https://academy.astronomer.io/" target="_blank" rel="noopener">Astronomer Academy</a> courses. Schedule your taxi pipeline daily and run a backfill for 3 past days.</p>`,
  ex:[
   { id:"a1e1", kind:"text", q:"Write the cron expression for: (a) every day at 2:30 a.m., (b) every Friday at 6 p.m., (c) every hour on the hour.",
     sol:"(a) 30 2 * * *\n(b) 0 18 * * 5\n(c) 0 * * * *",
     hints:["Order: minute, hour, day of month, month, day of week.","Hours are 0–23; Sunday is 0, Monday 1 … Saturday 6.","* means 'every'."] },
   { id:"a1e2", kind:"text", q:"Interview question: 'What is a backfill, and why does it matter that your tasks use the logical date instead of today's date?'",
     sol:"A backfill runs a DAG for past dates — e.g. after fixing a bug, or adding a new pipeline that needs history. Each backfill run gets its own logical date. If tasks use the logical date (ds) to decide which data to process, the June 3 run processes June 3. If they used today's date, every backfill run would process today's data, so history would be wrong and duplicated. Tasks must also be idempotent so re-running a date replaces it cleanly.",
     hints:["What happens when you run a DAG for dates in the past?","If every past run reads 'today', what data does each get?","Mention idempotency."] }
  ],
  cards:[
   ["What is a DAG in Airflow?","A Directed Acyclic Graph: tasks with dependencies (arrows) and no cycles, run on a schedule."],
   ["What is the logical date (ds)?","The data period a DAG run is for; tasks should use it instead of 'today' so re-runs and backfills are correct."],
   ["What is a backfill?","Running a DAG for past dates it hasn't processed (or needs to reprocess)."],
   ["Why must Airflow tasks be idempotent?","Retries and backfills re-run them; idempotent tasks don't duplicate or corrupt data."],
   ["Should heavy data processing run inside Airflow?","No. Airflow orchestrates; push heavy work to Spark, the warehouse or containers."],
   ["Cron order of fields?","minute hour day-of-month month day-of-week (e.g. 0 6 * * * = daily 06:00)."]
  ],
  feynman:"Explain Airflow using a restaurant kitchen's head chef who calls out orders in sequence and re-sends a dish if it fails.",
  connect:"Your resume lists Airflow. What did your DAGs do, how often did they run, and what happened when one failed?" },

/* ======================= PHASE: DOCKER, CLOUD, CI/CD ======================= */
{ id:"d1", phase:"cloud", week:13, topic:"Docker & Cloud", minutes:60, title:"Docker: works on every machine",
  predict:{ q:"Your pipeline works on your laptop but crashes on the server with 'module not found'. Why might that happen, and what would fix it for good?",
    a:"The server has different Python versions and packages. Docker packages your code together with the exact Python version and libraries it needs, so it runs the same everywhere." },
  body:`
<p><b>Docker</b> packages an app with everything it needs (operating system pieces, Python, libraries, your code) into an <b>image</b>. Running an image creates a <b>container</b>.</p>
<div class="analogy"><b>Shipping containers</b> changed trade: any ship, train or truck can carry the same standard box, whatever's inside. Docker does that for software: any laptop, server or cloud can run the same container.</div>
<ul><li><b>Image</b>: the recipe, built once. Read-only.</li>
<li><b>Container</b>: a running instance of an image. You can run many from one image.</li>
<li><b>Dockerfile</b>: the text file that describes how to build the image.</li></ul>
<pre># Dockerfile
FROM python:3.12-slim                 # start from an image with Python
WORKDIR /app                          # work in /app inside the container
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # cached unless requirements change
COPY pipeline/ pipeline/              # copy code last: it changes most often
CMD ["python", "pipeline/main.py"]    # what runs when the container starts</pre>
<pre>docker build -t taxi-pipeline .       # build the image
docker run --rm taxi-pipeline         # run a container from it
docker ps                             # list running containers</pre>
<p>Each line of a Dockerfile is a <b>layer</b>, and unchanged layers are reused. That's why requirements are copied and installed <i>before</i> the code: editing code doesn't reinstall every package.</p>
<h4>docker compose: several containers together</h4>
<pre># docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]   # keep data when the container stops
  pipeline:
    build: .
    depends_on: [db]
    environment:
      DB_HOST: db                    # containers find each other by service name
volumes:
  pgdata:</pre>
<p><code>docker compose up</code> starts both. Install <a href="https://docs.docker.com/get-started/" target="_blank" rel="noopener">Docker Desktop</a> and follow the get-started guide, then containerize your taxi pipeline.</p>`,
  ex:[
   { id:"d1e1", kind:"text", q:"Write a Dockerfile for a Python pipeline with requirements.txt and a pipeline/ folder whose entry point is pipeline/main.py. Order the lines so rebuilding after a code change is fast, and explain why.",
     sol:"FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY pipeline/ pipeline/\nCMD [\"python\", \"pipeline/main.py\"]\n\nWhy: each line is a cached layer. Requirements change rarely, so the slow pip install layer is reused; only the final COPY of code is rebuilt when code changes.",
     hints:["Start FROM a Python base image.","Copy requirements and install them before copying your code.","FROM, WORKDIR, COPY requirements, RUN pip install, COPY code, CMD."] }
  ],
  cards:[
   ["Image vs container?","Image: a built, read-only template (from a Dockerfile). Container: a running instance of an image."],
   ["Why copy requirements.txt before the code in a Dockerfile?","Layer caching: dependencies reinstall only when requirements change, not on every code edit."],
   ["What does docker compose do?","Defines and runs several containers together (e.g. Postgres + pipeline) with shared networks and volumes, from one YAML file."],
   ["What is a Docker volume for?","Keeping data (like a database's files) after a container is removed."],
   ["What problem does Docker solve?","'It works on my machine': the app runs the same everywhere because it ships with its environment."]
  ],
  feynman:"Explain Docker to someone who has only ever installed apps on a phone.",
  connect:"Where in your past work would 'it works on my machine' problems have been solved by containers?" },

{ id:"c1", phase:"cloud", week:13, topic:"Docker & Cloud", minutes:60, title:"The cloud and AWS basics",
  predict:{ q:"A startup needs 50 computers for 2 hours every night to run its pipelines. Should it buy 50 computers?",
    a:"No. It should rent them from a cloud provider (like AWS) only for those 2 hours and pay for just that time. That's the main idea of the cloud." },
  body:`
<p>The <b>cloud</b> is renting computers, storage and ready-made services over the internet, paying for what you use. The big three: <b>AWS</b> (Amazon, the most common in job posts), Azure (Microsoft), and Google Cloud.</p>
<h4>The three AWS services to know first</h4>
<ul><li><b>S3</b> (Simple Storage Service): stores files ("objects") in "buckets". Practically unlimited and cheap. The usual data lake. A common layout: <code>s3://my-bucket/raw/2026/06/01/trips.parquet</code> → <code>clean/</code> → <code>curated/</code>.</li>
<li><b>EC2</b> (Elastic Compute Cloud): virtual machines you rent by the second. You choose size, operating system, and turn them off when done.</li>
<li><b>IAM</b> (Identity and Access Management): who is allowed to do what. <b>Users</b> (people), <b>roles</b> (identities for machines and services), and <b>policies</b> (JSON rules like "may read bucket X").</li></ul>
<h4>Least privilege</h4>
<p>Give every user and machine <b>only</b> the permissions it needs, on <b>only</b> the resources it needs. A pipeline that reads one bucket shouldn't be able to delete every bucket. Machines (EC2, Lambda) should use <b>roles</b>, never access keys pasted into code.</p>
<h4>Using S3 from Python</h4>
<pre>import boto3
s3 = boto3.client("s3")     # credentials come from the role or your local AWS config, not the code
s3.upload_file("trips.parquet", "my-bucket", "raw/2026/06/01/trips.parquet")
s3.download_file("my-bucket", "raw/2026/06/01/trips.parquet", "local.parquet")</pre>
<h4>Other names you'll hear</h4>
<p><b>RDS</b> managed PostgreSQL/MySQL · <b>Redshift</b> data warehouse · <b>Glue</b> managed ETL/Spark and data catalog · <b>Athena</b> SQL directly on S3 files · <b>Lambda</b> run small functions without a server · <b>EMR</b> managed Spark clusters · <b>CloudWatch</b> logs and alerts.</p>
<p><b>Before you create anything, set a billing alarm.</b> Use the <a href="https://aws.amazon.com/free/" target="_blank" rel="noopener">free tier</a> and the free <a href="https://skillbuilder.aws/" target="_blank" rel="noopener">AWS Skill Builder</a> course <i>Cloud Practitioner Essentials</i>.</p>`,
  ex:[
   { id:"c1e1", kind:"text", q:"Interview question: 'Your pipeline runs on EC2 and needs to read and write one S3 bucket. How do you give it access safely?'",
     sol:"Create an IAM role with a policy that allows only s3:GetObject and s3:PutObject (plus s3:ListBucket) on that one bucket (arn:aws:s3:::my-bucket and arn:aws:s3:::my-bucket/*). Attach the role to the EC2 instance (instance profile). boto3 automatically uses the role's temporary credentials, so there are no access keys in the code, config files or Git. That's least privilege.",
     hints:["Where should credentials NOT be?","Give permissions to the machine, not to the code.","An IAM role with a policy limited to that bucket and those actions."] }
  ],
  cards:[
   ["What are S3, EC2 and IAM?","S3: object/file storage in buckets. EC2: rentable virtual machines. IAM: users, roles and policies controlling access."],
   ["What is least privilege?","Giving each user or machine only the permissions it needs, on only the resources it needs."],
   ["How should an EC2 machine get permission to use S3?","Through an IAM role attached to the instance — never access keys in code."],
   ["What is Athena?","An AWS service to run SQL directly on files in S3."],
   ["First thing to do on a new AWS account?","Set a billing alarm (and use the free tier)."]
  ],
  feynman:"Explain the cloud using electricity: you don't build a power plant, you plug in and pay for what you use.",
  connect:"Did a place you worked use the cloud? Which services, or what would they have moved there first?" },

{ id:"c2", phase:"cloud", week:14, topic:"Docker & Cloud", minutes:55, title:"Testing and CI/CD",
  predict:{ q:"You change your clean_city function and accidentally break it. How could you find out before it ruins tomorrow's data, without checking by hand every time?",
    a:"Write automatic tests that check the function's output, and have a CI system run them on every change. If a test fails, the change is blocked." },
  body:`
<h4>Tests</h4>
<p>A <b>test</b> is code that checks other code. With <b>pytest</b>, any function named <code>test_...</code> in a file named <code>test_....py</code> is a test, and <code>assert</code> checks a condition:</p>
<pre># test_transform.py
from transform import clean_city

def test_strips_and_titles():
    assert clean_city("  kinshasa ") == "Kinshasa"

def test_missing_city():
    assert clean_city(None) == "Unknown"</pre>
<p>Run <code>pytest</code> in the terminal and it reports what passed and failed. Test your transformation functions with small, hand-made inputs, including the weird cases (None, empty text, negative numbers).</p>
<h4>CI/CD</h4>
<ul><li><b>CI</b> (Continuous Integration): every push automatically runs tests and checks (linting, formatting). Broken code is caught before it's merged.</li>
<li><b>CD</b> (Continuous Delivery/Deployment): after tests pass, the new version is deployed automatically (e.g. a new Docker image, updated DAGs).</li></ul>
<pre># .github/workflows/tests.yml  (GitHub Actions)
name: tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt pytest
      - run: pytest</pre>
<p><b>Jenkins</b> does the same job but runs on a company's own server, with the pipeline written in a <code>Jenkinsfile</code>. If you know one, you understand the other.</p>
<p>See the <a href="https://docs.github.com/en/actions" target="_blank" rel="noopener">GitHub Actions docs</a>. Add this workflow to your taxi project: a green check mark on GitHub impresses reviewers.</p>`,
  ex:[
   { id:"c2e1", kind:"py", q:"Write three test functions for clean_city (strips and titles '  goma ', returns 'Unknown' for None, returns 'Unknown' for '   '). The runner at the bottom calls them and prints 'all tests passed'. Don't change the runner.", starter:"def clean_city(text):\n    if text is None or text.strip() == '':\n        return 'Unknown'\n    return text.strip().title()\n\n# write test_ functions here\n\n\n# runner (don't change)\ntests = [f for name, f in list(globals().items()) if name.startswith('test_')]\nfor t in tests:\n    t()\nprint(len(tests), 'tests')\nprint('all tests passed')\n", sol:"def clean_city(text):\n    if text is None or text.strip() == '':\n        return 'Unknown'\n    return text.strip().title()\n\ndef test_strips_and_titles():\n    assert clean_city('  goma ') == 'Goma'\n\ndef test_none():\n    assert clean_city(None) == 'Unknown'\n\ndef test_blank():\n    assert clean_city('   ') == 'Unknown'\n\n# runner (don't change)\ntests = [f for name, f in list(globals().items()) if name.startswith('test_')]\nfor t in tests:\n    t()\nprint(len(tests), 'tests')\nprint('all tests passed')",
     hints:["Each test is a function starting with test_ that uses assert.","assert clean_city('  goma ') == 'Goma'","You need exactly three test_ functions for the output to say '3 tests'."] }
  ],
  cards:[
   ["What does a pytest test look like?","A function named test_something that uses assert, e.g. assert clean_city(None) == 'Unknown'."],
   ["CI vs CD?","CI: automatically build and test every change. CD: automatically deliver/deploy after tests pass."],
   ["Where do GitHub Actions workflows live?","In .github/workflows/*.yml in the repository."],
   ["GitHub Actions vs Jenkins?","Same job (CI/CD). Actions is hosted by GitHub; Jenkins runs on your own server with a Jenkinsfile."]
  ],
  feynman:"Explain CI using a factory: every part is checked automatically before it goes on the assembly line.",
  connect:"How were changes checked on a team you were part of? What would automatic tests have caught?" },

{ id:"x1", phase:"cloud", week:14, topic:"Docker & Cloud", minutes:60, title:"dbt, Power BI and T-SQL in one sitting",
  predict:{ q:"A team has 200 SQL files that build warehouse tables, and nobody knows which one must run before which. What would help?",
    a:"A tool that knows the dependencies between the SQL models, runs them in order, tests them and documents them. That's dbt." },
  body:`
<p>Job posts often list these. You don't need to be an expert; you need to know what they're for and have used each once.</p>
<h4>dbt (data build tool)</h4>
<p>dbt turns SELECT statements into warehouse tables and views (the T in ELT). Each <b>model</b> is a <code>.sql</code> file:</p>
<pre>-- models/daily_trips.sql
SELECT trip_date, COUNT(*) AS trips, SUM(total_amount) AS revenue
FROM {{ ref('stg_trips') }}          -- ref() links models and sets the run order
GROUP BY trip_date</pre>
<pre># models/schema.yml
version: 2
models:
  - name: daily_trips
    columns:
      - name: trip_date
        tests: [unique, not_null]</pre>
<p><code>dbt run</code> builds everything in order, <code>dbt test</code> runs the tests, <code>dbt docs</code> generates documentation. Free course: <a href="https://learn.getdbt.com/courses/dbt-fundamentals" target="_blank" rel="noopener">dbt Fundamentals</a>.</p>
<h4>Power BI</h4>
<p>Microsoft's dashboard tool. You import tables, define <b>relationships</b> between facts and dimensions (your star schema!), write <b>DAX measures</b> like <code>Total Sales = SUM(fact_sales[amount])</code>, and build report pages. Free modules: <a href="https://learn.microsoft.com/en-us/training/powerplatform/power-bi" target="_blank" rel="noopener">Microsoft Learn: Power BI</a>.</p>
<h4>T-SQL (SQL Server)</h4>
<table class="mini"><tr><th>PostgreSQL</th><th>T-SQL</th></tr>
<tr><td><code>SELECT ... LIMIT 10</code></td><td><code>SELECT TOP 10 ...</code></td></tr>
<tr><td><code>COALESCE(x, 0)</code></td><td><code>ISNULL(x, 0)</code> (COALESCE works too)</td></tr>
<tr><td><code>CURRENT_DATE</code>, <code>NOW()</code></td><td><code>GETDATE()</code></td></tr>
<tr><td><code>d + INTERVAL '7 days'</code></td><td><code>DATEADD(day, 7, d)</code></td></tr>
<tr><td><code>a || b</code></td><td><code>a + b</code> or <code>CONCAT(a, b)</code></td></tr>
<tr><td><code>INSERT ... ON CONFLICT</code></td><td><code>MERGE</code></td></tr>
<tr><td>temporary table</td><td><code>#temp_table</code></td></tr></table>
<p>T-SQL also has <b>stored procedures</b>: saved blocks of SQL you run by name (<code>EXEC load_daily_sales</code>).</p>
<p><b>Lower priority</b> (one 1–2 hour tutorial each, for an honest "I've used it"): <a href="https://kubernetes.io/docs/tutorials/kubernetes-basics/" target="_blank" rel="noopener">Kubernetes basics</a> (runs many containers across machines), MongoDB (stores JSON-like documents instead of tables), Java/Scala (Spark's native languages).</p>`,
  ex:[
   { id:"x1e1", kind:"text", q:"Rewrite this PostgreSQL query in T-SQL:  SELECT name, COALESCE(city, 'unknown') || ' / ' || country AS place FROM customers ORDER BY signup_date DESC LIMIT 5;",
     sol:"SELECT TOP 5 name, ISNULL(city, 'unknown') + ' / ' + country AS place\nFROM customers\nORDER BY signup_date DESC;\n(COALESCE and CONCAT also work in T-SQL.)",
     hints:["LIMIT becomes TOP, and it moves to right after SELECT.","|| becomes + (or CONCAT).","ISNULL(city, 'unknown') is the T-SQL classic."] },
   { id:"x1e2", kind:"text", q:"In one or two honest sentences each, say how you'd answer 'Have you used dbt?' and 'Have you used Kubernetes?' in an interview after doing a short tutorial.",
     sol:"dbt: 'Yes, at a basic level: I built a few models on my project's Postgres tables using ref() and added unique and not_null tests. I understand it manages SQL transformations in the warehouse, in dependency order.'\nKubernetes: 'Only through a tutorial. I understand it schedules and scales containers across a cluster, and I've deployed a sample app, but I haven't run it in production.'",
     hints:["Say what you did, at what level, and what you understand it's for.","Honesty about level beats overclaiming.","Mention one concrete thing you did with it."] }
  ],
  cards:[
   ["What does dbt do?","Turns SELECT statements (models) into warehouse tables/views, runs them in dependency order (ref()), tests and documents them."],
   ["What does ref() do in dbt?","References another model; dbt builds the dependency graph and runs models in the right order."],
   ["Two built-in dbt tests?","unique and not_null (also accepted_values, relationships)."],
   ["T-SQL for LIMIT 10, COALESCE-like, and now?","SELECT TOP 10; ISNULL(x, default); GETDATE()."],
   ["What is a DAX measure in Power BI?","A calculation defined in the model, e.g. Total Sales = SUM(fact_sales[amount])."]
  ],
  feynman:"Explain what dbt adds on top of just having a folder of SQL files.",
  connect:"For each tool in your target job posts that you haven't used, write the one honest sentence you'll say in an interview." },

/* ======================= PHASE: JOB ======================= */
{ id:"j1", phase:"job", week:15, topic:"Interview", minutes:60, title:"Your portfolio project",
  predict:{ q:"Two candidates both list 'Airflow, Spark, Docker' on their resume. One has a GitHub project that uses them together, with a clear README. Who gets more interview questions answered confidently?",
    a:"The one with the project. They can explain real decisions they made ('I partitioned by date because…'), which is what interviewers dig for." },
  body:`
<p>One project that uses everything is worth more than ten tutorials. Here's the target architecture for <b>taxi-pipeline</b>, which you've been building since week 9:</p>
<pre class="flow">NYC taxi Parquet files
   │  extract.py (Python, requests/boto3)
   ▼
S3 raw/  ──►  transform (pandas → PySpark)  ──►  S3 clean/
   │                                              │
   │                       load.py (COPY / to_sql, idempotent by date)
   ▼                                              ▼
Airflow DAG (daily, retries, backfill)     PostgreSQL star schema
   │                                        fact_trips + dim_date, dim_zone, …
Docker compose (Airflow + Postgres + pipeline)    │
GitHub Actions (pytest on every push)             ▼
                                           SQL analysis / dbt models / Power BI</pre>
<h4>Checklist</h4>
<ol><li>Extract one or more months of trips; store raw files (locally first, S3 later).</li>
<li>Transform: clean (negative fares, impossible distances, nulls), add columns (duration, tip %).</li>
<li>Model: star schema with fact_trips and 3–4 dimensions.</li>
<li>Load idempotently, with data-quality checks.</li>
<li>Rewrite the heavy transform in PySpark.</li>
<li>Schedule with Airflow; prove a backfill works.</li>
<li>Run everything with docker compose.</li>
<li>Tests + GitHub Actions.</li>
<li>Five SQL analysis queries (busiest zones by hour, tip % by payment type, week-over-week trips with LAG…).</li>
<li>A README: diagram, how to run it, decisions and trade-offs, what you'd do next.</li></ol>
<h4>The README is your interview script</h4>
<p>Write <b>why</b>, not just what: "I chose Parquet because…", "Loads are idempotent because each run deletes and re-inserts its date", "I used a broadcast join for zones because the table is 265 rows". Those sentences are what you'll say out loud.</p>
<p>Examples of good projects: <a href="https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/projects" target="_blank" rel="noopener">Zoomcamp project gallery</a>.</p>`,
  ex:[
   { id:"j1e1", kind:"text", q:"Write your project's 2-minute pitch: the problem, the data, the architecture in one sentence, two technical decisions with their reasons, and one thing you'd improve.",
     sol:"Example: 'I built a daily pipeline that turns NYC taxi trip data — about 3 million trips a month — into a star schema for analysis. Airflow downloads the month's Parquet files to S3, a PySpark job cleans them and computes trip duration and tip percentage, and the result loads into PostgreSQL, all running in Docker with tests in GitHub Actions. Two decisions: loads are idempotent — each run deletes and reloads its own date in a transaction, so retries and backfills never duplicate data; and I broadcast the 265-row zone table in the Spark join to avoid a shuffle. Next I'd add incremental loading and alerting on data-quality failures.'",
     hints:["Problem → data → architecture in one sentence → two decisions with 'because' → one improvement.","Use real numbers (rows, runtime) where you can.","Practice saying it out loud with a timer."] }
  ],
  cards:[
   ["What should a portfolio README contain?","What it does, an architecture diagram, how to run it, decisions and trade-offs (the why), and next steps."],
   ["Why is one end-to-end project better than many tutorials?","It shows the tools working together and gives you real decisions to explain in interviews."]
  ],
  feynman:"Explain your whole project end to end in 2 minutes, out loud, with a timer. Then write down where you hesitated.",
  connect:"Which bullets on your resume does this project let you defend? Which still have no evidence behind them?" },

{ id:"j2", phase:"job", week:15, topic:"Interview", minutes:60, title:"Telling your story: STAR and resume numbers",
  predict:{ q:"Your resume says 'Improved pipeline performance by 25%'. The interviewer asks: 'How did you measure that?' What three things does a strong answer include?",
    a:"The baseline (what it was before), how and over what period it was measured, and what you specifically did to cause the change." },
  body:`
<p>Interviewers will pick any line on your resume and dig for five minutes. Prepare every bullet in advance.</p>
<h4>STAR</h4>
<ul><li><b>Situation</b>: the context, in 1–2 sentences. Team, project, what was wrong.</li>
<li><b>Task</b>: what <i>you</i> were responsible for.</li>
<li><b>Action</b>: the 2–3 concrete steps you took. Say "I", not "we". Name tools and decisions.</li>
<li><b>Result</b>: a measured outcome, then what you learned.</li></ul>
<h4>Defend every number (25%, 20%, 30% …)</h4>
<ol><li>What was the <b>baseline</b>? ("The job took 4 hours.")</li>
<li>What is it now? ("3 hours: that's the 25%.")</li>
<li>How was it <b>measured</b>, and over what period? ("Average runtime in Airflow over 30 days before and after.")</li>
<li>What exactly did <b>you</b> do? ("I replaced the row-by-row inserts with COPY and partitioned the table by date.")</li></ol>
<p>If you can't answer those four for a bullet, rewrite the bullet until you can. A smaller number you can defend beats a big one you can't.</p>
<h4>Questions to prepare</h4>
<ul><li>Tell me about yourself (90 seconds: background → what you've built → why this role).</li>
<li>Your most challenging project. A pipeline that failed and what you did. A disagreement with a teammate.</li>
<li>A time you found bad data. A time you had to learn something fast.</li>
<li>Why data engineering? Why this company?</li>
<li>Questions for them: "What does a typical pipeline look like here?", "How do you handle data quality?", "What would success look like in my first 90 days?"</li></ul>
<h4>Honesty about tools</h4>
<p>"I've used it at a basic level, in my project, to do X" is a good answer. Claiming deep experience and then failing a follow-up question is the fastest way to lose an interviewer's trust. Use the <i>Progress</i> tab to see which skills you can claim today.</p>`,
  ex:[
   { id:"j2e1", kind:"text", q:"Pick one bullet from your resume that has a number in it. Write it as a STAR story, including the baseline, how it was measured, and what you personally did.",
     sol:"Template:\nSituation: On the [team], our [pipeline/report] took [baseline] and [problem it caused].\nTask: I was responsible for [your part].\nAction: I [step 1 with tool], [step 2 with decision and why], [step 3].\nResult: [Metric] went from [before] to [after] ([X]%), measured by [how] over [period]. I learned [lesson] / next time I would [improvement].\nIf you can't fill in the baseline or the measurement, rewrite the bullet with a number you can defend.",
     hints:["Start with the result you claim, then work backwards: before, after, how measured.","Action is the longest part. Use 'I', name tools and decisions.","End with a lesson learned."] }
  ],
  cards:[
   ["What does STAR stand for?","Situation, Task, Action (what YOU did), Result (a measured outcome)."],
   ["Four questions to prepare for every number on your resume?","What was the baseline? What is it now? How and over what period was it measured? What exactly did you do?"],
   ["How do you answer about a tool you've only used a little?","Honestly: what you did with it, at what level, and what you understand it's for."]
  ],
  feynman:"Tell your 'tell me about yourself' answer out loud in 90 seconds. Write down what you'd change.",
  connect:"Go through every bullet on your resume. Mark each one: can defend / needs practice / rewrite." },

{ id:"j3", phase:"job", week:16, topic:"Interview", minutes:90, title:"Mock interviews and design questions",
  predict:{ q:"An interviewer says: 'Design a pipeline that gives the marketing team daily sales by region.' What should you do in your first two minutes, before drawing anything?",
    a:"Ask questions: How much data? How fresh must it be? What are the sources? Who uses it and how? What happens if it's late? Requirements first, then design." },
  body:`
<h4>What a technical round looks like</h4>
<ul><li><b>SQL</b> (almost always): 2–3 problems, usually including a window function. 30–45 minutes.</li>
<li><b>Python</b>: data manipulation (dicts, lists, pandas) or a small coding problem.</li>
<li><b>Data modeling</b>: "design the tables for X".</li>
<li><b>Pipeline / system design</b>: "design a pipeline for X".</li>
<li><b>Behavioral</b>: STAR stories and resume deep-dives.</li></ul>
<h4>Think out loud</h4>
<p>Interviewers grade your thinking, not just the answer. Restate the problem, state the grain, say your plan, write a simple version, then improve it. Silence is the enemy.</p>
<h4>Pipeline design framework</h4>
<ol><li><b>Requirements</b>: data volume, freshness (daily? real time?), sources, consumers, SLA (by when?).</li>
<li><b>Ingest</b>: batch files/API/database extract, or streaming (Kafka).</li>
<li><b>Store raw</b>: data lake (S3), partitioned by date, Parquet.</li>
<li><b>Transform</b>: SQL/dbt in the warehouse, or Spark for heavy jobs.</li>
<li><b>Model</b>: star schema at a stated grain.</li>
<li><b>Orchestrate</b>: Airflow, daily, retries, backfills, idempotent loads.</li>
<li><b>Quality and monitoring</b>: tests, row-count checks, alerts, logs.</li>
<li><b>Serve</b>: warehouse tables → dashboard (Power BI) or API.</li>
<li><b>Trade-offs</b>: cost vs freshness, simplicity vs scale. Say what you'd do differently at 100× the data.</li></ol>
<h4>Your mock interview plan</h4>
<ul><li>Week 16, twice: set a 45-minute timer. Do a <b>Practice</b> set with no hints, one SQL problem from DataLemur (Medium), one design question below, and three behavioral questions out loud.</li>
<li>Record yourself on your phone. Watching it back is uncomfortable and extremely effective.</li>
<li>Ask Claude Code in your study folder: "Run a mock interview" for a live interviewer.</li>
<li>Log every weak spot in Gaps, and redo those lessons.</li></ul>`,
  ex:[
   { id:"j3e1", kind:"text", q:"Design question: 'An online store wants a dashboard of yesterday's sales by region and product category, ready by 7 a.m. every day. The orders database has about 2 million orders a day.' Walk through the design framework.",
     sol:"Requirements: daily batch, ready by 07:00, ~2M orders/day, consumers = business users in a dashboard; ask about late-arriving orders and returns.\nIngest: at 01:00, extract yesterday's orders and order lines from the app database (incremental by updated_at or order_date) — read from a replica so the app isn't slowed.\nStore raw: S3 raw/orders/date=YYYY-MM-DD/ in Parquet.\nTransform: clean (test orders, duplicates, currency), join products and customers; Spark or warehouse SQL/dbt — 2M rows/day fits warehouse SQL fine.\nModel: fact_sales at order-line grain; dim_date, dim_product (category), dim_customer/dim_region (SCD2 if regions change).\nOrchestrate: Airflow DAG daily, retries, idempotent delete-insert per date, backfill support.\nQuality: row counts vs source, no null keys, revenue within normal range vs last week; alert on failure before 07:00.\nServe: aggregated table by date/region/category → Power BI.\nTrade-offs: batch is cheaper and enough for a 7 a.m. SLA; for live sales you'd add streaming with Kafka.",
     hints:["Start with requirements and questions, not tools.","Go in order: ingest → raw storage → transform → model → orchestrate → quality → serve.","End with trade-offs: what changes at 100× scale or if they want real time?"] }
  ],
  cards:[
   ["First step in a pipeline design question?","Clarify requirements: volume, freshness/SLA, sources, consumers, failure impact."],
   ["The pipeline design framework, in order?","Requirements → ingest → raw storage → transform → model → orchestrate → quality/monitoring → serve → trade-offs."],
   ["Why think out loud in interviews?","Interviewers grade your reasoning; silence hides it, and they can't help steer you."]
  ],
  feynman:"Explain your design for the daily sales dashboard to a non-technical manager in five sentences.",
  connect:"Which part of an interview scares you most? Schedule one extra practice session on exactly that." }
];
