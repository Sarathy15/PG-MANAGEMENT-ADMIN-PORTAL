// Rent & Invoices Ledger Controller
let rentRecords = [];
let currentStatusFilter = 'all';

window.setStatusFilter = function(status) {
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
    const targetQueryMonth = monthFilter === 'all' ? `${yearFilter}-${new Date().toISOString().substring(5, 7)}` : `${yearFilter}-${monthFilter}`;
    rentRecords = await window.apiRequest(`/rents?month=${targetQueryMonth}`);
    
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
      const amt = baseRent + electricity + misc;
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
              <i data-lucide="calculator" class="w-10 h-10 text-slate-300 mb-2"></i>
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
          actionBtn = `<span class="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i> Settled</span>`;
        } else if (invoice.status === 'Overdue') {
          statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Overdue</span>`;
          actionBtn = `<button onclick="collectRent('${invoice.id}')" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ml-auto"><i data-lucide="credit-card" class="w-3.5 h-3.5"></i> Pay</button>`;
        } else {
          statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Pending</span>`;
          actionBtn = `<button onclick="collectRent('${invoice.id}')" class="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ml-auto"><i data-lucide="credit-card" class="w-3.5 h-3.5"></i> Pay</button>`;
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
              ${invoice.tenantPhone ? `<div class="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3 text-slate-400"></i> <span>${invoice.tenantPhone}</span></div>` : ''}
              <div class="text-[10px] text-green-500 font-bold mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-green-400"></i> <span>Check-in: ${formattedCheckin}</span></div>
              <div class="text-[10px] text-amber-500 font-bold mt-0.5 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3 text-amber-400"></i> <span>Next Due: ${nextPayDate}</span></div>
            </td>
            <td class="px-6 py-4">Room ${invoice.roomNumber}</td>
            <td class="px-6 py-4">${displayDueDate}</td>
            <td class="px-6 py-4">${invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
            <td class="px-6 py-4">
              <div class="font-bold text-slate-800">₹${(Number(invoice.amount) + Number(invoice.electricityAmount || 0) + Number(invoice.miscAmount || 0)).toLocaleString()}</div>
              <div class="text-[9px] text-slate-400 font-semibold mt-0.5">Rent: ₹${Number(invoice.amount).toLocaleString()} | Elec: ₹${Number(invoice.electricityAmount || 0).toLocaleString()} | Misc: ₹${Number(invoice.miscAmount || 0).toLocaleString()}</div>
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

window.setPayMode = async function(mode) {
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
      const total = rent + elec + misc;
      
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

  document.getElementById('collect-invoice-id').value = invoice.id;
  document.getElementById('collect-tenant-id').value = invoice.tenantId;
  document.getElementById('collect-billing-period').value = invoice.month || new Date().toISOString().substring(0, 7);
  document.getElementById('collect-due-date').value = invoice.dueDate || new Date().toISOString().split('T')[0];

  document.getElementById('collect-tenant-details').innerHTML = `
    <div class="flex justify-between"><span>Occupant:</span> <span class="text-slate-900 font-extrabold">${invoice.tenantName}</span></div>
    <div class="flex justify-between"><span>Room Unit:</span> <span class="text-slate-900 font-extrabold">Room ${invoice.roomNumber}</span></div>
    <div class="flex justify-between"><span>Billing Period:</span> <span class="text-slate-900 font-extrabold">${invoice.month || 'Current Month'}</span></div>
  `;

  document.getElementById('collect-amount').value = invoice.amount;
  document.getElementById('collect-electricity').value = invoice.electricityAmount || 0;
  document.getElementById('collect-misc').value = invoice.miscAmount || 0;
  document.getElementById('collect-notes').value = invoice.notes || '';

  const updateVal = () => {
    const rent = Number(document.getElementById('collect-amount').value || 0);
    const elec = Number(document.getElementById('collect-electricity').value || 0);
    const misc = Number(document.getElementById('collect-misc').value || 0);
    const total = rent + elec + misc;
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

window.closeCollectModal = function() {
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
