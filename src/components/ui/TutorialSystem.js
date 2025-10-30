/**
 * Tutorial System Component
 * Interactive tutorial for first-time users
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'
import { Modal } from './Modal.js'

export class TutorialSystem {
  constructor() {
    this.isActive = false
    this.currentStep = 0
    this.steps = []
    this.modal = null
    this.overlay = null
    this.spotlight = null
  }

  /**
   * Initialize tutorial system
   */
  init() {
    console.log('🎓 Initializing Tutorial System...')
    
    // Check if user has completed tutorial
    const tutorialCompleted = appState.get('user.tutorialCompleted')
    
    if (!tutorialCompleted) {
      // Show tutorial after a short delay
      setTimeout(() => {
        this.startTutorial()
      }, 1000)
    }
    
    console.log('✅ Tutorial System initialized')
  }

  /**
   * Start the tutorial
   */
  startTutorial() {
    if (this.isActive) return

    console.log('🎓 Starting tutorial...')
    
    this.isActive = true
    this.currentStep = 0
    
    // Define tutorial steps
    this.steps = [
      {
        title: i18n.t('tutorial.welcome'),
        content: `
          <div class="tutorial-welcome">
            <div class="welcome-icon">🌺</div>
            <h3>¡Bienvenido a Mictla!</h3>
            <p>Te guiaremos a través de las principales funciones de la aplicación para que puedas comenzar a crear y compartir memorias familiares.</p>
            <div class="tutorial-features">
              <div class="feature-preview">
                <span class="feature-icon">🕯️</span>
                <span>Altar AR</span>
              </div>
              <div class="feature-preview">
                <span class="feature-icon">📖</span>
                <span>Memorias</span>
              </div>
              <div class="feature-preview">
                <span class="feature-icon">👨‍👩‍👧‍👦</span>
                <span>Familia</span>
              </div>
              <div class="feature-preview">
                <span class="feature-icon">🎓</span>
                <span>Aprender</span>
              </div>
            </div>
          </div>
        `,
        target: null,
        position: 'center'
      },
      {
        title: 'Navegación Principal',
        content: `
          <div class="tutorial-step">
            <p>Esta es la navegación principal de Mictla. Desde aquí puedes acceder a todas las funciones:</p>
            <ul>
              <li><strong>🏠 Inicio:</strong> Página principal con resumen</li>
              <li><strong>🕯️ Altar:</strong> Explora el altar en realidad aumentada</li>
              <li><strong>📖 Memorias:</strong> Crea y gestiona memorias familiares</li>
              <li><strong>👨‍👩‍👧‍👦 Familia:</strong> Comparte con familiares</li>
              <li><strong>🎓 Aprender:</strong> Descubre tradiciones del Día de Muertos</li>
            </ul>
          </div>
        `,
        target: '.main-nav',
        position: 'bottom'
      },
      {
        title: 'Altar de Muertos AR',
        content: `
          <div class="tutorial-step">
            <p>El corazón de Mictla es el altar de muertos interactivo:</p>
            <ul>
              <li>🥽 <strong>Realidad Aumentada:</strong> Ve el altar en 3D en tu espacio</li>
              <li>🕯️ <strong>Tres Niveles:</strong> Tierra, Purgatorio y Cielo</li>
              <li>🌼 <strong>Ofrendas Virtuales:</strong> Coloca ofrendas para tus seres queridos</li>
              <li>📖 <strong>Memorias Integradas:</strong> Tus memorias aparecen en el altar</li>
            </ul>
            <p><em>¡Haz clic en "Altar AR" para explorarlo!</em></p>
          </div>
        `,
        target: '[data-route="/altar"]',
        position: 'bottom'
      },
      {
        title: 'Libro de Memorias',
        content: `
          <div class="tutorial-step">
            <p>Crea y preserva memorias de tus seres queridos:</p>
            <ul>
              <li>📷 <strong>Fotografías:</strong> Sube fotos especiales</li>
              <li>📝 <strong>Historias:</strong> Escribe recuerdos y anécdotas</li>
              <li>🎵 <strong>Audio:</strong> Graba mensajes de voz</li>
              <li>🏷️ <strong>Relaciones:</strong> Define el parentesco familiar</li>
              <li>🕯️ <strong>Nivel del Altar:</strong> Elige dónde colocar en el altar</li>
            </ul>
            <p><em>Cada memoria se integra automáticamente con el altar AR.</em></p>
          </div>
        `,
        target: '[data-route="/memories"]',
        position: 'bottom'
      },
      {
        title: 'Compartir con Familia',
        content: `
          <div class="tutorial-step">
            <p>Mictla está diseñado para conectar familias:</p>
            <ul>
              <li>👥 <strong>Grupos Familiares:</strong> Crea o únete a un grupo</li>
              <li>🔗 <strong>Sincronización:</strong> Comparte memorias automáticamente</li>
              <li>🌳 <strong>Árbol Genealógico:</strong> Visualiza conexiones familiares</li>
              <li>📤 <strong>Invitaciones:</strong> Invita familiares por email o código</li>
            </ul>
            <p><em>Como dice Coco: "La familia es lo más importante"</em></p>
          </div>
        `,
        target: '[data-route="/family"]',
        position: 'bottom'
      },
      {
        title: 'Aprender Tradiciones',
        content: `
          <div class="tutorial-step">
            <p>Descubre el significado profundo del Día de Muertos:</p>
            <ul>
              <li>📚 <strong>Contenido Cultural:</strong> Aprende sobre tradiciones auténticas</li>
              <li>🎬 <strong>Conexión con Coco:</strong> Temas de la película de Disney</li>
              <li>🕯️ <strong>Significado de Ofrendas:</strong> Qué representa cada elemento</li>
              <li>🌼 <strong>Niveles del Altar:</strong> El viaje espiritual explicado</li>
            </ul>
            <p><em>Respetamos y honramos las tradiciones mexicanas auténticas.</em></p>
          </div>
        `,
        target: '[data-route="/learn"]',
        position: 'bottom'
      },
      {
        title: '¡Listo para Comenzar!',
        content: `
          <div class="tutorial-complete">
            <div class="complete-icon">🎉</div>
            <h3>¡Tutorial Completado!</h3>
            <p>Ya conoces las principales funciones de Mictla. Ahora puedes:</p>
            <div class="next-steps">
              <div class="next-step">
                <span class="step-number">1</span>
                <span class="step-text">Crear tu primera memoria familiar</span>
              </div>
              <div class="next-step">
                <span class="step-number">2</span>
                <span class="step-text">Explorar el altar en realidad aumentada</span>
              </div>
              <div class="next-step">
                <span class="step-number">3</span>
                <span class="step-text">Invitar a tu familia a unirse</span>
              </div>
            </div>
            <p class="tutorial-note">
              <em>Puedes volver a ver este tutorial desde Configuración → Ayuda</em>
            </p>
          </div>
        `,
        target: null,
        position: 'center'
      }
    ]

    // Show first step
    this.showStep(0)
  }

  /**
   * Show specific tutorial step
   */
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return

    this.currentStep = stepIndex
    const step = this.steps[stepIndex]

    // Create or update modal
    if (this.modal) {
      this.modal.hide()
    }

    // Create spotlight effect if target exists
    if (step.target) {
      this.createSpotlight(step.target)
    } else {
      this.removeSpotlight()
    }

    // Create tutorial modal
    this.modal = new Modal({
      title: `${step.title} (${stepIndex + 1}/${this.steps.length})`,
      content: step.content + this.getTutorialControls(),
      size: 'medium',
      closable: true,
      backdrop: false, // Don't use backdrop when we have spotlight
      onHide: () => {
        this.skipTutorial()
      }
    })

    // Position modal based on step
    if (step.position === 'center') {
      this.modal.show()
    } else {
      this.modal.show()
      this.positionModal(step.target, step.position)
    }

    // Setup step-specific event listeners
    this.setupStepEvents()
  }

  /**
   * Get tutorial control buttons
   */
  getTutorialControls() {
    const isFirst = this.currentStep === 0
    const isLast = this.currentStep === this.steps.length - 1

    return `
      <div class="tutorial-controls">
        <div class="tutorial-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentStep + 1) / this.steps.length) * 100}%"></div>
          </div>
          <span class="progress-text">${this.currentStep + 1} de ${this.steps.length}</span>
        </div>
        
        <div class="tutorial-buttons">
          <button class="btn btn-ghost skip-tutorial-btn">
            ${isLast ? 'Finalizar' : 'Omitir Tutorial'}
          </button>
          
          ${!isFirst ? `
            <button class="btn btn-outline prev-step-btn">
              ⬅️ Anterior
            </button>
          ` : ''}
          
          ${!isLast ? `
            <button class="btn btn-primary next-step-btn">
              Siguiente ➡️
            </button>
          ` : `
            <button class="btn btn-primary finish-tutorial-btn">
              ¡Comenzar! 🚀
            </button>
          `}
        </div>
      </div>
    `
  }

  /**
   * Setup event listeners for current step
   */
  setupStepEvents() {
    if (!this.modal) return

    const modalElement = this.modal.element

    // Skip tutorial button
    const skipBtn = modalElement.querySelector('.skip-tutorial-btn')
    skipBtn?.addEventListener('click', () => {
      this.skipTutorial()
    })

    // Previous step button
    const prevBtn = modalElement.querySelector('.prev-step-btn')
    prevBtn?.addEventListener('click', () => {
      this.showStep(this.currentStep - 1)
    })

    // Next step button
    const nextBtn = modalElement.querySelector('.next-step-btn')
    nextBtn?.addEventListener('click', () => {
      this.showStep(this.currentStep + 1)
    })

    // Finish tutorial button
    const finishBtn = modalElement.querySelector('.finish-tutorial-btn')
    finishBtn?.addEventListener('click', () => {
      this.completeTutorial()
    })

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (!this.isActive) return

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1)
          } else {
            this.completeTutorial()
          }
          break
          
        case 'ArrowLeft':
          e.preventDefault()
          if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1)
          }
          break
          
        case 'Escape':
          e.preventDefault()
          this.skipTutorial()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    this.keydownHandler = handleKeyDown
  }

  /**
   * Create spotlight effect for target element
   */
  createSpotlight(targetSelector) {
    this.removeSpotlight()

    const targetElement = document.querySelector(targetSelector)
    if (!targetElement) return

    // Create overlay
    this.overlay = document.createElement('div')
    this.overlay.className = 'tutorial-overlay'
    document.body.appendChild(this.overlay)

    // Create spotlight
    this.spotlight = document.createElement('div')
    this.spotlight.className = 'tutorial-spotlight'
    document.body.appendChild(this.spotlight)

    // Position spotlight over target
    const rect = targetElement.getBoundingClientRect()
    const padding = 10

    this.spotlight.style.top = `${rect.top - padding}px`
    this.spotlight.style.left = `${rect.left - padding}px`
    this.spotlight.style.width = `${rect.width + padding * 2}px`
    this.spotlight.style.height = `${rect.height + padding * 2}px`

    // Add pulsing animation to target
    targetElement.classList.add('tutorial-highlight')

    // Store reference for cleanup
    this.highlightedElement = targetElement
  }

  /**
   * Remove spotlight effect
   */
  removeSpotlight() {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }

    if (this.spotlight) {
      this.spotlight.remove()
      this.spotlight = null
    }

    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('tutorial-highlight')
      this.highlightedElement = null
    }
  }

  /**
   * Position modal relative to target
   */
  positionModal(targetSelector, position) {
    if (!this.modal) return

    const targetElement = document.querySelector(targetSelector)
    const modalElement = this.modal.element

    if (!targetElement || !modalElement) return

    const targetRect = targetElement.getBoundingClientRect()
    const modalRect = modalElement.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let top, left

    switch (position) {
      case 'bottom':
        top = targetRect.bottom + 20
        left = targetRect.left + (targetRect.width / 2) - (modalRect.width / 2)
        break
        
      case 'top':
        top = targetRect.top - modalRect.height - 20
        left = targetRect.left + (targetRect.width / 2) - (modalRect.width / 2)
        break
        
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (modalRect.height / 2)
        left = targetRect.left - modalRect.width - 20
        break
        
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (modalRect.height / 2)
        left = targetRect.right + 20
        break
        
      default:
        return // Keep default center position
    }

    // Ensure modal stays within viewport
    top = Math.max(20, Math.min(top, viewport.height - modalRect.height - 20))
    left = Math.max(20, Math.min(left, viewport.width - modalRect.width - 20))

    modalElement.style.position = 'fixed'
    modalElement.style.top = `${top}px`
    modalElement.style.left = `${left}px`
    modalElement.style.transform = 'none'
  }

  /**
   * Skip tutorial
   */
  skipTutorial() {
    console.log('⏭️ Tutorial skipped')
    
    this.isActive = false
    
    // Clean up
    this.removeSpotlight()
    
    if (this.modal) {
      this.modal.hide()
      this.modal = null
    }

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    // Mark as completed (even if skipped)
    appState.set('user.tutorialCompleted', true)

    // Show notification
    appState.actions.showNotification({
      type: 'info',
      title: 'Tutorial Omitido',
      message: 'Puedes volver a verlo desde Configuración → Ayuda'
    })
  }

  /**
   * Complete tutorial
   */
  completeTutorial() {
    console.log('✅ Tutorial completed')
    
    this.isActive = false
    
    // Clean up
    this.removeSpotlight()
    
    if (this.modal) {
      this.modal.hide()
      this.modal = null
    }

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    // Mark as completed
    appState.set('user.tutorialCompleted', true)

    // Show success notification
    appState.actions.showNotification({
      type: 'success',
      title: '¡Tutorial Completado!',
      message: '¡Bienvenido a Mictla! Ya puedes comenzar a crear memorias familiares.'
    })

    // Navigate to memories to start creating
    setTimeout(() => {
      window.location.href = '/memories'
    }, 2000)
  }

  /**
   * Restart tutorial (for help/settings)
   */
  restartTutorial() {
    console.log('🔄 Restarting tutorial...')
    
    // Reset tutorial state
    appState.set('user.tutorialCompleted', false)
    
    // Start tutorial
    this.startTutorial()
  }

  /**
   * Check if tutorial should be shown
   */
  shouldShowTutorial() {
    const tutorialCompleted = appState.get('user.tutorialCompleted')
    const memorialCount = appState.get('memorials')?.length || 0
    
    // Show tutorial if not completed and no memorials exist
    return !tutorialCompleted && memorialCount === 0
  }

  /**
   * Dispose tutorial system
   */
  dispose() {
    this.skipTutorial()
    console.log('🧹 Tutorial System disposed')
  }
}

// Create singleton instance
export const tutorialSystem = new TutorialSystem()