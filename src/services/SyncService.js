/**
 * Mictla Sync Service
 * Handles cross-device synchronization and conflict resolution
 */

import { storageManager } from './StorageManager.js'
import { validationService } from './ValidationService.js'
import { appState } from '../state/AppState.js'

export class SyncService {
  constructor() {
    this.syncInProgress = false
    this.conflictQueue = []
    this.syncQueue = []
    
    // Sync configuration
    this.config = {
      autoSyncInterval: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      batchSize: 10
    }
    
    // Auto-sync timer
    this.autoSyncTimer = null
    
    // Initialize sync service
    this.init()
  }

  init() {
    // Set up auto-sync if enabled
    this.setupAutoSync()
    
    // Listen for app state changes
    appState.subscribe('user.syncSettings.autoSync', (enabled) => {
      if (enabled) {
        this.startAutoSync()
      } else {
        this.stopAutoSync()
      }
    })
    
    // Listen for network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true))
      window.addEventListener('offline', () => this.handleNetworkChange(false))
    }
  }

  /**
   * Perform full synchronization
   * @returns {Promise<Object>} Sync result
   */
  async performFullSync() {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress')
    }
    
    try {
      this.syncInProgress = true
      appState.set('sync.status', 'syncing')
      
      const result = {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: []
      }
      
      // Step 1: Upload local changes
      const uploadResult = await this.uploadLocalChanges()
      result.uploaded = uploadResult.count
      result.errors.push(...uploadResult.errors)
      
      // Step 2: Download remote changes
      const downloadResult = await this.downloadRemoteChanges()
      result.downloaded = downloadResult.count
      result.errors.push(...downloadResult.errors)
      
      // Step 3: Resolve conflicts
      const conflictResult = await this.resolveConflicts()
      result.conflicts = conflictResult.count
      result.errors.push(...conflictResult.errors)
      
      // Update sync status
      appState.set('sync.lastSync', new Date())
      appState.set('sync.status', result.errors.length > 0 ? 'error' : 'idle')
      
      result.success = result.errors.length === 0
      return result
      
    } catch (error) {
      console.error('Full sync failed:', error)
      appState.set('sync.status', 'error')
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Upload local changes to remote
   * @returns {Promise<Object>} Upload result
   */
  async uploadLocalChanges() {
    const result = { count: 0, errors: [] }
    
    try {
      // Get all local changes
      const memorials = await storageManager.getMemorials()
      const pendingMemorials = memorials.filter(m => m.syncStatus === 'pending' || m.syncStatus === 'local')
      
      const familyGroups = await this.getAllFamilyGroups()
      const virtualOfferings = await storageManager.getVirtualOfferings()
      
      // Upload in batches
      const batches = this.createBatches([
        ...pendingMemorials.map(m => ({ type: 'memorial', data: m })),
        ...familyGroups.map(fg => ({ type: 'familyGroup', data: fg })),
        ...virtualOfferings.map(vo => ({ type: 'virtualOffering', data: vo }))
      ])
      
      for (const batch of batches) {
        try {
          await this.uploadBatch(batch)
          result.count += batch.length
        } catch (error) {
          result.errors.push(`Batch upload failed: ${error.message}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`Upload failed: ${error.message}`)
    }
    
    return result
  }

  /**
   * Download remote changes
   * @returns {Promise<Object>} Download result
   */
  async downloadRemoteChanges() {
    const result = { count: 0, errors: [] }
    
    try {
      // Get last sync timestamp
      const lastSync = appState.get('sync.lastSync')
      const since = lastSync ? new Date(lastSync) : new Date(0)
      
      // Download changes since last sync
      const remoteChanges = await this.fetchRemoteChanges(since)
      
      // Process each change
      for (const change of remoteChanges) {
        try {
          await this.applyRemoteChange(change)
          result.count++
        } catch (error) {
          result.errors.push(`Failed to apply change ${change.id}: ${error.message}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`Download failed: ${error.message}`)
    }
    
    return result
  }

  /**
   * Resolve synchronization conflicts
   * @returns {Promise<Object>} Conflict resolution result
   */
  async resolveConflicts() {
    const result = { count: 0, errors: [] }
    
    try {
      const conflicts = await this.detectConflicts()
      const conflictResolution = appState.get('user.syncSettings.conflictResolution')
      
      for (const conflict of conflicts) {
        try {
          await this.resolveConflict(conflict, conflictResolution)
          result.count++
        } catch (error) {
          result.errors.push(`Failed to resolve conflict ${conflict.id}: ${error.message}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`Conflict resolution failed: ${error.message}`)
    }
    
    return result
  }

  /**
   * Detect conflicts between local and remote data
   * @returns {Promise<Array>} Array of conflicts
   */
  async detectConflicts() {
    const conflicts = []
    
    try {
      // Get local data
      const localMemorials = await storageManager.getMemorials()
      
      // Compare with remote data (simulated)
      for (const memorial of localMemorials) {
        if (memorial.syncStatus === 'pending') {
          // Check if remote version exists and is newer
          const remoteVersion = await this.fetchRemoteMemorial(memorial.id)
          
          if (remoteVersion && remoteVersion.updatedAt > memorial.updatedAt) {
            conflicts.push({
              id: memorial.id,
              type: 'memorial',
              local: memorial,
              remote: remoteVersion,
              conflictType: 'update'
            })
          }
        }
      }
      
    } catch (error) {
      console.error('Conflict detection failed:', error)
    }
    
    return conflicts
  }

  /**
   * Resolve a specific conflict
   * @param {Object} conflict - Conflict to resolve
   * @param {string} strategy - Resolution strategy
   */
  async resolveConflict(conflict, strategy = 'manual') {
    switch (strategy) {
      case 'local':
        // Keep local version
        await this.keepLocalVersion(conflict)
        break
        
      case 'remote':
        // Keep remote version
        await this.keepRemoteVersion(conflict)
        break
        
      case 'manual':
        // Queue for manual resolution
        this.conflictQueue.push(conflict)
        break
        
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
    }
  }

  /**
   * Keep local version in conflict resolution
   * @param {Object} conflict - Conflict to resolve
   */
  async keepLocalVersion(conflict) {
    // Mark local version as authoritative and upload
    const localData = conflict.local
    localData.syncStatus = 'pending'
    localData.updatedAt = new Date()
    
    await storageManager.saveMemorial(localData)
    await this.uploadItem(conflict.type, localData)
  }

  /**
   * Keep remote version in conflict resolution
   * @param {Object} conflict - Conflict to resolve
   */
  async keepRemoteVersion(conflict) {
    // Replace local version with remote
    const remoteData = conflict.remote
    remoteData.syncStatus = 'synced'
    
    await storageManager.saveMemorial(remoteData)
  }

  /**
   * Get pending conflicts for manual resolution
   * @returns {Array} Array of pending conflicts
   */
  getPendingConflicts() {
    return [...this.conflictQueue]
  }

  /**
   * Manually resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution choice ('local' or 'remote')
   * @param {Object} mergedData - Optional merged data
   */
  async manuallyResolveConflict(conflictId, resolution, mergedData = null) {
    const conflictIndex = this.conflictQueue.findIndex(c => c.id === conflictId)
    if (conflictIndex === -1) {
      throw new Error('Conflict not found')
    }
    
    const conflict = this.conflictQueue[conflictIndex]
    
    if (mergedData) {
      // Use custom merged data
      mergedData.syncStatus = 'pending'
      mergedData.updatedAt = new Date()
      await storageManager.saveMemorial(mergedData)
      await this.uploadItem(conflict.type, mergedData)
    } else {
      // Use standard resolution
      await this.resolveConflict(conflict, resolution)
    }
    
    // Remove from queue
    this.conflictQueue.splice(conflictIndex, 1)
  }

  /**
   * Setup automatic synchronization
   */
  setupAutoSync() {
    const autoSyncEnabled = appState.get('user.syncSettings.autoSync')
    if (autoSyncEnabled) {
      this.startAutoSync()
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    this.stopAutoSync() // Clear existing timer
    
    this.autoSyncTimer = setInterval(async () => {
      try {
        if (!this.syncInProgress && navigator.onLine) {
          await this.performFullSync()
        }
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }, this.config.autoSyncInterval)
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
      this.autoSyncTimer = null
    }
  }

  /**
   * Handle network status changes
   * @param {boolean} isOnline - Network status
   */
  handleNetworkChange(isOnline) {
    if (isOnline && !this.syncInProgress) {
      // Network came back online, trigger sync
      setTimeout(() => {
        this.performFullSync().catch(error => {
          console.error('Network recovery sync failed:', error)
        })
      }, 1000)
    }
  }

  /**
   * Queue item for synchronization
   * @param {string} type - Item type
   * @param {Object} item - Item to sync
   */
  queueForSync(type, item) {
    this.syncQueue.push({ type, item, timestamp: new Date() })
    
    // Process queue if auto-sync is enabled
    const autoSyncEnabled = appState.get('user.syncSettings.autoSync')
    if (autoSyncEnabled && !this.syncInProgress) {
      setTimeout(() => this.processSyncQueue(), 5000) // 5 second delay
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0 || this.syncInProgress) {
      return
    }
    
    try {
      this.syncInProgress = true
      
      const batches = this.createBatches(this.syncQueue)
      
      for (const batch of batches) {
        await this.uploadBatch(batch)
      }
      
      // Clear processed items
      this.syncQueue = []
      
    } catch (error) {
      console.error('Sync queue processing failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Create batches from items
   * @param {Array} items - Items to batch
   * @returns {Array} Array of batches
   */
  createBatches(items) {
    const batches = []
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize))
    }
    return batches
  }

  /**
   * Upload a batch of items
   * @param {Array} batch - Batch to upload
   */
  async uploadBatch(batch) {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real implementation, this would make HTTP requests
    for (const item of batch) {
      // Mark as synced
      if (item.data && typeof item.data === 'object') {
        item.data.syncStatus = 'synced'
        
        // Update in storage
        switch (item.type) {
          case 'memorial':
            await storageManager.saveMemorial(item.data)
            break
          case 'familyGroup':
            await storageManager.saveFamilyGroup(item.data)
            break
          case 'virtualOffering':
            await storageManager.saveVirtualOffering(item.data)
            break
        }
      }
    }
  }

  /**
   * Upload single item
   * @param {string} type - Item type
   * @param {Object} item - Item to upload
   */
  async uploadItem(type, item) {
    await this.uploadBatch([{ type, data: item }])
  }

  /**
   * Fetch remote changes since timestamp
   * @param {Date} since - Timestamp to fetch changes since
   * @returns {Promise<Array>} Array of remote changes
   */
  async fetchRemoteChanges(since) {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In a real implementation, this would fetch from server
    // For now, return empty array (no remote changes)
    return []
  }

  /**
   * Fetch remote memorial by ID
   * @param {string} memorialId - Memorial ID
   * @returns {Promise<Object|null>} Remote memorial or null
   */
  async fetchRemoteMemorial(memorialId) {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In a real implementation, this would fetch from server
    return null
  }

  /**
   * Apply remote change to local storage
   * @param {Object} change - Remote change to apply
   */
  async applyRemoteChange(change) {
    switch (change.type) {
      case 'memorial':
        const memorial = new Memorial(change.data)
        memorial.syncStatus = 'synced'
        await storageManager.saveMemorial(memorial)
        break
        
      case 'familyGroup':
        const familyGroup = new FamilyGroup(change.data)
        await storageManager.saveFamilyGroup(familyGroup)
        break
        
      case 'virtualOffering':
        const offering = new VirtualOffering(change.data)
        await storageManager.saveVirtualOffering(offering)
        break
        
      default:
        throw new Error(`Unknown change type: ${change.type}`)
    }
  }

  /**
   * Get all family groups (helper method)
   * @returns {Promise<Array>} Array of family groups
   */
  async getAllFamilyGroups() {
    // This would need to be implemented in StorageManager
    // For now, return empty array
    return []
  }

  /**
   * Get sync statistics
   * @returns {Promise<Object>} Sync statistics
   */
  async getSyncStats() {
    const memorials = await storageManager.getMemorials()
    const pendingCount = memorials.filter(m => m.syncStatus === 'pending').length
    const localCount = memorials.filter(m => m.syncStatus === 'local').length
    const syncedCount = memorials.filter(m => m.syncStatus === 'synced').length
    
    return {
      total: memorials.length,
      pending: pendingCount,
      local: localCount,
      synced: syncedCount,
      conflicts: this.conflictQueue.length,
      lastSync: appState.get('sync.lastSync'),
      status: appState.get('sync.status')
    }
  }

  /**
   * Force sync of specific item
   * @param {string} type - Item type
   * @param {string} id - Item ID
   */
  async forceSyncItem(type, id) {
    let item
    
    switch (type) {
      case 'memorial':
        item = await storageManager.getMemorial(id)
        break
      default:
        throw new Error(`Unsupported item type: ${type}`)
    }
    
    if (!item) {
      throw new Error(`Item not found: ${id}`)
    }
    
    // Mark as pending and queue for sync
    item.syncStatus = 'pending'
    item.updatedAt = new Date()
    
    await storageManager.saveMemorial(item)
    this.queueForSync(type, item)
  }

  /**
   * Reset sync status (for debugging/testing)
   */
  async resetSyncStatus() {
    const memorials = await storageManager.getMemorials()
    
    for (const memorial of memorials) {
      memorial.syncStatus = 'local'
      await storageManager.saveMemorial(memorial)
    }
    
    appState.set('sync.lastSync', null)
    appState.set('sync.status', 'idle')
    
    this.conflictQueue = []
    this.syncQueue = []
  }

  /**
   * Export sync data for debugging
   * @returns {Promise<Object>} Sync data export
   */
  async exportSyncData() {
    const stats = await this.getSyncStats()
    
    return {
      stats,
      conflicts: this.conflictQueue,
      syncQueue: this.syncQueue,
      config: this.config,
      appSyncState: {
        status: appState.get('sync.status'),
        lastSync: appState.get('sync.lastSync'),
        pendingChanges: appState.get('sync.pendingChanges')
      }
    }
  }

  /**
   * Destroy sync service
   */
  destroy() {
    this.stopAutoSync()
    this.syncInProgress = false
    this.conflictQueue = []
    this.syncQueue = []
  }
}

// Create singleton instance
export const syncService = new SyncService()