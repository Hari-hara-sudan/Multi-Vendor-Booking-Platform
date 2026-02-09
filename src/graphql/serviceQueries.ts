import { gql } from "@apollo/client";

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

export const GET_SERVICES = gql`
  query GetServices($filter: ServiceFilter, $sort: ServiceSort) {
    services(filter: $filter, sort: $sort) {
      id
      title
      price
      duration
      image
      rating
      reviews
      category {
        id
        name
      }
      vendor {
        id
        displayName
        city
        region
      }
    }
  }
`;

export const GET_SERVICE_BY_ID = gql`
  query GetServiceById($id: ID!) {
    service(id: $id) {
      id
      title
      description
      price
      duration
      image
      rating
      reviews
      category {
        id
        name
      }
      vendor {
        id
        displayName
        city
        region
      }
    }
  }
`;
