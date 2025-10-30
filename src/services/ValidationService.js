/**
 * Mictla Validation Service
 * Handles data validation and sanitization for security and data integrity
 */

import { ValidationUtils } from '../types/index.js'

export class ValidationService {
  constructor() {
    // Cultural sensitivity filters
    this.inappropriateWords = [
      // Add inappropriate words that should be filtered
      // This would be expanded based on cultural guidelines
    ]
    
    // Maximum lengths for different content types
    this.maxLengths = {
      name: 100,
      story: 5000,
      message: 500,
      familyName: 100,
      relationship: 50
    }
    
    // File size limits (in bytes)
    this.fileLimits = {
      image: 5 * 1024 * 1024, // 5MB
      audio: 10 * 1024 * 1024 // 10MB
    }
  }

  /**
   * Validate and sanitize memorial data
   * @param {Object} memorialData - Raw memorial data
   * @returns {Object} Validation result with sanitized data
   */
  validateMemorial(memorialData) {
    const errors = []
    const sanitized = {}
    
    // Validate and sanitize name
    if (!memorialData.name || typeof memorialData.name !== 'string') {
      errors.push('Name is required and must be text')
    } else {
      sanitized.name = this.sanitizeText(memorialData.name, this.maxLengths.name)
      if (sanitized.name.length === 0) {
        errors.push('Name cannot be empty after sanitization')
      }
    }
    
    // Validate and sanitize story
    if (memorialData.story) {
      if (memorialData.story.length > this.maxLengths.story) {
        errors.push(`Story must be less than ${this.maxLengths.story} characters`)
      } else {
        sanitized.story = this.sanitizeText(memorialData.story, this.maxLengths.story)
        if (this.containsInappropriateContent(sanitized.story)) {
          errors.push('Story contains inappropriate content')
        }
      }
    }
    
    // Validate and sanitize relationship
    if (memorialData.relationship) {
      sanitized.relationship = this.sanitizeText(memorialData.relationship, this.maxLengths.relationship)
    }
    
    // Validate dates
    if (memorialData.birthDate) {
      const birthDate = new Date(memorialData.birthDate)
      if (isNaN(birthDate.getTime())) {
        errors.push('Invalid birth date format')
      } else if (birthDate > new Date()) {
        errors.push('Birth date cannot be in the future')
      } else {
        sanitized.birthDate = birthDate
      }
    }
    
    if (memorialData.deathDate) {
      const deathDate = new Date(memorialData.deathDate)
      if (isNaN(deathDate.getTime())) {
        errors.push('Invalid death date format')
      } else if (deathDate > new Date()) {
        errors.push('Death date cannot be in the future')
      } else {
        sanitized.deathDate = deathDate
      }
    }
    
    // Validate birth and death date relationship
    if (sanitized.birthDate && sanitized.deathDate && sanitized.birthDate > sanitized.deathDate) {
      errors.push('Birth date cannot be after death date')
    }
    
    // Validate altar level
    if (memorialData.altarLevel !== undefined) {
      const level = parseInt(memorialData.altarLevel)
      if (isNaN(level) || level < 1 || level > 3) {
        errors.push('Altar level must be 1, 2, or 3')
      } else {
        sanitized.altarLevel = level
      }
    }
    
    // Validate offerings array
    if (memorialData.offerings) {
      if (!Array.isArray(memorialData.offerings)) {
        errors.push('Offerings must be an array')
      } else {
        sanitized.offerings = memorialData.offerings
          .filter(offering => typeof offering === 'string')
          .map(offering => this.sanitizeText(offering, 50))
          .filter(offering => offering.length > 0)
      }
    }
    
    // Validate family connections
    if (memorialData.familyConnections) {
      sanitized.familyConnections = this.validateFamilyConnections(memorialData.familyConnections)
    }
    
    // Validate virtual offerings
    if (memorialData.virtualOfferings) {
      const voValidation = this.validateVirtualOfferingsData(memorialData.virtualOfferings)
      if (voValidation.errors.length > 0) {
        errors.push(...voValidation.errors)
      } else {
        sanitized.virtualOfferings = voValidation.sanitized
      }
    }
    
    // Validate sharing settings
    if (memorialData.sharing) {
      const sharingValidation = this.validateSharingData(memorialData.sharing)
      if (sharingValidation.errors.length > 0) {
        errors.push(...sharingValidation.errors)
      } else {
        sanitized.sharing = sharingValidation.sanitized
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? { ...memorialData, ...sanitized } : null
    }
  }

  /**
   * Validate family group data
   * @param {Object} familyData - Raw family group data
   * @returns {Object} Validation result
   */
  validateFamilyGroup(familyData) {
    const errors = []
    const sanitized = {}
    
    // Validate and sanitize family name
    if (!familyData.name || typeof familyData.name !== 'string') {
      errors.push('Family name is required')
    } else {
      sanitized.name = this.sanitizeText(familyData.name, this.maxLengths.familyName)
      if (sanitized.name.length === 0) {
        errors.push('Family name cannot be empty after sanitization')
      }
    }
    
    // Validate members array
    if (!familyData.members || !Array.isArray(familyData.members)) {
      errors.push('Members array is required')
    } else if (familyData.members.length === 0) {
      errors.push('Family must have at least one member')
    } else {
      sanitized.members = []
      let hasAdmin = false
      
      for (const member of familyData.members) {
        const memberValidation = this.validateFamilyMember(member)
        if (memberValidation.errors.length > 0) {
          errors.push(...memberValidation.errors.map(err => `Member validation: ${err}`))
        } else {
          sanitized.members.push(memberValidation.sanitized)
          if (memberValidation.sanitized.role === 'admin') {
            hasAdmin = true
          }
        }
      }
      
      if (!hasAdmin) {
        errors.push('Family must have at least one admin member')
      }
    }
    
    // Validate shared memorials
    if (familyData.sharedMemorials) {
      if (!Array.isArray(familyData.sharedMemorials)) {
        errors.push('Shared memorials must be an array')
      } else {
        sanitized.sharedMemorials = familyData.sharedMemorials.filter(id => 
          typeof id === 'string' && id.length > 0
        )
      }
    }
    
    // Validate settings
    if (familyData.settings) {
      sanitized.settings = {
        allowNewMembers: Boolean(familyData.settings.allowNewMembers),
        requireApproval: Boolean(familyData.settings.requireApproval),
        defaultPermissions: Array.isArray(familyData.settings.defaultPermissions) 
          ? familyData.settings.defaultPermissions.filter(p => ['view', 'edit', 'comment'].includes(p))
          : ['view']
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? { ...familyData, ...sanitized } : null
    }
  }

  /**
   * Validate family member data
   * @param {Object} memberData - Raw member data
   * @returns {Object} Validation result
   */
  validateFamilyMember(memberData) {
    const errors = []
    const sanitized = {}
    
    // Validate user ID
    if (!memberData.userId || typeof memberData.userId !== 'string') {
      errors.push('User ID is required')
    } else {
      sanitized.userId = memberData.userId.trim()
    }
    
    // Validate email
    if (!memberData.email || typeof memberData.email !== 'string') {
      errors.push('Email is required')
    } else if (!ValidationUtils.isValidEmail(memberData.email)) {
      errors.push('Invalid email format')
    } else {
      sanitized.email = memberData.email.toLowerCase().trim()
    }
    
    // Validate role
    if (!memberData.role || !['admin', 'member'].includes(memberData.role)) {
      errors.push('Role must be either "admin" or "member"')
    } else {
      sanitized.role = memberData.role
    }
    
    // Validate join date
    if (memberData.joinedAt) {
      const joinDate = new Date(memberData.joinedAt)
      if (isNaN(joinDate.getTime())) {
        errors.push('Invalid join date format')
      } else {
        sanitized.joinedAt = joinDate
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null
    }
  }

  /**
   * Validate virtual offering data
   * @param {Object} offeringData - Raw offering data
   * @returns {Object} Validation result
   */
  validateVirtualOffering(offeringData) {
    const errors = []
    const sanitized = {}
    
    // Validate offering type
    const validTypes = ['cempasuchil', 'pan_de_muerto', 'agua', 'sal', 'foto', 'vela']
    if (!offeringData.type || !validTypes.includes(offeringData.type)) {
      errors.push(`Offering type must be one of: ${validTypes.join(', ')}`)
    } else {
      sanitized.type = offeringData.type
    }
    
    // Validate position
    if (!offeringData.position || typeof offeringData.position !== 'object') {
      errors.push('Position is required and must be an object')
    } else {
      const { x, y, z } = offeringData.position
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        errors.push('Position must have numeric x, y, z coordinates')
      } else if (isNaN(x) || isNaN(y) || isNaN(z)) {
        errors.push('Position coordinates cannot be NaN')
      } else {
        sanitized.position = { x, y, z }
      }
    }
    
    // Validate memorial ID
    if (offeringData.memorialId && typeof offeringData.memorialId !== 'string') {
      errors.push('Memorial ID must be a string')
    } else if (offeringData.memorialId) {
      sanitized.memorialId = offeringData.memorialId.trim()
    }
    
    // Validate placed by user ID
    if (offeringData.placedBy && typeof offeringData.placedBy !== 'string') {
      errors.push('Placed by user ID must be a string')
    } else if (offeringData.placedBy) {
      sanitized.placedBy = offeringData.placedBy.trim()
    }
    
    // Validate and sanitize message
    if (offeringData.message) {
      if (offeringData.message.length > this.maxLengths.message) {
        errors.push(`Message must be less than ${this.maxLengths.message} characters`)
      } else {
        sanitized.message = this.sanitizeText(offeringData.message, this.maxLengths.message)
        if (this.containsInappropriateContent(sanitized.message)) {
          errors.push('Message contains inappropriate content')
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? { ...offeringData, ...sanitized } : null
    }
  }

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    return ValidationUtils.validateImageFile(file)
  }

  /**
   * Validate audio file
   * @param {File} file - Audio file to validate
   * @returns {Object} Validation result
   */
  validateAudioFile(file) {
    return ValidationUtils.validateAudioFile(file)
  }

  /**
   * Sanitize text input
   * @param {string} text - Text to sanitize
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized text
   */
  sanitizeText(text, maxLength = 1000) {
    if (typeof text !== 'string') return ''
    
    let sanitized = ValidationUtils.sanitizeText(text)
    
    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).trim()
    }
    
    return sanitized
  }

  /**
   * Check if text contains inappropriate content
   * @param {string} text - Text to check
   * @returns {boolean} True if inappropriate content found
   */
  containsInappropriateContent(text) {
    if (!text || typeof text !== 'string') return false
    
    const lowerText = text.toLowerCase()
    
    // Check against inappropriate words list
    for (const word of this.inappropriateWords) {
      if (lowerText.includes(word.toLowerCase())) {
        return true
      }
    }
    
    // Check for excessive profanity patterns
    const profanityPattern = /(.)\1{4,}/g // Repeated characters (like "aaaaa")
    if (profanityPattern.test(lowerText)) {
      return true
    }
    
    return false
  }

  /**
   * Validate family connections data
   * @param {Object} connections - Family connections data
   * @returns {Object} Sanitized connections
   */
  validateFamilyConnections(connections) {
    const sanitized = {
      parents: [],
      children: [],
      spouse: null
    }
    
    if (connections.parents && Array.isArray(connections.parents)) {
      sanitized.parents = connections.parents
        .filter(id => typeof id === 'string' && id.length > 0)
        .map(id => id.trim())
    }
    
    if (connections.children && Array.isArray(connections.children)) {
      sanitized.children = connections.children
        .filter(id => typeof id === 'string' && id.length > 0)
        .map(id => id.trim())
    }
    
    if (connections.spouse && typeof connections.spouse === 'string') {
      sanitized.spouse = connections.spouse.trim()
    }
    
    return sanitized
  }

  /**
   * Validate virtual offerings data structure
   * @param {Object} virtualOfferings - Virtual offerings data
   * @returns {Object} Validation result
   */
  validateVirtualOfferingsData(virtualOfferings) {
    const errors = []
    const sanitized = {
      position: { x: 0, y: 0, z: 0 },
      items: []
    }
    
    if (virtualOfferings.position) {
      const { x, y, z } = virtualOfferings.position
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          sanitized.position = { x, y, z }
        } else {
          errors.push('Virtual offering position coordinates cannot be NaN')
        }
      } else {
        errors.push('Virtual offering position must have numeric x, y, z coordinates')
      }
    }
    
    if (virtualOfferings.items && Array.isArray(virtualOfferings.items)) {
      const validTypes = ['cempasuchil', 'pan_de_muerto', 'agua', 'sal', 'foto', 'vela']
      sanitized.items = virtualOfferings.items
        .filter(item => typeof item === 'string' && validTypes.includes(item))
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  /**
   * Validate sharing data
   * @param {Object} sharing - Sharing data
   * @returns {Object} Validation result
   */
  validateSharingData(sharing) {
    const errors = []
    const sanitized = {
      isShared: false,
      sharedWith: [],
      shareCode: null,
      permissions: ['view']
    }
    
    if (typeof sharing.isShared === 'boolean') {
      sanitized.isShared = sharing.isShared
    }
    
    if (sharing.sharedWith && Array.isArray(sharing.sharedWith)) {
      sanitized.sharedWith = sharing.sharedWith
        .filter(email => typeof email === 'string' && ValidationUtils.isValidEmail(email))
        .map(email => email.toLowerCase().trim())
    }
    
    if (sharing.shareCode && typeof sharing.shareCode === 'string') {
      sanitized.shareCode = sharing.shareCode.trim()
    }
    
    if (sharing.permissions && Array.isArray(sharing.permissions)) {
      const validPermissions = ['view', 'edit', 'comment']
      sanitized.permissions = sharing.permissions
        .filter(perm => validPermissions.includes(perm))
      
      if (sanitized.permissions.length === 0) {
        sanitized.permissions = ['view']
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }

  /**
   * Validate batch operation data
   * @param {Array} items - Array of items to validate
   * @param {string} type - Type of items ('memorial', 'familyGroup', 'virtualOffering')
   * @returns {Object} Batch validation result
   */
  validateBatch(items, type) {
    if (!Array.isArray(items)) {
      return {
        isValid: false,
        errors: ['Items must be an array'],
        validItems: [],
        invalidItems: []
      }
    }
    
    const validItems = []
    const invalidItems = []
    const allErrors = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      let validation
      
      switch (type) {
        case 'memorial':
          validation = this.validateMemorial(item)
          break
        case 'familyGroup':
          validation = this.validateFamilyGroup(item)
          break
        case 'virtualOffering':
          validation = this.validateVirtualOffering(item)
          break
        default:
          validation = { isValid: false, errors: ['Unknown validation type'] }
      }
      
      if (validation.isValid) {
        validItems.push(validation.sanitized)
      } else {
        invalidItems.push({
          index: i,
          item,
          errors: validation.errors
        })
        allErrors.push(...validation.errors.map(err => `Item ${i}: ${err}`))
      }
    }
    
    return {
      isValid: invalidItems.length === 0,
      errors: allErrors,
      validItems,
      invalidItems,
      summary: {
        total: items.length,
        valid: validItems.length,
        invalid: invalidItems.length
      }
    }
  }
}

// Create singleton instance
export const validationService = new ValidationService()