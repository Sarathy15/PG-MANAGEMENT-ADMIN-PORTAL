// Common Page Routing Guard & Initializer
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session and Security check
  window.Auth.checkSession();

  // 2. Load shared sidebar & header components
  if (window.Auth.isAuthenticated()) {
    await window.UI.hydrateHeaderAndSidebar();
  }
});
