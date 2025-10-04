export const translations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No'
    },
    navigation: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      deals: 'Deals',
      newArrivals: 'New Arrivals',
      cart: 'Cart',
      wishlist: 'Wishlist',
      orders: 'Orders',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help',
      contact: 'Contact'
    },
    product: {
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove from Wishlist',
      share: 'Share',
      reviews: 'Reviews',
      description: 'Description',
      specifications: 'Specifications',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      price: 'Price',
      originalPrice: 'Original Price',
      discount: 'Discount',
      freeShipping: 'Free Shipping',
      estimatedDelivery: 'Estimated Delivery'
    },
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      total: 'Total',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      checkout: 'Checkout',
      continueShopping: 'Continue Shopping',
      removeItem: 'Remove Item',
      updateQuantity: 'Update Quantity'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      name: 'Name',
      phone: 'Phone',
      rememberMe: 'Remember Me',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginWithGoogle: 'Login with Google',
      loginWithFacebook: 'Login with Facebook'
    }
  },
  hi: {
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      add: 'जोड़ें',
      search: 'खोजें',
      filter: 'फिल्टर',
      sort: 'क्रमबद्ध करें',
      view: 'देखें',
      close: 'बंद करें',
      back: 'वापस',
      next: 'अगला',
      previous: 'पिछला',
      submit: 'जमा करें',
      confirm: 'पुष्टि करें',
      yes: 'हाँ',
      no: 'नहीं'
    },
    navigation: {
      home: 'होम',
      products: 'उत्पाद',
      categories: 'श्रेणियां',
      deals: 'डील्स',
      newArrivals: 'नए आगमन',
      cart: 'कार्ट',
      wishlist: 'विशलिस्ट',
      orders: 'ऑर्डर',
      profile: 'प्रोफाइल',
      settings: 'सेटिंग्स',
      help: 'मदद',
      contact: 'संपर्क'
    },
    product: {
      addToCart: 'कार्ट में जोड़ें',
      buyNow: 'अभी खरीदें',
      addToWishlist: 'विशलिस्ट में जोड़ें',
      removeFromWishlist: 'विशलिस्ट से हटाएं',
      share: 'साझा करें',
      reviews: 'समीक्षाएं',
      description: 'विवरण',
      specifications: 'विनिर्देश',
      inStock: 'स्टॉक में',
      outOfStock: 'स्टॉक खत्म',
      price: 'कीमत',
      originalPrice: 'मूल कीमत',
      discount: 'छूट',
      freeShipping: 'मुफ्त शिपिंग',
      estimatedDelivery: 'अनुमानित डिलीवरी'
    },
    cart: {
      title: 'शॉपिंग कार्ट',
      empty: 'आपका कार्ट खाली है',
      total: 'कुल',
      subtotal: 'उप-योग',
      shipping: 'शिपिंग',
      tax: 'कर',
      checkout: 'चेकआउट',
      continueShopping: 'खरीदारी जारी रखें',
      removeItem: 'आइटम हटाएं',
      updateQuantity: 'मात्रा अपडेट करें'
    },
    auth: {
      login: 'लॉगिन',
      register: 'रजिस्टर',
      logout: 'लॉगआउट',
      email: 'ईमेल',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      forgotPassword: 'पासवर्ड भूल गए?',
      resetPassword: 'पासवर्ड रीसेट करें',
      name: 'नाम',
      phone: 'फोन',
      rememberMe: 'मुझे याद रखें',
      alreadyHaveAccount: 'पहले से खाता है?',
      dontHaveAccount: 'खाता नहीं है?',
      loginWithGoogle: 'Google से लॉगिन करें',
      loginWithFacebook: 'Facebook से लॉगिन करें'
    }
  }
}

export type Language = 'en' | 'hi'
export type TranslationKey = keyof typeof translations.en

export function getTranslation(key: string, language: Language = 'en'): string {
  const keys = key.split('.')
  let translation: any = translations[language]
  
  for (const k of keys) {
    if (translation && typeof translation === 'object' && k in translation) {
      translation = translation[k]
    } else {
      // Fallback to English
      translation = translations.en
      for (const fallbackKey of keys) {
        if (translation && typeof translation === 'object' && fallbackKey in translation) {
          translation = translation[fallbackKey]
        } else {
          return key // Return key if translation not found
        }
      }
      break
    }
  }
  
  return typeof translation === 'string' ? translation : key
}

export function useTranslation(language: Language = 'en') {
  return {
    t: (key: string) => getTranslation(key, language),
    language
  }
}
