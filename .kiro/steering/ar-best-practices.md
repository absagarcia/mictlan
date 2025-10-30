---
inclusion: fileMatch
fileMatchPattern: "**/ar/**"
---

# AR Best Practices for Mictla - Mobile Optimization Guide

## Overview

This guide provides specific best practices for implementing AR features in the Mictla application, with focus on mobile optimization, performance, and user experience. These practices ensure smooth AR functionality across a wide range of devices while maintaining cultural authenticity.

## Mobile AR Optimization

### Device Capability Detection

**Progressive Enhancement Strategy:**

```javascript
class ARCapabilityDetector {
  static async detectCapabilities() {
    const capabilities = {
      webxr: false,
      webgl2: false,
      deviceMotion: false,
      camera: false,
      performance: "low",
    };

    // WebXR Support
    if (navigator.xr) {
      capabilities.webxr = await navigator.xr.isSessionSupported(
        "immersive-ar"
      );
    }

    // WebGL2 Support
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    capabilities.webgl2 = !!gl;

    // Device Motion
    capabilities.deviceMotion = "DeviceMotionEvent" in window;

    // Camera Access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      capabilities.camera = true;
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      capabilities.camera = false;
    }

    // Performance Estimation
    capabilities.performance = this.estimatePerformance();

    return capabilities;
  }

  static estimatePerformance() {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return "low";

    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);

    // Basic GPU performance estimation
    if (
      renderer.includes("Adreno 6") ||
      renderer.includes("Mali-G7") ||
      renderer.includes("Apple A1") ||
      renderer.includes("Apple M")
    ) {
      return "high";
    } else if (renderer.includes("Adreno 5") || renderer.includes("Mali-G5")) {
      return "medium";
    }

    return "low";
  }
}
```

### Performance Optimization Levels

**Quality Settings Based on Device:**

```javascript
class ARQualityManager {
  static getOptimalSettings(deviceCapabilities) {
    const settings = {
      renderScale: 1.0,
      shadowQuality: "high",
      textureQuality: "high",
      particleCount: 100,
      maxLights: 4,
      antialiasing: true,
    };

    switch (deviceCapabilities.performance) {
      case "low":
        settings.renderScale = 0.7;
        settings.shadowQuality = "off";
        settings.textureQuality = "low";
        settings.particleCount = 20;
        settings.maxLights = 1;
        settings.antialiasing = false;
        break;

      case "medium":
        settings.renderScale = 0.85;
        settings.shadowQuality = "medium";
        settings.textureQuality = "medium";
        settings.particleCount = 50;
        settings.maxLights = 2;
        settings.antialiasing = true;
        break;

      case "high":
        // Use default high-quality settings
        break;
    }

    return settings;
  }
}
```

## 3D Asset Optimization

### Model Optimization Guidelines

**GLTF Model Standards:**

- Maximum file size: 500KB per model
- Maximum vertices: 10,000 per model for mobile
- Use Draco compression for geometry
- Optimize texture resolution based on importance

**Texture Optimization:**

```javascript
class TextureOptimizer {
  static optimizeForDevice(textureUrl, deviceCapabilities) {
    const maxSize = this.getMaxTextureSize(deviceCapabilities);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate optimal size
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Use appropriate compression
        const quality = deviceCapabilities.performance === "high" ? 0.9 : 0.7;
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = textureUrl;
    });
  }

  static getMaxTextureSize(capabilities) {
    switch (capabilities.performance) {
      case "low":
        return 512;
      case "medium":
        return 1024;
      case "high":
        return 2048;
      default:
        return 512;
    }
  }
}
```

### Level of Detail (LOD) Implementation

**Dynamic LOD System:**

```javascript
class AltarLODManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.lodLevels = new Map();
  }

  addLODObject(name, highRes, mediumRes, lowRes) {
    this.lodLevels.set(name, {
      high: highRes,
      medium: mediumRes,
      low: lowRes,
      current: null,
    });
  }

  updateLOD() {
    this.lodLevels.forEach((lod, name) => {
      const distance = this.getDistanceToCamera(lod.high);
      let targetLOD;

      if (distance < 2) {
        targetLOD = lod.high;
      } else if (distance < 5) {
        targetLOD = lod.medium;
      } else {
        targetLOD = lod.low;
      }

      if (lod.current !== targetLOD) {
        if (lod.current) {
          this.scene.remove(lod.current);
        }
        this.scene.add(targetLOD);
        lod.current = targetLOD;
      }
    });
  }
}
```

## AR Tracking and Stability

### Robust Tracking Implementation

**Tracking Quality Management:**

```javascript
class ARTrackingManager {
  constructor(session, renderer) {
    this.session = session;
    this.renderer = renderer;
    this.trackingQuality = "unknown";
    this.lastGoodPose = null;
    this.trackingLostTime = 0;
  }

  updateTracking(frame, referenceSpace) {
    const pose = frame.getViewerPose(referenceSpace);

    if (pose) {
      this.trackingQuality = this.assessTrackingQuality(pose);
      this.lastGoodPose = pose;
      this.trackingLostTime = 0;

      // Update altar position with smoothing
      this.updateAltarPosition(pose);
    } else {
      this.trackingLostTime +=
        frame.session.renderState.baseLayer.framebufferWidth;
      this.handleTrackingLoss();
    }
  }

  assessTrackingQuality(pose) {
    // Analyze pose stability and confidence
    const transform = pose.transform;

    if (this.lastGoodPose) {
      const movement = this.calculateMovement(
        transform,
        this.lastGoodPose.transform
      );

      if (movement < 0.01) return "excellent";
      if (movement < 0.05) return "good";
      if (movement < 0.1) return "fair";
      return "poor";
    }

    return "good";
  }

  handleTrackingLoss() {
    if (this.trackingLostTime > 1000) {
      // 1 second
      // Show tracking guidance UI
      this.showTrackingGuidance();
    }
  }
}
```

### Environmental Adaptation

**Lighting and Surface Detection:**

```javascript
class EnvironmentAnalyzer {
  static analyzeLighting(frame) {
    const lightEstimate = frame.getLightEstimate();

    if (lightEstimate) {
      const intensity = lightEstimate.primaryLightIntensity;

      if (intensity < 0.3) {
        return { quality: "poor", recommendation: "Busca mejor iluminación" };
      } else if (intensity < 0.7) {
        return {
          quality: "fair",
          recommendation: "La iluminación es aceptable",
        };
      } else {
        return { quality: "good", recommendation: "Excelente iluminación" };
      }
    }

    return { quality: "unknown", recommendation: "Analizando entorno..." };
  }

  static detectSurfaces(frame, referenceSpace) {
    const surfaces = [];

    // Analyze hit test results for surface quality
    const hitTestResults = frame.getHitTestResults();

    hitTestResults.forEach((result) => {
      const pose = result.getPose(referenceSpace);
      if (pose) {
        surfaces.push({
          position: pose.transform.position,
          orientation: pose.transform.orientation,
          confidence: this.calculateSurfaceConfidence(result),
        });
      }
    });

    return surfaces;
  }
}
```

## User Experience Optimization

### Intuitive AR Interactions

**Gesture Recognition:**

```javascript
class ARGestureManager {
  constructor() {
    this.gestures = new Map();
    this.touchStartTime = 0;
    this.touchStartPosition = null;
  }

  registerGesture(name, pattern, callback) {
    this.gestures.set(name, { pattern, callback });
  }

  handleTouch(event, arCamera) {
    switch (event.type) {
      case "touchstart":
        this.touchStartTime = Date.now();
        this.touchStartPosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
        break;

      case "touchend":
        const duration = Date.now() - this.touchStartTime;
        const endPosition = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
        };

        this.recognizeGesture(
          this.touchStartPosition,
          endPosition,
          duration,
          arCamera
        );
        break;
    }
  }

  recognizeGesture(start, end, duration, camera) {
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    if (duration < 300 && distance < 20) {
      // Tap gesture - select altar element
      this.handleTap(end, camera);
    } else if (distance > 50) {
      // Swipe gesture - navigate altar levels
      this.handleSwipe(start, end);
    }
  }
}
```

### Accessibility in AR

**AR Accessibility Features:**

```javascript
class ARAcessibilityManager {
  constructor(scene, audioContext) {
    this.scene = scene;
    this.audioContext = audioContext;
    this.spatialAudio = new Map();
    this.voiceGuidance = true;
  }

  addSpatialAudio(objectName, audioBuffer, position) {
    const source = this.audioContext.createBufferSource();
    const panner = this.audioContext.createPanner();

    source.buffer = audioBuffer;
    panner.setPosition(position.x, position.y, position.z);
    panner.panningModel = "HRTF";

    source.connect(panner);
    panner.connect(this.audioContext.destination);

    this.spatialAudio.set(objectName, { source, panner });
  }

  announceARElement(elementName, culturalContext) {
    if (this.voiceGuidance) {
      const announcement = this.getAccessibleDescription(
        elementName,
        culturalContext
      );
      this.speak(announcement);
    }
  }

  getAccessibleDescription(elementName, context) {
    const descriptions = {
      cempasuchil:
        "Flores de cempasúchil, guían a las almas con su aroma y color naranja brillante",
      pan_de_muerto:
        "Pan de muerto tradicional, representa el ciclo de la vida",
      velas: "Velas encendidas, iluminan el camino de regreso a casa",
      agua: "Agua pura, calma la sed del viaje espiritual",
    };

    return descriptions[elementName] || `Elemento del altar: ${elementName}`;
  }

  speak(text) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-MX";
      speechSynthesis.speak(utterance);
    }
  }
}
```

## Performance Monitoring

### Real-time Performance Tracking

**AR Performance Metrics:**

```javascript
class ARPerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fpsHistory = [];
    this.memoryUsage = [];
  }

  startFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    const frameTime = performance.now() - this.frameStartTime;
    const fps = 1000 / frameTime;

    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Monitor memory usage
    if (performance.memory) {
      this.memoryUsage.push(performance.memory.usedJSHeapSize);
      if (this.memoryUsage.length > 60) {
        this.memoryUsage.shift();
      }
    }

    // Alert if performance drops
    const avgFPS =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (avgFPS < 20) {
      this.handleLowPerformance();
    }
  }

  handleLowPerformance() {
    // Automatically reduce quality
    console.warn("Low AR performance detected, reducing quality");

    // Reduce render scale
    this.renderer.setPixelRatio(
      Math.max(0.5, this.renderer.getPixelRatio() * 0.8)
    );

    // Disable expensive effects
    this.scene.traverse((object) => {
      if (object.material && object.material.map) {
        object.material.map.minFilter = THREE.LinearFilter;
      }
    });
  }
}
```

## Error Handling and Fallbacks

### Graceful Degradation

**AR Fallback Strategies:**

```javascript
class ARFallbackManager {
  static async initializeWithFallback(container) {
    try {
      // Try WebXR first
      const arManager = new ARManager(container);
      await arManager.initialize();
      return arManager;
    } catch (webxrError) {
      console.warn("WebXR failed, trying WebGL fallback:", webxrError);

      try {
        // Fallback to 3D without AR
        const threeDManager = new ThreeDManager(container);
        await threeDManager.initialize();
        return threeDManager;
      } catch (webglError) {
        console.warn("WebGL failed, using 2D fallback:", webglError);

        // Final fallback to 2D interface
        const twoDManager = new TwoDManager(container);
        await twoDManager.initialize();
        return twoDManager;
      }
    }
  }

  static handleARError(error, context) {
    const errorHandlers = {
      NotAllowedError: () => {
        this.showPermissionDialog();
      },
      NotSupportedError: () => {
        this.showUnsupportedDialog();
      },
      SecurityError: () => {
        this.showSecurityDialog();
      },
      default: () => {
        this.showGenericErrorDialog(error);
      },
    };

    const handler = errorHandlers[error.name] || errorHandlers.default;
    handler();
  }
}
```

## Cultural Integration in AR

### Respectful AR Presentation

**Cultural AR Guidelines:**

```javascript
class CulturalARPresentation {
  static setupTraditionalAltar(scene, memorials) {
    // Ensure proper altar level arrangement
    const levels = this.createAltarLevels();

    // Place memorials respectfully
    memorials.forEach((memorial) => {
      const level = this.determineAltarLevel(memorial);
      this.placeMemorialOnLevel(memorial, level, scene);
    });

    // Add traditional elements
    this.addTraditionalOfferings(scene);
    this.addCulturalAmbiance(scene);
  }

  static determineAltarLevel(memorial) {
    // Cultural logic for altar placement
    const relationship = memorial.relationship.toLowerCase();

    if (["abuelo", "abuela", "bisabuelo", "bisabuela"].includes(relationship)) {
      return 3; // Cielo - ancestors
    } else if (["padre", "madre", "tio", "tia"].includes(relationship)) {
      return 2; // Purgatorio - parents generation
    } else {
      return 1; // Tierra - contemporary generation
    }
  }

  static addCulturalAmbiance(scene) {
    // Subtle particle effects for marigold petals
    const petalGeometry = new THREE.PlaneGeometry(0.01, 0.01);
    const petalMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 20; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      petal.position.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 2
      );
      scene.add(petal);
    }
  }
}
```

## Testing AR Features

### AR-Specific Testing

**AR Testing Framework:**

```javascript
class ARTestFramework {
  static async testARCapabilities() {
    const results = {
      webxr: false,
      tracking: false,
      rendering: false,
      performance: false,
    };

    // Test WebXR support
    try {
      results.webxr = await navigator.xr.isSessionSupported("immersive-ar");
    } catch (e) {
      results.webxr = false;
    }

    // Test tracking stability
    if (results.webxr) {
      results.tracking = await this.testTracking();
    }

    // Test rendering performance
    results.rendering = await this.testRendering();

    // Test overall performance
    results.performance = await this.testPerformance();

    return results;
  }

  static async testTracking() {
    // Simulate tracking test
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.2); // 80% success rate
      }, 1000);
    });
  }

  static generateARTestReport(results) {
    return {
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo(),
      capabilities: results,
      recommendations: this.generateRecommendations(results),
    };
  }
}
```

---

_These AR best practices ensure that Mictla delivers an optimal augmented reality experience while respecting cultural traditions and maintaining excellent performance across diverse mobile devices._
