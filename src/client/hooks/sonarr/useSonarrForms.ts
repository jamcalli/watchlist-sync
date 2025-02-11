import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { 
  SonarrMonitoringType,
  UseSonarrInstanceFormProps
} from '@/types/sonarr/types'
import { 
  initialInstanceSchema, 
  fullInstanceSchema,
  SonarrInstanceSchema
} from '@/types/sonarr/schemas'
import { API_KEY_PLACEHOLDER } from '@/types/sonarr/constants'

export function useSonarrInstanceForm({ 
  instance, 
  instances, 
  isNew = false,
  isConnectionValid 
}: UseSonarrInstanceFormProps) {
  const form = useForm<SonarrInstanceSchema>({
    resolver: zodResolver(isNew ? initialInstanceSchema : fullInstanceSchema),
    defaultValues: {
      name: instance.name,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      qualityProfile: instance.qualityProfile || '',
      rootFolder: instance.rootFolder || '',
      bypassIgnored: instance.bypassIgnored,
      seasonMonitoring: instance.seasonMonitoring as SonarrMonitoringType,
      tags: instance.tags,
      isDefault: isNew 
        ? instances.length === 1 && instances[0].apiKey === API_KEY_PLACEHOLDER
        : instance.isDefault,
      syncedInstances: instance.syncedInstances || [],
    },
    mode: 'all',
  })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew) {
      form.trigger()
    }
  }, [form, isNew])

  useEffect(() => {
    form.reset({
      name: instance.name,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      qualityProfile: instance.qualityProfile || '',
      rootFolder: instance.rootFolder || '',
      bypassIgnored: instance.bypassIgnored,
      seasonMonitoring: instance.seasonMonitoring as SonarrMonitoringType,
      tags: instance.tags,
      isDefault: instance.isDefault,
      syncedInstances: instance.syncedInstances || [],
    })

    if (isConnectionValid) {
      const values = form.getValues()
      const hasPlaceholderValues =
        !values.qualityProfile ||
        !values.rootFolder ||
        values.qualityProfile === '' ||
        values.rootFolder === ''
      
      if (hasPlaceholderValues) {
        form.clearErrors()
        form.trigger(['qualityProfile', 'rootFolder'])
        form.setValue('qualityProfile', values.qualityProfile || '', {
          shouldTouch: true,
          shouldValidate: true,
        })
        form.setValue('rootFolder', values.rootFolder || '', {
          shouldTouch: true,
          shouldValidate: true,
        })
      }
    }
  }, [instance, form, isConnectionValid])

  useEffect(() => {
    if (isNew && cardRef.current) {
      cardRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [isNew])

  const handleConnectionValidationChange = useCallback(() => {
    if (isConnectionValid) {
      const values = form.getValues()
      form.clearErrors()
      form.trigger(['qualityProfile', 'rootFolder'])
      form.setValue('qualityProfile', values.qualityProfile || '', {
        shouldTouch: true,
        shouldValidate: true,
        shouldDirty: true
      })
      form.setValue('rootFolder', values.rootFolder || '', {
        shouldTouch: true,
        shouldValidate: true,
        shouldDirty: true
      })
    }
  }, [form, isConnectionValid, instance])

  const resetForm = useCallback((data?: SonarrInstanceSchema) => {
    if (data) {
      form.reset(data)
    } else {
      form.reset({
        name: instance.name,
        baseUrl: instance.baseUrl,
        apiKey: instance.apiKey,
        qualityProfile: instance.qualityProfile || '',
        rootFolder: instance.rootFolder || '',
        bypassIgnored: instance.bypassIgnored,
        seasonMonitoring: instance.seasonMonitoring as SonarrMonitoringType,
        tags: instance.tags,
        isDefault: instance.isDefault,
        syncedInstances: instance.syncedInstances || [],
      })
    }

    if (isConnectionValid && (!instance.qualityProfile || !instance.rootFolder)) {
      form.trigger(['qualityProfile', 'rootFolder'])
    }
  }, [form, instance, isConnectionValid])

  const setTitleValue = useCallback((title: string) => {
    form.setValue('name', title, { shouldDirty: true })
  }, [form])

  return {
    form,
    cardRef,
    resetForm,
    handleConnectionValidationChange,
    setTitleValue
  }
}