// Utility to reset theme to light mode
export function resetThemeToLight() {
  if (typeof window !== 'undefined') {
    try {
      // Only reset if no theme is set
      const currentTheme = localStorage.getItem('theme');
      if (!currentTheme) {
        // Force light mode
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        
        // Set a new light theme preference
        localStorage.setItem('theme', 'light');
        
        console.log('Theme set to light mode (first time)');
      }
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }
}
