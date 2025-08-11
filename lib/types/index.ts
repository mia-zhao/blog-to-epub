export const HOME_LIST_KEY = "home_list"

export const SAVED_ARTICLES_KEY = "saved_articles"

export interface Collection {
  info: { title: string; url: string }[]
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
