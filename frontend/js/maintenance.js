// Maintenance Board Controller
let maintenanceTasks = [];

async function loadMaintenanceTasks() {
  const tbody = document.getElementById('maint-table-body');
  if (!tbody) return;
  
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

    // Calculate dashboard statistics from all filtered tasks
    const totalExpenses = filtered.reduce((sum, task) => sum + Number(task.cost || 0), 0);
    const roomTasks = filtered.filter(task => task.roomId || (task.roomNumber && task.roomNumber !== 'Common Area' && task.roomNumber !== '—'));
    const roomExpenses = roomTasks.reduce((sum, task) => sum + Number(task.cost || 0), 0);
    const otherTasks = filtered.filter(task => !task.roomId && (!task.roomNumber || task.roomNumber === 'Common Area' || task.roomNumber === '—'));
    const otherExpenses = otherTasks.reduce((sum, task) => sum + Number(task.cost || 0), 0);

    // Render stats
    if (document.getElementById('stats-total-expenses')) {
      document.getElementById('stats-total-expenses').textContent = `₹${totalExpenses.toLocaleString()}`;
    }
    if (document.getElementById('stats-total-count')) {
      document.getElementById('stats-total-count').textContent = `${filtered.length} maintenance logs`;
    }
    if (document.getElementById('stats-room-expenses')) {
      document.getElementById('stats-room-expenses').textContent = `₹${roomExpenses.toLocaleString()}`;
    }
    if (document.getElementById('stats-room-count')) {
      document.getElementById('stats-room-count').textContent = `${roomTasks.length} room repairs`;
    }
    if (document.getElementById('stats-other-expenses')) {
      document.getElementById('stats-other-expenses').textContent = `₹${otherExpenses.toLocaleString()}`;
    }
    if (document.getElementById('stats-other-count')) {
      document.getElementById('stats-other-count').textContent = `${otherTasks.length} general tasks`;
    }
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                <i data-lucide="wrench" class="w-6 h-6"></i>
              </div>
              <h3 class="text-sm font-semibold text-slate-800">No maintenance tasks found</h3>
              <p class="text-xs text-slate-400 mt-1">Property operates perfectly. Or schedule a new task!</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(task => {
        let badge = '';
        if (task.status === 'Completed') {
          badge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Completed</span>`;
        } else if (task.status === 'Scheduled') {
          badge = `<span class="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Scheduled</span>`;
        } else {
          badge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pending</span>`;
        }
        
        let actionBtn = '';
        if (task.status !== 'Completed') {
          actionBtn = `<button onclick="completeMaintenanceTask('${task.id}')" class="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm focus:outline-none">Mark Done</button>`;
        } else {
          actionBtn = `<span class="text-slate-400 text-[10px] font-bold">Logged</span>`;
        }
        
        const costLabel = task.status === 'Completed' ? 'Resolved Cost' : 'Estimated Cost';
        
        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4.5 text-slate-500 font-medium">${task.date}</td>
            <td class="px-6 py-4.5">
              <div class="max-w-xs">
                <p class="font-bold text-slate-800">${task.title}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title="${task.description}">${task.description}</p>
              </div>
            </td>
            <td class="px-6 py-4.5 text-slate-600 font-semibold">${task.roomNumber || 'Common Area'}</td>
            <td class="px-6 py-4.5 text-slate-700 font-semibold">${task.assignedStaffName || 'Unassigned'}</td>
            <td class="px-6 py-4.5">
              <div>
                <p class="text-slate-800 font-bold">₹${Number(task.cost).toLocaleString()}</p>
                <p class="text-[9px] text-slate-450 uppercase font-bold mt-0.5">${costLabel}</p>
              </div>
            </td>
            <td class="px-6 py-4.5">${badge}</td>
            <td class="px-6 py-4.5 text-right flex items-center justify-end gap-2.5">
              ${actionBtn}
              <button onclick="deleteMaintenanceTask('${task.id}')" class="p-1 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete log">
                <i data-lucide="trash" class="w-4.5 h-4.5"></i>
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
    console.error('Failed to load maintenance table:', err);
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
    await window.apiRequest(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' })
    });
    window.UI.toast('Maintenance task completed successfully', 'success');
    loadMaintenanceTasks();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to complete task', 'error');
  }
}

async function deleteMaintenanceTask(id) {
  if (await window.UI.confirm('Are you absolutely sure you want to remove this maintenance task?', 'Delete Maintenance Task')) {
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
