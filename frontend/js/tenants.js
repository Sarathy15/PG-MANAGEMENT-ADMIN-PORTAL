// Tenants directory controller
let allTenants = [];
let allRooms = [];
let activeStatusFilter = 'all';
let currentStep = 1;
let lastCreatedTenant = null;

// Date formatting helper
function formatDate(dStr) {
  if (!dStr) return '—';
  const date = new Date(dStr);
  if (isNaN(date.getTime())) return dStr;
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Stay duration calculator helper
function getStayDuration(inStr, outStr) {
  if (!inStr) return '—';
  const dateIn = new Date(inStr);
  const dateOut = outStr ? new Date(outStr) : new Date();
  if (isNaN(dateIn.getTime()) || isNaN(dateOut.getTime())) return '—';
  const diff = Math.max(0, Math.floor((dateOut - dateIn) / (1000 * 60 * 60 * 24)));
  return `${diff} Day${diff === 1 ? '' : 's'}`;
}

// Initials Avatar Color Helper
function getAvatarColorClass(name) {
  if (!name) return 'bg-green-50 border-green-100 text-green-600';
  const char = name.trim().charAt(0).toUpperCase();

  if (['A', 'E', 'I', 'O', 'U'].includes(char)) {
    return 'bg-purple-50 border-purple-100 text-purple-600';
  } else if (['B', 'F', 'J', 'N', 'R'].includes(char)) {
    return 'bg-emerald-50 border-emerald-100 text-emerald-600';
  } else if (['C', 'G', 'K', 'O', 'S'].includes(char)) {
    return 'bg-amber-50 border-amber-100 text-amber-600';
  } else if (['D', 'H', 'L', 'P', 'T'].includes(char)) {
    return 'bg-blue-50 border-blue-100 text-blue-600';
  } else {
    return 'bg-rose-50 border-rose-100 text-rose-600';
  }
}

async function loadTenants() {
  const tbody = document.getElementById('tenants-table-body');
  if (!tbody) return;

  const activePropId = window.AppState.getActivePropertyId();
  const searchTxt = document.getElementById('search-tenant').value.toLowerCase().trim();
  const dateFilter = document.getElementById('filter-tenant-date') ? document.getElementById('filter-tenant-date').value : '';
  const sortOption = document.getElementById('filter-tenant-sort') ? document.getElementById('filter-tenant-sort').value : 'newest';

  // Show/hide clear button for date picker
  const clearBtn = document.getElementById('clear-date-btn');
  if (clearBtn) {
    if (dateFilter) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  try {
    allTenants = await window.apiRequest('/tenants');

    // Filter by selected property
    let filtered = allTenants;
    if (activePropId !== 'all') {
      filtered = filtered.filter(t => t.propertyId === activePropId);
    }

    // Compute stats metrics dynamically
    const totalCount = filtered.length;
    const activeCount = filtered.filter(t => t.status === 'Active').length;
    const checkoutCount = filtered.filter(t => t.status === 'Checked Out').length;
    const missingKycCount = filtered.filter(t => !t.idProofNumber || t.idProofNumber.trim() === '').length;

    // Render Stats Metrics in UI
    if (document.getElementById('stats-total')) document.getElementById('stats-total').textContent = totalCount;
    if (document.getElementById('stats-active')) document.getElementById('stats-active').textContent = activeCount;
    if (document.getElementById('stats-checkout')) document.getElementById('stats-checkout').textContent = checkoutCount;
    if (document.getElementById('stats-missing-kyc')) document.getElementById('stats-missing-kyc').textContent = missingKycCount;

    if (document.getElementById('header-active-count')) document.getElementById('header-active-count').textContent = activeCount;
    if (document.getElementById('header-checkout-count')) document.getElementById('header-checkout-count').textContent = checkoutCount;

    // Filter by status tab
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === activeStatusFilter);
    }

    // Filter by selected date
    if (dateFilter) {
      filtered = filtered.filter(t => {
        if (activeStatusFilter === 'Active') {
          return t.checkInDate === dateFilter;
        } else if (activeStatusFilter === 'Checked Out') {
          return t.checkOutDate === dateFilter;
        } else {
          return t.checkInDate === dateFilter || t.checkOutDate === dateFilter;
        }
      });
    }

    // Filter by search query
    if (searchTxt) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTxt) ||
        t.email.toLowerCase().includes(searchTxt) ||
        t.phone.includes(searchTxt) ||
        t.roomNumber.toLowerCase().includes(searchTxt) ||
        t.idProofNumber.toLowerCase().includes(searchTxt)
      );
    }

    // Sort tenants
    if (sortOption === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sortOption === 'oldest') {
      filtered.sort((a, b) => a.id - b.id);
    } else if (sortOption === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'room_asc') {
      filtered.sort((a, b) => {
        const numA = parseInt(a.roomNumber) || 999;
        const numB = parseInt(b.roomNumber) || 999;
        return numA - numB;
      });
    }

    const countTxt = document.getElementById('tenants-count-txt');
    if (countTxt) {
      countTxt.textContent = `${filtered.length} occupant${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center py-6">
              <i data-lucide="users" class="w-12 h-12 text-slate-300 mb-3 animate-pulse"></i>
              <span class="font-extrabold text-sm text-slate-800">No matching occupants</span>
              <span class="text-xs text-slate-450 mt-1 font-semibold">Try modifying your filter selections or check-in a new tenant.</span>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
    } else {
      tbody.innerHTML = filtered.map(tenant => {
        let statusBadge = '';
        if (tenant.status === 'Active') {
          statusBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">🟢 Active</span>`;
        } else {
          statusBadge = `<span class="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">⚪ Checked Out</span>`;
        }

        // KYC status badge
        let kycBadge = '';
        const docUrl = tenant.aadhaar_pdf_url || tenant.pan_pdf_url || tenant.id_card_pdf_url || tenant.docUrl;
        const hasIdAndDoc = tenant.idProofNumber && tenant.idProofNumber.trim() !== '' && docUrl && docUrl.trim() !== '';

        if (hasIdAndDoc) {
          kycBadge = `<span class="text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold w-max"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verified KYC</span>`;
        } else {
          kycBadge = `<span class="text-rose-600 bg-rose-50/50 border border-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold w-max"><i data-lucide="shield-alert" class="w-3.5 h-3.5"></i> Not Verified KYC</span>`;
        }

        // Allocation badges
        let allocationHtml = '';
        if (tenant.roomNumber) {
          const bedLetter = tenant.bedNumber ? String.fromCharCode(64 + tenant.bedNumber) : 'A';
          allocationHtml = `
            <div>
              <p class="font-bold text-slate-800 flex items-center gap-1">🏠 Room ${tenant.roomNumber}</p>
              <p class="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">🛏 Bed ${bedLetter}</p>
            </div>
          `;
        } else {
          allocationHtml = `<span class="bg-amber-50 text-amber-600 border border-amber-150 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">⚠️ No Room Assigned</span>`;
        }

        // Initials avatar
        const avatarColor = getAvatarColorClass(tenant.name);
        const initials = tenant.name.trim().charAt(0).toUpperCase();

        return `
          <tr class="saas-row hover:bg-slate-50/50 transition-colors cursor-pointer" onclick="viewTenantDetail('${tenant.id}', event)">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full ${avatarColor} font-black flex items-center justify-center border text-xs avatar-pill">
                  ${initials}
                </div>
                <div>
                  <p class="font-bold text-slate-800 leading-none flex items-center gap-2">
                    <span>${tenant.name}</span>
                    ${tenant.commonId || tenant.common_id ? `<span class="px-1.5 py-0.5 text-[9px] font-black text-green-600 bg-green-50 border border-green-100 rounded">${tenant.commonId || tenant.common_id}</span>` : ''}
                  </p>
                  <p class="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                    <span>✉ ${tenant.email}</span>
                    <span class="text-slate-300">•</span>
                    <span>☎ ${tenant.phone}</span>
                  </p>
                </div>
              </div>
            </td>
            <td class="px-5 py-3.5">
              ${allocationHtml}
            </td>
            <td class="px-5 py-3.5">
              <div>
                <p class="font-bold text-slate-800">₹${Number(tenant.rentAmount).toLocaleString('en-IN')}/mo</p>
                <p class="text-[10px] text-slate-400 font-bold mt-0.5">Deposit: ₹${Number(tenant.depositAmount).toLocaleString('en-IN')}</p>
              </div>
            </td>
            <td class="px-5 py-3.5">
              <div>
                <p class="text-slate-700 font-bold">${formatDate(tenant.checkInDate)}</p>
                <p class="text-[10px] text-slate-400 font-bold mt-0.5">Duration: ${getStayDuration(tenant.checkInDate, tenant.checkOutDate)}</p>
              </div>
            </td>
            <td class="px-5 py-3.5">
              ${kycBadge}
            </td>
            <td class="px-5 py-3.5">
              ${statusBadge}
            </td>
            <td class="px-5 py-3.5 text-right relative">
              <div class="flex items-center justify-end gap-2.5">
                ${tenant.status === 'Active' ? `
                  <button onclick="checkoutTenant('${tenant.id}')" class="px-3.5 py-1.5 border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-sm flex items-center gap-1">
                    <i data-lucide="log-out" class="w-3 h-3"></i> Check Out
                  </button>
                ` : ''}
                <button onclick="editTenant('${tenant.id}')" class="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-green-650 hover:text-green-600 transition-colors" title="Edit details">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load tenants directory:', err);
    window.UI.toast('Failed to load tenants directory', 'error');
  }
}

async function populateRoomsDropdown() {
  const select = document.getElementById('tenant-room-id');
  if (!select) return;

  try {
    allRooms = await window.apiRequest('/rooms');
    const availableRooms = allRooms.filter(r => r.status === 'Available' || r.status === 'Partial');

    select.innerHTML = `
      <option value="" data-price="0">-- No Room Assigned (Register Only) --</option>
    ` + availableRooms.map(r => `
      <option value="${r.id}" data-price="${r.price}">Unit ${r.roomNumber} - ${r.type} (Rent: ₹${r.price})</option>
    `).join('');

    // Automatically trigger rent change based on selected room
    select.addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      if (opt && opt.value) {
        document.getElementById('tenant-rent').value = opt.getAttribute('data-price');
      } else {
        document.getElementById('tenant-rent').value = '0';
      }
    });

    // Initial assignment
    document.getElementById('tenant-rent').value = '0';
  } catch (err) {
    console.error('Failed to fetch rooms list for check-in:', err);
  }
}

// Modal Stepper Logic Functions
function showStep(step) {
  currentStep = step;

  // Hide all step contents
  document.getElementById('step-1-content').classList.add('hidden');
  document.getElementById('step-2-content').classList.add('hidden');
  document.getElementById('step-3-content').classList.add('hidden');
  document.getElementById('step-4-content').classList.add('hidden');

  // Show selected step content
  document.getElementById(`step-${step}-content`).classList.remove('hidden');

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    const badge = indicator.querySelector('span');
    if (i === step) {
      indicator.className = "flex items-center gap-1.5 text-green-600 font-extrabold";
      badge.className = "w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center";
    } else if (i < step) {
      indicator.className = "flex items-center gap-1.5 text-slate-500 font-bold";
      badge.className = "w-5 h-5 rounded-full bg-emerald-55 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center";
      badge.textContent = '✓';
    } else {
      indicator.className = "flex items-center gap-1.5 text-slate-400";
      badge.className = "w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center";
      badge.textContent = i;
    }
  }

  // Update button visibilities
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  const submitBtn = document.getElementById('submit-step-btn');

  if (step === 1) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }

  if (step === 4) {
    nextBtn.classList.add('hidden');
    submitBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    submitBtn.classList.add('hidden');
  }
}

function goToNextStep() {
  // Validate step fields before going next
  if (currentStep === 1) {
    const phoneInput = document.getElementById('tenant-phone');
    const cleanedPhone = phoneInput.value.replace(/\D/g, '');
    if (!document.getElementById('tenant-name').value || !phoneInput.value) {
      window.UI.toast('Please fill in Name and Phone', 'warning');
      return;
    }
    if (cleanedPhone.length !== 10) {
      window.UI.toast('Mobile number must be exactly 10 digits.', 'warning');
      return;
    }
  }
  if (currentStep === 3) {
    if (!uploadedDocUrl) {
      window.UI.toast('Uploading an identity document is compulsory. Please select and upload a valid PDF or Image file.', 'warning');
      return;
    }
  }
  showStep(currentStep + 1);
}

function goToPrevStep() {
  showStep(currentStep - 1);
}

function resetStepper() {
  currentStep = 1;
  uploadedDocUrl = '';
  showStep(1);
  document.getElementById('stepper-loader').classList.add('hidden');
  document.getElementById('stepper-actions-bar').classList.remove('hidden');

  // Reset upload zone UI
  const fileInput = document.getElementById('tenant-doc-file');
  if (fileInput) fileInput.value = '';

  const titleEl = document.getElementById('doc-upload-title');
  const subEl = document.getElementById('doc-upload-sub');
  const iconEl = document.getElementById('doc-upload-icon');
  const zoneEl = document.getElementById('doc-upload-zone');

  if (titleEl) titleEl.textContent = "Upload ID Document (Compulsory)";
  if (subEl) subEl.textContent = "PDF, JPG, or PNG up to 5MB";
  if (iconEl) {
    iconEl.setAttribute('data-lucide', 'cloud-upload');
    iconEl.className = "w-8 h-8 text-slate-400 mb-2";
    if (window.lucide) window.lucide.createIcons();
  }
  if (zoneEl) {
    zoneEl.className = "border-2 border-dashed border-slate-200/85 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer";
  }
}

async function handleDocUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'pdf' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
    window.UI.toast('Only PDF, JPG, JPEG, and PNG files are allowed.', 'warning');
    e.target.value = '';
    return;
  }

  const titleEl = document.getElementById('doc-upload-title');
  const subEl = document.getElementById('doc-upload-sub');
  const iconEl = document.getElementById('doc-upload-icon');
  const zoneEl = document.getElementById('doc-upload-zone');

  if (titleEl) titleEl.innerHTML = '<span class="text-green-650 text-green-600 animate-pulse">Uploading file...</span>';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await window.apiRequest('/upload', {
      method: 'POST',
      body: formData
    });
    if (res && res.url) {
      uploadedDocUrl = res.url;
      if (titleEl) titleEl.innerHTML = '<span class="text-emerald-600">✓ Uploaded Successfully</span>';
      if (subEl) subEl.innerHTML = `<span class="font-bold text-slate-700">${file.name}</span>`;
      if (iconEl) {
        iconEl.setAttribute('data-lucide', 'check-circle-2');
        iconEl.className = "w-8 h-8 text-emerald-500 mb-2";
        if (window.lucide) window.lucide.createIcons();
      }
      if (zoneEl) {
        zoneEl.className = "border-2 border-dashed border-emerald-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-emerald-50/10 transition-all cursor-pointer";
      }
      window.UI.toast('Document uploaded successfully!', 'success');
    }
  } catch (err) {
    window.UI.toast('Upload failed: ' + err.message, 'error');
    if (titleEl) titleEl.textContent = "Upload ID Document (Compulsory)";
    if (subEl) subEl.textContent = "PDF, JPG, or PNG up to 5MB";
  }
}
window.handleDocUpload = handleDocUpload;

function openAddTenantModal() {
  resetStepper();
  document.getElementById('tenant-modal-title').textContent = "New Occupant Registration";
  document.getElementById('submit-step-btn').textContent = "Continue to Initial Payment";
  document.getElementById('tenant-checkin').value = new Date().toISOString().substring(0, 10);
  window.UI.showModal('tenant-modal');
}

function closeTenantModal() {
  window.UI.hideModal('tenant-modal');
  document.getElementById('tenant-form').reset();
  document.getElementById('tenant-id').value = '';
  resetStepper();
}

async function editTenant(id) {
  const tenant = allTenants.find(t => String(t.id) === String(id));
  if (!tenant) {
    window.UI.toast('Tenant record not found', 'error');
    return;
  }

  resetStepper();

  document.getElementById('tenant-modal-title').textContent = "Edit Occupant Profile";
  document.getElementById('submit-step-btn').textContent = "Save Changes";

  document.getElementById('tenant-id').value = tenant.id;
  document.getElementById('tenant-name').value = tenant.name || tenant.full_name || '';
  document.getElementById('tenant-email').value = tenant.email || '';
  document.getElementById('tenant-phone').value = tenant.phone || '';
  document.getElementById('tenant-room-id').value = tenant.roomId || '';
  document.getElementById('tenant-bed-number').value = tenant.bedNumber || '';
  document.getElementById('tenant-rent').value = tenant.rentAmount || '';
  document.getElementById('tenant-deposit').value = tenant.depositAmount || '';
  document.getElementById('tenant-id-type').value = tenant.idProofType || 'Aadhaar Card';
  document.getElementById('tenant-id-number').value = tenant.idProofNumber || '';

  if (tenant.checkInDate) {
    document.getElementById('tenant-checkin').value = tenant.checkInDate.substring(0, 10);
  }

  if (tenant.emergencyContact) {
    document.getElementById('contact-name').value = tenant.emergencyContact.name || '';
    document.getElementById('contact-relation').value = tenant.emergencyContact.relation || '';
    document.getElementById('contact-phone').value = tenant.emergencyContact.phone || '';
  }

  const docUrl = tenant.aadhaar_pdf_url || tenant.pan_pdf_url || tenant.id_card_pdf_url;
  if (docUrl) {
    uploadedDocUrl = docUrl;
    const titleEl = document.getElementById('doc-upload-title');
    const subEl = document.getElementById('doc-upload-sub');
    const iconEl = document.getElementById('doc-upload-icon');
    const zoneEl = document.getElementById('doc-upload-zone');

    if (titleEl) titleEl.innerHTML = '<span class="text-emerald-600">✓ Document Loaded</span>';
    if (subEl) subEl.innerHTML = `<span class="font-bold text-slate-700">Existing Document</span>`;
    if (iconEl) {
      iconEl.setAttribute('data-lucide', 'check-circle-2');
      iconEl.className = "w-8 h-8 text-emerald-500 mb-2";
      if (window.lucide) window.lucide.createIcons();
    }
    if (zoneEl) {
      zoneEl.className = "border-2 border-dashed border-emerald-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-emerald-50/10 transition-all cursor-pointer";
    }
  }

  window.UI.showModal('tenant-modal');
}
window.editTenant = editTenant;

async function checkoutTenant(id) {
  const tenant = allTenants.find(t => String(t.id) === String(id));
  if (!tenant) {
    window.UI.toast('Tenant record not found', 'error');
    return;
  }

  // Set temporary loading states in the checkout modal
  document.getElementById('checkout-detail-name').textContent = tenant.name || tenant.full_name || '';
  document.getElementById('checkout-detail-common-id').textContent = tenant.commonId || tenant.common_id || '—';
  document.getElementById('checkout-detail-phone').textContent = tenant.phone || '—';

  // Set avatar
  const avatarEl = document.getElementById('checkout-detail-avatar');
  if (avatarEl) {
    avatarEl.className = `w-10 h-10 rounded-full font-black text-sm flex items-center justify-center text-white avatar-pill ${getAvatarColorClass(tenant.name)}`;
    avatarEl.textContent = tenant.name.trim().charAt(0).toUpperCase();
  }

  // Allocated Room
  const roomName = tenant.roomNumber ? `Room ${tenant.roomNumber}` : 'No Room';
  const bedLetter = tenant.bedNumber ? `Bed ${String.fromCharCode(64 + tenant.bedNumber)}` : 'No Bed';
  document.getElementById('checkout-detail-room-bed').textContent = tenant.roomNumber ? `${roomName} • ${bedLetter}` : 'No Room Allocated';

  // Dates
  document.getElementById('checkout-detail-checkin').textContent = formatDate(tenant.checkInDate || tenant.checkin_date);
  document.getElementById('checkout-detail-duration').textContent = getStayDuration(tenant.checkInDate || tenant.checkin_date, new Date().toISOString().split('T')[0]);

  // Financials
  document.getElementById('checkout-detail-rent').textContent = `₹${Number(tenant.rentAmount || tenant.rent_amount || 0).toLocaleString('en-IN')}/mo`;
  document.getElementById('checkout-detail-deposit').textContent = `₹${Number(tenant.depositAmount || tenant.security_deposit || 0).toLocaleString('en-IN')}`;

  // Clear history rows & show loading in dues alert
  document.getElementById('checkout-rent-history-rows').innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400 font-semibold">Loading rent history...</td></tr>`;
  document.getElementById('checkout-detail-dues-alert').innerHTML = `<span class="text-xs text-slate-400 font-semibold">Loading dues info...</span>`;
  document.getElementById('checkout-detail-dues-alert').className = "w-full flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50";

  // Show modal first so user sees it loading
  window.UI.showModal('checkout-detail-modal');
  if (window.lucide) window.lucide.createIcons();

  // Wire up confirmation button immediately but keep it disabled or updated
  const confirmBtn = document.getElementById('checkout-detail-confirm-btn');
  confirmBtn.disabled = true;
  confirmBtn.className = "px-5 py-2.5 bg-slate-200 text-slate-400 rounded-xl text-xs font-black cursor-not-allowed flex items-center gap-1.5 transition-all";

  let tenantRents = [];
  let pendingDuesTotal = 0;
  try {
    const allRents = await window.apiRequest('/rents?month=all');
    const rawRentsData = allRents.data || allRents || [];
    
    // Normalize raw data fields consistently
    const rentsData = rawRentsData.map(r => {
      const statusRaw = r.paymentStatus || r.payment_status || 'pending';
      let status = 'Pending';
      if (statusRaw.toLowerCase() === 'paid') status = 'Paid';
      else if (statusRaw.toLowerCase() === 'overdue') status = 'Overdue';
      
      return {
        ...r,
        tenantId: r.tenantId || r.tenant_id,
        amount: Number(r.amount || 0),
        electricityAmount: Number(r.electricityAmount || r.electricity_amount || 0),
        miscAmount: Number(r.miscAmount || r.misc_amount || 0),
        securityDeposit: Number(r.securityDeposit || r.security_deposit || 0),
        month: r.billing_period || r.month || '',
        status: status,
        dueDate: r.dueDate || r.due_date || '',
        paidDate: r.paidDate || r.paid_date || ''
      };
    });

    tenantRents = rentsData.filter(r => String(r.tenantId) === String(tenant.id));
    
    // Sort newest first by billing period month
    tenantRents.sort((a, b) => b.month.localeCompare(a.month));

    // Calculate total dues
    tenantRents.forEach(r => {
      if (r.status.toLowerCase() !== 'paid') {
        pendingDuesTotal += (r.amount + r.electricityAmount + r.miscAmount + r.securityDeposit);
      }
    });

    // Populate Rent History Rows (4 columns compact layout)
    let historyRowsHtml = '';
    if (tenantRents.length === 0) {
      historyRowsHtml = `
        <tr>
          <td colspan="4" class="px-4 py-4 text-center text-slate-400 font-semibold">No rent payments recorded.</td>
        </tr>
      `;
    } else {
      historyRowsHtml = tenantRents.map(r => {
        const monthName = r.month ? new Date(r.month + '-02').toLocaleDateString('default', { month: 'short', year: 'numeric' }) : '—';
        const totalAmt = r.amount + r.electricityAmount + r.miscAmount + r.securityDeposit;
        
        let statusBadge = '';
        if (r.status === 'Paid') {
          statusBadge = `<span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase">Paid</span>`;
        } else if (r.status === 'Overdue') {
          statusBadge = `<span class="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-black uppercase">Overdue</span>`;
        } else {
          statusBadge = `<span class="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-black uppercase">Pending</span>`;
        }
        
        const paidDateFormatted = r.paidDate ? formatDate(r.paidDate) : '—';
        
        return `
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-4 py-2 font-extrabold text-slate-800">${monthName}</td>
            <td class="px-4 py-2 text-slate-700">₹${totalAmt.toLocaleString('en-IN')}</td>
            <td class="px-4 py-2 text-slate-550 text-slate-500">${paidDateFormatted}</td>
            <td class="px-4 py-2 text-right">${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }
    document.getElementById('checkout-rent-history-rows').innerHTML = historyRowsHtml;

    // Populate Dues Alert
    const alertEl = document.getElementById('checkout-detail-dues-alert');
    if (pendingDuesTotal > 0) {
      alertEl.className = "w-full flex items-center gap-2.5 p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700";
      alertEl.innerHTML = `
        <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-500 shrink-0"></i>
        <div class="leading-none text-left">
          <p class="font-extrabold text-[11px]">Pending Dues Detected</p>
          <p class="text-[10px] font-bold text-rose-500 mt-1">Total outstanding: ₹${pendingDuesTotal.toLocaleString('en-IN')}</p>
        </div>
      `;
    } else {
      alertEl.className = "w-full flex items-center gap-2.5 p-3 rounded-2xl border border-emerald-250 border-emerald-200 bg-emerald-50 text-emerald-700";
      alertEl.innerHTML = `
        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-555 text-emerald-550 text-emerald-500 shrink-0"></i>
        <div class="leading-none text-left">
          <p class="font-extrabold text-[11px]">All Dues Settled</p>
          <p class="text-[10px] font-bold text-emerald-600 mt-1">No pending dues on record</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Failed to load rent history for checkout view:", err);
    document.getElementById('checkout-rent-history-rows').innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-rose-500 font-semibold">Failed to load rent history</td></tr>`;
    document.getElementById('checkout-detail-dues-alert').innerHTML = `<span class="text-xs text-rose-500 font-semibold">Failed to load dues</span>`;
  }

  // Enable button after load complete
  confirmBtn.disabled = false;
  confirmBtn.className = "px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-100 flex items-center gap-1.5 transition-all cursor-pointer";
  confirmBtn.onclick = async () => {
    // If there are pending dues, warn the user but allow them to proceed
    if (pendingDuesTotal > 0) {
      if (!confirm(`Warning: This occupant has pending dues of ₹${pendingDuesTotal.toLocaleString('en-IN')}. Are you sure you want to proceed with check-out?`)) {
        return;
      }
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="animate-pulse">Processing...</span>`;

    try {
      await window.apiRequest(`/tenants/${tenant.id}/checkout`, { method: 'POST' });
      window.UI.toast('Tenant checked-out successfully', 'success');
      window.UI.hideModal('checkout-detail-modal');
      loadTenants();
      populateRoomsDropdown();
    } catch (err) {
      window.UI.toast(err.message || 'Checkout failed', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i data-lucide="log-out" class="w-3.5 h-3.5"></i> Confirm Check-Out`;
      if (window.lucide) window.lucide.createIcons();
    }
  };

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
window.checkoutTenant = checkoutTenant;

async function deleteTenant(id) {
  if (await window.UI.confirm('Are you absolutely sure you want to delete this tenant record? This action is irreversible.', 'Delete Tenant Record')) {
    try {
      await window.apiRequest(`/tenants/${id}`, { method: 'DELETE' });
      window.UI.toast('Tenant record removed', 'success');
      loadTenants();
      populateRoomsDropdown();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete record', 'error');
    }
  }
}

// Reset Filters handler
function resetFilters() {
  document.getElementById('search-tenant').value = '';
  const datePicker = document.getElementById('filter-tenant-date');
  if (datePicker) datePicker.value = '';

  const sortSelect = document.getElementById('filter-tenant-sort');
  if (sortSelect) sortSelect.value = 'newest';

  setStatusFilter('all');
}
window.resetFilters = resetFilters;

document.getElementById('tenant-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('tenant-name').value;
  const email = document.getElementById('tenant-email').value;
  const phone = document.getElementById('tenant-phone').value;
  const roomId = document.getElementById('tenant-room-id').value || null;
  const bedVal = document.getElementById('tenant-bed-number').value;
  const bedNumber = bedVal ? Number(bedVal) : null;
  const rentAmount = Number(document.getElementById('tenant-rent').value || 0);
  const depositAmount = Number(document.getElementById('tenant-deposit').value || 0);
  const idProofType = document.getElementById('tenant-id-type').value;
  const idProofNumber = document.getElementById('tenant-id-number').value;
  const checkInDate = document.getElementById('tenant-checkin').value;

  const emergencyContact = {
    name: document.getElementById('contact-name').value || '',
    relation: document.getElementById('contact-relation').value || '',
    phone: document.getElementById('contact-phone').value || ''
  };

  if (!uploadedDocUrl) {
    window.UI.toast('Uploading an identity document is compulsory. Please go back to Step 3 and upload your ID.', 'warning');
    return;
  }

  const cleanedTenantPhone = phone.replace(/\D/g, '');
  const cleanedEmergencyPhone = emergencyContact.phone.replace(/\D/g, '');

  if (cleanedTenantPhone.length !== 10) {
    window.UI.toast('Mobile number must be exactly 10 digits.', 'warning');
    return;
  }
  if (!emergencyContact.name || !emergencyContact.relation || !emergencyContact.phone) {
    window.UI.toast('Please fill in all Emergency Contact details', 'warning');
    return;
  }
  if (cleanedEmergencyPhone.length !== 10) {
    window.UI.toast('Emergency contact phone number must be exactly 10 digits.', 'warning');
    return;
  }

  const payload = {
    name, email, phone: cleanedTenantPhone, roomId, bedNumber, rentAmount, depositAmount,
    idProofType, idProofNumber, checkInDate, emergencyContact: {
      name: emergencyContact.name,
      relation: emergencyContact.relation,
      phone: cleanedEmergencyPhone
    },
    docUrl: uploadedDocUrl,
    aadhaarPdfUrl: idProofType.toLowerCase().includes('aadhaar') ? uploadedDocUrl : null,
    panPdfUrl: idProofType.toLowerCase().includes('pan') ? uploadedDocUrl : null
  };

  const tenantId = document.getElementById('tenant-id').value;
  const isEdit = !!tenantId;

  // Stepper Dynamic progress loader triggers
  const stepperLoader = document.getElementById('stepper-loader');
  const stepperActions = document.getElementById('stepper-actions-bar');
  const loaderText = document.getElementById('stepper-loader-text');

  stepperActions.classList.add('hidden');
  stepperLoader.classList.remove('hidden');

  try {
    if (isEdit) {
      loaderText.textContent = "Updating occupant profile details...";
      await window.apiRequest(`/tenants/${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Tenant profile updated successfully!', 'success');
    } else {
      loaderText.textContent = "1/4: Authenticating registration details...";
      await new Promise(r => setTimeout(r, 450));

      loaderText.textContent = "2/4: Allocating selected Bed & Room...";
      await new Promise(r => setTimeout(r, 450));

      loaderText.textContent = "3/4: Storing emergency contacts...";
      await new Promise(r => setTimeout(r, 450));

      loaderText.textContent = "4/4: Activating check-in stay...";
      await new Promise(r => setTimeout(r, 450));

      const createdTenant = await window.apiRequest('/tenants', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Tenant checked-in successfully!', 'success');
      lastCreatedTenant = createdTenant.data || createdTenant;
      closeTenantModal();
      loadTenants();
      populateRoomsDropdown();
      setTimeout(openInitialPaymentModal, 250);
    }
  } catch (err) {
    stepperLoader.classList.add('hidden');
    stepperActions.classList.remove('hidden');
    window.UI.toast(err.message || 'Operation failed', 'error');
  }
});

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadTenants();
});

document.getElementById('search-tenant').addEventListener('input', loadTenants);
if (document.getElementById('filter-tenant-date')) {
  document.getElementById('filter-tenant-date').addEventListener('change', loadTenants);
}

function setStatusFilter(status) {
  activeStatusFilter = status;

  const tabs = {
    'all': document.getElementById('tab-status-all'),
    'Active': document.getElementById('tab-status-active'),
    'Checked Out': document.getElementById('tab-status-checkout')
  };

  Object.keys(tabs).forEach(k => {
    const tabBtn = tabs[k];
    if (!tabBtn) return;
    if (k === status) {
      tabBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white text-slate-800 shadow-sm border border-slate-200/50";
    } else {
      tabBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-755";
    }
  });

  loadTenants();
}
window.setStatusFilter = setStatusFilter;

function clearDateFilter() {
  const picker = document.getElementById('filter-tenant-date');
  if (picker) picker.value = '';
  loadTenants();
}
window.clearDateFilter = clearDateFilter;

function maskIdNumber(num) {
  if (!num || num.trim() === '') return '—';
  const clean = num.trim();
  if (clean.length <= 4) return clean;
  return clean.substring(0, 3) + '•'.repeat(clean.length - 6) + clean.substring(clean.length - 3);
}

function triggerDirectKycUpload(id) {
  const tenant = allTenants.find(t => String(t.id) === String(id));
  if (!tenant) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.jpg,.jpeg,.png';

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      window.UI.toast('File size exceeds the 5MB limit.', 'warning');
      return;
    }

    const previewContainer = document.getElementById('detail-doc-preview-box');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-6 text-green-650 text-green-600 gap-2 border border-dashed border-green-150 rounded-2xl bg-green-50/10">
          <div class="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-bold animate-pulse">Uploading new document to Supabase storage...</p>
        </div>
      `;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await window.apiRequest('/upload', {
        method: 'POST',
        body: formData
      });

      if (res && res.url) {
        const payload = {
          docUrl: res.url,
          idProofType: tenant.idProofType || 'Aadhaar Card'
        };

        const updateResult = await window.apiRequest(`/tenants/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Patch the allTenants array directly with fresh data from PUT response
        if (updateResult) {
          const idx = allTenants.findIndex(t => String(t.id) === String(id));
          if (idx !== -1) {
            // Merge updated fields — the PUT response goes through mapTenant middleware so has docUrl
            allTenants[idx] = { ...allTenants[idx], ...updateResult };
          }
        }

        // Also do a fresh loadTenants to sync everything
        loadTenants(); // non-blocking

        window.UI.toast('Document uploaded & KYC verified! ✅', 'success');

        // Immediately reopen the modal with updated tenant data
        viewTenantDetail(id);
      }
    } catch (err) {
      console.error('KYC upload error:', err);
      window.UI.toast('Upload failed: ' + err.message, 'error');
      // Still refresh modal to show current state
      await loadTenants();
      viewTenantDetail(id);
    }
  };

  fileInput.click();
}
window.triggerDirectKycUpload = triggerDirectKycUpload;

async function viewTenantDetail(id, event) {
  // If clicked inside an interactive button, ignore
  if (event && event.target && event.target.closest('button')) {
    return;
  }

  const tenant = allTenants.find(t => String(t.id) === String(id));
  if (!tenant) {
    window.UI.toast('Tenant record not found', 'error');
    return;
  }

  // Populate avatar initials & color
  const avatarEl = document.getElementById('detail-avatar');
  if (avatarEl) {
    avatarEl.className = `w-24 h-24 rounded-full font-black text-4xl flex items-center justify-center border-2 border-white shadow-md avatar-pill mb-4 mt-2 ${getAvatarColorClass(tenant.name)}`;
    avatarEl.textContent = tenant.name.trim().charAt(0).toUpperCase();
  }

  // Populate basic profile details
  document.getElementById('detail-name').textContent = tenant.name || tenant.full_name || '';
  const commonIdValEl = document.getElementById('detail-common-id-val');
  if (commonIdValEl) {
    commonIdValEl.textContent = tenant.commonId || tenant.common_id || '—';
  }
  document.getElementById('detail-email-val').textContent = tenant.email || '—';
  document.getElementById('detail-email-val').title = tenant.email || '—';
  document.getElementById('detail-phone-val').textContent = tenant.phone || '—';

  // Status Badge
  const statusEl = document.getElementById('detail-status');
  if (statusEl) {
    if (tenant.status === 'Active') {
      statusEl.innerHTML = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">🟢 Active</span>`;
    } else {
      statusEl.innerHTML = `<span class="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">⚪ Checked Out</span>`;
    }
  }

  // Room Bed Sidebar Badge
  const roomName = tenant.roomNumber ? `Room ${tenant.roomNumber}` : 'No Room';
  const bedLetter = tenant.bedNumber ? `Bed ${String.fromCharCode(64 + tenant.bedNumber)}` : 'No Bed';
  document.getElementById('detail-room-bed-badge').textContent = tenant.roomNumber ? `${roomName} • ${bedLetter}` : 'No Room Allocated';

  // Sidebar Rent
  document.getElementById('detail-sidebar-rent').textContent = `₹${Number(tenant.rentAmount || 0).toLocaleString('en-IN')}/mo`;

  // Left panel details list check-in details
  document.getElementById('detail-checkin').textContent = formatDate(tenant.checkInDate);
  document.getElementById('detail-duration').textContent = getStayDuration(tenant.checkInDate, tenant.checkOutDate);

  // Sidebar Button actions wiring
  const editBtn = document.getElementById('detail-btn-edit');
  if (editBtn) {
    editBtn.onclick = () => {
      window.UI.hideModal('tenant-detail-modal');
      editTenant(tenant.id);
    };
  }

  const checkoutBtn = document.getElementById('detail-btn-checkout');
  if (checkoutBtn) {
    if (tenant.status === 'Active') {
      checkoutBtn.style.display = 'flex';
      checkoutBtn.onclick = () => {
        window.UI.hideModal('tenant-detail-modal');
        checkoutTenant(tenant.id);
      };
    } else {
      checkoutBtn.style.display = 'none';
    }
  }

  // Right card Accommodation details
  document.getElementById('detail-card-room').textContent = tenant.roomNumber ? `Room ${tenant.roomNumber}` : '—';
  document.getElementById('detail-card-bed').textContent = tenant.bedNumber ? `Bed ${String.fromCharCode(64 + tenant.bedNumber)}` : '—';
  document.getElementById('detail-card-rent').textContent = `₹${Number(tenant.rentAmount || 0).toLocaleString('en-IN')}/mo`;
  document.getElementById('detail-card-deposit').textContent = `₹${Number(tenant.depositAmount || 0).toLocaleString('en-IN')}`;

  // KYC details & Document Link
  const docUrl = tenant.aadhaar_pdf_url || tenant.pan_pdf_url || tenant.id_card_pdf_url || tenant.docUrl;
  const hasIdAndDoc = tenant.idProofNumber && tenant.idProofNumber.trim() !== '' && docUrl && docUrl.trim() !== '';

  const kycBadgeEl = document.getElementById('detail-kyc-status-badge');
  if (kycBadgeEl) {
    if (hasIdAndDoc) {
      kycBadgeEl.innerHTML = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">🟢 Verified KYC</span>`;
    } else if (tenant.idProofNumber && tenant.idProofNumber.trim() !== '') {
      kycBadgeEl.innerHTML = `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">🟡 Document Missing</span>`;
    } else {
      kycBadgeEl.innerHTML = `<span class="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">🔴 KYC Missing</span>`;
    }
  }

  document.getElementById('detail-card-id-label').textContent = `${tenant.idProofType || 'Identity Document'}`;
  document.getElementById('detail-card-id-number').textContent = maskIdNumber(tenant.idProofNumber);

  // Document Preview Box
  const previewBox = document.getElementById('detail-doc-preview-box');
  if (previewBox) {
    if (docUrl) {
      const isPdf = docUrl.split('?')[0].toLowerCase().endsWith('.pdf');
      previewBox.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-green-50/40 border border-green-100 rounded-2xl">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-650">
                <i data-lucide="${isPdf ? 'file-text' : 'image'}" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800">Uploaded Document Proof</p>
                <p class="text-[10px] text-slate-400 font-bold">${isPdf ? 'PDF file' : 'Image file'}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="${docUrl}" target="_blank" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                <span>View Fullscreen</span> <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </a>
              <button type="button" onclick="triggerDirectKycUpload('${tenant.id}')" class="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                <span>Replace</span> <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
          ${isPdf
          ? `<iframe src="${docUrl}" class="preview-iframe"></iframe>`
          : `<div class="preview-image-container"><img src="${docUrl}" class="preview-image cursor-zoom-in" onclick="window.open('${docUrl}', '_blank')"></div>`
          }
        </div>
      `;
    } else {
      previewBox.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-rose-500 gap-3 border border-dashed border-rose-105 border-rose-150 border-rose-200 rounded-2xl bg-rose-50/10">
          <div class="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-600"><i data-lucide="alert-triangle" class="w-6 h-6"></i></div>
          <div class="text-center">
            <p class="text-xs font-bold text-rose-700">No identity document file uploaded.</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Please upload A valid PDF or Image file proof.</p>
          </div>
          <button type="button" onclick="triggerDirectKycUpload('${tenant.id}')" class="px-4 py-2 bg-rose-650 hover:bg-rose-700 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
            <i data-lucide="upload" class="w-4 h-4"></i> Upload Document Proof
          </button>
        </div>
      `;
    }
  }

  // Emergency Contact fields
  if (tenant.emergencyContact) {
    document.getElementById('detail-card-emergency-name').textContent = tenant.emergencyContact.name || '—';
    document.getElementById('detail-card-emergency-relation').textContent = tenant.emergencyContact.relation || 'Parent';
    document.getElementById('detail-card-emergency-phone').textContent = tenant.emergencyContact.phone || '—';
  } else {
    document.getElementById('detail-card-emergency-name').textContent = '—';
    document.getElementById('detail-card-emergency-relation').textContent = '—';
    document.getElementById('detail-card-emergency-phone').textContent = '—';
  }

  // Render Activity Timeline
  const timelineEl = document.getElementById('detail-card-timeline');
  if (timelineEl) {
    // Render Loading indicator first
    document.getElementById('detail-sidebar-rent-status').innerHTML = `<span class="text-slate-400 font-semibold text-[10px]">Loading...</span>`;
    
    let rentStatus = 'Pending';
    let rentRecord = null;
    try {
      const allRents = await window.apiRequest('/rents');
      const tenantRents = allRents.filter(r => String(r.tenantId) === String(tenant.id));
      const currentMonth = new Date().toISOString().substring(0, 7);
      rentRecord = tenantRents.find(r => r.month === currentMonth);
      if (rentRecord) {
        rentStatus = rentRecord.status;
      }
    } catch (err) {
      console.error("Failed to load rent status in detail drawer:", err);
    }

    const badgeColor = rentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100';
    document.getElementById('detail-sidebar-rent-status').innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeColor}">${rentStatus}</span>`;

    let timelineHtml = `
      <div class="timeline-item">
        <div class="timeline-icon-box bg-emerald-50 border border-emerald-100 text-emerald-600">
          <i data-lucide="check-circle-2" class="w-4 h-4"></i>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-800">Registration & Checked In</p>
          <p class="text-[10px] text-slate-400 font-bold mt-0.5">${formatDate(tenant.checkInDate)}</p>
        </div>
      </div>
    `;

    if (rentStatus === 'Paid') {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-icon-box bg-emerald-50 border border-emerald-100 text-emerald-600">
            <i data-lucide="check" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800">Monthly Rent Payment Settled</p>
            <p class="text-[10px] text-slate-400 font-bold mt-0.5">Paid on ${formatDate(rentRecord ? rentRecord.paidDate : new Date())} — Receipt: ${rentRecord ? rentRecord.invoiceId : 'N/A'}</p>
          </div>
        </div>
      `;
    } else {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-icon-box bg-rose-50 border border-rose-100 text-rose-600">
            <i data-lucide="alert-circle" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-850 text-slate-800">Monthly Rent Payment Pending</p>
            <p class="text-[10px] text-rose-500 font-bold mt-0.5">Payment due for month: ${new Date().toLocaleString('default', { month: 'long' })}</p>
          </div>
        </div>
      `;
    }

    if (docUrl) {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-icon-box bg-green-50 border border-green-100 text-green-600">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800">KYC Document Uploaded</p>
            <p class="text-[10px] text-slate-400 font-bold mt-0.5">Verified proof stored on secure server</p>
          </div>
        </div>
      `;
    } else {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-icon-box bg-amber-50 border border-amber-100 text-amber-600">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800">KYC Verification Pending</p>
            <p class="text-[10px] text-amber-600 font-bold mt-0.5">Please upload identity document to complete verification</p>
          </div>
        </div>
      `;
    }

    if (tenant.status === 'Checked Out') {
      timelineHtml += `
        <div class="timeline-item">
          <div class="timeline-icon-box bg-slate-100 border border-slate-200 text-slate-500">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-700">Checked Out</p>
            <p class="text-[10px] text-slate-400 font-bold mt-0.5">Stay duration completed & room released</p>
          </div>
        </div>
      `;
    }

    timelineEl.innerHTML = timelineHtml;
  }

  // Render icons inside the modal
  if (window.lucide) {
    window.lucide.createIcons();
  }

  window.UI.showModal('tenant-detail-modal');
}
window.viewTenantDetail = viewTenantDetail;

document.addEventListener('DOMContentLoaded', () => {
  populateRoomsDropdown();
  loadTenants();

  // Restrict phone number inputs to 10 digits
  const restrictToDigits = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
  };
  const tPhone = document.getElementById('tenant-phone');
  if (tPhone) tPhone.addEventListener('input', restrictToDigits);
  const cPhone = document.getElementById('contact-phone');
  if (cPhone) cPhone.addEventListener('input', restrictToDigits);

  // Check url action param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    setTimeout(openAddTenantModal, 500);
  }
});

function copySuccessCommonId() {
  const code = document.getElementById('success-common-id').textContent;
  navigator.clipboard.writeText(code);
  window.UI.toast('Common ID copied to clipboard!', 'success');
}
window.copySuccessCommonId = copySuccessCommonId;

function closeSuccessIdModal() {
  window.UI.hideModal('success-id-modal');
}
window.closeSuccessIdModal = closeSuccessIdModal;

function openInitialPaymentModal() {
  if (!lastCreatedTenant) {
    window.UI.toast('No occupant record cached to collect rent.', 'error');
    return;
  }

  // Close success ID modal
  window.UI.hideModal('success-id-modal');

  // Populate IDs
  document.getElementById('init-tenant-id').value = lastCreatedTenant.id;
  
  const billingPeriodVal = new Date().toISOString().substring(0, 7);
  document.getElementById('init-billing-period').value = billingPeriodVal;
  
  const checkinDateVal = lastCreatedTenant.checkInDate || lastCreatedTenant.checkin_date || new Date().toISOString().split('T')[0];
  document.getElementById('init-due-date').value = checkinDateVal;

  // Pre-fill fields
  document.getElementById('init-amount').value = lastCreatedTenant.rentAmount || lastCreatedTenant.rent_amount || 0;
  
  const depositInput = document.getElementById('init-deposit');
  const depositPaid = !!(lastCreatedTenant.depositPaid || lastCreatedTenant.deposit_paid);
  let depositLabel = depositInput.previousElementSibling;

  if (depositPaid) {
    depositInput.value = lastCreatedTenant.security_deposit || lastCreatedTenant.depositAmount || 0;
    depositInput.readOnly = true;
    depositInput.classList.add('bg-slate-100/80', 'text-slate-400');
    if (depositLabel) {
      depositLabel.innerHTML = 'Security Deposit (₹) <span class="ml-1 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Completed</span>';
    }
  } else {
    depositInput.value = lastCreatedTenant.security_deposit || lastCreatedTenant.depositAmount || 0;
    depositInput.readOnly = false;
    depositInput.classList.remove('bg-slate-100/80', 'text-slate-400');
    if (depositLabel) {
      depositLabel.innerHTML = 'Security Deposit (₹)';
    }
  }

  document.getElementById('init-electricity').value = 0;
  document.getElementById('init-misc').value = 0;
  document.getElementById('init-notes').value = "Initial Check-in Rent & Deposit";

  // Pre-fill tenant details block
  const roomNum = lastCreatedTenant.roomNumber || lastCreatedTenant.room || '—';
  document.getElementById('init-tenant-details').innerHTML = `
    <div class="flex justify-between"><span>Tenant:</span> <span class="text-slate-900 font-extrabold">${lastCreatedTenant.name || lastCreatedTenant.full_name}</span></div>
    <div class="flex justify-between"><span>Room:</span> <span class="text-slate-900 font-extrabold">Room ${roomNum}</span></div>
    <div class="flex justify-between"><span>Billing Month:</span> <span class="text-slate-900 font-extrabold">${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span></div>
  `;

  // Calculator
  const updateInitVal = () => {
    const rent = Number(document.getElementById('init-amount').value || 0);
    const deposit = depositPaid ? 0 : Number(depositInput.value || 0);
    const elec = Number(document.getElementById('init-electricity').value || 0);
    const misc = Number(document.getElementById('init-misc').value || 0);
    const total = rent + deposit + elec + misc;
    document.getElementById('init-total-val').innerText = `₹${total.toLocaleString()}`;
    
    // Update QR if active
    if (currentInitPaymentMethod === 'UPI') {
      const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=pleasanthomes@okaxis&pn=Pleasant%20Homes%20PG&cu=INR';
      document.getElementById('init-qr-img').src = `${qrUrl}&am=${total}`;
    }
  };
  document.getElementById('init-amount').oninput = updateInitVal;
  depositInput.oninput = updateInitVal;
  document.getElementById('init-electricity').oninput = updateInitVal;
  document.getElementById('init-misc').oninput = updateInitVal;
  updateInitVal();

  // Set default payment mode to UPI
  setInitPayMode('UPI');

  // Show Modal
  window.UI.showModal('initial-payment-modal');
  if (window.lucide) window.lucide.createIcons();
}
window.openInitialPaymentModal = openInitialPaymentModal;

let currentInitPaymentMethod = 'UPI';
function setInitPayMode(mode) {
  currentInitPaymentMethod = mode;
  const cashBtn = document.getElementById('init-pay-mode-cash');
  const gpayBtn = document.getElementById('init-pay-mode-gpay');
  const qrContainer = document.getElementById('init-qr-container');

  if (mode === 'Cash') {
    cashBtn.className = "py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 w-full";
    gpayBtn.className = "py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full";
    qrContainer.classList.add('hidden');
  } else {
    cashBtn.className = "py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full";
    gpayBtn.className = "py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 w-full";
    
    // Set QR code url
    const rent = Number(document.getElementById('init-amount').value || 0);
    const elec = Number(document.getElementById('init-electricity').value || 0);
    const misc = Number(document.getElementById('init-misc').value || 0);
    const total = rent + elec + misc;
    
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=pleasanthomes@okaxis&pn=Pleasant%20Homes%20PG&cu=INR';
    document.getElementById('init-qr-img').src = `${qrUrl}&am=${total}`;
    qrContainer.classList.remove('hidden');
  }
}
window.setInitPayMode = setInitPayMode;

// Bind submit listener for initial form
document.addEventListener('DOMContentLoaded', () => {
  const initForm = document.getElementById('initial-payment-form');
  if (initForm) {
    initForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const tenantId = document.getElementById('init-tenant-id').value;
      const billingPeriod = document.getElementById('init-billing-period').value;
      const dueDate = document.getElementById('init-due-date').value;
      const amount = Number(document.getElementById('init-amount').value || 0);
      const depositPaid = !!(lastCreatedTenant && (lastCreatedTenant.depositPaid || lastCreatedTenant.deposit_paid));
      const depositAmount = depositPaid ? 0 : Number(document.getElementById('init-deposit').value || 0);
      const electricityAmount = Number(document.getElementById('init-electricity').value || 0);
      const miscAmount = Number(document.getElementById('init-misc').value || 0);
      const notes = document.getElementById('init-notes').value;

      const transactionId = "TXN-" + Math.floor(100000 + Math.random() * 900000);

      try {
        await window.apiRequest('/rents', {
          method: 'POST',
          body: JSON.stringify({
            tenantId,
            amount,
            electricityAmount,
            miscAmount,
            securityDeposit: depositAmount,
            dueDate,
            paymentStatus: 'paid',
            paymentMethod: currentInitPaymentMethod,
            transactionId,
            notes
          })
        });

        window.UI.toast('First rent payment recorded successfully! ✅', 'success');
        window.UI.hideModal('initial-payment-modal');
        loadTenants();
        populateRoomsDropdown();

        // Show Common ID Success Modal now!
        if (lastCreatedTenant) {
          const cid = lastCreatedTenant.commonId || lastCreatedTenant.common_id || 'PG-001';
          const cidEl = document.getElementById('success-common-id');
          if (cidEl) cidEl.textContent = cid;
          window.UI.showModal('success-id-modal');
          if (window.lucide) window.lucide.createIcons();
        }
      } catch (err) {
        window.UI.toast(err.message || 'Payment recording failed', 'error');
      }
    });
  }
});
