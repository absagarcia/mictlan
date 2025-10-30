/**
 * Mictla - Main Application Entry Point
 * AR Altar de Muertos con Libro de Memorias Familiar
 */

console.log('🌺 Initializing Mictla...')

// Global app instance
let app = null

// Define all global functions first
window.goHome = function() {
  if (app) app.showHome()
}

window.goToAltar = function() {
  if (app) app.showAltar()
}

window.goToMemories = function() {
  if (app) app.showMemories()
}

window.goToFamily = function() {
  if (app) app.showFamily()
}

window.addMemory = function() {
  if (app) app.showAddMemory()
}

window.viewMemories = function() {
  if (app) app.showAllMemories()
}

window.startAR = function() {
  console.log('🚀 startAR function called!')
  if (app) app.showARExperience()
}

window.inviteFamily = function() {
  alert('👥 Invitar Familia\n\nEsta función permitirá:\n• Generar enlaces de invitación\n• Compartir por WhatsApp/Email\n• Colaboración familiar en tiempo real')
}

window.shareAltar = function() {
  alert('📤 Compartir Altar\n\nEsta función permitirá:\n• Exportar altar como imagen\n• Compartir en redes sociales\n• Crear enlaces públicos')
}

window.generateQR = function() {
  alert('📱 Generar Código QR\n\nEsta función creará:\n• QR para acceso rápido\n• Compartir con familia\n• Acceso desde cualquier dispositivo')
}

window.saveMemory = function() {
  const name = document.getElementById('person-name')?.value.trim()
  const story = document.getElementById('memory-story')?.value.trim()
  
  if (!name || !story) {
    alert('Por favor completa todos los campos obligatorios')
    return
  }

  const memory = {
    id: Date.now(),
    personName: name,
    story: story,
    createdAt: new Date().toISOString()
  }

  const memories = JSON.parse(localStorage.getItem('mictla-memories') || '[]')
  memories.push(memory)
  localStorage.setItem('mictla-memories', JSON.stringify(memories))

  alert(`✅ Memoria de ${name} guardada exitosamente!`)
  if (app) app.showAllMemories()
}

// Virtual Altar Functions
let virtualAltarElements = [
  { type: 'candle', emoji: '🕯️', name: 'Vela', description: 'Luz para guiar a las almas' }
]

window.addVirtualElement = function(elementType) {
  const elements = {
    candle: { emoji: '🕯️', name: 'Vela', description: 'Luz para guiar a las almas' },
    flower: { emoji: '🌼', name: 'Cempasúchil', description: 'Flores que atraen a los espíritus' },
    bread: { emoji: '🍞', name: 'Pan de Muerto', description: 'Ofrenda dulce tradicional' },
    photo: { emoji: '📷', name: 'Fotografía', description: 'Recuerdo de seres queridos' }
  }
  
  const element = elements[elementType]
  if (element) {
    virtualAltarElements.push({ type: elementType, ...element })
    updateVirtualAltar()
    
    // Visual feedback
    const button = event.target
    if (button) {
      const originalBg = button.style.background
      const originalColor = button.style.color
      
      button.style.background = 'rgba(34, 197, 94, 0.3)'
      button.style.color = '#22C55E'
      button.textContent = `✅ ${element.name} agregado`
      
      setTimeout(() => {
        button.style.background = originalBg
        button.style.color = originalColor
        button.textContent = `${element.emoji} Agregar ${element.name}`
      }, 1000)
    }
    
    console.log(`🌺 Added ${element.name} to virtual altar`)
  }
}

window.clearAltar = function() {
  virtualAltarElements = []
  updateVirtualAltar()
}

window.shareVirtualAltar = function() {
  const elementNames = virtualAltarElements.map(e => e.name).join(', ')
  alert(`🌺 Compartir Altar Virtual\n\nTu altar contiene: ${elementNames}\n\n¡Comparte esta tradición con tu familia!`)
}

// Camera and AR variables
let cameraStream = null
let arCanvas = null
let arContext = null
let isARActive = false

window.startCamera = async function() {
  console.log('🎥 Starting camera...')
  
  // Check if we're on HTTP and show alternative experience
  if (location.protocol !== 'https:') {
    console.log('📱 HTTP detected - showing AR simulation')
    startARSimulation()
    return
  }
  
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('📹 getUserMedia not available - showing simulation')
      startARSimulation()
      return
    }
    
    // Request camera permission
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Use back camera for AR
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    
    const video = document.getElementById('camera-feed')
    const placeholder = document.getElementById('altar-placeholder')
    const canvas = document.getElementById('ar-canvas')
    
    if (video && placeholder && canvas) {
      // Setup video stream
      video.srcObject = stream
      video.play()
      
      // Hide placeholder and show camera
      placeholder.style.display = 'none'
      video.style.display = 'block'
      canvas.style.display = 'block'
      
      // Setup AR canvas
      arCanvas = canvas
      arContext = canvas.getContext('2d')
      cameraStream = stream
      isARActive = true
      
      // Start AR rendering
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        startARRendering()
      })
      
      console.log('✅ Camera started successfully')
      
      // Update UI to show AR controls
      updateARInterface()
    }
    
  } catch (error) {
    console.error('❌ Camera access failed:', error)
    console.log('🎮 Falling back to AR simulation')
    startARSimulation()
  }
}

// AR Simulation for HTTP
function startARSimulation() {
  const video = document.getElementById('camera-feed')
  const placeholder = document.getElementById('altar-placeholder')
  const canvas = document.getElementById('ar-canvas')
  
  if (video && placeholder && canvas) {
    // Create a simulated camera background
    video.style.display = 'none'
    placeholder.style.display = 'none'
    canvas.style.display = 'block'
    
    // Setup simulation canvas
    arCanvas = canvas
    arContext = canvas.getContext('2d')
    canvas.width = 400
    canvas.height = 300
    isARActive = true
    
    // Start simulation rendering
    startARSimulationRendering()
    
    // Update UI
    updateARInterface()
    
    console.log('✅ AR Simulation started')
  }
}

function startARSimulationRendering() {
  if (!isARActive || !arCanvas || !arContext) return
  
  // Clear canvas
  arContext.clearRect(0, 0, arCanvas.width, arCanvas.height)
  
  // Draw simulated environment background
  const gradient = arContext.createLinearGradient(0, 0, 0, arCanvas.height)
  gradient.addColorStop(0, '#87CEEB') // Sky blue
  gradient.addColorStop(0.7, '#98FB98') // Light green
  gradient.addColorStop(1, '#90EE90') // Lighter green
  
  arContext.fillStyle = gradient
  arContext.fillRect(0, 0, arCanvas.width, arCanvas.height)
  
  // Draw ground
  arContext.fillStyle = '#8B4513'
  arContext.fillRect(0, arCanvas.height * 0.8, arCanvas.width, arCanvas.height * 0.2)
  
  // Draw simulated room elements
  drawSimulatedRoom()
  
  // Draw AR elements
  drawARElements()
  
  // Continue rendering
  requestAnimationFrame(startARSimulationRendering)
}

function drawSimulatedRoom() {
  if (!arContext) return
  
  // Draw a simple table/surface
  arContext.fillStyle = '#8B4513'
  arContext.fillRect(arCanvas.width * 0.2, arCanvas.height * 0.6, arCanvas.width * 0.6, 20)
  
  // Draw table legs
  arContext.fillStyle = '#654321'
  arContext.fillRect(arCanvas.width * 0.25, arCanvas.height * 0.6, 10, arCanvas.height * 0.2)
  arContext.fillRect(arCanvas.width * 0.75, arCanvas.height * 0.6, 10, arCanvas.height * 0.2)
  
  // Add some ambient elements
  arContext.fillStyle = 'rgba(255, 255, 255, 0.1)'
  arContext.fillRect(10, 10, arCanvas.width - 20, 40)
  arContext.fillStyle = '#FFFFFF'
  arContext.font = '14px Arial'
  arContext.textAlign = 'center'
  arContext.fillText('🌺 Simulación AR - Altar Virtual', arCanvas.width / 2, 30)
}

window.stopCamera = function() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop())
    cameraStream = null
  }
  
  const video = document.getElementById('camera-feed')
  const placeholder = document.getElementById('altar-placeholder')
  const canvas = document.getElementById('ar-canvas')
  
  if (video && placeholder && canvas) {
    video.style.display = 'none'
    canvas.style.display = 'none'
    placeholder.style.display = 'block'
  }
  
  isARActive = false
  console.log('📹 Camera stopped')
}

function startARRendering() {
  if (!isARActive || !arCanvas || !arContext) return
  
  const video = document.getElementById('camera-feed')
  if (!video) return
  
  // Clear canvas
  arContext.clearRect(0, 0, arCanvas.width, arCanvas.height)
  
  // Draw AR elements on top of camera feed
  drawARElements()
  
  // Continue rendering
  requestAnimationFrame(startARRendering)
}

function drawARElements() {
  if (!arContext || virtualAltarElements.length === 0) return
  
  // Draw virtual altar elements as overlays
  const centerX = arCanvas.width / 2
  const centerY = arCanvas.height * 0.6 // Position on the table
  
  // Draw a virtual altar base (more prominent for simulation)
  arContext.fillStyle = '#8B4513' // Brown altar base
  arContext.fillRect(centerX - 80, centerY - 10, 160, 15)
  
  // Draw altar cloth
  arContext.fillStyle = '#D97706'
  arContext.fillRect(centerX - 85, centerY - 15, 170, 5)
  
  // Draw elements on the altar
  virtualAltarElements.forEach((element, index) => {
    const x = centerX - 60 + (index * 30)
    const y = centerY - 20
    
    // Draw element shadow
    arContext.fillStyle = 'rgba(0, 0, 0, 0.2)'
    arContext.fillRect(x - 12, y + 8, 24, 24)
    
    // Draw element background circle
    arContext.fillStyle = 'rgba(217, 119, 6, 0.3)'
    arContext.beginPath()
    arContext.arc(x, y, 18, 0, 2 * Math.PI)
    arContext.fill()
    
    // Draw element emoji
    arContext.font = '24px Arial'
    arContext.textAlign = 'center'
    arContext.fillStyle = '#FFFFFF'
    arContext.fillText(element.emoji, x, y + 8)
    
    // Draw element glow effect
    arContext.shadowColor = '#D97706'
    arContext.shadowBlur = 8
    arContext.fillStyle = '#D97706'
    arContext.fillText(element.emoji, x, y + 8)
    arContext.shadowBlur = 0
  })
  
  // Draw status info
  arContext.font = '12px Arial'
  arContext.textAlign = 'left'
  arContext.fillStyle = 'rgba(0, 0, 0, 0.7)'
  arContext.fillRect(10, arCanvas.height - 50, arCanvas.width - 20, 40)
  arContext.fillStyle = '#FFFFFF'
  arContext.fillText(`🌺 ${virtualAltarElements.length} elementos en tu altar`, 15, arCanvas.height - 30)
  arContext.fillText('Toca los botones para agregar más elementos', 15, arCanvas.height - 15)
}

function updateARInterface() {
  // Add AR controls to the interface
  const altarContainer = document.getElementById('virtual-altar')
  if (altarContainer && isARActive) {
    // Add stop camera button
    const stopButton = document.createElement('button')
    stopButton.onclick = window.stopCamera
    stopButton.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(239, 68, 68, 0.9); color: white; border: none; padding: 0.5rem; border-radius: 0.25rem; cursor: pointer; z-index: 10;'
    stopButton.textContent = '✕ Cerrar AR'
    altarContainer.appendChild(stopButton)
  }
}

function updateVirtualAltar() {
  const display = document.getElementById('altar-elements-display')
  const count = document.getElementById('elements-count')
  const list = document.getElementById('elements-list')
  
  if (display) {
    display.textContent = virtualAltarElements.length > 0 ? 
      virtualAltarElements.map(e => e.emoji).join(' ') : '🌺'
  }
  
  if (count) {
    const elementCount = virtualAltarElements.length
    count.textContent = elementCount === 0 ? 'Altar vacío' : 
      elementCount === 1 ? '1 elemento' : `${elementCount} elementos`
  }
  
  if (list) {
    list.innerHTML = virtualAltarElements.length > 0 ? 
      virtualAltarElements.map(e => `
        <div style="display: flex; align-items: center; margin: 0.5rem 0; padding: 0.5rem; background: rgba(217, 119, 6, 0.1); border-radius: 0.25rem;">
          <span style="font-size: 1.5rem; margin-right: 0.5rem;">${e.emoji}</span>
          <div style="text-align: left;">
            <strong style="color: #D97706;">${e.name}</strong>
            <p style="margin: 0; font-size: 0.8rem; color: #D1D5DB;">${e.description}</p>
          </div>
        </div>
      `).join('') :
      '<p style="color: #D1D5DB; text-align: center; margin: 0;">Tu altar está vacío. Agrega elementos tradicionales.</p>'
  }
}

class MictlaApp {
  constructor() {
    this.container = document.getElementById('app')
    this.currentView = 'home'
  }

  async init() {
    console.log('✅ Mictla initialized successfully')
    
    // Remove loading overlay
    const loadingOverlay = document.querySelector('.loading-overlay')
    if (loadingOverlay) {
      loadingOverlay.classList.remove('active')
    }
    
    this.showHome()
  }

  showHome() {
    this.currentView = 'home'
    this.container.innerHTML = `
      <div style="padding: 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 3rem; margin-bottom: 1rem;">
          🌺 Mictla 🌺
        </h1>
        <h2 style="color: #F9FAFB; margin-bottom: 2rem;">
          Altar de Muertos AR con Libro de Memorias Familiar
        </h2>
        <p style="color: #D1D5DB; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
          Bienvenido a Mictla, una aplicación que honra las tradiciones del Día de Muertos 
          a través de la realidad aumentada y un libro digital de memorias familiares.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem;">
          <div onclick="goToAltar()" style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;">
            <h3 style="color: #D97706; margin-bottom: 1rem;">🕯️ Altar AR</h3>
            <p style="color: #D1D5DB;">Crea altares virtuales en realidad aumentada</p>
          </div>
          <div onclick="goToMemories()" style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;">
            <h3 style="color: #D97706; margin-bottom: 1rem;">📚 Memorias</h3>
            <p style="color: #D1D5DB;">Guarda historias y recuerdos familiares</p>
          </div>
          <div onclick="goToFamily()" style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;">
            <h3 style="color: #D97706; margin-bottom: 1rem;">👨‍👩‍👧‍👦 Familia</h3>
            <p style="color: #D1D5DB;">Comparte tradiciones con tus seres queridos</p>
          </div>
        </div>
        <div style="margin-top: 2rem; padding: 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid #22C55E; border-radius: 0.5rem;">
          <p style="color: #22C55E; margin: 0;">
            ✅ Aplicación funcionando correctamente - JSConf MX 2025 Challenge
          </p>
        </div>
      </div>
    `
  }

  showAltar() {
    this.currentView = 'altar'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
        <button onclick="goHome()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver al inicio
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          🕯️ Altar de Muertos AR
        </h1>
        <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
          <h2 style="color: #D97706; margin-bottom: 1rem;">Realidad Aumentada</h2>
          <p style="color: #D1D5DB; margin-bottom: 1rem;">
            Experimenta la tradición del Día de Muertos en realidad aumentada. Crea altares virtuales 
            con ofrendas tradicionales como cempasúchil, velas, pan de muerto y fotografías de tus seres queridos.
          </p>
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; border-radius: 0.25rem; padding: 1rem; margin: 1rem 0;">
            <p style="color: #3B82F6; margin: 0;">
              📱 Para usar AR necesitas un dispositivo compatible con WebXR y dar permisos de cámara
            </p>
          </div>
          <button onclick="startAR()" ontouchstart="startAR()" style="background: #D97706; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1.1rem; cursor: pointer; width: 100%; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">
            🚀 Iniciar Experiencia AR
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1rem;">
            <h3 style="color: #F9FAFB; margin-bottom: 0.5rem;">🌼 Cempasúchil</h3>
            <p style="color: #D1D5DB; font-size: 0.9rem;">Flores tradicionales que guían a las almas</p>
          </div>
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1rem;">
            <h3 style="color: #F9FAFB; margin-bottom: 0.5rem;">🕯️ Velas</h3>
            <p style="color: #D1D5DB; font-size: 0.9rem;">Luz para iluminar el camino de regreso</p>
          </div>
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1rem;">
            <h3 style="color: #F9FAFB; margin-bottom: 0.5rem;">🍞 Pan de Muerto</h3>
            <p style="color: #D1D5DB; font-size: 0.9rem;">Ofrenda dulce para los visitantes</p>
          </div>
        </div>
      </div>
    `
  }

  showMemories() {
    this.currentView = 'memories'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
        <button onclick="goHome()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver al inicio
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          📚 Libro de Memorias
        </h1>
        <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
          <h2 style="color: #D97706; margin-bottom: 1rem;">Preserva los Recuerdos</h2>
          <p style="color: #D1D5DB; margin-bottom: 1rem;">
            Crea un libro digital de memorias para honrar a tus seres queridos. Guarda fotografías, 
            historias, anécdotas y tradiciones familiares que perdurarán para las futuras generaciones.
          </p>
          <button onclick="addMemory()" style="background: #D97706; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1.1rem; cursor: pointer; width: 100%; margin-bottom: 1rem;">
            ➕ Agregar Nueva Memoria
          </button>
          <button onclick="viewMemories()" style="background: #374151; color: #F9FAFB; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1.1rem; cursor: pointer; width: 100%;">
            📖 Ver Todas las Memorias
          </button>
        </div>
        <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
          <h3 style="color: #F9FAFB; margin-bottom: 1rem;">Memorias Recientes</h3>
          <div style="color: #D1D5DB; text-align: center; padding: 2rem;">
            <p>No hay memorias guardadas aún.</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">Comienza creando tu primera memoria familiar.</p>
          </div>
        </div>
      </div>
    `
  }

  showFamily() {
    this.currentView = 'family'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
        <button onclick="goHome()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver al inicio
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          👨‍👩‍👧‍👦 Tradiciones Familiares
        </h1>
        <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
          <h2 style="color: #D97706; margin-bottom: 1rem;">Comparte y Conecta</h2>
          <p style="color: #D1D5DB; margin-bottom: 1rem;">
            Conecta con tu familia para compartir tradiciones, historias y mantener viva la memoria 
            de sus seres queridos. Crea un espacio digital donde toda la familia pueda contribuir.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <button onclick="inviteFamily()" style="background: #D97706; color: white; border: none; padding: 1rem; border-radius: 0.5rem; cursor: pointer;">
              👥 Invitar Familia
            </button>
            <button onclick="shareAltar()" style="background: #374151; color: #F9FAFB; border: none; padding: 1rem; border-radius: 0.5rem; cursor: pointer;">
              📤 Compartir Altar
            </button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
            <h3 style="color: #F9FAFB; margin-bottom: 1rem;">🏠 Altar Familiar</h3>
            <p style="color: #D1D5DB; font-size: 0.9rem; margin-bottom: 1rem;">
              Crea un altar colaborativo donde toda la familia puede agregar ofrendas y recuerdos.
            </p>
            <button onclick="goToAltar()" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
              Ver Altar
            </button>
          </div>
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
            <h3 style="color: #F9FAFB; margin-bottom: 1rem;">📱 Código QR</h3>
            <p style="color: #D1D5DB; font-size: 0.9rem; margin-bottom: 1rem;">
              Comparte tu altar y memorias fácilmente con un código QR.
            </p>
            <button onclick="generateQR()" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
              Generar QR
            </button>
          </div>
        </div>
      </div>
    `
  }

  showAddMemory() {
    this.currentView = 'add-memory'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
        <button onclick="goToMemories()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver a Memorias
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          ➕ Nueva Memoria
        </h1>
        
        <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 2rem;">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; color: #D97706; font-weight: 600; margin-bottom: 0.5rem;">
              Nombre de la persona recordada *
            </label>
            <input type="text" id="person-name" required 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #374151; border-radius: 0.25rem; background: #1F2937; color: #F9FAFB; font-size: 1rem; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; color: #D97706; font-weight: 600; margin-bottom: 0.5rem;">
              Historia o recuerdo especial *
            </label>
            <textarea id="memory-story" required rows="4" placeholder="Comparte un recuerdo especial, anécdota o lo que más recuerdas de esta persona..."
                      style="width: 100%; padding: 0.75rem; border: 1px solid #374151; border-radius: 0.25rem; background: #1F2937; color: #F9FAFB; font-size: 1rem; resize: vertical; box-sizing: border-box;"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button onclick="goToMemories()" style="background: #374151; color: #F9FAFB; border: none; padding: 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
              Cancelar
            </button>
            <button onclick="saveMemory()" style="background: #D97706; color: white; border: none; padding: 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
              💾 Guardar Memoria
            </button>
          </div>
        </div>
      </div>
    `
  }

  showAllMemories() {
    const memories = JSON.parse(localStorage.getItem('mictla-memories') || '[]')
    
    this.currentView = 'all-memories'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
        <button onclick="goToMemories()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver a Memorias
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          📖 Todas las Memorias
        </h1>
        
        ${memories.length === 0 ? `
          <div style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 2rem; text-align: center;">
            <p style="color: #D1D5DB; margin-bottom: 1rem;">No hay memorias guardadas aún.</p>
            <button onclick="addMemory()" style="background: #D97706; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; cursor: pointer;">
              ➕ Agregar Primera Memoria
            </button>
          </div>
        ` : `
          <div style="display: grid; gap: 1.5rem;">
            ${memories.map(memory => `
              <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 1.5rem;">
                <h3 style="color: #D97706; margin: 0 0 1rem 0; font-size: 1.3rem;">
                  ${memory.personName}
                </h3>
                <p style="color: #D1D5DB; margin: 0; line-height: 1.4;">
                  ${memory.story}
                </p>
                <p style="color: #9CA3AF; margin: 0.5rem 0 0 0; font-size: 0.8rem;">
                  Guardado el ${new Date(memory.createdAt).toLocaleDateString()}
                </p>
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin-top: 2rem;">
            <button onclick="addMemory()" style="background: #D97706; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; cursor: pointer;">
              ➕ Agregar Otra Memoria
            </button>
          </div>
        `}
      </div>
    `
  }

  showARExperience() {
    this.currentView = 'ar-experience'
    this.container.innerHTML = `
      <div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
        <button onclick="goToAltar()" style="background: #374151; color: #F9FAFB; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-bottom: 2rem; cursor: pointer;">
          ← Volver al Altar
        </button>
        <h1 style="font-family: 'Fredoka One', cursive; color: #D97706; font-size: 2.5rem; margin-bottom: 2rem; text-align: center;">
          🌺 Altar Virtual Interactivo
        </h1>
        
        <div style="background: rgba(217, 119, 6, 0.1); border: 1px solid #D97706; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
          <h2 style="color: #D97706; margin-bottom: 1rem;">Crea tu Altar Virtual</h2>
          <p style="color: #D1D5DB; margin-bottom: 1rem;">
            Aunque AR no está disponible en este momento, puedes crear un altar virtual interactivo 
            con elementos tradicionales del Día de Muertos.
          </p>
          
          <div id="virtual-altar" style="width: 100%; height: 300px; background: linear-gradient(135deg, #1F2937 0%, #374151 100%); border-radius: 0.5rem; margin: 1rem 0; position: relative; overflow: hidden; border: 2px solid #D97706;">
            <video id="camera-feed" style="width: 100%; height: 100%; object-fit: cover; display: none; border-radius: 0.5rem;"></video>
            <canvas id="ar-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none;"></canvas>
            <div id="altar-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
              <div id="altar-elements-display" style="font-size: 3rem; margin-bottom: 1rem;">🕯️</div>
              <p style="margin: 0.5rem 0; color: #D97706; font-weight: 600;">Tu Altar Virtual</p>
              <p id="elements-count" style="margin: 0.5rem 0; font-size: 0.9rem; color: #D1D5DB;">1 elemento</p>
              <button onclick="startCamera()" style="background: #D97706; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;">
                📹 Activar Cámara AR
              </button>
            </div>
          </div>
          
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; border-radius: 0.25rem; padding: 1rem; margin: 1rem 0;">
            <h3 style="color: #3B82F6; margin: 0 0 0.5rem 0;">💡 Para AR Real en iPhone:</h3>
            <ul style="color: #3B82F6; margin: 0; padding-left: 1.5rem; font-size: 0.9rem;">
              <li>Usa Safari (no Chrome)</li>
              <li>iPhone 12 o superior recomendado</li>
              <li>Asegúrate de tener buena iluminación</li>
              <li>Permite acceso a la cámara cuando se solicite</li>
            </ul>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
          <button onclick="addVirtualElement('candle')" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 1rem; border-radius: 0.5rem; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">
            🕯️ Agregar Vela
          </button>
          <button onclick="addVirtualElement('flower')" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 1rem; border-radius: 0.5rem; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">
            🌼 Agregar Flor
          </button>
          <button onclick="addVirtualElement('bread')" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 1rem; border-radius: 0.5rem; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">
            🍞 Agregar Pan
          </button>
          <button onclick="addVirtualElement('photo')" style="background: rgba(217, 119, 6, 0.2); color: #D97706; border: 1px solid #D97706; padding: 1rem; border-radius: 0.5rem; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">
            📷 Agregar Foto
          </button>
        </div>

        <div id="altar-description" style="background: rgba(31, 41, 55, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
          <h3 style="color: #F9FAFB; margin: 0 0 1rem 0;">🌺 Elementos de tu Altar</h3>
          <div id="elements-list">
            <div style="display: flex; align-items: center; margin: 0.5rem 0; padding: 0.5rem; background: rgba(217, 119, 6, 0.1); border-radius: 0.25rem;">
              <span style="font-size: 1.5rem; margin-right: 0.5rem;">🕯️</span>
              <div style="text-align: left;">
                <strong style="color: #D97706;">Vela</strong>
                <p style="margin: 0; font-size: 0.8rem; color: #D1D5DB;">Luz para guiar a las almas</p>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 1rem; text-align: center;">
            <button onclick="clearAltar()" style="background: #EF4444; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; margin-right: 0.5rem;">
              🗑️ Limpiar Altar
            </button>
            <button onclick="shareVirtualAltar()" style="background: #22C55E; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer;">
              📤 Compartir Altar
            </button>
          </div>
        </div>
      </div>
    `
  }
}

// Functions are now defined at the top of the file

// Initialize app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

async function initApp() {
  app = new MictlaApp()
  await app.init()
}

export { MictlaApp }