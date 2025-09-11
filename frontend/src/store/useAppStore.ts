import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface Modal {
  id: string
  type: 'auth' | 'confirm' | 'product' | 'cart' | 'custom'
  props?: Record<string, any>
  isOpen: boolean
}

interface AppState {
  // UI State
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  isLoading: boolean
  
  // Toasts
  toasts: Toast[]
  
  // Modals
  modals: Modal[]
  
  // Global error
  globalError: string | null
  
  // Network status
  isOnline: boolean
  
  // App metadata
  appName: string
  version: string
  
  // Feature flags
  featureFlags: Record<string, boolean>
}

interface AppActions {
  // UI Actions
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  toggleMobileMenu: () => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSearch: () => void
  openSearch: () => void
  closeSearch: () => void
  setLoading: (loading: boolean) => void
  
  // Toast Actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Modal Actions
  openModal: (modal: Omit<Modal, 'id' | 'isOpen'>) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Error Actions
  setGlobalError: (error: string | null) => void
  clearGlobalError: () => void
  
  // Network Actions
  setOnlineStatus: (isOnline: boolean) => void
  
  // Feature Flag Actions
  setFeatureFlag: (flag: string, enabled: boolean) => void
  getFeatureFlag: (flag: string) => boolean
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  isSidebarOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isLoading: false,
  toasts: [],
  modals: [],
  globalError: null,
  isOnline: true,
  appName: 'ApniDukaan',
  version: '1.0.0',
  featureFlags: {
    darkMode: true,
    socialLogin: true,
    wishlist: true,
    reviews: true,
    chat: false,
    analytics: true
  }
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // UI Actions
      toggleSidebar: () => {
        set({ isSidebarOpen: !get().isSidebarOpen }, false, 'toggleSidebar')
      },
      
      openSidebar: () => {
        set({ isSidebarOpen: true }, false, 'openSidebar')
      },
      
      closeSidebar: () => {
        set({ isSidebarOpen: false }, false, 'closeSidebar')
      },
      
      toggleMobileMenu: () => {
        set({ isMobileMenuOpen: !get().isMobileMenuOpen }, false, 'toggleMobileMenu')
      },
      
      openMobileMenu: () => {
        set({ isMobileMenuOpen: true }, false, 'openMobileMenu')
      },
      
      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false }, false, 'closeMobileMenu')
      },
      
      toggleSearch: () => {
        set({ isSearchOpen: !get().isSearchOpen }, false, 'toggleSearch')
      },
      
      openSearch: () => {
        set({ isSearchOpen: true }, false, 'openSearch')
      },
      
      closeSearch: () => {
        set({ isSearchOpen: false }, false, 'closeSearch')
      },
      
      setLoading: (isLoading: boolean) => {
        set({ isLoading }, false, 'setLoading')
      },
      
      // Toast Actions
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString()
        const newToast: Toast = { ...toast, id }
        set({ toasts: [...get().toasts, newToast] }, false, 'addToast')
        
        // Auto remove toast after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, toast.duration || 4000)
        }
      },
      
      removeToast: (id: string) => {
        const toasts = get().toasts.filter(toast => toast.id !== id)
        set({ toasts }, false, 'removeToast')
      },
      
      clearToasts: () => {
        set({ toasts: [] }, false, 'clearToasts')
      },
      
      // Modal Actions
      openModal: (modal: Omit<Modal, 'id' | 'isOpen'>) => {
        const id = Date.now().toString()
        const newModal: Modal = { ...modal, id, isOpen: true }
        set({ modals: [...get().modals, newModal] }, false, 'openModal')
      },
      
      closeModal: (id: string) => {
        const modals = get().modals.filter(modal => modal.id !== id)
        set({ modals }, false, 'closeModal')
      },
      
      closeAllModals: () => {
        set({ modals: [] }, false, 'closeAllModals')
      },
      
      // Error Actions
      setGlobalError: (globalError: string | null) => {
        set({ globalError }, false, 'setGlobalError')
      },
      
      clearGlobalError: () => {
        set({ globalError: null }, false, 'clearGlobalError')
      },
      
      // Network Actions
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline }, false, 'setOnlineStatus')
      },
      
      // Feature Flag Actions
      setFeatureFlag: (flag: string, enabled: boolean) => {
        const featureFlags = { ...get().featureFlags, [flag]: enabled }
        set({ featureFlags }, false, 'setFeatureFlag')
      },
      
      getFeatureFlag: (flag: string) => {
        return get().featureFlags[flag] || false
      }
    }),
    {
      name: 'app-store'
    }
  )
)

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  const handleOnline = () => useAppStore.getState().setOnlineStatus(true)
  const handleOffline = () => useAppStore.getState().setOnlineStatus(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Set initial status
  useAppStore.getState().setOnlineStatus(navigator.onLine)
}
