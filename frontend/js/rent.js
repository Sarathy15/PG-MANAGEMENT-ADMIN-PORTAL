// Rent & Invoices Ledger Controller
let rentRecords = [];
let currentStatusFilter = 'all';
let currentCollectDeposit = 0;

window.setStatusFilter = function (status) {
  currentStatusFilter = status;

  const buttons = document.querySelectorAll('#status-pill-container button');
  buttons.forEach(btn => {
    btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700";
  });

  const activeBtnId = `status-pill-${status.toLowerCase()}`;
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-slate-800 shadow-sm border border-slate-200";
  }

  loadRentLedger();
};

async function loadRentLedger() {
  const tbody = document.getElementById('rent-table-body');
  if (!tbody) return;

  const searchTxt = document.getElementById('search-rent-tenant').value.toLowerCase();
  const yearFilter = document.getElementById('filter-rent-year').value;
  const monthFilter = document.getElementById('filter-rent-month').value;
  const activePropId = window.AppState.getActivePropertyId();

  try {
    // FIX: previously, when "All months" was selected, this still queried the
    // API for a single month (the current calendar month), so the table only
    // ever showed one month of data no matter which year was picked.
    // Now we route to a year-wide query when "all" is selected, and a
    // single-month query otherwise.
    const queryParams = monthFilter === 'all'
      ? `year=${yearFilter}`
      : `month=${yearFilter}-${monthFilter}`;

    const res = await window.apiRequest(`/rents?${queryParams}`);
    const rawData = res.data || res || [];

    rentRecords = rawData.map(r => {
      const statusRaw = r.paymentStatus || r.payment_status || 'pending';
      let status = 'Pending';
      if (statusRaw.toLowerCase() === 'paid') status = 'Paid';
      else if (statusRaw.toLowerCase() === 'overdue') status = 'Overdue';

      return {
        ...r,
        tenantName: r.tenant || r.tenantName || (r.tenants?.full_name) || 'Unknown Tenant',
        tenantPhone: r.tenantPhone || (r.tenants?.phone) || '',
        roomNumber: r.room || r.roomNumber || (r.tenants?.rooms?.room_number) || '—',
        month: r.billing_period || r.month || '',
        status: status,
        dueDate: r.dueDate || r.due_date || '',
        paidDate: r.paidDate || r.paid_date || '',
        amount: Number(r.amount || 0),
        electricityAmount: Number(r.electricityAmount || r.electricity_amount || 0),
        miscAmount: Number(r.miscAmount || r.misc_amount || 0),
        notes: r.notes || '',
        checkInDate: r.checkInDate || r.checkin_date || r.tenants?.checkin_date || ''
      };
    });

    let filtered = rentRecords;

    if (searchTxt) {
      filtered = filtered.filter(r => r.tenantName.toLowerCase().includes(searchTxt));
    }

    if (monthFilter === 'all') {
      filtered = filtered.filter(r => r.month && r.month.startsWith(`${yearFilter}-`));
    } else {
      const target = `${yearFilter}-${monthFilter}`;
      filtered = filtered.filter(r => r.month === target);
    }

    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === currentStatusFilter);
    }

    // Sort records: Unpaid (Pending) first.
    // Within unpaid, sort by due date ascending (earliest due / due today / overdue at top).
    // Within paid, sort by due date descending (latest first).
    filtered.sort((a, b) => {
      const aPaid = a.status === 'Paid';
      const bPaid = b.status === 'Paid';
      if (aPaid !== bPaid) {
        return aPaid ? 1 : -1;
      }

      const aDate = new Date(a.dueDate || 0);
      const bDate = new Date(b.dueDate || 0);
      if (aPaid) {
        return bDate - aDate;
      } else {
        return aDate - bDate;
      }
    });

    // Update counters
    let totalAmt = 0;
    let collectedAmt = 0;
    let pendingAmt = 0;

    filtered.forEach(record => {
      const baseRent = Number(record.amount || 0);
      const electricity = Number(record.electricityAmount || 0);
      const misc = Number(record.miscAmount || 0);
      const deposit = Number(record.securityDeposit || 0);
      const amt = baseRent + electricity + misc + deposit;
      totalAmt += amt;
      if (record.status === 'Paid') {
        collectedAmt += amt;
      } else {
        pendingAmt += amt;
      }
    });

    document.getElementById('rent-stat-total').textContent = `₹${totalAmt.toLocaleString()}`;
    document.getElementById('rent-stat-collected').textContent = `₹${collectedAmt.toLocaleString()}`;
    document.getElementById('rent-stat-pending').textContent = `₹${pendingAmt.toLocaleString()}`;
    document.getElementById('rent-count-txt').textContent = `${filtered.length} billing items`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <i data-lucide="receipt-text" class="w-10 h-10 text-slate-300 mb-2"></i>
              <span class="font-bold text-sm text-slate-800">No invoices logged</span>
              <span class="text-xs text-slate-400 mt-1">Try updating criteria or run a batch generation.</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(invoice => {
        let statusBadge = '';
        let actionBtn = '';

        if (invoice.status === 'Paid') {
          statusBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Paid</span>`;
          actionBtn = `<button onclick="openReceiptPreview('${invoice.id}')" class="px-3 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ml-auto"><i data-lucide="scroll-text" class="w-3.5 h-3.5 text-slate-500"></i> View Receipt</button>`;
        } else if (invoice.status === 'Overdue') {
          statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Overdue</span>`;
          actionBtn = `
            <div class="flex items-center justify-end gap-2 ml-auto">
              <button onclick="openReceiptPreview('${invoice.id}')" class="px-2 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1"><i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500"></i> Preview</button>
              <button onclick="collectRent('${invoice.id}')" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"><i data-lucide="indian-rupee" class="w-3.5 h-3.5"></i> Pay</button>
            </div>
          `;
        } else {
          statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Pending</span>`;
          actionBtn = `
            <div class="flex items-center justify-end gap-2 ml-auto">
              <button onclick="openReceiptPreview('${invoice.id}')" class="px-2 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1"><i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500"></i> Preview</button>
              <button onclick="collectRent('${invoice.id}')" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"><i data-lucide="indian-rupee" class="w-3.5 h-3.5"></i> Pay</button>
            </div>
          `;
        }
        let formattedCheckin = '—';
        let nextPayDate = '—';

        const baseDateStr = invoice.checkInDate || invoice.dueDate;

        if (invoice.checkInDate) {
          const checkin = new Date(invoice.checkInDate);
          if (!isNaN(checkin.getTime())) {
            formattedCheckin = checkin.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
          }
        }

        if (baseDateStr) {
          const base = new Date(baseDateStr);
          if (!isNaN(base.getTime())) {
            const nextDue = new Date(base);
            if (invoice.status === 'Paid') {
              nextDue.setMonth(nextDue.getMonth() + 1);
            }
            nextPayDate = nextDue.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
          }
        }

        let formattedDueDate = '—';
        if (invoice.dueDate) {
          const due = new Date(invoice.dueDate);
          if (!isNaN(due.getTime())) {
            formattedDueDate = due.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
          }
        }
        const displayDueDate = invoice.status === 'Paid' ? nextPayDate : formattedDueDate;

        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4 text-slate-500 font-mono text-[11px]">${invoice.invoiceId}</td>
            <td class="px-6 py-4">
              <div class="font-bold text-slate-800">${invoice.tenantName}</div>
              ${invoice.tenantPhone ? `<div class="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1"><i data-lucide="phone-call" class="w-3 h-3 text-slate-400"></i> <span>${invoice.tenantPhone}</span></div>` : ''}
              <div class="text-[10px] text-green-500 font-bold mt-0.5 flex items-center gap-1"><i data-lucide="calendar-check" class="w-3 h-3 text-green-400"></i> <span>Check-in: ${formattedCheckin}</span></div>
              <div class="text-[10px] text-amber-500 font-bold mt-0.5 flex items-center gap-1"><i data-lucide="alarm-clock" class="w-3 h-3 text-amber-400"></i> <span>Next Due: ${nextPayDate}</span></div>
            </td>
            <td class="px-6 py-4">Room ${invoice.roomNumber}</td>
            <td class="px-6 py-4">${displayDueDate}</td>
            <td class="px-6 py-4">${invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
            <td class="px-6 py-4">
              <div class="font-bold text-slate-800">₹${(Number(invoice.amount) + Number(invoice.electricityAmount || 0) + Number(invoice.miscAmount || 0) + Number(invoice.securityDeposit || 0)).toLocaleString()}</div>
              <div class="text-[9px] text-slate-400 font-semibold mt-0.5">Rent: ₹${Number(invoice.amount).toLocaleString()} | Elec: ₹${Number(invoice.electricityAmount || 0).toLocaleString()} | Misc: ₹${Number(invoice.miscAmount || 0).toLocaleString()}${invoice.securityDeposit ? ` | Deposit: ₹${Number(invoice.securityDeposit).toLocaleString()}` : ''}</div>
              ${invoice.notes ? `<div class="text-[9.5px] text-green-500 font-bold mt-0.5 flex items-center gap-1"><span class="bg-green-50 text-green-600 px-1 py-0.5 rounded text-[8px] uppercase font-extrabold tracking-wider border border-green-100/50">Note</span> <span>${invoice.notes}</span></div>` : ''}
            </td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-right">${actionBtn}</td>
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load rent ledger:', err);
    window.UI.toast('Failed to load rent ledger', 'error');
  }
}

let currentPaymentMethod = 'UPI';

window.setPayMode = async function (mode) {
  currentPaymentMethod = mode;
  const cashBtn = document.getElementById('pay-mode-cash');
  const gpayBtn = document.getElementById('pay-mode-gpay');
  const qrContainer = document.getElementById('collect-qr-container');

  if (mode === 'Cash') {
    cashBtn.className = "py-2.5 bg-emerald-500 border border-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100 w-full";
    gpayBtn.className = "py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full";
    qrContainer.classList.add('hidden');
  } else {
    gpayBtn.className = "py-2.5 bg-indigo-650 bg-indigo-600 border border-green-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 w-full";
    cashBtn.className = "py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full";

    try {
      const settings = await window.apiRequest('/settings');
      const qrUrl = settings.paymentQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=pleasanthomes@okaxis&pn=Pleasant%20Homes%20PG&cu=INR';

      const rent = Number(document.getElementById('collect-amount').value || 0);
      const elec = Number(document.getElementById('collect-electricity').value || 0);
      const misc = Number(document.getElementById('collect-misc').value || 0);
      const total = rent + elec + misc + currentCollectDeposit;

      const finalQrUrl = qrUrl.includes('am=') ? qrUrl.replace(/am=\d+/, `am=${total}`) : `${qrUrl}&am=${total}`;
      document.getElementById('collect-qr-img').src = finalQrUrl;
    } catch (err) {
      document.getElementById('collect-qr-img').src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=pleasanthomes@okaxis&pn=Pleasant%2520Homes%2520PG&cu=INR';
    }

    qrContainer.classList.remove('hidden');
  }
};

async function collectRent(id) {
  const invoice = rentRecords.find(r => String(r.id) === String(id));
  if (!invoice) return;

  // Check if tenant has already paid deposit in any other invoice
  const tenantId = invoice.tenantId;
  const alreadyPaidDeposit = rentRecords.some(r =>
    String(r.tenantId) === String(tenantId) &&
    r.status === 'Paid' &&
    Number(r.securityDeposit || 0) > 0
  );

  currentCollectDeposit = alreadyPaidDeposit ? 0 : Number(invoice.securityDeposit || 0);

  document.getElementById('collect-invoice-id').value = invoice.id;
  document.getElementById('collect-tenant-id').value = invoice.tenantId;
  document.getElementById('collect-billing-period').value = invoice.month || new Date().toISOString().substring(0, 7);
  document.getElementById('collect-due-date').value = invoice.dueDate || new Date().toISOString().split('T')[0];

  document.getElementById('collect-tenant-details').innerHTML = `
    <div class="flex justify-between"><span>Occupant:</span> <span class="text-slate-900 font-extrabold">${invoice.tenantName}</span></div>
    <div class="flex justify-between"><span>Room Unit:</span> <span class="text-slate-900 font-extrabold">Room ${invoice.roomNumber}</span></div>
    <div class="flex justify-between"><span>Billing Period:</span> <span class="text-slate-900 font-extrabold">${invoice.month || 'Current Month'}</span></div>
    ${currentCollectDeposit > 0 ? `<div class="flex justify-between text-indigo-700"><span>Security Deposit:</span> <span class="font-extrabold">₹${currentCollectDeposit.toLocaleString()}</span></div>` : ''}
  `;

  document.getElementById('collect-amount').value = invoice.amount;
  document.getElementById('collect-electricity').value = invoice.electricityAmount || 0;
  document.getElementById('collect-misc').value = invoice.miscAmount || 0;
  document.getElementById('collect-notes').value = invoice.notes || '';

  const updateVal = () => {
    const rent = Number(document.getElementById('collect-amount').value || 0);
    const elec = Number(document.getElementById('collect-electricity').value || 0);
    const misc = Number(document.getElementById('collect-misc').value || 0);
    const total = rent + elec + misc + currentCollectDeposit;
    document.getElementById('collect-total-val').innerText = `₹${total.toLocaleString()}`;
  };
  document.getElementById('collect-amount').oninput = updateVal;
  document.getElementById('collect-electricity').oninput = updateVal;
  document.getElementById('collect-misc').oninput = updateVal;

  updateVal();

  // Set default mode
  setPayMode('UPI');

  // Open modal
  document.getElementById('collect-rent-modal').classList.remove('hidden');
}
window.collectRent = collectRent;

window.closeCollectModal = function () {
  document.getElementById('collect-rent-modal').classList.add('hidden');
};

document.getElementById('collect-rent-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const invoiceId = document.getElementById('collect-invoice-id').value;
  const tenantId = document.getElementById('collect-tenant-id').value;
  const billingPeriod = document.getElementById('collect-billing-period').value;
  const dueDate = document.getElementById('collect-due-date').value;

  const amount = Number(document.getElementById('collect-amount').value || 0);
  const electricityAmount = Number(document.getElementById('collect-electricity').value || 0);
  const miscAmount = Number(document.getElementById('collect-misc').value || 0);
  const notes = document.getElementById('collect-notes').value;

  const transactionId = "TXN-" + Math.floor(100000 + Math.random() * 900000);

  try {
    let response;
    if (invoiceId.startsWith('synthesized-')) {
      response = await window.apiRequest('/rents', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          amount,
          electricityAmount,
          miscAmount,
          securityDeposit: currentCollectDeposit,
          dueDate,
          paymentStatus: 'paid',
          paymentMethod: currentPaymentMethod,
          transactionId,
          notes
        })
      });
    } else {
      response = await window.apiRequest(`/rents/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount,
          electricityAmount,
          miscAmount,
          securityDeposit: currentCollectDeposit,
          paymentStatus: 'paid',
          paymentMethod: currentPaymentMethod,
          transactionId,
          notes
        })
      });
    }

    window.UI.toast('Rent collection and invoicing settled successfully! ✅', 'success');
    closeCollectModal();
    loadRentLedger();
  } catch (err) {
    window.UI.toast(err.message || 'Rent collection failed', 'error');
  }
});

function openGenerateModal() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  document.getElementById('generate-month').value = currentMonth;
  document.getElementById('generate-electricity').value = 0;
  document.getElementById('generate-misc').value = 0;
  document.getElementById('generate-notes').value = '';
  window.UI.showModal('generate-bills-modal');
}

function closeGenerateModal() {
  window.UI.hideModal('generate-bills-modal');
}

document.getElementById('generate-bills-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const month = document.getElementById('generate-month').value;
  const electricityAmount = Number(document.getElementById('generate-electricity').value || 0);
  const miscAmount = Number(document.getElementById('generate-misc').value || 0);
  const notes = document.getElementById('generate-notes').value;

  try {
    const data = await window.apiRequest('/rents/generate-bills', {
      method: 'POST',
      body: JSON.stringify({ month, electricityAmount, miscAmount, notes })
    });

    if (data.count > 0) {
      window.UI.toast(`Successfully issued ${data.count} rent invoices for ${month}!`, 'success');
    } else {
      window.UI.toast(`Invoices for ${month} have already been issued to active occupants.`, 'info');
    }
    closeGenerateModal();
    loadRentLedger();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to issue monthly invoices', 'error');
  }
});

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadRentLedger();
});

document.getElementById('search-rent-tenant').addEventListener('input', loadRentLedger);
document.getElementById('filter-rent-month').addEventListener('change', loadRentLedger);
document.getElementById('filter-rent-year').addEventListener('change', loadRentLedger);

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  const yearSelect = document.getElementById('filter-rent-year');
  if (yearSelect) {
    yearSelect.value = currentYear;
  }

  const monthSelect = document.getElementById('filter-rent-month');
  if (monthSelect) {
    monthSelect.value = currentMonth;
  }

  loadRentLedger();
});

let activeReceiptInvoice = null;
let activeReceiptTenant = null;

window.openReceiptPreview = async function (id) {
  const invoice = rentRecords.find(r => String(r.id) === String(id));
  if (!invoice) {
    window.UI.toast('Invoice record not found.', 'error');
    return;
  }

  activeReceiptInvoice = invoice;
  activeReceiptTenant = null;

  const modal = document.getElementById('receipt-preview-modal');
  const canvas = document.getElementById('receipt-modal-canvas');
  canvas.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: #64748b; font-weight: 600; gap: 12px;">
      <div style="width: 32px; height: 32px; border: 3px solid rgba(79, 70, 229, 0.12); border-top-color: #4f46e5; border-radius: 50%; animation: loader-spin 0.6s linear infinite;"></div>
      <span>Loading receipt details...</span>
    </div>
  `;
  modal.style.display = 'flex';
  modal.style.alignItems = 'flex-start';

  try {
    const tenantRes = await window.apiRequest('/tenants/' + invoice.tenantId);
    const tenant = tenantRes.data || tenantRes;
    activeReceiptTenant = tenant;

    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatBillingMonth = (monthStr) => {
      if (!monthStr) return '—';
      const parts = monthStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 2);
      if (isNaN(d.getTime())) return monthStr;
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    // Property details from tenant's linked property record
    const propName = tenant.properties?.property_name || tenant.property_name || tenant.propertyName || 'Pleasant Homes PG';
    const propAddress = tenant.properties?.address || 'No. 12, Third Street, Gill Nagar, Choolaimedu, Chennai – 600 094';
    const propPhone = tenant.properties?.owner_phone || '+91 98844 71112';
    const propEmail = tenant.properties?.email || 'info@pleasanthomespg.com';

    const totalAmount = Number(invoice.amount || 0)
      + Number(invoice.electricityAmount || 0)
      + Number(invoice.miscAmount || 0)
      + Number(invoice.securityDeposit || 0);

    const isPaid = invoice.status === 'Paid';

    // Only show rows with actual amounts
    const chargeLines = [
      { label: 'Monthly Rent', amt: Number(invoice.amount || 0) },
      { label: 'Security / Advance', amt: Number(invoice.securityDeposit || 0) },
      { label: 'Electricity Charges', amt: Number(invoice.electricityAmount || 0) },
      { label: 'Maintenance & Other', amt: Number(invoice.miscAmount || 0) },
    ].filter(r => r.amt > 0);

    const chargeRowsHtml = chargeLines.map((r, i) => `
      <tr style="background:${i % 2 ? '#f9fafb' : '#fff'};">
        <td style="padding:7px 14px;font-size:12px;color:#374151;">${r.label}</td>
        <td style="padding:7px 14px;font-size:12px;color:#6b7280;text-align:center;">${formatBillingMonth(invoice.month)}</td>
        <td style="padding:7px 14px;font-size:12px;color:#111827;text-align:right;font-weight:600;">₹${r.amt.toLocaleString('en-IN')}</td>
      </tr>`).join('');

    // FIX: the old markup pointed straight at /assets/logo.png with an
    // onerror that just hid the tag. If that path 404s (very common when the
    // asset hasn't actually been deployed there), the browser briefly shows
    // its native "broken image" glyph before the hide fires, and the header
    // is left with an empty gap. We now fall back to a generated initials
    // badge instead of hiding the logo outright, so there's never a broken
    // icon and the header always looks intentional.
    const logoInitials = (propName || 'PH')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const logoMarkup = `
      <span class="receipt-logo-slot" style="display:inline-flex;height:46px;width:46px;flex-shrink:0;">
        <img
          src="/assets/logo.png"
          alt="${propName}"
          style="height:46px;width:46px;object-fit:contain;border:1px solid #111827;display:block;"
          crossorigin="anonymous"
          onerror="this.onerror=null;this.outerHTML='<div style=\\'height:46px;width:46px;border:1px solid #111827;display:flex;align-items:center;justify-content:center;color:#111827;font-weight:800;font-size:15px;letter-spacing:0.5px;\\'>${logoInitials}</div>';"
        />
      </span>
    `;

    const htmlContent = `
      <div style="font-family:Georgia,'Times New Roman',serif;background:#fff;color:#111827;width:100%;padding:26px 30px;box-sizing:border-box;border:1px solid #111827;">

        <!-- ── HEADER ── -->
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;width:55%;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${logoMarkup}
                <div>
                  <div style="font-size:17px;font-weight:700;color:#111827;">${propName}</div>
                  <div style="font-size:8.5px;color:#4b5563;text-transform:uppercase;letter-spacing:0.6px;margin-top:1px;font-family:Arial,sans-serif;">Premium Ladies Paying Guest Accommodation</div>
                  <div style="font-size:9.5px;color:#4b5563;margin-top:3px;line-height:1.5;font-family:Arial,sans-serif;">
                    ${propAddress}<br>
                    Tel: ${propPhone} &nbsp;|&nbsp; Email: ${propEmail}
                  </div>
                </div>
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;width:45%;">
              <div style="font-size:18px;font-weight:700;color:#111827;letter-spacing:1.5px;text-transform:uppercase;">Rent Receipt</div>
              <div style="margin-top:6px;font-size:10.5px;color:#374151;line-height:1.9;font-family:Arial,sans-serif;">
                <div><span style="display:inline-block;width:90px;text-align:right;color:#6b7280;">Receipt No.</span> &nbsp;<strong style="color:#111827;font-family:monospace;">${isPaid ? (invoice.invoiceId || '—') : 'PENDING'}</strong></div>
                <div><span style="display:inline-block;width:90px;text-align:right;color:#6b7280;">Billing Month</span> &nbsp;<strong style="color:#111827;">${formatBillingMonth(invoice.month)}</strong></div>
                <div><span style="display:inline-block;width:90px;text-align:right;color:#6b7280;">Due Date</span> &nbsp;<strong style="color:#111827;">${formatDate(invoice.dueDate)}</strong></div>
                <div><span style="display:inline-block;width:90px;text-align:right;color:#6b7280;">Status</span> &nbsp;<span style="border:1px solid #111827;color:#111827;font-size:9px;font-weight:700;padding:1px 8px;text-transform:uppercase;">${isPaid ? 'PAID' : 'PENDING'}</span></div>
              </div>
            </td>
          </tr>
        </table>

        <!-- ── DIVIDER ── -->
        <div style="border-top:2px solid #111827;margin:14px 0;"></div>

        <!-- ── TENANT & ROOM (compact 2-col) ── -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11.5px;font-family:Arial,sans-serif;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:12px;border-right:1px dashed #9ca3af;">
              <div style="padding:2px 13px 2px 0;">
                <div style="font-size:8.5px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:7px;">Tenant</div>
                <div style="font-weight:700;color:#111827;font-size:13px;margin-bottom:3px;">${tenant.name || tenant.full_name || '—'}</div>
                <div style="color:#374151;margin-bottom:1px;">ID: <span style="font-family:monospace;color:#111827;font-weight:700;">${tenant.commonId || tenant.common_id || '—'}</span></div>
                <div style="color:#374151;margin-bottom:1px;">Tel: ${tenant.phone || '—'}</div>
                <div style="color:#374151;">Email: ${tenant.email || '—'}</div>
              </div>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:12px;">
              <div style="padding:2px 0 2px 13px;">
                <div style="font-size:8.5px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:7px;">Accommodation</div>
                <div style="color:#374151;margin-bottom:2px;">Room: <strong style="color:#111827;">Room ${invoice.roomNumber || '—'}</strong></div>
                <div style="color:#374151;margin-bottom:2px;">Bed: <strong style="color:#111827;">Bed ${tenant.bedNumber || '—'}</strong></div>
                <div style="color:#374151;margin-bottom:2px;">Check-in: <strong style="color:#111827;">${formatDate(tenant.checkInDate)}</strong></div>
                <div style="color:#374151;">Billing Period: <strong style="color:#111827;">${formatBillingMonth(invoice.month)}</strong></div>
              </div>
            </td>
          </tr>
        </table>

        <!-- ── CHARGES TABLE ── -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #111827;margin-bottom:14px;font-family:Arial,sans-serif;">
          <thead>
            <tr style="border-bottom:1.5px solid #111827;">
              <th style="padding:7px 14px;text-align:left;font-size:10px;font-weight:700;color:#111827;letter-spacing:0.4px;">Description</th>
              <th style="padding:7px 14px;text-align:center;font-size:10px;font-weight:700;color:#111827;letter-spacing:0.4px;">Period</th>
              <th style="padding:7px 14px;text-align:right;font-size:10px;font-weight:700;color:#111827;letter-spacing:0.4px;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>${chargeRowsHtml}</tbody>
          <tfoot>
            <tr style="border-top:1.5px solid #111827;">
              <td colspan="2" style="padding:9px 14px;font-size:12px;font-weight:700;color:#111827;letter-spacing:0.3px;">Total ${isPaid ? 'Paid' : 'Due'}</td>
              <td style="padding:9px 14px;text-align:right;font-size:14px;font-weight:700;color:#111827;font-family:monospace;">₹${totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- ── PAYMENT DETAILS (inline) ── -->
        <div style="border:1px solid #d1d5db;padding:10px 14px;margin-bottom:16px;font-size:11px;font-family:Arial,sans-serif;">
          <div style="font-size:8.5px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:6px;">Payment Details</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#374151;padding:1px 0;width:25%;">Mode</td>
              <td style="font-weight:600;color:#111827;width:25%;">${isPaid ? (invoice.paymentMethod || 'UPI') : '—'}</td>
              <td style="color:#374151;padding:1px 0;width:25%;">Transaction ID</td>
              <td style="font-weight:600;color:#111827;font-family:monospace;width:25%;">${isPaid ? (invoice.transactionId || '—') : '—'}</td>
            </tr>
            <tr>
              <td style="color:#374151;padding:1px 0;">Paid Date</td>
              <td style="font-weight:600;color:#111827;">${isPaid ? formatDate(invoice.paidDate) : '—'}</td>
              <td style="color:#374151;">Collected By</td>
              <td style="font-weight:600;color:#111827;">${isPaid ? 'PG Admin' : '—'}</td>
            </tr>
          </table>
        </div>

        <!-- ── SIGNATURES ── -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-family:Arial,sans-serif;">
          <tr>
            <td style="width:40%;text-align:center;padding:0 20px;">
              <div style="height:28px;"></div>
              <div style="border-top:1px solid #111827;padding-top:5px;">
                <div style="font-size:9.5px;font-weight:700;color:#4b5563;text-transform:uppercase;">Tenant Signature</div>
                <div style="font-size:9px;color:#9ca3af;">${tenant.name || tenant.full_name || ''}</div>
              </div>
            </td>
            <td style="width:20%;text-align:center;vertical-align:middle;">
              <div style="font-size:20px;font-weight:700;color:#111827;opacity:0.15;transform:rotate(-12deg);display:inline-block;text-transform:uppercase;letter-spacing:2px;border:2px solid #111827;padding:2px 8px;">${isPaid ? 'PAID' : 'PENDING'}</div>
            </td>
            <td style="width:40%;text-align:center;padding:0 20px;">
              <div style="height:28px;"></div>
              <div style="border-top:1px solid #111827;padding-top:5px;">
                <div style="font-size:9.5px;font-weight:700;color:#4b5563;text-transform:uppercase;">Authorized Signatory</div>
                <div style="font-size:9px;color:#9ca3af;">${propName}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- ── FOOTER ── -->
        <div style="border-top:1px solid #111827;padding-top:8px;text-align:center;font-family:Arial,sans-serif;">
          <div style="font-size:9px;color:#6b7280;line-height:1.6;">
            This is a computer-generated receipt and does not require a physical signature.<br>
            <strong style="color:#4b5563;">${propName}</strong> &nbsp;•&nbsp; ${propEmail} &nbsp;•&nbsp; ${propPhone}
          </div>
        </div>

      </div>
    `;

    canvas.innerHTML = htmlContent;

  } catch (err) {
    console.error('Failed to load receipt details:', err);
    canvas.innerHTML = `<div style="color:#ef4444;font-weight:bold;text-align:center;padding:60px 20px;">Failed to load receipt details. Close and try again.</div>`;
  }
};

window.closeReceiptModal = function () {
  const modal = document.getElementById('receipt-preview-modal');
  modal.style.display = 'none';
  activeReceiptInvoice = null;
  activeReceiptTenant = null;
};

window.triggerPdfDownload = async function () {
  if (!activeReceiptInvoice || !activeReceiptTenant) {
    window.UI.toast('No receipt details loaded to export.', 'error');
    return;
  }

  window.UI.toast('Exporting receipt PDF...', 'info');

  const canvas = document.getElementById('receipt-modal-canvas');
  const filename = `PleasantHomes_RentReceipt_${activeReceiptTenant.commonId || activeReceiptTenant.common_id || activeReceiptTenant.id}_${activeReceiptInvoice.month}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(canvas).save();
    window.UI.toast('PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('PDF export failed:', err);
    window.UI.toast('Failed to save PDF.', 'error');
  }
};