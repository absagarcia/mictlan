---
inclusion: always
---

# Technical Standards for Mictla Application

## Overview

These technical standards ensure high-quality, accessible, and performant implementation of the Mictla Day of the Dead AR application. All code must meet these standards to maintain consistency, reliability, and user experience excellence.

## Code Quality Standards

### JavaScript/ES6+ Standards

**Code Style:**

- Use ES6+ modules and modern JavaScript features
- Implement consistent naming conventions (camelCase for variables/functions, PascalCase for classes)
- Use meaningful variable and function names that reflect their purpose
- Maintain consistent indentation (2 spaces)
- Include comprehensive JSDoc comments for all public APIs

**Example:**

```javascript
/**
 * Creates a new memorial entry with validation
 * @param {Object} memorialData - The memorial information
 * @param {string} memorialData.name - Name of the deceased
 * @param {string} memorialData.photo - Base64 encoded photo
 * @returns {Promise<Memorial>} The created memorial object
 */
async function createMemorial(memorialData) {
  // Implementation
}
```

**Error Handling:**

- Implement comprehensive try-catch blocks for async operations
- Provide meaningful error messages in both Spanish and English
- Use custom error classes for different error types
- Log errors appropriately without exposing sensitive information

**Performance:**

- Use async/await for asynchronous operations
- Implement proper cleanup for event listeners and timers
- Optimize loops and data processing operations
- Use lazy loading for non-critical components

### Component Architecture

**Modular Design:**

- Each component should have a single responsibility
- Use composition over inheritance
- Implement clear interfaces between components
- Maintain loose coupling between modules

**State Management:**

- Use reactive patterns for UI updates
- Implement proper state persistence to IndexedDB
- Handle state synchronization across components
- Provide rollback mechanisms for critical operations

**Example Component Structure:**

```javascript
class MemoryBookComponent {
  constructor(container, dependencies) {
    this.container = container;
    this.storageManager = dependencies.storageManager;
    this.validator = dependencies.validator;
    this.eventEmitter = dependencies.eventEmitter;
  }

  async initialize() {
    await this.loadMemories();
    this.setupEventListeners();
    this.render();
  }

  cleanup() {
    this.removeEventListeners();
    this.clearTimers();
  }
}
```

## Accessibility Standards (WCAG 2.1 AA)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Implement logical tab order throughout the application
- Provide visible focus indicators for all focusable elements
- Support standard keyboard shortcuts (Escape, Enter, Arrow keys)

### Screen Reader Support

- Use semantic HTML elements (nav, main, section, article)
- Implement proper ARIA labels and descriptions
- Provide alternative text for all images and visual content
- Use proper heading hierarchy (h1-h6)

**Example:**

```html
<button
  aria-label="Agregar nueva memoria familiar"
  aria-describedby="add-memory-help"
  class="add-memory-btn"
>
  <span aria-hidden="true">+</span>
  Agregar Memoria
</button>
<div id="add-memory-help" class="sr-only">
  Abre el formulario para crear una nueva entrada en el libro de memorias
</div>
```

### Visual Accessibility

- Maintain minimum 4.5:1 color contrast ratio for normal text
- Maintain minimum 3:1 color contrast ratio for large text
- Ensure color is not the only means of conveying information
- Support user preference for reduced motion

### Internationalization

- Support both Spanish and English languages
- Implement proper RTL support if needed in future
- Use appropriate date and number formatting for each locale
- Provide cultural context for UI elements

## Performance Standards

### Loading Performance

- Initial page load must be under 3 seconds on 3G networks
- Implement progressive loading for non-critical features
- Use code splitting for AR components and large dependencies
- Optimize images and 3D assets for web delivery

### Runtime Performance

- Maintain 60fps during AR interactions
- Keep memory usage under 100MB on mobile devices
- Implement efficient garbage collection for 3D objects
- Use requestAnimationFrame for smooth animations

### Storage Optimization

- Compress images before storing in IndexedDB
- Implement storage quota management
- Provide data export/import functionality
- Clean up unused data automatically

**Example Performance Monitoring:**

```javascript
class PerformanceMonitor {
  static measureARPerformance() {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        if (duration > 16.67) {
          // 60fps threshold
          console.warn(`AR frame took ${duration}ms`);
        }
      },
    };
  }
}
```

## AR/WebXR Standards

### Device Compatibility

- Implement progressive enhancement for AR features
- Provide 3D fallback for non-AR devices
- Test on minimum supported devices (iPhone 8, Android 8.0)
- Handle WebXR permission requests gracefully

### 3D Asset Optimization

- Use GLTF format for 3D models
- Keep individual model files under 500KB
- Implement LOD (Level of Detail) for complex models
- Use texture compression (ASTC, ETC2, S3TC)

### AR Performance

- Maintain stable tracking in various lighting conditions
- Implement occlusion handling for realistic placement
- Optimize rendering pipeline for mobile GPUs
- Provide quality settings for different device capabilities

**Example AR Initialization:**

```javascript
class ARManager {
  async initializeAR() {
    try {
      if (!navigator.xr) {
        throw new Error("WebXR not supported");
      }

      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        this.fallbackTo3D();
        return;
      }

      this.session = await navigator.xr.requestSession("immersive-ar");
      this.setupARSession();
    } catch (error) {
      console.warn("AR initialization failed:", error);
      this.fallbackTo3D();
    }
  }
}
```

## Security Standards

### Data Protection

- Sanitize all user inputs to prevent XSS attacks
- Validate file uploads (type, size, content)
- Implement Content Security Policy (CSP)
- Use HTTPS for all network communications

### Privacy Protection

- Store all personal data locally (no external servers)
- Implement secure data export/import
- Provide clear data deletion options
- Respect user privacy preferences

**Example Input Validation:**

```javascript
class ValidationService {
  static sanitizeMemorialText(text) {
    // Remove potentially harmful content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim()
      .substring(0, 1000); // Limit length
  }

  static validateImageFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato de imagen no válido");
    }

    if (file.size > maxSize) {
      throw new Error("La imagen es demasiado grande");
    }

    return true;
  }
}
```

## Testing Standards

### Unit Testing

- Maintain minimum 80% code coverage
- Test all public methods and critical paths
- Use meaningful test descriptions in Spanish and English
- Mock external dependencies appropriately

### Integration Testing

- Test component interactions and data flow
- Validate AR functionality on supported devices
- Test offline functionality and data persistence
- Verify accessibility features work correctly

### E2E Testing

- Test complete user journeys
- Validate cross-device synchronization
- Test error scenarios and recovery
- Verify cultural content accuracy

**Example Test Structure:**

```javascript
describe("MemoryBookComponent", () => {
  describe("createMemorial", () => {
    it("should create memorial with valid data", async () => {
      const memorialData = {
        name: "Abuela María",
        photo: "data:image/jpeg;base64,...",
        relationship: "abuela",
      };

      const memorial = await component.createMemorial(memorialData);

      expect(memorial.id).toBeDefined();
      expect(memorial.name).toBe("Abuela María");
    });

    it("should validate cultural appropriateness", async () => {
      const inappropriateData = {
        name: "Test",
        story: "This is just a joke",
      };

      await expect(component.createMemorial(inappropriateData)).rejects.toThrow(
        "Content not culturally appropriate"
      );
    });
  });
});
```

## Build and Deployment Standards

### Build Configuration

- Use Vite for fast development and optimized builds
- Implement code splitting for better performance
- Configure PWA settings for offline functionality
- Set up proper source maps for debugging

### Environment Configuration

- Use environment variables for configuration
- Implement different builds for development/production
- Configure HTTPS for WebXR development
- Set up proper error tracking

**Example Vite Configuration:**

```javascript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          "ar-components": ["./src/components/ar/"],
          "memory-components": ["./src/components/memory/"],
        },
      },
    },
  },
  server: {
    https: true, // Required for WebXR
    port: 3000,
  },
  pwa: {
    registerType: "autoUpdate",
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,gltf}"],
    },
  },
};
```

## Documentation Standards

### Code Documentation

- Use JSDoc for all public APIs
- Include usage examples in documentation
- Document cultural considerations for features
- Maintain up-to-date README files

### User Documentation

- Provide bilingual user guides
- Include accessibility instructions
- Document cultural context and significance
- Create troubleshooting guides

### API Documentation

- Document all service interfaces
- Include error codes and handling
- Provide integration examples
- Maintain version compatibility notes

## Monitoring and Analytics

### Performance Monitoring

- Track Core Web Vitals metrics
- Monitor AR performance and stability
- Track storage usage and optimization
- Monitor error rates and types

### Privacy-Focused Analytics

- Track feature usage without personal data
- Monitor cultural content engagement
- Measure accessibility feature usage
- Respect user privacy preferences

**Example Monitoring:**

```javascript
class AnalyticsService {
  static trackFeatureUsage(feature, context = {}) {
    // Only track non-personal usage data
    const event = {
      feature,
      timestamp: Date.now(),
      language: context.language || "unknown",
      deviceType: this.getDeviceType(),
      // Never include personal information
    };

    this.sendAnalytics(event);
  }

  static trackCulturalEngagement(contentType, duration) {
    // Track educational content effectiveness
    this.trackFeatureUsage("cultural_content_viewed", {
      contentType,
      engagementDuration: Math.round(duration / 1000),
    });
  }
}
```

## Compliance and Quality Gates

### Pre-commit Checks

- ESLint validation with cultural content rules
- Accessibility testing with axe-core
- Performance budget validation
- Cultural content validation

### Continuous Integration

- Automated testing on multiple devices
- Accessibility compliance verification
- Performance regression testing
- Cultural accuracy validation

### Release Criteria

- All tests passing with 80%+ coverage
- Accessibility compliance verified
- Performance benchmarks met
- Cultural review completed

---

_These technical standards ensure that Mictla delivers a high-quality, accessible, and culturally respectful experience while maintaining excellent performance and reliability._
