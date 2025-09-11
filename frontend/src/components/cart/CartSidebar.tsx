'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '../../utils/format'
import { Button } from '../ui/Button'

export default function CartSidebar() {
  const { 
    isOpen, 
    items, 
    total, 
    subtotal,
    tax,
    shipping,
    discount,
    itemCount, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCartStore()

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={closeCart}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>

                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                        Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                      </Dialog.Title>
                    </div>

                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                          <p className="text-gray-500 text-center mb-6">Add some products to get started!</p>
                          <Link
                            href="/products"
                            onClick={closeCart}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                          >
                            Continue Shopping
                          </Link>
                        </div>
                      ) : (
                        <>
                          {/* Cart Items */}
                          <div className="flow-root">
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {items.map((item) => (
                                <li key={item.id} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      width={96}
                                      height={96}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                        <Link href={`/products/${item.productId}`} onClick={closeCart}>
                                            {item.name}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">{formatCurrency(item.price)}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                                          disabled={item.quantity <= 1}
                                        >
                                          <Minus className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <span className="text-gray-500 min-w-[2rem] text-center font-medium">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                                          disabled={item.quantity >= item.maxStock}
                                        >
                                          <Plus className="h-4 w-4 text-gray-600" />
                                        </button>
                                      </div>

                                      <div className="flex">
                                        <button
                                          type="button"
                                          onClick={() => removeItem(item.productId)}
                                          className="font-medium text-red-600 hover:text-red-500 transition-colors"
                                          title="Remove item"
                                        >
                                          <Trash2 className="h-5 w-5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Cart Footer */}
                          <div className="border-t border-gray-200 px-4 py-6 sm:px-6 mt-6">
                            {/* Price Breakdown */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-gray-600">
                                <p>Subtotal</p>
                                <p>{formatCurrency(subtotal)}</p>
                              </div>
                              
                              {shipping > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <p>Shipping</p>
                                  <p>{formatCurrency(shipping)}</p>
                                </div>
                              )}
                              
                              {tax > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                  <p>Tax</p>
                                  <p>{formatCurrency(tax)}</p>
                                </div>
                              )}
                              
                              {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <p>Discount</p>
                                  <p>-{formatCurrency(discount)}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="border-t border-gray-200 mt-4 pt-4">
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>Total</p>
                                <p>{formatCurrency(total)}</p>
                              </div>
                            </div>
                            
                            {shipping === 0 && subtotal > 0 && subtotal < 50 && (
                              <p className="mt-2 text-sm text-blue-600">
                                Add {formatCurrency(50 - subtotal)} more for free shipping!
                              </p>
                            )}
                            
                            {items.length > 1 && (
                              <Button
                                variant="ghost"
                                onClick={clearCart}
                                className="mt-4 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                size="sm"
                              >
                                Clear Cart
                              </Button>
                            )}
                            
                            <div className="mt-6">
                              <Button
                                href="/checkout"
                                onClick={closeCart}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                              >
                                Proceed to Checkout
                              </Button>
                            </div>
                            
                            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                              <p>
                                or{' '}
                                <button
                                  type="button"
                                  className="font-medium text-blue-600 hover:text-blue-500"
                                  onClick={closeCart}
                                >
                                  Continue Shopping
                                  <span aria-hidden="true"> &rarr;</span>
                                </button>
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
