# 📖 Pleasant Homes PG Management System — User Manual

Welcome to the **Pleasant Homes PG Management System**. This user manual will guide you step-by-step (inch by inch) through the system login, dashboard analytics, property setup, room management, occupant check-in, rent collection, and visitor log tracking.

---

## 🔐 Step 1: System Authentication (Login)

To access the administrative dashboard, navigate to the portal login page in your browser.

- **Local URL**: `http://localhost:5000/login.html`
- **Default Portals**: Both Admin and Staff log in from this unified interface.

### Credentials Table
| Role | Login Email | Login Password | Access Permissions |
| :--- | :--- | :--- | :--- |
| **Property Admin** | `pleasanthomes@pg.com` | `pg@123` | Full access (Properties, Rooms, Finance, Staff, Logs) |
| **Property Staff** | `pleasanthomes@pg.com` | `staff@123` | Operational access (Complaints, Curfew, Visitor Logs) |

*Instructions:*
1. Type the Email address matching your role.
2. Enter the corresponding Password.
3. Toggle "Remember me" if using a trusted personal computer.
4. Click **Sign In** to authenticate.

---

## 📊 Step 2: Dashboard Navigation & Property Selector

Once authenticated, you will land on the **Management Dashboard** (`management-dashboard.html`).

> [!IMPORTANT]  
> **Property Selection First**:  
> At the top-left of the page header, locate the **Property Selector Pill** (showing a building icon). Always ensure you select the correct property (or "All Properties") from the dropdown list. All metrics, bed vacancies, rent numbers, and quick actions will dynamically filter to scope to that specific property.

### 📈 Dashboard Analytics Cards Explained
The top row of the dashboard presents a high-level summary of your selected operations:
1. **Occupancy Rate**: Displays the percentage of filled capacity along with a sub-label showing the exact count of occupied beds.
2. **Total Rooms**: Shows the overall count of room units configured and active across the selected property.
3. **Collected Revenue**: Reflects the actual monetary volume received during the current calendar month.
4. **Pending Rent**: Highlights outstanding, overdue, or unpaid rent charges from occupants.

### 🛏️ Bed Inventory Breakdown
The second row details your capacity layout:
- **Occupied Beds**: Shows checking-in resident count.
- **Available Beds**: Reflects vacant beds prepped for check-in.
- **Occupancy Progress Bar**: A visual bar displaying occupancy percentages (green = high occupancy, blue/grey = vacancies).
- **Facilities Indicators**: Live status indicators for WiFi, AC systems, Power Generators, and CCTV feeds.

### ⚡ Quick Actions Panel
Administrators can perform common daily operations directly from this card:
- **Check-in New Tenant**: Directs to the resident registration panel.
- **File Complaint**: Opens the form to log issues raised by residents.
- **Log Visitor**: Initiates visitor pre-registration and OTP code generation.
- **Record Payment**: Directs to the rent ledger to register monthly cash/UPI collections.

### 📜 Notices, Complaints, & System Audit Trail Summary
The bottom section of the dashboard aggregates active summaries:
- **Notice Board**: Displays the latest broadcasts with Priority levels (Urgent, General).
- **Complaints Overview**: Shows counts of Open, In Progress, and Resolved resident tickets.
- **System Audit Trail**: Logs critical actions executed in the system (e.g. *Tenant Check-in*, *Room Status Updates*, *Payments Recorded*).

---

## 🏢 Step 3: Managing and Adding Properties

To manage PG buildings, click **Properties** in the sidebar. 

### 🔍 Viewing Property Details
Clicking on any **Property Card** navigates you to the **Property Detail View** (`property-detail.html`). This page displays:
- **Metrics Summary**: Active tenants, room occupancy ratio, overall bed occupancy, and monthly revenue ledger metrics.
- **Location Mapping**: Street address, nearby landmarks, and an embedded coordinate map.
- **Amenities**: Complete checked list of building services.
- **Room List**: Table showing all rooms configured for this property with bed occupancy rates.
- **Edit Details**: Allows wardens to modify description, cover banner, and contact emails.

### ➕ Creating a Property (6-Step Setup Wizard)
Click the **Add Property** button at the top-right of the Properties screen to launch the wizard:

- **Step 1: Basic Information**: Enter Property Name, Auto-generated Code, Property Type (Boys PG, Girls PG, Co-Living, Family PG, Student Hostel), and Description.
- **Step 2: Location Details**: Enter Address. Click **📍 Use Current Location** to auto-fill the address using your browser's live GPS lookup.
- **Step 3: Building Structure**: Enter Floor counts and specify room counts per floor.
- **Step 4: Amenities**: Check WiFi, AC, Laundry, Parking, Food, CCTV, Lift, Power Backup, Housekeeping, Gym, etc.
- **Step 5: Contact & Upload Media**: Input wardens' phone/email, select establishment date, and drag-and-drop cover and gallery photos.
- **Step 6: Review**: Verify the summary sheet and click **Complete & Save**.

---

## 🛏️ Step 4: Room & Bed Configuration (Room Drawer)

Navigate to **Room Management** (`room-management.html`) to manage individual units.

### 🚪 Dynamic Room Details Drawer
Clicking on any **Room Card** slides open a comprehensive **Details Drawer** containing five interactive tabs:

1. **Overview**: Displays sharing tier (Single, Double, Triple sharing), monthly price per bed, security deposit, facilities, and internal configuration notes.
2. **Beds Map (Check-In & Move Tenant)**:
   - Visualizes bed positions (e.g. *Bed A*, *Bed B*).
   - If a bed is **Occupied**, it displays the tenant's profile card, active rent status, and a **Move Resident** button (to transfer them to another vacant bed/room) or **Check-Out** button.
   - If a bed is **Vacant**, it displays an **Allocate / Check-In** button, allowing you to instantly register a new resident to that bed.
3. **Payments Tab**: Shows monthly revenue calculation, total pending dues for the room, and historical transaction logs.
4. **Complaints Tab**: Lists active, in-progress, or resolved complaints raised for this room unit.
5. **Timeline logs**: Historical check-in and checkout events of tenants who stayed in this room.

---

## 👤 Step 5: Tenant Registration & Check-In

When a resident checks in, navigate to **Tenants Directory** (`tenants.html`):
1. Click **New Tenant**.
2. Enter personal info: name, email, phone number, and gender.
3. Assign a specific **Property**, **Room**, and select an available **Bed**.
4. Set the billing **Joined Date**, monthly **Rent Price**, and **Security Deposit**.
5. Upload government KYC documents (Aadhaar or PAN card).
6. Click **Complete Check-In**.

---

## 🧾 Step 6: Rent Billing and Invoicing

To track rent payments, navigate to **Rent Ledger** (`rent.html`):
- Rent invoices are auto-generated monthly based on the tenant's joined day.
- To record a manual cash/online payment:
  1. Click **Record Payment**.
  2. Select the tenant, enter the amount, select the billing month, and check the payment method (UPI, Netbanking, Cash).
  3. Click **Save Transaction** to issue a receipt.

---

## 🚪 Step 7: Visitor Gate Log & OTP Verification

For security curfews and visitor records, open **Visitor Log** (`visitors.html`):

### Guest Pre-Check-in Flow:
1. Click **Log Visitor**.
2. Enter the visitor's full name, phone number, relation (e.g. parent, friend), and the host tenant they are visiting.
3. The system generates a random 6-digit **OTP verification code** and marks the record as `❌ OTP Unverified`.
4. When the guest arrives at the gate, the guard asks the host resident/tenant for the OTP code sent to them.
5. The guard clicks **Verify OTP** on the visitor card:
   - The button shows `⏳ Verifying...` with a loading spinner.
   - Entering the correct OTP updates the button to `🟢 Approved!`, changes status to `Approved & Inside` (green), and shows a **Check Out** button.
   - Entering an incorrect OTP displays `❌ Invalid OTP!`, prompting you to try again.
6. When the guest exits the PG, click **Check Out** to log the exit timestamp.

---

## 🔧 Step 8: Complaints & Maintenance Tickets

Navigate to **Complaints** (`complaints.html`) to coordinate building repairs:
1. **File Complaint**: Click "New Complaint" to log an issue. Specify the title, description, category (Plumbing, Electrical, Housekeeping, Internet), and priority (Low, Medium, High).
2. **Assign Staff**: Assign a registered employee to handle the issue.
3. **Change Status**: As repair progresses, toggle status between **Pending**, **In Progress**, and **Resolved**. Resolving the issue records a resolution timestamp.

---

## 👥 Step 9: Staff Directory & Attendance

Navigate to **Staff Directory** (`staff.html`) to manage operations team:
1. **Register Staff**: Click "Add Employee" and enter their name, role (Warden, Cleaner, Plumber, Security Guard), contact info, and base monthly salary.
2. **Assign Shift**: Set their work shift (Day, Night, Rotational).
3. **Log Attendance**: Mark staff daily attendance status (Present, Absent, On Leave).
4. **Status Tracker**: Manage active employment status (Active, Inactive).

---

## 📊 Step 10: Reports & System Auditing

Navigate to **Reports** (`reports.html`) to compile business intelligence:
- **Revenue Ledger**: Inspect monthly collection progress, total outstanding rent, and payment method breakdowns.
- **Audit Logs**: View a tamper-proof system audit log capturing every administrative activity (who check-in, check-out, or updated room pricing) for security audits.
