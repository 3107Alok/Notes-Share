# 📚 EduNex – Notes Sharing Platform

EduNex is a modern **Notes Sharing Web Application** designed for students to upload, explore, and manage academic resources like notes, PYQs, and syllabus — all in one place.

It includes **AI-based validation**, **admin approval system**, and a **clean UI with smooth animations**.

---

## 🚀 Features

### 🔐 Authentication

* Secure login/signup using **AWS Cognito**
* Token-based authentication system
* Role-based access (User / Admin)

---

### 📄 Notes Management

* Upload notes (Typed / Handwritten)
* Organized by:

  * Year → Subject → Unit
* Auto file naming & cleaning
* AI-based validation before approval
* Preview & download support

---

### 🤖 AI Integration

* AI checks if uploaded notes match syllabus
* Gives score (out of 10)
* Rejects irrelevant uploads

---

### 🛡️ Admin Panel

* View pending uploads
* Approve / Reject notes
* Add comments
* Delete notes

---

### 📘 Syllabus System

* Upload syllabus per subject
* Automatically linked with notes
* Displayed inside UI

---

### 📚 PYQ Section

* Upload Previous Year Questions
* Filter by:

  * Subject Code
  * Exam Type (AKTU / MSE / ESE)
* Preview & download support

---

### 🎨 UI/UX

* Responsive design
* Dark theme with glassmorphism
* Smooth animations
* Toast notifications
* Card-based layout

---

## 🛠️ Tech Stack

### Frontend

* HTML, CSS, JavaScript

### Backend (AWS)

* AWS Lambda
* API Gateway
* DynamoDB
* S3

### Authentication

* AWS Cognito

---

## 📂 Project Structure

```
EduNex/
│── index.html
│── style.css
│── script.js
│── README.md
```

---

## ⚙️ How It Works

1. User logs in via Cognito
2. Uploads notes / PYQs / syllabus
3. File goes to backend (Lambda + S3)
4. AI evaluates content
5. Admin approves/rejects
6. Approved notes become visible

---

## 👨‍💻 Contributors

* Alok Singh
* Amit Kumar

---

## 📌 Future Improvements

* Search functionality
* Rating system
* Comments/discussion
* Mobile app

---

## 📜 License

This project is for educational purposes.
