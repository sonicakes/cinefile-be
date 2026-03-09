import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAvailabilityItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_availability_items';
  info: {
    displayName: 'Availability Item';
  };
  attributes: {
    location: Schema.Attribute.String;
    source: Schema.Attribute.Enumeration<
      [
        'YouTube',
        'Plane',
        'Plex',
        'Mubi',
        'Shudder',
        'SBS',
        'Tubi',
        'DVD',
        'Home',
        'TV',
      ]
    >;
  };
}

export interface SharedFavouriteMovies extends Struct.ComponentSchema {
  collectionName: 'components_shared_favourite_movies';
  info: {
    displayName: 'favourite_movies';
  };
  attributes: {
    title: Schema.Attribute.String;
    year: Schema.Attribute.String;
  };
}

export interface SharedFavouritePodcasts extends Struct.ComponentSchema {
  collectionName: 'components_shared_favourite_podcasts';
  info: {
    displayName: 'favourite_podcasts';
  };
  attributes: {
    link: Schema.Attribute.String;
    name: Schema.Attribute.String;
  };
}

export interface SharedNextMovie extends Struct.ComponentSchema {
  collectionName: 'components_shared_next_movies';
  info: {
    displayName: 'next_movie';
  };
  attributes: {
    movie: Schema.Attribute.Relation<'oneToOne', 'api::movie.movie'>;
  };
}

export interface SharedSpotifyEps extends Struct.ComponentSchema {
  collectionName: 'components_shared_spotify_eps';
  info: {
    displayName: 'spotify_eps';
  };
  attributes: {
    podcastName: Schema.Attribute.String;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.availability-item': SharedAvailabilityItem;
      'shared.favourite-movies': SharedFavouriteMovies;
      'shared.favourite-podcasts': SharedFavouritePodcasts;
      'shared.next-movie': SharedNextMovie;
      'shared.spotify-eps': SharedSpotifyEps;
    }
  }
}
