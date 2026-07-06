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
        const response = await fetch('/components/sidebar.html');
        if (response.ok) {
          sidebarContainer.innerHTML = await response.text();
          this.highlightActiveSidebar();
        }
      }
      
      const headerContainer = document.getElementById('header-container');
      if (headerContainer) {
        const response = await fetch('/components/header.html');
        if (response.ok) {
          headerContainer.innerHTML = await response.text();
          this.initHeaderDropdowns();
          this.initPropertySelector();
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
      if (href && (currentPath.includes(href) || (href.includes('properties.html') && currentPath.includes('property-detail.html')))) {
        link.classList.add('bg-slate-100', 'text-indigo-600', 'font-semibold');
        link.classList.remove('text-slate-600');
      } else {
        link.classList.remove('bg-slate-100', 'text-indigo-600', 'font-semibold');
      }
    });
  },

  initHeaderDropdowns: function() {
    const profileBtn = document.getElementById('user-menu-button');
    const dropdown = document.getElementById('user-menu-dropdown');
    
    if (profileBtn && dropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });
      
      document.addEventListener('click', () => {
        dropdown.classList.add('hidden');
      });
    }

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
      if (userNameEl) userNameEl.textContent = currentUser.name;
      if (userRoleEl) userRoleEl.textContent = currentUser.role;
      if (userAvatarEl && currentUser.avatar) userAvatarEl.src = currentUser.avatar;
    }
  },

  initPropertySelector: async function() {
    const selector = document.getElementById('property-select');
    if (!selector) return;
    
    try {
      const properties = await window.apiRequest('/properties');
      
      // Clear existing except first option "All Properties"
      selector.innerHTML = '<option value="all">🏢 All Properties</option>';
      
      properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = `🏢 ${prop.name}`;
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
  }
};
