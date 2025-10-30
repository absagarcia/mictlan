/**
 * Mictla Family Sharing Component
 * Handles family collaboration, invites, and cross-device synchronization
 */

import { FamilyGroup } from '../../types/index.js'
import { storageManager } from '../../services/StorageManager.js'
import { validationService } from '../../services/ValidationService.js'
import { appState } from '../../state/AppState.js'

export class FamilySharingComponent {
  constructor(container) {
    this.container = container
    this.currentFamilyGroup = null
    this.syncInProgress = false
    
    // Initialize storage
    this.initializeStorage()
    
    // Bind methods
    this.handleCreateFamily = this.handleCreateFamily.bind(this)
    this.handleJoinFamily = this.handleJoinFamily.bind(this)
    this.handleInviteMember = this.handleInviteMember.bind(this)
    this.handleShareMemorial = this.handleShareMemorial.bind(this)
    this.handleSyncMemorials = this.handleSyncMemorials.bind(this)
    
    // Initialize component
    this.init()
  }

  async initializeStorage() {
    try {
      await storageManager.init()
      await this.loadFamilyGroup()
    } catch (error) {
      console.error('Failed to initialize family sharing storage:', error)
      this.showError('Error al inicializar el sistema de compartir familiar')
    }
  }

  init() {
    this.render()
    this.attachEventListeners()
  }

  render() {
    this.container.innerHTML = `
      <div class="family-sharing">
        <header class="family-sharing-header">
          <h2>Compartir en Familia</h2>
          <div class="sync-status" id="sync-status">
            <span class="sync-indicator" id="sync-indicator"></span>
            <span class="sync-text" id="sync-text">Sincronizado</span>
          </div>
        </header>
        
        <div class="family-sharing-content">
          <!-- No Family State -->
          <div class="no-family-state" id="no-family-state">
            <div class="no-family-icon">👨‍👩‍👧‍👦</div>
            <h3>Conecta con tu Familia</h3>
            <p>Crea un grupo familiar para compartir memorias y colaborar en el altar de muertos</p>
            
            <div class="family-actions">
              <button class="btn-primary" id="create-family-btn">
                <span class="icon">+</span>
                Crear Grupo Familiar
              </button>
              <button class="btn-secondary" id="join-family-btn">
                <span class="icon">🔗</span>
                Unirse a Familia
              </button>
            </div>
          </div>
          
          <!-- Family Dashboard -->
          <div class="family-dashboard" id="family-dashboard" style="display: none;">
            <div class="family-info">
              <div class="family-header">
                <h3 id="family-name">Mi Familia</h3>
                <div class="family-code">
                  <label>Código de invitación:</label>
                  <div class="code-display">
                    <span id="invite-code">ABCD1234</span>
                    <button class="btn-copy" id="copy-code-btn" title="Copiar código">📋</button>
                  </div>
                </div>
              </div>
              
              <div class="family-stats">
                <div class="stat-item">
                  <span class="stat-number" id="member-count">0</span>
                  <span class="stat-label">Miembros</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="shared-memorial-count">0</span>
                  <span class="stat-label">Memorias Compartidas</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="last-sync-time">Nunca</span>
                  <span class="stat-label">Última Sincronización</span>
                </div>
              </div>
            </div>
            
            <!-- Family Members -->
            <div class="family-members">
              <div class="section-header">
                <h4>Miembros de la Familia</h4>
                <button class="btn-secondary btn-small" id="invite-member-btn">
                  <span class="icon">✉️</span>
                  Invitar Miembro
                </button>
              </div>
              <div class="members-list" id="members-list"></div>
            </div>
            
            <!-- Shared Memorials -->
            <div class="shared-memorials">
              <div class="section-header">
                <h4>Memorias Compartidas</h4>
                <button class="btn-secondary btn-small" id="share-memorial-btn">
                  <span class="icon">📤</span>
                  Compartir Memoria
                </button>
              </div>
              <div class="shared-memorials-list" id="shared-memorials-list"></div>
            </div>
            
            <!-- Sync Controls -->
            <div class="sync-controls">
              <div class="section-header">
                <h4>Sincronización</h4>
                <div class="sync-actions">
                  <button class="btn-primary btn-small" id="sync-now-btn">
                    <span class="icon">🔄</span>
                    Sincronizar Ahora
                  </button>
                  <button class="btn-secondary btn-small" id="sync-settings-btn">
                    <span class="icon">⚙️</span>
                    Configuración
                  </button>
                </div>
              </div>
              
              <div class="sync-info">
                <div class="sync-option">
                  <label>
                    <input type="checkbox" id="auto-sync-checkbox" checked>
                    Sincronización automática
                  </label>
                </div>
                <div class="sync-option">
                  <label>
                    Resolución de conflictos:
                    <select id="conflict-resolution-select">
                      <option value="manual">Manual</option>
                      <option value="local">Preferir local</option>
                      <option value="remote">Preferir remoto</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Family Settings -->
            <div class="family-settings">
              <div class="section-header">
                <h4>Configuración del Grupo</h4>
              </div>
              
              <div class="settings-grid">
                <div class="setting-item">
                  <label>
                    <input type="checkbox" id="allow-new-members-checkbox">
                    Permitir nuevos miembros
                  </label>
                </div>
                <div class="setting-item">
                  <label>
                    <input type="checkbox" id="require-approval-checkbox">
                    Requerir aprobación para unirse
                  </label>
                </div>
              </div>
              
              <div class="danger-zone">
                <h5>Zona de Peligro</h5>
                <button class="btn-danger btn-small" id="leave-family-btn">
                  Abandonar Familia
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modals -->
        <div class="modal-container" id="modal-container"></div>
        
        <!-- Messages -->
        <div class="message-container" id="message-container"></div>
      </div>
    `
  }

  attachEventListeners() {
    // Main action buttons
    document.getElementById('create-family-btn').addEventListener('click', this.showCreateFamilyModal)
    document.getElementById('join-family-btn').addEventListener('click', this.showJoinFamilyModal)
    
    // Family dashboard actions
    document.getElementById('copy-code-btn').addEventListener('click', this.copyInviteCode)
    document.getElementById('invite-member-btn').addEventListener('click', this.showInviteMemberModal)
    document.getElementById('share-memorial-btn').addEventListener('click', this.showShareMemorialModal)
    document.getElementById('sync-now-btn').addEventListener('click', this.handleSyncMemorials)
    document.getElementById('sync-settings-btn').addEventListener('click', this.showSyncSettingsModal)
    document.getElementById('leave-family-btn').addEventListener('click', this.handleLeaveFamily)
    
    // Settings
    document.getElementById('auto-sync-checkbox').addEventListener('change', this.handleAutoSyncToggle)
    document.getElementById('conflict-resolution-select').addEventListener('change', this.handleConflictResolutionChange)
    document.getElementById('allow-new-members-checkbox').addEventListener('change', this.handleFamilySettingChange)
    document.getElementById('require-approval-checkbox').addEventListener('change', this.handleFamilySettingChange)
  }

  async loadFamilyGroup() {
    try {
      const userId = appState.get('user.userId')
      const familyGroupId = appState.get('user.familyGroup.groupId')
      
      if (familyGroupId) {
        this.currentFamilyGroup = await storageManager.getFamilyGroup(familyGroupId)
        if (this.currentFamilyGroup) {
          this.showFamilyDashboard()
        } else {
          this.showNoFamilyState()
        }
      } else {
        this.showNoFamilyState()
      }
    } catch (error) {
      console.error('Failed to load family group:', error)
      this.showNoFamilyState()
    }
  }

  showNoFamilyState() {
    document.getElementById('no-family-state').style.display = 'block'
    document.getElementById('family-dashboard').style.display = 'none'
  }

  showFamilyDashboard() {
    document.getElementById('no-family-state').style.display = 'none'
    document.getElementById('family-dashboard').style.display = 'block'
    
    this.updateFamilyInfo()
    this.updateMembersList()
    this.updateSharedMemorialsList()
    this.updateSyncStatus()
  }

  updateFamilyInfo() {
    if (!this.currentFamilyGroup) return
    
    document.getElementById('family-name').textContent = this.currentFamilyGroup.name
    document.getElementById('invite-code').textContent = this.currentFamilyGroup.inviteCode
    document.getElementById('member-count').textContent = this.currentFamilyGroup.members.length
    document.getElementById('shared-memorial-count').textContent = this.currentFamilyGroup.sharedMemorials.length
    
    // Update settings
    document.getElementById('allow-new-members-checkbox').checked = this.currentFamilyGroup.settings.allowNewMembers
    document.getElementById('require-approval-checkbox').checked = this.currentFamilyGroup.settings.requireApproval
  }

  updateMembersList() {
    if (!this.currentFamilyGroup) return
    
    const membersList = document.getElementById('members-list')
    const currentUserId = appState.get('user.userId')
    
    membersList.innerHTML = this.currentFamilyGroup.members.map(member => `
      <div class="member-item ${member.userId === currentUserId ? 'current-user' : ''}">
        <div class="member-info">
          <div class="member-avatar">
            ${member.email.charAt(0).toUpperCase()}
          </div>
          <div class="member-details">
            <div class="member-email">${member.email}</div>
            <div class="member-role ${member.role}">
              ${member.role === 'admin' ? 'Administrador' : 'Miembro'}
              ${member.userId === currentUserId ? ' (Tú)' : ''}
            </div>
            <div class="member-joined">
              Se unió: ${new Date(member.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        ${this.canManageMember(member) ? `
          <div class="member-actions">
            <button class="btn-icon" onclick="this.changeMemberRole('${member.userId}')" title="Cambiar rol">
              <span class="icon">👑</span>
            </button>
            <button class="btn-icon btn-danger" onclick="this.removeMember('${member.userId}')" title="Remover">
              <span class="icon">🗑</span>
            </button>
          </div>
        ` : ''}
      </div>
    `).join('')
  }

  updateSharedMemorialsList() {
    if (!this.currentFamilyGroup) return
    
    const sharedList = document.getElementById('shared-memorials-list')
    
    // Get shared memorials from storage
    this.getSharedMemorials().then(memorials => {
      if (memorials.length === 0) {
        sharedList.innerHTML = `
          <div class="empty-shared-memorials">
            <p>No hay memorias compartidas aún</p>
            <button class="btn-primary btn-small" onclick="this.showShareMemorialModal()">
              Compartir Primera Memoria
            </button>
          </div>
        `
      } else {
        sharedList.innerHTML = memorials.map(memorial => `
          <div class="shared-memorial-item" data-memorial-id="${memorial.id}">
            <div class="memorial-preview">
              ${memorial.photo ? `
                <img src="${memorial.photo}" alt="${memorial.name}" class="memorial-thumb">
              ` : `
                <div class="memorial-placeholder">📷</div>
              `}
            </div>
            
            <div class="memorial-info">
              <h5>${memorial.name}</h5>
              <p>${memorial.relationship || 'Ser querido'}</p>
              <div class="sharing-info">
                <span class="shared-with">
                  Compartido con ${memorial.sharing.sharedWith.length} miembros
                </span>
                <div class="permissions">
                  ${memorial.sharing.permissions.map(perm => `
                    <span class="permission-badge">${this.getPermissionLabel(perm)}</span>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <div class="memorial-actions">
              <button class="btn-icon" onclick="this.editMemorialSharing('${memorial.id}')" title="Editar compartir">
                <span class="icon">✏️</span>
              </button>
              <button class="btn-icon" onclick="this.stopSharingMemorial('${memorial.id}')" title="Dejar de compartir">
                <span class="icon">🚫</span>
              </button>
            </div>
          </div>
        `).join('')
      }
    })
  }

  updateSyncStatus() {
    const syncStatus = appState.get('sync.status')
    const lastSync = appState.get('sync.lastSync')
    
    const indicator = document.getElementById('sync-indicator')
    const text = document.getElementById('sync-text')
    const lastSyncTime = document.getElementById('last-sync-time')
    
    switch (syncStatus) {
      case 'syncing':
        indicator.className = 'sync-indicator syncing'
        text.textContent = 'Sincronizando...'
        break
      case 'error':
        indicator.className = 'sync-indicator error'
        text.textContent = 'Error de sincronización'
        break
      default:
        indicator.className = 'sync-indicator synced'
        text.textContent = 'Sincronizado'
    }
    
    if (lastSync) {
      lastSyncTime.textContent = new Date(lastSync).toLocaleString()
    }
  }

  // Modal methods
  showCreateFamilyModal = () => {
    const modalHtml = `
      <div class="modal-overlay" id="create-family-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Crear Grupo Familiar</h3>
            <button class="btn-close" onclick="this.closeModal('create-family-modal')">&times;</button>
          </div>
          
          <form class="modal-body" id="create-family-form">
            <div class="form-group">
              <label for="family-name-input">Nombre de la Familia *</label>
              <input type="text" id="family-name-input" name="familyName" required maxlength="100" 
                placeholder="Ej: Familia García">
              <div class="field-error" id="family-name-error"></div>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="allow-new-members-input" checked>
                Permitir que nuevos miembros se unan
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="require-approval-input">
                Requerir aprobación para nuevos miembros
              </label>
            </div>
          </form>
          
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closeModal('create-family-modal')">Cancelar</button>
            <button class="btn-primary" onclick="this.handleCreateFamily()">Crear Familia</button>
          </div>
        </div>
      </div>
    `
    
    document.getElementById('modal-container').innerHTML = modalHtml
  }

  showJoinFamilyModal = () => {
    const modalHtml = `
      <div class="modal-overlay" id="join-family-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Unirse a Familia</h3>
            <button class="btn-close" onclick="this.closeModal('join-family-modal')">&times;</button>
          </div>
          
          <form class="modal-body" id="join-family-form">
            <div class="form-group">
              <label for="invite-code-input">Código de Invitación *</label>
              <input type="text" id="invite-code-input" name="inviteCode" required 
                placeholder="Ej: ABCD1234" style="text-transform: uppercase;">
              <div class="field-error" id="invite-code-error"></div>
            </div>
            
            <div class="form-group">
              <label for="member-email-input">Tu Email *</label>
              <input type="email" id="member-email-input" name="memberEmail" required 
                placeholder="tu@email.com">
              <div class="field-error" id="member-email-error"></div>
            </div>
          </form>
          
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closeModal('join-family-modal')">Cancelar</button>
            <button class="btn-primary" onclick="this.handleJoinFamily()">Unirse</button>
          </div>
        </div>
      </div>
    `
    
    document.getElementById('modal-container').innerHTML = modalHtml
  }

  showInviteMemberModal = () => {
    const modalHtml = `
      <div class="modal-overlay" id="invite-member-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Invitar Miembro</h3>
            <button class="btn-close" onclick="this.closeModal('invite-member-modal')">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="invite-options">
              <div class="invite-option">
                <h4>Compartir Código de Invitación</h4>
                <div class="code-share">
                  <div class="code-display-large">
                    <span id="modal-invite-code">${this.currentFamilyGroup?.inviteCode || ''}</span>
                    <button class="btn-copy" onclick="this.copyInviteCode()">Copiar</button>
                  </div>
                  <p>Comparte este código con familiares para que se unan al grupo</p>
                </div>
              </div>
              
              <div class="invite-option">
                <h4>Enviar Invitación por Email</h4>
                <form id="email-invite-form">
                  <div class="form-group">
                    <label for="invite-email-input">Email del familiar</label>
                    <input type="email" id="invite-email-input" name="inviteEmail" 
                      placeholder="familiar@email.com">
                  </div>
                  <div class="form-group">
                    <label for="invite-message-input">Mensaje personal (opcional)</label>
                    <textarea id="invite-message-input" name="inviteMessage" rows="3" 
                      placeholder="Te invito a unirte a nuestro libro de memorias familiar..."></textarea>
                  </div>
                  <button type="button" class="btn-primary" onclick="this.sendEmailInvite()">
                    Enviar Invitación
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closeModal('invite-member-modal')">Cerrar</button>
          </div>
        </div>
      </div>
    `
    
    document.getElementById('modal-container').innerHTML = modalHtml
  }

  showShareMemorialModal = async () => {
    try {
      const memorials = await storageManager.getMemorials()
      const unsharedMemorials = memorials.filter(m => !m.sharing.isShared)
      
      const modalHtml = `
        <div class="modal-overlay" id="share-memorial-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Compartir Memoria</h3>
              <button class="btn-close" onclick="this.closeModal('share-memorial-modal')">&times;</button>
            </div>
            
            <div class="modal-body">
              ${unsharedMemorials.length === 0 ? `
                <div class="no-memorials">
                  <p>No hay memorias disponibles para compartir</p>
                  <p>Crea una memoria primero para poder compartirla con tu familia</p>
                </div>
              ` : `
                <div class="memorial-selection">
                  <h4>Selecciona la memoria a compartir:</h4>
                  <div class="memorial-options">
                    ${unsharedMemorials.map(memorial => `
                      <div class="memorial-option" data-memorial-id="${memorial.id}">
                        <label>
                          <input type="radio" name="selected-memorial" value="${memorial.id}">
                          <div class="memorial-preview">
                            ${memorial.photo ? `
                              <img src="${memorial.photo}" alt="${memorial.name}">
                            ` : `
                              <div class="memorial-placeholder">📷</div>
                            `}
                            <div class="memorial-details">
                              <h5>${memorial.name}</h5>
                              <p>${memorial.relationship || 'Ser querido'}</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <div class="sharing-permissions">
                  <h4>Permisos de compartir:</h4>
                  <div class="permission-options">
                    <label>
                      <input type="checkbox" name="permission" value="view" checked disabled>
                      Ver memoria (siempre incluido)
                    </label>
                    <label>
                      <input type="checkbox" name="permission" value="edit">
                      Editar memoria
                    </label>
                    <label>
                      <input type="checkbox" name="permission" value="comment">
                      Agregar comentarios
                    </label>
                  </div>
                </div>
              `}
            </div>
            
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closeModal('share-memorial-modal')">Cancelar</button>
              ${unsharedMemorials.length > 0 ? `
                <button class="btn-primary" onclick="this.handleShareMemorial()">Compartir</button>
              ` : ''}
            </div>
          </div>
        </div>
      `
      
      document.getElementById('modal-container').innerHTML = modalHtml
    } catch (error) {
      console.error('Failed to load memorials for sharing:', error)
      this.showError('Error al cargar las memorias')
    }
  }

  // Event handlers
  async handleCreateFamily() {
    try {
      const form = document.getElementById('create-family-form')
      const formData = new FormData(form)
      
      const familyData = {
        name: formData.get('familyName'),
        settings: {
          allowNewMembers: document.getElementById('allow-new-members-input').checked,
          requireApproval: document.getElementById('require-approval-input').checked,
          defaultPermissions: ['view']
        }
      }
      
      // Add current user as admin
      const currentUser = appState.get('user')
      familyData.members = [{
        userId: currentUser.userId,
        email: currentUser.email || 'user@example.com',
        role: 'admin'
      }]
      
      // Validate family data
      const validation = validationService.validateFamilyGroup(familyData)
      if (!validation.isValid) {
        this.showValidationErrors(validation.errors)
        return
      }
      
      // Create family group
      this.currentFamilyGroup = await storageManager.saveFamilyGroup(validation.sanitized)
      
      // Update app state
      appState.update('user.familyGroup', {
        groupId: this.currentFamilyGroup.groupId,
        role: 'admin',
        inviteCode: this.currentFamilyGroup.inviteCode
      })
      
      // Update UI
      this.closeModal('create-family-modal')
      this.showFamilyDashboard()
      this.showSuccess('Grupo familiar creado exitosamente')
      
    } catch (error) {
      console.error('Failed to create family:', error)
      this.showError('Error al crear el grupo familiar: ' + error.message)
    }
  }

  async handleJoinFamily() {
    try {
      const inviteCode = document.getElementById('invite-code-input').value.toUpperCase()
      const memberEmail = document.getElementById('member-email-input').value
      
      if (!inviteCode || !memberEmail) {
        this.showError('Código de invitación y email son requeridos')
        return
      }
      
      // Find family group by invite code
      const familyGroup = await storageManager.getFamilyGroupByInviteCode(inviteCode)
      if (!familyGroup) {
        this.showFieldError('invite-code', 'Código de invitación inválido')
        return
      }
      
      // Check if user is already a member
      const currentUserId = appState.get('user.userId')
      const existingMember = familyGroup.members.find(m => m.userId === currentUserId || m.email === memberEmail)
      if (existingMember) {
        this.showError('Ya eres miembro de esta familia')
        return
      }
      
      // Add user to family
      familyGroup.addMember({
        userId: currentUserId,
        email: memberEmail,
        role: 'member'
      })
      
      // Save updated family group
      await storageManager.saveFamilyGroup(familyGroup)
      this.currentFamilyGroup = familyGroup
      
      // Update app state
      appState.update('user.familyGroup', {
        groupId: familyGroup.groupId,
        role: 'member',
        inviteCode: familyGroup.inviteCode
      })
      
      // Update UI
      this.closeModal('join-family-modal')
      this.showFamilyDashboard()
      this.showSuccess(`Te has unido a la familia "${familyGroup.name}"`)
      
    } catch (error) {
      console.error('Failed to join family:', error)
      this.showError('Error al unirse a la familia: ' + error.message)
    }
  }

  async handleShareMemorial() {
    try {
      const selectedMemorialId = document.querySelector('input[name="selected-memorial"]:checked')?.value
      if (!selectedMemorialId) {
        this.showError('Selecciona una memoria para compartir')
        return
      }
      
      // Get selected permissions
      const permissions = ['view'] // Always include view
      const permissionCheckboxes = document.querySelectorAll('input[name="permission"]:checked')
      permissionCheckboxes.forEach(checkbox => {
        if (checkbox.value !== 'view') {
          permissions.push(checkbox.value)
        }
      })
      
      // Update memorial sharing settings
      const memorial = await storageManager.getMemorial(selectedMemorialId)
      if (!memorial) {
        this.showError('Memoria no encontrada')
        return
      }
      
      memorial.sharing = {
        isShared: true,
        sharedWith: this.currentFamilyGroup.members.map(m => m.email),
        shareCode: this.generateShareCode(),
        permissions
      }
      
      await storageManager.saveMemorial(memorial)
      
      // Add to family group shared memorials
      if (!this.currentFamilyGroup.sharedMemorials.includes(selectedMemorialId)) {
        this.currentFamilyGroup.sharedMemorials.push(selectedMemorialId)
        await storageManager.saveFamilyGroup(this.currentFamilyGroup)
      }
      
      // Update UI
      this.closeModal('share-memorial-modal')
      this.updateSharedMemorialsList()
      this.updateFamilyInfo()
      this.showSuccess('Memoria compartida exitosamente')
      
    } catch (error) {
      console.error('Failed to share memorial:', error)
      this.showError('Error al compartir la memoria: ' + error.message)
    }
  }

  async handleSyncMemorials() {
    if (this.syncInProgress) return
    
    try {
      this.syncInProgress = true
      appState.set('sync.status', 'syncing')
      this.updateSyncStatus()
      
      // Simulate sync process (in real implementation, this would sync with server)
      await this.performSync()
      
      appState.set('sync.status', 'idle')
      appState.set('sync.lastSync', new Date())
      this.updateSyncStatus()
      this.showSuccess('Sincronización completada')
      
    } catch (error) {
      console.error('Sync failed:', error)
      appState.set('sync.status', 'error')
      this.updateSyncStatus()
      this.showError('Error en la sincronización: ' + error.message)
    } finally {
      this.syncInProgress = false
    }
  }

  async performSync() {
    // This is a simplified sync implementation
    // In a real app, this would sync with a server
    
    // Get local changes
    const localMemorials = await storageManager.getMemorials()
    const pendingChanges = localMemorials.filter(m => m.syncStatus === 'pending')
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mark as synced
    for (const memorial of pendingChanges) {
      memorial.syncStatus = 'synced'
      await storageManager.saveMemorial(memorial)
    }
    
    // Update app state
    const updatedMemorials = await storageManager.getMemorials()
    appState.set('memorials', updatedMemorials.map(m => m.toJSON()))
  }

  // Utility methods
  async getSharedMemorials() {
    if (!this.currentFamilyGroup) return []
    
    const allMemorials = await storageManager.getMemorials()
    return allMemorials.filter(m => 
      this.currentFamilyGroup.sharedMemorials.includes(m.id) || m.sharing.isShared
    )
  }

  canManageMember(member) {
    const currentUserId = appState.get('user.userId')
    const currentUserRole = appState.get('user.familyGroup.role')
    
    return currentUserRole === 'admin' && member.userId !== currentUserId
  }

  generateShareCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  getPermissionLabel(permission) {
    const labels = {
      view: 'Ver',
      edit: 'Editar',
      comment: 'Comentar'
    }
    return labels[permission] || permission
  }

  copyInviteCode = async () => {
    try {
      const inviteCode = this.currentFamilyGroup?.inviteCode
      if (inviteCode) {
        await navigator.clipboard.writeText(inviteCode)
        this.showSuccess('Código copiado al portapapeles')
      }
    } catch (error) {
      console.error('Failed to copy invite code:', error)
      this.showError('Error al copiar el código')
    }
  }

  sendEmailInvite = () => {
    const email = document.getElementById('invite-email-input').value
    const message = document.getElementById('invite-message-input').value
    
    if (!email) {
      this.showError('Email es requerido')
      return
    }
    
    // Create email content
    const subject = `Invitación a unirse a ${this.currentFamilyGroup.name}`
    const body = `${message || 'Te invito a unirte a nuestro libro de memorias familiar.'}\n\n` +
                 `Código de invitación: ${this.currentFamilyGroup.inviteCode}\n\n` +
                 `Visita la aplicación Mictla y usa este código para unirte a nuestra familia.`
    
    // Open email client
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
    
    this.showSuccess('Cliente de email abierto')
  }

  handleAutoSyncToggle = (event) => {
    const autoSync = event.target.checked
    appState.update('user.syncSettings', { autoSync })
    this.showSuccess(autoSync ? 'Sincronización automática activada' : 'Sincronización automática desactivada')
  }

  handleConflictResolutionChange = (event) => {
    const conflictResolution = event.target.value
    appState.update('user.syncSettings', { conflictResolution })
    this.showSuccess('Configuración de conflictos actualizada')
  }

  handleFamilySettingChange = async (event) => {
    if (!this.currentFamilyGroup) return
    
    const setting = event.target.id.replace('-checkbox', '').replace('-', '')
    const value = event.target.checked
    
    this.currentFamilyGroup.settings[setting] = value
    await storageManager.saveFamilyGroup(this.currentFamilyGroup)
    
    this.showSuccess('Configuración actualizada')
  }

  handleLeaveFamily = async () => {
    if (!confirm('¿Estás seguro de que quieres abandonar esta familia? Perderás acceso a las memorias compartidas.')) {
      return
    }
    
    try {
      const currentUserId = appState.get('user.userId')
      
      // Remove user from family group
      this.currentFamilyGroup.removeMember(currentUserId)
      
      if (this.currentFamilyGroup.members.length === 0) {
        // Delete family group if no members left
        await storageManager.deleteFamilyGroup(this.currentFamilyGroup.groupId)
      } else {
        await storageManager.saveFamilyGroup(this.currentFamilyGroup)
      }
      
      // Update app state
      appState.update('user.familyGroup', null)
      
      // Reset UI
      this.currentFamilyGroup = null
      this.showNoFamilyState()
      this.showSuccess('Has abandonado la familia')
      
    } catch (error) {
      console.error('Failed to leave family:', error)
      this.showError('Error al abandonar la familia: ' + error.message)
    }
  }

  // UI utility methods
  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.remove()
    }
  }

  showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`)
    if (errorElement) {
      errorElement.textContent = message
      errorElement.style.display = 'block'
    }
  }

  showValidationErrors(errors) {
    errors.forEach(error => {
      if (error.includes('name')) {
        this.showFieldError('family-name', error)
      } else {
        this.showError(error)
      }
    })
  }

  showError(message) {
    this.showMessage(message, 'error')
  }

  showSuccess(message) {
    this.showMessage(message, 'success')
  }

  showMessage(message, type) {
    const container = document.getElementById('message-container')
    const messageId = 'message-' + Date.now()
    
    const messageHtml = `
      <div class="message ${type}" id="${messageId}">
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="document.getElementById('${messageId}').remove()">&times;</button>
      </div>
    `
    
    container.insertAdjacentHTML('beforeend', messageHtml)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const messageElement = document.getElementById(messageId)
      if (messageElement) {
        messageElement.remove()
      }
    }, 5000)
  }

  // Public API
  async getFamilyGroup() {
    return this.currentFamilyGroup
  }

  async getSharedMemorialsForFamily() {
    return await this.getSharedMemorials()
  }

  async syncNow() {
    return await this.handleSyncMemorials()
  }

  destroy() {
    // Clean up resources
    this.currentFamilyGroup = null
    this.syncInProgress = false
  }
}