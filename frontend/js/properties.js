// Properties Page Controller
let wizardStep = 1;
let wizardMode = 'create'; // 'create' | 'edit'
let editingPropertyId = null;
let allPropertiesData = [];

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadProperties() {
  const grid = document.getElementById('properties-grid');
  if (!grid) return;

  try {
    const data = await window.apiRequest('/properties');
    allPropertiesData = Array.isArray(data) ? data : (data.data || []);

    if (allPropertiesData.length === 0) {
      grid.innerHTML = `
        <div class="col-span-3 flex flex-col items-center justify-center py-24 text-center">
          <div class="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-5">
            <i data-lucide="building-2" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-extrabold text-slate-800">No Properties Yet</h3>
          <p class="text-sm text-slate-400 mt-2">Start by registering your first PG property.</p>
          <button onclick="openAddPropertyWizard()" class="mt-6 bg-indigo-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-indigo-100">
            + Add First Property
          </button>
        </div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = allPropertiesData.map(p => buildPropertyCard(p)).join('');
    if (window.lucide) window.lucide.createIcons();

    // If came from property-detail with ?edit=id, open edit modal
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      const prop = allPropertiesData.find(p => String(p.id) === String(editId));
      if (prop) setTimeout(() => openEditPropertyWizard(prop), 200);
    }

  } catch (err) {
    console.error('Load properties error:', err);
    grid.innerHTML = `<p class="text-red-500 text-sm">Failed to load properties: ${err.message}</p>`;
  }
}

function buildPropertyCard(p) {
  const img = p.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
  const occupancy = p.totalBeds > 0 ? Math.round((p.occupiedBeds / p.totalBeds) * 100) : 0;
  const statusColor = p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  const amenitiesArr = Array.isArray(p.amenities) ? p.amenities : (p.amenities ? String(p.amenities).split(',').map(a => a.trim()) : []);

  return `
    <div class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer" onclick="openPropertyDetail('${p.id}')">
      <div class="relative h-40 overflow-hidden">
        <img src="${img}" alt="${p.propertyName || p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        <div class="absolute top-3 left-3 flex items-center gap-2">
          <span class="text-[9px] font-extrabold uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-1 rounded-full">${p.propertyType || 'PG'}</span>
          <span class="text-[9px] font-extrabold uppercase tracking-widest ${statusColor} px-2.5 py-1 rounded-full">${p.status || 'active'}</span>
        </div>
        <div class="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="event.stopPropagation(); openEditPropertyWizard(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="bg-white text-slate-600 p-1.5 rounded-lg shadow hover:bg-green-50 hover:text-green-600 text-[11px] font-bold transition-all" title="Edit">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="event.stopPropagation(); deleteProperty('${p.id}', '${(p.propertyName || p.name || '').replace(/'/g, "\\'")}')" class="bg-white text-slate-600 p-1.5 rounded-lg shadow hover:bg-rose-50 hover:text-rose-600 text-[11px] font-bold transition-all" title="Delete">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
      <div class="p-5 space-y-3">
        <div>
          <p class="text-[9px] font-bold text-slate-400 tracking-widest font-mono">${p.propertyCode || '—'}</p>
          <h3 class="text-base font-extrabold text-slate-900 mt-0.5 truncate">${p.propertyName || p.name || 'Unnamed'}</h3>
          <p class="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <i data-lucide="map-pin" class="w-3 h-3 shrink-0"></i> ${p.address || '—'}
          </p>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-slate-50 border border-slate-100 rounded-xl py-2">
            <p class="text-[10px] font-bold text-slate-400">Rooms</p>
            <p class="text-sm font-extrabold text-slate-900">${p.totalRooms || 0}</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl py-2">
            <p class="text-[10px] font-bold text-slate-400">Beds</p>
            <p class="text-sm font-extrabold text-slate-900">${p.occupiedBeds || 0}/${p.totalBeds || 0}</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl py-2">
            <p class="text-[10px] font-bold text-slate-400">Occ.</p>
            <p class="text-sm font-extrabold ${occupancy >= 80 ? 'text-rose-600' : 'text-emerald-600'}">${occupancy}%</p>
          </div>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5">
          <div class="bg-green-500 h-1.5 rounded-full transition-all" style="width:${occupancy}%"></div>
        </div>
        ${amenitiesArr.length > 0 ? `
        <div class="flex flex-wrap gap-1 pt-1">
          ${amenitiesArr.slice(0, 4).map(a => `<span class="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">${a}</span>`).join('')}
          ${amenitiesArr.length > 4 ? `<span class="text-[9px] text-slate-400 font-bold px-1">+${amenitiesArr.length - 4}</span>` : ''}
        </div>` : ''}
        <button onclick="event.stopPropagation(); openPropertyDetail('${p.id}')" class="w-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold py-2.5 rounded-xl hover:bg-green-100 transition-all mt-1">
          View Details →
        </button>
      </div>
    </div>`;
}

function openPropertyDetail(id) {
  window.location.href = `/property-detail.html?id=${id}`;
}
window.openPropertyDetail = openPropertyDetail;

// ─── WIZARD STATE ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;
const STEP_TITLES = [
  'Basic Information', 'Location', 'Building Structure', 'Amenities', 'Contact & Dates', 'Review & Confirm'
];

function openAddPropertyWizard() {
  wizardMode = 'create';
  editingPropertyId = null;
  resetWizard();
  generateFloorInputs();
  document.getElementById('wiz-code').value = `PROP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  // Pre-select WiFi
  document.querySelectorAll('.amenity-chip').forEach(c => {
    if (c.textContent.includes('WiFi')) c.classList.add('selected');
    else c.classList.remove('selected');
  });
  document.getElementById('wiz-gallery').value = '';
  updateGalleryPreviews();

  // Reset Cover dropzone previews
  const preview = document.getElementById('cover-image-preview');
  const overlay = document.getElementById('cover-image-overlay');
  if (preview && overlay) {
    preview.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  document.getElementById('property-modal').classList.remove('hidden');
}
window.openAddPropertyWizard = openAddPropertyWizard;

async function openEditPropertyWizard(propData) {
  const p = typeof propData === 'string' ? JSON.parse(propData) : propData;
  wizardMode = 'edit';
  editingPropertyId = p.id;
  resetWizard();

  // Fetch existing rooms to populate room details
  let rooms = [];
  try {
    const roomsRes = await window.apiRequest(`/rooms?propertyId=${p.id}`);
    rooms = roomsRes.data || roomsRes || [];
  } catch (err) {
    console.error('Failed to load rooms for edit:', err);
  }

  // Populate fields
  document.getElementById('wiz-name').value = p.propertyName || p.name || '';
  document.getElementById('wiz-code').value = p.propertyCode || '';
  document.getElementById('wiz-type').value = p.propertyType || 'Boys PG';
  document.getElementById('wiz-description').value = p.description || '';
  document.getElementById('wiz-address').value = p.address || '';
  document.getElementById('wiz-city').value = p.city || '';
  document.getElementById('wiz-state').value = p.state || '';
  document.getElementById('wiz-pincode').value = p.pincode || '';
  document.getElementById('wiz-maps').value = p.googleMapsLink || '';
  document.getElementById('wiz-landmarks').value = p.nearbyLandmarks || '';
  document.getElementById('wiz-phone').value = p.phone || p.ownerPhone || '';
  document.getElementById('wiz-email').value = p.email || '';
  document.getElementById('wiz-opening').value = p.openingDate ? p.openingDate.split('T')[0] : '';
  document.getElementById('wiz-image').value = p.image || '';
  document.getElementById('wiz-gallery').value = p.galleryImages || p.gallery_images || '';
  updateGalleryPreviews();

  // Show Cover dropzone preview
  const preview = document.getElementById('cover-image-preview');
  const overlay = document.getElementById('cover-image-overlay');
  if (p.image && preview && overlay) {
    preview.src = p.image;
    preview.classList.remove('hidden');
    overlay.classList.remove('hidden');
  } else if (preview && overlay) {
    preview.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  // Type cards
  document.querySelectorAll('.type-card').forEach(card => {
    const txt = card.querySelector('p')?.textContent.trim();
    if (txt === (p.propertyType || 'Boys PG')) card.classList.add('selected');
    else card.classList.remove('selected');
  });

  // Building structure
  const bs = p.buildingStructure
    ? (typeof p.buildingStructure === 'string' ? JSON.parse(p.buildingStructure) : p.buildingStructure) : null;
  if (bs && bs.floors) {
    document.getElementById('wiz-floor-count').value = bs.floors.length - 1; // subtract ground
    // Map rooms list to floor roomDetails array while ensuring unique floors
    const uniqueFloors = [];
    const seenFloors = new Set();
    bs.floors.forEach(f => {
      const floorNum = Number(f.floor);
      if (!seenFloors.has(floorNum)) {
        seenFloors.add(floorNum);
        uniqueFloors.push(f);
      }
    });

    // Deduplicate rooms array by room number
    const uniqueRoomsMap = new Map();
    rooms.forEach(r => {
      const roomNum = r.room_number || r.roomNumber || r.num;
      if (roomNum && !uniqueRoomsMap.has(roomNum)) {
        uniqueRoomsMap.set(roomNum, r);
      }
    });
    const deduplicatedRooms = Array.from(uniqueRoomsMap.values());

    const mappedFloors = uniqueFloors.map(f => {
      const floorRooms = deduplicatedRooms.filter(r => Number(r.floor) === Number(f.floor));
      return {
        ...f,
        rooms: floorRooms.length, // Dynamic self-healing: use actual unique rooms count
        roomDetails: floorRooms
      };
    });
    generateFloorInputsFromData(mappedFloors);
  } else {
    generateFloorInputs();
  }

  // Amenities
  const amenitiesArr = Array.isArray(p.amenities) ? p.amenities : (p.amenities ? String(p.amenities).split(',').map(a => a.trim()) : []);
  document.querySelectorAll('.amenity-chip').forEach(chip => {
    const label = chip.textContent.trim().replace(/^[^\w]+/, '').trim();
    const matched = amenitiesArr.some(a => a.trim().toLowerCase() === label.toLowerCase());
    chip.classList.toggle('selected', matched);
  });

  // Center Leaflet Map
  const link = p.googleMapsLink || '';
  const parsed = tryParseCoordsFromLink(link);
  if (parsed) {
    setTimeout(() => showMapAt(parsed[0], parsed[1]), 150);
  } else if (p.address) {
    setTimeout(() => geocodeAndShowMap(p.address), 150);
  }

  document.getElementById('property-modal').classList.remove('hidden');
  document.querySelector('#property-modal h2').closest('.bg-white').querySelector('h2').textContent = STEP_TITLES[0];
}
window.openEditPropertyWizard = openEditPropertyWizard;

function closePropertyModal() {
  document.getElementById('property-modal').classList.add('hidden');
  // Clear the ?edit=id query parameter from the URL if present to prevent reopening loop
  if (window.location.search.includes('edit=')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
window.closePropertyModal = closePropertyModal;

function resetWizard() {
  wizardStep = 1;
  document.querySelectorAll('.step-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  updateWizardUI();
}

function updateWizardUI() {
  document.getElementById('wizard-step-label').textContent = `Step ${wizardStep} of ${TOTAL_STEPS}`;
  document.getElementById('wizard-step-title').textContent = STEP_TITLES[wizardStep - 1];
  document.getElementById('wizard-back-btn').style.visibility = wizardStep === 1 ? 'hidden' : 'visible';
  const nextBtn = document.getElementById('wizard-next-btn');
  if (wizardStep === TOTAL_STEPS) {
    nextBtn.textContent = wizardMode === 'edit' ? '✓ Save Changes' : '✓ Create Property';
    nextBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    nextBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
  } else {
    nextBtn.textContent = 'Next →';
    nextBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
    nextBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
  }
  // Update progress bars
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const bar = document.getElementById(`prog-${i}`);
    if (bar) bar.className = `h-1 flex-1 rounded-full transition-all ${i <= wizardStep ? 'bg-indigo-600' : 'bg-slate-200'}`;
  }
  // Leaflet map refresh when Step 2 becomes visible
  if (wizardStep === 2) {
    const link = document.getElementById('wiz-maps').value;
    const parsed = tryParseCoordsFromLink(link);
    if (parsed) {
      setTimeout(() => showMapAt(parsed[0], parsed[1]), 100);
    } else {
      const address = document.getElementById('wiz-address').value;
      if (address && address.length > 5) {
        setTimeout(() => geocodeAndShowMap(address), 100);
      }
    }
  }
}

function wizardNext() {
  if (!validateStep(wizardStep)) return;
  if (wizardStep === TOTAL_STEPS) {
    submitPropertyWizard();
    return;
  }
  if (wizardStep === TOTAL_STEPS - 1) buildReviewSummary();
  document.getElementById(`step-${wizardStep}`).classList.remove('active');
  wizardStep++;
  document.getElementById(`step-${wizardStep}`).classList.add('active');
  if (wizardStep === TOTAL_STEPS) buildReviewSummary();
  updateWizardUI();
}
window.wizardNext = wizardNext;

function wizardBack() {
  if (wizardStep === 1) return;
  document.getElementById(`step-${wizardStep}`).classList.remove('active');
  wizardStep--;
  document.getElementById(`step-${wizardStep}`).classList.add('active');
  updateWizardUI();
}
window.wizardBack = wizardBack;

function validateStep(step) {
  const showErr = (msg) => { window.UI?.toast(msg, 'error') || alert(msg); };
  if (step === 1) {
    if (!document.getElementById('wiz-name').value.trim()) { showErr('Property name is required'); return false; }
  }
  if (step === 2) {
    if (!document.getElementById('wiz-address').value.trim()) { showErr('Address is required'); return false; }
    if (!document.getElementById('wiz-city').value.trim()) { showErr('City is required'); return false; }
  }
  if (step === 5) {
    if (!document.getElementById('wiz-phone').value.trim()) { showErr('Contact phone is required'); return false; }
    if (!document.getElementById('wiz-email').value.trim()) { showErr('Contact email is required'); return false; }
  }
  return true;
}

// ─── BUILDING STRUCTURE ───────────────────────────────────────────────────────
function generateFloorInputs() {
  const total = parseInt(document.getElementById('wiz-floor-count').value) || 0;
  const floors = [{ label: 'Ground Floor', floor: 0 }];
  for (let i = 1; i <= total; i++) floors.push({ label: `Floor ${i}`, floor: i });
  generateFloorInputsFromData(floors);
}
window.generateFloorInputs = generateFloorInputs;

function generateFloorInputsFromData(floors) {
  const container = document.getElementById('floor-inputs-container');
  container.innerHTML = floors.map(f => {
    const isGround = f.floor === 0;
    const floorLabel = f.label;
    const floorRoomsCount = f.rooms || 0;
    
    return `
    <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-3" id="floor-card-${f.floor}">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-green-50 border border-green-100 text-green-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
            ${isGround ? 'G' : f.floor}
          </div>
          <span class="text-sm font-extrabold text-slate-700">${floorLabel}</span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-400 font-bold">Rooms</label>
          <input type="number" min="0" max="25" value="${floorRoomsCount}" placeholder="0"
            class="w-16 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            data-floor="${f.floor}" oninput="handleFloorRoomsChange(this, ${f.floor})">
        </div>
      </div>
      <!-- Container for individual rooms inputs of this floor -->
      <div id="rooms-list-container-${f.floor}" class="pt-2 border-t border-slate-200/60 ${floorRoomsCount > 0 ? '' : 'hidden'}">
        <!-- Quick Set Defaults for Floor -->
        <div class="flex items-center justify-between bg-slate-100/60 rounded-xl px-3 py-1.5 mb-2.5 gap-2 text-[10px] text-slate-500 font-bold border border-slate-200/30">
          <span>Apply to all:</span>
          <div class="flex items-center gap-1.5 flex-1 justify-end">
            <select id="bulk-type-${f.floor}" class="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none font-semibold text-slate-700 cursor-pointer">
              <option value="Single sharing">Single sharing</option>
              <option value="Double sharing" selected>Double sharing</option>
              <option value="Triple sharing">Triple sharing</option>
              <option value="Four sharing">Four sharing</option>
            </select>
            <input type="number" id="bulk-rent-${f.floor}" value="6000" placeholder="Rent" class="w-14 bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] text-center font-bold focus:outline-none text-slate-700">
            <button type="button" onclick="applyFloorBulkDefaults(${f.floor})" class="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-[10px] transition-colors font-bold tracking-wider">
              Apply
            </button>
          </div>
        </div>
        
        <div id="rooms-grid-${f.floor}" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
          <!-- Room Rows will be generated here -->
        </div>
      </div>
    </div>`;
  }).join('');
  
  // Now render rooms for each floor
  floors.forEach(f => {
    renderFloorRooms(f.floor, f.rooms || 0, f.roomDetails);
  });
  
  updateTotalRoomsPreview();
}

function handleFloorRoomsChange(input, floorNum) {
  const count = parseInt(input.value) || 0;
  const container = document.getElementById(`rooms-list-container-${floorNum}`);
  
  if (count > 0) {
    if (container) container.classList.remove('hidden');
  } else {
    if (container) container.classList.add('hidden');
  }
  
  // We collect currently inputted details so we don't wipe them when changing counts!
  const currentDetails = [];
  const rows = document.querySelectorAll(`#rooms-grid-${floorNum} [data-room-row]`);
  rows.forEach(row => {
    const num = row.dataset.roomRow;
    const typeSelect = row.querySelector('[data-field="type"]');
    const rentInput = row.querySelector('[data-field="rent"]');
    if (typeSelect && rentInput) {
      currentDetails.push({
        num,
        type: typeSelect.value,
        rent: parseInt(rentInput.value) || 0
      });
    }
  });

  renderFloorRooms(floorNum, count, currentDetails);
  updateTotalRoomsPreview();
}
window.handleFloorRoomsChange = handleFloorRoomsChange;

function renderFloorRooms(floorNum, count, existingRooms = []) {
  const container = document.getElementById(`rooms-list-container-${floorNum}`);
  const grid = document.getElementById(`rooms-grid-${floorNum}`);
  if (!container || !grid) return;
  
  if (count <= 0) {
    container.classList.add('hidden');
    grid.innerHTML = '';
    return;
  }
  
  let html = '';
  for (let i = 1; i <= count; i++) {
    let roomNum = '';
    if (floorNum === 0) {
      roomNum = `G${String(i).padStart(2, '0')}`;
    } else {
      roomNum = `${floorNum}${String(i).padStart(2, '0')}`;
    }
    
    // Check if we have existing details for this room number
    const existing = existingRooms.find(r => r.num === roomNum || r.roomNumber === roomNum || r.room_number === roomNum);
    const selectedType = existing ? (existing.type || existing.roomType || existing.room_type || 'Double sharing') : 'Double sharing';
    const rentValue = existing ? (existing.rent || existing.monthlyRent || existing.monthly_rent || 6000) : 6000;
    
    html += `
      <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-green-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200" data-room-row="${roomNum}">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <span class="text-xs font-black text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500/80"></span>
            Room ${roomNum}
          </span>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sharing Type</label>
            <select class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-green-500 focus:outline-none transition-all cursor-pointer" 
              data-room-num="${roomNum}" data-floor="${floorNum}" data-field="type">
              <option value="Single sharing" ${selectedType === 'Single sharing' ? 'selected' : ''}>Single sharing</option>
              <option value="Double sharing" ${selectedType === 'Double sharing' ? 'selected' : ''}>Double sharing</option>
              <option value="Triple sharing" ${selectedType === 'Triple sharing' ? 'selected' : ''}>Triple sharing</option>
              <option value="Four sharing" ${selectedType === 'Four sharing' ? 'selected' : ''}>Four sharing</option>
            </select>
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monthly Rent</label>
            <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-green-500 transition-all">
              <span class="text-xs text-slate-400 font-extrabold">₹</span>
              <input type="number" value="${rentValue}" placeholder="Rent" 
                class="w-full bg-transparent border-0 p-0 text-xs text-slate-800 font-black focus:outline-none focus:ring-0" 
                data-room-num="${roomNum}" data-floor="${floorNum}" data-field="rent">
            </div>
          </div>
        </div>
      </div>`;
  }
  
  grid.innerHTML = html;
}

function applyFloorBulkDefaults(floorNum) {
  const type = document.getElementById(`bulk-type-${floorNum}`).value;
  const rent = document.getElementById(`bulk-rent-${floorNum}`).value;
  
  const typeSelects = document.querySelectorAll(`#rooms-grid-${floorNum} select[data-field="type"]`);
  const rentInputs = document.querySelectorAll(`#rooms-grid-${floorNum} input[data-field="rent"]`);
  
  typeSelects.forEach(select => { select.value = type; });
  rentInputs.forEach(input => { input.value = rent; });
  
  window.UI.toast(`Applied ${type} and ₹${rent} to all rooms on this floor!`, 'success');
}
window.applyFloorBulkDefaults = applyFloorBulkDefaults;


function updateTotalRoomsPreview() {
  const inputs = document.querySelectorAll('#floor-inputs-container input[data-floor]:not([data-field])');
  const total = [...inputs].reduce((s, inp) => s + (parseInt(inp.value) || 0), 0);
  const el = document.getElementById('wiz-total-rooms-preview');
  if (el) el.textContent = total;
}
window.updateTotalRoomsPreview = updateTotalRoomsPreview;

function collectBuildingStructure() {
  const inputs = document.querySelectorAll('#floor-inputs-container input[data-floor]:not([data-field])');
  const floors = [...inputs].map(inp => ({
    floor: parseInt(inp.dataset.floor),
    label: inp.dataset.floor === '0' ? 'Ground Floor' : `Floor ${inp.dataset.floor}`,
    rooms: parseInt(inp.value) || 0
  }));
  const totalRooms = floors.reduce((s, f) => s + f.rooms, 0);
  return { floors, totalRooms };
}

function collectRoomsFromInputs() {
  const rooms = [];
  const rows = document.querySelectorAll('#floor-inputs-container [data-room-row]');
  rows.forEach(row => {
    const num = row.dataset.roomRow;
    const typeSelect = row.querySelector('[data-field="type"]');
    const rentInput = row.querySelector('[data-field="rent"]');
    
    if (typeSelect && rentInput) {
      const floorNum = parseInt(typeSelect.dataset.floor);
      const type = typeSelect.value;
      let capacity = 2;
      if (type === 'Single sharing') capacity = 1;
      else if (type === 'Double sharing') capacity = 2;
      else if (type === 'Triple sharing') capacity = 3;
      else if (type === 'Four sharing') capacity = 4;
      
      rooms.push({
        num,
        type,
        floor: floorNum,
        capacity,
        rent: parseInt(rentInput.value) || 0
      });
    }
  });
  return rooms;
}
window.collectRoomsFromInputs = collectRoomsFromInputs;

// ─── AMENITIES ────────────────────────────────────────────────────────────────
function toggleAmenity(el, name) {
  el.classList.toggle('selected');
}
window.toggleAmenity = toggleAmenity;

function selectType(el, type) {
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('wiz-type').value = type;
}
window.selectType = selectType;

function collectAmenities() {
  return [...document.querySelectorAll('.amenity-chip.selected')]
    .map(c => c.textContent.trim().replace(/^[^\w]+/, '').trim());
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────
function buildReviewSummary() {
  const bs = collectBuildingStructure();
  const amenities = collectAmenities();
  const container = document.getElementById('review-summary');
  container.innerHTML = `
    <div class="space-y-3 text-xs">
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Property Name</span>
        <span class="font-extrabold text-slate-900">${document.getElementById('wiz-name').value || '—'}</span>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Type</span>
        <span class="font-extrabold text-slate-900">${document.getElementById('wiz-type').value || '—'}</span>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Code</span>
        <span class="font-extrabold text-slate-900 font-mono">${document.getElementById('wiz-code').value || '—'}</span>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Address</span>
        <span class="font-extrabold text-slate-900 text-right ml-4">${document.getElementById('wiz-address').value || '—'}, ${document.getElementById('wiz-city').value || '—'}</span>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Building</span>
        <span class="font-extrabold text-slate-900">${bs.floors.length} Floors, ${bs.totalRooms} Rooms</span>
      </div>
      <div class="border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500 block mb-1.5">Floor Breakdown</span>
        <div class="space-y-1">
          ${bs.floors.map(f => `
            <div class="flex justify-between">
              <span class="text-slate-600">${f.label}</span>
              <span class="font-bold text-slate-800">${f.rooms} rooms</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Amenities</span>
        <span class="font-extrabold text-slate-900 text-right ml-4">${amenities.length > 0 ? amenities.join(', ') : 'None'}</span>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2">
        <span class="font-bold text-slate-500">Phone</span>
        <span class="font-extrabold text-slate-900">${document.getElementById('wiz-phone').value || '—'}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold text-slate-500">Email</span>
        <span class="font-extrabold text-slate-900">${document.getElementById('wiz-email').value || '—'}</span>
      </div>
    </div>`;
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
async function submitPropertyWizard() {
  const nextBtn = document.getElementById('wizard-next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Saving...';

  const bs = collectBuildingStructure();
  const amenities = collectAmenities();

  const roomsList = collectRoomsFromInputs();

  const payload = {
    name: document.getElementById('wiz-name').value.trim(),
    propertyCode: document.getElementById('wiz-code').value.trim(),
    propertyType: document.getElementById('wiz-type').value,
    description: document.getElementById('wiz-description').value.trim(),
    address: document.getElementById('wiz-address').value.trim(),
    city: document.getElementById('wiz-city').value.trim(),
    state: document.getElementById('wiz-state').value.trim(),
    pincode: document.getElementById('wiz-pincode').value.trim(),
    googleMapsLink: document.getElementById('wiz-maps').value.trim() || null,
    nearbyLandmarks: document.getElementById('wiz-landmarks').value.trim() || null,
    phone: document.getElementById('wiz-phone').value.trim(),
    email: document.getElementById('wiz-email').value.trim(),
    openingDate: document.getElementById('wiz-opening').value || null,
    image: document.getElementById('wiz-image').value.trim() || null,
    galleryImages: document.getElementById('wiz-gallery').value.trim() || null,
    amenities,
    buildingStructure: bs,
    totalRooms: bs.totalRooms,
    rooms: roomsList
  };

  try {
    if (wizardMode === 'edit') {
      await window.apiRequest(`/properties/${editingPropertyId}`, { method: 'PUT', body: JSON.stringify(payload) });
      window.UI.toast('Property updated successfully!', 'success');
    } else {
      await window.apiRequest('/properties', { method: 'POST', body: JSON.stringify(payload) });
      window.UI.toast('Property created successfully!', 'success');
    }
    closePropertyModal();
    loadProperties();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to save property', 'error');
  } finally {
    nextBtn.disabled = false;
    updateWizardUI();
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteProperty(id, name) {
  if (!confirm(`Delete "${name}"? All rooms and tenant references will be removed.`)) return;
  try {
    await window.apiRequest(`/properties/${id}`, { method: 'DELETE' });
    window.UI.toast('Property deleted', 'success');
    loadProperties();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to delete', 'error');
  }
}
window.deleteProperty = deleteProperty;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProperties();
  setupDragDropZones();
  if (window.lucide) window.lucide.createIcons();
});

// ─── LEAFLET MAPS & GEOLOCATION SUGGESTIONS ──────────────────────────────────
let map = null;
let marker = null;
let searchTimeout = null;

function debounceAddressSearch(val) {
  clearTimeout(searchTimeout);
  if (!val || val.trim().length < 3) {
    const sug = document.getElementById('address-suggestions');
    if (sug) sug.classList.add('hidden');
    return;
  }
  searchTimeout = setTimeout(() => searchAddress(val), 400);
}
window.debounceAddressSearch = debounceAddressSearch;

async function searchAddress(query) {
  const sug = document.getElementById('address-suggestions');
  if (!sug) return;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
    const data = await res.json();
    if (!data || data.length === 0) {
      sug.classList.add('hidden');
      return;
    }
    sug.innerHTML = data.map(item => {
      const display = item.display_name;
      const escapedItem = JSON.stringify(item).replace(/"/g, '&quot;');
      return `
        <div onclick="selectSuggestedAddress(${escapedItem})" class="px-4 py-2.5 text-xs text-slate-700 hover:bg-green-50 hover:text-green-650 cursor-pointer font-semibold transition-all">
          ${display}
        </div>
      `;
    }).join('');
    sug.classList.remove('hidden');
  } catch (err) {
    console.error('Search address error:', err);
  }
}
window.searchAddress = searchAddress;

function selectSuggestedAddress(item) {
  document.getElementById('wiz-address').value = item.display_name;
  document.getElementById('address-suggestions').classList.add('hidden');

  const addr = item.address || {};
  const city = addr.city || addr.town || addr.village || addr.suburb || '';
  const state = addr.state || '';
  const pincode = addr.postcode || '';

  if (city) document.getElementById('wiz-city').value = city;
  if (state) document.getElementById('wiz-state').value = state;
  if (pincode) document.getElementById('wiz-pincode').value = pincode;

  const mapLink = `https://www.google.com/maps?q=${item.lat},${item.lon}`;
  document.getElementById('wiz-maps').value = mapLink;

  showMapAt(item.lat, item.lon);
}
window.selectSuggestedAddress = selectSuggestedAddress;

function showMapAt(lat, lon) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;
  mapContainer.classList.remove('hidden');

  const coords = [parseFloat(lat), parseFloat(lon)];

  if (typeof L === 'undefined') {
    console.error('Leaflet is not loaded.');
    return;
  }

  if (!map) {
    map = L.map('map').setView(coords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    marker = L.marker(coords).addTo(map);
  } else {
    map.setView(coords, 15);
    marker.setLatLng(coords);
  }
  
  setTimeout(() => {
    map.invalidateSize();
  }, 150);
}
window.showMapAt = showMapAt;

function tryParseCoordsFromLink(link) {
  if (!link) return null;
  let match = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];
  match = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];
  return null;
}
window.tryParseCoordsFromLink = tryParseCoordsFromLink;

async function geocodeAndShowMap(address) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      showMapAt(data[0].lat, data[0].lon);
    }
  } catch (e) {
    console.error("Geocoding failed for address:", e);
  }
}
window.geocodeAndShowMap = geocodeAndShowMap;

// ─── IMAGE FILE UPLOADING ─────────────────────────────────────────────────────
async function handleWizardImageUpload(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const dropzone = document.getElementById('cover-dropzone');
  const uploadText = document.getElementById('cover-upload-text');
  let originalHtml = '';
  if (uploadText) {
    originalHtml = uploadText.innerHTML;
    uploadText.innerHTML = '<p class="text-xs font-bold text-green-600 animate-pulse">Uploading cover image...</p>';
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await window.apiRequest('/upload', {
      method: 'POST',
      body: formData
    });
    if (res && res.url) {
      document.getElementById('wiz-image').value = res.url;
      // Show preview
      const preview = document.getElementById('cover-image-preview');
      const overlay = document.getElementById('cover-image-overlay');
      if (preview && overlay) {
        preview.src = res.url;
        preview.classList.remove('hidden');
        overlay.classList.remove('hidden');
      }
      window.UI.toast('Image uploaded successfully to ImageKit!', 'success');
    }
  } catch (err) {
    window.UI.toast('Upload failed: ' + err.message, 'error');
    if (uploadText) uploadText.innerHTML = originalHtml;
  } finally {
    if (uploadText && !document.getElementById('wiz-image').value) {
      uploadText.innerHTML = originalHtml;
    }
  }
}
window.handleWizardImageUpload = handleWizardImageUpload;

// ─── GEOLOCATION LIVE LOOKUP & REVERSE-GEOCODING ────────────────────────────
function getCurrentLiveLocation() {
  if (!navigator.geolocation) {
    window.UI?.toast('Geolocation is not supported by your browser', 'error');
    return;
  }
  
  window.UI?.toast('Fetching your live coordinates...', 'info');

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const item = await res.json();
      if (item && item.display_name) {
        selectSuggestedAddress(item);
        window.UI?.toast('Location fetched and details auto-filled!', 'success');
      } else {
        window.UI?.toast('Failed to get address description for coordinates', 'warning');
        showMapAt(lat, lon);
      }
    } catch (err) {
      console.error(err);
      window.UI?.toast('Error reverse geocoding location', 'error');
      showMapAt(lat, lon);
    }
  }, (error) => {
    console.error(error);
    window.UI?.toast('Failed to access location: ' + error.message, 'error');
  });
}
window.getCurrentLiveLocation = getCurrentLiveLocation;

// ─── MULTIPLE GALLERY IMAGES UPLOAD ──────────────────────────────────────────
async function handleWizardGalleryUpload(input) {
  if (!input.files || input.files.length === 0) return;
  const files = Array.from(input.files);
  const dropzone = document.getElementById('gallery-dropzone');
  
  // Set upload loading state
  const dropzoneContent = dropzone.innerHTML;
  dropzone.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-2">
      <div class="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
      <p class="text-xs font-bold text-green-650 animate-pulse">Uploading ${files.length} photo(s)...</p>
    </div>
  `;

  try {
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await window.apiRequest('/upload', {
        method: 'POST',
        body: formData
      });
      if (res && res.url) {
        urls.push(res.url);
      }
    }
    
    if (urls.length > 0) {
      const inputEl = document.getElementById('wiz-gallery');
      const currentVal = inputEl.value.trim();
      const combined = currentVal ? (currentVal + ', ' + urls.join(', ')) : urls.join(', ');
      inputEl.value = combined;
      updateGalleryPreviews();
      window.UI.toast(`Successfully uploaded ${urls.length} gallery image(s) to ImageKit!`, 'success');
    }
  } catch (err) {
    window.UI.toast('Upload failed: ' + err.message, 'error');
  } finally {
    dropzone.innerHTML = dropzoneContent;
    input.value = '';
  }
}
window.handleWizardGalleryUpload = handleWizardGalleryUpload;

function setupDragDropZones() {
  const coverZone = document.getElementById('cover-dropzone');
  const coverFile = document.getElementById('wiz-image-file');
  
  if (coverZone && coverFile) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      coverZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      coverZone.addEventListener(eventName, () => {
        coverZone.classList.remove('border-slate-200');
        coverZone.classList.add('border-green-500', 'bg-green-50/10');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      coverZone.addEventListener(eventName, () => {
        coverZone.classList.remove('border-green-500', 'bg-green-50/10');
        coverZone.classList.add('border-slate-200');
      }, false);
    });

    coverZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        coverFile.files = files;
        handleWizardImageUpload(coverFile);
      }
    }, false);
  }

  const galleryZone = document.getElementById('gallery-dropzone');
  const galleryFile = document.getElementById('wiz-gallery-file');
  
  if (galleryZone && galleryFile) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      galleryZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      galleryZone.addEventListener(eventName, () => {
        galleryZone.classList.remove('border-slate-200');
        galleryZone.classList.add('border-green-500', 'bg-green-50/10');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      galleryZone.addEventListener(eventName, () => {
        galleryZone.classList.remove('border-green-500', 'bg-green-50/10');
        galleryZone.classList.add('border-slate-200');
      }, false);
    });

    galleryZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        galleryFile.files = files;
        handleWizardGalleryUpload(galleryFile);
      }
    }, false);
  }
}
window.setupDragDropZones = setupDragDropZones;

function updateGalleryPreviews() {
  const container = document.getElementById('wiz-gallery-previews');
  if (!container) return;
  const val = document.getElementById('wiz-gallery').value.trim();
  if (!val) {
    container.innerHTML = '';
    return;
  }
  const urls = val.split(',').map(u => u.trim()).filter(Boolean);
  container.innerHTML = urls.map((url, idx) => `
    <div class="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm group">
      <img src="${url}" alt="Preview" class="w-full h-full object-cover">
      <button type="button" onclick="removeGalleryImage(${idx})" class="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center font-bold text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  `).join('');
}
window.updateGalleryPreviews = updateGalleryPreviews;

function removeGalleryImage(idx) {
  const inputEl = document.getElementById('wiz-gallery');
  const urls = inputEl.value.split(',').map(u => u.trim()).filter(Boolean);
  urls.splice(idx, 1);
  inputEl.value = urls.join(', ');
  updateGalleryPreviews();
}
window.removeGalleryImage = removeGalleryImage;
