export const HOME_LIST_KEY = "home_list"

export const SAVED_ARTICLES_KEY = "saved_articles"

export const EPUB_SETTINGS_KEY = "epub_settings"

export interface Article {
  title: string
  url: string
}

export interface Collection {
  title?: string
  info: Article[]
}

export interface CollectionWithKey extends Collection {
  key: string
}

export enum PopupToContentMessage {
  ENTER_SELECT_MODE = "ENTER_SELECT_MODE",
  EXIT_SELECT_MODE = "EXIT_SELECT_MODE",
  GET_SELECT_MODE = "GET_SELECT_MODE"
}

export enum ContentSharedMessage {
  SHARE_SELECT_MODE = "SHARE_SELECT_MODE"
}

export enum ContentToBackgroundMessage {
  OPEN_OPTIONS = "OPEN_OPTIONS"
}
