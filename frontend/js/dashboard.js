// Dashboard portal controller
let occupancyChartInstance = null;

async function loadDashboardData() {
  const activePropId = window.AppState.getActivePropertyId();
  try {
    const stats = await window.apiRequest(`/dashboard?propertyId=${activePropId}`);
    
    // Update stats cards
    document.getElementById('stat-occupancy').textContent = `${stats.occupancyRate}%`;
    document.getElementById('stat-beds-occupied').textContent = `${stats.occupiedBeds} of ${stats.totalBeds} beds occupied`;
    document.getElementById('stat-rooms').textContent = stats.totalRooms;
    document.getElementById('stat-revenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
    document.getElementById('stat-pending').textContent = `₹${stats.pendingRent.toLocaleString()}`;
    document.getElementById('stat-visitors-today').textContent = `${stats.visitorCount} Logged Today`;
    
    // Update occupied / available counts in bento cards
    const dashOccupied = document.getElementById('dash-occupied-count');
    const dashAvailable = document.getElementById('dash-available-count');
    const dashBedsTotal = document.getElementById('dash-beds-total');
    if (dashOccupied) dashOccupied.textContent = stats.occupiedBeds;
    if (dashAvailable) dashAvailable.textContent = Math.max(0, stats.totalBeds - stats.occupiedBeds);
    if (dashBedsTotal) dashBedsTotal.textContent = `${stats.totalBeds} Beds`;

    // Update dashboard progress bar
    const bar = document.getElementById('dash-occupancy-bar');
    const barTxt = document.getElementById('dash-occupancy-bar-percent');
    if (bar) bar.style.width = `${stats.occupancyRate}%`;
    if (barTxt) barTxt.textContent = `${stats.occupancyRate}%`;
    
    // Fill Notices Board
    const noticesList = document.getElementById('dashboard-notices-list');
    if (noticesList) {
      if (!stats.notices || stats.notices.length === 0) {
        noticesList.innerHTML = `<p class="text-xs text-slate-400">No active announcements publishings.</p>`;
      } else {
        noticesList.innerHTML = stats.notices.map(notice => `
          <div class="border-l-2 border-green-500 pl-3">
            <h4 class="text-xs font-bold text-slate-800">${notice.title}</h4>
            <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2">${notice.content}</p>
            <span class="text-[9px] text-slate-400 font-medium block mt-1">${notice.date}</span>
          </div>
        `).join('');
      }
    }

    // Fill Complaints Panel
    const complaintsList = document.getElementById('dashboard-complaints-list');
    if (complaintsList) {
      const activeComplaints = stats.recentComplaints.filter(c => c.status !== 'Resolved');
      if (activeComplaints.length === 0) {
        complaintsList.innerHTML = `<p class="text-xs text-slate-400">No pending complaints. Excellent!</p>`;
      } else {
        complaintsList.innerHTML = activeComplaints.map(complaint => {
          const priorityColors = {
            High: 'bg-rose-50 text-rose-600 border-rose-100',
            Medium: 'bg-amber-50 text-amber-600 border-amber-100',
            Low: 'bg-slate-50 text-slate-600 border-slate-100'
          };
          const color = priorityColors[complaint.priority] || priorityColors.Low;
          return `
            <div class="flex items-start justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
              <div class="min-w-0 flex-1">
                <h4 class="text-xs font-bold text-slate-800 truncate">${complaint.title}</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Room ${complaint.roomNumber} • ${complaint.tenantName}</p>
              </div>
              <span class="text-[9px] px-2 py-0.5 font-bold rounded-full border ${color}">${complaint.priority}</span>
            </div>
          `;
        }).join('');
      }
    }

    // Fill Audit Ledger logs
    const logsList = document.getElementById('dashboard-logs-list');
    if (logsList) {
      if (!stats.recentActivity || stats.recentActivity.length === 0) {
        logsList.innerHTML = `<p class="text-xs text-slate-400">No system events logged.</p>`;
      } else {
        logsList.innerHTML = stats.recentActivity.slice(0, 3).map(log => `
          <div class="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
            <span class="truncate max-w-[180px]" title="${log.details}">[${log.action}] ${log.details}</span>
            <span class="text-[9px] text-slate-400 flex-shrink-0">${log.date.substring(5, 16)}</span>
          </div>
        `).join('');
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    window.UI.toast('Failed to load dashboard statistics', 'error');
  }
}



// Subscribe to property filter changes
window.addEventListener('propertyChanged', () => {
  loadDashboardData();
});

// Run on boot
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = window.Auth.getCurrentUser();
  if (currentUser) {
    const displayName = currentUser.name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Admin';
    document.getElementById('welcome-title').textContent = `Welcome back, ${displayName}`;
  }
  
  // Realtime clock
  const updateClock = () => {
    const clockEl = document.getElementById('current-time-txt');
    if (clockEl) {
      const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
      clockEl.textContent = new Date().toLocaleTimeString('en-US', options);
    }
  };
  setInterval(updateClock, 1000);
  updateClock();
  
  // Initial load
  loadDashboardData();
});
