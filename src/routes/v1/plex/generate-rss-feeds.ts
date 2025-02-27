import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { rssFeedsSchema } from '@schemas/plex/generate-rss-feeds.schema.js'

export const generateRssFeedsRoute: FastifyPluginAsyncZod = async (
  fastify,
  _opts,
) => {
  fastify.route({
    method: 'GET',
    url: '/generate-rss-feeds',
    schema: rssFeedsSchema,
    handler: async (_request, reply) => {
      try {
        const response = await fastify.plexWatchlist.generateAndSaveRssFeeds()
        return reply.send(response)
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({ error: 'Unable to fetch watchlist URLs' })
      }
    },
  })
}
