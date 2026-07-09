// Rooms Panel Controller
let allRooms = [];
let activeRoomId = null;
let currentRoomData = null;
let activeTab = 'overview';

// Fetch and render rooms grid
async function loadRooms() {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;
  
  const activePropId = window.AppState.getActivePropertyId();
  const searchFilter = document.getElementById('filter-search') ? document.getElementById('filter-search').value.toLowerCase().trim() : '';
  const floorFilter = document.getElementById('filter-floor') ? document.getElementById('filter-floor').value : 'all';
  const typeFilter = document.getElementById('filter-type') ? document.getElementById('filter-type').value : 'all';
  const statusFilter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'all';
  const acFilter = document.getElementById('filter-ac') ? document.getElementById('filter-ac').value : 'all';
  
  try {
    const url = activePropId === 'all' ? '/rooms' : `/rooms?propertyId=${activePropId}`;
    allRooms = await window.apiRequest(url);
    
    // Dynamically rebuild Floor options based on available floors in this property
    const floorSelect = document.getElementById('filter-floor');
    if (floorSelect) {
      const prevFloorValue = floorSelect.value;
      const uniqueFloors = [...new Set(allRooms.map(r => r.floor !== undefined ? Number(r.floor) : null).filter(f => f !== null))].sort((a, b) => a - b);
      
      let floorOptions = `<option value="all">🏢 All Floors</option>`;
      uniqueFloors.forEach(floor => {
        const label = floor === 0 ? 'Ground Floor' : `Floor ${floor}`;
        floorOptions += `<option value="${floor}">${label}</option>`;
      });
      floorSelect.innerHTML = floorOptions;
      
      if (prevFloorValue === 'all' || uniqueFloors.includes(Number(prevFloorValue))) {
        floorSelect.value = prevFloorValue;
      } else {
        floorSelect.value = 'all';
      }
    }
    
    const currentFloorFilter = floorSelect ? floorSelect.value : 'all';
    
    let filtered = allRooms;
    
    // Apply client filters
    if (searchFilter) {
      filtered = filtered.filter(r => r.roomNumber.toLowerCase().includes(searchFilter));
    }
    if (currentFloorFilter !== 'all') {
      filtered = filtered.filter(r => String(r.floor) === currentFloorFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'Partially Occupied') {
        filtered = filtered.filter(r => r.occupiedBeds > 0 && r.occupiedBeds < r.totalBeds);
      } else if (statusFilter === 'Available') {
        filtered = filtered.filter(r => r.occupiedBeds === 0 && r.status === 'Available');
      } else if (statusFilter === 'Full') {
        filtered = filtered.filter(r => r.status === 'Full' || r.occupiedBeds === r.totalBeds);
      } else {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
    }
    if (acFilter !== 'all') {
      filtered = filtered.filter(r => r.acType === acFilter);
    }
    
    // Sort rooms by floor number first (0/Ground Floor at the top), then by room number alphanumerically
    filtered.sort((a, b) => {
      const floorA = Number(a.floor || 0);
      const floorB = Number(b.floor || 0);
      if (floorA !== floorB) {
        return floorA - floorB;
      }
      const numA = String(a.roomNumber || a.room_number || '');
      const numB = String(b.roomNumber || b.room_number || '');
      return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    document.getElementById('rooms-count-txt').textContent = `${filtered.length} units listed`;
    
    if (filtered.length === 0) {
      grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-12";
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-white text-center">
            <div class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <i data-lucide="door-closed" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No rooms match criteria</h3>
            <p class="text-xs text-slate-450 mt-1">Try modifying your filter selections or register a new room unit.</p>
          </div>
        </div>
      `;
    } else {
      grid.className = "space-y-8 pb-12";
      
      // Group by floor
      const groups = {};
      filtered.forEach(room => {
        const floorNum = Number(room.floor !== undefined ? room.floor : 0);
        if (!groups[floorNum]) groups[floorNum] = [];
        groups[floorNum].push(room);
      });
      
      // Sort floor numbers ascending
      const sortedFloors = Object.keys(groups).map(Number).sort((a, b) => a - b);
      
      grid.innerHTML = sortedFloors.map(floorNum => {
        const roomsInFloor = groups[floorNum];
        const floorLabel = floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`;
        
        const cardsHtml = roomsInFloor.map(room => {
          const occupancyPercent = room.totalBeds > 0 ? Math.round((room.occupiedBeds / room.totalBeds) * 100) : 0;
          
          const statusColorClass = 
            room.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/80' :
            room.status === 'Full' ? 'bg-green-50 text-green-600 border-green-100/80' :
            'bg-slate-50 text-slate-500 border-slate-100/80';

          const statusDropdown = `
            <select onclick="event.stopPropagation()" onchange="window.changeRoomStatus('${room.id}', this.value)" class="${statusColorClass} border text-[10px] font-extrabold px-3 py-1 rounded-full cursor-pointer focus:outline-none hover:bg-opacity-80 transition-all">
              <option value="Available" ${room.status === 'Available' ? 'selected' : ''}>Available</option>
              <option value="Full" ${room.status === 'Full' ? 'selected' : ''}>Fully Booked</option>
              <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
            </select>
          `;
          
          const acText = room.acType === 'AC' ? 'AC' : 'Non-AC';
          
          return `
            <div onclick="openRoomDetails('${room.id}')" class="bento-card group p-6 flex flex-col justify-between space-y-4 cursor-pointer hover:border-green-200/50 hover:shadow-md transition-all duration-300">
              <div>
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Floor ${room.floor} • Unit • ${acText}</span>
                    <h3 class="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                      Room ${room.roomNumber}
                      <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-green-650 transition-all duration-300"></i>
                    </h3>
                  </div>
                  ${statusDropdown}
                </div>

                <!-- Occupancy bar -->
                <div class="pt-4 space-y-1.5">
                  <div class="flex justify-between items-center text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                    <span>Occupancy</span>
                    <span class="text-slate-800">${room.occupiedBeds} / ${room.totalBeds} Beds</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${occupancyPercent}%"></div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold text-slate-600 border-t border-slate-100 mt-4">
                  <div>
                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Sharing Tier</p>
                    <p class="text-slate-800 mt-0.5 font-bold">${room.type} Sharing</p>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Monthly Rent</p>
                    <p class="text-green-600 mt-0.5 font-extrabold">₹${room.price.toLocaleString()} / Bed</p>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('');

        return `
          <div class="space-y-4">
            <h3 class="text-xs font-black text-slate-500 flex items-center gap-2 tracking-widest border-b border-slate-200/65 pb-2 uppercase">
              <span class="w-2.5 h-2.5 rounded bg-indigo-600"></span>
              <span>${floorLabel}</span>
              <span class="text-[9px] text-slate-450 font-extrabold ml-1">(${roomsInFloor.length} Units)</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${cardsHtml}
            </div>
          </div>`;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load rooms board:', err);
    window.UI.toast('Failed to load rooms list', 'error');
  }
}

// Global active status changer from card dropdown
async function changeRoomStatus(id, newStatus) {
  try {
    await window.apiRequest(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    window.UI.toast('Room status updated', 'success');
    loadRooms();
    if (activeRoomId === id) {
      openRoomDetails(id); // reload drawer if active
    }
  } catch (err) {
    window.UI.toast(err.message || 'Failed to update status', 'error');
    loadRooms();
  }
}
window.changeRoomStatus = changeRoomStatus;

// Drawer: Open Room Details
async function openRoomDetails(roomId) {
  activeRoomId = roomId;
  
  // Show drawer container
  const modal = document.getElementById('room-details-modal');
  const content = document.getElementById('details-drawer-content');
  if (!modal || !content) return;
  
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('translate-x-full');
    content.classList.add('translate-x-0');
  }, 10);
  
  // Fetch details
  try {
    // 1. Room Metadata
    currentRoomData = await window.apiRequest(`/rooms/${roomId}`);
    
    // Update Header
    document.getElementById('detail-header-title').textContent = `Room Unit ${currentRoomData.roomNumber}`;
    document.getElementById('detail-header-floor').textContent = `Floor ${currentRoomData.floor} • ${currentRoomData.category}`;
    
    const statusColorClass = 
      currentRoomData.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
      currentRoomData.status === 'Full' ? 'bg-green-50 text-green-600 border border-green-100' :
      'bg-slate-50 text-slate-500 border border-slate-100';
    
    document.getElementById('detail-header-status-badge').className = `${statusColorClass} text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider`;
    document.getElementById('detail-header-status-badge').textContent = currentRoomData.status;

    // 2. Fetch all tenants and filter for active ones in this room
    const allTenants = await window.apiRequest('/tenants');
    const activeTenants = allTenants.filter(t => String(t.roomId || '') === String(roomId || '') && t.status === 'Active');
    
    // 3. Fetch complaints for these tenants or room unit
    const allComplaints = await window.apiRequest('/complaints');
    const roomComplaints = allComplaints.filter(c => c.roomNumber === currentRoomData.roomNumber || activeTenants.some(t => t.id === c.tenantId));

    // 4. Fetch rents payments for these tenants
    const allRents = await window.apiRequest('/rents');
    const roomRents = allRents.filter(r => activeTenants.some(t => t.id === r.tenantId));

    // Update Overview fields
    document.getElementById('detail-property').textContent = currentRoomData.propertyName || 'Unknown Property';
    document.getElementById('detail-category-sharing').textContent = `${currentRoomData.category} • ${currentRoomData.type} Sharing`;
    document.getElementById('detail-ac-type').textContent = currentRoomData.acType || 'Non-AC';
    document.getElementById('detail-rent').textContent = `₹${currentRoomData.price.toLocaleString()} / Bed`;
    document.getElementById('detail-deposit').textContent = `₹${(currentRoomData.securityDeposit || 0).toLocaleString()}`;
    document.getElementById('detail-occupancy').textContent = `${activeTenants.length} of ${currentRoomData.totalBeds} Beds Occupied`;
    
    // Facilities list
    const facs = currentRoomData.facilities ? currentRoomData.facilities.split(',').map(f => f.trim()) : [];
    document.getElementById('detail-facilities-list').innerHTML = facs.length > 0
      ? facs.map(f => `<span class="bg-green-50 border border-green-100/50 text-green-600 px-3 py-1 rounded-xl text-xs font-bold">${f}</span>`).join('')
      : `<span class="text-xs text-slate-400 font-bold italic">No facilities added.</span>`;
      
    // Notes
    document.getElementById('detail-notes').textContent = currentRoomData.notes || 'No internal configuration notes added.';

    // Populate Tenants & Beds Map
    populateBedsMap(activeTenants, roomRents);

    // Populate Payments Tab
    const monthlyRevenue = activeTenants.length * currentRoomData.price;
    const pendingRent = roomRents.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.amount, 0);
    document.getElementById('detail-payments-revenue').textContent = `₹${monthlyRevenue.toLocaleString()}`;
    document.getElementById('detail-payments-pending').textContent = `₹${pendingRent.toLocaleString()}`;
    
    document.getElementById('detail-payments-history-rows').innerHTML = roomRents.length > 0
      ? roomRents.map(r => `
          <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
            <td class="p-3 font-semibold text-slate-700">${r.tenantName}</td>
            <td class="p-3 text-slate-500">${r.month || 'Current Month'}</td>
            <td class="p-3 font-bold text-slate-800">₹${r.amount.toLocaleString()}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                r.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'
              }">${r.status}</span>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="4" class="p-4 text-center text-slate-400 font-bold italic">No payments logged yet.</td></tr>`;

    // Populate Complaints Tab
    document.getElementById('detail-complaints-list-container').innerHTML = roomComplaints.length > 0
      ? roomComplaints.map(c => `
          <div class="p-4 border border-slate-150 rounded-2xl space-y-2 hover:border-slate-350 transition-all bg-white">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold text-slate-800">${c.title}</h5>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }">${c.status}</span>
            </div>
            <p class="text-[11px] text-slate-500">${c.description}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-50">
              <span>Reported by: ${c.tenantName}</span>
              <span>Date: ${c.date}</span>
            </div>
          </div>
        `).join('')
      : `<div class="py-8 text-center text-slate-400 font-bold italic text-xs">No complaints raised for this room unit.</div>`;

    // Populate timeline logs from tenants checkin/out logs
    const stays = allTenants.filter(t => String(t.roomId || '') === String(roomId || '')); // active or checked_out stayed in this room
    document.getElementById('detail-stays-timeline').innerHTML = stays.length > 0
      ? stays.map(t => {
          const type = t.status === 'Active' ? 'Check-in' : 'Checked Out';
          const icon = t.status === 'Active' ? 'user-plus' : 'user-minus';
          const color = t.status === 'Active' ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-400 bg-slate-50 border-slate-100';
          const date = t.status === 'Active' ? t.checkInDate : (t.checkOutDate || '—');
          
          return `
            <div class="relative pb-2">
              <span class="absolute -left-[37px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border ${color} shrink-0 text-xs font-bold">
                <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
              </span>
              <p class="text-xs font-bold text-slate-800">${t.name} — ${type}</p>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Date: ${date}</p>
            </div>
          `;
        }).join('')
      : `<p class="text-xs text-slate-400 font-bold italic">No stay timeline records found.</p>`;

    // Switch default tab
    switchTab('overview');
    
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error(err);
    window.UI.toast('Failed to load room details drawer', 'error');
  }
}
window.openRoomDetails = openRoomDetails;

// Drawer: Close Details
function closeRoomDetails() {
  const content = document.getElementById('details-drawer-content');
  const modal = document.getElementById('room-details-modal');
  if (!modal || !content) return;
  
  content.classList.remove('translate-x-0');
  content.classList.add('translate-x-full');
  setTimeout(() => {
    modal.classList.add('hidden');
    activeRoomId = null;
    currentRoomData = null;
  }, 250);
}
window.closeRoomDetails = closeRoomDetails;

// Tabs switcher inside details drawer
function switchTab(tabName) {
  activeTab = tabName;
  const tabs = ['overview', 'tenants', 'payments', 'maintenance', 'history'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const pane = document.getElementById(`tab-content-${t}`);
    if (t === tabName) {
      btn.className = "py-4 text-xs font-bold uppercase tracking-wider border-b-2 border-green-600 text-green-600";
      pane.classList.remove('hidden');
    } else {
      btn.className = "py-4 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-slate-600";
      pane.classList.add('hidden');
    }
  });
}
window.switchTab = switchTab;

// Populate Visual Beds & Tenant List inside Beds tab
function populateBedsMap(activeTenants, roomRents = []) {
  const container = document.getElementById('detail-beds-list-container');
  if (!container || !currentRoomData) return;
  
  const totalBeds = currentRoomData.totalBeds || 1;
  let html = '';
  
  const unassigned = activeTenants.filter(t => !t.bedNumber);
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  for (let i = 0; i < totalBeds; i++) {
    const bedLetter = String.fromCharCode(65 + i); // A, B, C...
    const bedIndex = i + 1;
    let tenant = activeTenants.find(t => t.bedNumber === bedIndex);
    
    if (!tenant && unassigned.length > 0) {
      tenant = unassigned.shift();
    }
    
    if (tenant) {
      // Check current billing month payment status
      const tenantRent = roomRents.find(r => String(r.tenantId) === String(tenant.id) && r.month === currentMonth);
      const rentStatus = tenantRent ? tenantRent.status : 'Pending';
      const badgeColor = rentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100';

      // Occupied Bed
      html += `
        <div class="bg-green-50/30 border border-green-100 rounded-2xl p-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-green-50 border border-green-150 text-green-600 font-extrabold flex items-center justify-center text-xs shrink-0">Bed ${bedLetter}</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-800">${tenant.name}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black border ${badgeColor}">${rentStatus}</span>
              </div>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Phone: ${tenant.phone} | Rent: ₹${tenant.rentAmount || currentRoomData.price}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="triggerTransferTenant('${tenant.id}', '${tenant.name}')" class="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1">
              <i data-lucide="shuffle" class="w-3.5 h-3.5"></i> Move
            </button>
            <button onclick="triggerVacateTenant('${tenant.id}')" class="px-3 py-1.5 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-1">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Vacate
            </button>
          </div>
        </div>
      `;
    } else {
      // Vacant Bed
      html += `
        <div class="bg-slate-50 border border-slate-150 border-dashed rounded-2xl p-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 font-extrabold flex items-center justify-center text-xs shrink-0">Bed ${bedLetter}</span>
            <div>
              <p class="text-sm font-bold text-slate-400">Vacant Bed</p>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Available for tenant check-in</p>
            </div>
          </div>
          <button onclick="triggerAssignTenant('${bedLetter}', ${bedIndex})" class="bg-white border border-green-200 text-green-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-green-50/50 transition-all flex items-center gap-1.5">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Assign Bed
          </button>
        </div>
      `;
    }
  }
  
  container.innerHTML = html;
}

// ----------------------------------------------------
// ACTIONS: ASSIGN TENANT
// ----------------------------------------------------
async function triggerAssignTenant(bedLetter = 'A', bedIndex = 1) {
  if (!currentRoomData) return;
  document.getElementById('assign-room-id').value = currentRoomData.id;
  document.getElementById('assign-bed-id').value = bedIndex;
  document.getElementById('assign-bed-label').textContent = bedLetter;
  document.getElementById('assign-start-date').value = new Date().toISOString().substring(0, 10);
  
  // Fetch unassigned/checked-out/upcoming tenants to populate select
  const select = document.getElementById('assign-tenant-select');
  if (!select) return;
  
  try {
    const tenants = await window.apiRequest('/tenants');
    const available = tenants.filter(t => 
      !t.roomId || 
      t.roomId === 'null' || 
      t.roomId === 'undefined' || 
      t.roomId === '0' || 
      t.roomId === '' || 
      t.status !== 'Active'
    );
    
    if (available.length === 0) {
      select.innerHTML = `<option value="">No unassigned tenants found. Create one first in Tenants portal.</option>`;
    } else {
      select.innerHTML = available.map(t => `<option value="${t.id}">${t.name} (${t.phone})</option>`).join('');
    }
    
    window.UI.showModal('assign-tenant-modal');
  } catch (err) {
    window.UI.toast('Failed to load available tenants list', 'error');
  }
}
window.triggerAssignTenant = triggerAssignTenant;

function closeAssignModal() {
  window.UI.hideModal('assign-tenant-modal');
}
window.closeAssignModal = closeAssignModal;

document.getElementById('assign-tenant-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tenantId = document.getElementById('assign-tenant-select').value;
  const roomId = document.getElementById('assign-room-id').value;
  const bedId = Number(document.getElementById('assign-bed-id').value);
  const checkinDate = document.getElementById('assign-start-date').value;
  
  if (!tenantId) {
    window.UI.toast('Please select a tenant to assign', 'warning');
    return;
  }
  
  try {
    // Call updateTenant API to check-in this tenant to the selected room
    await window.apiRequest(`/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify({
        roomId,
        bedId,
        checkinDate,
        status: 'Active'
      })
    });
    window.UI.toast('Tenant assigned successfully', 'success');
    closeAssignModal();
    openRoomDetails(roomId); // refresh details drawer
    loadRooms(); // refresh cards
  } catch (err) {
    window.UI.toast(err.message || 'Failed to assign tenant', 'error');
  }
});

// ----------------------------------------------------
// ACTIONS: VACATE TENANT
// ----------------------------------------------------
async function triggerVacateTenant(tenantId) {
  if (!confirm('Are you sure you want to vacate this tenant from the bed unit? This will release the bed.')) return;
  try {
    await window.apiRequest(`/tenants/checkout/${tenantId}`, { method: 'PUT' });
    window.UI.toast('Tenant checked out successfully', 'success');
    if (activeRoomId) openRoomDetails(activeRoomId); // reload details
    loadRooms(); // reload cards
  } catch (err) {
    window.UI.toast(err.message || 'Failed to vacate tenant', 'error');
  }
}
window.triggerVacateTenant = triggerVacateTenant;

// ----------------------------------------------------
// ACTIONS: TRANSFER TENANT
// ----------------------------------------------------
async function triggerTransferTenant(tenantId, tenantName) {
  if (!currentRoomData) return;
  document.getElementById('transfer-tenant-id').value = tenantId;
  document.getElementById('transfer-tenant-name').textContent = tenantName;
  document.getElementById('transfer-from-room-id').value = currentRoomData.id;
  
  // Load target rooms dropdown
  const select = document.getElementById('transfer-room-select');
  if (!select) return;
  
  try {
    const resp = await window.apiRequest('/rooms');
    const rooms = Array.isArray(resp) ? resp : (resp.data || []);
    // availableBeds is not in the mapped object — compute from totalBeds - occupiedBeds
    const available = rooms.filter(r => {
      const vacantBeds = (r.totalBeds || r.total_beds || 0) - (r.occupiedBeds || r.occupied_beds || 0);
      return String(r.id) !== String(currentRoomData.id) && vacantBeds > 0;
    });
    
    if (available.length === 0) {
      select.innerHTML = `<option value="">No other rooms with vacant beds available.</option>`;
    } else {
      // use 'type' and 'price' — the correct keys from the server.js mapRoom mapper
      select.innerHTML = available.map(r => `<option value="${r.id}">Room ${r.roomNumber} - Floor ${r.floor} (${r.type || 'Double'} sharing | ₹${r.price || 0}/mo | ${(r.totalBeds || 0) - (r.occupiedBeds || 0)} bed(s) free)</option>`).join('');
    }
    
    window.UI.showModal('transfer-tenant-modal');
  } catch (err) {
    window.UI.toast('Failed to load rooms list for transfer', 'error');
  }
}
window.triggerTransferTenant = triggerTransferTenant;

function closeTransferModal() {
  window.UI.hideModal('transfer-tenant-modal');
}
window.closeTransferModal = closeTransferModal;

document.getElementById('transfer-tenant-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tenantId = document.getElementById('transfer-tenant-id').value;
  const targetRoomId = document.getElementById('transfer-room-select').value;
  const fromRoomId = document.getElementById('transfer-from-room-id').value;
  
  if (!targetRoomId) {
    window.UI.toast('Please select a target room', 'warning');
    return;
  }
  
  try {
    // Call PUT /tenants/:id to update roomId (which triggers bed transfer logic in controller)
    await window.apiRequest(`/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify({ roomId: targetRoomId })
    });
    window.UI.toast('Tenant transferred successfully', 'success');
    closeTransferModal();
    openRoomDetails(fromRoomId); // reload details
    loadRooms(); // reload cards
  } catch (err) {
    window.UI.toast(err.message || 'Failed to transfer tenant', 'error');
  }
});

// ----------------------------------------------------
// ACTIONS: COMPLAINT
// ----------------------------------------------------
async function triggerRoomComplaint() {
  if (!currentRoomData) return;
  document.getElementById('complaint-room-id').value = currentRoomData.id;
  
  const select = document.getElementById('complaint-tenant-select');
  if (!select) return;
  
  try {
    // Fetch current tenants for reporter select
    const allTenants = await window.apiRequest('/tenants');
    const activeTenants = allTenants.filter(t => t.roomId === currentRoomData.id && t.status === 'Active');
    
    if (activeTenants.length === 0) {
      window.UI.toast('Room must have at least one active tenant to file a complaint', 'warning');
      return;
    }
    
    select.innerHTML = activeTenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    
    document.getElementById('complaint-title').value = '';
    document.getElementById('complaint-desc').value = '';
    
    window.UI.showModal('room-complaint-modal');
  } catch (err) {
    window.UI.toast('Failed to load reporters list', 'error');
  }
}
window.triggerRoomComplaint = triggerRoomComplaint;

function closeRoomComplaintModal() {
  window.UI.hideModal('room-complaint-modal');
}
window.closeRoomComplaintModal = closeRoomComplaintModal;

document.getElementById('room-complaint-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const roomId = document.getElementById('complaint-room-id').value;
  const tenantId = document.getElementById('complaint-tenant-select').value;
  const title = document.getElementById('complaint-title').value;
  const description = document.getElementById('complaint-desc').value;
  
  try {
    await window.apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        title,
        description,
        roomNumber: currentRoomData.roomNumber,
        category: 'Room Maintenance',
        priority: 'Medium'
      })
    });
    window.UI.toast('Complaint raised successfully', 'success');
    closeRoomComplaintModal();
    openRoomDetails(roomId); // refresh details
  } catch (err) {
    window.UI.toast(err.message || 'Failed to raise complaint', 'error');
  }
});

// ----------------------------------------------------
// ACTIONS: CONFIGURE ROOM (EDIT CONFIG ONLY)
// ----------------------------------------------------
function triggerEditRoom() {
  if (!currentRoomData) return;
  
  // Pre-fill form
  document.getElementById('room-id').value = currentRoomData.id;
  document.getElementById('room-property-id').value = currentRoomData.propertyId;
  document.getElementById('room-number').value = currentRoomData.roomNumber;
  document.getElementById('room-floor').value = currentRoomData.floor;
  document.getElementById('room-category').value = currentRoomData.category || 'Standard';
  document.getElementById('room-type').value = currentRoomData.type;
  document.getElementById('room-total-beds').value = currentRoomData.totalBeds;
  document.getElementById('room-ac-type').value = currentRoomData.acType || 'Non-AC';
  
  // Facilities checkboxes
  const facs = currentRoomData.facilities ? currentRoomData.facilities.split(',').map(f => f.trim()) : [];
  document.getElementById('facility-wifi').checked = facs.includes('WiFi');
  document.getElementById('facility-ac').checked = facs.includes('AC');
  document.getElementById('facility-bathroom').checked = facs.includes('Attached Bathroom');
  document.getElementById('facility-balcony').checked = facs.includes('Balcony');
  document.getElementById('facility-tv').checked = facs.includes('Smart TV');
  
  document.getElementById('room-price').value = currentRoomData.price;
  document.getElementById('room-deposit').value = currentRoomData.securityDeposit || 0;
  document.getElementById('room-status').value = currentRoomData.status;
  document.getElementById('room-notes').value = currentRoomData.notes || '';
  
  // Show danger zone only for edits
  document.getElementById('danger-zone-container').style.display = 'block';
  
  document.getElementById('room-modal-title').textContent = 'Edit Room Configuration';
  window.UI.showModal('room-modal');
}
window.triggerEditRoom = triggerEditRoom;

function openAddRoomModal() {
  document.getElementById('room-form').reset();
  document.getElementById('room-id').value = '';
  document.getElementById('danger-zone-container').style.display = 'none';
  document.getElementById('room-modal-title').textContent = 'Register New Room Unit';
  window.UI.showModal('room-modal');
}
window.openAddRoomModal = openAddRoomModal;

function closeRoomModal() {
  window.UI.hideModal('room-modal');
  document.getElementById('room-form').reset();
  document.getElementById('room-id').value = '';
}
window.closeRoomModal = closeRoomModal;

async function triggerDeleteRoom() {
  const id = document.getElementById('room-id').value;
  if (!id) return;
  
  if (confirm('Are you absolutely sure you want to archive/delete this room unit? All active tenants referencing it will be unassigned.')) {
    try {
      await window.apiRequest(`/rooms/${id}`, { method: 'DELETE' });
      window.UI.toast('Room unit archived and deleted successfully', 'success');
      closeRoomModal();
      closeRoomDetails();
      loadRooms();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to archive room', 'error');
    }
  }
}
window.triggerDeleteRoom = triggerDeleteRoom;

document.getElementById('room-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('room-id').value;
  const propertyId = document.getElementById('room-property-id').value;
  const roomNumber = document.getElementById('room-number').value;
  const floor = Number(document.getElementById('room-floor').value);
  const category = document.getElementById('room-category').value;
  const type = document.getElementById('room-type').value;
  const totalBeds = Number(document.getElementById('room-total-beds').value);
  const acType = document.getElementById('room-ac-type').value;
  
  // Compile facilities
  const facilitiesArr = [];
  if (document.getElementById('facility-wifi').checked) facilitiesArr.push('WiFi');
  if (document.getElementById('facility-ac').checked) facilitiesArr.push('AC');
  if (document.getElementById('facility-bathroom').checked) facilitiesArr.push('Attached Bathroom');
  if (document.getElementById('facility-balcony').checked) facilitiesArr.push('Balcony');
  if (document.getElementById('facility-tv').checked) facilitiesArr.push('Smart TV');
  const facilities = facilitiesArr.join(', ');
  
  const price = Number(document.getElementById('room-price').value);
  const securityDeposit = Number(document.getElementById('room-deposit').value);
  const status = document.getElementById('room-status').value;
  const notes = document.getElementById('room-notes').value;
  
  const payload = { 
    propertyId, roomNumber, floor, category, type, totalBeds, 
    acType, facilities, price, securityDeposit, status, notes 
  };
  
  try {
    if (id) {
      await window.apiRequest(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Room unit configuration updated', 'success');
      closeRoomModal();
      openRoomDetails(id); // refresh drawer
      loadRooms();
    } else {
      await window.apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Room unit registered successfully', 'success');
      closeRoomModal();
      loadRooms();
    }
  } catch (err) {
    window.UI.toast(err.message || 'Failed to save room unit configuration', 'error');
  }
});

// Dropdowns and listeners setup
async function populatePropertyDropdown() {
  const select = document.getElementById('room-property-id');
  if (!select) return;
  try {
    const props = await window.apiRequest('/properties');
    select.innerHTML = props.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load property list for dropdown:', err);
  }
}

// Watch filters change
window.addEventListener('propertyChanged', () => {
  loadRooms();
});

document.addEventListener('DOMContentLoaded', () => {
  populatePropertyDropdown();
  loadRooms();

  // Watch filters change
  if (document.getElementById('filter-search')) {
    document.getElementById('filter-search').addEventListener('input', loadRooms);
  }
  if (document.getElementById('filter-floor')) {
    document.getElementById('filter-floor').addEventListener('change', loadRooms);
  }
  if (document.getElementById('filter-type')) {
    document.getElementById('filter-type').addEventListener('change', loadRooms);
  }
  if (document.getElementById('filter-status')) {
    document.getElementById('filter-status').addEventListener('change', loadRooms);
  }
  if (document.getElementById('filter-ac')) {
    document.getElementById('filter-ac').addEventListener('change', loadRooms);
  }

  // Auto-fill bed capacity when room type (Sharing Type) changes
  const roomTypeSelect = document.getElementById('room-type');
  const capacityInput = document.getElementById('room-total-beds');
  if (roomTypeSelect && capacityInput) {
    roomTypeSelect.addEventListener('change', (e) => {
      const typeMap = {
        'Single': 1,
        'Double': 2,
        'Triple': 3,
        'Four-Sharing': 4
      };
      if (typeMap[e.target.value] !== undefined) {
        capacityInput.value = typeMap[e.target.value];
      }
    });
  }
});
