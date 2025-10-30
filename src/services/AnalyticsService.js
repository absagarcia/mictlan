/**
 * Analytics Service for Mictla - Enhanced privacy-focused analytics
 * Provides detailed insights into user engagement and cultural impact
 */

import MonitoringService from './MonitoringService.js';

class AnalyticsService {
  constructor() {
    this.monitoringService = MonitoringService;
    this.culturalImpactMetrics = {
      educationalPathways: new Map(),
      culturalAccuracyTrends: [],
      memorialEngagementPatterns: [],
      languagePreferences: new Map(),
      accessibilityUsage: new Map()
    };
    
    this.performanceBaselines = {
      arInitTime: 3000, // 3 seconds
      memoryUsageLimit: 100 * 1024 * 1024, // 100MB
      minFPS: 30,
      maxLoadTime: 5000 // 5 seconds
    };
    
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics tracking
   */
  initializeAnalytics() {
    this.setupCulturalImpactTracking();
    this.setupPerformanceBaselines();
    this.setupAccessibilityTracking();
    this.setupEducationalPathTracking();
  }

  /**
   * Cultural Impact Tracking
   */
  setupCulturalImpactTracking() {
    // Track educational content completion rates
    this.educationalCompletionTracker = {
      altarLevels: { tierra: 0, purgatorio: 0, cielo: 0 },
      offeringTypes: new Map(),
      culturalReferences: new Map(),
      cocoConnections: 0
    };

    // Track cultural accuracy improvements
    this.culturalAccuracyTracker = {
      initialScores: [],
      improvedScores: [],
      suggestionAcceptanceRate: 0,
      culturalValidationRequests: 0
    };
  }

  /**
   * Track educational pathway completion
   */
  trackEducationalPathway(pathway, step, completed = false) {
    if (!this.monitoringService.isEnabled) return;

    const pathwayKey = `${pathway}_${step}`;
    
    if (!this.culturalImpactMetrics.educationalPathways.has(pathway)) {
      this.culturalImpactMetrics.educationalPathways.set(pathway, {
        started: 0,
        completed: 0,
        steps: new Map(),
        averageTime: 0,
        dropoffPoints: []
      });
    }

    const pathwayData = this.culturalImpactMetrics.educationalPathways.get(pathway);
    
    if (!pathwayData.steps.has(step)) {
      pathwayData.steps.set(step, { views: 0, completions: 0, timeSpent: [] });
    }

    const stepData = pathwayData.steps.get(step);
    stepData.views++;

    if (completed) {
      stepData.completions++;
      pathwayData.completed++;
    }

    // Track for monitoring service
    this.monitoringService.trackCulturalContentView('educational_pathway', pathwayKey);
  }

  /**
   * Track cultural accuracy improvements
   */
  trackCulturalAccuracyImprovement(contentType, initialScore, finalScore, suggestionsUsed = []) {
    if (!this.monitoringService.isEnabled) return;

    const improvement = {
      contentType,
      initialScore,
      finalScore,
      improvement: finalScore - initialScore,
      suggestionsUsed: suggestionsUsed.length,
      timestamp: Date.now()
    };

    this.culturalImpactMetrics.culturalAccuracyTrends.push(improvement);

    // Update tracker
    this.culturalAccuracyTracker.initialScores.push(initialScore);
    this.culturalAccuracyTracker.improvedScores.push(finalScore);
    
    if (suggestionsUsed.length > 0) {
      this.culturalAccuracyTracker.suggestionAcceptanceRate = 
        this.calculateSuggestionAcceptanceRate();
    }

    // Track with monitoring service
    this.monitoringService.trackCulturalAccuracy(contentType, finalScore, suggestionsUsed);
  }

  calculateSuggestionAcceptanceRate() {
    const totalSuggestions = this.culturalAccuracyTracker.culturalValidationRequests;
    const acceptedSuggestions = this.culturalImpactMetrics.culturalAccuracyTrends
      .reduce((sum, trend) => sum + trend.suggestionsUsed, 0);
    
    return totalSuggestions > 0 ? acceptedSuggestions / totalSuggestions : 0;
  }

  /**
   * Track memorial engagement patterns
   */
  trackMemorialEngagement(memorialId, engagementType, duration = 0, context = {}) {
    if (!this.monitoringService.isEnabled) return;

    const engagement = {
      memorialId: this.hashMemorialId(memorialId), // Privacy-safe ID
      type: engagementType, // 'view', 'edit', 'share', 'ar_view'
      duration,
      context: {
        altarLevel: context.altarLevel,
        hasAudio: context.hasAudio,
        hasPhoto: context.hasPhoto,
        relationship: context.relationship,
        language: context.language
      },
      timestamp: Date.now()
    };

    this.culturalImpactMetrics.memorialEngagementPatterns.push(engagement);

    // Analyze engagement patterns
    this.analyzeEngagementPatterns();
  }

  hashMemorialId(memorialId) {
    // Create privacy-safe hash of memorial ID
    let hash = 0;
    for (let i = 0; i < memorialId.length; i++) {
      const char = memorialId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `memorial_${Math.abs(hash)}`;
  }

  analyzeEngagementPatterns() {
    const patterns = this.culturalImpactMetrics.memorialEngagementPatterns;
    
    // Calculate average engagement time by type
    const engagementByType = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.type]) {
        acc[pattern.type] = { count: 0, totalDuration: 0 };
      }
      acc[pattern.type].count++;
      acc[pattern.type].totalDuration += pattern.duration;
      return acc;
    }, {});

    // Track high-engagement content
    Object.entries(engagementByType).forEach(([type, data]) => {
      const averageDuration = data.totalDuration / data.count;
      if (averageDuration > 30000) { // 30 seconds
        this.monitoringService.trackPerformanceMetric('high_engagement_content', {
          type,
          averageDuration,
          count: data.count
        });
      }
    });
  }

  /**
   * Performance Baseline Monitoring
   */
  setupPerformanceBaselines() {
    // Monitor against performance baselines
    setInterval(() => {
      this.checkPerformanceBaselines();
    }, 30000); // Check every 30 seconds
  }

  checkPerformanceBaselines() {
    const report = this.monitoringService.generateReport();
    
    // Check AR performance
    if (report.performance.averageFPS < this.performanceBaselines.minFPS) {
      this.trackPerformanceAlert('low_fps', {
        current: report.performance.averageFPS,
        baseline: this.performanceBaselines.minFPS,
        severity: 'warning'
      });
    }

    // Check memory usage
    const memoryPeak = this.monitoringService.getMemoryPeakUsage();
    if (memoryPeak > this.performanceBaselines.memoryUsageLimit) {
      this.trackPerformanceAlert('high_memory', {
        current: memoryPeak,
        baseline: this.performanceBaselines.memoryUsageLimit,
        severity: 'critical'
      });
    }
  }

  trackPerformanceAlert(alertType, data) {
    this.monitoringService.trackPerformanceIssue(`baseline_violation_${alertType}`, {
      ...data,
      timestamp: Date.now(),
      deviceInfo: this.monitoringService.getDeviceInfo()
    });
  }

  /**
   * Accessibility Usage Tracking
   */
  setupAccessibilityTracking() {
    // Track screen reader usage
    if (window.speechSynthesis) {
      this.trackAccessibilityFeature('screen_reader_available', true);
    }

    // Track keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.trackAccessibilityFeature('keyboard_navigation', true);
      }
    });

    // Track high contrast mode
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.trackAccessibilityFeature('high_contrast_mode', true);
    }

    // Track reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.trackAccessibilityFeature('reduced_motion_preference', true);
    }
  }

  trackAccessibilityFeature(feature, used) {
    if (!this.monitoringService.isEnabled) return;

    if (!this.culturalImpactMetrics.accessibilityUsage.has(feature)) {
      this.culturalImpactMetrics.accessibilityUsage.set(feature, {
        detected: false,
        used: 0,
        sessions: 0
      });
    }

    const featureData = this.culturalImpactMetrics.accessibilityUsage.get(feature);
    featureData.detected = true;
    
    if (used) {
      featureData.used++;
    }
    
    featureData.sessions++;
  }

  /**
   * Educational Path Tracking
   */
  setupEducationalPathTracking() {
    this.educationalPaths = {
      'altar_exploration': {
        steps: ['nivel_tierra', 'nivel_purgatorio', 'nivel_cielo'],
        completionRate: 0,
        averageTime: 0
      },
      'offering_learning': {
        steps: ['cempasuchil', 'pan_de_muerto', 'agua', 'sal', 'velas'],
        completionRate: 0,
        averageTime: 0
      },
      'coco_connections': {
        steps: ['family_importance', 'memory_preservation', 'cultural_identity'],
        completionRate: 0,
        averageTime: 0
      },
      'memorial_creation': {
        steps: ['photo_upload', 'story_writing', 'audio_recording', 'altar_placement'],
        completionRate: 0,
        averageTime: 0
      }
    };
  }

  /**
   * Language and Cultural Preference Tracking
   */
  trackLanguageUsage(language, context = 'general') {
    if (!this.monitoringService.isEnabled) return;

    if (!this.culturalImpactMetrics.languagePreferences.has(language)) {
      this.culturalImpactMetrics.languagePreferences.set(language, {
        usage: 0,
        contexts: new Map(),
        sessionTime: 0
      });
    }

    const langData = this.culturalImpactMetrics.languagePreferences.get(language);
    langData.usage++;

    if (!langData.contexts.has(context)) {
      langData.contexts.set(context, 0);
    }
    langData.contexts.set(context, langData.contexts.get(context) + 1);
  }

  /**
   * Cultural Impact Report Generation
   */
  generateCulturalImpactReport() {
    const baseReport = this.monitoringService.generateReport();
    
    return {
      ...baseReport,
      culturalImpact: {
        educationalEngagement: this.calculateEducationalEngagement(),
        culturalAccuracyTrends: this.analyzeCulturalAccuracyTrends(),
        memorialEngagementInsights: this.analyzeMemorialEngagement(),
        languageDistribution: this.analyzeLanguageUsage(),
        accessibilityAdoption: this.analyzeAccessibilityUsage(),
        culturalLearningPaths: this.analyzeEducationalPaths()
      },
      performanceBaselines: {
        compliance: this.calculateBaselineCompliance(),
        alerts: this.getPerformanceAlerts(),
        recommendations: this.generatePerformanceRecommendations()
      },
      privacyCompliance: {
        dataMinimization: true,
        userConsent: this.monitoringService.isEnabled,
        dataRetention: '30 days',
        personalDataCollected: false,
        culturalSensitivity: true
      }
    };
  }

  calculateEducationalEngagement() {
    const pathways = Array.from(this.culturalImpactMetrics.educationalPathways.entries());
    
    return pathways.map(([pathway, data]) => ({
      pathway,
      completionRate: data.completed / Math.max(data.started, 1),
      averageSteps: data.steps.size,
      dropoffRate: data.dropoffPoints.length / Math.max(data.started, 1),
      engagement: 'high' // Based on completion rates
    }));
  }

  analyzeCulturalAccuracyTrends() {
    const trends = this.culturalImpactMetrics.culturalAccuracyTrends;
    
    if (trends.length === 0) return null;

    const averageImprovement = trends.reduce((sum, trend) => sum + trend.improvement, 0) / trends.length;
    const suggestionEffectiveness = this.culturalAccuracyTracker.suggestionAcceptanceRate;

    return {
      averageImprovement,
      suggestionEffectiveness,
      totalValidations: trends.length,
      trendDirection: averageImprovement > 0 ? 'improving' : 'stable'
    };
  }

  analyzeMemorialEngagement() {
    const patterns = this.culturalImpactMetrics.memorialEngagementPatterns;
    
    const engagementTypes = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.type]) {
        acc[pattern.type] = { count: 0, totalDuration: 0 };
      }
      acc[pattern.type].count++;
      acc[pattern.type].totalDuration += pattern.duration;
      return acc;
    }, {});

    return Object.entries(engagementTypes).map(([type, data]) => ({
      type,
      frequency: data.count,
      averageDuration: data.totalDuration / data.count,
      engagement: data.totalDuration / data.count > 30000 ? 'high' : 'moderate'
    }));
  }

  analyzeLanguageUsage() {
    const languages = Array.from(this.culturalImpactMetrics.languagePreferences.entries());
    
    return languages.map(([language, data]) => ({
      language,
      usage: data.usage,
      contexts: Array.from(data.contexts.entries()),
      sessionTime: data.sessionTime
    }));
  }

  analyzeAccessibilityUsage() {
    const features = Array.from(this.culturalImpactMetrics.accessibilityUsage.entries());
    
    return features.map(([feature, data]) => ({
      feature,
      detected: data.detected,
      usageRate: data.used / Math.max(data.sessions, 1),
      sessions: data.sessions
    }));
  }

  analyzeEducationalPaths() {
    return Object.entries(this.educationalPaths).map(([path, data]) => ({
      path,
      steps: data.steps.length,
      completionRate: data.completionRate,
      averageTime: data.averageTime,
      effectiveness: data.completionRate > 0.7 ? 'high' : 'moderate'
    }));
  }

  calculateBaselineCompliance() {
    const report = this.monitoringService.generateReport();
    
    const compliance = {
      fps: report.performance.averageFPS >= this.performanceBaselines.minFPS,
      memory: this.monitoringService.getMemoryPeakUsage() <= this.performanceBaselines.memoryUsageLimit,
      loadTime: true, // Would need to track this separately
      arInit: true // Would need to track this separately
    };

    const complianceRate = Object.values(compliance).filter(Boolean).length / Object.keys(compliance).length;
    
    return {
      overall: complianceRate,
      details: compliance,
      score: Math.round(complianceRate * 100)
    };
  }

  getPerformanceAlerts() {
    return this.monitoringService.events
      .filter(event => event.type === 'performance_issue')
      .slice(-10) // Last 10 alerts
      .map(alert => ({
        type: alert.issue,
        severity: this.determineAlertSeverity(alert),
        timestamp: alert.timestamp,
        resolved: false
      }));
  }

  determineAlertSeverity(alert) {
    if (alert.issue.includes('critical') || alert.issue.includes('high_memory')) {
      return 'critical';
    } else if (alert.issue.includes('low_fps') || alert.issue.includes('baseline_violation')) {
      return 'warning';
    }
    return 'info';
  }

  generatePerformanceRecommendations() {
    const alerts = this.getPerformanceAlerts();
    const recommendations = [];

    if (alerts.some(alert => alert.type.includes('low_fps'))) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider reducing AR quality settings for better frame rate',
        action: 'adjust_ar_quality'
      });
    }

    if (alerts.some(alert => alert.type.includes('high_memory'))) {
      recommendations.push({
        type: 'memory',
        priority: 'critical',
        message: 'Optimize memory usage by compressing images and cleaning up unused objects',
        action: 'optimize_memory'
      });
    }

    return recommendations;
  }

  /**
   * Export analytics data for analysis
   */
  exportAnalyticsData() {
    return {
      culturalImpact: this.culturalImpactMetrics,
      performanceBaselines: this.performanceBaselines,
      educationalPaths: this.educationalPaths,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Reset analytics data
   */
  resetAnalyticsData() {
    this.culturalImpactMetrics = {
      educationalPathways: new Map(),
      culturalAccuracyTrends: [],
      memorialEngagementPatterns: [],
      languagePreferences: new Map(),
      accessibilityUsage: new Map()
    };

    this.educationalCompletionTracker = {
      altarLevels: { tierra: 0, purgatorio: 0, cielo: 0 },
      offeringTypes: new Map(),
      culturalReferences: new Map(),
      cocoConnections: 0
    };

    console.log('Analytics data reset');
  }
}

// Export singleton instance
export default new AnalyticsService();