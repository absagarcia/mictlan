/**
 * Export Service
 * Handles PDF export and sharing capabilities for memorial collections
 */

import { appState } from '../state/AppState.js'
import { i18n } from '../i18n/i18n.js'

export class ExportService {
  constructor() {
    this.isInitialized = false
  }

  /**
   * Initialize export service
   */
  init() {
    if (this.isInitialized) return

    console.log('📤 Initializing Export Service...')
    this.isInitialized = true
    console.log('✅ Export Service initialized')
  }

  /**
   * Export memorials to PDF
   */
  async exportToPDF(options = {}) {
    const {
      memorials = appState.get('memorials') || [],
      includePhotos = true,
      includeStories = true,
      includeAudio = false,
      format = 'portrait',
      title = 'Libro de Memorias Familiares'
    } = options

    try {
      console.log('📄 Generating PDF export...')

      // Create PDF content
      const pdfContent = await this.generatePDFContent({
        memorials,
        includePhotos,
        includeStories,
        includeAudio,
        title
      })

      // Generate PDF using browser's print functionality
      const pdfBlob = await this.generatePDFBlob(pdfContent, format)

      // Create download
      this.downloadFile(pdfBlob, `${title.replace(/\s+/g, '_')}.pdf`, 'application/pdf')

      console.log('✅ PDF export completed')
      return true

    } catch (error) {
      console.error('❌ PDF export failed:', error)
      throw error
    }
  }

  /**
   * Generate PDF content HTML
   */
  async generatePDFContent(options) {
    const { memorials, includePhotos, includeStories, includeAudio, title } = options
    const currentDate = new Date().toLocaleDateString()

    let content = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-header">
              <h1 class="cover-title">🌺 ${title}</h1>
              <p class="cover-subtitle">Creado con Mictla - Altar de Muertos AR</p>
              <p class="cover-date">Generado el ${currentDate}</p>
            </div>
            
            <div class="cover-quote">
              <blockquote>
                "La familia es lo más importante. La familia es nuestra raíz, nuestra historia, nuestra identidad."
                <cite>- Inspirado en Coco</cite>
              </blockquote>
            </div>
            
            <div class="cover-stats">
              <div class="stat">
                <span class="stat-number">${memorials.length}</span>
                <span class="stat-label">Memorias Preservadas</span>
              </div>
              <div class="stat">
                <span class="stat-number">${memorials.filter(m => m.photo).length}</span>
                <span class="stat-label">Fotografías</span>
              </div>
              <div class="stat">
                <span class="stat-number">${memorials.filter(m => m.story).length}</span>
                <span class="stat-label">Historias</span>
              </div>
            </div>
          </div>
          
          <!-- Table of Contents -->
          <div class="page-break">
            <div class="toc-page">
              <h2>📖 Índice</h2>
              <ul class="toc-list">
                ${memorials.map((memorial, index) => `
                  <li class="toc-item">
                    <span class="toc-name">${memorial.name}</span>
                    <span class="toc-dots"></span>
                    <span class="toc-page">${index + 3}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
    `

    // Add memorial pages
    for (let i = 0; i < memorials.length; i++) {
      const memorial = memorials[i]
      content += await this.generateMemorialPage(memorial, {
        includePhotos,
        includeStories,
        includeAudio,
        pageNumber: i + 3
      })
    }

    // Add footer page
    content += `
          <!-- Footer Page -->
          <div class="page-break">
            <div class="footer-page">
              <div class="footer-content">
                <h3>🌺 Mictla - Altar de Muertos AR</h3>
                <p>Este libro de memorias fue creado con Mictla, una aplicación de realidad aumentada que combina la tradición del Día de Muertos con la tecnología moderna.</p>
                
                <div class="footer-info">
                  <p><strong>Creado para:</strong> JSConf MX 2025 - Code of the Dead Challenge</p>
                  <p><strong>Fecha de generación:</strong> ${currentDate}</p>
                  <p><strong>Hashtags:</strong> #JSConfMX #DíaDeMuertos #Mictla #AR</p>
                </div>
                
                <div class="footer-quote">
                  <p><em>"Recordar es volver a vivir. Cada memoria preservada es un pedazo de eternidad."</em></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return content
  }

  /**
   * Generate individual memorial page
   */
  async generateMemorialPage(memorial, options) {
    const { includePhotos, includeStories, includeAudio } = options
    const birthYear = memorial.birthDate ? new Date(memorial.birthDate).getFullYear() : '?'
    const deathYear = memorial.deathDate ? new Date(memorial.deathDate).getFullYear() : '?'
    const age = memorial.birthDate && memorial.deathDate ? 
      new Date(memorial.deathDate).getFullYear() - new Date(memorial.birthDate).getFullYear() : null

    let photoContent = ''
    if (includePhotos && memorial.photo) {
      try {
        const photoData = await this.convertImageToBase64(memorial.photo)
        photoContent = `
          <div class="memorial-photo-container">
            <img src="${photoData}" alt="${memorial.name}" class="memorial-photo">
          </div>
        `
      } catch (error) {
        console.warn('Failed to include photo for', memorial.name, error)
        photoContent = `
          <div class="memorial-photo-placeholder">
            <div class="photo-icon">📷</div>
            <p>Fotografía no disponible</p>
          </div>
        `
      }
    }

    return `
      <div class="page-break">
        <div class="memorial-page">
          <div class="memorial-header">
            ${photoContent}
            <div class="memorial-info">
              <h2 class="memorial-name">${memorial.name}</h2>
              <p class="memorial-relationship">${i18n.t(`relationships.${memorial.relationship}`) || memorial.relationship}</p>
              <div class="memorial-dates">
                <span class="date-range">${birthYear} - ${deathYear}</span>
                ${age ? `<span class="age">(${age} años)</span>` : ''}
              </div>
            </div>
          </div>
          
          ${includeStories && memorial.story ? `
            <div class="memorial-story">
              <h3>📖 Su Historia</h3>
              <div class="story-content">
                ${memorial.story.split('\n').map(paragraph => 
                  paragraph.trim() ? `<p>${paragraph}</p>` : ''
                ).join('')}
              </div>
            </div>
          ` : ''}
          
          ${memorial.offerings && memorial.offerings.length > 0 ? `
            <div class="memorial-offerings">
              <h3>🕯️ Ofrendas Preferidas</h3>
              <ul class="offerings-list">
                ${memorial.offerings.map(offering => `
                  <li>${offering}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${includeAudio && memorial.audioMessage ? `
            <div class="memorial-audio">
              <h3>🎵 Mensaje de Audio</h3>
              <p class="audio-note">
                <em>Este memorial incluye un mensaje de audio que puede ser reproducido en la aplicación Mictla.</em>
              </p>
            </div>
          ` : ''}
          
          <div class="memorial-footer">
            <div class="altar-info">
              <p><strong>Ubicación en el Altar:</strong> ${this.getAltarLevelName(memorial.altarLevel)}</p>
            </div>
            <div class="qr-placeholder">
              <div class="qr-icon">📱</div>
              <p>Escanea con Mictla para ver en AR</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Get altar level name
   */
  getAltarLevelName(level) {
    const levels = {
      1: 'Nivel Terrenal',
      2: 'Nivel Purgatorio', 
      3: 'Nivel Celestial'
    }
    return levels[level] || 'No asignado'
  }

  /**
   * Convert image to base64
   */
  async convertImageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0)
        
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8)
          resolve(dataURL)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = reject
      img.src = imageUrl
    })
  }

  /**
   * Get PDF styles
   */
  getPDFStyles() {
    return `
      @page {
        size: A4;
        margin: 2cm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      
      .pdf-container {
        max-width: 100%;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .page-break:first-child {
        page-break-before: auto;
      }
      
      /* Cover Page */
      .cover-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        text-align: center;
      }
      
      .cover-title {
        font-size: 3em;
        color: #D97706;
        margin-bottom: 0.5em;
        font-weight: bold;
      }
      
      .cover-subtitle {
        font-size: 1.2em;
        color: #666;
        margin-bottom: 0.5em;
      }
      
      .cover-date {
        font-size: 1em;
        color: #888;
        margin-bottom: 2em;
      }
      
      .cover-quote {
        margin: 2em 0;
        padding: 2em;
        border-left: 4px solid #D97706;
        background: #f9f9f9;
        max-width: 80%;
      }
      
      .cover-quote blockquote {
        font-size: 1.3em;
        font-style: italic;
        margin: 0;
        color: #555;
      }
      
      .cover-quote cite {
        display: block;
        margin-top: 1em;
        font-size: 0.9em;
        color: #777;
      }
      
      .cover-stats {
        display: flex;
        gap: 2em;
        margin-top: 2em;
      }
      
      .stat {
        text-align: center;
      }
      
      .stat-number {
        display: block;
        font-size: 2.5em;
        font-weight: bold;
        color: #D97706;
      }
      
      .stat-label {
        font-size: 0.9em;
        color: #666;
      }
      
      /* Table of Contents */
      .toc-page {
        padding: 2em 0;
      }
      
      .toc-page h2 {
        color: #D97706;
        border-bottom: 2px solid #D97706;
        padding-bottom: 0.5em;
        margin-bottom: 1.5em;
      }
      
      .toc-list {
        list-style: none;
        padding: 0;
      }
      
      .toc-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.8em;
        font-size: 1.1em;
      }
      
      .toc-name {
        font-weight: bold;
      }
      
      .toc-dots {
        flex: 1;
        border-bottom: 1px dotted #ccc;
        margin: 0 1em;
        height: 1px;
      }
      
      .toc-page {
        font-weight: bold;
        color: #D97706;
      }
      
      /* Memorial Pages */
      .memorial-page {
        padding: 1em 0;
      }
      
      .memorial-header {
        display: flex;
        gap: 2em;
        margin-bottom: 2em;
        align-items: flex-start;
      }
      
      .memorial-photo-container {
        flex-shrink: 0;
      }
      
      .memorial-photo {
        width: 150px;
        height: 200px;
        object-fit: cover;
        border: 3px solid #D97706;
        border-radius: 8px;
      }
      
      .memorial-photo-placeholder {
        width: 150px;
        height: 200px;
        border: 2px dashed #ccc;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f9f9f9;
      }
      
      .photo-icon {
        font-size: 2em;
        margin-bottom: 0.5em;
      }
      
      .memorial-info {
        flex: 1;
      }
      
      .memorial-name {
        font-size: 2.5em;
        color: #D97706;
        margin: 0 0 0.3em 0;
        font-weight: bold;
      }
      
      .memorial-relationship {
        font-size: 1.3em;
        color: #666;
        margin: 0 0 0.5em 0;
        font-style: italic;
      }
      
      .memorial-dates {
        font-size: 1.1em;
        color: #888;
      }
      
      .date-range {
        font-weight: bold;
      }
      
      .age {
        margin-left: 0.5em;
        font-style: italic;
      }
      
      .memorial-story {
        margin-bottom: 2em;
      }
      
      .memorial-story h3 {
        color: #7C3AED;
        border-bottom: 1px solid #7C3AED;
        padding-bottom: 0.3em;
        margin-bottom: 1em;
      }
      
      .story-content p {
        margin-bottom: 1em;
        text-align: justify;
      }
      
      .memorial-offerings {
        margin-bottom: 2em;
      }
      
      .memorial-offerings h3 {
        color: #EF4444;
        border-bottom: 1px solid #EF4444;
        padding-bottom: 0.3em;
        margin-bottom: 1em;
      }
      
      .offerings-list {
        columns: 2;
        column-gap: 2em;
      }
      
      .offerings-list li {
        margin-bottom: 0.5em;
        break-inside: avoid;
      }
      
      .memorial-audio {
        margin-bottom: 2em;
        padding: 1em;
        background: #f0f9ff;
        border-left: 4px solid #3B82F6;
        border-radius: 4px;
      }
      
      .memorial-audio h3 {
        color: #3B82F6;
        margin-top: 0;
      }
      
      .audio-note {
        font-style: italic;
        color: #666;
        margin: 0;
      }
      
      .memorial-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2em;
        padding-top: 1em;
        border-top: 1px solid #eee;
      }
      
      .altar-info {
        font-size: 0.9em;
        color: #666;
      }
      
      .qr-placeholder {
        text-align: center;
        font-size: 0.8em;
        color: #888;
      }
      
      .qr-icon {
        font-size: 1.5em;
        margin-bottom: 0.3em;
      }
      
      /* Footer Page */
      .footer-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
      }
      
      .footer-content h3 {
        color: #D97706;
        font-size: 2em;
        margin-bottom: 1em;
      }
      
      .footer-info {
        margin: 2em 0;
        padding: 1.5em;
        background: #f9f9f9;
        border-radius: 8px;
      }
      
      .footer-info p {
        margin: 0.5em 0;
      }
      
      .footer-quote {
        margin-top: 2em;
        font-style: italic;
        color: #666;
        font-size: 1.1em;
      }
      
      /* Print optimizations */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .memorial-header {
          break-inside: avoid;
        }
        
        .memorial-story {
          break-inside: avoid;
        }
      }
    `
  }

  /**
   * Generate PDF blob using print functionality
   */
  async generatePDFBlob(htmlContent, format) {
    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    
    document.body.appendChild(iframe)
    
    try {
      // Write content to iframe
      iframe.contentDocument.open()
      iframe.contentDocument.write(htmlContent)
      iframe.contentDocument.close()
      
      // Wait for content to load
      await new Promise(resolve => {
        iframe.onload = resolve
        setTimeout(resolve, 1000) // Fallback timeout
      })
      
      // For now, we'll use the browser's print dialog
      // In a real implementation, you might use a library like jsPDF or Puppeteer
      iframe.contentWindow.print()
      
      // Return a placeholder blob
      return new Blob([htmlContent], { type: 'text/html' })
      
    } finally {
      document.body.removeChild(iframe)
    }
  }

  /**
   * Export memorials to JSON
   */
  async exportToJSON(options = {}) {
    const {
      memorials = appState.get('memorials') || [],
      includeMetadata = true
    } = options

    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        source: 'Mictla - Altar de Muertos AR',
        memorials: memorials.map(memorial => ({
          ...memorial,
          // Remove sensitive data if needed
          syncStatus: undefined
        }))
      }

      if (includeMetadata) {
        exportData.metadata = {
          totalMemorials: memorials.length,
          memorialsWithPhotos: memorials.filter(m => m.photo).length,
          memorialsWithStories: memorials.filter(m => m.story).length,
          memorialsWithAudio: memorials.filter(m => m.audioMessage).length,
          relationships: [...new Set(memorials.map(m => m.relationship))],
          altarLevels: [...new Set(memorials.map(m => m.altarLevel))]
        }
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      this.downloadFile(blob, 'memorias_familiares.json', 'application/json')
      
      console.log('✅ JSON export completed')
      return true

    } catch (error) {
      console.error('❌ JSON export failed:', error)
      throw error
    }
  }

  /**
   * Create secure sharing link
   */
  async createSharingLink(memorialIds, options = {}) {
    const {
      expirationDays = 30,
      password = null,
      allowDownload = true
    } = options

    try {
      // Generate unique sharing code
      const shareCode = this.generateShareCode()
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + expirationDays)

      // Get memorials to share
      const allMemorials = appState.get('memorials') || []
      const memorialsToShare = allMemorials.filter(m => memorialIds.includes(m.id))

      // Create sharing data
      const sharingData = {
        id: shareCode,
        memorials: memorialsToShare,
        createdAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString(),
        password: password,
        allowDownload: allowDownload,
        accessCount: 0,
        maxAccess: 100 // Limit access attempts
      }

      // Store in localStorage (in a real app, this would be sent to a server)
      const existingShares = JSON.parse(localStorage.getItem('mictla-shares') || '{}')
      existingShares[shareCode] = sharingData
      localStorage.setItem('mictla-shares', JSON.stringify(existingShares))

      // Generate sharing URL
      const baseUrl = window.location.origin
      const sharingUrl = `${baseUrl}/share/${shareCode}`

      console.log('✅ Sharing link created:', sharingUrl)
      
      return {
        url: sharingUrl,
        code: shareCode,
        expiresAt: expirationDate,
        memorialCount: memorialsToShare.length
      }

    } catch (error) {
      console.error('❌ Failed to create sharing link:', error)
      throw error
    }
  }

  /**
   * Generate unique share code
   */
  generateShareCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Share on social media
   */
  async shareOnSocialMedia(platform, options = {}) {
    const {
      message = 'Preservando memorias familiares con Mictla 🌺',
      url = window.location.href,
      hashtags = ['JSConfMX', 'DíaDeMuertos', 'Mictla', 'AR', 'Familia']
    } = options

    const encodedMessage = encodeURIComponent(message)
    const encodedUrl = encodeURIComponent(url)
    const hashtagString = hashtags.map(tag => `#${tag}`).join(' ')
    const encodedHashtags = encodeURIComponent(hashtagString)

    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}&hashtags=${hashtags.join(',')}`
        break
        
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`
        break
        
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage} ${encodedUrl} ${encodedHashtags}`
        break
        
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage} ${encodedHashtags}`
        break
        
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Open sharing window
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    
    console.log(`📱 Shared on ${platform}`)
    return true
  }

  /**
   * Download file
   */
  downloadFile(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  /**
   * Get sharing statistics
   */
  getSharingStats() {
    const shares = JSON.parse(localStorage.getItem('mictla-shares') || '{}')
    const activeShares = Object.values(shares).filter(share => 
      new Date(share.expiresAt) > new Date()
    )

    return {
      totalShares: Object.keys(shares).length,
      activeShares: activeShares.length,
      totalAccess: Object.values(shares).reduce((sum, share) => sum + share.accessCount, 0),
      memorialsShared: activeShares.reduce((sum, share) => sum + share.memorials.length, 0)
    }
  }

  /**
   * Dispose export service
   */
  dispose() {
    this.isInitialized = false
    console.log('🧹 Export Service disposed')
  }
}

// Create singleton instance
export const exportService = new ExportService()