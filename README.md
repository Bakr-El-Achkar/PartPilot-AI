# Vehnexa — PartPilot-AI

Vehnexa is a full-stack automotive marketplace and AI-assisted vehicle diagnostic platform. It combines automotive e-commerce, personal vehicle management, fitment-aware products, customer accounts, order processing, an administration dashboard, and an AI Mechanic with an interactive 3D diagnostic experience.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [AI Mechanic](#ai-mechanic)
- [3D Diagnostic Visualization](#3d-diagnostic-visualization)
- [Database](#database)
- [Authentication and Authorization](#authentication-and-authorization)
- [Order Safety and Idempotency](#order-safety-and-idempotency)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Development Guidelines](#development-guidelines)
- [Asset Attribution](#asset-attribution)

---

## Project Overview

Vehnexa was built as a modern automotive platform where customers can manage their vehicles, shop for automotive products, place orders, receive notifications, review delivered purchases, and use an AI-assisted diagnostic system.

The project is separated into two main applications:

- **Frontend:** Next.js customer and admin web application
- **Backend:** FastAPI REST API connected to MongoDB Atlas and the AI gateway

The frontend never connects directly to MongoDB. All business rules, authorization checks, database access, order processing, and AI communication are handled through the backend.

---

## Main Features

### Customer Features

#### Storefront

Customers can:

- Browse automotive products
- Search products
- Filter and sort products
- Browse categories and brands
- Open product detail pages
- View stock information
- View vehicle-fitment information
- View verified customer reviews

#### Authentication

The application supports:

- Customer registration
- Customer login
- JWT-based authentication
- Protected routes
- Logout
- Role-based access control

#### Garage

Authenticated customers can store and manage vehicles in their personal Garage.

Vehicle information can include:

- Year
- Make
- Model
- Engine
- Transmission
- Nickname
- Vehicle image
- Active vehicle status

The active vehicle can be used by other features such as product compatibility and the AI Mechanic.

#### Wishlist

Customers can:

- Add products to their wishlist
- Remove products from their wishlist
- View saved products

#### Shopping Cart

Customers can:

- Add products to the cart
- Remove products
- Update quantities
- View totals
- Continue to checkout

#### Saved Addresses

Customers can:

- Add addresses
- Update addresses
- Delete addresses
- Use saved addresses during checkout

Only real user-entered address information is used.

#### Checkout

Checkout supports:

- Saved addresses
- Manually entered addresses
- Optional active vehicle association
- Cash on delivery
- Server-side stock validation
- Order creation
- Duplicate-request protection using idempotency

#### Orders

Customers can:

- View order history
- View individual order details
- View purchased products
- View order status
- Review eligible delivered products

#### Reviews

A customer can review a product only after purchasing it through a delivered order.

Reviews:

- Are linked to verified purchases
- Become active/public after submission
- Can later be hidden or restored by an administrator

#### Notifications

Customers have a notification inbox with support for:

- Unread notifications
- Marking one notification as read
- Marking all notifications as read
- Internal application navigation

---

## Administrator Features

The admin interface includes:

- Overview / Dashboard
- Orders
- Products and Inventory
- Categories
- Brands
- Vehicle Fitments
- Users
- Reviews
- AI Sessions
- Notifications

Administrators can manage marketplace data while backend authorization rules protect customer-specific data and actions.

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Three.js
- React Three Fiber
- Drei

### Backend

- Python
- FastAPI
- Pydantic
- PyMongo
- JWT authentication
- Argon2 password hashing

### Database

- MongoDB Atlas

### AI

- Ollama
- Qwen model
- FastAPI AI gateway
- Tailscale for protected remote connectivity

### Deployment

- Vercel
- MongoDB Atlas
- External AI gateway

---

## System Architecture

```text
Customer / Admin Browser
          |
          v
   Next.js Frontend
          |
          | REST API
          v
   FastAPI Backend
       /        \
      /          \
     v            v
MongoDB Atlas   AI Gateway
                   |
                   v
                 Ollama
                   |
                   v
                Qwen LLM
```

### Request Flow

1. The user interacts with the Next.js frontend.
2. The frontend sends HTTP requests to the FastAPI backend.
3. The backend validates authentication and business rules.
4. The backend reads or writes data in MongoDB Atlas.
5. AI-related requests are forwarded securely to the AI gateway.
6. The backend returns structured responses to the frontend.

---

## Project Structure

```text
PartPilot-AI/
│
├── backend/
│   ├── api/
│   │   └── index.py
│   │
│   ├── app/
│   │   ├── core/
│   │   ├── dependencies/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   │   └── models/
│   ├── tests/
│   ├── package.json
│   └── next.config.ts
│
├── .gitignore
└── README.md
```

---

## Frontend

The frontend is located in:

```text
frontend/
```

It uses the Next.js App Router.

### Important Directories

#### `frontend/app/`

Contains application routes and pages, including Home, Shop, Product Details, Garage, Account, Wishlist, Saved Addresses, Cart, Checkout, Orders, Notifications, AI Mechanic, and Admin pages.

#### `frontend/components/`

Contains reusable React components, including shared customer navigation, authentication guards, notification components, AI Mechanic components, and 3D diagnostic components.

#### `frontend/lib/`

Contains shared frontend logic such as API clients, authentication helpers, cart utilities, order utilities, vehicle utilities, and AI Mechanic API helpers.

#### `frontend/public/models/`

Contains 3D assets used by the diagnostic visualization.

---

## Backend

The backend is located in:

```text
backend/
```

The main FastAPI application is:

```text
backend/app/main.py
```

The Vercel serverless entry point is:

```text
backend/api/index.py
```

### Backend Layers

#### Routes

```text
backend/app/routes/
```

Defines REST API endpoints.

#### Services

```text
backend/app/services/
```

Contains business logic.

#### Repositories

```text
backend/app/repositories/
```

Handles MongoDB operations.

#### Schemas

```text
backend/app/schemas/
```

Defines Pydantic request and response models.

#### Dependencies

```text
backend/app/dependencies/
```

Contains reusable authentication and authorization dependencies.

#### Core

```text
backend/app/core/
```

Contains shared configuration such as database configuration, security helpers, JWT configuration, AI configuration, AI safety policies, and shared component registries.

---

## AI Mechanic

The AI Mechanic allows authenticated customers to describe vehicle symptoms in natural language.

Example:

```text
When I drive over bumps, I hear a clunking noise from the
front-left wheel area, and sometimes the steering feels slightly loose.
```

The system can return structured information such as:

- Possible causes
- Relevant vehicle components
- Safety level
- Diagnostic observations
- Recommended checks
- Compatible product suggestions when appropriate

Diagnostic safety levels include:

```text
normal
caution
urgent
```

The application does not rely on fabricated confidence percentages.

### AI Architecture

```text
Vehnexa Frontend
       |
       v
Vehnexa FastAPI Backend
       |
       v
Protected AI Gateway
       |
       v
Ollama
       |
       v
Qwen Model
```

The AI gateway is protected by a private token shared only between the backend and gateway.

AI secrets must never be committed to Git.

---

## 3D Diagnostic Visualization

Vehnexa includes an interactive 3D vehicle diagnostic stage.

It uses:

- Three.js
- React Three Fiber
- Drei
- Framer Motion

The visualization can:

- Move the diagnostic camera
- Focus on relevant vehicle regions
- Isolate components or assemblies
- Apply x-ray-style visual effects
- Animate component separation
- Display diagnostic markers
- Highlight the area currently being analyzed

Some diagnoses use a representative assembly when the 3D asset does not contain a separately named mesh for the exact real-world component.

The 3D model is a visualization aid and is not presented as an exact digital twin of the customer's actual vehicle.

---

## Database

Vehnexa uses MongoDB Atlas.

The database stores information such as:

- Users
- Vehicles
- Products
- Categories
- Brands
- Fitments
- Orders
- Reviews
- Notifications
- AI diagnostic sessions
- Saved addresses
- Wishlist data

Database credentials are provided using environment variables and must never be hardcoded in source files.

---

## Authentication and Authorization

Vehnexa uses JWT-based authentication.

Passwords are stored using secure password hashing.

The application contains two main roles:

```text
customer
admin
```

### Customer Access

Authenticated customers can access areas such as Account, Garage, Wishlist, Saved Addresses, Orders, Cart, Checkout, AI Mechanic, and Notifications.

### Administrator Access

Administrators use the:

```text
/admin
```

area.

Customer and administrator routes are protected separately.

Authorization is enforced by the backend, not only by the frontend.

---

## Order Safety and Idempotency

Order creation includes protection against duplicate checkout submissions.

Checkout requests use an:

```text
Idempotency-Key
```

The backend validates the request and prevents the same valid checkout attempt from creating multiple orders or decrementing stock multiple times.

Behavior:

- Same key + same payload → existing order can be returned
- Same key + changed payload → conflict response
- New successful checkout → new key is used afterward

Stock changes and order creation use MongoDB transactional logic where supported.

---

## Installation

### Requirements

Install:

- Git
- Python
- Node.js
- npm
- MongoDB Atlas account

For AI development, an Ollama-compatible AI service is also required.

### Clone the Repository

```bash
git clone <repository-url>
cd PartPilot-AI
```

---

## Backend Installation

Move into the backend directory:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

## Frontend Installation

From the repository root:

```powershell
cd frontend
npm install
```

---

## Environment Variables

Real secret values must never be committed to GitHub.

### Backend Environment Variables

The backend uses variables including:

```env
MONGODB_URI=
MONGODB_DB_NAME=partpilot_db

JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

CARSXE_API_KEY=

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

OLLAMA_HOST=
OLLAMA_MODEL=
OLLAMA_TIMEOUT_SECONDS=240

VEHNEXA_AI_PROXY_TOKEN=
```

Sensitive values include:

```text
MONGODB_URI
JWT_SECRET_KEY
CARSXE_API_KEY
VEHNEXA_AI_PROXY_TOKEN
```

Never place real values for these variables in the README, source code, or Git history.

### Frontend Environment Variable

The frontend uses:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

In production, it must point to the deployed backend URL.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.example
```

---

## Running Locally

The backend and frontend should run in separate terminals.

### Start the Backend

```powershell
cd backend

.\.venv\Scripts\Activate.ps1

python -m uvicorn app.main:app `
  --host 127.0.0.1 `
  --port 8000 `
  --reload
```

Local backend:

```text
http://127.0.0.1:8000
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

### Start the Frontend

In another terminal:

```powershell
cd frontend
npm run dev
```

Local frontend:

```text
http://localhost:3000
```

---

## Testing

### Backend

From `backend/` run:

```powershell
python -m pytest -q
```

A specific test file can be executed with:

```powershell
python -m pytest -q tests/test_auth_routes.py
```

### Frontend

Run frontend verification in this order.

#### 1. TypeScript

```powershell
npx tsc --noEmit --pretty false
```

#### 2. ESLint

```powershell
npm run lint
```

#### 3. Production Build

```powershell
npm run build
```

If an earlier step fails, fix that error before continuing.

---

## Deployment

Vehnexa uses separate Vercel projects for the backend and frontend.

### Backend Deployment

Vercel project root:

```text
backend
```

Framework:

```text
FastAPI
```

Production environment variables must be configured in Vercel.

The backend health endpoint is:

```text
/api/health
```

### Frontend Deployment

Vercel project root:

```text
frontend
```

Framework:

```text
Next.js
```

The frontend production environment must contain:

```text
NEXT_PUBLIC_API_BASE_URL
```

and it must point to the deployed backend.

The backend CORS configuration must also include the deployed frontend origin.

### Command-Line Deployment

The Vercel CLI can be used from the appropriate project directory:

```powershell
npx vercel@latest link
npx vercel@latest project inspect --non-interactive
npx vercel@latest deploy --prod
```

---

## Security Notes

Never commit secrets to Git.

Sensitive information includes:

- MongoDB credentials
- JWT signing secret
- AI gateway token
- External API keys
- User passwords

Environment files must remain excluded through `.gitignore`.

Additional security rules:

- Do not disable TLS certificate validation to solve database connectivity issues
- Do not expose admin operations without authorization
- Do not trust frontend validation alone
- Validate important permissions and business rules on the backend
- Never expose private tokens in screenshots, commits, logs, or documentation
- Rotate any secret that may have been exposed

---

## Development Guidelines

Future developers should follow these rules when modifying Vehnexa:

1. Preserve existing API behavior unless an intentional API change is required.
2. Keep authentication and authorization enforced on the backend.
3. Do not invent or fake customer data, vehicle data, locations, AI confidence, product recommendations, or order information.
4. Keep all secrets in environment variables.
5. Add or update tests when backend business logic changes.
6. Run verification before committing changes.
7. Do not commit temporary files, logs, backups, virtual environments, or build directories.
8. Keep database operations inside repositories where possible.
9. Keep business logic inside services instead of UI components.
10. Review existing code before changing shared architecture.

Important areas to review before large changes:

```text
backend/app/routes/
backend/app/services/
backend/app/repositories/
backend/app/core/
frontend/lib/
frontend/components/
```

---

## Asset Attribution

The diagnostic development vehicle asset currently used by the project is based on:

**Car Concept — KhronosGroup glTF Sample Assets**

License:

**Creative Commons Attribution 4.0 (CC BY 4.0)**

The asset is used for diagnostic and development visualization and should not be interpreted as an exact representation of a customer's real vehicle.

Third-party packages and assets remain subject to their respective licenses.

---

## Project Status

Vehnexa currently contains substantial functionality across:

- Automotive marketplace
- Customer accounts
- Garage and vehicle management
- Shopping cart
- Checkout
- Orders
- Reviews
- Notifications
- Administration
- AI-assisted diagnostics
- 3D diagnostic visualization

The project is actively developed, so future developers should review the current implementation and tests before making architectural changes.

---

## Vehnexa

**Automotive marketplace, vehicle management, and AI-assisted diagnostics in one platform.**
