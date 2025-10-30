/**
 * Data Models Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Memorial, FamilyGroup, VirtualOffering, AltarLevel, ValidationUtils } from '../../src/types/index.js'
import { cleanup } from '../setup.js'

describe('Data Models', () => {
  beforeEach(() => {
    cleanup()
  })

  describe('Memorial', () => {
    const validMemorialData = {
      name: 'Juan García',
      relationship: 'padre',
      story: 'Un padre amoroso que siempre cuidó de su familia',
      birthDate: '1950-05-15',
      deathDate: '2020-12-25',
      altarLevel: 1
    }

    it('should create memorial with valid data', () => {
      const memorial = new Memorial(validMemorialData)
      
      expect(memorial.name).toBe('Juan García')
      expect(memorial.relationship).toBe('padre')
      expect(memorial.altarLevel).toBe(1)
      expect(memorial.birthDate).toBeInstanceOf(Date)
      expect(memorial.deathDate).toBeInstanceOf(Date)
      expect(memorial.id).toMatch(/^memorial_[a-z0-9]+_\d+$/)
      expect(memorial.syncStatus).toBe('local')
    })

    it('should create memorial with default values', () => {
      const memorial = new Memorial()
      
      expect(memorial.name).toBe('')
      expect(memorial.story).toBe('')
      expect(memorial.altarLevel).toBe(1)
      expect(memorial.offerings).toEqual([])
      expect(memorial.familyConnections.parents).toEqual([])
      expect(memorial.familyConnections.children).toEqual([])
      expect(memorial.sharing.isShared).toBe(false)
      expect(memorial.createdAt).toBeInstanceOf(Date)
      expect(memorial.updatedAt).toBeInstanceOf(Date)
    })

    it('should validate memorial data correctly', () => {
      const memorial = new Memorial(validMemorialData)
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject memorial without name', () => {
      const memorial = new Memorial({ ...validMemorialData, name: '' })
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Name is required')
    })

    it('should reject memorial with long name', () => {
      const memorial = new Memorial({ 
        ...validMemorialData, 
        name: 'A'.repeat(150) 
      })
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Name must be less than 100 characters')
    })

    it('should reject memorial with long story', () => {
      const memorial = new Memorial({ 
        ...validMemorialData, 
        story: 'A'.repeat(6000) 
      })
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Story must be less than 5000 characters')
    })

    it('should reject invalid altar level', () => {
      const memorial = new Memorial({ 
        ...validMemorialData, 
        altarLevel: 5 
      })
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Altar level must be between 1 and 3')
    })

    it('should reject birth date after death date', () => {
      const memorial = new Memorial({ 
        ...validMemorialData, 
        birthDate: '2020-01-01',
        deathDate: '1950-01-01'
      })
      const validation = memorial.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Birth date cannot be after death date')
    })

    it('should convert to JSON correctly', () => {
      const memorial = new Memorial(validMemorialData)
      const json = memorial.toJSON()
      
      expect(json.id).toBe(memorial.id)
      expect(json.name).toBe('Juan García')
      expect(json.birthDate).toBe(memorial.birthDate.toISOString())
      expect(json.deathDate).toBe(memorial.deathDate.toISOString())
      expect(json.createdAt).toBe(memorial.createdAt.toISOString())
      expect(json.updatedAt).toBe(memorial.updatedAt.toISOString())
    })

    it('should handle family connections', () => {
      const memorial = new Memorial({
        ...validMemorialData,
        familyConnections: {
          parents: ['parent1', 'parent2'],
          children: ['child1'],
          spouse: 'spouse1'
        }
      })
      
      expect(memorial.familyConnections.parents).toEqual(['parent1', 'parent2'])
      expect(memorial.familyConnections.children).toEqual(['child1'])
      expect(memorial.familyConnections.spouse).toBe('spouse1')
    })

    it('should handle virtual offerings data', () => {
      const memorial = new Memorial({
        ...validMemorialData,
        virtualOfferings: {
          position: { x: 1, y: 2, z: 3 },
          items: ['cempasuchil', 'vela']
        }
      })
      
      expect(memorial.virtualOfferings.position).toEqual({ x: 1, y: 2, z: 3 })
      expect(memorial.virtualOfferings.items).toEqual(['cempasuchil', 'vela'])
    })

    it('should handle sharing configuration', () => {
      const memorial = new Memorial({
        ...validMemorialData,
        sharing: {
          isShared: true,
          sharedWith: ['user1@example.com', 'user2@example.com'],
          shareCode: 'ABC123',
          permissions: ['view', 'edit']
        }
      })
      
      expect(memorial.sharing.isShared).toBe(true)
      expect(memorial.sharing.sharedWith).toEqual(['user1@example.com', 'user2@example.com'])
      expect(memorial.sharing.shareCode).toBe('ABC123')
      expect(memorial.sharing.permissions).toEqual(['view', 'edit'])
    })
  })

  describe('FamilyGroup', () => {
    const validFamilyData = {
      name: 'Familia García',
      members: [
        {
          userId: 'user1',
          email: 'admin@example.com',
          role: 'admin'
        },
        {
          userId: 'user2',
          email: 'member@example.com',
          role: 'member'
        }
      ]
    }

    it('should create family group with valid data', () => {
      const family = new FamilyGroup(validFamilyData)
      
      expect(family.name).toBe('Familia García')
      expect(family.members).toHaveLength(2)
      expect(family.groupId).toMatch(/^family_[a-z0-9]+_\d+$/)
      expect(family.inviteCode).toMatch(/^[A-Z0-9]{8}$/)
      expect(family.createdAt).toBeInstanceOf(Date)
    })

    it('should create family group with default values', () => {
      const family = new FamilyGroup()
      
      expect(family.name).toBe('')
      expect(family.members).toEqual([])
      expect(family.sharedMemorials).toEqual([])
      expect(family.settings.allowNewMembers).toBe(true)
      expect(family.settings.requireApproval).toBe(false)
      expect(family.settings.defaultPermissions).toEqual(['view'])
    })

    it('should add member correctly', () => {
      const family = new FamilyGroup(validFamilyData)
      const newMember = {
        userId: 'user3',
        email: 'newmember@example.com',
        role: 'member'
      }
      
      family.addMember(newMember)
      
      expect(family.members).toHaveLength(3)
      expect(family.members[2].userId).toBe('user3')
      expect(family.members[2].joinedAt).toBeInstanceOf(Date)
    })

    it('should remove member correctly', () => {
      const family = new FamilyGroup(validFamilyData)
      
      family.removeMember('user2')
      
      expect(family.members).toHaveLength(1)
      expect(family.members[0].userId).toBe('user1')
    })

    it('should check admin status correctly', () => {
      const family = new FamilyGroup(validFamilyData)
      
      expect(family.isAdmin('user1')).toBe(true)
      expect(family.isAdmin('user2')).toBe(false)
      expect(family.isAdmin('nonexistent')).toBe(false)
    })

    it('should validate family group correctly', () => {
      const family = new FamilyGroup(validFamilyData)
      const validation = family.validate()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject family without name', () => {
      const family = new FamilyGroup({ ...validFamilyData, name: '' })
      const validation = family.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Family name is required')
    })

    it('should reject family without members', () => {
      const family = new FamilyGroup({ ...validFamilyData, members: [] })
      const validation = family.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Family group must have at least one member')
    })

    it('should reject family without admin', () => {
      const family = new FamilyGroup({
        ...validFamilyData,
        members: [
          { userId: 'user1', email: 'user1@example.com', role: 'member' },
          { userId: 'user2', email: 'user2@example.com', role: 'member' }
        ]
      })
      const validation = family.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Family group must have at least one admin')
    })

    it('should convert to JSON correctly', () => {
      const family = new FamilyGroup(validFamilyData)
      const json = family.toJSON()
      
      expect(json.groupId).toBe(family.groupId)
      expect(json.name).toBe('Familia García')
      expect(json.members).toHaveLength(2)
      expect(json.members[0].joinedAt).toBeDefined()
      expect(json.createdAt).toBe(family.createdAt.toISOString())
    })
  })

  describe('VirtualOffering', () => {
    const validOfferingData = {
      type: 'cempasuchil',
      position: { x: 1.5, y: 2.0, z: -0.5 },
      memorialId: 'memorial123',
      placedBy: 'user456',
      message: 'Para mi querido abuelo'
    }

    it('should create virtual offering with valid data', () => {
      const offering = new VirtualOffering(validOfferingData)
      
      expect(offering.type).toBe('cempasuchil')
      expect(offering.position).toEqual({ x: 1.5, y: 2.0, z: -0.5 })
      expect(offering.memorialId).toBe('memorial123')
      expect(offering.placedBy).toBe('user456')
      expect(offering.message).toBe('Para mi querido abuelo')
      expect(offering.id).toMatch(/^offering_[a-z0-9]+_\d+$/)
      expect(offering.createdAt).toBeInstanceOf(Date)
    })

    it('should create virtual offering with default values', () => {
      const offering = new VirtualOffering()
      
      expect(offering.type).toBe('cempasuchil')
      expect(offering.position).toEqual({ x: 0, y: 0, z: 0 })
      expect(offering.memorialId).toBeNull()
      expect(offering.placedBy).toBeNull()
      expect(offering.message).toBe('')
    })

    it('should validate virtual offering correctly', () => {
      const offering = new VirtualOffering(validOfferingData)
      const validation = offering.validate()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject invalid offering type', () => {
      const offering = new VirtualOffering({ 
        ...validOfferingData, 
        type: 'invalid_type' 
      })
      const validation = offering.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Invalid offering type')
    })

    it('should reject invalid position', () => {
      const offering = new VirtualOffering({ 
        ...validOfferingData, 
        position: { x: 'not-a-number', y: 2, z: 3 } 
      })
      const validation = offering.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Position must have valid x, y, z coordinates')
    })

    it('should reject long message', () => {
      const offering = new VirtualOffering({ 
        ...validOfferingData, 
        message: 'A'.repeat(600) 
      })
      const validation = offering.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Message must be less than 500 characters')
    })

    it('should convert to JSON correctly', () => {
      const offering = new VirtualOffering(validOfferingData)
      const json = offering.toJSON()
      
      expect(json.id).toBe(offering.id)
      expect(json.type).toBe('cempasuchil')
      expect(json.position).toEqual({ x: 1.5, y: 2.0, z: -0.5 })
      expect(json.createdAt).toBe(offering.createdAt.toISOString())
    })

    it('should validate all offering types', () => {
      const validTypes = ['cempasuchil', 'pan_de_muerto', 'agua', 'sal', 'foto', 'vela']
      
      validTypes.forEach(type => {
        const offering = new VirtualOffering({ 
          ...validOfferingData, 
          type 
        })
        const validation = offering.validate()
        
        expect(validation.isValid).toBe(true)
      })
    })
  })

  describe('AltarLevel', () => {
    it('should create altar level with valid data', () => {
      const level = new AltarLevel({
        level: 2,
        name: 'Nivel Purgatorio',
        description: 'Nivel intermedio del altar',
        traditionalOfferings: ['agua', 'sal'],
        culturalSignificance: 'Representa la transición',
        cocoReference: 'El viaje entre mundos'
      })
      
      expect(level.level).toBe(2)
      expect(level.name).toBe('Nivel Purgatorio')
      expect(level.traditionalOfferings).toEqual(['agua', 'sal'])
      expect(level.memorials).toEqual([])
    })

    it('should create altar level with default values', () => {
      const level = new AltarLevel()
      
      expect(level.level).toBe(1)
      expect(level.name).toBe('Nivel Terrenal')
      expect(level.description).toBe('')
      expect(level.traditionalOfferings).toEqual([])
      expect(level.memorials).toEqual([])
    })

    it('should get default names for levels', () => {
      const level1 = new AltarLevel({ level: 1 })
      const level2 = new AltarLevel({ level: 2 })
      const level3 = new AltarLevel({ level: 3 })
      
      expect(level1.name).toBe('Nivel Terrenal')
      expect(level2.name).toBe('Nivel Purgatorio')
      expect(level3.name).toBe('Nivel Celestial')
    })

    it('should add memorial to level', () => {
      const level = new AltarLevel()
      
      level.addMemorial('memorial1')
      level.addMemorial('memorial2')
      
      expect(level.memorials).toEqual(['memorial1', 'memorial2'])
    })

    it('should not add duplicate memorials', () => {
      const level = new AltarLevel()
      
      level.addMemorial('memorial1')
      level.addMemorial('memorial1') // Duplicate
      
      expect(level.memorials).toEqual(['memorial1'])
    })

    it('should remove memorial from level', () => {
      const level = new AltarLevel()
      level.memorials = ['memorial1', 'memorial2', 'memorial3']
      
      level.removeMemorial('memorial2')
      
      expect(level.memorials).toEqual(['memorial1', 'memorial3'])
    })

    it('should convert to JSON correctly', () => {
      const level = new AltarLevel({
        level: 2,
        name: 'Test Level',
        memorials: ['memorial1', 'memorial2']
      })
      const json = level.toJSON()
      
      expect(json.level).toBe(2)
      expect(json.name).toBe('Test Level')
      expect(json.memorials).toEqual(['memorial1', 'memorial2'])
    })
  })

  describe('ValidationUtils', () => {
    describe('sanitizeText', () => {
      it('should remove HTML tags', () => {
        const dirty = 'Hello <script>alert("xss")</script> world'
        const clean = ValidationUtils.sanitizeText(dirty)
        
        expect(clean).toBe('Hello alert("xss") world')
      })

      it('should remove javascript protocols', () => {
        const dirty = 'Click javascript:alert("xss") here'
        const clean = ValidationUtils.sanitizeText(dirty)
        
        expect(clean).toBe('Click alert("xss") here')
      })

      it('should remove event handlers', () => {
        const dirty = 'Text with onclick=alert("xss") handler'
        const clean = ValidationUtils.sanitizeText(dirty)
        
        expect(clean).toBe('Text with alert("xss") handler')
      })

      it('should handle non-string input', () => {
        expect(ValidationUtils.sanitizeText(123)).toBe('')
        expect(ValidationUtils.sanitizeText(null)).toBe('')
        expect(ValidationUtils.sanitizeText(undefined)).toBe('')
      })
    })

    describe('isValidEmail', () => {
      it('should validate correct emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ]
        
        validEmails.forEach(email => {
          expect(ValidationUtils.isValidEmail(email)).toBe(true)
        })
      })

      it('should reject invalid emails', () => {
        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'user@',
          'user@domain',
          'user name@example.com'
        ]
        
        invalidEmails.forEach(email => {
          expect(ValidationUtils.isValidEmail(email)).toBe(false)
        })
      })
    })

    describe('validateImageFile', () => {
      it('should validate correct image file', () => {
        const mockFile = new File(['fake-data'], 'test.jpg', {
          type: 'image/jpeg',
          size: 1024 * 1024 // 1MB
        })
        
        const result = ValidationUtils.validateImageFile(mockFile)
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject oversized file', () => {
        const mockFile = new File(['fake-data'], 'test.jpg', {
          type: 'image/jpeg',
          size: 10 * 1024 * 1024 // 10MB
        })
        
        const result = ValidationUtils.validateImageFile(mockFile)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('File size must be less than 5MB')
      })

      it('should reject invalid file type', () => {
        const mockFile = new File(['fake-data'], 'test.txt', {
          type: 'text/plain',
          size: 1024
        })
        
        const result = ValidationUtils.validateImageFile(mockFile)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid file type. Only JPEG, PNG, and WebP are allowed')
      })

      it('should handle null file', () => {
        const result = ValidationUtils.validateImageFile(null)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('No file provided')
      })
    })

    describe('validateAudioFile', () => {
      it('should validate correct audio file', () => {
        const mockFile = new File(['fake-data'], 'test.mp3', {
          type: 'audio/mp3',
          size: 2 * 1024 * 1024 // 2MB
        })
        
        const result = ValidationUtils.validateAudioFile(mockFile)
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject oversized audio file', () => {
        const mockFile = new File(['fake-data'], 'test.mp3', {
          type: 'audio/mp3',
          size: 15 * 1024 * 1024 // 15MB
        })
        
        const result = ValidationUtils.validateAudioFile(mockFile)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('File size must be less than 10MB')
      })

      it('should reject invalid audio type', () => {
        const mockFile = new File(['fake-data'], 'test.txt', {
          type: 'text/plain',
          size: 1024
        })
        
        const result = ValidationUtils.validateAudioFile(mockFile)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid file type. Only MP3, WAV, OGG, and WebM are allowed')
      })
    })
  })
})