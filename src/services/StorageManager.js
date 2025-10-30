/**
 * Mictla Storage Manager
 * Handles IndexedDB operations for persistent data storage
 */

import { Memorial, FamilyGroup, VirtualOffering } from '../types/index.js'

export class StorageManager {
  constructor() {
    this.dbName = 'MictlaDB'
    this.dbVersion = 1
    this.db = null
    
    // Store names
    this.stores = {
      memorials: 'memorials',
      familyGroups: 'familyGroups', 
      virtualOfferings: 'virtualOfferings',
      userPreferences: 'userPreferences',
      syncData: 'syncData'
    }
  }

  /**
   * Initialize IndexedDB connection
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create memorials store
        if (!db.objectStoreNames.contains(this.stores.memorials)) {
          const memorialStore = db.createObjectStore(this.stores.memorials, { keyPath: 'id' })
          memorialStore.createIndex('name', 'name', { unique: false })
          memorialStore.createIndex('relationship', 'relationship', { unique: false })
          memorialStore.createIndex('altarLevel', 'altarLevel', { unique: false })
          memorialStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          memorialStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        // Create family groups store
        if (!db.objectStoreNames.contains(this.stores.familyGroups)) {
          const familyStore = db.createObjectStore(this.stores.familyGroups, { keyPath: 'groupId' })
          familyStore.createIndex('name', 'name', { unique: false })
          familyStore.createIndex('inviteCode', 'inviteCode', { unique: true })
        }
        
        // Create virtual offerings store
        if (!db.objectStoreNames.contains(this.stores.virtualOfferings)) {
          const offeringStore = db.createObjectStore(this.stores.virtualOfferings, { keyPath: 'id' })
          offeringStore.createIndex('memorialId', 'memorialId', { unique: false })
          offeringStore.createIndex('type', 'type', { unique: false })
          offeringStore.createIndex('placedBy', 'placedBy', { unique: false })
        }
        
        // Create user preferences store
        if (!db.objectStoreNames.contains(this.stores.userPreferences)) {
          db.createObjectStore(this.stores.userPreferences, { keyPath: 'userId' })
        }
        
        // Create sync data store
        if (!db.objectStoreNames.contains(this.stores.syncData)) {
          const syncStore = db.createObjectStore(this.stores.syncData, { keyPath: 'id' })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Generic method to perform database operations
   * @param {string} storeName - Name of the object store
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @param {Function} operation - Operation to perform
   * @returns {Promise<any>} Operation result
   */
  async performOperation(storeName, mode, operation) {
    if (!this.db) {
      await this.init()
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], mode)
        const store = transaction.objectStore(storeName)
        
        transaction.onerror = () => reject(transaction.error)
        transaction.oncomplete = () => resolve()
        
        const result = operation(store)
        
        // Handle IndexedDB request objects
        if (result && typeof result === 'object' && 'onsuccess' in result) {
          result.onsuccess = () => resolve(result.result)
          result.onerror = () => reject(result.error)
          
          // For testing: if result already has a result, resolve immediately
          if (result.result !== undefined) {
            setTimeout(() => resolve(result.result), 0)
          }
        } else {
          // Direct result
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Memorial CRUD Operations
  
  /**
   * Save memorial to IndexedDB
   * @param {Memorial|Object} memorial - Memorial data
   * @returns {Promise<Memorial>} Saved memorial
   */
  async saveMemorial(memorial) {
    const memorialInstance = memorial instanceof Memorial ? memorial : new Memorial(memorial)
    
    // Validate before saving
    const validation = memorialInstance.validate()
    if (!validation.isValid) {
      throw new Error(`Memorial validation failed: ${validation.errors.join(', ')}`)
    }
    
    memorialInstance.updatedAt = new Date()
    const data = memorialInstance.toJSON()
    
    await this.performOperation(this.stores.memorials, 'readwrite', (store) => {
      return store.put(data)
    })
    
    return memorialInstance
  }

  /**
   * Get memorial by ID
   * @param {string} id - Memorial ID
   * @returns {Promise<Memorial|null>} Memorial instance or null
   */
  async getMemorial(id) {
    try {
      const data = await this.performOperation(this.stores.memorials, 'readonly', (store) => {
        return store.get(id)
      })
      
      return data ? new Memorial(data) : null
    } catch (error) {
      console.error('Failed to get memorial:', error)
      return null
    }
  }

  /**
   * Get all memorials
   * @returns {Promise<Memorial[]>} Array of memorial instances
   */
  async getMemorials() {
    try {
      const data = await this.performOperation(this.stores.memorials, 'readonly', (store) => {
        return store.getAll()
      })
      
      return Array.isArray(data) ? data.map(item => new Memorial(item)) : []
    } catch (error) {
      console.error('Failed to get memorials:', error)
      return []
    }
  }

  /**
   * Get memorials by altar level
   * @param {number} level - Altar level (1-3)
   * @returns {Promise<Memorial[]>} Array of memorial instances
   */
  async getMemorialsByLevel(level) {
    try {
      const data = await this.performOperation(this.stores.memorials, 'readonly', (store) => {
        const index = store.index('altarLevel')
        return index.getAll(level)
      })
      
      return Array.isArray(data) ? data.map(item => new Memorial(item)) : []
    } catch (error) {
      console.error('Failed to get memorials by level:', error)
      return []
    }
  }

  /**
   * Update memorial
   * @param {string} id - Memorial ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Memorial|null>} Updated memorial or null
   */
  async updateMemorial(id, updates) {
    const existing = await this.getMemorial(id)
    if (!existing) {
      return null
    }
    
    // Apply updates
    Object.assign(existing, updates)
    existing.updatedAt = new Date()
    existing.syncStatus = 'pending'
    
    return await this.saveMemorial(existing)
  }

  /**
   * Delete memorial
   * @param {string} id - Memorial ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteMemorial(id) {
    try {
      await this.performOperation(this.stores.memorials, 'readwrite', (store) => {
        return store.delete(id)
      })
      
      // Also delete related virtual offerings
      await this.deleteOfferingsByMemorial(id)
      
      return true
    } catch (error) {
      console.error('Failed to delete memorial:', error)
      return false
    }
  }

  // Family Group CRUD Operations
  
  /**
   * Save family group
   * @param {FamilyGroup|Object} familyGroup - Family group data
   * @returns {Promise<FamilyGroup>} Saved family group
   */
  async saveFamilyGroup(familyGroup) {
    const groupInstance = familyGroup instanceof FamilyGroup ? familyGroup : new FamilyGroup(familyGroup)
    
    const validation = groupInstance.validate()
    if (!validation.isValid) {
      throw new Error(`Family group validation failed: ${validation.errors.join(', ')}`)
    }
    
    const data = groupInstance.toJSON()
    
    await this.performOperation(this.stores.familyGroups, 'readwrite', (store) => {
      return store.put(data)
    })
    
    return groupInstance
  }

  /**
   * Get family group by ID
   * @param {string} groupId - Family group ID
   * @returns {Promise<FamilyGroup|null>} Family group instance or null
   */
  async getFamilyGroup(groupId) {
    const data = await this.performOperation(this.stores.familyGroups, 'readonly', (store) => {
      return store.get(groupId)
    })
    
    return data ? new FamilyGroup(data) : null
  }

  /**
   * Get family group by invite code
   * @param {string} inviteCode - Invite code
   * @returns {Promise<FamilyGroup|null>} Family group instance or null
   */
  async getFamilyGroupByInviteCode(inviteCode) {
    try {
      const data = await this.performOperation(this.stores.familyGroups, 'readonly', (store) => {
        const index = store.index('inviteCode')
        return index.get(inviteCode)
      })
      
      return data ? new FamilyGroup(data) : null
    } catch (error) {
      console.error('Failed to get family group by invite code:', error)
      return null
    }
  }

  /**
   * Delete family group
   * @param {string} groupId - Family group ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteFamilyGroup(groupId) {
    try {
      await this.performOperation(this.stores.familyGroups, 'readwrite', (store) => {
        return store.delete(groupId)
      })
      return true
    } catch (error) {
      console.error('Failed to delete family group:', error)
      return false
    }
  }

  // Virtual Offering CRUD Operations
  
  /**
   * Save virtual offering
   * @param {VirtualOffering|Object} offering - Virtual offering data
   * @returns {Promise<VirtualOffering>} Saved offering
   */
  async saveVirtualOffering(offering) {
    const offeringInstance = offering instanceof VirtualOffering ? offering : new VirtualOffering(offering)
    
    const validation = offeringInstance.validate()
    if (!validation.isValid) {
      throw new Error(`Virtual offering validation failed: ${validation.errors.join(', ')}`)
    }
    
    const data = offeringInstance.toJSON()
    
    await this.performOperation(this.stores.virtualOfferings, 'readwrite', (store) => {
      return store.put(data)
    })
    
    return offeringInstance
  }

  /**
   * Get virtual offerings by memorial ID
   * @param {string} memorialId - Memorial ID
   * @returns {Promise<VirtualOffering[]>} Array of virtual offering instances
   */
  async getOfferingsByMemorial(memorialId) {
    try {
      const data = await this.performOperation(this.stores.virtualOfferings, 'readonly', (store) => {
        const index = store.index('memorialId')
        return index.getAll(memorialId)
      })
      
      return Array.isArray(data) ? data.map(item => new VirtualOffering(item)) : []
    } catch (error) {
      console.error('Failed to get offerings by memorial:', error)
      return []
    }
  }

  /**
   * Get all virtual offerings
   * @returns {Promise<VirtualOffering[]>} Array of virtual offering instances
   */
  async getVirtualOfferings() {
    try {
      const data = await this.performOperation(this.stores.virtualOfferings, 'readonly', (store) => {
        return store.getAll()
      })
      
      return Array.isArray(data) ? data.map(item => new VirtualOffering(item)) : []
    } catch (error) {
      console.error('Failed to get virtual offerings:', error)
      return []
    }
  }

  /**
   * Delete virtual offering
   * @param {string} id - Offering ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteVirtualOffering(id) {
    try {
      await this.performOperation(this.stores.virtualOfferings, 'readwrite', (store) => {
        return store.delete(id)
      })
      return true
    } catch (error) {
      console.error('Failed to delete virtual offering:', error)
      return false
    }
  }

  /**
   * Delete all offerings for a memorial
   * @param {string} memorialId - Memorial ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteOfferingsByMemorial(memorialId) {
    try {
      const offerings = await this.getOfferingsByMemorial(memorialId)
      
      await this.performOperation(this.stores.virtualOfferings, 'readwrite', (store) => {
        offerings.forEach(offering => {
          store.delete(offering.id)
        })
      })
      
      return true
    } catch (error) {
      console.error('Failed to delete offerings by memorial:', error)
      return false
    }
  }

  // User Preferences Operations
  
  /**
   * Save user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async saveUserPreferences(userId, preferences) {
    const data = {
      userId,
      ...preferences,
      updatedAt: new Date().toISOString()
    }
    
    await this.performOperation(this.stores.userPreferences, 'readwrite', (store) => {
      return store.put(data)
    })
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User preferences or null
   */
  async getUserPreferences(userId) {
    return await this.performOperation(this.stores.userPreferences, 'readonly', (store) => {
      return store.get(userId)
    })
  }

  // Data Export/Import Operations
  
  /**
   * Export all data
   * @returns {Promise<Object>} Exported data
   */
  async exportData() {
    const [memorials, familyGroups, virtualOfferings, userPrefs] = await Promise.all([
      this.getMemorials(),
      this.performOperation(this.stores.familyGroups, 'readonly', (store) => store.getAll()),
      this.getVirtualOfferings(),
      this.performOperation(this.stores.userPreferences, 'readonly', (store) => store.getAll())
    ])
    
    return {
      version: this.dbVersion,
      exportDate: new Date().toISOString(),
      memorials: memorials.map(m => m.toJSON()),
      familyGroups: familyGroups,
      virtualOfferings: virtualOfferings.map(o => o.toJSON()),
      userPreferences: userPrefs
    }
  }

  /**
   * Import data (replaces existing data)
   * @param {Object} data - Data to import
   * @returns {Promise<void>}
   */
  async importData(data) {
    if (!data || !data.version) {
      throw new Error('Invalid import data format')
    }
    
    // Clear existing data
    await this.clearAllData()
    
    // Import memorials
    if (data.memorials) {
      for (const memorial of data.memorials) {
        await this.saveMemorial(new Memorial(memorial))
      }
    }
    
    // Import family groups
    if (data.familyGroups) {
      for (const group of data.familyGroups) {
        await this.saveFamilyGroup(new FamilyGroup(group))
      }
    }
    
    // Import virtual offerings
    if (data.virtualOfferings) {
      for (const offering of data.virtualOfferings) {
        await this.saveVirtualOffering(new VirtualOffering(offering))
      }
    }
    
    // Import user preferences
    if (data.userPreferences) {
      for (const prefs of data.userPreferences) {
        await this.saveUserPreferences(prefs.userId, prefs)
      }
    }
  }

  /**
   * Clear all data from database
   * @returns {Promise<void>}
   */
  async clearAllData() {
    const storeNames = Object.values(this.stores)
    
    for (const storeName of storeNames) {
      try {
        await this.performOperation(storeName, 'readwrite', (store) => {
          return store.clear()
        })
      } catch (error) {
        console.error(`Failed to clear store ${storeName}:`, error)
      }
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    const [memorials, familyGroups, offerings] = await Promise.all([
      this.getMemorials(),
      this.performOperation(this.stores.familyGroups, 'readonly', (store) => store.getAll()),
      this.getVirtualOfferings()
    ])
    
    return {
      memorials: {
        total: memorials.length,
        byLevel: {
          1: memorials.filter(m => m.altarLevel === 1).length,
          2: memorials.filter(m => m.altarLevel === 2).length,
          3: memorials.filter(m => m.altarLevel === 3).length
        },
        withPhotos: memorials.filter(m => m.photo).length,
        withAudio: memorials.filter(m => m.audioMessage).length
      },
      familyGroups: familyGroups.length,
      virtualOfferings: {
        total: offerings.length,
        byType: offerings.reduce((acc, offering) => {
          acc[offering.type] = (acc[offering.type] || 0) + 1
          return acc
        }, {})
      }
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Create singleton instance
export const storageManager = new StorageManager()