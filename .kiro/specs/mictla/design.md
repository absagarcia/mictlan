# Design Document - Mictla

## Overview

Mictla es una aplicación web progresiva (PWA) que combina realidad aumentada con educación cultural sobre el Día de Muertos. La aplicación utiliza WebXR y Three.js para crear una experiencia inmersiva donde los usuarios pueden explorar un altar de muertos en 3D, aprender sobre sus niveles tradicionales, y crear un libro de memorias digital de sus seres queridos fallecidos.

La arquitectura sigue los principios del JSConf MX Challenge, implementando una solución front-end completa con persistencia local y capacidades offline, optimizada para dispositivos móviles y desktop.

## Architecture

### Project Structure

```
mictla/
├── public/
│   ├── assets/
│   │   ├── models/          # 3D altar models (.gltf)
│   │   ├── textures/        # Altar textures, patterns
│   │   ├── audio/           # Cultural explanations
│   │   └── icons/           # App icons, favicons
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service Worker
├── src/
│   ├── state/
│   │   ├── AppState.js          # Global state management
│   │   ├── MemoryState.js       # Memorial data state
│   │   └── ARState.js           # AR session state
│   ├── router/
│   │   └── Router.js            # SPA routing
│   ├── i18n/
│   │   ├── es.json              # Spanish translations
│   │   ├── en.json              # English translations
│   │   └── i18n.js              # Internationalization
│   ├── components/
│   │   ├── ar/
│   │   │   ├── ARAltarComponent.js
│   │   │   ├── ARManager.js
│   │   │   └── WebXRPolyfill.js
│   │   ├── memory/
│   │   │   ├── MemoryBookComponent.js
│   │   │   ├── MemoryForm.js
│   │   │   └── MemoryGallery.js
│   │   ├── education/
│   │   │   ├── EducationalContent.js
│   │   │   ├── LevelExplainer.js
│   │   │   └── CocoReferences.js
│   │   ├── sharing/
│   │   │   ├── ShareManager.js   # Family sharing logic
│   │   │   ├── ExportService.js  # PDF/JSON export
│   │   │   └── SyncService.js    # Cross-device sync
│   │   └── ui/
│   │       ├── Navigation.js
│   │       ├── Modal.js
│   │       ├── LoadingSpinner.js
│   │       ├── FamilyTree.js     # Generational relationships
│   │       └── OfferingPlacer.js # Virtual offerings UI
│   ├── services/
│   │   ├── StorageManager.js
│   │   ├── ARService.js
│   │   ├── MediaService.js
│   │   ├── ValidationService.js
│   │   ├── SharingService.js     # Family sharing backend
│   │   ├── SyncService.js        # Cross-device synchronization
│   │   └── PolyfillService.js    # WebXR compatibility
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── culturalData.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── components.css
│   │   └── ar-styles.css
│   ├── types/
│   │   └── index.js         # Type definitions
│   └── main.js              # App entry point
├── .kiro/
│   ├── hooks/
│   │   ├── auto-save.js
│   │   ├── cultural-validation.js
│   │   └── ar-optimization.js
│   ├── steering/
│   │   ├── cultural-guidelines.md
│   │   ├── technical-standards.md
│   │   └── accessibility-rules.md
│   └── settings/
│       └── mcp.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── vite.config.js
├── package.json
└── README.md
```

### Technology Stack

- **Frontend Framework**: Vanilla JavaScript con módulos ES6
- **3D/AR Engine**: Three.js + WebXR Device API
- **UI Framework**: CSS3 con Custom Properties y Grid/Flexbox
- **Storage**: IndexedDB para persistencia local
- **Build Tool**: Vite para desarrollo y bundling
- **PWA**: Service Worker para funcionalidad offline
- **Kiro Advanced Features**:
  - **Hooks**: Automatización de tareas (auto-save memorias, validación cultural)
  - **Steering**: Reglas de contexto cultural y mejores prácticas del Día de Muertos
  - **MCP**: Integración con servicios externos (traducción, validación cultural, APIs de contenido)

### Dependencies & Configuration

**Core Dependencies**:

```json
{
  "three": "^0.158.0",
  "vite": "^4.5.0",
  "@webxr-input-profiles/motion-controllers": "^1.0.0"
}
```

**Development Dependencies**:

```json
{
  "vitest": "^0.34.0",
  "@vitest/ui": "^0.34.0",
  "playwright": "^1.40.0",
  "eslint": "^8.50.0"
}
```

**Vite Configuration**:

```javascript
// vite.config.js
export default {
  server: { https: true }, // Required for WebXR
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          ar: ["./src/components/ar/"],
        },
      },
    },
  },
  pwa: {
    registerType: "autoUpdate",
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,gltf}"],
    },
  },
};
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mictla Web App                           │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ├── Main Menu                                              │
│  ├── AR Altar View                                          │
│  ├── Memory Book Interface                                  │
│  └── Educational Content Panels                             │
├─────────────────────────────────────────────────────────────┤
│  Core Logic Layer                                           │
│  ├── AR Manager (WebXR + Three.js)                         │
│  ├── Memory Manager (CRUD operations)                       │
│  ├── Educational Content Manager                            │
│  └── State Manager (App state)                              │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── IndexedDB (Memorial entries, user preferences)         │
│  ├── Local Storage (session data)                           │
│  └── Static Assets (3D models, textures, audio)             │
└─────────────────────────────────────────────────────────────┘
```

## State Management Architecture

### Global State Structure

```javascript
const AppState = {
  user: UserPreferences,
  memorials: Memorial[],
  familyGroup: FamilyGroup,
  arSession: {
    isActive: boolean,
    camera: Camera,
    scene: Scene,
    offerings: VirtualOffering[]
  },
  ui: {
    currentView: string,
    loading: boolean,
    modals: Modal[],
    notifications: Notification[]
  },
  sync: {
    status: "idle" | "syncing" | "error",
    lastSync: Date,
    pendingChanges: Change[]
  }
}
```

### State Management Pattern

- **Reactive State**: Observable pattern for UI updates
- **Persistence**: Auto-save to IndexedDB on state changes
- **Sync**: Conflict resolution for multi-device usage
- **Undo/Redo**: Action history for memorial editing

## Routing & Navigation

### Route Structure

```javascript
const routes = {
  "/": "HomeView", // Main menu
  "/altar": "AltarView", // AR altar experience
  "/memories": "MemoryView", // Memory book
  "/family": "FamilyView", // Family sharing
  "/learn": "LearnView", // Educational content
  "/settings": "SettingsView",
};
```

### Navigation Flow

- **Deep Linking**: Share specific memorials via URL
- **History Management**: Browser back/forward support
- **Offline Routing**: Local navigation when offline

## Internationalization Strategy

### Translation Architecture

```javascript
const i18n = {
  es: {
    "altar.level1": "Nivel Terrenal",
    "memorial.add": "Agregar Memoria",
    "coco.quote": "La familia es lo más importante",
  },
  en: {
    "altar.level1": "Earthly Level",
    "memorial.add": "Add Memory",
    "coco.quote": "Family is everything",
  },
};
```

### Cultural Localization

- **Date Formats**: Regional preferences
- **Cultural Context**: Adapted explanations per region
- **Audio**: Bilingual narration for educational content

## Components and Interfaces

### 1. AR Altar Component

**Purpose**: Renderiza el altar de muertos en 3D con capacidades AR

**Key Features**:

- Tres niveles del altar (tierra, purgatorio, cielo) como modelos 3D
- Elementos interactivos clickeables en cada nivel
- Integración de fotos familiares como texturas en el altar
- Animaciones suaves para transiciones entre niveles

**Interface**:

```javascript
class ARAltarComponent {
  constructor(container, memoryData)
  initializeAR()
  loadAltarModel()
  addMemorialToAltar(memorial)
  showLevelInfo(level)
  enableInteraction()
}
```

### 2. Memory Book Component

**Purpose**: Gestiona la creación y visualización de memorias familiares

**Key Features**:

- Formulario para agregar nuevas memorias
- Galería de memorias existentes
- Integración con cámara para fotos
- Grabación de audio para historias

**Interface**:

```javascript
class MemoryBookComponent {
  constructor(container, storageManager)
  createMemorialEntry()
  displayMemories()
  editMemorial(id)
  deleteMemorial(id)
  exportMemories()
}
```

### 3. Educational Content Component

**Purpose**: Presenta información cultural sobre el Día de Muertos

**Key Features**:

- Contenido interactivo sobre cada nivel del altar
- Explicaciones culturales con referencias a Coco
- Multimedia (texto, imágenes, audio)
- Navegación contextual

**Interface**:

```javascript
class EducationalContentComponent {
  constructor(container)
  loadLevelContent(level)
  showCulturalContext()
  playAudioExplanation()
  displayRelatedContent()
}
```

### 4. Storage Manager

**Purpose**: Maneja la persistencia de datos local

**Interface**:

```javascript
class StorageManager {
  constructor()
  saveMemorial(memorial)
  getMemorials()
  updateMemorial(id, data)
  deleteMemorial(id)
  exportData()
  importData(data)
  // New methods for sharing & sync
  shareMemorial(memorialId, familyEmails)
  syncWithFamily(groupId)
  resolveConflicts(conflicts)
  generateShareCode(memorialId)
}
```

### 5. Family Sharing Component

**Purpose**: Gestiona la colaboración familiar en memorias

**Key Features**:

- Invitación de familiares por email/código
- Sincronización de memorias compartidas
- Resolución de conflictos de edición
- Permisos granulares por memorial

**Interface**:

```javascript
class FamilySharingComponent {
  constructor(container, syncService)
  inviteFamily(emails)
  joinFamily(inviteCode)
  shareMemorial(memorialId, permissions)
  syncMemorials()
  resolveConflict(conflictId, resolution)
}
```

### 6. Virtual Offerings Component

**Purpose**: Permite colocar ofrendas virtuales en el altar AR

**Key Features**:

- Catálogo de ofrendas tradicionales
- Colocación 3D en el altar
- Dedicatorias personalizadas
- Visualización de ofrendas familiares

**Interface**:

```javascript
class VirtualOfferingsComponent {
  constructor(arScene, memorialData)
  showOfferingCatalog()
  placeOffering(type, position, memorialId)
  addDedication(offeringId, message)
  displayFamilyOfferings()
  removeOffering(offeringId)
}
```

## User Flows

### Primary User Journey

1. **First Visit**: Splash screen → Cultural intro → AR permission → Tutorial
2. **Explore Altar**: Navigate levels → Learn traditions → View offerings
3. **Create Memory**: Add family member → Upload photo → Record story → Place on altar
4. **Return Visit**: View memories → Add new entries → Share with family

### Error Handling Flows

- **No AR Support**: Graceful fallback to 3D view
- **Storage Full**: Compress images → Notify user → Offer export
- **Network Issues**: Offline mode → Queue sync → Retry logic

## Data Models & Types

### Memorial Entry Model

```javascript
{
  id: string,
  name: string,
  photo: string, // base64 or blob URL
  birthDate: Date,
  deathDate: Date,
  relationship: string, // "padre", "madre", "abuelo", etc.
  story: string,
  audioMessage: string, // base64 audio
  offerings: string[], // preferred offerings
  altarLevel: number, // 1-3, which level they appear on
  familyConnections: {
    parents: string[], // memorial IDs
    children: string[], // memorial IDs
    spouse: string // memorial ID
  },
  virtualOfferings: {
    position: { x: number, y: number, z: number },
    items: string[] // offering types placed
  },
  sharing: {
    isShared: boolean,
    sharedWith: string[], // family member emails
    shareCode: string, // unique sharing identifier
    permissions: string[] // "view", "edit", "comment"
  },
  createdAt: Date,
  updatedAt: Date,
  syncStatus: "local" | "synced" | "pending"
}
```

### Altar Level Model

```javascript
{
  level: number, // 1, 2, or 3
  name: string, // "Tierra", "Purgatorio", "Cielo"
  description: string,
  traditionalOfferings: string[],
  culturalSignificance: string,
  cocoReference: string, // connection to movie themes
  memorials: string[] // memorial IDs placed on this level
}
```

### User Preferences Model

```javascript
{
  userId: string, // unique user identifier
  language: string, // "es" or "en"
  arEnabled: boolean,
  audioEnabled: boolean,
  tutorialCompleted: boolean,
  lastVisit: Date,
  familyGroup: {
    groupId: string,
    role: "admin" | "member",
    inviteCode: string
  },
  syncSettings: {
    autoSync: boolean,
    lastSyncTime: Date,
    conflictResolution: "local" | "remote" | "manual"
  },
  exportSettings: {
    includeAudio: boolean,
    format: "pdf" | "json",
    quality: "high" | "medium" | "low"
  }
}
```

### Family Group Model

```javascript
{
  groupId: string,
  name: string, // "Familia García"
  members: [{
    userId: string,
    email: string,
    role: "admin" | "member",
    joinedAt: Date
  }],
  sharedMemorials: string[], // memorial IDs
  inviteCode: string,
  createdAt: Date,
  settings: {
    allowNewMembers: boolean,
    requireApproval: boolean,
    defaultPermissions: string[]
  }
}
```

### Virtual Offering Model

```javascript
{
  id: string,
  type: "cempasuchil" | "pan_de_muerto" | "agua" | "sal" | "foto" | "vela",
  position: { x: number, y: number, z: number },
  memorialId: string, // which memorial it's for
  placedBy: string, // user ID
  message: string, // optional dedication
  createdAt: Date
}
```

## Error Handling

### AR Compatibility

- Detectar soporte WebXR al cargar la aplicación
- Fallback a visualización 3D estándar sin AR
- Mensajes informativos sobre requisitos del dispositivo

### Storage Errors

- Manejo de cuotas excedidas en IndexedDB
- Backup automático a localStorage como fallback
- Notificaciones al usuario sobre límites de almacenamiento

### Media Handling

- Validación de formatos de imagen y audio
- Compresión automática de archivos grandes
- Manejo de errores de cámara y micrófono

### Network Resilience

- Funcionalidad completa offline después de primera carga
- Service Worker para cacheo de assets
- Sincronización diferida cuando hay conectividad

## Testing Strategy

### Unit Testing (Vitest)

```javascript
// Example test structure
describe("MemoryBookComponent", () => {
  test("creates memorial entry with valid data");
  test("validates image upload formats");
  test("handles storage quota exceeded");
});
```

### Integration Testing

- **Component Interaction**: AR ↔ Memory Book integration
- **Storage Operations**: IndexedDB CRUD operations
- **Media Handling**: Camera, audio recording flows
- **Offline Functionality**: Service Worker behavior

### E2E Testing (Playwright)

```javascript
// Critical user journeys
test("Complete memory creation flow");
test("AR altar exploration");
test("Offline mode functionality");
test("Cross-device synchronization");
```

### Accessibility Testing

- **WCAG 2.1 AA Compliance**: Color contrast, keyboard navigation
- **Screen Reader Support**: ARIA labels, semantic HTML
- **Mobile Accessibility**: Touch targets, voice control
- **Cultural Sensitivity**: Respectful language, inclusive design

### Performance Testing

- **Lighthouse Audits**: PWA score, performance metrics
- **WebXR Performance**: Frame rate monitoring, memory usage
- **Load Testing**: Large memorial collections
- **Network Testing**: Slow 3G, offline scenarios

## Assets & Resources

### Visual Assets

- **Altar Models**: Optimized GLTF files (< 500KB each level)
- **Textures**: Compressed WebP format, traditional patterns
- **Icons**: SVG icon set with Day of the Dead motifs
- **Fonts**:
  - Fredoka One (headings, playful)
  - Inter (body text, readable)

### Audio Assets

- **Cultural Explanations**: Compressed MP3, bilingual
- **Ambient Sounds**: Subtle background audio
- **UI Sounds**: Respectful interaction feedback

### Cultural Content

- **Traditional Offerings**: Cempasúchil, pan de muerto, agua, sal
- **Level Meanings**: Tierra (earthly), Purgatorio (transition), Cielo (heavenly)
- **Coco References**: Family memory themes, music importance

## Security & Privacy

### Data Protection

- **Local Storage**: All personal data stays on device
- **Image Processing**: Client-side compression and validation
- **Content Sanitization**: XSS prevention for user inputs
- **Privacy Controls**: Clear data deletion options

### Input Validation

- **File Upload**: Size limits, format validation, malware scanning
- **Text Input**: Length limits, profanity filtering, cultural sensitivity
- **Audio Recording**: Duration limits, format validation

## Performance Considerations

### 3D Asset Optimization

- Modelos 3D optimizados para web (< 2MB total)
- Texturas comprimidas con formatos modernos
- Lazy loading de assets no críticos

### Memory Management

- Disposal correcto de geometrías y texturas Three.js
- Límites en número de memorias cargadas simultáneamente
- Garbage collection proactivo

### Mobile Optimization

- Detección de capacidades del dispositivo
- Ajuste automático de calidad de renderizado
- Optimización de batería para sesiones AR largas

### Code Splitting & Lazy Loading

- **Route-based splitting**: AR components loaded on demand
- **Image lazy loading**: Progressive loading of memorial photos
- **Asset preloading**: Critical 3D models cached first
- **Service Worker**: Intelligent caching strategy

### Build Optimization

- **Tree shaking**: Remove unused Three.js modules
- **Bundle analysis**: Monitor chunk sizes
- **Compression**: Gzip/Brotli for static assets
- **CDN Ready**: Optimized for edge deployment

## Cultural Sensitivity

### Content Guidelines

- Representación respetuosa de tradiciones mexicanas
- Consulta con fuentes culturales auténticas
- Evitar apropiación cultural o trivialización

### Inclusive Design

- Soporte para diferentes estructuras familiares
- Opciones de personalización cultural
- Respeto por diferentes creencias sobre la muerte

### Educational Accuracy

- Información verificada sobre tradiciones del Día de Muertos
- Referencias apropiadas a la película Coco
- Conexión auténtica entre tecnología y cultura

## Kiro Advanced Features Integration

### Hooks Implementation

**Purpose**: Automatizar tareas repetitivas y mejorar la experiencia del usuario

**Planned Hooks**:

1. **Auto-Save Hook**: Guarda automáticamente las memorias mientras el usuario escribe
2. **Cultural Validation Hook**: Valida que el contenido sea culturalmente apropiado
3. **Memory Reminder Hook**: Notifica fechas importantes (cumpleaños, aniversarios)
4. **AR Performance Hook**: Optimiza automáticamente la calidad AR según el dispositivo

**Hook Configuration**:

```javascript
// .kiro/hooks/auto-save-memories.js
{
  trigger: "onTextChange",
  target: "memory-form",
  action: "saveToIndexedDB",
  debounce: 2000
}
```

### Steering Rules

**Purpose**: Mantener consistencia cultural y técnica en todo el desarrollo

**Cultural Steering**:

- Terminología correcta en español para elementos del altar
- Representación respetuosa de tradiciones mexicanas
- Referencias apropiadas a la película Coco
- Guías de colores y símbolos tradicionales

**Technical Steering**:

- Estándares de accesibilidad web
- Optimización para dispositivos móviles
- Mejores prácticas de WebXR
- Patrones de diseño consistentes

**Steering Files**:

```
.kiro/steering/
├── cultural-guidelines.md
├── technical-standards.md
├── accessibility-rules.md
└── ar-best-practices.md
```

### MCP Integration

**Purpose**: Conectar con servicios externos para enriquecer la experiencia

**Planned MCP Servers**:

1. **Translation MCP**: Traducción automática español/inglés para contenido
2. **Cultural Content MCP**: Validación de información cultural con fuentes auténticas
3. **Image Processing MCP**: Optimización automática de fotos familiares
4. **Audio Processing MCP**: Mejora de calidad de grabaciones de voz

**MCP Configuration**:

```json
{
  "mcpServers": {
    "cultural-validator": {
      "command": "uvx",
      "args": ["cultural-content-validator@latest"],
      "autoApprove": ["validateTradition", "checkCulturalAccuracy"]
    },
    "image-optimizer": {
      "command": "uvx",
      "args": ["image-processing-mcp@latest"],
      "autoApprove": ["compressImage", "generateThumbnail"]
    }
  }
}
```

### Level Mictlán Achievement Strategy

**Comprehensive Kiro Stack Usage**:

1. **Specs**: Documentación completa de requirements, design y tasks ✓
2. **Hooks**: Mínimo 3 hooks automatizados para mejorar UX
3. **Steering**: Reglas culturales y técnicas para mantener calidad
4. **MCP**: Integración con al menos 2 servicios externos
5. **Advanced Features**:
   - PWA con funcionalidad offline
   - AR interactivo con WebXR
   - Persistencia de datos compleja
   - Interfaz multiidioma

**Bonus Features para Maximizar Puntuación**:

- Compartir en redes sociales con hashtags del challenge
- Exportar memorias como PDF para imprimir
- Integración con calendario para fechas importantes
- Modo oscuro/claro automático según hora del día

## Deployment & DevOps

### Build Pipeline

```yaml
# GitHub Actions example
- Build: Vite production build
- Test: Run unit, integration, e2e tests
- Audit: Lighthouse, security scans
- Deploy: AWS S3 + CloudFront or Vercel
```

### Environment Configuration

```javascript
// Environment variables
VITE_APP_NAME = Mictla;
VITE_AR_ENABLED = true;
VITE_ANALYTICS_ID = xxx;
VITE_MCP_ENDPOINTS = xxx;
```

### Monitoring & Analytics

- **Error Tracking**: Sentry for production errors
- **Performance Monitoring**: Web Vitals, AR performance metrics
- **Usage Analytics**: Respectful, privacy-focused tracking
- **Cultural Impact**: Memorial creation rates, educational engagement

## Documentation Strategy

### Code Documentation

- **JSDoc Comments**: All public APIs documented
- **Component Documentation**: Props, usage examples
- **Architecture Decision Records**: Key technical decisions
- **Cultural Guidelines**: Sensitivity and accuracy standards

### User Documentation

- **Setup Guide**: Installation and first-time setup
- **User Manual**: Feature explanations, cultural context
- **Accessibility Guide**: How to use with assistive technologies
- **Privacy Policy**: Data handling, user rights
