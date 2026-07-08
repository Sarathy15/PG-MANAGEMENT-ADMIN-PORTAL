/**
 * PLEASANT HOMES — Mobile Experience Controller
 * Handles: splash screen, drawer sidebar, bottom nav, mobile header
 */

const MOBILE_BP = 768;
const isMobile = () => window.innerWidth < MOBILE_BP;

/* ── SPLASH SCREEN ──────────────────────────────────────────── */
function showMobileSplash() {
  if (!isMobile()) return;
  const splash = document.getElementById('mobile-splash');
  if (!splash) return;
  splash.classList.add('active');
  // Hide after content has loaded
  window.addEventListener('load', hideMobileSplash);
  setTimeout(hideMobileSplash, 2200); // hard cap
}

function hideMobileSplash() {
  const splash = document.getElementById('mobile-splash');
  if (!splash || !splash.classList.contains('active')) return;
  splash.style.transition = 'opacity 0.45s ease-out';
  splash.style.opacity = '0';
  setTimeout(() => {
    splash.classList.remove('active');
    splash.style.opacity = '';
    splash.style.transition = '';
  }, 450);
}

/* ── MOBILE SHELL INJECTION ─────────────────────────────────── */
async function injectMobileShell() {
  if (!isMobile()) return;
  if (document.getElementById('mob-bottom-nav')) return; // already injected

  try {
    const res = await fetch('/components/mobile-shell.html?v=' + Date.now());
    if (!res.ok) return;
    const html = await res.text();

    // Inject after body open
    const container = document.createElement('div');
    container.id = 'mob-shell-root';
    container.innerHTML = html;
    document.body.insertBefore(container, document.body.firstChild);

    // Re-init lucide icons for newly injected content
    if (window.lucide) window.lucide.createIcons();

    // Sync user info from auth
    syncMobileUserInfo();

    // Highlight active bottom nav item
    highlightMobileNav();

    // Highlight drawer active link
    highlightDrawerNav();

    // Sync notification badge
    syncNotificationBadge();

  } catch (e) {
    console.warn('[Mobile] Shell injection failed:', e);
  }
}

/* ── DRAWER CONTROLS ────────────────────────────────────────── */
window.openMobileDrawer = function() {
  document.getElementById('mobile-sidebar-overlay')?.classList.add('open');
  document.getElementById('mobile-sidebar-drawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeMobileDrawer = function() {
  document.getElementById('mobile-sidebar-overlay')?.classList.remove('open');
  document.getElementById('mobile-sidebar-drawer')?.classList.remove('open');
  document.body.style.overflow = '';
};

// Close drawer with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closeMobileDrawer();
});

/* ── NAV HIGHLIGHTING ───────────────────────────────────────── */
function highlightMobileNav() {
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'management-dashboard';
  document.querySelectorAll('#mob-bottom-nav .mob-nav-item').forEach(el => {
    el.classList.toggle('active-page', el.dataset.page === page);
  });
}

function highlightDrawerNav() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('#mobile-sidebar-drawer .mob-nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isActive = href && currentPath.includes(href.replace('.html', ''));
    link.classList.toggle('active-page', isActive);
  });
}

/* ── USER INFO SYNC ─────────────────────────────────────────── */
function syncMobileUserInfo() {
  try {
    const userStr = localStorage.getItem('pg_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const name = user.name || user.full_name || 'Admin';
    const role = user.role || 'Property Manager';

    const nameEl = document.getElementById('mob-drawer-name');
    const roleEl = document.getElementById('mob-drawer-role');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  } catch (_) {}
}

/* ── NOTIFICATION BADGE SYNC ────────────────────────────────── */
function syncNotificationBadge() {
  // Mirror badge from desktop header if present
  const desktopBadge = document.getElementById('notification-badge');
  const mobDot = document.getElementById('mob-notif-dot');
  if (!mobDot) return;
  const observer = new MutationObserver(() => {
    const isVisible = desktopBadge && desktopBadge.style.display !== 'none';
    mobDot.style.display = isVisible ? 'block' : 'none';
  });
  if (desktopBadge) {
    observer.observe(desktopBadge, { attributes: true, attributeFilter: ['style'] });
  }
}

/* ── BOOTSTRAP ──────────────────────────────────────────────── */
(function bootstrap() {
  // Show splash immediately (before DOM finishes)
  if (isMobile()) {
    const splash = document.getElementById('mobile-splash');
    if (splash) {
      splash.classList.add('active');
      setTimeout(hideMobileSplash, 2200);
      window.addEventListener('load', hideMobileSplash);
    }
  }

  // Inject shell after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMobileShell);
  } else {
    injectMobileShell();
  }
})();
