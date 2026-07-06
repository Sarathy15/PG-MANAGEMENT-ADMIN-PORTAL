# Walkthrough - Mobile Layout Shell & Portal Custom Features

We have completed the implementation of both the **Mobile Layout Shell** and the **Custom Core Features** (Billing Splits, Custom Complaints, and Visitor Verification workflows).

---

## 🛠️ Changes Implemented

### 1. Database Schema Extensions (Supabase PostgreSQL)
* **`rent_payments` table**: Added `electricity_amount` and `misc_amount` numeric fields.
* **`visitors` table**: Added `otp` (String), `otp_verified` (Boolean), and `approval_status` (String) columns.

### 2. Express Backend API Enhancements
* **[rentController.js](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/backend/controllers/rentController.js)**:
  * Updated mappings, creation, and updates to include `electricityAmount` and `miscAmount`.
  * Implemented and exposed `generateRentBills` to dynamically batch generate rent invoices containing base rent rates, custom electricity, and miscellaneous amounts.
* **[visitorController.js](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/backend/controllers/visitorController.js)**:
  * Implemented automatic random 6-digit OTP generation upon visitor creation.
  * Added `/verify-otp` (POST) to verify codes and toggle verification status.
  * Added `/approve` (POST) to let residents/landlords approve or reject visitors.
* **[server.js](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/backend/server.js)**: Updated response mapping middleware so that client payloads contain `electricityAmount`, `miscAmount`, `otp`, `otpVerified`, and `approvalStatus`.

### 3. Portal UI Customizations (Desktop)
* **Split Billing Dashboard**:
  * **[rent.html](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/frontend/rent.html)**: Added inputs for batch electricity and miscellaneous charges to the bill generation modal.
  * **[rent.js](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/frontend/js/rent.js)**: Formulates payloads with billing charges, computes cumulative total sums, and lists itemized rent breakdowns in table rows.
* **Ticket categories**:
  * **[complaints.html](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/frontend/complaints.html)**: Configured the dropdown menu to offer exactly: `Electrical`, `Plumbing`, `Housekeeping`, `Internet`, and `CCTV`.
* **Visitor Verification Portal**:
  * **[visitors.html](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/frontend/visitors.html)**: Created a modal dialog prompting verification of the visitor's OTP check.
  * **[visitors.js](file:///c:/Users/srila/Downloads/Pleasant%20Homes%20PG%20Manage/pg-management-system%20%281%29/frontend/js/visitors.js)**: Automatically pops up the verification dialog upon guest creation, showing the simulated OTP. Renders dynamic verification badges and inline Approve/Reject action triggers.

---

## 🔍 How to Test Manually

### 1. Itemized Split Billing
1. Navigate to [http://localhost:5000/rent.html](http://localhost:5000/rent.html).
2. Click **Generate Monthly Bills**, select a month, specify an electricity amount (e.g. `500`) and misc charges (e.g. `150`), and click **Issue Invoices**.
3. Verify that the table displays the total due (`Base Rent + Electricity + Misc`) and details the breakdown (e.g. `Rent: ₹8,000 | Elec: ₹500 | Misc: ₹150`).

### 2. Custom Complaint Categories
1. Navigate to [http://localhost:5000/complaints.html](http://localhost:5000/complaints.html).
2. Click **File Complaint** and check the categories dropdown: it should list `Electrical`, `Plumbing`, `Housekeeping`, `Internet`, and `CCTV`.

### 3. Visitor OTP & Resident Approval
1. Navigate to [http://localhost:5000/visitors.html](http://localhost:5000/visitors.html).
2. Click **Log New Visitor** and fill out the details.
3. Upon submission, a modal will automatically appear showing a simulated OTP (e.g. `123456`). Enter this OTP and click **Verify Code**.
4. The status badge will update to `🟡 Pending Resident Approval`, and you will see inline **Approve** and **Reject** buttons. Click **Approve** to update the status to `🟢 Approved & Inside`.
