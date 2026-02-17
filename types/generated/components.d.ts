import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAvailabilityItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_availability_items';
  info: {
    displayName: 'Availability Item';
  };
  attributes: {
    location: Schema.Attribute.String;
    medium: Schema.Attribute.String;
  };
}

export interface SharedNextMovie extends Struct.ComponentSchema {
  collectionName: 'components_shared_next_movies';
  info: {
    displayName: 'next_movie';
  };
  attributes: {
    movie: Schema.Attribute.Relation<'oneToOne', 'api::movie.movie'>;
    reason: Schema.Attribute.Text;
    thumbnail_url: Schema.Attribute.String;
    title: Schema.Attribute.String;
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
      'shared.next-movie': SharedNextMovie;
      'shared.spotify-eps': SharedSpotifyEps;
    }
  }
}
