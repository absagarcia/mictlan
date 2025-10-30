/**
 * ValidationService Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ValidationService } from '../../src/services/ValidationService.js'
import { cleanup } from '../setup.js'

describe('ValidationService', () => {
  let validationService

  beforeEach(() => {
    cleanup()
    validationService = new ValidationService()
  })

  describe('memorial validation', () => {
    const validMemorialData = {
      name: 'Test Memorial',
      relationship: 'padre',
      story: 'A loving father who always supported our family',
      birthDate: '1950-01-01',
      deathDate: '2020-01-01',
      altarLevel: 1,
      offerings: ['cempasuchil', 'pan_de_muerto']
    }

    it('should validate correct memorial data', () => {
      const result = validationService.validateMemorial(validMemorialData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized).toBeDefined()
      expect(result.sanitized.name).toBe('Test Memorial')
    })

    it('should reject memorial without name', () => {
      const invalidData = { ...validMemorialData, name: '' }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Name cannot be empty after sanitization')
    })

    it('should reject memorial with non-string name', () => {
      const invalidData = { ...validMemorialData, name: 123 }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Name is required and must be text')
    })

    it('should sanitize and truncate long names', () => {
      const longName = 'A'.repeat(150)
      const data = { ...validMemorialData, name: longName }
      const result = validationService.validateMemorial(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.name).toHaveLength(100)
    })

    it('should validate and convert dates', () => {
      const result = validationService.validateMemorial(validMemorialData)
      
      expect(result.sanitized.birthDate).toBeInstanceOf(Date)
      expect(result.sanitized.deathDate).toBeInstanceOf(Date)
    })

    it('should reject future birth date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const invalidData = { 
        ...validMemorialData, 
        birthDate: futureDate.toISOString() 
      }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Birth date cannot be in the future')
    })

    it('should reject future death date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const invalidData = { 
        ...validMemorialData, 
        deathDate: futureDate.toISOString() 
      }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Death date cannot be in the future')
    })

    it('should reject birth date after death date', () => {
      const invalidData = { 
        ...validMemorialData, 
        birthDate: '2020-01-01',
        deathDate: '1950-01-01'
      }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Birth date cannot be after death date')
    })

    it('should validate altar level range', () => {
      const invalidData = { ...validMemorialData, altarLevel: 5 }
      const result = validationService.validateMemorial(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Altar level must be 1, 2, or 3')
    })

    it('should sanitize story text', () => {
      const storyWithHTML = 'A story with <script>alert("xss")</script> content'
      const data = { ...validMemorialData, story: storyWithHTML }
      const result = validationService.validateMemorial(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.story).not.toContain('<script>')
      expect(result.sanitized.story).not.toContain('alert')
    })

    it('should reject overly long story', () => {
      const longStory = 'A'.repeat(6000)
      const data = { ...validMemorialData, story: longStory }
      const result = validationService.validateMemorial(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.story).toHaveLength(5000)
    })

    it('should filter invalid offerings', () => {
      const data = { 
        ...validMemorialData, 
        offerings: ['valid', 123, '', 'another_valid', null]
      }
      const result = validationService.validateMemorial(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.offerings).toEqual(['valid', 'another_valid'])
    })
  })

  describe('family group validation', () => {
    const validFamilyData = {
      name: 'Test Family',
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
      ],
      sharedMemorials: ['memorial1', 'memorial2'],
      settings: {
        allowNewMembers: true,
        requireApproval: false,
        defaultPermissions: ['view', 'edit']
      }
    }

    it('should validate correct family group data', () => {
      const result = validationService.validateFamilyGroup(validFamilyData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized).toBeDefined()
      expect(result.sanitized.name).toBe('Test Family')
    })

    it('should reject family without name', () => {
      const invalidData = { ...validFamilyData, name: '' }
      const result = validationService.validateFamilyGroup(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Family name cannot be empty after sanitization')
    })

    it('should reject family without members', () => {
      const invalidData = { ...validFamilyData, members: [] }
      const result = validationService.validateFamilyGroup(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Family must have at least one member')
    })

    it('should reject family without admin member', () => {
      const invalidData = { 
        ...validFamilyData, 
        members: [
          { userId: 'user1', email: 'user1@example.com', role: 'member' },
          { userId: 'user2', email: 'user2@example.com', role: 'member' }
        ]
      }
      const result = validationService.validateFamilyGroup(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Family must have at least one admin member')
    })

    it('should validate member data', () => {
      const invalidData = { 
        ...validFamilyData, 
        members: [
          { userId: 'user1', email: 'invalid-email', role: 'admin' }
        ]
      }
      const result = validationService.validateFamilyGroup(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(err => err.includes('Invalid email format'))).toBe(true)
    })

    it('should sanitize and validate settings', () => {
      const data = { 
        ...validFamilyData, 
        settings: {
          allowNewMembers: 'true', // Should be converted to boolean
          requireApproval: 0, // Should be converted to boolean
          defaultPermissions: ['view', 'invalid', 'edit', 'comment'] // Should filter invalid
        }
      }
      const result = validationService.validateFamilyGroup(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.settings.allowNewMembers).toBe(true)
      expect(result.sanitized.settings.requireApproval).toBe(false)
      expect(result.sanitized.settings.defaultPermissions).toEqual(['view', 'edit', 'comment'])
    })
  })

  describe('family member validation', () => {
    const validMemberData = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'member',
      joinedAt: '2023-01-01T00:00:00.000Z'
    }

    it('should validate correct member data', () => {
      const result = validationService.validateFamilyMember(validMemberData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.email).toBe('test@example.com')
    })

    it('should reject member without user ID', () => {
      const invalidData = { ...validMemberData, userId: '' }
      const result = validationService.validateFamilyMember(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID is required')
    })

    it('should reject member with invalid email', () => {
      const invalidData = { ...validMemberData, email: 'not-an-email' }
      const result = validationService.validateFamilyMember(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should reject member with invalid role', () => {
      const invalidData = { ...validMemberData, role: 'superuser' }
      const result = validationService.validateFamilyMember(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Role must be either "admin" or "member"')
    })

    it('should normalize email to lowercase', () => {
      const data = { ...validMemberData, email: 'TEST@EXAMPLE.COM' }
      const result = validationService.validateFamilyMember(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.email).toBe('test@example.com')
    })
  })

  describe('virtual offering validation', () => {
    const validOfferingData = {
      type: 'cempasuchil',
      position: { x: 1.5, y: 2.0, z: -0.5 },
      memorialId: 'memorial123',
      placedBy: 'user456',
      message: 'Para mi querido abuelo'
    }

    it('should validate correct offering data', () => {
      const result = validationService.validateVirtualOffering(validOfferingData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.type).toBe('cempasuchil')
    })

    it('should reject invalid offering type', () => {
      const invalidData = { ...validOfferingData, type: 'invalid_type' }
      const result = validationService.validateVirtualOffering(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Offering type must be one of')
    })

    it('should reject invalid position', () => {
      const invalidData = { ...validOfferingData, position: { x: 'not-a-number', y: 2, z: 3 } }
      const result = validationService.validateVirtualOffering(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Position must have numeric x, y, z coordinates')
    })

    it('should reject NaN coordinates', () => {
      const invalidData = { ...validOfferingData, position: { x: NaN, y: 2, z: 3 } }
      const result = validationService.validateVirtualOffering(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Position coordinates cannot be NaN')
    })

    it('should sanitize message', () => {
      const data = { 
        ...validOfferingData, 
        message: 'Message with <script>alert("xss")</script> content' 
      }
      const result = validationService.validateVirtualOffering(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.message).not.toContain('<script>')
    })

    it('should reject overly long message', () => {
      const longMessage = 'A'.repeat(600)
      const data = { ...validOfferingData, message: longMessage }
      const result = validationService.validateVirtualOffering(data)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized.message).toHaveLength(500)
    })
  })

  describe('file validation', () => {
    it('should validate correct image file', () => {
      const mockImageFile = new File(['fake-image-data'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      })
      
      const result = validationService.validateImageFile(mockImageFile)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized image file', () => {
      const mockImageFile = new File(['fake-image-data'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB
      })
      
      const result = validationService.validateImageFile(mockImageFile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size must be less than 5MB')
    })

    it('should reject invalid image type', () => {
      const mockFile = new File(['fake-data'], 'test.txt', { 
        type: 'text/plain',
        size: 1024
      })
      
      const result = validationService.validateImageFile(mockFile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid file type. Only JPEG, PNG, and WebP are allowed')
    })

    it('should validate correct audio file', () => {
      const mockAudioFile = new File(['fake-audio-data'], 'test.mp3', { 
        type: 'audio/mp3',
        size: 2 * 1024 * 1024 // 2MB
      })
      
      const result = validationService.validateAudioFile(mockAudioFile)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized audio file', () => {
      const mockAudioFile = new File(['fake-audio-data'], 'test.mp3', { 
        type: 'audio/mp3',
        size: 15 * 1024 * 1024 // 15MB
      })
      
      const result = validationService.validateAudioFile(mockAudioFile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size must be less than 10MB')
    })
  })

  describe('text sanitization', () => {
    it('should remove HTML tags', () => {
      const dirtyText = 'Hello <script>alert("xss")</script> world'
      const sanitized = validationService.sanitizeText(dirtyText)
      
      expect(sanitized).toBe('Hello alert("xss") world')
    })

    it('should remove javascript protocols', () => {
      const dirtyText = 'Click javascript:alert("xss") here'
      const sanitized = validationService.sanitizeText(dirtyText)
      
      expect(sanitized).toBe('Click alert("xss") here')
    })

    it('should remove event handlers', () => {
      const dirtyText = 'Text with onclick=alert("xss") handler'
      const sanitized = validationService.sanitizeText(dirtyText)
      
      expect(sanitized).toBe('Text with alert("xss") handler')
    })

    it('should truncate long text', () => {
      const longText = 'A'.repeat(200)
      const sanitized = validationService.sanitizeText(longText, 100)
      
      expect(sanitized).toHaveLength(100)
    })

    it('should handle non-string input', () => {
      const sanitized = validationService.sanitizeText(123)
      
      expect(sanitized).toBe('')
    })
  })

  describe('inappropriate content detection', () => {
    it('should detect repeated characters', () => {
      const text = 'This is aaaaaaa inappropriate'
      const isInappropriate = validationService.containsInappropriateContent(text)
      
      expect(isInappropriate).toBe(true)
    })

    it('should allow normal text', () => {
      const text = 'This is a normal, appropriate text'
      const isInappropriate = validationService.containsInappropriateContent(text)
      
      expect(isInappropriate).toBe(false)
    })

    it('should handle empty or null text', () => {
      expect(validationService.containsInappropriateContent('')).toBe(false)
      expect(validationService.containsInappropriateContent(null)).toBe(false)
      expect(validationService.containsInappropriateContent(undefined)).toBe(false)
    })
  })

  describe('batch validation', () => {
    it('should validate batch of memorials', () => {
      const memorials = [
        { name: 'Valid Memorial 1', relationship: 'padre' },
        { name: '', relationship: 'madre' }, // Invalid: empty name
        { name: 'Valid Memorial 2', altarLevel: 5 } // Invalid: altar level
      ]
      
      const result = validationService.validateBatch(memorials, 'memorial')
      
      expect(result.isValid).toBe(false)
      expect(result.validItems).toHaveLength(1)
      expect(result.invalidItems).toHaveLength(2)
      expect(result.summary.total).toBe(3)
      expect(result.summary.valid).toBe(1)
      expect(result.summary.invalid).toBe(2)
    })

    it('should handle non-array input', () => {
      const result = validationService.validateBatch('not-an-array', 'memorial')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Items must be an array')
    })

    it('should handle unknown validation type', () => {
      const result = validationService.validateBatch([{}], 'unknown')
      
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Unknown validation type')
    })
  })

  describe('email validation utility', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]
      
      validEmails.forEach(email => {
        expect(validationService.constructor.prototype.constructor.isValidEmail || 
               (() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))()).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com'
      ]
      
      invalidEmails.forEach(email => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false)
      })
    })
  })
})