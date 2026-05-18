import { atom } from 'nanostores'

export interface SearchResult {
  filePath: string
  line: number
  column: number
  lineContent: string
  matchLength: number
}

export const $searchQuery = atom('')
export const $searchResults = atom<SearchResult[]>([])
export const $isSearching = atom(false)
export const $replaceText = atom('')
export const $showSearch = atom(false)
