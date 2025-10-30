/**
 * Monitoring Service for Mictla - Privacy-focused analytics and error tracking
 * Tracks performance, errors, and cultural engagement without collecting personal data
 */

class MonitoringService {
  constructor() {
    this.isEnabled = true;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.performanceMetrics = {
      pageLoad: null,
      arInitialization: null,
      memoryUsage: [],
      frameRates: [],
      errors: []
    };
    this.culturalMetrics = {
      contentViewed: [],
      educationalEngagement: [],
      memorialCreations: 0,
      culturalAccuracyScores: []
    };
    
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring systems
   */
  initializeMonitoring() {
    this.setupErrorTracking();
    this.setupPerformanceMonitoring();
    this.setupCulturalMetrics();
    this.setupPrivacyControls();
  }

  /**
   * Generate anonymous session ID
   */
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Error Tracking System
   */
  setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });

    // WebXR specific errors
    this.setupWebXRErrorTracking();
  }

  setupWebXRErrorTracking() {
    // Monitor WebXR session errors
    document.addEventListener('webxr-session-error', (event) => {
      this.trackError({
        type: 'webxr_error',
        message: event.detail.message,
        errorCode: event.detail.code,
        deviceInfo: this.getDeviceInfo(),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Track application errors
   */
  trackError(errorData) {
    if (!this.isEnabled) return;

    const sanitizedError = {
      ...errorData,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.pathname, // No query params for privacy
      timestamp: Date.now()
    };

    this.performanceMetrics.errors.push(sanitizedError);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Mictla Error Tracked:', sanitizedError);
    }

    // Store locally for later analysis
    this.storeErrorLocally(sanitizedError);
  }

  /**
   * Performance Monitoring System
   */
  setupPerformanceMonitoring() {
    // Core Web Vitals
    this.measureCoreWebVitals();
    
    // AR Performance
    this.setupARPerformanceMonitoring();
    
    // Memory Usage
    this.monitorMemoryUsage();
    
    // Storage Usage
    this.monitorStorageUsage();
  }

  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.trackPerformanceMetric('lcp', {
        value: lastEntry.startTime,
        timestamp: Date.now()
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.trackPerformanceMetric('fid', {
          value: entry.processingStart - entry.startTime,
          timestamp: Date.now()
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.trackPerformanceMetric('cls', {
        value: clsValue,
        timestamp: Date.now()
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  setupARPerformanceMonitoring() {
    this.arPerformanceMonitor = {
      frameCount: 0,
      droppedFrames: 0,
      averageFPS: 0,
      lastFrameTime: 0
    };
  }

  /**
   * Track AR frame performance
   */
  trackARFrame(frameTime) {
    if (!this.isEnabled) return;

    const fps = 1000 / frameTime;
    this.performanceMetrics.frameRates.push({
      fps,
      timestamp: Date.now()
    });

    // Keep only last 60 frames
    if (this.performanceMetrics.frameRates.length > 60) {
      this.performanceMetrics.frameRates.shift();
    }

    // Track dropped frames (below 30 FPS)
    if (fps < 30) {
      this.arPerformanceMonitor.droppedFrames++;
    }

    this.arPerformanceMonitor.frameCount++;
    this.arPerformanceMonitor.averageFPS = this.calculateAverageFPS();

    // Alert if performance is consistently poor
    if (this.arPerformanceMonitor.averageFPS < 20 && this.arPerformanceMonitor.frameCount > 60) {
      this.trackPerformanceIssue('low_ar_fps', {
        averageFPS: this.arPerformanceMonitor.averageFPS,
        droppedFrames: this.arPerformanceMonitor.droppedFrames,
        deviceInfo: this.getDeviceInfo()
      });
    }
  }

  calculateAverageFPS() {
    if (this.performanceMetrics.frameRates.length === 0) return 0;
    
    const totalFPS = this.performanceMetrics.frameRates.reduce((sum, frame) => sum + frame.fps, 0);
    return totalFPS / this.performanceMetrics.frameRates.length;
  }

  monitorMemoryUsage() {
    if (!performance.memory) return;

    setInterval(() => {
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.performanceMetrics.memoryUsage.push(memoryInfo);

      // Keep only last 100 measurements
      if (this.performanceMetrics.memoryUsage.length > 100) {
        this.performanceMetrics.memoryUsage.shift();
      }

      // Alert if memory usage is high
      const usagePercent = memoryInfo.used / memoryInfo.limit;
      if (usagePercent > 0.8) {
        this.trackPerformanceIssue('high_memory_usage', {
          usagePercent,
          usedMB: Math.round(memoryInfo.used / 1024 / 1024),
          limitMB: Math.round(memoryInfo.limit / 1024 / 1024)
        });
      }
    }, 5000); // Check every 5 seconds
  }

  monitorStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) return;

    setInterval(async () => {
      try {
        const estimate = await navigator.storage.estimate();
        const usagePercent = estimate.usage / estimate.quota;

        this.trackPerformanceMetric('storage_usage', {
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercent,
          timestamp: Date.now()
        });

        // Alert if storage is getting full
        if (usagePercent > 0.8) {
          this.trackPerformanceIssue('high_storage_usage', {
            usagePercent,
            usageMB: Math.round(estimate.usage / 1024 / 1024),
            quotaMB: Math.round(estimate.quota / 1024 / 1024)
          });
        }
      } catch (error) {
        console.warn('Could not estimate storage usage:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cultural Impact Metrics
   */
  setupCulturalMetrics() {
    // Track educational content engagement
    this.culturalEngagementTracker = {
      contentSessions: new Map(),
      totalEngagementTime: 0,
      completedLearningPaths: 0
    };
  }

  /**
   * Track cultural content viewing
   */
  trackCulturalContentView(contentType, contentId, language = 'es') {
    if (!this.isEnabled) return;

    const event = {
      type: 'cultural_content_viewed',
      contentType, // 'altar_level', 'offering_info', 'coco_reference', etc.
      contentId,
      language,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.culturalMetrics.contentViewed.push(event);
    
    // Start engagement tracking
    this.startContentEngagement(contentId);
  }

  startContentEngagement(contentId) {
    this.culturalEngagementTracker.contentSessions.set(contentId, {
      startTime: Date.now(),
      interactions: 0
    });
  }

  /**
   * Track educational engagement duration
   */
  trackEducationalEngagement(contentId, interactionType = 'view') {
    if (!this.isEnabled) return;

    const session = this.culturalEngagementTracker.contentSessions.get(contentId);
    if (session) {
      session.interactions++;
      
      if (interactionType === 'complete') {
        const duration = Date.now() - session.startTime;
        
        this.culturalMetrics.educationalEngagement.push({
          contentId,
          duration,
          interactions: session.interactions,
          completedAt: Date.now(),
          sessionId: this.sessionId
        });

        this.culturalEngagementTracker.totalEngagementTime += duration;
        this.culturalEngagementTracker.contentSessions.delete(contentId);
      }
    }
  }

  /**
   * Track memorial creation with cultural context
   */
  trackMemorialCreation(memorialData) {
    if (!this.isEnabled) return;

    // Only track non-personal metadata
    const culturalMetadata = {
      type: 'memorial_created',
      relationship: memorialData.relationship, // 'abuelo', 'madre', etc.
      altarLevel: memorialData.altarLevel,
      hasPhoto: !!memorialData.photo,
      hasAudio: !!memorialData.audioMessage,
      hasStory: !!memorialData.story,
      offeringsCount: memorialData.offerings?.length || 0,
      language: memorialData.language || 'es',
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.culturalMetrics.memorialCreations++;
    this.events.push(culturalMetadata);
  }

  /**
   * Track cultural accuracy validation results
   */
  trackCulturalAccuracy(contentType, accuracyScore, suggestions = []) {
    if (!this.isEnabled) return;

    const accuracyData = {
      contentType,
      score: accuracyScore,
      suggestionsCount: suggestions.length,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.culturalMetrics.culturalAccuracyScores.push(accuracyData);
  }

  /**
   * Privacy Controls
   */
  setupPrivacyControls() {
    // Check user preferences for analytics
    const userPreferences = this.getUserPrivacyPreferences();
    this.isEnabled = userPreferences.analyticsEnabled !== false;

    // Provide opt-out mechanism
    window.mictlaAnalytics = {
      disable: () => this.disableTracking(),
      enable: () => this.enableTracking(),
      getStatus: () => this.isEnabled,
      exportData: () => this.exportUserData(),
      deleteData: () => this.deleteUserData()
    };
  }

  getUserPrivacyPreferences() {
    try {
      const prefs = localStorage.getItem('mictla_privacy_preferences');
      return prefs ? JSON.parse(prefs) : { analyticsEnabled: true };
    } catch (error) {
      return { analyticsEnabled: true };
    }
  }

  disableTracking() {
    this.isEnabled = false;
    localStorage.setItem('mictla_privacy_preferences', JSON.stringify({
      analyticsEnabled: false,
      disabledAt: Date.now()
    }));
    console.log('Mictla analytics disabled');
  }

  enableTracking() {
    this.isEnabled = true;
    localStorage.setItem('mictla_privacy_preferences', JSON.stringify({
      analyticsEnabled: true,
      enabledAt: Date.now()
    }));
    console.log('Mictla analytics enabled');
  }

  /**
   * Utility Methods
   */
  trackPerformanceMetric(metricName, data) {
    if (!this.isEnabled) return;

    this.events.push({
      type: 'performance_metric',
      metric: metricName,
      ...data,
      sessionId: this.sessionId
    });
  }

  trackPerformanceIssue(issueType, data) {
    if (!this.isEnabled) return;

    this.events.push({
      type: 'performance_issue',
      issue: issueType,
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    };
  }

  storeErrorLocally(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('mictla_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('mictla_errors', JSON.stringify(errors));
    } catch (error) {
      console.warn('Could not store error locally:', error);
    }
  }

  /**
   * Data Export and Management
   */
  exportUserData() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      performanceMetrics: this.performanceMetrics,
      culturalMetrics: this.culturalMetrics,
      events: this.events,
      exportedAt: new Date().toISOString()
    };
  }

  deleteUserData() {
    // Clear all stored analytics data
    localStorage.removeItem('mictla_errors');
    localStorage.removeItem('mictla_analytics_data');
    
    // Reset current session data
    this.events = [];
    this.performanceMetrics = {
      pageLoad: null,
      arInitialization: null,
      memoryUsage: [],
      frameRates: [],
      errors: []
    };
    this.culturalMetrics = {
      contentViewed: [],
      educationalEngagement: [],
      memorialCreations: 0,
      culturalAccuracyScores: []
    };
    
    console.log('Mictla user data deleted');
  }

  /**
   * Generate Analytics Report
   */
  generateReport() {
    const sessionDuration = Date.now() - this.startTime;
    
    return {
      session: {
        id: this.sessionId,
        duration: sessionDuration,
        startTime: new Date(this.startTime).toISOString()
      },
      performance: {
        averageFPS: this.calculateAverageFPS(),
        errorCount: this.performanceMetrics.errors.length,
        memoryPeakUsage: this.getMemoryPeakUsage(),
        coreWebVitals: this.getCoreWebVitalsReport()
      },
      cultural: {
        contentViewsCount: this.culturalMetrics.contentViewed.length,
        memorialCreations: this.culturalMetrics.memorialCreations,
        totalEngagementTime: this.culturalEngagementTracker.totalEngagementTime,
        averageCulturalAccuracy: this.getAverageCulturalAccuracy()
      },
      privacy: {
        trackingEnabled: this.isEnabled,
        dataRetentionDays: 30,
        personalDataCollected: false
      }
    };
  }

  getMemoryPeakUsage() {
    if (this.performanceMetrics.memoryUsage.length === 0) return null;
    
    return Math.max(...this.performanceMetrics.memoryUsage.map(m => m.used));
  }

  getCoreWebVitalsReport() {
    const vitals = {};
    
    this.events.forEach(event => {
      if (event.type === 'performance_metric') {
        vitals[event.metric] = event.value;
      }
    });
    
    return vitals;
  }

  getAverageCulturalAccuracy() {
    if (this.culturalMetrics.culturalAccuracyScores.length === 0) return null;
    
    const totalScore = this.culturalMetrics.culturalAccuracyScores.reduce(
      (sum, score) => sum + score.score, 0
    );
    
    return totalScore / this.culturalMetrics.culturalAccuracyScores.length;
  }

  /**
   * Periodic data persistence
   */
  startPeriodicPersistence() {
    setInterval(() => {
      this.persistAnalyticsData();
    }, 60000); // Save every minute
  }

  persistAnalyticsData() {
    if (!this.isEnabled) return;

    try {
      const data = {
        sessionId: this.sessionId,
        lastUpdate: Date.now(),
        events: this.events.slice(-100), // Keep last 100 events
        performanceMetrics: {
          ...this.performanceMetrics,
          frameRates: this.performanceMetrics.frameRates.slice(-60), // Last 60 frames
          memoryUsage: this.performanceMetrics.memoryUsage.slice(-20) // Last 20 measurements
        },
        culturalMetrics: this.culturalMetrics
      };

      localStorage.setItem('mictla_analytics_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Could not persist analytics data:', error);
    }
  }
}

// Export singleton instance
export default new MonitoringService();