// UI helpers, toaster, modal triggers, and common header/sidebar hydration
window.UI = {
  toast: function(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-500 text-white',
      error: 'bg-rose-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-amber-500 text-white'
    };
    
    toast.className = `px-4 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300 transform translate-y-5 opacity-0 flex items-center gap-2 pointer-events-auto ${colors[type] || colors.success}`;
    toast.innerHTML = `
      <span>${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-5', 'opacity-0');
    }, 10);
    
    // Animate out
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },

  hydrateHeaderAndSidebar: async function() {
    try {
      const sidebarContainer = document.getElementById('sidebar-container');
      if (sidebarContainer) {
        const response = await fetch('/components/sidebar.html?v=' + Date.now());
        if (response.ok) {
          sidebarContainer.innerHTML = await response.text();
          this.highlightActiveSidebar();
        }
      }
      
      const headerContainer = document.getElementById('header-container');
      if (headerContainer) {
        const response = await fetch('/components/header.html?v=' + Date.now());
        if (response.ok) {
          headerContainer.innerHTML = await response.text();
          this.initHeaderDropdowns();
          this.initPropertySelector();

          // Hydrate date pill (inline scripts in innerHTML don't execute)
          const datePill = document.getElementById('header-date-text');
          if (datePill) {
            const d = new Date();
            datePill.textContent = d.toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
          }
        }
      }
      
      // Initialize any lucide icons injected dynamically
      if (window.lucide) {
        window.lucide.createIcons();
      }
    } catch (error) {
      console.error('Failed to load shared components:', error);
    }
  },

  highlightActiveSidebar: function() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href && (
        currentPath.includes(href) ||
        (href.includes('properties.html') && currentPath.includes('property-detail.html'))
      );
      if (isMatch) {
        link.classList.add('active-page');
        link.classList.remove('bg-slate-100', 'text-green-600', 'text-slate-600', 'font-semibold');
      } else {
        link.classList.remove('active-page', 'bg-slate-100', 'text-green-600', 'font-semibold');
      }
    });
  },

  initHeaderDropdowns: function() {
    const profileBtn = document.getElementById('user-menu-button');
    const dropdown   = document.getElementById('user-menu-dropdown');

    const showEl  = (el) => { if(el) el.style.display = 'block'; };
    const hideEl  = (el) => { if(el) el.style.display = 'none'; };
    const toggleEl = (el) => { if(el) el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none'; };

    if (profileBtn && dropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEl(dropdown);
        hideEl(document.getElementById('notification-dropdown'));
      });
    }

    const notifBtn      = document.getElementById('notification-button');
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEl(notifDropdown);
        hideEl(dropdown);
        this.loadHeaderNotifications();
      });
    }

    document.addEventListener('click', () => {
      hideEl(dropdown);
      hideEl(notifDropdown);
    });

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.Auth.logout();
      });
    }

    const userNameEl = document.getElementById('header-user-name');
    const userRoleEl = document.getElementById('header-user-role');
    const userAvatarEl = document.getElementById('header-user-avatar');
    const currentUser = window.Auth.getCurrentUser();
    
    if (currentUser) {
      if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Admin';
      if (userRoleEl) userRoleEl.textContent = currentUser.role;
      if (userAvatarEl && currentUser.avatar) userAvatarEl.src = currentUser.avatar;
    }

    this.loadHeaderNotifications();
  },

  initPropertySelector: async function() {
    const selector = document.getElementById('property-select');
    if (!selector) return;
    
    try {
      const properties = await window.apiRequest('/properties');
      
      // Clear existing except first option "All Properties"
      selector.innerHTML = '<option value="all">All Properties</option>';
      
      properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = prop.name;
        selector.appendChild(option);
      });
      
      selector.value = window.AppState.getActivePropertyId();
      
      selector.addEventListener('change', (e) => {
        window.AppState.setActivePropertyId(e.target.value);
      });
    } catch (err) {
      console.error('Failed to load property selector options:', err);
    }
  },

  showModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  hideModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  loadHeaderNotifications: async function() {
    const badge = document.getElementById('notification-badge');
    const listEl = document.getElementById('notification-items');
    if (!badge && !listEl) return;

    try {
      const res = await window.apiRequest('/notifications');
      const notifications = res || [];
      const unread = notifications.filter(n => !n.is_read);

      if (unread.length > 0) {
        if (badge) badge.classList.remove('hidden');
      } else {
        if (badge) badge.classList.add('hidden');
      }

      if (listEl) {
        if (notifications.length === 0) {
          listEl.innerHTML = `<div class="px-4 py-6 text-center text-xs text-slate-400 font-semibold font-medium">No recent activity logs</div>`;
        } else {
          listEl.innerHTML = notifications.map(n => `
            <div class="px-4 py-3 hover:bg-slate-50 flex items-start gap-2.5 transition-colors relative ${n.is_read ? 'opacity-60' : ''}">
              <div class="flex-1">
                <p class="font-bold text-slate-800 text-xs">${n.title}</p>
                <p class="text-[10px] text-slate-500 mt-0.5 leading-relaxed">${n.message}</p>
                <p class="text-[9px] text-slate-400 mt-1 font-semibold">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              ${!n.is_read ? `
                <button onclick="window.UI.dismissNotification('${n.id}', event)" class="p-1 hover:bg-slate-200 rounded-lg text-slate-450 hover:text-green-600 transition-colors" title="Mark as read">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          `).join('');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    } catch (e) {
      console.error("Failed to load header notifications:", e);
    }
  },

  dismissNotification: async function(id, event) {
    if (event) event.stopPropagation();
    try {
      await window.apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      this.loadHeaderNotifications();
      this.toast('Notification marked as read', 'success');
    } catch (e) {
      console.error("Failed to dismiss notification:", e);
    }
  },

  clearAllNotifications: async function(event) {
    if (event) event.stopPropagation();
    try {
      const res = await window.apiRequest('/notifications');
      const unread = (res || []).filter(n => !n.is_read);
      for (const n of unread) {
        await window.apiRequest(`/notifications/${n.id}/read`, { method: 'PUT' });
      }
      this.loadHeaderNotifications();
      this.toast('All notifications dismissed', 'success');
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  },

  confirm: function(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
      let modal = document.getElementById('custom-confirm-modal');
      if (!modal) {
        const div = document.createElement('div');
        div.innerHTML = `
          <div id="custom-confirm-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm items-center justify-center z-[100] hidden">
            <div class="bg-white rounded-2xl max-w-sm w-full mx-4 overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300 scale-95 opacity-0" id="custom-confirm-box">
              <div class="p-6">
                <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <i data-lucide="help-circle" class="w-6 h-6"></i>
                </div>
                <h3 class="font-extrabold text-base text-slate-800" id="custom-confirm-title">Confirm Action</h3>
                <p class="text-xs text-slate-500 mt-2 leading-relaxed" id="custom-confirm-message">Are you sure you want to proceed?</p>
              </div>
              <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button id="custom-confirm-cancel" class="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all focus:outline-none">Cancel</button>
                <button id="custom-confirm-ok" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 focus:outline-none">Confirm</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(div.firstElementChild);
        modal = document.getElementById('custom-confirm-modal');
      }

      document.getElementById('custom-confirm-title').textContent = title;
      document.getElementById('custom-confirm-message').textContent = message;
      
      const box = document.getElementById('custom-confirm-box');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
      }, 50);

      const cleanup = (value) => {
        box.classList.remove('scale-100', 'opacity-100');
        box.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }, 200);
        resolve(value);
      };

      document.getElementById('custom-confirm-ok').onclick = () => cleanup(true);
      document.getElementById('custom-confirm-cancel').onclick = () => cleanup(false);
      modal.onclick = (e) => {
        if (e.target === modal) cleanup(false);
      };
    });
  },

  /* -----------------------------------------------
     THEME SYSTEM
     initTheme  — reads localStorage → applies class
     applyTheme — saves + applies chosen theme
  ----------------------------------------------- */
  THEME_KEY: 'ph_ui_theme',
  VALID_THEMES: ['theme-green', 'theme-sandal', 'theme-slate', 'theme-ocean'],

  initTheme: function() {
    const saved = localStorage.getItem(this.THEME_KEY) || 'theme-green';
    this.applyTheme(saved, false);
  },

  applyTheme: function(theme, save = true) {
    const body = document.body;
    // Remove any existing theme class
    this.VALID_THEMES.forEach(t => body.classList.remove(t));
    // Apply the chosen theme
    if (this.VALID_THEMES.includes(theme)) {
      body.classList.add(theme);
    } else {
      body.classList.add('theme-green');
      theme = 'theme-green';
    }
    if (save) {
      localStorage.setItem(this.THEME_KEY, theme);
    }
    // Sync any theme selector radio buttons on the page
    const radios = document.querySelectorAll('input[name="ui-theme"]');
    radios.forEach(r => { r.checked = r.value === theme; });
  }
};

// Auto-initialize theme immediately (before render) to prevent flash
(function() {
  const saved = localStorage.getItem('ph_ui_theme') || 'theme-green';
  const valid = ['theme-green','theme-sandal','theme-slate','theme-ocean'];
  if (valid.includes(saved)) document.body.classList.add(saved);
})();
