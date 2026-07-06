// Maintenance Board Controller
let maintenanceTasks = [];

async function loadMaintenanceTasks() {
  const grid = document.getElementById('maint-grid');
  if (!grid) return;
  
  const statusFilter = document.getElementById('filter-maint-status').value;
  const activePropId = window.AppState.getActivePropertyId();
  
  try {
    maintenanceTasks = await window.apiRequest('/maintenance');
    
    // Filtering
    let filtered = maintenanceTasks;
    if (activePropId !== 'all') {
      filtered = filtered.filter(m => m.propertyId === activePropId);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    document.getElementById('maint-count-txt').textContent = `${filtered.length} tasks listed`;
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
            <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <i data-lucide="wrench" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-semibold text-slate-800">No maintenance schedules found</h3>
            <p class="text-xs text-slate-400 mt-1">Property operates perfectly. Or schedule a new task!</p>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(task => {
        let badge = '';
        if (task.status === 'Completed') {
          badge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>`;
        } else if (task.status === 'Scheduled') {
          badge = `<span class="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Scheduled</span>`;
        } else {
          badge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pending</span>`;
        }
        
        let actionBtn = '';
        if (task.status !== 'Completed') {
          actionBtn = `<button onclick="completeMaintenanceTask('${task.id}')" class="px-2.5 py-1 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all shadow-sm">Mark Done</button>`;
        }
        
        return `
          <div class="bento-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${task.date}</span>
                ${badge}
              </div>
              <h3 class="text-base font-bold text-slate-800 mt-2">${task.title}</h3>
              <p class="text-xs text-slate-400 mt-1">Room Reference: ${task.roomNumber || 'Common Area'}</p>
              
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100/60 mt-4 text-xs font-semibold text-slate-600">
                <div>
                  <p class="text-[9px] text-slate-400 uppercase font-bold">Assigned Helper</p>
                  <p class="text-slate-800 mt-0.5 truncate">${task.assignedStaffName || 'Unassigned'}</p>
                </div>
                <div>
                  <p class="text-[9px] text-slate-400 uppercase font-bold">Estimated Cost</p>
                  <p class="text-indigo-600 font-bold mt-0.5">₹${Number(task.cost).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
              <button onclick="deleteMaintenanceTask('${task.id}')" class="p-2 border border-slate-200 hover:border-slate-300 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
              ${actionBtn}
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load maintenance grid:', err);
    window.UI.toast('Failed to load maintenance board', 'error');
  }
}

async function populateDropdowns() {
  const propSelect = document.getElementById('maint-property-id');
  const staffSelect = document.getElementById('maint-staff-id');
  
  if (!propSelect || !staffSelect) return;
  
  try {
    const props = await window.apiRequest('/properties');
    propSelect.innerHTML = props.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    const staff = await window.apiRequest('/staff');
    staffSelect.innerHTML = '<option value="">-- No staff assigned --</option>' + staff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
  } catch (err) {
    console.error('Failed to load properties/staff for maintenance:', err);
  }
}

function openMaintenanceModal() {
  document.getElementById('maint-date').value = new Date().toISOString().substring(0, 10);
  window.UI.showModal('maint-modal');
}

function closeMaintenanceModal() {
  window.UI.hideModal('maint-modal');
  document.getElementById('maint-form').reset();
  document.getElementById('maint-id').value = '';
}

async function completeMaintenanceTask(id) {
  try {
    await window.apiRequest(`/maintenance/${id}/complete`, { method: 'POST' });
    window.UI.toast('Maintenance task completed successfully', 'success');
    loadMaintenanceTasks();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to complete task', 'error');
  }
}

async function deleteMaintenanceTask(id) {
  if (confirm('Are you absolutely sure you want to remove this maintenance task?')) {
    try {
      await window.apiRequest(`/maintenance/${id}`, { method: 'DELETE' });
      window.UI.toast('Maintenance log removed', 'success');
      loadMaintenanceTasks();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete task', 'error');
    }
  }
}

document.getElementById('maint-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const propertyId = document.getElementById('maint-property-id').value;
  const title = document.getElementById('maint-title').value;
  const roomNumber = document.getElementById('maint-room').value;
  const cost = Number(document.getElementById('maint-cost').value);
  const staffId = document.getElementById('maint-staff-id').value;
  const date = document.getElementById('maint-date').value;
  
  const payload = { propertyId, title, roomNumber, cost, staffId, date, status: 'Scheduled' };
  
  try {
    await window.apiRequest('/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    window.UI.toast('Maintenance task scheduled successfully!', 'success');
    closeMaintenanceModal();
    loadMaintenanceTasks();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to schedule task', 'error');
  }
});

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadMaintenanceTasks();
});

document.getElementById('filter-maint-status').addEventListener('change', loadMaintenanceTasks);

document.addEventListener('DOMContentLoaded', () => {
  populateDropdowns();
  loadMaintenanceTasks();
});
