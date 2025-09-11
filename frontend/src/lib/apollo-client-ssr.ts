import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

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
