# 🏡 Pleasant Homes — PG Management Portal

Pleasant Homes is a premium, responsive full-stack PG (Paying Guest) and Hostel management portal. It automates building setup, occupant management, bed vacancy logs, curfew enforcement, rent invoices, and secure gate visitor OTP authorizations.

---

## 🚀 Quick Start (Local Development)

### 📋 Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)

### 🛠️ Installation & Setup
1. **Clone or Extract** the project directory and open a terminal inside the root directory `pg-management-system (1)/`.
2. **Install Node Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (you can copy `.env.example`) and fill in your Supabase connection parameters:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_or_service_key
   DATABASE_URL=your_postgresql_database_url
   JWT_SECRET=supersecretjwtkey
   ```
   *Note: If no Supabase URL/Key is provided, the server automatically boots using the local database fallback located at `backend/data/local-db.json`.*

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
5. **Open in Browser**:
   Navigate to [http://localhost:5000/login.html](http://localhost:5000/login.html).

---

## 📖 User Workflow Manual
For a complete, step-by-step user onboarding and operation manual, please refer to the detailed [USER_MANUAL.md](USER_MANUAL.md) file in this directory.

---

## 🛠️ Main Features
- **Property Wizard**: 6-step wizard to register buildings, rooms, structures, cover images, and location GPS maps.
- **Dynamic Dashboard**: Responsive metrics, live bed occupancy gauges, and curfew alarms filtered by property.
- **Visitor OTP Gatekeeper**: Random OTP generator, interactive in-card modal verifying feedback, and check-out logs.
- **Financial Ledgers**: Invoicing logs, manual payment records, and payment method summaries.
