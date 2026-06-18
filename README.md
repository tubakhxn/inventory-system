# InvenFlow — Inventory & Order Management System

A full-stack Inventory & Order Management System built with **FastAPI**, **React**, **PostgreSQL**, and **Docker**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Frontend | React + Vite + Tailwind CSS |
| Database | PostgreSQL |
| Container | Docker + Docker Compose |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Features

- ✅ Product management with **unique SKU** enforcement
- ✅ Customer management with **unique email** enforcement
- ✅ Order creation with **automatic stock deduction**
- ✅ Orders **blocked** when stock is insufficient
- ✅ Stock **restored** when order is cancelled/deleted
- ✅ Low stock alerts dashboard
- ✅ Full CRUD for Products, Customers, Orders
- ✅ Dashboard with real-time stats
- ✅ Fully containerized with Docker Compose

---

## Local Development (Docker)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/inventory-system.git
cd inventory-system
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env if you want custom passwords
```

### 3. Run everything with Docker Compose
```bash
docker-compose up --build
```

### 4. Access the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### Stop
```bash
docker-compose down
```

### Stop and delete database
```bash
docker-compose down -v
```

---

## Local Development (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set env var
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Set env var (create .env file)
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

---

## Deployment Guide

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Inventory & Order Management System"
git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
git push -u origin main
```

---

### Step 2 — Deploy Backend on Render (Free)

1. Go to https://render.com → Sign up / Login
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `inventory-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:
   - `DATABASE_URL` = (get this from Render PostgreSQL below)
6. Click **Create Web Service**

#### Create PostgreSQL on Render
1. Click **New** → **PostgreSQL**
2. Name it `inventory-db`
3. Copy the **Internal Database URL**
4. Paste it as `DATABASE_URL` in your backend service env vars

Your backend URL will be: `https://inventory-backend-xxxx.onrender.com`

---

### Step 3 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → Sign up / Login
2. Click **New Project** → Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL` = `https://inventory-backend-xxxx.onrender.com`
5. Click **Deploy**

Your frontend URL will be: `https://inventory-system-xxxx.vercel.app`

---

### Step 4 — Push Docker Image to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build backend image
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
```

Your Docker Hub image: `https://hub.docker.com/r/YOUR_USERNAME/inventory-backend`

---

## Submission URLs

| Item | URL |
|------|-----|
| GitHub Repository | `https://github.com/YOUR_USERNAME/inventory-system` |
| Docker Hub Image | `https://hub.docker.com/r/YOUR_USERNAME/inventory-backend` |
| Frontend Hosted URL | `https://inventory-system-xxxx.vercel.app` |
| Backend API Hosted URL | `https://inventory-backend-xxxx.onrender.com` |

---

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| POST | `/api/products/` | Create product (unique SKU) |
| GET | `/api/products/{id}` | Get product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/products/low-stock` | Get low stock products |
| GET | `/api/products/stats/dashboard` | Dashboard stats |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/` | List all customers |
| POST | `/api/customers/` | Create customer (unique email) |
| GET | `/api/customers/{id}` | Get customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List all orders |
| POST | `/api/orders/` | Create order (validates stock) |
| GET | `/api/orders/{id}` | Get order details |
| PUT | `/api/orders/{id}` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order (restores stock) |

---

## Business Rules Implemented

1. **Unique SKUs** — Duplicate SKU returns 409 Conflict
2. **Unique Emails** — Duplicate customer email returns 409 Conflict  
3. **Stock Validation** — Order creation checks all items have sufficient stock before processing
4. **Atomic Stock Deduction** — Stock is only deducted after all validations pass
5. **Stock Restoration** — Cancelling or deleting an order restores stock automatically
6. **Zero-stock block** — Out-of-stock products are disabled in the order form UI
