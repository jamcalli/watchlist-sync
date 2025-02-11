import type { RootFolder, QualityProfile } from '@root/types/radarr.types'

export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent'

export interface RadarrInstanceData {
  rootFolders?: RootFolder[]
  qualityProfiles?: QualityProfile[]
  fetching?: boolean
}

export interface RadarrInstance {
  id: number
  name: string
  baseUrl: string
  apiKey: string
  qualityProfile?: string
  rootFolder?: string
  bypassIgnored: boolean
  tags: string[]
  isDefault: boolean
  syncedInstances?: number[]
  data?: RadarrInstanceData
}

export interface RadarrGenreRoute {
  id: number
  name: string
  radarrInstanceId: number
  genre: string
  rootFolder: string
}

export interface UseRadarrInstanceFormProps {
  instance: RadarrInstance
  instances: RadarrInstance[]
  isNew?: boolean
  isConnectionValid: boolean
}

export interface RadarrConnectionValues {
  baseUrl: string
  apiKey: string
  name: string
  qualityProfile?: string
  rootFolder?: string
}

export type ConnectionStatus = 'idle' | 'loading' | 'success' | 'error'

export interface GenreRoute {
  id?: number
  name: string
  genre: string
  radarrInstanceId: number
  rootFolder: string
}

export interface TempRoute {
  tempId: string
  name: string
  genre: string
  radarrInstanceId: number
  rootFolder: string
}
