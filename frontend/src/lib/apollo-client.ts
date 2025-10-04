import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// Load Apollo Client error messages for better debugging
// Only load in development to avoid build-time errors
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Dynamic import to avoid build-time errors
    import('@apollo/client/dev').then(({ loadErrorMessages, loadDevMessages }) => {
      loadDevMessages();
      loadErrorMessages();
    }).catch(() => {
      // Silently ignore errors during build
    });
  } catch (error) {
    // Silently ignore errors during build
  }
}

// HTTP link to GraphQL endpoint
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
});

// Auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  // Only access localStorage on the client side
  let token = null;
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }
  }
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Error link for handling GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle 401 errors by clearing auth token (only on client side)
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        } catch (error) {
          console.warn('Failed to clear auth tokens:', error);
        }
      }
    }
  }
});

// Retry link for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true
  },
  attempts: {
    max: 3,
    retryIf: (error) => !!error
  }
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          keyArgs: ['filter', 'sort', 'search'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        },
        orders: {
          keyArgs: ['filter', 'sort'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    },
    Product: {
      fields: {
        reviews: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    },
    User: {
      fields: {
        orders: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    }
  }
});

// Create Apollo Client
const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: false,
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: false,
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  // Fix for SSR fetch policy issues
  ssrMode: typeof window === 'undefined',
  assumeImmutableResults: true,
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },
});

export default apolloClient;
