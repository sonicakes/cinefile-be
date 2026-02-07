import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAvailability extends Struct.ComponentSchema {
  collectionName: 'components_shared_availabilities';
  info: {
    displayName: 'availability';
  };
  attributes: {
    location: Schema.Attribute.String;
    medium: Schema.Attribute.Enumeration<
      [
        'YouTube',
        'Shudder',
        'Home Collection',
        'Mubi',
        'Tubi',
        'SBS',
        'Cinema',
        'Plex',
      ]
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.availability': SharedAvailability;
    }
  }
}
