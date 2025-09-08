'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity?: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  total: number
}

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setIsOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    items: [],
    isOpen: false,
    itemCount: 0,
    total: 0
  })

  // Load persisted cart only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const persistedCart = localStorage.getItem('cart-storage')
        if (persistedCart) {
          const parsedCart = JSON.parse(persistedCart)
          setState(prev => ({ ...prev, ...parsedCart }))
        }
      } catch (error) {
        console.error('Error loading persisted cart:', error)
      }
    }
  }, [])

  // Persist cart changes only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cart-storage', JSON.stringify({
          items: state.items,
          itemCount: state.itemCount,
          total: state.total
        }))
      } catch (error) {
        console.error('Error persisting cart:', error)
      }
    }
  }, [state.items, state.itemCount, state.total])

  // Update derived values when items change
  useEffect(() => {
    const itemCount = state.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    const total = state.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
    
    setState(prev => ({ ...prev, itemCount, total }))
  }, [state.items])

  const addItem = (newItem: CartItem) => {
    setState(prev => {
      const existingItem = prev.items.find(item => item.id === newItem.id)
      
      if (existingItem) {
        // Update quantity of existing item
        const updatedItems = prev.items.map(item =>
          item.id === newItem.id 
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        )
        return { ...prev, items: updatedItems }
      } else {
        // Add new item
        return { ...prev, items: [...prev.items, { ...newItem, quantity: 1 }] }
      }
    })
  }

  const removeItem = (itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    
    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }))
  }

  const clearCart = () => {
    setState(prev => ({ ...prev, items: [] }))
  }

  const toggleCart = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }

  const setIsOpen = (isOpen: boolean) => {
    setState(prev => ({ ...prev, isOpen }))
  }

  return (
    <CartContext.Provider value={{ 
      ...state, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      toggleCart, 
      setIsOpen 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// For backward compatibility, create a hook that matches the old store interface
export function useCartStore() {
  return useCart()
}
