/**
 * StorageManager Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageManager } from '../../src/services/StorageManager.js'
import { Memorial, FamilyGroup, VirtualOffering } from '../../src/types/index.js'
import { cleanup } from '../setup.js'

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(),
  close: vi.fn(),
  objectStoreNames: { contains: vi.fn() }
}

const mockTransaction = {
  objectStore: vi.fn(),
  onerror: null,
  oncomplete: null
}

const mockStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn()
}

const mockIndex = {
  get: vi.fn(),
  getAll: vi.fn()
}

const mockRequest = {
  result: mockDB,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null
}

// Mock IndexedDB API
global.indexedDB = {
  open: vi.fn(() => mockRequest),
  deleteDatabase: vi.fn()
}

describe('StorageManager', () => {
  let storageManager

  beforeEach(async () => {
    cleanup()
    
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup mock returns
    mockTransaction.objectStore.mockReturnValue(mockStore)
    mockStore.index.mockReturnValue(mockIndex)
    mockDB.transaction.mockReturnValue(mockTransaction)
    
    storageManager = new StorageManager()
    
    // Mock successful DB initialization
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess()
      }
    }, 0)
    
    await storageManager.init()
  })

  afterEach(() => {
    if (storageManager) {
      storageManager.close()
    }
  })

  describe('initialization', () => {
    it('should initialize IndexedDB connection', async () => {
      expect(global.indexedDB.open).toHaveBeenCalledWith('MictlaDB', 1)
      expect(storageManager.db).toBe(mockDB)
    })

    it('should handle initialization errors', async () => {
      const newStorageManager = new StorageManager()
      
      setTimeout(() => {
        if (mockRequest.onerror) {
          mockRequest.error = new Error('DB Error')
          mockRequest.onerror()
        }
      }, 0)
      
      await expect(newStorageManager.init()).rejects.toThrow('DB Error')
    })

    it('should create object stores on upgrade', async () => {
      const newStorageManager = new StorageManager()
      const mockUpgradeDB = {
        createObjectStore: vi.fn(() => mockStore),
        objectStoreNames: { contains: vi.fn(() => false) }
      }
      
      setTimeout(() => {
        if (mockRequest.onupgradeneeded) {
          mockRequest.onupgradeneeded({ target: { result: mockUpgradeDB } })
        }
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess()
        }
      }, 0)
      
      await newStorageManager.init()
      
      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith('memorials', { keyPath: 'id' })
      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith('familyGroups', { keyPath: 'groupId' })
      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith('virtualOfferings', { keyPath: 'id' })
    })
  })

  describe('memorial CRUD operations', () => {
    const mockMemorialData = {
      name: 'Test Memorial',
      relationship: 'padre',
      story: 'A loving father',
      altarLevel: 1
    }

    it('should save memorial successfully', async () => {
      const memorial = new Memorial(mockMemorialData)
      
      // Mock successful put operation
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 0)
      
      const result = await storageManager.saveMemorial(memorial)
      
      expect(mockStore.put).toHaveBeenCalledWith(memorial.toJSON())
      expect(result).toBeInstanceOf(Memorial)
      expect(result.name).toBe('Test Memorial')
    })

    it('should reject invalid memorial data', async () => {
      const invalidMemorial = new Memorial({ name: '' }) // Invalid: empty name
      
      await expect(storageManager.saveMemorial(invalidMemorial))
        .rejects.toThrow('Memorial validation failed')
    })

    it('should get memorial by ID', async () => {
      const memorialData = new Memorial(mockMemorialData).toJSON()
      
      // Mock successful get operation
      setTimeout(() => {
        mockStore.get.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: memorialData
        }))
        
        const request = mockStore.get()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getMemorial('test-id')
      
      expect(mockStore.get).toHaveBeenCalledWith('test-id')
      expect(result).toBeInstanceOf(Memorial)
      expect(result.name).toBe('Test Memorial')
    })

    it('should return null for non-existent memorial', async () => {
      // Mock get operation returning undefined
      setTimeout(() => {
        mockStore.get.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: undefined
        }))
        
        const request = mockStore.get()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getMemorial('non-existent')
      
      expect(result).toBeNull()
    })

    it('should get all memorials', async () => {
      const memorialsData = [
        new Memorial({ name: 'Memorial 1' }).toJSON(),
        new Memorial({ name: 'Memorial 2' }).toJSON()
      ]
      
      // Mock successful getAll operation
      setTimeout(() => {
        mockStore.getAll.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: memorialsData
        }))
        
        const request = mockStore.getAll()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getMemorials()
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Memorial)
      expect(result[1]).toBeInstanceOf(Memorial)
    })

    it('should get memorials by altar level', async () => {
      const level1Memorials = [
        new Memorial({ name: 'Memorial 1', altarLevel: 1 }).toJSON()
      ]
      
      // Mock index getAll operation
      setTimeout(() => {
        mockIndex.getAll.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: level1Memorials
        }))
        
        const request = mockIndex.getAll()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getMemorialsByLevel(1)
      
      expect(mockStore.index).toHaveBeenCalledWith('altarLevel')
      expect(mockIndex.getAll).toHaveBeenCalledWith(1)
      expect(result).toHaveLength(1)
      expect(result[0].altarLevel).toBe(1)
    })

    it('should update memorial', async () => {
      const originalMemorial = new Memorial(mockMemorialData)
      
      // Mock get operation
      setTimeout(() => {
        mockStore.get.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: originalMemorial.toJSON()
        }))
        
        const getRequest = mockStore.get()
        if (getRequest.onsuccess) {
          getRequest.onsuccess()
        }
      }, 0)
      
      // Mock put operation
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 10)
      
      const result = await storageManager.updateMemorial(originalMemorial.id, {
        name: 'Updated Name'
      })
      
      expect(result.name).toBe('Updated Name')
      expect(result.syncStatus).toBe('pending')
      expect(mockStore.put).toHaveBeenCalled()
    })

    it('should delete memorial and related offerings', async () => {
      const memorialId = 'test-memorial-id'
      
      // Mock successful delete operations
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 0)
      
      const result = await storageManager.deleteMemorial(memorialId)
      
      expect(result).toBe(true)
      expect(mockStore.delete).toHaveBeenCalledWith(memorialId)
    })
  })

  describe('family group operations', () => {
    const mockFamilyData = {
      name: 'Test Family',
      members: [{
        userId: 'user1',
        email: 'test@example.com',
        role: 'admin'
      }]
    }

    it('should save family group successfully', async () => {
      const familyGroup = new FamilyGroup(mockFamilyData)
      
      // Mock successful put operation
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 0)
      
      const result = await storageManager.saveFamilyGroup(familyGroup)
      
      expect(mockStore.put).toHaveBeenCalledWith(familyGroup.toJSON())
      expect(result).toBeInstanceOf(FamilyGroup)
      expect(result.name).toBe('Test Family')
    })

    it('should reject invalid family group data', async () => {
      const invalidFamily = new FamilyGroup({ name: '', members: [] }) // Invalid: empty name and no members
      
      await expect(storageManager.saveFamilyGroup(invalidFamily))
        .rejects.toThrow('Family group validation failed')
    })

    it('should get family group by invite code', async () => {
      const familyData = new FamilyGroup(mockFamilyData).toJSON()
      
      // Mock successful index get operation
      setTimeout(() => {
        mockIndex.get.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: familyData
        }))
        
        const request = mockIndex.get()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getFamilyGroupByInviteCode('TESTCODE')
      
      expect(mockStore.index).toHaveBeenCalledWith('inviteCode')
      expect(mockIndex.get).toHaveBeenCalledWith('TESTCODE')
      expect(result).toBeInstanceOf(FamilyGroup)
    })
  })

  describe('virtual offering operations', () => {
    const mockOfferingData = {
      type: 'cempasuchil',
      position: { x: 1, y: 2, z: 3 },
      memorialId: 'test-memorial',
      placedBy: 'user1'
    }

    it('should save virtual offering successfully', async () => {
      const offering = new VirtualOffering(mockOfferingData)
      
      // Mock successful put operation
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 0)
      
      const result = await storageManager.saveVirtualOffering(offering)
      
      expect(mockStore.put).toHaveBeenCalledWith(offering.toJSON())
      expect(result).toBeInstanceOf(VirtualOffering)
      expect(result.type).toBe('cempasuchil')
    })

    it('should reject invalid offering data', async () => {
      const invalidOffering = new VirtualOffering({ type: 'invalid-type' }) // Invalid type
      
      await expect(storageManager.saveVirtualOffering(invalidOffering))
        .rejects.toThrow('Virtual offering validation failed')
    })

    it('should get offerings by memorial ID', async () => {
      const offeringsData = [
        new VirtualOffering(mockOfferingData).toJSON()
      ]
      
      // Mock successful index getAll operation
      setTimeout(() => {
        mockIndex.getAll.mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: offeringsData
        }))
        
        const request = mockIndex.getAll()
        if (request.onsuccess) {
          request.onsuccess()
        }
      }, 0)
      
      const result = await storageManager.getOfferingsByMemorial('test-memorial')
      
      expect(mockStore.index).toHaveBeenCalledWith('memorialId')
      expect(mockIndex.getAll).toHaveBeenCalledWith('test-memorial')
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(VirtualOffering)
    })
  })

  describe('data export/import', () => {
    it('should export all data', async () => {
      const mockMemorials = [new Memorial({ name: 'Test' })]
      const mockFamilyGroups = [{ name: 'Family' }]
      const mockOfferings = [new VirtualOffering({ type: 'cempasuchil', position: { x: 0, y: 0, z: 0 } })]
      const mockUserPrefs = [{ userId: 'user1', language: 'es' }]
      
      // Mock all getAll operations
      let callCount = 0
      mockStore.getAll.mockImplementation(() => {
        const results = [mockMemorials.map(m => m.toJSON()), mockFamilyGroups, mockOfferings.map(o => o.toJSON()), mockUserPrefs]
        return {
          onsuccess: null,
          onerror: null,
          result: results[callCount++] || []
        }
      })
      
      // Trigger success callbacks
      setTimeout(() => {
        for (let i = 0; i < 4; i++) {
          const request = mockStore.getAll()
          if (request.onsuccess) {
            request.onsuccess()
          }
        }
      }, 0)
      
      const result = await storageManager.exportData()
      
      expect(result).toHaveProperty('version')
      expect(result).toHaveProperty('exportDate')
      expect(result).toHaveProperty('memorials')
      expect(result).toHaveProperty('familyGroups')
      expect(result).toHaveProperty('virtualOfferings')
      expect(result).toHaveProperty('userPreferences')
    })

    it('should import data and replace existing', async () => {
      const importData = {
        version: 1,
        memorials: [{ name: 'Imported Memorial', id: 'imported-1' }],
        familyGroups: [{ name: 'Imported Family', groupId: 'family-1', members: [{ userId: 'user1', email: 'test@test.com', role: 'admin' }] }],
        virtualOfferings: [{ type: 'cempasuchil', position: { x: 0, y: 0, z: 0 }, id: 'offering-1' }],
        userPreferences: [{ userId: 'user1', language: 'en' }]
      }
      
      // Mock successful operations
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete()
        }
      }, 0)
      
      await storageManager.importData(importData)
      
      expect(mockStore.clear).toHaveBeenCalled()
      expect(mockStore.put).toHaveBeenCalledTimes(4) // One for each data type
    })

    it('should reject invalid import data', async () => {
      const invalidData = { invalid: true }
      
      await expect(storageManager.importData(invalidData))
        .rejects.toThrow('Invalid import data format')
    })
  })

  describe('database statistics', () => {
    it('should return database statistics', async () => {
      const mockMemorials = [
        new Memorial({ name: 'Memorial 1', altarLevel: 1, photo: 'photo1', audioMessage: 'audio1' }),
        new Memorial({ name: 'Memorial 2', altarLevel: 2 }),
        new Memorial({ name: 'Memorial 3', altarLevel: 1, photo: 'photo3' })
      ]
      const mockFamilyGroups = [{ name: 'Family 1' }]
      const mockOfferings = [
        new VirtualOffering({ type: 'cempasuchil', position: { x: 0, y: 0, z: 0 } }),
        new VirtualOffering({ type: 'pan_de_muerto', position: { x: 1, y: 1, z: 1 } }),
        new VirtualOffering({ type: 'cempasuchil', position: { x: 2, y: 2, z: 2 } })
      ]
      
      // Mock getAll operations
      let callCount = 0
      mockStore.getAll.mockImplementation(() => {
        const results = [mockMemorials.map(m => m.toJSON()), mockFamilyGroups, mockOfferings.map(o => o.toJSON())]
        return {
          onsuccess: null,
          onerror: null,
          result: results[callCount++] || []
        }
      })
      
      // Trigger success callbacks
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          const request = mockStore.getAll()
          if (request.onsuccess) {
            request.onsuccess()
          }
        }
      }, 0)
      
      const stats = await storageManager.getStats()
      
      expect(stats.memorials.total).toBe(3)
      expect(stats.memorials.byLevel[1]).toBe(2)
      expect(stats.memorials.byLevel[2]).toBe(1)
      expect(stats.memorials.withPhotos).toBe(2)
      expect(stats.memorials.withAudio).toBe(1)
      expect(stats.familyGroups).toBe(1)
      expect(stats.virtualOfferings.total).toBe(3)
      expect(stats.virtualOfferings.byType.cempasuchil).toBe(2)
      expect(stats.virtualOfferings.byType.pan_de_muerto).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle transaction errors', async () => {
      const memorial = new Memorial({ name: 'Test' })
      
      // Mock transaction error
      setTimeout(() => {
        mockTransaction.error = new Error('Transaction failed')
        if (mockTransaction.onerror) {
          mockTransaction.onerror()
        }
      }, 0)
      
      await expect(storageManager.saveMemorial(memorial))
        .rejects.toThrow('Transaction failed')
    })

    it('should handle operation errors gracefully', async () => {
      // Mock store operation error
      mockStore.get.mockImplementation(() => {
        throw new Error('Store operation failed')
      })
      
      await expect(storageManager.getMemorial('test-id'))
        .rejects.toThrow('Store operation failed')
    })
  })

  describe('cleanup', () => {
    it('should close database connection', () => {
      storageManager.close()
      
      expect(mockDB.close).toHaveBeenCalled()
      expect(storageManager.db).toBeNull()
    })
  })
})