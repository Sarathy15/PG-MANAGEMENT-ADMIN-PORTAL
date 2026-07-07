// Reports and Audits Controller
async function loadPropertySummaries() {
  const tbody = document.getElementById('property-breakdowns-tbody');
  if (!tbody) return;
  
  try {
    const props = await window.apiRequest('/properties');
    const rooms = await window.apiRequest('/rooms');
    const tenants = await window.apiRequest('/tenants');
    
    let grandTotalBeds = 0;
    let grandOccupiedBeds = 0;
    let grandTotalRooms = 0;
    
    tbody.innerHTML = props.map(p => {
      const propRooms = rooms.filter(r => String(r.propertyId) === String(p.id));
      const totalBeds = propRooms.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
      const occupiedBeds = propRooms.reduce((acc, curr) => acc + (Number(curr.occupiedBeds) || 0), 0);
      const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      
      grandTotalBeds += totalBeds;
      grandOccupiedBeds += occupiedBeds;
      grandTotalRooms += propRooms.length;
      
      return `
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="px-6 py-4 font-bold text-slate-800">${p.name}</td>
          <td class="px-6 py-4 text-slate-500">${p.phone || '—'} • ${p.email || '—'}</td>
          <td class="px-6 py-4">${propRooms.length} Rooms</td>
          <td class="px-6 py-4">${occupiedBeds} / ${totalBeds} Beds</td>
          <td class="px-6 py-4 font-bold text-slate-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-800">${occupancyPercent}%</span>
              <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                <div class="h-full bg-green-500 rounded-full" style="width: ${occupancyPercent}%"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const overallPercent = grandTotalBeds > 0 ? Math.round((grandOccupiedBeds / grandTotalBeds) * 100) : 0;
    const activeTenantsCount = (tenants || []).filter(t => t.status === 'active').length;

    if (document.getElementById('stats-occupancy-percent')) {
      document.getElementById('stats-occupancy-percent').textContent = `${overallPercent}%`;
    }
    if (document.getElementById('stats-occupancy-ratio')) {
      document.getElementById('stats-occupancy-ratio').textContent = `(${grandOccupiedBeds}/${grandTotalBeds} beds)`;
    }
    if (document.getElementById('stats-total-rooms')) {
      document.getElementById('stats-total-rooms').textContent = `${grandTotalRooms} Rooms`;
    }
    if (document.getElementById('stats-total-tenants')) {
      document.getElementById('stats-total-tenants').textContent = `${activeTenantsCount} Tenants`;
    }
    if (document.getElementById('stats-total-properties')) {
      document.getElementById('stats-total-properties').textContent = `${props.length} PGs`;
    }
    
  } catch (err) {
    console.error('Failed to load properties summary logs:', err);
  }
}

async function loadAuditLedger() {
  const tbody = document.getElementById('audit-logs-tbody');
  if (!tbody) return;
  
  try {
    const logs = await window.apiRequest('/audit-logs');
    document.getElementById('audit-logs-count').textContent = `${logs.length} operations logged`;
    
    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-8 text-center text-slate-400">
            No system audit logs recorded.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = logs.map(log => {
        let actionColor = 'text-slate-600 bg-slate-100 border border-slate-200';
        if (log.action === 'CREATE' || log.action === 'CHECKIN') actionColor = 'text-emerald-600 bg-emerald-50 border border-emerald-150';
        if (log.action === 'DELETE' || log.action === 'CHECKOUT') actionColor = 'text-rose-600 bg-rose-50 border border-rose-150';
        if (log.action === 'UPDATE' || log.action === 'STATUS_CHANGE') actionColor = 'text-green-600 bg-green-50 border border-green-150';
        
        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4 font-semibold text-slate-800">${log.operator}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionColor}">
                ${log.action}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600 max-w-sm truncate" title="${log.details}">${log.details}</td>
            <td class="px-6 py-4 text-slate-400 text-[10px] font-mono">${log.date}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to fetch audit ledger logs:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPropertySummaries();
  loadAuditLedger();
});
