import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja'

interface NotificationSettings {
  orderUpdates: boolean
  promotions: boolean
  newsletter: boolean
  stockAlerts: boolean
  priceDrops: boolean
}

interface PreferencesState {
  theme: Theme
  currency: Currency
  language: Language
  notifications: NotificationSettings
  recentlyViewed: string[]
  wishlist: string[]
  searchHistory: string[]
  viewMode: 'grid' | 'list'
  itemsPerPage: number
  autoSave: boolean
}

interface PreferencesActions {
  setTheme: (theme: Theme) => void
  setCurrency: (currency: Currency) => void
  setLanguage: (language: Language) => void
  updateNotifications: (notifications: Partial<NotificationSettings>) => void
  addToRecentlyViewed: (productId: string) => void
  removeFromRecentlyViewed: (productId: string) => void
  clearRecentlyViewed: () => void
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  addToSearchHistory: (query: string) => void
  removeFromSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  setViewMode: (viewMode: 'grid' | 'list') => void
  setItemsPerPage: (itemsPerPage: number) => void
  setAutoSave: (autoSave: boolean) => void
  resetPreferences: () => void
}

type PreferencesStore = PreferencesState & PreferencesActions

const initialNotifications: NotificationSettings = {
  orderUpdates: true,
  promotions: true,
  newsletter: false,
  stockAlerts: true,
  priceDrops: true
}

const initialState: PreferencesState = {
  theme: 'light',
  currency: 'USD',
  language: 'en',
  notifications: initialNotifications,
  recentlyViewed: [],
  wishlist: [],
  searchHistory: [],
  viewMode: 'grid',
  itemsPerPage: 12,
  autoSave: true
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTheme: (theme: Theme) => {
        set({ theme })
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          
          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // System theme
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', isDark)
          }
        }
      },
      
      setCurrency: (currency: Currency) => {
        set({ currency })
      },
      
      setLanguage: (language: Language) => {
        set({ language })
      },
      
      updateNotifications: (notifications: Partial<NotificationSettings>) => {
        const currentNotifications = get().notifications
        set({ 
          notifications: { ...currentNotifications, ...notifications }
        })
      },
      
      addToRecentlyViewed: (productId: string) => {
        const recentlyViewed = get().recentlyViewed
        const filtered = recentlyViewed.filter(id => id !== productId)
        const updated = [productId, ...filtered].slice(0, 20) // Keep last 20 items
        set({ recentlyViewed: updated })
      },
      
      removeFromRecentlyViewed: (productId: string) => {
        const recentlyViewed = get().recentlyViewed
        set({ recentlyViewed: recentlyViewed.filter(id => id !== productId) })
      },
      
      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] })
      },
      
      addToWishlist: (productId: string) => {
        const wishlist = get().wishlist
        if (!wishlist.includes(productId)) {
          set({ wishlist: [...wishlist, productId] })
        }
      },
      
      removeFromWishlist: (productId: string) => {
        const wishlist = get().wishlist
        set({ wishlist: wishlist.filter(id => id !== productId) })
      },
      
      isInWishlist: (productId: string) => {
        const wishlist = get().wishlist
        return wishlist.includes(productId)
      },
      
      clearWishlist: () => {
        set({ wishlist: [] })
      },
      
      addToSearchHistory: (query: string) => {
        if (!query.trim()) return
        
        const searchHistory = get().searchHistory
        const filtered = searchHistory.filter(q => q !== query)
        const updated = [query, ...filtered].slice(0, 10) // Keep last 10 searches
        set({ searchHistory: updated })
      },
      
      removeFromSearchHistory: (query: string) => {
        const searchHistory = get().searchHistory
        set({ searchHistory: searchHistory.filter(q => q !== query) })
      },
      
      clearSearchHistory: () => {
        set({ searchHistory: [] })
      },
      
      setViewMode: (viewMode: 'grid' | 'list') => {
        set({ viewMode })
      },
      
      setItemsPerPage: (itemsPerPage: number) => {
        set({ itemsPerPage })
      },
      
      setAutoSave: (autoSave: boolean) => {
        set({ autoSave })
      },
      
      resetPreferences: () => {
        set(initialState)
      }
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
        language: state.language,
        notifications: state.notifications,
        recentlyViewed: state.recentlyViewed.slice(0, 10), // Persist only 10 recent items
        wishlist: state.wishlist,
        searchHistory: state.searchHistory.slice(0, 5), // Persist only 5 recent searches
        viewMode: state.viewMode,
        itemsPerPage: state.itemsPerPage,
        autoSave: state.autoSave
      })
    }
  )
)

// Apply theme on store initialization
if (typeof window !== 'undefined') {
  const store = usePreferencesStore.getState()
  store.setTheme(store.theme)
}
