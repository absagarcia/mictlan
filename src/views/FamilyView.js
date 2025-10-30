/**
 * Family View - Family sharing and collaboration
 * Manage family groups and shared memorials
 */

import { appState } from '../state/AppState.js'
import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'
import { FamilySharingComponent } from '../components/sharing/FamilySharingComponent.js'
import { FamilyTree } from '../components/ui/FamilyTree.js'
import { Modal } from '../components/ui/Modal.js'

export class FamilyView {
  constructor(container) {
    this.container = container
    this.navigation = null
    this.familySharing = null
    this.familyTree = null
    this.currentTab = 'overview'
  }

  /**
   * Render family view
   */
  async render() {
    console.log('👨‍👩‍👧‍👦 Rendering Family View...')

    try {
      this.container.innerHTML = `
        <div class="family-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="family-content">
            <div class="container">
              <!-- Header -->
              <header class="family-header">
                <div class="header-content">
                  <h1>
                    <span class="header-icon">👨‍👩‍👧‍👦</span>
                    ${i18n.t('family.title')}
                  </h1>
                  <p class="header-subtitle">${i18n.t('family.subtitle')}</p>
                </div>
                <div class="header-actions">
                  <button class="btn btn-outline" id="invite-family-btn">
                    <span>📧</span>
                    ${i18n.t('family.invite_members')}
                  </button>
                  <button class="btn btn-primary" id="create-group-btn">
                    <span>➕</span>
                    ${i18n.t('family.create_group')}
                  </button>
                </div>
              </header>

              <!-- Family Tabs -->
              <nav class="family-tabs">
                <button class="tab-btn active" data-tab="overview">
                  <span class="tab-icon">📊</span>
                  <span class="tab-text">${i18n.t('family.tabs.overview')}</span>
                </button>
                <button class="tab-btn" data-tab="tree">
                  <span class="tab-icon">🌳</span>
                  <span class="tab-text">${i18n.t('family.tabs.tree')}</span>
                </button>
                <button class="tab-btn" data-tab="sharing">
                  <span class="tab-icon">🤝</span>
                  <span class="tab-text">${i18n.t('family.tabs.sharing')}</span>
                </button>
                <button class="tab-btn" data-tab="members">
                  <span class="tab-icon">👥</span>
                  <span class="tab-text">${i18n.t('family.tabs.members')}</span>
                </button>
              </nav>

              <!-- Tab Content -->
              <div class="tab-content">
                <!-- Overview Tab -->
                <div class="tab-panel active" id="overview-panel">
                  ${this.getOverviewContent()}
                </div>

                <!-- Family Tree Tab -->
                <div class="tab-panel" id="tree-panel">
                  <div id="family-tree-container"></div>
                </div>

                <!-- Sharing Tab -->
                <div class="tab-panel" id="sharing-panel">
                  <div id="family-sharing-container"></div>
                </div>

                <!-- Members Tab -->
                <div class="tab-panel" id="members-panel">
                  ${this.getMembersContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      `

      // Initialize navigation
      const navContainer = this.container.querySelector('#main-navigation')
      this.navigation = new Navigation(navContainer)
      await this.navigation.init()

      // Setup event listeners
      this.setupEventListeners()

      // Initialize components based on current tab
      await this.initializeTabContent(this.currentTab)

      console.log('✅ Family View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Family View:', error)
      this.showError(error)
    }
  }

  /**
   * Get overview tab content
   */
  getOverviewContent() {
    const familyGroup = appState.get('familyGroup')
    const memorials = appState.get('memorials') || []
    const sharedMemorials = memorials.filter(m => m.sharing?.isShared)

    return `
      <div class="overview-content">
        <!-- Family Status -->
        <section class="family-status">
          ${familyGroup ? `
            <div class="status-card active">
              <div class="status-icon">✅</div>
              <div class="status-content">
                <h3>${i18n.t('family.status.connected')}</h3>
                <p>${i18n.t('family.status.group_name')}: <strong>${familyGroup.name}</strong></p>
                <p>${i18n.t('family.status.members')}: ${familyGroup.members?.length || 0}</p>
              </div>
            </div>
          ` : `
            <div class="status-card inactive">
              <div class="status-icon">⚪</div>
              <div class="status-content">
                <h3>${i18n.t('family.status.not_connected')}</h3>
                <p>${i18n.t('family.status.create_or_join')}</p>
                <div class="status-actions">
                  <button class="btn btn-primary btn-sm" id="quick-create-group">
                    ${i18n.t('family.create_group')}
                  </button>
                  <button class="btn btn-outline btn-sm" id="quick-join-group">
                    ${i18n.t('family.join_group')}
                  </button>
                </div>
              </div>
            </div>
          `}
        </section>

        <!-- Quick Stats -->
        <section class="family-stats">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${memorials.length}</div>
              <div class="stat-label">${i18n.t('family.stats.total_memorials')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${sharedMemorials.length}</div>
              <div class="stat-label">${i18n.t('family.stats.shared_memorials')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${familyGroup?.members?.length || 0}</div>
              <div class="stat-label">${i18n.t('family.stats.family_members')}</div>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="recent-activity">
          <h3>${i18n.t('family.recent_activity')}</h3>
          <div class="activity-list">
            ${this.getRecentActivityItems()}
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <h3>${i18n.t('family.quick_actions')}</h3>
          <div class="actions-grid">
            <button class="action-card" data-action="share-memorial">
              <div class="action-icon">📤</div>
              <div class="action-content">
                <h4>${i18n.t('family.actions.share_memorial')}</h4>
                <p>${i18n.t('family.actions.share_memorial_desc')}</p>
              </div>
            </button>
            <button class="action-card" data-action="view-tree">
              <div class="action-icon">🌳</div>
              <div class="action-content">
                <h4>${i18n.t('family.actions.view_tree')}</h4>
                <p>${i18n.t('family.actions.view_tree_desc')}</p>
              </div>
            </button>
            <button class="action-card" data-action="invite-member">
              <div class="action-icon">👥</div>
              <div class="action-content">
                <h4>${i18n.t('family.actions.invite_member')}</h4>
                <p>${i18n.t('family.actions.invite_member_desc')}</p>
              </div>
            </button>
          </div>
        </section>
      </div>
    `
  }

  /**
   * Get members tab content
   */
  getMembersContent() {
    const familyGroup = appState.get('familyGroup')
    
    if (!familyGroup) {
      return `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>${i18n.t('family.no_group')}</h3>
          <p>${i18n.t('family.no_group_desc')}</p>
          <button class="btn btn-primary" id="create-group-from-members">
            ${i18n.t('family.create_group')}
          </button>
        </div>
      `
    }

    return `
      <div class="members-content">
        <div class="members-header">
          <h3>${i18n.t('family.group_members')}</h3>
          <button class="btn btn-primary" id="invite-member-btn">
            <span>➕</span>
            ${i18n.t('family.invite_member')}
          </button>
        </div>
        
        <div class="members-list">
          ${familyGroup.members?.map(member => `
            <div class="member-card">
              <div class="member-avatar">
                ${member.email.charAt(0).toUpperCase()}
              </div>
              <div class="member-info">
                <h4>${member.email}</h4>
                <p class="member-role">${i18n.t('family.roles.' + member.role)}</p>
                <p class="member-joined">${i18n.t('family.joined')}: ${new Date(member.joinedAt).toLocaleDateString()}</p>
              </div>
              <div class="member-actions">
                ${member.role !== 'admin' ? `
                  <button class="btn btn-sm btn-outline" data-action="change-role" data-member="${member.userId}">
                    ${i18n.t('family.change_role')}
                  </button>
                  <button class="btn btn-sm btn-outline btn-danger" data-action="remove-member" data-member="${member.userId}">
                    ${i18n.t('family.remove')}
                  </button>
                ` : `
                  <span class="admin-badge">${i18n.t('family.admin')}</span>
                `}
              </div>
            </div>
          `).join('') || ''}
        </div>
      </div>
    `
  }

  /**
   * Get recent activity items
   */
  getRecentActivityItems() {
    // This would typically come from a sync service or activity log
    // For now, we'll generate some sample activities based on current state
    const activities = []
    const memorials = appState.get('memorials') || []
    
    // Add recent memorial activities
    memorials.slice(-3).forEach(memorial => {
      activities.push({
        type: 'memorial_added',
        message: i18n.t('family.activity.memorial_added', { name: memorial.name }),
        timestamp: memorial.createdAt,
        icon: '📖'
      })
    })

    if (activities.length === 0) {
      return `
        <div class="empty-activity">
          <p>${i18n.t('family.no_recent_activity')}</p>
        </div>
      `
    }

    return activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <p>${activity.message}</p>
          <time>${new Date(activity.timestamp).toLocaleDateString()}</time>
        </div>
      </div>
    `).join('')
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation
    const tabButtons = this.container.querySelectorAll('.tab-btn')
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab
        this.switchTab(tab)
      })
    })

    // Header actions
    const createGroupBtn = this.container.querySelector('#create-group-btn')
    createGroupBtn?.addEventListener('click', () => {
      this.showCreateGroupModal()
    })

    const inviteFamilyBtn = this.container.querySelector('#invite-family-btn')
    inviteFamilyBtn?.addEventListener('click', () => {
      this.showInviteMemberModal()
    })

    // Quick actions
    const actionCards = this.container.querySelectorAll('.action-card')
    actionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action
        this.handleQuickAction(action)
      })
    })

    // Overview quick buttons
    const quickCreateBtn = this.container.querySelector('#quick-create-group')
    quickCreateBtn?.addEventListener('click', () => {
      this.showCreateGroupModal()
    })

    const quickJoinBtn = this.container.querySelector('#quick-join-group')
    quickJoinBtn?.addEventListener('click', () => {
      this.showJoinGroupModal()
    })
  }

  /**
   * Switch between tabs
   */
  async switchTab(tab) {
    if (tab === this.currentTab) return

    // Update tab buttons
    const tabButtons = this.container.querySelectorAll('.tab-btn')
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    // Update tab panels
    const tabPanels = this.container.querySelectorAll('.tab-panel')
    tabPanels.forEach(panel => {
      panel.classList.remove('active')
    })

    const targetPanel = this.container.querySelector(`#${tab}-panel`)
    if (targetPanel) {
      targetPanel.classList.add('active')
    }

    this.currentTab = tab

    // Initialize tab-specific content
    await this.initializeTabContent(tab)
  }

  /**
   * Initialize content for specific tab
   */
  async initializeTabContent(tab) {
    switch (tab) {
      case 'tree':
        await this.initializeFamilyTree()
        break
      case 'sharing':
        await this.initializeFamilySharing()
        break
    }
  }

  /**
   * Initialize family tree component
   */
  async initializeFamilyTree() {
    if (this.familyTree) return

    const container = this.container.querySelector('#family-tree-container')
    if (container) {
      this.familyTree = new FamilyTree(container)
      await this.familyTree.init()
    }
  }

  /**
   * Initialize family sharing component
   */
  async initializeFamilySharing() {
    if (this.familySharing) return

    const container = this.container.querySelector('#family-sharing-container')
    if (container) {
      this.familySharing = new FamilySharingComponent(container)
      await this.familySharing.init()
    }
  }

  /**
   * Handle quick actions
   */
  handleQuickAction(action) {
    switch (action) {
      case 'share-memorial':
        router.navigate('/sharing')
        break
      case 'view-tree':
        this.switchTab('tree')
        break
      case 'invite-member':
        this.showInviteMemberModal()
        break
    }
  }

  /**
   * Show create group modal
   */
  showCreateGroupModal() {
    const modal = new Modal({
      title: i18n.t('family.create_group'),
      content: `
        <form id="create-group-form">
          <div class="form-group">
            <label class="form-label" for="group-name">
              ${i18n.t('family.form.group_name')} *
            </label>
            <input 
              type="text" 
              id="group-name" 
              class="form-input" 
              required
              placeholder="${i18n.t('family.form.group_name_placeholder')}"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="group-description">
              ${i18n.t('family.form.description')}
            </label>
            <textarea 
              id="group-description" 
              class="form-textarea" 
              rows="3"
              placeholder="${i18n.t('family.form.description_placeholder')}"
            ></textarea>
          </div>
        </form>
      `,
      onConfirm: () => this.handleCreateGroup(modal)
    })

    modal.show()
  }

  /**
   * Show join group modal
   */
  showJoinGroupModal() {
    const modal = new Modal({
      title: i18n.t('family.join_group'),
      content: `
        <form id="join-group-form">
          <div class="form-group">
            <label class="form-label" for="invite-code">
              ${i18n.t('family.form.invite_code')} *
            </label>
            <input 
              type="text" 
              id="invite-code" 
              class="form-input" 
              required
              placeholder="${i18n.t('family.form.invite_code_placeholder')}"
            >
            <small class="form-help">${i18n.t('family.form.invite_code_help')}</small>
          </div>
        </form>
      `,
      onConfirm: () => this.handleJoinGroup(modal)
    })

    modal.show()
  }

  /**
   * Show invite member modal
   */
  showInviteMemberModal() {
    const modal = new Modal({
      title: i18n.t('family.invite_member'),
      content: `
        <form id="invite-member-form">
          <div class="form-group">
            <label class="form-label" for="member-email">
              ${i18n.t('family.form.email')} *
            </label>
            <input 
              type="email" 
              id="member-email" 
              class="form-input" 
              required
              placeholder="${i18n.t('family.form.email_placeholder')}"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="member-role">
              ${i18n.t('family.form.role')}
            </label>
            <select id="member-role" class="form-select">
              <option value="member">${i18n.t('family.roles.member')}</option>
              <option value="admin">${i18n.t('family.roles.admin')}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="invite-message">
              ${i18n.t('family.form.message')}
            </label>
            <textarea 
              id="invite-message" 
              class="form-textarea" 
              rows="3"
              placeholder="${i18n.t('family.form.message_placeholder')}"
            ></textarea>
          </div>
        </form>
      `,
      onConfirm: () => this.handleInviteMember(modal)
    })

    modal.show()
  }

  /**
   * Handle create group
   */
  async handleCreateGroup(modal) {
    const form = modal.element.querySelector('#create-group-form')
    const groupName = form.querySelector('#group-name').value.trim()
    const description = form.querySelector('#group-description').value.trim()

    if (!groupName) {
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.validation'),
        message: i18n.t('family.errors.group_name_required')
      })
      return false
    }

    try {
      // Create family group
      const familyGroup = {
        groupId: 'group_' + Date.now(),
        name: groupName,
        description,
        members: [{
          userId: appState.get('user.userId'),
          email: 'user@example.com', // This would come from user profile
          role: 'admin',
          joinedAt: new Date()
        }],
        sharedMemorials: [],
        inviteCode: this.generateInviteCode(),
        createdAt: new Date(),
        settings: {
          allowNewMembers: true,
          requireApproval: false,
          defaultPermissions: ['view']
        }
      }

      // Update app state
      appState.set('familyGroup', familyGroup)
      appState.update('user.familyGroup', {
        groupId: familyGroup.groupId,
        role: 'admin',
        inviteCode: familyGroup.inviteCode
      })

      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('family.group_created'),
        message: i18n.t('family.group_created_message', { name: groupName })
      })

      // Refresh view
      await this.render()
      
      modal.hide()
      return true

    } catch (error) {
      console.error('Failed to create group:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.create_failed'),
        message: error.message
      })
      return false
    }
  }

  /**
   * Handle join group
   */
  async handleJoinGroup(modal) {
    const form = modal.element.querySelector('#join-group-form')
    const inviteCode = form.querySelector('#invite-code').value.trim()

    if (!inviteCode) {
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.validation'),
        message: i18n.t('family.errors.invite_code_required')
      })
      return false
    }

    try {
      // This would typically make an API call to join the group
      // For now, we'll simulate it
      appState.actions.showNotification({
        type: 'info',
        title: i18n.t('family.join_requested'),
        message: i18n.t('family.join_requested_message')
      })

      modal.hide()
      return true

    } catch (error) {
      console.error('Failed to join group:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.join_failed'),
        message: error.message
      })
      return false
    }
  }

  /**
   * Handle invite member
   */
  async handleInviteMember(modal) {
    const form = modal.element.querySelector('#invite-member-form')
    const email = form.querySelector('#member-email').value.trim()
    const role = form.querySelector('#member-role').value
    const message = form.querySelector('#invite-message').value.trim()

    if (!email) {
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.validation'),
        message: i18n.t('family.errors.email_required')
      })
      return false
    }

    try {
      // This would typically send an email invitation
      // For now, we'll simulate it
      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('family.invite_sent'),
        message: i18n.t('family.invite_sent_message', { email })
      })

      modal.hide()
      return true

    } catch (error) {
      console.error('Failed to invite member:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('family.errors.invite_failed'),
        message: error.message
      })
      return false
    }
  }

  /**
   * Generate invite code
   */
  generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  /**
   * Show error state
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="family-error">
        <div class="container">
          <h2>😔 ${i18n.t('errors.family_load_failed')}</h2>
          <p>${i18n.t('errors.try_again')}</p>
          <details>
            <summary>${i18n.t('errors.technical_details')}</summary>
            <pre>${error.message}\n${error.stack}</pre>
          </details>
          <button class="btn btn-primary" onclick="window.location.reload()">
            ${i18n.t('actions.reload')}
          </button>
        </div>
      </div>
    `
  }

  /**
   * Dispose view and cleanup
   */
  dispose() {
    if (this.navigation) {
      this.navigation.dispose()
    }
    if (this.familySharing) {
      this.familySharing.dispose()
    }
    if (this.familyTree) {
      this.familyTree.dispose()
    }
    console.log('🧹 Family View disposed')
  }
}