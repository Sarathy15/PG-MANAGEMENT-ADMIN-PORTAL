// Property Detail Page Controller
let currentPropertyId = null;
let currentPropertyData = null;

function getPropertyIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadPropertyDetail(id) {
  currentPropertyId = id;

  try {
    const res = await window.apiRequest(`/properties/${id}/detail`);
    const { property, roomSummary, stats, activeTenants, recentlyJoined, revenue } = res.data || res || {};

    currentPropertyData = property;

    // ── Hero Banner & Slider ──────────────────────────────────
    populateBannerSlider(property.image, property.galleryImages || property.gallery_images);
    
    const nameEl = document.getElementById('detail-name');
    if (nameEl) nameEl.textContent = property.propertyName || property.name || 'Unnamed Property';
    
    const typeBadge = document.getElementById('detail-type-badge');
    if (typeBadge) typeBadge.textContent = property.propertyType || 'Boys PG';
    
    const codeBadge = document.getElementById('detail-code-badge');
    if (codeBadge) codeBadge.textContent = property.propertyCode || '';
    
    const statusBadge = document.getElementById('detail-status-badge');
    if (statusBadge) statusBadge.textContent = (property.status || 'active').toUpperCase();

    const locHeader = document.getElementById('detail-location-header') || document.getElementById('detail-address');
    if (locHeader) {
      const span = locHeader.querySelector('span');
      if (span) span.textContent = property.address || '—';
    }

    document.title = `${property.propertyName || property.name || 'Details'} — Pleasant Homes`;

    // ── Quick Stats Metrics ───────────────────────────────────
    const tenantsEl = document.getElementById('metric-tenants') || document.getElementById('stat-tenants');
    if (tenantsEl) tenantsEl.textContent = activeTenants;

    const roomsEl = document.getElementById('metric-rooms') || document.getElementById('stat-rooms');
    if (roomsEl) roomsEl.textContent = `${stats.occupiedRooms} / ${stats.totalRooms}`;

    const roomsSub = document.getElementById('stat-rooms-sub');
    if (roomsSub) roomsSub.textContent = `${stats.occupiedRooms} occupied`;

    const occRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;
    const occEl = document.getElementById('metric-occupancy') || document.getElementById('stat-occupancy');
    if (occEl) occEl.textContent = `${occRate}%`;

    const bedsSub = document.getElementById('stat-beds-sub');
    if (bedsSub) bedsSub.textContent = `${stats.occupiedBeds} / ${stats.totalBeds} beds filled`;

    const revEl = document.getElementById('metric-revenue') || document.getElementById('stat-revenue');
    if (revEl) revEl.textContent = `₹${(revenue.monthlyRevenue || 0).toLocaleString('en-IN')}`;

    const pendingSub = document.getElementById('stat-pending-sub');
    if (pendingSub) pendingSub.textContent = `₹${(revenue.pending || 0).toLocaleString('en-IN')} pending`;

    // ── Property Info Attributes ─────────────────────────────
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    
    setVal('meta-code', property.propertyCode || '—');
    setVal('info-code', property.propertyCode || '—');
    
    setVal('meta-type', property.propertyType || '—');
    setVal('info-type', property.propertyType || '—');
    
    setVal('meta-floors', buildingLabel(roomSummary));
    setVal('info-floors', buildingLabel(roomSummary));
    
    setVal('meta-pincode', property.pincode || '—');
    setVal('info-pincode', property.pincode || '—');
    
    setVal('meta-opening', formatDate(property.openingDate) || '—');
    setVal('info-opening', formatDate(property.openingDate) || '—');
    
    setVal('meta-created', formatDate(property.createdAt) || '—');
    setVal('info-created', formatDate(property.createdAt) || '—');
    
    setVal('meta-phone', property.phone || '—');
    setVal('info-phone', property.phone || '—');
    
    setVal('detail-description', property.description || 'No description provided.');
    setVal('info-description', property.description || 'No description provided.');
    
    setVal('meta-landmarks', property.nearbyLandmarks || '—');
    setVal('info-landmarks', property.nearbyLandmarks || '—');

    if (property.googleMapsLink) {
      const container = document.getElementById('maps-link-container') || document.getElementById('info-maps-link')?.parentElement;
      if (container) container.style.display = '';
      const btn = document.getElementById('meta-maps-btn') || document.getElementById('info-maps-link');
      if (btn) btn.href = property.googleMapsLink;
    }

    // ── Floor Summary List ─────────────────────────────────────
    const floorContainer = document.getElementById('floor-list-container') || document.getElementById('floor-summary-container');
    if (floorContainer) {
      if (roomSummary.length === 0) {
        floorContainer.innerHTML = `<p class="text-xs text-slate-400 font-bold italic">No rooms registered yet. <a href="/room-management.html" class="text-green-650 underline">Add rooms</a></p>`;
      } else {
        floorContainer.innerHTML = roomSummary.map(f => `
          <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-green-200 hover:bg-green-50/20 cursor-pointer transition-all"
               onclick="openFloorRooms(${f.floor})">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-green-50 border border-green-100 text-green-600 text-[10px] font-extrabold flex items-center justify-center">${f.floor === 0 ? 'G' : f.floor}</span>
              <span class="text-sm font-bold text-slate-800">${f.label}</span>
            </div>
            <div class="flex items-center gap-4 text-xs font-bold">
              <span class="text-slate-400">${f.rooms} Rooms</span>
              <span class="text-emerald-600">${f.availableRooms} Free</span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
            </div>
          </div>
        `).join('');
      }
    }

    setVal('room-total', stats.totalRooms);
    setVal('room-occupied', stats.occupiedRooms);
    setVal('room-available', stats.availableRooms);
    setVal('bed-total', stats.totalBeds);
    setVal('bed-occupied', stats.occupiedBeds);
    setVal('bed-vacant', stats.vacantBeds);

    // ── Financial Overview ────────────────────────────────────
    setVal('fin-collected', `₹${(revenue.collected || 0).toLocaleString('en-IN')}`);
    setVal('rev-collected', `₹${(revenue.collected || 0).toLocaleString('en-IN')}`);
    
    setVal('fin-pending', `₹${(revenue.pending || 0).toLocaleString('en-IN')}`);
    setVal('rev-pending', `₹${(revenue.pending || 0).toLocaleString('en-IN')}`);
    
    setVal('fin-target', `₹${(revenue.monthlyRevenue || 0).toLocaleString('en-IN')}`);
    setVal('rev-monthly', `₹${(revenue.monthlyRevenue || 0).toLocaleString('en-IN')}`);
    
    setVal('fin-deposits', `₹${(revenue.securityDeposits || 0).toLocaleString('en-IN')}`);
    setVal('rev-deposits', `₹${(revenue.securityDeposits || 0).toLocaleString('en-IN')}`);

    // ── Tenants List ──────────────────────────────────────────
    const tenantCountBadge = document.getElementById('tenants-count-badge');
    if (tenantCountBadge) tenantCountBadge.textContent = activeTenants;

    const tenantContainer = document.getElementById('recent-tenants-container') || document.getElementById('recently-joined-container');
    if (tenantContainer) {
      if (recentlyJoined.length === 0) {
        tenantContainer.innerHTML = `<p class="text-xs text-slate-400 font-bold italic text-center py-2">No active tenants yet.</p>`;
      } else {
        tenantContainer.innerHTML = recentlyJoined.map(t => `
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-full bg-green-100 text-green-650 text-xs font-extrabold flex items-center justify-center shrink-0">
              ${(t.name || 'T').charAt(0).toUpperCase()}
            </span>
            <div>
              <p class="text-xs font-bold text-slate-800">${t.name}</p>
              <p class="text-[10px] text-slate-400 font-medium">Joined: ${formatDate(t.checkInDate)}</p>
            </div>
          </div>
        `).join('');
      }
    }

    // ── Amenities checklist ───────────────────────────────────
    const amenitiesArr = Array.isArray(property.amenities)
      ? property.amenities
      : (property.amenities ? String(property.amenities).split(',').map(a => a.trim()) : []);

    const amenityIconMap = {
      'WiFi': '📶', 'AC': '❄️', 'Laundry': '🧺', 'Parking': '🚗',
      'Food': '🍱', 'CCTV': '📹', 'Lift': '🛗', 'Power Backup': '🔋',
      'Housekeeping': '🧹', 'Gym': '🏋️', 'Study Area': '📚'
    };

    const amenitiesContainer = document.getElementById('detail-amenities-list') || document.getElementById('amenities-chips');
    if (amenitiesContainer) {
      if (amenitiesArr.length > 0) {
        amenitiesContainer.innerHTML = amenitiesArr.map(a => {
          const icon = amenityIconMap[a.trim()] || '✅';
          return `<span class="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">${icon} ${a.trim()}</span>`;
        }).join('');
      } else {
        amenitiesContainer.innerHTML = `<span class="text-slate-400 italic">No amenities specified</span>`;
      }
    }

    // ── Contact Info ──────────────────────────────────────────
    setVal('contact-phone', property.phone || '—');
    setVal('contact-email', property.email || '—');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Failed to load property detail:', err);
    window.UI.toast('Failed to load property details', 'error');
  }
}

function buildingLabel(roomSummary) {
  if (!roomSummary || roomSummary.length === 0) return '—';
  const maxFloor = Math.max(...roomSummary.map(f => f.floor));
  return maxFloor === 0 ? 'Ground Floor Only' : `G+${maxFloor} Floors`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function openFloorRooms(floor) {
  if (!currentPropertyId) return;
  window.location.href = `/room-management.html?propertyId=${currentPropertyId}&floor=${floor}`;
}
window.openFloorRooms = openFloorRooms;

function triggerEditProperty() {
  const user = window.Auth.getCurrentUser();
  if (user && user.role === 'staff') {
    window.UI.toast('Only admin can edit property', 'error');
    return;
  }
  if (!currentPropertyId) return;
  window.location.href = `/properties.html?edit=${currentPropertyId}`;
}
window.triggerEditProperty = triggerEditProperty;

async function triggerDeleteProperty() {
  const user = window.Auth.getCurrentUser();
  if (user && user.role === 'staff') {
    window.UI.toast('Only admin can edit property', 'error');
    return;
  }
  if (!currentPropertyId) return;
  if (!confirm('Are you absolutely sure you want to delete this property? This will also remove all associated rooms and tenant references.')) return;
  try {
    await window.apiRequest(`/properties/${currentPropertyId}`, { method: 'DELETE' });
    window.UI.toast('Property deleted successfully', 'success');
    setTimeout(() => { window.location.href = '/properties.html'; }, 800);
  } catch (err) {
    window.UI.toast(err.message || 'Failed to delete property', 'error');
  }
}
window.triggerDeleteProperty = triggerDeleteProperty;

// ─── SLIDING BANNER CAROUSEL ──────────────────────────────────────────────
let currentSlide = 0;
let totalSlides = 0;

function populateBannerSlider(mainImg, galleryStr) {
  const wrapper = document.getElementById('banner-slider-wrapper');
  const dotsContainer = document.getElementById('banner-dots');
  if (!wrapper) return;
  
  const defaultImg = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80";
  const images = [mainImg || defaultImg];
  
  if (galleryStr) {
    const gallery = typeof galleryStr === 'string' 
      ? galleryStr.split(',') 
      : (Array.isArray(galleryStr) ? galleryStr : []);
    gallery.forEach(img => {
      const cleanImg = img.trim();
      if (cleanImg && !images.includes(cleanImg)) {
        images.push(cleanImg);
      }
    });
  }
  
  totalSlides = images.length;
  currentSlide = 0;
  
  // Render images
  wrapper.innerHTML = images.map(img => `
    <img src="${img}" alt="Property Image" class="w-full h-full object-cover shrink-0 select-none">
  `).join('');
  wrapper.style.width = `${totalSlides * 100}%`;
  
  const imgEls = wrapper.querySelectorAll('img');
  imgEls.forEach(el => {
    el.style.width = `${100 / totalSlides}%`;
  });
  
  // Render dots
  if (dotsContainer) {
    if (totalSlides <= 1) {
      dotsContainer.innerHTML = '';
    } else {
      dotsContainer.innerHTML = images.map((_, idx) => `
        <span onclick="goToBannerSlide(${idx})" class="banner-dot w-2 h-2 rounded-full cursor-pointer transition-all ${idx === 0 ? 'bg-white w-4' : 'bg-white/40'}"></span>
      `).join('');
    }
  }
  
  // Hide arrows if only 1 slide
  const prevBtn = document.getElementById('banner-prev-btn');
  const nextBtn = document.getElementById('banner-next-btn');
  if (prevBtn && nextBtn) {
    if (totalSlides <= 1) {
      prevBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
      nextBtn.classList.remove('hidden');
    }
  }
  
  updateSlidePosition();
}
window.populateBannerSlider = populateBannerSlider;

function updateSlidePosition() {
  const wrapper = document.getElementById('banner-slider-wrapper');
  if (!wrapper) return;
  const translatePercent = -(currentSlide * (100 / totalSlides));
  wrapper.style.transform = `translateX(${translatePercent}%)`;
  
  // Update dots
  const dots = document.querySelectorAll('.banner-dot');
  dots.forEach((dot, idx) => {
    if (idx === currentSlide) {
      dot.className = "banner-dot w-4 h-2 rounded-full cursor-pointer transition-all bg-white";
    } else {
      dot.className = "banner-dot w-2 h-2 rounded-full cursor-pointer transition-all bg-white/40";
    }
  });
}

function nextBannerSlide() {
  if (totalSlides <= 1) return;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlidePosition();
}
window.nextBannerSlide = nextBannerSlide;

function prevBannerSlide() {
  if (totalSlides <= 1) return;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateSlidePosition();
}
window.prevBannerSlide = prevBannerSlide;

function goToBannerSlide(idx) {
  currentSlide = idx;
  updateSlidePosition();
}
window.goToBannerSlide = goToBannerSlide;

// ─── INITIALIZATION ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const id = getPropertyIdFromUrl();
  if (!id) {
    try {
      const props = await window.apiRequest('/properties');
      if (props.length === 1) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', props[0].id);
        window.history.replaceState({}, '', url.toString());
        loadPropertyDetail(props[0].id);
      } else if (props.length === 0) {
        document.getElementById('property-detail-main').innerHTML = `
          <div class="flex flex-col items-center justify-center py-32 text-center">
            <div class="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
              <i data-lucide="building" class="w-7 h-7"></i>
            </div>
            <h3 class="text-lg font-extrabold text-slate-800">No Properties Yet</h3>
            <p class="text-sm text-slate-400 mt-2">Start by registering your first property.</p>
            <a href="/properties.html" class="mt-6 bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-indigo-100">Go to Properties</a>
          </div>`;
        if (window.lucide) window.lucide.createIcons();
      } else {
        window.location.href = '/properties.html';
      }
    } catch (err) {
      window.location.href = '/properties.html';
    }
    return;
  }

  loadPropertyDetail(id);
});
