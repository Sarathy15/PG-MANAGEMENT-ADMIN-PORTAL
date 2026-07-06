// Staff Registry Controller
let staffMembers = [];
let uploadedPhotoUrl = '';
let uploadedDocUrl = '';
let cropperInstance = null;

async function handleStaffPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('cropper-image');
    if (img) {
      img.src = e.target.result;
      
      window.UI.showModal('cropper-modal');
      
      if (cropperInstance) {
        cropperInstance.destroy();
      }
      
      // Delay initialization slightly to ensure modal is visible in DOM
      setTimeout(() => {
        cropperInstance = new Cropper(img, {
          aspectRatio: 1, // force square crop
          viewMode: 1,
          autoCropArea: 0.9,
          background: false
        });
      }, 200);
    }
  };
  reader.readAsDataURL(file);
}
window.handleStaffPhotoUpload = handleStaffPhotoUpload;

window.closeCropperModal = function() {
  window.UI.hideModal('cropper-modal');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  const fileInput = document.getElementById('staff-photo-file');
  if (fileInput) fileInput.value = '';
};

// Bind Cropper submit action
document.addEventListener('DOMContentLoaded', () => {
  const cropBtn = document.getElementById('cropper-submit-btn');
  if (cropBtn) {
    cropBtn.addEventListener('click', async () => {
      if (!cropperInstance) return;
      
      cropBtn.disabled = true;
      cropBtn.textContent = 'Cropping...';
      
      cropperInstance.getCroppedCanvas({
        width: 256,
        height: 256
      }).toBlob(async (blob) => {
        try {
          const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await window.apiRequest('/upload', {
            method: 'POST',
            body: formData
          });
          
          if (res && res.url) {
            uploadedPhotoUrl = res.url;
            
            const previewImg = document.getElementById('staff-photo-preview');
            if (previewImg) {
              previewImg.src = res.url;
              previewImg.classList.remove('hidden');
            }
            const statusEl = document.getElementById('staff-photo-status');
            if (statusEl) statusEl.classList.add('hidden');
            
            window.UI.toast('Profile photo cropped & saved!', 'success');
            window.closeCropperModal();
          }
        } catch (err) {
          window.UI.toast('Crop upload failed: ' + err.message, 'error');
        } finally {
          cropBtn.disabled = false;
          cropBtn.textContent = 'Crop & Save';
        }
      }, 'image/jpeg', 0.9);
    });
  }
});

async function handleStaffDocUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const titleEl = document.getElementById('staff-doc-title');
  const subEl = document.getElementById('staff-doc-sub');
  const iconEl = document.getElementById('staff-doc-icon');
  const zoneEl = document.getElementById('staff-doc-zone');

  if (titleEl) titleEl.innerHTML = '<span class="text-indigo-600 animate-pulse">Uploading file...</span>';

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
        iconEl.className = "w-5 h-5 text-emerald-500 mb-1";
        if (window.lucide) window.lucide.createIcons();
      }
      if (zoneEl) {
        zoneEl.className = "border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-emerald-50/10 transition-all cursor-pointer";
      }
      window.UI.toast('ID Proof uploaded successfully!', 'success');
    }
  } catch (err) {
    window.UI.toast('Document upload failed: ' + err.message, 'error');
    if (titleEl) titleEl.textContent = "Upload ID Proof (Aadhaar/PAN/Passport)";
    if (subEl) subEl.textContent = "PDF, JPG, or PNG up to 5MB";
  }
}
window.handleStaffDocUpload = handleStaffDocUpload;

async function loadStaff() {
  const grid = document.getElementById('staff-grid');
  if (!grid) return;
  
  const searchTxt = document.getElementById('search-staff').value.toLowerCase();
  const roleFilter = document.getElementById('filter-staff-role').value;
  const activePropId = window.AppState.getActivePropertyId();
  
  try {
    staffMembers = await window.apiRequest('/staff');
    
    // Filters
    let filtered = staffMembers;
    if (activePropId !== 'all') {
      filtered = filtered.filter(s => String(s.propertyId) === String(activePropId));
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(s => s.role === roleFilter);
    }
    if (searchTxt) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTxt));
    }
    
    document.getElementById('staff-count-txt').textContent = `${filtered.length} staff registered`;
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
            <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <i data-lucide="briefcase" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-semibold text-slate-800">No staff members found</h3>
            <p class="text-xs text-slate-400 mt-1">Try clearing filters or register a new helper.</p>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(staff => {
        let avatarContent = '';
        const photoUrl = staff.profile_image || staff.profileImage;
        if (photoUrl) {
          avatarContent = `<img src="${photoUrl}" class="w-11 h-11 rounded-xl object-cover border border-indigo-100 flex-shrink-0">`;
        } else {
          let avatarText = staff.name.substring(0, 2).toUpperCase();
          avatarContent = `
            <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 flex items-center justify-center text-sm flex-shrink-0">
              ${avatarText}
            </div>
          `;
        }
        
        let kycBadge = '';
        const docUrl = staff.id_proof || staff.idProof;
        if (docUrl) {
          kycBadge = `
            <a href="${docUrl}" target="_blank" class="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-0.5 hover:bg-emerald-100 transition-colors">
              <i data-lucide="check-circle" class="w-3 h-3 text-emerald-500"></i> KYC Verified
            </a>
          `;
        } else {
          kycBadge = `
            <span class="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
              <i data-lucide="alert-circle" class="w-3 h-3 text-slate-400"></i> KYC Pending
            </span>
          `;
        }
        
        return `
          <div class="bento-card p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all border border-slate-200/80 bg-white rounded-2xl" onclick="viewStaffDetails('${staff.id}', '${encodeURIComponent(JSON.stringify(staff))}')">
            <div>
              <div class="flex items-center gap-3.5">
                ${avatarContent}
                <div>
                  <h3 class="font-bold text-slate-800 leading-tight text-sm">${staff.name}</h3>
                  <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">${staff.role}</span>
                    ${kycBadge}
                  </div>
                </div>
              </div>
              
              <!-- Info grid wrapper -->
              <div class="grid grid-cols-1 gap-2 pt-4 border-t border-slate-100 mt-4 text-[11px] font-semibold text-slate-600">
                <div class="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/30">
                  <div class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                  </div>
                  <span class="text-slate-700 font-bold">${staff.phone}</span>
                </div>
                <div class="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/30">
                  <div class="w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                  </div>
                  <span class="text-slate-700 font-bold truncate max-w-[200px]">${staff.email || 'No email registered'}</span>
                </div>
                <div class="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/30">
                  <div class="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                  </div>
                  <span class="text-slate-700 font-bold">Shift: ${staff.shift || 'Full Day'}</span>
                </div>
                <div class="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/30">
                  <div class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
                  </div>
                  <span class="text-slate-700 font-bold">Salary: ₹${Number(staff.salary).toLocaleString()}/mo</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/10">
              <button onclick="editStaff('${staff.id}', '${encodeURIComponent(JSON.stringify(staff))}'); event.stopPropagation();" class="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl hover:scale-105 transition-all" title="Edit Profile">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteStaff('${staff.id}'); event.stopPropagation();" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl hover:scale-105 transition-all" title="Delete Profile">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load staff list:', err);
    window.UI.toast('Failed to load staff list', 'error');
  }
}

async function populatePropertyDropdown() {
  const select = document.getElementById('staff-property-id');
  if (!select) return;
  try {
    const props = await window.apiRequest('/properties');
    select.innerHTML = props.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load properties for staff:', err);
  }
}

function openAddStaffModal() {
  window.UI.showModal('staff-modal');
}

function closeStaffModal() {
  window.UI.hideModal('staff-modal');
  
  uploadedPhotoUrl = '';
  const previewImg = document.getElementById('staff-photo-preview');
  if (previewImg) {
    previewImg.src = '';
    previewImg.classList.add('hidden');
  }
  const statusEl = document.getElementById('staff-photo-status');
  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = '<i data-lucide="camera" class="w-5 h-5 mb-1 text-slate-400"></i><span class="text-[9px] font-bold">Photo</span>';
  }

  uploadedDocUrl = '';
  const docTitle = document.getElementById('staff-doc-title');
  if (docTitle) docTitle.textContent = "Upload ID Proof (Aadhaar/PAN/Passport)";
  const docSub = document.getElementById('staff-doc-sub');
  if (docSub) docSub.textContent = "PDF, JPG, or PNG up to 5MB";
  const docIcon = document.getElementById('staff-doc-icon');
  if (docIcon) {
    docIcon.setAttribute('data-lucide', 'file-text');
    docIcon.className = "w-5 h-5 text-slate-400 mb-1";
  }
  const docZone = document.getElementById('staff-doc-zone');
  if (docZone) {
    docZone.className = "border-2 border-dashed border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition-all cursor-pointer";
  }

  if (window.lucide) window.lucide.createIcons();

  const shiftSelect = document.getElementById('staff-shift');
  if (shiftSelect) {
    Array.from(shiftSelect.options).forEach(opt => {
      if (opt.dataset.temp) opt.remove();
    });
  }
  document.getElementById('staff-form').reset();
  document.getElementById('staff-id').value = '';
  document.getElementById('staff-modal-title').textContent = 'New Staff Registry';
}

function editStaff(id, encodedStaff) {
  const staff = JSON.parse(decodeURIComponent(encodedStaff));
  document.getElementById('staff-id').value = staff.id;
  document.getElementById('staff-property-id').value = staff.propertyId;
  document.getElementById('staff-name').value = staff.name;
  document.getElementById('staff-phone').value = staff.phone;
  document.getElementById('staff-email').value = staff.email;
  document.getElementById('staff-role').value = staff.role;
  document.getElementById('staff-salary').value = staff.salary;
  
  const shiftSelect = document.getElementById('staff-shift');
  if (shiftSelect) {
    Array.from(shiftSelect.options).forEach(opt => {
      if (opt.dataset.temp) opt.remove();
    });
    const hasOption = Array.from(shiftSelect.options).some(opt => opt.value === staff.shift);
    if (!hasOption && staff.shift) {
      const tempOpt = document.createElement('option');
      tempOpt.value = staff.shift;
      tempOpt.textContent = staff.shift;
      tempOpt.dataset.temp = "true";
      shiftSelect.appendChild(tempOpt);
    }
    shiftSelect.value = staff.shift;
  }

  const previewImg = document.getElementById('staff-photo-preview');
  const statusEl = document.getElementById('staff-photo-status');
  const photoUrl = staff.profile_image || staff.profileImage;
  
  if (photoUrl) {
    uploadedPhotoUrl = photoUrl;
    if (previewImg) {
      previewImg.src = photoUrl;
      previewImg.classList.remove('hidden');
    }
    if (statusEl) statusEl.classList.add('hidden');
  } else {
    uploadedPhotoUrl = '';
    if (previewImg) {
      previewImg.src = '';
      previewImg.classList.add('hidden');
    }
    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = '<i data-lucide="camera" class="w-5 h-5 mb-1 text-slate-400"></i><span class="text-[9px] font-bold">Photo</span>';
    }
  }

  const docUrl = staff.id_proof || staff.idProof;
  const docTitle = document.getElementById('staff-doc-title');
  const docSub = document.getElementById('staff-doc-sub');
  const docIcon = document.getElementById('staff-doc-icon');
  const docZone = document.getElementById('staff-doc-zone');

  if (docUrl) {
    uploadedDocUrl = docUrl;
    if (docTitle) docTitle.innerHTML = '<span class="text-emerald-600">✓ Uploaded Successfully</span>';
    if (docSub) {
      const parts = docUrl.split('/');
      docSub.textContent = parts[parts.length - 1];
    }
    if (docIcon) {
      docIcon.setAttribute('data-lucide', 'check-circle-2');
      docIcon.className = "w-5 h-5 text-emerald-500 mb-1";
    }
    if (docZone) {
      docZone.className = "border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-emerald-50/10 transition-all cursor-pointer";
    }
  } else {
    uploadedDocUrl = '';
    if (docTitle) docTitle.textContent = "Upload ID Proof (Aadhaar/PAN/Passport)";
    if (docSub) docSub.textContent = "PDF, JPG, or PNG up to 5MB";
    if (docIcon) {
      docIcon.setAttribute('data-lucide', 'file-text');
      docIcon.className = "w-5 h-5 text-slate-400 mb-1";
    }
    if (docZone) {
      docZone.className = "border-2 border-dashed border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition-all cursor-pointer";
    }
  }

  if (window.lucide) window.lucide.createIcons();
  
  document.getElementById('staff-modal-title').textContent = 'Edit Staff Member';
  window.UI.showModal('staff-modal');
}

async function deleteStaff(id) {
  if (confirm('Are you absolutely sure you want to remove this staff registry?')) {
    try {
      await window.apiRequest(`/staff/${id}`, { method: 'DELETE' });
      window.UI.toast('Staff record deleted', 'success');
      loadStaff();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete staff', 'error');
    }
  }
}

document.getElementById('staff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('staff-id').value;
  const propertyId = document.getElementById('staff-property-id').value;
  const name = document.getElementById('staff-name').value;
  const phone = document.getElementById('staff-phone').value.trim();
  let email = document.getElementById('staff-email').value.trim();
  const role = document.getElementById('staff-role').value;
  const salary = Number(document.getElementById('staff-salary').value);
  const shift = document.getElementById('staff-shift').value;
  
  if (!/^\d{10}$/.test(phone)) {
    window.UI.toast('Contact phone must be exactly 10 digits.', 'error');
    return;
  }
  
  if (email && !email.includes('@')) {
    email = email + '@gmail.com';
    document.getElementById('staff-email').value = email;
  }
  
  const payload = { 
    propertyId, 
    name, 
    phone, 
    email, 
    role, 
    salary, 
    shift, 
    status: 'Active',
    profileImage: uploadedPhotoUrl,
    idProof: uploadedDocUrl
  };
  
  try {
    if (id) {
      await window.apiRequest(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Staff record updated', 'success');
    } else {
      await window.apiRequest('/staff', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      window.UI.toast('Staff registered successfully!', 'success');
    }
    
    closeStaffModal();
    loadStaff();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to save staff', 'error');
  }
});

window.viewStaffDetails = function(id, encodedStaff) {
  const staff = JSON.parse(decodeURIComponent(encodedStaff));
  
  document.getElementById('detail-staff-name').textContent = staff.name;
  document.getElementById('detail-staff-role').textContent = staff.role;
  document.getElementById('detail-staff-property').textContent = staff.property || 'Pleasant Homes PG';
  document.getElementById('detail-staff-phone').textContent = staff.phone;
  document.getElementById('detail-staff-email').textContent = staff.email || 'No email registered';
  document.getElementById('detail-staff-salary').textContent = `₹${Number(staff.salary).toLocaleString()}/month`;
  document.getElementById('detail-staff-shift').textContent = staff.shift || 'Full Day';
  
  const avatarContainer = document.getElementById('detail-staff-avatar-container');
  const photoUrl = staff.profileImage || staff.profile_image;
  if (photoUrl) {
    avatarContainer.innerHTML = `<img src="${photoUrl}" class="w-full h-full object-cover">`;
  } else {
    const avatarText = staff.name.substring(0, 2).toUpperCase();
    avatarContainer.innerHTML = avatarText;
  }
  
  const kycStatus = document.getElementById('detail-staff-kyc-status');
  const kycAction = document.getElementById('detail-staff-kyc-action');
  const docUrl = staff.idProof || staff.id_proof;
  
  if (docUrl) {
    kycStatus.innerHTML = `<span class="text-emerald-600 flex items-center gap-1 font-bold"><i data-lucide="check-circle" class="w-4 h-4"></i> KYC Verified</span>`;
    kycAction.innerHTML = `
      <a href="${docUrl}" target="_blank" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-750 transition-colors flex items-center gap-1">
        <i data-lucide="eye" class="w-3.5 h-3.5"></i> View ID Proof
      </a>
    `;
  } else {
    kycStatus.innerHTML = `<span class="text-slate-400 flex items-center gap-1 font-bold"><i data-lucide="alert-circle" class="w-4 h-4"></i> KYC Pending</span>`;
    kycAction.innerHTML = `<span class="text-[10px] font-bold text-slate-400">No document</span>`;
  }
  
  if (window.lucide) window.lucide.createIcons();
  
  const editBtn = document.getElementById('detail-staff-edit-btn');
  editBtn.onclick = () => {
    closeStaffDetailModal();
    editStaff(staff.id, encodedStaff);
  };
  
  window.UI.showModal('staff-detail-modal');
};

window.closeStaffDetailModal = function() {
  window.UI.hideModal('staff-detail-modal');
};

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadStaff();
});

document.getElementById('search-staff').addEventListener('input', loadStaff);
document.getElementById('filter-staff-role').addEventListener('change', loadStaff);

document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('staff-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 10);
    });
  }
  
  const emailInput = document.getElementById('staff-email');
  if (emailInput) {
    emailInput.addEventListener('blur', (e) => {
      let val = e.target.value.trim();
      if (val && !val.includes('@')) {
        e.target.value = val + '@gmail.com';
      }
    });
  }

  populatePropertyDropdown();
  loadStaff();
});
