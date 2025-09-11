import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Load Apollo Client error messages for better debugging during SSR
// Only load in development and skip during build process
if (process.env.NODE_ENV === 'development' && !process.env.BUILD_TIME) {
  try {
    const { loadErrorMessages, loadDevMessages } = require('@apollo/client/dev');
    loadDevMessages();
    loadErrorMessages();
  } catch (error) {
    // Silently ignore errors during build
  }
}

// SSR-safe Apollo Client for server-side rendering
export function createSSRApolloClient() {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  });

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

  return new ApolloClient({
    link: httpLink,
    cache,
    ssrMode: true,
    defaultOptions: {
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  });
}
