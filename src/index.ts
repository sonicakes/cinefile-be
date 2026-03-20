import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS = [
  'api::movie.movie.find',
  'api::movie.movie.findOne',
  'api::post.post.find',
  'api::post.post.findOne',
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    for (const action of PUBLIC_ACTIONS) {
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: publicRole.id } });

      if (existing && !existing.enabled) {
        await strapi
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
        strapi.log.info(`[bootstrap] Enabled public permission: ${action}`);
      } else if (!existing) {
        await strapi
          .query('plugin::users-permissions.permission')
          .create({ data: { action, enabled: true, role: publicRole.id } });
        strapi.log.info(`[bootstrap] Created public permission: ${action}`);
      }
    }
  },
};
