/**
 * Mictla Data Models and Type Definitions
 * Core data structures for the application
 */

/**
 * Memorial Entry Model
 * Represents a deceased family member's memorial
 */
export class Memorial {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.photo = data.photo || null // base64 or blob URL
    this.birthDate = data.birthDate ? new Date(data.birthDate) : null
    this.deathDate = data.deathDate ? new Date(data.deathDate) : null
    this.relationship = data.relationship || '' // "padre", "madre", "abuelo", etc.
    this.story = data.story || ''
    this.audioMessage = data.audioMessage || null // base64 audio
    this.offerings = data.offerings || [] // preferred offerings
    this.altarLevel = data.altarLevel || 1 // 1-3, which level they appear on
    
    // Family connections
    this.familyConnections = {
      parents: data.familyConnections?.parents || [], // memorial IDs
      children: data.familyConnections?.children || [], // memorial IDs
      spouse: data.familyConnections?.spouse || null // memorial ID
    }
    
    // Virtual offerings in AR
    this.virtualOfferings = {
      position: data.virtualOfferings?.position || { x: 0, y: 0, z: 0 },
      items: data.virtualOfferings?.items || [] // offering types placed
    }
    
    // Sharing configuration
    this.sharing = {
      isShared: data.sharing?.isShared || false,
      sharedWith: data.sharing?.sharedWith || [], // family member emails
      shareCode: data.sharing?.shareCode || null, // unique sharing identifier
      permissions: data.sharing?.permissions || ['view'] // "view", "edit", "comment"
    }
    
    // Metadata
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date()
    this.syncStatus = data.syncStatus || 'local' // "local", "synced", "pending"
  }

  generateId() {
    return 'memorial_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  }

  /**
   * Validate memorial data
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    const errors = []
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required')
    }
    
    if (this.name && this.name.length > 100) {
      errors.push('Name must be less than 100 characters')
    }
    
    if (this.story && this.story.length > 5000) {
      errors.push('Story must be less than 5000 characters')
    }
    
    if (this.altarLevel && (this.altarLevel < 1 || this.altarLevel > 3)) {
      errors.push('Altar level must be between 1 and 3')
    }
    
    if (this.birthDate && this.deathDate && this.birthDate > this.deathDate) {
      errors.push('Birth date cannot be after death date')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      photo: this.photo,
      birthDate: this.birthDate?.toISOString(),
      deathDate: this.deathDate?.toISOString(),
      relationship: this.relationship,
      story: this.story,
      audioMessage: this.audioMessage,
      offerings: this.offerings,
      altarLevel: this.altarLevel,
      familyConnections: this.familyConnections,
      virtualOfferings: this.virtualOfferings,
      sharing: this.sharing,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      syncStatus: this.syncStatus
    }
  }
}

/**
 * Family Group Model
 * Represents a family sharing group
 */
export class FamilyGroup {
  constructor(data = {}) {
    this.groupId = data.groupId || this.generateId()
    this.name = data.name || '' // "Familia García"
    this.members = (data.members || []).map(member => ({
      userId: member.userId,
      email: member.email,
      role: member.role || 'member', // "admin" | "member"
      joinedAt: member.joinedAt ? new Date(member.joinedAt) : new Date()
    }))
    this.sharedMemorials = data.sharedMemorials || [] // memorial IDs
    this.inviteCode = data.inviteCode || this.generateInviteCode()
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    
    this.settings = {
      allowNewMembers: data.settings?.allowNewMembers ?? true,
      requireApproval: data.settings?.requireApproval ?? false,
      defaultPermissions: data.settings?.defaultPermissions || ['view']
    }
  }

  generateId() {
    return 'family_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  }

  generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  /**
   * Add member to family group
   * @param {Object} member - Member data
   */
  addMember(member) {
    const newMember = {
      userId: member.userId,
      email: member.email,
      role: member.role || 'member',
      joinedAt: new Date()
    }
    this.members.push(newMember)
  }

  /**
   * Remove member from family group
   * @param {string} userId - User ID to remove
   */
  removeMember(userId) {
    this.members = this.members.filter(member => member.userId !== userId)
  }

  /**
   * Check if user is admin
   * @param {string} userId - User ID to check
   * @returns {boolean} True if user is admin
   */
  isAdmin(userId) {
    const member = this.members.find(m => m.userId === userId)
    return member?.role === 'admin'
  }

  /**
   * Validate family group data
   * @returns {Object} Validation result
   */
  validate() {
    const errors = []
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Family name is required')
    }
    
    if (this.members.length === 0) {
      errors.push('Family group must have at least one member')
    }
    
    const adminCount = this.members.filter(m => m.role === 'admin').length
    if (adminCount === 0) {
      errors.push('Family group must have at least one admin')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      groupId: this.groupId,
      name: this.name,
      members: this.members.map(member => ({
        ...member,
        joinedAt: member.joinedAt.toISOString()
      })),
      sharedMemorials: this.sharedMemorials,
      inviteCode: this.inviteCode,
      createdAt: this.createdAt.toISOString(),
      settings: this.settings
    }
  }
}

/**
 * Virtual Offering Model
 * Represents offerings placed in AR altar
 */
export class VirtualOffering {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.type = data.type || 'cempasuchil' // "cempasuchil" | "pan_de_muerto" | "agua" | "sal" | "foto" | "vela"
    this.position = data.position || { x: 0, y: 0, z: 0 }
    this.memorialId = data.memorialId || null // which memorial it's for
    this.placedBy = data.placedBy || null // user ID
    this.message = data.message || '' // optional dedication
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
  }

  generateId() {
    return 'offering_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  }

  /**
   * Validate offering data
   * @returns {Object} Validation result
   */
  validate() {
    const errors = []
    const validTypes = ['cempasuchil', 'pan_de_muerto', 'agua', 'sal', 'foto', 'vela']
    
    if (!validTypes.includes(this.type)) {
      errors.push('Invalid offering type')
    }
    
    if (!this.position || typeof this.position.x !== 'number' || 
        typeof this.position.y !== 'number' || typeof this.position.z !== 'number') {
      errors.push('Position must have valid x, y, z coordinates')
    }
    
    if (this.message && this.message.length > 500) {
      errors.push('Message must be less than 500 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      memorialId: this.memorialId,
      placedBy: this.placedBy,
      message: this.message,
      createdAt: this.createdAt.toISOString()
    }
  }
}

/**
 * Altar Level Model
 * Represents the three levels of the altar
 */
export class AltarLevel {
  constructor(data = {}) {
    this.level = data.level || 1 // 1, 2, or 3
    this.name = data.name || this.getDefaultName(data.level)
    this.description = data.description || ''
    this.traditionalOfferings = data.traditionalOfferings || []
    this.culturalSignificance = data.culturalSignificance || ''
    this.cocoReference = data.cocoReference || '' // connection to movie themes
    this.memorials = data.memorials || [] // memorial IDs placed on this level
  }

  getDefaultName(level) {
    const names = {
      1: 'Nivel Terrenal',
      2: 'Nivel Purgatorio', 
      3: 'Nivel Celestial'
    }
    return names[level || 1] || 'Nivel Terrenal'
  }

  /**
   * Add memorial to this level
   * @param {string} memorialId - Memorial ID to add
   */
  addMemorial(memorialId) {
    if (!this.memorials.includes(memorialId)) {
      this.memorials.push(memorialId)
    }
  }

  /**
   * Remove memorial from this level
   * @param {string} memorialId - Memorial ID to remove
   */
  removeMemorial(memorialId) {
    this.memorials = this.memorials.filter(id => id !== memorialId)
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      level: this.level,
      name: this.name,
      description: this.description,
      traditionalOfferings: this.traditionalOfferings,
      culturalSignificance: this.culturalSignificance,
      cocoReference: this.cocoReference,
      memorials: this.memorials
    }
  }
}

// Export validation utilities
export const ValidationUtils = {
  /**
   * Sanitize text input to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') return ''
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags completely
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    const errors = []
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (!file) {
      errors.push('No file provided')
      return { isValid: false, errors }
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed')
    }
    
    if (file.size && file.size > maxSize) {
      errors.push('File size must be less than 5MB')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate audio file
   * @param {File} file - Audio file to validate
   * @returns {Object} Validation result
   */
  validateAudioFile(file) {
    const errors = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
    
    if (!file) {
      errors.push('No file provided')
      return { isValid: false, errors }
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only MP3, WAV, OGG, and WebM are allowed')
    }
    
    if (file.size && file.size > maxSize) {
      errors.push('File size must be less than 10MB')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}