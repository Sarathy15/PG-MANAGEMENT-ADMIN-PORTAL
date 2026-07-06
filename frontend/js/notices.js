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
      filtered = filtered.filter(n => n.propertyId === 'all' || n.propertyId === activePropId);
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
        let isGlobal = notice.propertyId === 'all';
        let scopeBadge = isGlobal 
          ? `<span class="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md">Global Broadcast</span>`
          : `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-md">Property Specific</span>`;
          
        return `
          <div class="bento-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${notice.date}</span>
                ${scopeBadge}
              </div>
              <h3 class="text-base font-bold text-slate-800 mt-2">${notice.title}</h3>
              <p class="text-xs text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">${notice.content}</p>
            </div>

            <div class="pt-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <i data-lucide="user" class="w-3.5 h-3.5 text-indigo-500"></i> Posted by Warden
              </span>
              <button onclick="deleteNotice('${notice.id}')" class="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
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
  
  const payload = { propertyId, title, content };
  
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

// Watch custom events
window.addEventListener('propertyChanged', () => {
  loadNotices();
});

document.addEventListener('DOMContentLoaded', () => {
  populatePropertyDropdown();
  loadNotices();
});
