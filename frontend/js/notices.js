// Notice Board Controller
let noticesList = [];

async function loadNotices() {
  const grid = document.getElementById('notices-grid');
  if (!grid) return;
  
  const activePropId = window.AppState.getActivePropertyId();
  
  try {
    noticesList = await window.apiRequest('/notices');
    
    // Filtering
    let filtered = noticesList;
    if (activePropId !== 'all') {
      filtered = filtered.filter(n => !n.propertyId || n.propertyId === 'all' || String(n.propertyId) === String(activePropId));
    }
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
            <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <i data-lucide="megaphone" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-semibold text-slate-800">No active announcements</h3>
            <p class="text-xs text-slate-400 mt-1">Write your first broadcast to notify active occupants.</p>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(notice => {
        let isGlobal = notice.propertyId === 'all' || !notice.propertyId;
        let scopeBadge = isGlobal 
          ? `<span class="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Global Broadcast</span>`
          : `<span class="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Property Specific</span>`;
        
        let catBadge = '';
        let catClass = '';
        let iconName = 'megaphone';
        
        if (notice.category === 'Food') {
          catBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">🍽️ Food Notice</span>`;
          catClass = 'border-l-4 border-l-emerald-500';
          iconName = 'chef-hat';
        } else if (notice.category === 'Utility') {
          catBadge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">⚡ Utility Update</span>`;
          catClass = 'border-l-4 border-l-amber-500';
          iconName = 'plug-zap';
        } else if (notice.category === 'Maintenance') {
          catBadge = `<span class="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">🛠️ Maintenance</span>`;
          catClass = 'border-l-4 border-l-blue-500';
          iconName = 'wrench';
        } else if (notice.category === 'Warning') {
          catBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">⚠️ Warning / Alert</span>`;
          catClass = 'border-l-4 border-l-rose-500';
          iconName = 'alert-triangle';
        } else {
          catBadge = `<span class="bg-green-50 text-green-600 border border-green-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">📢 General</span>`;
          catClass = 'border-l-4 border-l-indigo-500';
          iconName = 'megaphone';
        }
        
        const dateStr = notice.publishDate || (notice.created_at ? notice.created_at.substring(0, 10) : '');

        return `
          <div class="bento-card p-6 flex flex-col justify-between space-y-4 ${catClass} transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${dateStr}</span>
                <div class="flex items-center gap-1.5">
                  ${catBadge}
                  ${scopeBadge}
                </div>
              </div>
              <div class="flex items-start gap-3 mt-4">
                <div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <i data-lucide="${iconName}" class="w-4 h-4"></i>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-slate-800">${notice.title}</h3>
                  <p class="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed mt-1">${notice.content}</p>
                </div>
              </div>
            </div>
 
            <div class="pt-4 border-t border-slate-100/60 flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <i data-lucide="user" class="w-3.5 h-3.5 text-green-500"></i> Posted by Warden
              </span>
              <button onclick="deleteNotice('${notice.id}')" class="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 focus:outline-none cursor-pointer">
                <i data-lucide="trash" class="w-3.5 h-3.5"></i> Delete Broadcast
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
    console.error('Failed to load notices bulletin:', err);
    window.UI.toast('Failed to load notices', 'error');
  }
}

async function populatePropertyDropdown() {
  const select = document.getElementById('notice-property-id');
  if (!select) return;
  try {
    const props = await window.apiRequest('/properties');
    select.innerHTML = '<option value="all">🌐 All Properties</option>' + props.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load properties for notices selection:', err);
  }
}

function openNoticeModal() {
  window.UI.showModal('notice-modal');
}

function closeNoticeModal() {
  window.UI.hideModal('notice-modal');
  document.getElementById('notice-form').reset();
}

async function deleteNotice(id) {
  if (confirm('Are you absolutely sure you want to delete this notice broadcast? It will be removed from all occupant view feeds.')) {
    try {
      await window.apiRequest(`/notices/${id}`, { method: 'DELETE' });
      window.UI.toast('Notice announcement removed', 'success');
      loadNotices();
    } catch (err) {
      window.UI.toast(err.message || 'Failed to delete notice', 'error');
    }
  }
}

document.getElementById('notice-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const propertyId = document.getElementById('notice-property-id').value;
  const title = document.getElementById('notice-title').value;
  const content = document.getElementById('notice-content').value;
  const category = document.getElementById('notice-category').value;
  
  const payload = { propertyId, title, content, category };
  
  try {
    await window.apiRequest('/notices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    window.UI.toast('Notice announced successfully!', 'success');
    closeNoticeModal();
    loadNotices();
  } catch (err) {
    window.UI.toast(err.message || 'Failed to publish notice', 'error');
  }
});

function applyNoticeTemplate(type) {
  const titleInput = document.getElementById('notice-title');
  const descInput = document.getElementById('notice-content');
  const catSelect = document.getElementById('notice-category');
  
  if (!titleInput || !descInput || !catSelect) return;
  
  if (type === 'food') {
    catSelect.value = 'Food';
    titleInput.value = 'Dinner Menu Change Today';
    descInput.value = `Dear Occupants,\n\nPlease note that tonight's dinner menu has been updated:\n• Tonight we will serve Idly with Sambar & Chutney (instead of Chappati).\n• Timings: 7:30 PM to 9:30 PM.\n\nThank you,\nPG Management`;
  } else if (type === 'rent') {
    catSelect.value = 'Utility';
    titleInput.value = 'Notice: Next Month Electricity Tariff Revision';
    descInput.value = `Dear Residents,\n\nWe would like to inform you that starting next month onwards, the electricity bill unit charges will be updated to ₹12.50 per unit due to structural tariff changes from the utility board.\n\nThank you for your understanding.`;
  } else if (type === 'water') {
    catSelect.value = 'Maintenance';
    titleInput.value = 'Scheduled Water Tank Cleaning Tomorrow';
    descInput.value = `Dear Residents,\n\nPlease note that tomorrow between 10:00 AM and 1:00 PM, water supply will be temporarily suspended due to the scheduled cleaning of all PG overhead water tanks.\n\nPlease store water in advance for your morning needs.\n\nThank you.`;
  } else if (type === 'pest') {
    catSelect.value = 'General';
    titleInput.value = 'Scheduled Pest Control Treatment';
    descInput.value = `Dear Occupants,\n\nA general pest control and sanitization treatment is scheduled for all rooms and common areas this Saturday starting from 9:30 AM onwards.\n\nKindly assist by keeping your room accessible during the treatment.\n\nBest regards,\nPG Warden`;
  }
}
window.applyNoticeTemplate = applyNoticeTemplate;

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadNotices();
});

document.addEventListener('DOMContentLoaded', () => {
  populatePropertyDropdown();
  loadNotices();
});
