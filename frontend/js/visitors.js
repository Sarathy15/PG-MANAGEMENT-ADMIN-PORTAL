// Visitors Directory Controller
let visitorLogs = [];

async function loadVisitorLogs() {
  const tbody = document.getElementById('visitor-table-body');
  if (!tbody) return;
  
  const searchTxt = document.getElementById('search-visitor').value.toLowerCase();
  const statusFilter = document.getElementById('filter-visitor-status').value;
  const activePropId = window.AppState.getActivePropertyId();
  
  try {
    visitorLogs = await window.apiRequest('/visitors');
    
    // Filtering logs
    let filtered = visitorLogs;
    if (activePropId !== 'all') {
      filtered = filtered.filter(v => String(v.propertyId) === String(activePropId));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    if (searchTxt) {
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(searchTxt) ||
        v.tenantName.toLowerCase().includes(searchTxt)
      );
    }
    
    document.getElementById('visitor-count-txt').textContent = `${filtered.length} visitor logs registered`;
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <i data-lucide="contact" class="w-10 h-10 text-slate-300 mb-2"></i>
              <span class="font-bold text-sm text-slate-800">No visitor logs found</span>
              <span class="text-xs text-slate-400 mt-1">Try clearing criteria or log a new check-in.</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(log => {
        let badge = '';
        let checkoutBtn = '';
        
        if (!log.otpVerified) {
          badge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">❌ OTP Unverified</span>`;
          checkoutBtn = `<button onclick="openOtpVerificationModal('${log.id}')" class="px-2.5 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm">Verify OTP</button>`;
        } else if (log.approvalStatus === 'Pending Resident Approval') {
          badge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">🟡 Pending Resident Approval</span>`;
          checkoutBtn = `
            <div class="flex items-center gap-1.5">
              <button onclick="approveVisitor('${log.id}', 'Approved')" class="px-2 py-0.5 text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-all">Approve</button>
              <button onclick="approveVisitor('${log.id}', 'Rejected')" class="px-2 py-0.5 text-[9px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded transition-all">Reject</button>
            </div>
          `;
        } else if (log.approvalStatus === 'Approved') {
          if (log.status === 'inside' || log.status === 'Checked In') {
            badge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">🟢 Approved & Inside</span>`;
            checkoutBtn = `<button onclick="checkoutVisitor('${log.id}')" class="px-2.5 py-1 text-[10px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm">Check Out</button>`;
          } else {
            badge = `<span class="bg-slate-50 text-slate-500 border border-slate-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">Checked Out</span>`;
            checkoutBtn = `<span class="text-[10px] text-slate-400">Out: ${log.checkOutTime ? log.checkOutTime.substring(11, 16) : '—'}</span>`;
          }
        } else {
          badge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">🔴 Entry Rejected</span>`;
          checkoutBtn = `<span class="text-[10px] text-slate-400 font-semibold">Rejected</span>`;
        }
        
        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4.5 font-bold text-slate-800">${log.name}</td>
            <td class="px-6 py-4.5 text-slate-500">${log.phone}</td>
            <td class="px-6 py-4.5">
              <div>
                <p class="font-bold text-slate-800">${log.tenantName}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Room ${log.roomNumber}</p>
              </div>
            </td>
            <td class="px-6 py-4.5">
              <div>
                <p class="text-slate-800">${log.purpose}</p>
                <p class="text-[10px] text-green-600 mt-0.5">Relation: ${log.relation}</p>
              </div>
            </td>
            <td class="px-6 py-4.5 text-slate-500">${log.checkInTime.substring(0, 16).replace('T', ' ')}</td>
            <td class="px-6 py-4.5 text-slate-500">${log.checkOutTime ? log.checkOutTime.substring(0, 16).replace('T', ' ') : '—'}</td>
            <td class="px-6 py-4.5">${badge}</td>
            <td class="px-6 py-4.5 text-right flex items-center justify-end gap-2">
              ${checkoutBtn}
              <button onclick="deleteVisitorLog('${log.id}')" class="p-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete log">
                <i data-lucide="trash" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load visitor directory logs:', err);
    window.UI.toast('Failed to load visitor logs', 'error');
  }
}

async function populateTenantDropdown() {
  const select = document.getElementById('visitor-tenant-id');
  if (!select) return;
  try {
    const tenants = await window.apiRequest('/tenants');
    const activeTenants = tenants.filter(t => t.status === 'Active');
    select.innerHTML = activeTenants.map(t => `<option value="${t.id}" data-prop="${t.propertyId}">👤 ${t.name} (Room ${t.roomNumber})</option>`).join('');
  } catch (err) {
    console.error('Failed to load tenants list for visitors:', err);
  }
}

function openAddVisitorModal() {
  window.UI.showModal('visitor-modal');
}

function closeVisitorModal() {
  window.UI.hideModal('visitor-modal');
  document.getElementById('visitor-form').reset();
}

async function checkoutVisitor(id) {
  if (await window.UI.confirm('Confirm guest checkout? This records the departure time.', 'Guest Checkout')) {
    try {
      await window.apiRequest(`/visitors/${id}/checkout`, { method: 'POST' });
      window.UI.toast('Visitor logged out successfully', 'success');
      loadVisitorLogs();
    } catch (err) {
      window.UI.toast(err.message || 'Checkout failed', 'error');
    }
  }
}

async function deleteVisitorLog(id) {
  if (await window.UI.confirm('Are you absolutely sure you want to remove this visitor log?', 'Delete Visitor Log')) {
    try {
      await window.apiRequest(`/visitors/${id}`, { method: 'DELETE' });
      window.UI.toast('Visitor log removed', 'success');
      loadVisitorLogs();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete record', 'error');
    }
  }
}

document.getElementById('visitor-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('visitor-name').value;
  const phone = document.getElementById('visitor-phone').value;
  const tenantId = document.getElementById('visitor-tenant-id').value;
  const relation = document.getElementById('visitor-relation').value;
  const purpose = document.getElementById('visitor-purpose').value;
  
  // Find tenant propertyId to propagate
  const option = document.getElementById('visitor-tenant-id').selectedOptions[0];
  const propertyId = option ? option.getAttribute('data-prop') : '';

  const payload = { propertyId, name, phone, tenantId, relation, purpose };
  
  try {
    const data = await window.apiRequest('/visitors', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    window.UI.toast('Visitor logged successfully!', 'success');
    closeVisitorModal();
    loadVisitorLogs();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to complete guest log', 'error');
  }
});

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadVisitorLogs();
});

document.getElementById('search-visitor').addEventListener('input', loadVisitorLogs);
document.getElementById('filter-visitor-status').addEventListener('change', loadVisitorLogs);

document.addEventListener('DOMContentLoaded', () => {
  populateTenantDropdown();
  loadVisitorLogs();
  
  const phoneInput = document.getElementById('visitor-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    setTimeout(openAddVisitorModal, 500);
  }
});

let currentVerifyingVisitorId = null;

function openOtpVerificationModal(id) {
  currentVerifyingVisitorId = id;
  document.getElementById('verify-otp-input').value = '';
  window.UI.showModal('otp-modal');
}

function closeOtpModal() {
  window.UI.hideModal('otp-modal');
  currentVerifyingVisitorId = null;
}

async function submitVerifyOtp() {
  const enteredOtp = document.getElementById('verify-otp-input').value;
  if (!enteredOtp) {
    window.UI.toast('Please enter the OTP code', 'warning');
    return;
  }
  try {
    await window.apiRequest(`/visitors/${currentVerifyingVisitorId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp: enteredOtp })
    });
    window.UI.toast('OTP Verified and Visitor Approved!', 'success');
    closeOtpModal();
    loadVisitorLogs();
  } catch (err) {
    window.UI.toast(err.message || 'OTP Verification failed', 'error');
  }
}

async function approveVisitor(id, status) {
  try {
    await window.apiRequest(`/visitors/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    window.UI.toast(`Visitor entry ${status.toLowerCase()} successfully`, 'success');
    loadVisitorLogs();
  } catch (err) {
    window.UI.toast(err.message || 'Action failed', 'error');
  }
}
