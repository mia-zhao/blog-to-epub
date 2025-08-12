import { Storage } from "@plasmohq/storage"

import {
  HOME_LIST_KEY,
  SAVED_ARTICLES_KEY,
  type Article,
  type Collection
} from "~/lib/types"

const storage = new Storage({ area: "local" })

interface CollectionMap {
  [key: string]: Collection
}

const STORAGE_KEYS = {
  HOME_LIST: HOME_LIST_KEY,
  SAVED_ARTICLES: SAVED_ARTICLES_KEY
} as const

export const storageService = {
  getCollection: async (key: string): Promise<Collection | null> => {
    return (await storage.get<Collection>(key)) || null
  },

  saveCollection: async (
    key: string,
    collection: Collection
  ): Promise<void> => {
    if (collection.info.length === 0) {
      await storage.remove(key)
    } else {
      await storage.set(key, collection)
    }
  },

  getHomeList: async (): Promise<string[]> => {
    return (await storage.get<string[]>(STORAGE_KEYS.HOME_LIST)) || []
  },

  addToHomeList: async (url: string): Promise<void> => {
    const homeList = await storageService.getHomeList()
    if (!homeList.includes(url)) {
      homeList.push(url)
      await storage.set(STORAGE_KEYS.HOME_LIST, homeList)
    }
  },

  getSavedCollection: async (): Promise<Collection | null> => {
    return (await storage.get<Collection>(STORAGE_KEYS.SAVED_ARTICLES)) || null
  },

  saveForLater: async (collection: Collection): Promise<void> => {
    const savedCollection = await storageService.getSavedCollection()
    const articlesToSave = new Set<Article>([
      ...(savedCollection?.info || []),
      ...collection.info
    ])
    await storageService.saveCollection(STORAGE_KEYS.SAVED_ARTICLES, {
      title: "Saved Articles",
      info: [...articlesToSave]
    })
  },

  getAllCollections: async (): Promise<CollectionMap> => {
    const collections: CollectionMap = {}

    try {
      const homeList = (await storage.get<string[]>(HOME_LIST_KEY)) || []
      const savedCollection =
        (await storage.get<Collection>(SAVED_ARTICLES_KEY)) || null

      for (const url of homeList) {
        try {
          const collection = await storage.get<Collection>(url)
          if (!isEmptyCollection(collection)) {
            collections[url] = collection
          }
        } catch (error) {
          console.error("Error loading collection:", error)
        }
      }

      if (!isEmptyCollection(savedCollection)) {
        collections[SAVED_ARTICLES_KEY] = savedCollection
      }

      return collections
    } catch (error) {
      console.error("Error loading collections:", error)
      return {}
    }
  }
}

function isEmptyCollection(collection: Collection | null): boolean {
  return !collection || !collection.info || collection.info.length === 0
}
