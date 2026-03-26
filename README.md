🚀 EduNexa – Notes Sharing Web App (AWS)
📌 About the Project

EduNexa is a cloud-based Notes Sharing Web Application where students can upload academic notes.
An admin reviews the notes before approving them, ensuring only high-quality content is shared.

🌟 Features
👤 User Features
📤 Upload notes (PDF, DOC)
📚 View notes (Semester → Subject → Unit)
📂 Multiple files per unit
🔍 Basic search functionality
📥 Download notes
🛡 Admin Features
✅ Approve notes
❌ Reject notes
🗑 Delete notes
📌 Manage pending uploads
🧱 Tech Stack
🌐 Frontend
HTML
CSS (Dark Theme + Animations)
JavaScript
☁️ Backend (AWS Serverless)
AWS Lambda (Python - boto3)
API Gateway (REST APIs)
DynamoDB (Database)
S3 (Storage + Hosting)
Cognito (Authentication - OTP)
🏗 Architecture

User → Frontend (S3 Hosting)
→ API Gateway
→ Lambda Functions
→ DynamoDB + S3

🔗 API Endpoints
/upload → Upload notes
/notes → Get approved notes
/pending → Get pending notes
/approve → Approve note
/reject → Reject note
/delete → Delete note
🔐 Authentication
AWS Cognito User Pool
Email OTP verification
Role-based access (Admin/User)
🚀 Deployment
Frontend
Hosted on AWS S3 (Static Website)
Backend
AWS Lambda + API Gateway
📂 Project Structure
Note_Share/
│── index.html
│── style.css
│── script.js
💡 Future Improvements
👤 User profile & upload history
📊 Analytics dashboard
🤖 AI-based quiz generator
📁 PYQ section
👨‍💻 Authors
Alok Singh
Amit Kumar
⭐ Conclusion

EduNexa is a scalable, serverless web application built using AWS services.
It demonstrates real-world cloud architecture with secure authentication and structured content management.
