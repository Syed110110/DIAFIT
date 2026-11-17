# DIAFIT 🩺

**A multi-role diabetes care coordination platform for elderly and dependent patients.**

🔗 **Live demo:** [diafit-theta.vercel.app](https://diafit-theta.vercel.app)

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat&logo=twilio&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=flat&logo=capacitor&logoColor=white)

## 💡 The problem

In many Indian households, diabetes care for an elderly patient is shared between a local caregiver, a family member living in another city, and a doctor consulted now and then. This coordination usually happens over calls and messages, with no shared record, no accountability trail, and no structured way to spot a missed dose or an abnormal reading early.

DIAFIT treats this as a **coordination problem, not a single-user logging problem**.

## ✨ Features

- **Role-based access:** Patient, caregiver, family coordinator, doctor and admin, each with their own views and permissions
- **Care team management:** Approved access grants between patients and their care team
- **Care alerts:** Alerts for abnormal readings, with optional WhatsApp notifications (explicit opt-in)
- **SOS button:** One-tap emergency alert with Twilio integration
- **Care logs and audit trail:** A record of who logged or changed what
- **Clinical report:** A consolidated report for doctor consultations
- **Diet planner and nutrition tracker**
- **Exercise tracker with videos**
- **Streak badges** to encourage consistency
- **AI assistant** page
- **Android app** built with Capacitor

## 🏗 Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Mobile | Capacitor (Android) |
| Backend | Node.js, TypeScript |
| Databases | PostgreSQL (identities, roles, care data) and MongoDB (nutrition, exercise, diet plans) |
| Messaging | Twilio (WhatsApp and emergency alerts) |
| Hosting | Vercel (frontend) |

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL and MongoDB
- A Twilio account (optional, only for WhatsApp alerts)

### Setup

```bash
git clone https://github.com/Syed110110/DIAFIT.git
cd DIAFIT

# Frontend
cp .env.example .env
npm install
npm run dev

# Backend
cd backend
cp .env.example .env     # fill in your own values
npm install
npm run db:migrate
npm run dev
```

See [`backend/CAPSTONE_AUTH_SETUP.md`](backend/CAPSTONE_AUTH_SETUP.md) for the full authentication and database setup.

## 📸 Screenshots

<!-- Add 4-5 screenshots here, e.g. -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

## 🗺 Roadmap

- [ ] Adherence-risk prediction model (scikit-learn)
- [ ] Voice-based logging for low-literacy caregivers
- [ ] Premium family tier (payment sandbox)
- [ ] Wider automated test coverage

## 📚 Documentation

- [Architecture](DiaFit-Architecture.md)
- [Project structure](DiaFit-Project-Structure.pdf.md)

## 👤 Author

**Syed Mohd Mehdi** · MCA final-year student
[LinkedIn](https://www.linkedin.com/in/syed-mohd-mehdi-b69536238) · mohdsyed110110@gmail.com