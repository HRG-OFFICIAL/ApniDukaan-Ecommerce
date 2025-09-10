'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '../../contexts/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '../../utils/format'

export default function CartSidebar() {
  const { isOpen, items, total, itemCount, toggleCart, updateQuantity, removeItem, clearCart } = useCartStore()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={toggleCart}>
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
                        onClick={toggleCart}
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
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                          <p className="text-gray-500 text-center mb-6">Add some products to get started!</p>
                          <Link
                            href="/products"
                            onClick={toggleCart}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
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
                                          <Link href={`/products/${item.productId}`} onClick={toggleCart}>
                                            {item.name}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">{formatCurrency(item.price)}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                          disabled={(item.quantity || 1) <= 1}
                                        >
                                          <Minus className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <span className="text-gray-500 min-w-[2rem] text-center">
                                          {item.quantity || 1}
                                        </span>
                                        <button
                                          onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                          disabled={(item.quantity || 1) >= item.maxStock}
                                        >
                                          <Plus className="h-4 w-4 text-gray-600" />
                                        </button>
                                      </div>

                                      <div className="flex">
                                        <button
                                          type="button"
                                          onClick={() => removeItem(item.id)}
                                          className="font-medium text-red-600 hover:text-red-500 transition-colors"
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
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <p>Subtotal</p>
                              <p>{formatCurrency(total)}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                            
                            {items.length > 1 && (
                              <button
                                onClick={clearCart}
                                className="mt-4 w-full text-center text-sm text-red-600 hover:text-red-500 font-medium"
                              >
                                Clear Cart
                              </button>
                            )}
                            
                            <div className="mt-6">
                              <Link
                                href="/checkout"
                                onClick={toggleCart}
                                className="flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 transition-colors w-full"
                              >
                                Checkout
                              </Link>
                            </div>
                            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                              <p>
                                or{' '}
                                <button
                                  type="button"
                                  className="font-medium text-primary-600 hover:text-primary-500"
                                  onClick={toggleCart}
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
