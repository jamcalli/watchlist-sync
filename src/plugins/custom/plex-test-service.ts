import type {
  FastifyPluginCallback,
  FastifyInstance,
  FastifyBaseLogger,
} from 'fastify'
import fp from 'fastify-plugin'
import type {
  TemptRssWatchlistItem,
  RssWatchlistResults,
  WatchlistItem,
} from '@root/types/plex.types.js'

class PlexTestingWorkflow {
  private rssCheckInterval: NodeJS.Timeout | null = null
  private queueCheckInterval: NodeJS.Timeout | null = null
  private lastQueueItemTime: number = Date.now()
  private changeQueue: Set<TemptRssWatchlistItem> = new Set()
  private previousSelfItems: Map<string, WatchlistItem> = new Map()
  private previousFriendsItems: Map<string, WatchlistItem> = new Map()
  private isRefreshing = false

  constructor(
    private readonly plexService: FastifyInstance['plexWatchlist'],
    private readonly log: FastifyBaseLogger,
  ) {}

  async startWorkflow() {
    this.log.info('Starting Plex testing workflow')

    try {
      // Verify connection
      await this.plexService.pingPlex()
      this.log.info('Plex connection verified')

      // Initial watchlist fetch
      await this.fetchWatchlists()

      // Initial RSS setup
      const rssFeeds = await this.plexService.generateAndSaveRssFeeds()
      if ('error' in rssFeeds) {
        throw new Error(`Failed to generate RSS feeds: ${rssFeeds.error}`)
      }

      // Initialize RSS snapshots
      await this.initializeRssSnapshots()

      // Start monitoring
      this.startRssCheck()
      this.startQueueProcessor()

      this.log.info('Plex testing workflow running')
    } catch (error) {
      this.log.error('Error in Plex testing workflow:', error)
    }
  }

  private async fetchWatchlists() {
    this.log.info('Refreshing watchlists')
    try {
      await Promise.all([
        this.plexService.getSelfWatchlist(),
        this.plexService.getOthersWatchlists(),
      ])
      this.log.info('Watchlists refreshed successfully')
    } catch (error) {
      this.log.error('Error refreshing watchlists:', error)
      throw error
    }
  }

  private async initializeRssSnapshots() {
    this.log.info('Initializing RSS snapshots')
    const results = await this.plexService.processRssWatchlists()

    // Initialize self items snapshot
    if (results.self.users[0]?.watchlist) {
      this.previousSelfItems = this.createItemMap(
        results.self.users[0].watchlist,
      )
      this.log.info('Initialized self RSS snapshot', {
        itemCount: this.previousSelfItems.size,
      })
    }

    // Initialize friends items snapshot
    if (results.friends.users[0]?.watchlist) {
      this.previousFriendsItems = this.createItemMap(
        results.friends.users[0].watchlist,
      )
      this.log.info('Initialized friends RSS snapshot', {
        itemCount: this.previousFriendsItems.size,
      })
    }
  }

  private createItemMap(items: WatchlistItem[]): Map<string, WatchlistItem> {
    const itemMap = new Map<string, WatchlistItem>()

    for (const item of items) {
      if (item.guids && item.guids.length > 0) {
        itemMap.set(item.guids[0], item)
      }
    }

    return itemMap
  }

  private startRssCheck() {
    if (this.rssCheckInterval) {
      clearInterval(this.rssCheckInterval)
    }

    this.rssCheckInterval = setInterval(async () => {
      try {
        const results = await this.plexService.processRssWatchlists()
        await this.processRssResults(results)
      } catch (error) {
        this.log.error('Error checking RSS feeds:', error)
      }
    }, 10000) // Check every 10 seconds
  }

  private async processRssResults(results: RssWatchlistResults) {
    // Process self watchlist changes
    if (results.self.users[0]?.watchlist) {
      const currentItems = this.createItemMap(results.self.users[0].watchlist)
      const changes = this.detectChanges(this.previousSelfItems, currentItems)

      if (changes.size > 0) {
        await this.addToQueue(changes, 'self')
      }

      this.previousSelfItems = currentItems
    }

    // Process friends watchlist changes
    if (results.friends.users[0]?.watchlist) {
      const currentItems = this.createItemMap(
        results.friends.users[0].watchlist,
      )
      const changes = this.detectChanges(
        this.previousFriendsItems,
        currentItems,
      )

      if (changes.size > 0) {
        await this.addToQueue(changes, 'friends')
      }

      this.previousFriendsItems = currentItems
    }
  }

  private detectChanges(
    previousItems: Map<string, WatchlistItem>,
    currentItems: Map<string, WatchlistItem>,
  ): Set<TemptRssWatchlistItem> {
    const changes = new Set<TemptRssWatchlistItem>()

    // Check for new or modified items
    currentItems.forEach((currentItem, guid) => {
      const previousItem = previousItems.get(guid)

      if (!previousItem) {
        // New item
        this.log.debug('New item detected', { guid, title: currentItem.title })
        changes.add(this.convertToTempItem(currentItem))
      } else {
        // Check if item has changed
        const hasChanged =
          previousItem.title !== currentItem.title ||
          previousItem.type !== currentItem.type ||
          previousItem.thumb !== currentItem.thumb ||
          JSON.stringify(previousItem.genres) !==
            JSON.stringify(currentItem.genres)

        if (hasChanged) {
          this.log.debug('Modified item detected', {
            guid,
            title: currentItem.title,
            changes: {
              title: previousItem.title !== currentItem.title,
              type: previousItem.type !== currentItem.type,
              thumb: previousItem.thumb !== currentItem.thumb,
              genres:
                JSON.stringify(previousItem.genres) !==
                JSON.stringify(currentItem.genres),
            },
          })
          changes.add(this.convertToTempItem(currentItem))
        }
      }
    })

    // Log removed items
    previousItems.forEach((item, guid) => {
      if (!currentItems.has(guid)) {
        this.log.debug('Removed item detected', { guid, title: item.title })
      }
    })

    if (changes.size > 0) {
      this.log.info('Detected RSS feed changes', {
        changedItemsCount: changes.size,
        previousItemsCount: previousItems.size,
        currentItemsCount: currentItems.size,
      })
    }

    return changes
  }

  private convertToTempItem(item: WatchlistItem): TemptRssWatchlistItem {
    return {
      title: item.title,
      type: item.type,
      thumb: item.thumb,
      guids: item.guids,
      genres: item.genres,
      key: item.plexKey,
    }
  }

  private async addToQueue(
    items: Set<TemptRssWatchlistItem>,
    source: 'self' | 'friends',
  ) {
    let hasNewItems = false

    for (const item of items) {
      if (!this.changeQueue.has(item)) {
        this.changeQueue.add(item)
        hasNewItems = true
      }
    }

    if (hasNewItems) {
      this.lastQueueItemTime = Date.now()
      this.log.info(
        `Added ${items.size} changed items to queue from ${source} RSS feed`,
      )

      try {
        await this.plexService.storeRssWatchlistItems(items, source)
        this.log.info(`Stored ${items.size} changed ${source} RSS items`)
      } catch (error) {
        this.log.error(`Error storing ${source} RSS items:`, error)
      }
    }
  }

  private startQueueProcessor() {
    if (this.queueCheckInterval) {
      clearInterval(this.queueCheckInterval)
    }

    this.queueCheckInterval = setInterval(async () => {
      if (this.isRefreshing) {
        return
      }

      const timeSinceLastItem = Date.now() - this.lastQueueItemTime

      if (timeSinceLastItem >= 60000 && this.changeQueue.size > 0) {
        this.isRefreshing = true
        try {
          this.log.info('One minute since last new item, refreshing watchlists')
          this.changeQueue.clear()
          await this.fetchWatchlists()
          this.log.info('Watchlist refresh completed')
        } catch (error) {
          this.log.error('Error during watchlist refresh:', error)
        } finally {
          this.isRefreshing = false
        }
      }
    }, 10000) // Check every 10 seconds
  }

  async stop() {
    this.log.info('Stopping Plex testing workflow')

    if (this.rssCheckInterval) {
      clearInterval(this.rssCheckInterval)
      this.rssCheckInterval = null
    }

    if (this.queueCheckInterval) {
      clearInterval(this.queueCheckInterval)
      this.queueCheckInterval = null
    }

    this.changeQueue.clear()
  }
}

const plexTestingPlugin: FastifyPluginCallback = (fastify, opts, done) => {
  try {
    const workflow = new PlexTestingWorkflow(fastify.plexWatchlist, fastify.log)

    fastify.addHook('onClose', async () => {
      await workflow.stop()
    })

    fastify.decorate('plexTestingWorkflow', workflow)

    setImmediate(() => {
      workflow.startWorkflow().catch((err) => {
        fastify.log.error('Error in background workflow:', err)
      })
    })

    done()
  } catch (err) {
    done(err as Error)
  }
}

export default fp(plexTestingPlugin, {
  name: 'plex-testing-plugin',
  dependencies: ['plex-watchlist'],
})
