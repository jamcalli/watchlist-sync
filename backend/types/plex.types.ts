export interface PlexResponse {
  MediaContainer: {
    Metadata: Array<{
      title: string;
      key: string;
      type: string;
      Guid?: Array<{ id: string }>;
      Genre?: Array<{ tag: string }>;
    }>;
    totalSize: number;
  };
}

export interface Friend {
  watchlistId: string;
  username: string;
}

export interface Item {
  title: string;
  key: string;
  type: string;
  guids?: string[];
  genres?: string[];
  user?: string;
}

export interface TokenWatchlistItem extends Item {
  id: string;
}

export interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    field?: string;
    context?: Array<{
      arg?: string;
      value?: string;
    }>;
  };
}

export interface TokenWatchlistFriend {
  data?: {
    user?: {
      watchlist: {
        nodes: TokenWatchlistItem[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };
  errors?: GraphQLError[];
}

export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
}

export interface RssFeedGenerated {
  RSSInfo: {
    [0]: {
      url: string;
    };
  };
}