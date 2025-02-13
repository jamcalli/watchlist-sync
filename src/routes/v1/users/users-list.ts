import type { FastifyPluginAsync } from 'fastify'
import type { z } from 'zod'
import {
  UserListResponseSchema,
  UserListWithCountsResponseSchema,
  UserErrorSchema,
} from '@schemas/users/users-list.schema.js'

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply:
      | z.infer<typeof UserListResponseSchema>
      | z.infer<typeof UserErrorSchema>
  }>(
    '/users/list',
    {
      schema: {
        response: {
          200: UserListResponseSchema,
          500: UserErrorSchema,
        },
        tags: ['Users'],
      },
    },
    async (_, reply) => {
      try {
        const dbUsers = await fastify.db.getAllUsers()

        // Transform the users to match the schema exactly
        const users = dbUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          alias: user.alias,
          discord_id: user.discord_id,
          notify_email: user.notify_email,
          notify_discord: user.notify_discord,
          can_sync: user.can_sync,
          created_at: user.created_at ?? new Date().toISOString(),
          updated_at: user.updated_at ?? new Date().toISOString(),
        }))

        const response: z.infer<typeof UserListResponseSchema> = {
          success: true,
          message: 'Users retrieved successfully',
          users,
        }

        reply.status(200)
        return response
      } catch (err) {
        if (err instanceof Error && 'statusCode' in err) {
          throw err
        }

        fastify.log.error('Error retrieving users:', err)
        throw reply.internalServerError('Unable to retrieve users')
      }
    },
  )

  fastify.get<{
    Reply:
      | z.infer<typeof UserListWithCountsResponseSchema>
      | z.infer<typeof UserErrorSchema>
  }>(
    '/users/list/with-counts',
    {
      schema: {
        response: {
          200: UserListWithCountsResponseSchema,
          500: UserErrorSchema,
        },
        tags: ['Users'],
      },
    },
    async (_, reply) => {
      try {
        const dbUsers = await fastify.db.getUsersWithWatchlistCount()

        const users = dbUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          alias: user.alias,
          discord_id: user.discord_id,
          notify_email: user.notify_email,
          notify_discord: user.notify_discord,
          can_sync: user.can_sync,
          created_at: user.created_at ?? new Date().toISOString(),
          updated_at: user.updated_at ?? new Date().toISOString(),
          watchlist_count: user.watchlist_count,
        }))

        const response: z.infer<typeof UserListWithCountsResponseSchema> = {
          success: true,
          message: 'Users with watchlist counts retrieved successfully',
          users,
        }

        reply.status(200)
        return response
      } catch (err) {
        if (err instanceof Error && 'statusCode' in err) {
          throw err
        }

        fastify.log.error('Error retrieving users with counts:', err)
        throw reply.internalServerError('Unable to retrieve users with counts')
      }
    },
  )
}

export default plugin
