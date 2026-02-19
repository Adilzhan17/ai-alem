# 🏰 Qal.ai — AI Real Estate Platform

![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**Qal.ai** is a next-generation real estate marketplace for Kazakhstan, powered by AI. It features immersive 360° virtual tours, smart property matching, and a seamless user experience for buyers, sellers, and agents.

---

## ✨ Key Features

### 🔍 Immersive Discovery

- **360° Virtual Tours**: Explore properties remotely with interactive panorama viewers.
- **AI-Powered Search**: Smart filtering and recommendations (Coming Soon).
- **Interactive Maps**: Location-based property discovery.

### 📸 Media & Listings

- **High-Res Image Uploads**: Drag-and-drop interface for property photos.
- **Virtual Staging**: AI-enhanced visualization of potential interior designs.
- **Detailed Specifications**: comprehensive property details including floor plans, amenities, and more.

### 🛠️ Technology Stack

| Component          | Technology                                                                                                                                                                                          | Description                                           |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Frontend**       | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) | Built with Vite, TailwindCSS, and Shadcn UI.          |
| **Backend**        | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)                        | High-performance async API with Pydantic validation.  |
| **Database**       | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)                                                                                            | Robust relational database for reliable data storage. |
| **Infrastructure** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)              | Containerized deployment with Nginx reverse proxy.    |
| **DevOps**         | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)                                                                                | Automated CD pipeline to production server.           |

---

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose**
- **Node.js** (v18+) & **Python** (v3.11+) _(for local dev without Docker)_

### 🐳 Run with Docker (Recommended)

The easiest way to run the full stack (Frontend + Backend + DB).

```bash
# Clone the repository
git clone https://github.com/your-repo/ai-alem.git
cd ai-alem

# Create environment file
cp backend/.env.example backend/.env

# Start services
docker-compose up -d --build
```

- **Frontend**: [http://localhost:8090](http://localhost:8090)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 💻 Local Development

#### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Deployment

The project uses **GitHub Actions** for Continuous Deployment.
Every push to `main` triggers a workflow that:

1.  Copies code to the production server (`31.44.4.37`).
2.  Builds optimized Docker images.
3.  Deploys the containers with zero downtime.

### Server Configuration

- **Cloudflare Tunnel**: Securely exposes the app without opening ports.
  - Frontend: `https://qal.perricheno.ru` -> `http://172.17.0.1:8090`
  - Backend: `https://api.perricheno.ru` -> `http://172.17.0.1:8000`
- **Data Persistence**: Docker volumes ensure `uploads/` and DB data survive restarts.

---

## 📚 API Documentation

The API is fully documented with **Swagger UI**.
Visit `/docs` on the backend URL to explore endpoints for:

- `Auth` (Login/Register)
- `Listings` (CRUD, Search, Uploads)
- `Projects` (New Developments)
- `Users` (Profile Management)

---

<div align="center">
  <sub>Built with ❤️ by the Qal.ai Team</sub>
</div>
