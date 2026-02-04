<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
         <img src="/logo.png" style="width: 100%;" alt="G-M System Logo" class="logo" />
      </div>

      <nav class="sidebar-nav">
        <!-- =====================
             USER MANAGEMENT
        ====================== -->
        <router-link v-if="isAdmin" :to="{ name: 'UserManagement' }" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>User Management</span>
        </router-link>

        <!-- =====================
             PROFILES
        ====================== -->
        <div class="nav-group">
          <div @click="profileMenuOpen = !profileMenuOpen" class="nav-item nav-group-header"
            :class="{ active: isProfileRoute }">
            <span class="nav-icon">👤</span>
            <span>Profiles</span>
            <span class="nav-arrow" :class="{ open: profileMenuOpen }">▼</span>
          </div>

          <div v-show="profileMenuOpen" class="nav-submenu">
            <router-link :to="{ name: 'JobProfiles' }" class="nav-item nav-subitem">
              <span class="nav-icon">💼</span>
              <span>Job Profiles</span>
            </router-link>

            <router-link :to="{ name: 'FreelancerProfiles' }" class="nav-item nav-subitem">
              <span class="nav-icon">🔑</span>
              <span>Freelancer Profiles</span>
            </router-link>

            <router-link :to="{ name: 'PersonalProfiles' }" class="nav-item nav-subitem">
              <span class="nav-icon">⚙️</span>
              <span>Personal Profiles</span>
            </router-link>
          </div>
        </div>
        <!-- =====================
             Interview
        ====================== -->
        <router-link :to="{ name: 'InterviewBoardsList' }" class="nav-item">
          <span class="nav-icon">💼</span>
          <span>Interviews Management</span>
        </router-link>

        <router-link :to="{ name: 'Assignments' }" class="nav-item ">
          <span class="nav-icon">📝</span>
          <span>Project & Task</span>
        </router-link>
        <!-- =====================
             ASSIGNMENTS
        ====================== -->
        <!-- <div class="nav-group">
          <div @click="assignmentMenuOpen = !assignmentMenuOpen" class="nav-item nav-group-header"
            :class="{ active: isAssignmentsRoute }">
            <span class="nav-icon">📝</span>
            <span>Assignments</span>
            <span class="nav-arrow" :class="{ open: assignmentMenuOpen }">▼</span>
          </div> -->

          <!-- <div class="nav-submenu">
            <router-link
              :to="{ name: 'Assignments' }"
              class="nav-item nav-subitem"
            >
              <span class="nav-icon">📝</span>
              <span>Assignments</span>
            </router-link> -->
          <!-- 
            <router-link
              :to="{ name: 'AssignmentCreate' }"
              class="nav-item nav-subitem"
            >
              <span class="nav-icon">➕</span>
              <span>New Assignment</span>
            </router-link> -->

          <!-- <router-link
              :to="{ name: 'EarningsTrend' }"
              class="nav-item nav-subitem"
            >
              <span class="nav-icon">📈</span>
              <span>Earnings Trend</span>
            </router-link> -->
          <!-- </div> -->
        <!-- </div> -->

        <!-- =====================
             FINANCE
        ====================== -->
        <div class="nav-group">
          <div @click="financeMenuOpen = !financeMenuOpen" class="nav-item nav-group-header"
            :class="{ active: isFinanceRoute }">
            <span class="nav-icon">💰</span>
            <span>Finance</span>
            <span class="nav-arrow" :class="{ open: financeMenuOpen }">▼</span>
          </div>

          <div v-show="financeMenuOpen" class="nav-submenu">
            <router-link :to="{ name: 'FinanceOverview' }" class="nav-item nav-subitem">
              <span class="nav-icon">📊</span>
              <span>Overview</span>
            </router-link>

            <router-link :to="{ name: 'TransactionsView' }" class="nav-item nav-subitem">
              <span class="nav-icon">📄</span>
              <span>Transactions</span>
            </router-link>

            <router-link :to="{ name: 'MonthlyPlansView' }" class="nav-item nav-subitem">
              <span class="nav-icon">🗓️</span>
              <span>Monthly Plans</span>
            </router-link>

            <router-link :to="{ name: 'PeriodicPlansView' }" class="nav-item nav-subitem">
              <span class="nav-icon">📅</span>
              <span>Week Plans</span>
            </router-link>

            <!-- Legacy Finance view (kept for backward compatibility) -->
            <!-- <router-link
              :to="{ name: 'Finance' }"
              class="nav-item nav-subitem"
            >
              <span class="nav-icon">💼</span>
              <span>Finance (Legacy)</span>
            </router-link> -->
          </div>
        </div>

        <!-- =====================
             AUDIT LOGS
        ====================== -->
        <router-link v-if="canViewAuditLogs(authStore.user)" :to="{ name: 'AuditLogs' }" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Audit Logs</span>
        </router-link>

        <!-- =====================
             DATABASE MANAGEMENT
        ====================== -->
        <router-link v-if="isAdmin" :to="{ name: 'DatabaseManagement' }" class="nav-item">
          <span class="nav-icon">💾</span>
          <span>Database Management</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
          <span class="user-role">{{ formatRole(authStore.user?.role) }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </aside>

    <div class="layout-content">
      <header class="topbar">
        <h1 class="page-title">{{ currentPageTitle }}</h1>
        <div class="topbar-actions">
          <span class="user-email">{{ authStore.user?.email }}</span>
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { canViewAuditLogs, hasAnyRole } from '../utils/permissions';
import { ROLES, LEGACY_ROLES } from '../constants/roles';

const authStore = useAuthStore();
const route = useRoute();

const profileMenuOpen = ref(false);
const assignmentMenuOpen = ref(false);
const financeMenuOpen = ref(false);

const isAdmin = computed(() =>
  hasAnyRole(authStore.user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, LEGACY_ROLES.BOSS])
);

const isFinanceAdmin = computed(() =>
  hasAnyRole(authStore.user, [ROLES.SUPER_ADMIN, LEGACY_ROLES.BOSS])
);

const isProfileRoute = computed(() => route.path.startsWith('/profiles'));
const isAssignmentsRoute = computed(() => route.path.startsWith('/assignments'));
const isFinanceRoute = computed(() => route.path.startsWith('/finance'));

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/profiles')) profileMenuOpen.value = true;
    if (path.startsWith('/assignments')) assignmentMenuOpen.value = true;
    if (path.startsWith('/finance')) financeMenuOpen.value = true;
  },
  { immediate: true }
);

const currentPageTitle = computed(
  () => route.meta.title || 'Team Management'
);

const formatRole = (role) =>
  role
    ? role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    : '';

const handleLogout = async () => {
  await authStore.logout();
  // router.replace('/login');
};
</script>


<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-secondary);
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, var(--sidebar-bg-primary) 0%, var(--sidebar-bg-secondary) 100%);
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  transition: background 0.3s ease;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  pointer-events: none;
}

.sidebar-header {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.sidebar-header h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md) 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all var(--transition-base);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin: 0 var(--spacing-sm);
  border-radius: var(--radius-md);
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-inverse);
  transform: translateX(4px);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: var(--text-inverse) !important;
  border-left: 3px solid var(--color-primary-light);
  padding-left: calc(var(--spacing-lg) - 3px);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.nav-item.router-link-active * {
  color: var(--text-inverse) !important;
}

.nav-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-group {
  margin: var(--spacing-xs) 0;
}

.nav-group-header {
  cursor: pointer;
  user-select: none;
}

.nav-group-header.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-inverse);
  border-left: 3px solid var(--color-primary-light);
  padding-left: calc(var(--spacing-lg) - 3px);
  font-weight: var(--font-weight-semibold);
}

.nav-arrow {
  margin-left: auto;
  font-size: 0.75rem;
  transition: transform var(--transition-base);
  opacity: 0.7;
}

.nav-arrow.open {
  transform: rotate(180deg);
}

.nav-submenu {
  background: rgba(0, 0, 0, 0.2);
  padding: var(--spacing-xs) 0;
  margin-top: var(--spacing-xs);
  border-radius: var(--radius-md);
  margin-left: var(--spacing-sm);
  margin-right: var(--spacing-sm);
}

.nav-subitem {
  padding-left: calc(var(--spacing-lg) + 24px + var(--spacing-md));
  font-size: var(--font-size-sm);
}

.nav-subitem.router-link-active {
  background: rgba(99, 102, 241, 0.25);
  border-left: 3px solid var(--color-primary-light);
  padding-left: calc(var(--spacing-lg) + 24px + var(--spacing-md) - 3px);
  color: var(--text-inverse) !important;
}

.nav-subitem.router-link-active * {
  color: var(--text-inverse) !important;
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--spacing-md) var(--spacing-lg);
}

.sidebar-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  background: rgba(0, 0, 0, 0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-inverse);
}

.user-role {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
  text-transform: capitalize;
}

.logout-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.logout-btn:active {
  transform: translateY(0);
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary);
}

.topbar {
  height: var(--topbar-height);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  position: relative;
  z-index: 5;
}

.topbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--border-light) 50%, transparent 100%);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-email {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
}

.main-content::-webkit-scrollbar {
  width: 10px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: var(--radius-full);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-dark);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .topbar {
    padding: 0 var(--spacing-lg);
  }
  
  .main-content {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 220px;
  }
  
  .sidebar-header h2 {
    font-size: var(--font-size-xl);
  }
  
  .page-title {
    font-size: var(--font-size-xl);
  }
  
  .main-content {
    padding: var(--spacing-md);
  }
  
  .user-email {
    display: none;
  }
}

@media (max-width: 640px) {
  .main-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 60vh;
  }
  
  .topbar {
    height: 60px;
    padding: 0 var(--spacing-md);
  }
  
  .page-title {
    font-size: var(--font-size-lg);
  }
}
</style>
