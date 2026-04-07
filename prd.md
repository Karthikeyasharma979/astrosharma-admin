# Product Requirements Document (PRD)
**Project Name:** AstroSharma Admin Dashboard
**Document Version:** 1.0
**Target Audience:** Administrators of the AstroSharma platform.

## 1. Introduction
### 1.1 Purpose
The purpose of the AstroSharma Admin Dashboard is to provide a secure, centralized interface for the administrator to access, view, and manage customer data stored in the MongoDB database. This includes astrology consultation bookings, marriage matching requests, and general contact inquiries.

### 1.2 Scope
This project will consist of an independent frontend SPA (Single Page Application) and a new, dedicated backend server. This backend will provide authenticated endpoints for the dashboard and will independently manage its own logic while connecting to the same MongoDB database.

---

## 2. Technical Stack Recommendations
- **Frontend Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS (for rapid and beautiful UI blocks)
- **Routing:** React Router DOM
- **Data Fetching:** Axios or Fetch API
- **State Management:** React Context or Zustand (if needed)
- **Icons:** Lucide React or React Icons

---

## 3. High-Level Architecture
1. **Frontend App (`admin-dashboard` / `user` folder):** 
   - A new project running independently (e.g., on `http://localhost:5174`).
2. **Backend Server (`admin-server`):** 
   - A new, dedicated Express.js server will be created specifically for the Admin Dashboard.
3. **Database:** 
   - Existing MongoDB instance (collections: `bookings`, `contacts`, new `admins` collection).

---

## 4. Key Features & Requirements

### 4.1 Authentication & Security
- **Admin Login:** Dedicated login page requiring email and password.
- **JWT Authorization:** The backend will issue a JSON Web Token (JWT) upon successful login. The frontend must send this token in the `Authorization` header for all subsequent API requests.
- **Protected Routes:** All dashboard pages (except login) must be inaccessible to unauthenticated users.

### 4.2 Dashboard Overview (Home)
- **Quick Statistics:** 
  - Total Consultation Bookings
  - Total Contact Inquiries
  - Recent Activity Feed (last 5 bookings/contacts)

### 4.3 Bookings Management System
- **Data Table view:** A paginated or scrollable table displaying all bookings.
  - Columns: Date submitted, Client Name, Consultation Type, Phone, Email, Payment Status (Razorpay UTR).
- **Booking Detail View:** A modal or separate page showing comprehensive details:
  - **Client Info:** Name, DOB, Time, Place of Birth.
  - **Extra Details (for Marriage Match):** Details of Boy 1/2 and Girl 1/2.
  - **Payment Info:** Razorpay order ID, signature, payment ID, amount.
- **Filtering capability:** Filter by Consultation Type (e.g., Marriage Match vs General).

### 4.4 Contact Form Inquiries
- **Data Table view:** A table to list all messages received via the `/api/contact` endpoint.
  - Columns: Name, Email, Date, Message Preview.
- **Message Detail View:** Ability to read the full message and see if a file/attachment was provided.

---

## 5. API Endpoints Required (To be added to existing backend)

| HTTP Method | Endpoint | Description | Auth Required? |
|-------------|----------|-------------|----------------|
| `POST` | `/api/admin/login` | Authenticate admin and return JWT | No |
| `GET` | `/api/admin/bookings` | Fetch all bookings from DB | Yes |
| `GET` | `/api/admin/contacts` | Fetch all contact messages from DB | Yes |

---

## 6. Development Milestones
1. **Phase 1: Project Setup.** Initialize the new folder and Vite project, install dependencies (Tailwind, React Router).
2. **Phase 2: Backend Setup & APIs.** Initialize the `admin-server` folder, setup Express, add the Admin Mongoose model, JWT login generation, and the data-fetching endpoints.
3. **Phase 3: Frontend Views.** Build the Login screen, Dashboard layout (Sidebar & Header), and Data Tables.
4. **Phase 4: Integration & Testing.** Connect the frontend to the backend APIs, handle JWT storage (e.g., in `localStorage`), and test data retrieval.

---
*End of Document*
