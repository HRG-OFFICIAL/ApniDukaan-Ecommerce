import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
  subtotal: number
  tax: number
  shipping: number
  discount: number
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  calculateTotals: () => void
}

type CartStore = CartState & CartActions

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  discount: 0
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addItem: (item: Omit<CartItem, 'quantity'>) => {
        const state = get()
        const existingItem = state.items.find(i => i.productId === item.productId)
        
        let newItems: CartItem[]
        
        if (existingItem) {
          newItems = state.items.map(i =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
              : i
          )
        } else {
          newItems = [...state.items, { ...item, quantity: 1 }]
        }
        
        set({ items: newItems })
        get().calculateTotals()
      },
      
      removeItem: (productId: string) => {
        const state = get()
        const newItems = state.items.filter(item => item.productId !== productId)
        set({ items: newItems })
        get().calculateTotals()
      },
      
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        const state = get()
        const newItems = state.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.maxStock) }
            : item
        )
        
        set({ items: newItems })
        get().calculateTotals()
      },
      
      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0
        })
      },
      
      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },
      
      openCart: () => {
        set({ isOpen: true })
      },
      
      closeCart: () => {
        set({ isOpen: false })
      },
      
      calculateTotals: () => {
        const state = get()
        const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
        const tax = subtotal * 0.08 // 8% tax
        const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
        const total = subtotal + tax + shipping - state.discount
        
        set({
          subtotal,
          itemCount,
          tax,
          shipping,
          total
        })
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discount: state.discount
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.calculateTotals()
        }
      }
    }
  )
)
