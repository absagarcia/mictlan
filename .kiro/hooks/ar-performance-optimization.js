/**
 * AR Performance Optimization Hook for Mictla
 * Automatically optimizes AR performance based on device capabilities and runtime metrics
 */

export default {
  name: 'ar-performance-optimization',
  description: 'Automatically optimizes AR performance based on device capabilities and runtime metrics',
  
  // Hook configuration
  config: {
    trigger: 'onARFrameRender',
    enabled: true,
    monitoringInterval: 1000, // Check performance every second
    adaptationThreshold: {
      lowFPS: 20,
      criticalFPS: 15,
      highMemory: 0.8, // 80% of available memory
      criticalMemory: 0.9 // 90% of available memory
    }
  },

  // Performance state
  performanceState: {
    currentQuality: 'high',
    frameCount: 0,
    droppedFrames: 0,
    averageFPS: 60,
    memoryUsage: 0,
    lastOptimization: 0,
    adaptationHistory: []
  },

  // Quality presets
  qualityPresets: {
    high: {
      renderScale: 1.0,
      shadowQuality: 'high',
      textureQuality: 'high',
      particleCount: 100,
      maxLights: 4,
      antialiasing: true,
      lodDistance: {
        high: 2,
        medium: 5,
        low: 10
      }
    },
    medium: {
      renderScale: 0.85,
      shadowQuality: 'medium',
      textureQuality: 'medium',
      particleCount: 50,
      maxLights: 2,
      antialiasing: true,
      lodDistance: {
        high: 1.5,
        medium: 3,
        low: 8
      }
    },
    low: {
      renderScale: 0.7,
      shadowQuality: 'low',
      textureQuality: 'low',
      particleCount: 20,
      maxLights: 1,
      antialiasing: false,
      lodDistance: {
        high: 1,
        medium: 2,
        low: 5
      }
    },
    minimal: {
      renderScale: 0.5,
      shadowQuality: 'off',
      textureQuality: 'low',
      particleCount: 5,
      maxLights: 1,
      antialiasing: false,
      lodDistance: {
        high: 0.5,
        medium: 1,
        low: 3
      }
    }
  },

  // Main execution function
  async execute(context) {
    const { frameTime, renderer, scene, camera } = context;
    
    try {
      // Update performance metrics
      this.updatePerformanceMetrics(frameTime);
      
      // Check if optimization is needed
      const optimizationNeeded = this.assessOptimizationNeed();
      
      if (optimizationNeeded) {
        await this.optimizePerformance(renderer, scene, camera);
      }
      
      // Log performance data
      this.logPerformanceData();
      
    } catch (error) {
      console.error('AR performance optimization failed:', error);
    }
  },

  // Update performance metrics
  updatePerformanceMetrics(frameTime) {
    const fps = 1000 / frameTime;
    
    this.performanceState.frameCount++;
    
    // Track dropped frames
    if (fps < this.config.adaptationThreshold.lowFPS) {
      this.performanceState.droppedFrames++;
    }
    
    // Calculate rolling average FPS (last 60 frames)
    if (!this.fpsHistory) this.fpsHistory = [];
    this.fpsHistory.push(fps);
    
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    
    this.performanceState.averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    
    // Update memory usage if available
    if (performance.memory) {
      this.performanceState.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
  },

  // Assess if optimization is needed
  assessOptimizationNeed() {
    const { averageFPS, memoryUsage, lastOptimization } = this.performanceState;
    const { lowFPS, criticalFPS, highMemory, criticalMemory } = this.config.adaptationThreshold;
    
    // Don't optimize too frequently
    if (Date.now() - lastOptimization < 5000) return false;
    
    // Critical performance issues
    if (averageFPS < criticalFPS || memoryUsage > criticalMemory) {
      return { level: 'critical', reason: 'critical_performance' };
    }
    
    // Performance degradation
    if (averageFPS < lowFPS || memoryUsage > highMemory) {
      return { level: 'moderate', reason: 'performance_degradation' };
    }
    
    // Check for sustained poor performance
    const recentDroppedFrames = this.performanceState.droppedFrames;
    const totalFrames = this.performanceState.frameCount;
    
    if (totalFrames > 60 && (recentDroppedFrames / totalFrames) > 0.3) {
      return { level: 'moderate', reason: 'sustained_drops' };
    }
    
    return false;
  },

  // Optimize performance based on current state
  async optimizePerformance(renderer, scene, camera) {
    const optimizationNeed = this.assessOptimizationNeed();
    if (!optimizationNeed) return;
    
    const currentQuality = this.performanceState.currentQuality;
    let targetQuality = currentQuality;
    
    // Determine target quality level
    if (optimizationNeed.level === 'critical') {
      targetQuality = this.getNextLowerQuality(currentQuality, 2);
    } else if (optimizationNeed.level === 'moderate') {
      targetQuality = this.getNextLowerQuality(currentQuality, 1);
    }
    
    if (targetQuality !== currentQuality) {
      await this.applyQualitySettings(targetQuality, renderer, scene, camera);
      
      // Record optimization
      this.performanceState.adaptationHistory.push({
        timestamp: Date.now(),
        from: currentQuality,
        to: targetQuality,
        reason: optimizationNeed.reason,
        fps: this.performanceState.averageFPS,
        memory: this.performanceState.memoryUsage
      });
      
      this.performanceState.currentQuality = targetQuality;
      this.performanceState.lastOptimization = Date.now();
      
      // Notify user of optimization
      this.notifyOptimization(currentQuality, targetQuality, optimizationNeed.reason);
    }
  },

  // Get next lower quality level
  getNextLowerQuality(current, steps = 1) {
    const qualities = ['high', 'medium', 'low', 'minimal'];
    const currentIndex = qualities.indexOf(current);
    const targetIndex = Math.min(qualities.length - 1, currentIndex + steps);
    return qualities[targetIndex];
  },

  // Apply quality settings to AR scene
  async applyQualitySettings(quality, renderer, scene, camera) {
    const settings = this.qualityPresets[quality];
    
    try {
      // Update renderer settings
      if (renderer) {
        renderer.setPixelRatio(window.devicePixelRatio * settings.renderScale);
        renderer.shadowMap.enabled = settings.shadowQuality !== 'off';
        
        if (settings.shadowQuality === 'high') {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else if (settings.shadowQuality === 'medium') {
          renderer.shadowMap.type = THREE.PCFShadowMap;
        } else {
          renderer.shadowMap.type = THREE.BasicShadowMap;
        }
      }
      
      // Update scene objects
      if (scene) {
        await this.updateSceneQuality(scene, settings);
      }
      
      // Update camera settings
      if (camera) {
        this.updateCameraSettings(camera, settings);
      }
      
      console.log(`AR quality optimized to: ${quality}`);
      
    } catch (error) {
      console.error('Failed to apply quality settings:', error);
    }
  },

  // Update scene quality settings
  async updateSceneQuality(scene, settings) {
    scene.traverse((object) => {
      // Update materials
      if (object.material) {
        this.updateMaterialQuality(object.material, settings);
      }
      
      // Update LOD objects
      if (object.isLOD) {
        this.updateLODSettings(object, settings);
      }
      
      // Update particle systems
      if (object.userData && object.userData.isParticleSystem) {
        this.updateParticleSystem(object, settings);
      }
      
      // Update lights
      if (object.isLight) {
        this.updateLightSettings(object, settings);
      }
    });
  },

  // Update material quality
  updateMaterialQuality(material, settings) {
    if (Array.isArray(material)) {
      material.forEach(mat => this.updateMaterialQuality(mat, settings));
      return;
    }
    
    // Update texture filtering
    if (material.map) {
      if (settings.textureQuality === 'low') {
        material.map.minFilter = THREE.LinearFilter;
        material.map.magFilter = THREE.LinearFilter;
      } else {
        material.map.minFilter = THREE.LinearMipmapLinearFilter;
        material.map.magFilter = THREE.LinearFilter;
      }
    }
    
    // Update material precision
    if (settings.textureQuality === 'low') {
      material.precision = 'lowp';
    } else if (settings.textureQuality === 'medium') {
      material.precision = 'mediump';
    } else {
      material.precision = 'highp';
    }
    
    material.needsUpdate = true;
  },

  // Update LOD settings
  updateLODSettings(lodObject, settings) {
    const distances = settings.lodDistance;
    
    if (lodObject.levels && lodObject.levels.length >= 3) {
      lodObject.levels[0].distance = distances.high;
      lodObject.levels[1].distance = distances.medium;
      lodObject.levels[2].distance = distances.low;
    }
  },

  // Update particle systems
  updateParticleSystem(particleObject, settings) {
    if (particleObject.userData.particleCount) {
      const targetCount = Math.min(
        particleObject.userData.originalCount || settings.particleCount,
        settings.particleCount
      );
      
      // Update particle count (implementation depends on particle system)
      if (particleObject.geometry && particleObject.geometry.attributes.position) {
        const positions = particleObject.geometry.attributes.position;
        positions.count = targetCount;
        positions.needsUpdate = true;
      }
    }
  },

  // Update light settings
  updateLightSettings(light, settings) {
    // Disable excess lights
    const lightIndex = this.getLightIndex(light);
    
    if (lightIndex >= settings.maxLights) {
      light.visible = false;
    } else {
      light.visible = true;
      
      // Reduce shadow quality for performance
      if (light.castShadow) {
        if (settings.shadowQuality === 'high') {
          light.shadow.mapSize.setScalar(2048);
        } else if (settings.shadowQuality === 'medium') {
          light.shadow.mapSize.setScalar(1024);
        } else if (settings.shadowQuality === 'low') {
          light.shadow.mapSize.setScalar(512);
        } else {
          light.castShadow = false;
        }
      }
    }
  },

  // Get light index in scene
  getLightIndex(targetLight) {
    let index = 0;
    targetLight.parent.traverse((object) => {
      if (object.isLight && object !== targetLight) {
        index++;
      } else if (object === targetLight) {
        return index;
      }
    });
    return index;
  },

  // Update camera settings
  updateCameraSettings(camera, settings) {
    // Adjust camera near/far planes for performance
    if (settings.renderScale < 0.8) {
      camera.near = Math.max(0.1, camera.near * 1.2);
      camera.far = Math.min(1000, camera.far * 0.8);
      camera.updateProjectionMatrix();
    }
  },

  // Notify user of optimization
  notifyOptimization(fromQuality, toQuality, reason) {
    const messages = {
      critical_performance: 'Rendimiento crítico detectado. Reduciendo calidad gráfica.',
      performance_degradation: 'Optimizando calidad para mejorar rendimiento.',
      sustained_drops: 'Ajustando configuración para estabilizar framerate.'
    };
    
    const message = messages[reason] || 'Optimizando rendimiento AR.';
    
    this.showOptimizationNotification(message, fromQuality, toQuality);
  },

  // Show optimization notification
  showOptimizationNotification(message, fromQuality, toQuality) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'ar-optimization-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>⚡</span>
        <div>
          <div style="font-weight: 600;">${message}</div>
          <div style="font-size: 12px; opacity: 0.8;">
            Calidad: ${fromQuality} → ${toQuality}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  // Log performance data
  logPerformanceData() {
    // Send to monitoring service if available
    if (window.MonitoringService) {
      window.MonitoringService.trackARFrame(1000 / this.performanceState.averageFPS);
    }
    
    // Periodic detailed logging
    if (this.performanceState.frameCount % 300 === 0) { // Every 5 seconds at 60fps
      console.log('AR Performance Status:', {
        quality: this.performanceState.currentQuality,
        averageFPS: Math.round(this.performanceState.averageFPS),
        droppedFrames: this.performanceState.droppedFrames,
        memoryUsage: Math.round(this.performanceState.memoryUsage * 100) + '%',
        adaptations: this.performanceState.adaptationHistory.length
      });
    }
  },

  // Initialize performance monitoring
  initialize() {
    console.log('AR Performance Optimization hook initialized');
    
    // Start performance monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.checkForPerformanceRecovery();
    }, this.config.monitoringInterval);
    
    // Listen for AR session events
    document.addEventListener('ar-session-start', () => {
      this.resetPerformanceState();
    });
    
    document.addEventListener('ar-session-end', () => {
      this.cleanup();
    });
    
    // Listen for device orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 500);
    });
  },

  // Check if performance has recovered and quality can be increased
  checkForPerformanceRecovery() {
    const { averageFPS, currentQuality, lastOptimization } = this.performanceState;
    
    // Only check for recovery if we're not at highest quality
    if (currentQuality === 'high') return;
    
    // Wait at least 10 seconds since last optimization
    if (Date.now() - lastOptimization < 10000) return;
    
    // Check if performance is stable and good
    if (averageFPS > 45 && this.fpsHistory && this.fpsHistory.length >= 60) {
      const stableFPS = this.fpsHistory.every(fps => fps > 35);
      
      if (stableFPS) {
        const betterQuality = this.getNextHigherQuality(currentQuality);
        if (betterQuality !== currentQuality) {
          console.log(`Performance recovered, upgrading to ${betterQuality}`);
          // Note: Would need renderer, scene, camera references for full implementation
          this.performanceState.currentQuality = betterQuality;
          this.performanceState.lastOptimization = Date.now();
        }
      }
    }
  },

  // Get next higher quality level
  getNextHigherQuality(current) {
    const qualities = ['minimal', 'low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(current);
    const targetIndex = Math.max(0, currentIndex - 1);
    return qualities[targetIndex];
  },

  // Handle device orientation changes
  handleOrientationChange() {
    // Reset some performance metrics as orientation change can affect performance
    this.fpsHistory = [];
    this.performanceState.droppedFrames = 0;
    this.performanceState.frameCount = 0;
    
    console.log('Device orientation changed, resetting performance metrics');
  },

  // Reset performance state
  resetPerformanceState() {
    this.performanceState = {
      currentQuality: 'high',
      frameCount: 0,
      droppedFrames: 0,
      averageFPS: 60,
      memoryUsage: 0,
      lastOptimization: 0,
      adaptationHistory: []
    };
    
    this.fpsHistory = [];
    
    console.log('AR performance state reset');
  },

  // Cleanup resources
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('AR performance optimization cleanup completed');
  },

  // Get performance report
  getPerformanceReport() {
    return {
      currentQuality: this.performanceState.currentQuality,
      averageFPS: Math.round(this.performanceState.averageFPS),
      totalFrames: this.performanceState.frameCount,
      droppedFrames: this.performanceState.droppedFrames,
      memoryUsage: Math.round(this.performanceState.memoryUsage * 100),
      adaptationCount: this.performanceState.adaptationHistory.length,
      adaptationHistory: this.performanceState.adaptationHistory.slice(-5) // Last 5 adaptations
    };
  }
};