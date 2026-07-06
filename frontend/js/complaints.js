// Complaints Portal Controller
let allComplaints = [];

async function loadComplaints() {
  const tbody = document.getElementById('complaints-table-body');
  if (!tbody) return;
  
  const activePropId = window.AppState.getActivePropertyId();
  const priorityFilter = document.getElementById('filter-complaint-priority').value;
  const statusFilter = document.getElementById('filter-complaint-status').value;
  
  try {
    allComplaints = await window.apiRequest('/complaints');
    
    // Filters
    let filtered = allComplaints;
    if (activePropId !== 'all') {
      filtered = filtered.filter(c => c.propertyId === activePropId);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    document.getElementById('complaints-count-txt').textContent = `${filtered.length} items logged`;
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <i data-lucide="message-square-warning" class="w-10 h-10 text-slate-300 mb-2"></i>
              <span class="font-bold text-sm text-slate-800">No complaints matches</span>
              <span class="text-xs text-slate-400 mt-1">Grievance ledger is clean! Excellent.</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(complaint => {
        const priorityColors = {
          High: 'bg-rose-50 text-rose-600 border-rose-100',
          Medium: 'bg-amber-50 text-amber-600 border-amber-100',
          Low: 'bg-slate-50 text-slate-600 border-slate-100'
        };
        const statusColors = {
          Pending: 'bg-rose-50 text-rose-600 border-rose-200',
          'In Progress': 'bg-rose-50 text-rose-600 border-rose-200',
          Resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200'
        };
        
        let statusBadge = `<span class="px-2.5 py-0.5 border text-[9px] font-bold rounded-full ${statusColors[complaint.status] || ''}">${complaint.status}</span>`;
        let priorityBadge = `<span class="px-2.5 py-0.5 border text-[9px] font-bold rounded-full ${priorityColors[complaint.priority] || ''}">${complaint.priority}</span>`;
        
        // Progress Actions
        let actionBtn = '';
        if (complaint.status === 'Pending') {
          actionBtn = `<button onclick="updateComplaintStatus('${complaint.id}', 'In Progress')" class="px-3.5 py-1.5 text-[11px] font-black border border-rose-200 text-rose-600 bg-rose-50/60 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-rose-100 hover:shadow-md hover:shadow-rose-200/40 active:scale-95 cursor-pointer shadow-sm focus:outline-none">Investigate</button>`;
        } else if (complaint.status === 'In Progress') {
          actionBtn = `<button onclick="openResolveModal('${complaint.id}')" class="px-3.5 py-1.5 text-[11px] font-black border border-rose-200 text-rose-600 bg-rose-50/60 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-rose-100 hover:shadow-md hover:shadow-rose-200/40 active:scale-95 cursor-pointer shadow-sm focus:outline-none">Mark Resolved</button>`;
        } else {
          actionBtn = `<span class="px-3.5 py-1.5 text-[11px] font-bold border border-emerald-100 text-emerald-600 bg-emerald-50/40 rounded-xl cursor-default opacity-80 select-none">Resolved</span>`;
        }
        
        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4">
              <div class="max-w-xs">
                <p class="font-bold text-slate-800 truncate">${complaint.title}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title="${complaint.description}">${complaint.description}</p>
              </div>
            </td>
            <td class="px-6 py-4 font-bold text-slate-800">${complaint.tenantName}</td>
            <td class="px-6 py-4">Unit ${complaint.roomNumber}</td>
            <td class="px-6 py-4 text-slate-500">${complaint.category}</td>
            <td class="px-6 py-4">${priorityBadge}</td>
            <td class="px-6 py-4 text-slate-400">${(complaint.date || complaint.createdAt || '').substring(0, 10)}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-right flex items-center justify-end gap-3 h-full">
              ${actionBtn}
              <button onclick="deleteComplaint('${complaint.id}')" class="p-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete record">
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
    console.error('Failed to load complaints list:', err);
    window.UI.toast('Failed to load complaints', 'error');
  }
}

async function populateTenantDropdown() {
  const select = document.getElementById('complaint-tenant-id');
  if (!select) return;
  try {
    const tenants = await window.apiRequest('/tenants');
    const activeTenants = tenants.filter(t => t.status === 'Active');
    select.innerHTML = activeTenants.map(t => `<option value="${t.id}" data-prop="${t.propertyId}">👤 ${t.name} (Room ${t.roomNumber})</option>`).join('');
  } catch (err) {
    console.error('Failed to fetch tenants for complaints:', err);
  }
}

function openComplaintModal() {
  window.UI.showModal('complaint-modal');
}

function closeComplaintModal() {
  window.UI.hideModal('complaint-modal');
  document.getElementById('complaint-form').reset();
}

async function updateComplaintStatus(id, newStatus) {
  try {
    await window.apiRequest(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    window.UI.toast(`Complaint updated to ${newStatus}`, 'success');
    loadComplaints();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to update complaint', 'error');
  }
}

async function deleteComplaint(id) {
  if (await window.UI.confirm('Are you absolutely sure you want to delete this complaint log?', 'Delete Complaint')) {
    try {
      await window.apiRequest(`/complaints/${id}`, { method: 'DELETE' });
      window.UI.toast('Complaint log deleted', 'success');
      loadComplaints();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete complaint', 'error');
    }
  }
}

document.getElementById('complaint-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tenantId = document.getElementById('complaint-tenant-id').value;
  const title = document.getElementById('complaint-title').value;
  const description = document.getElementById('complaint-desc').value;
  const category = document.getElementById('complaint-category').value;
  const priority = document.getElementById('complaint-priority').value;
  
  // Find tenant propertyId
  const option = document.getElementById('complaint-tenant-id').selectedOptions[0];
  const propertyId = option ? option.getAttribute('data-prop') : '';

  const payload = { propertyId, tenantId, title, description, category, priority };
  
  try {
    await window.apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    window.UI.toast('Complaint filed successfully!', 'success');
    closeComplaintModal();
    loadComplaints();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to submit complaint', 'error');
  }
});

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadComplaints();
});

async function openResolveModal(complaintId) {
  document.getElementById('resolve-complaint-id').value = complaintId;
  document.getElementById('resolve-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('resolve-cost').value = '';
  
  // Populate staff dropdown
  const staffSelect = document.getElementById('resolve-staff-id');
  if (staffSelect) {
    try {
      const staffList = await window.apiRequest('/staff');
      const activeStaff = (staffList || []).filter(s => s.activeStatus === 'Active' || s.active_status === 'Active');
      staffSelect.innerHTML = activeStaff.map(s => `<option value="${s.id}">👤 ${s.name} (${s.role})</option>`).join('');
    } catch (err) {
      console.error("Failed to load staff for resolution:", err);
    }
  }
  
  window.UI.showModal('resolve-complaint-modal');
}
window.openResolveModal = openResolveModal;

function closeResolveModal() {
  window.UI.hideModal('resolve-complaint-modal');
  document.getElementById('resolve-form').reset();
}
window.closeResolveModal = closeResolveModal;

document.getElementById('resolve-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('resolve-complaint-id').value;
  const staffId = document.getElementById('resolve-staff-id').value;
  const cost = Number(document.getElementById('resolve-cost').value || 0);
  const date = document.getElementById('resolve-date').value;

  try {
    // 1. Fetch complaint details
    const complaint = await window.apiRequest(`/complaints/${id}`);

    // 2. Resolve complaint in database
    await window.apiRequest(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Resolved',
        assignedStaffId: staffId,
        cost: cost,
        date: date
      })
    });

    // 3. Create completed maintenance task
    const roomRef = complaint.roomNumber && complaint.roomNumber !== '—' ? `Room ${complaint.roomNumber}` : 'Common Area';
    const taskTitle = `${roomRef} ${complaint.category || 'Maintenance'} issue fixes`;
    const taskDesc = `Resolved complaint: "${complaint.title || 'No Title'}". Description: ${complaint.description || 'No Description'}`;

    await window.apiRequest('/maintenance', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: complaint.propertyId || window.AppState.getActivePropertyId() || '',
        roomId: complaint.roomId || null,
        complaintId: id,
        title: taskTitle,
        description: taskDesc,
        assignedStaffId: staffId,
        cost: cost,
        status: 'Completed',
        date: date
      })
    });

    window.UI.toast('Complaint marked resolved and maintenance log generated!', 'success');
    closeResolveModal();
    loadComplaints();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to resolve complaint', 'error');
  }
});

document.getElementById('filter-complaint-priority').addEventListener('change', loadComplaints);
document.getElementById('filter-complaint-status').addEventListener('change', loadComplaints);

document.addEventListener('DOMContentLoaded', () => {
  populateTenantDropdown();
  loadComplaints();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    setTimeout(openComplaintModal, 500);
  }
});
