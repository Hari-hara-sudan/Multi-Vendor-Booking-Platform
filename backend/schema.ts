export const typeDefs = /* GraphQL */ `
  type Category {
    id: ID!
    name: String!
  }

  type Vendor {
    id: ID!
    displayName: String!
    city: String!
    region: String!
  }

  type Service {
    id: ID!
    title: String!
    description: String!
    price: Float!           # dollars
    duration: String!       # "45 min" / "3 hrs"
    category: Category!
    vendor: Vendor!
    image: String
    rating: Float!          # avg rating
    reviews: Int!           # number of reviews
  }

  input ServiceFilter {
    search: String
    categoryId: ID
    minPrice: Float
    maxPrice: Float
    minRating: Float
  }

  enum ServiceSort {
    RELEVANCE
    PRICE_ASC
    PRICE_DESC
    RATING_DESC
  }

  type Query {
    categories: [Category!]!
    services(filter: ServiceFilter, sort: ServiceSort = RELEVANCE): [Service!]!
    service(id: ID!): Service
  }
`;
