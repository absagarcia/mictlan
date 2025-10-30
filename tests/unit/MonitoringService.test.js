/**
 * Unit tests for MonitoringService
 * Tests error tracking, performance monitoring, and cultural metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MonitoringService from '../../src/services/MonitoringService.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
};
Object.defineProperty(window, 'performance', { value: performanceMock });

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'es-MX',
    platform: 'Test Platform',
    cookieEnabled: true,
    onLine: true,
    storage: {
      estimate: vi.fn(() => Promise.resolve({
        usage: 1024 * 1024 * 5, // 5MB
        quota: 1024 * 1024 * 100 // 100MB
      }))
    }
  }
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24
  }
});

describe('MonitoringService', () => {
  let monitoringService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create fresh instance for each test
    monitoringService = new (MonitoringService.constructor)();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(monitoringService.isEnabled).toBe(true);
      expect(monitoringService.sessionId).toMatch(/^session_/);
      expect(monitoringService.events).toEqual([]);
    });

    it('should respect privacy preferences', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        analyticsEnabled: false
      }));
      
      const service = new (MonitoringService.constructor)();
      expect(service.isEnabled).toBe(false);
    });
  });

  describe('Error Tracking', () => {
    it('should track JavaScript errors', () => {
      const errorData = {
        type: 'javascript_error',
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      };

      monitoringService.trackError(errorData);

      expect(monitoringService.performanceMetrics.errors).toHaveLength(1);
      expect(monitoringService.performanceMetrics.errors[0]).toMatchObject({
        type: 'javascript_error',
        message: 'Test error',
        sessionId: monitoringService.sessionId
      });
    });

    it('should store errors locally', () => {
      const errorData = {
        type: 'test_error',
        message: 'Test error message'
      };

      monitoringService.trackError(errorData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mictla_errors',
        expect.stringContaining('test_error')
      );
    });

    it('should not track errors when disabled', () => {
      monitoringService.isEnabled = false;
      
      monitoringService.trackError({
        type: 'test_error',
        message: 'Should not be tracked'
      });

      expect(monitoringService.performanceMetrics.errors).toHaveLength(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track AR frame performance', () => {
      const frameTime = 16.67; // 60 FPS
      
      monitoringService.trackARFrame(frameTime);

      expect(monitoringService.performanceMetrics.frameRates).toHaveLength(1);
      expect(monitoringService.performanceMetrics.frameRates[0].fps).toBeCloseTo(60, 1);
    });

    it('should detect low FPS performance', () => {
      // Simulate 61 frames at low FPS
      for (let i = 0; i < 61; i++) {
        monitoringService.trackARFrame(100); // 10 FPS
      }

      // Should have tracked a performance issue
      const performanceIssues = monitoringService.events.filter(
        event => event.type === 'performance_issue' && event.issue === 'low_ar_fps'
      );
      
      expect(performanceIssues.length).toBeGreaterThan(0);
    });

    it('should calculate average FPS correctly', () => {
      monitoringService.trackARFrame(16.67); // 60 FPS
      monitoringService.trackARFrame(33.33); // 30 FPS
      
      const avgFPS = monitoringService.calculateAverageFPS();
      expect(avgFPS).toBeCloseTo(45, 1);
    });

    it('should track performance metrics', () => {
      monitoringService.trackPerformanceMetric('test_metric', {
        value: 100,
        unit: 'ms'
      });

      const metricEvents = monitoringService.events.filter(
        event => event.type === 'performance_metric' && event.metric === 'test_metric'
      );
      
      expect(metricEvents).toHaveLength(1);
      expect(metricEvents[0].value).toBe(100);
    });
  });

  describe('Cultural Metrics', () => {
    it('should track cultural content views', () => {
      monitoringService.trackCulturalContentView('altar_level', 'nivel_tierra', 'es');

      expect(monitoringService.culturalMetrics.contentViewed).toHaveLength(1);
      expect(monitoringService.culturalMetrics.contentViewed[0]).toMatchObject({
        type: 'cultural_content_viewed',
        contentType: 'altar_level',
        contentId: 'nivel_tierra',
        language: 'es'
      });
    });

    it('should track educational engagement', () => {
      const contentId = 'test_content';
      
      monitoringService.startContentEngagement(contentId);
      
      // Simulate some time passing
      vi.advanceTimersByTime(5000);
      
      monitoringService.trackEducationalEngagement(contentId, 'complete');

      expect(monitoringService.culturalMetrics.educationalEngagement).toHaveLength(1);
      expect(monitoringService.culturalMetrics.educationalEngagement[0].contentId).toBe(contentId);
    });

    it('should track memorial creation', () => {
      const memorialData = {
        relationship: 'abuela',
        altarLevel: 3,
        photo: 'base64data',
        audioMessage: 'audio data',
        story: 'A beautiful story',
        offerings: ['cempasuchil', 'agua'],
        language: 'es'
      };

      monitoringService.trackMemorialCreation(memorialData);

      expect(monitoringService.culturalMetrics.memorialCreations).toBe(1);
      
      const memorialEvents = monitoringService.events.filter(
        event => event.type === 'memorial_created'
      );
      
      expect(memorialEvents).toHaveLength(1);
      expect(memorialEvents[0]).toMatchObject({
        relationship: 'abuela',
        altarLevel: 3,
        hasPhoto: true,
        hasAudio: true,
        hasStory: true,
        offeringsCount: 2,
        language: 'es'
      });
    });

    it('should track cultural accuracy scores', () => {
      monitoringService.trackCulturalAccuracy('offering_validation', 0.9, ['suggestion1']);

      expect(monitoringService.culturalMetrics.culturalAccuracyScores).toHaveLength(1);
      expect(monitoringService.culturalMetrics.culturalAccuracyScores[0]).toMatchObject({
        contentType: 'offering_validation',
        score: 0.9,
        suggestionsCount: 1
      });
    });

    it('should calculate average cultural accuracy', () => {
      monitoringService.trackCulturalAccuracy('test1', 0.8);
      monitoringService.trackCulturalAccuracy('test2', 0.9);
      monitoringService.trackCulturalAccuracy('test3', 0.7);

      const average = monitoringService.getAverageCulturalAccuracy();
      expect(average).toBeCloseTo(0.8, 1);
    });
  });

  describe('Privacy Controls', () => {
    it('should disable tracking when requested', () => {
      monitoringService.disableTracking();

      expect(monitoringService.isEnabled).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mictla_privacy_preferences',
        expect.stringContaining('analyticsEnabled":false')
      );
    });

    it('should enable tracking when requested', () => {
      monitoringService.isEnabled = false;
      monitoringService.enableTracking();

      expect(monitoringService.isEnabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mictla_privacy_preferences',
        expect.stringContaining('analyticsEnabled":true')
      );
    });

    it('should export user data', () => {
      monitoringService.trackError({ type: 'test', message: 'test' });
      monitoringService.trackCulturalContentView('test', 'test_id');

      const exportedData = monitoringService.exportUserData();

      expect(exportedData).toHaveProperty('sessionId');
      expect(exportedData).toHaveProperty('performanceMetrics');
      expect(exportedData).toHaveProperty('culturalMetrics');
      expect(exportedData).toHaveProperty('events');
      expect(exportedData.exportedAt).toBeDefined();
    });

    it('should delete user data', () => {
      // Add some data first
      monitoringService.trackError({ type: 'test', message: 'test' });
      monitoringService.trackCulturalContentView('test', 'test_id');

      monitoringService.deleteUserData();

      expect(monitoringService.events).toHaveLength(0);
      expect(monitoringService.performanceMetrics.errors).toHaveLength(0);
      expect(monitoringService.culturalMetrics.contentViewed).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mictla_errors');
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', () => {
      // Add some test data
      monitoringService.trackARFrame(16.67);
      monitoringService.trackError({ type: 'test', message: 'test' });
      monitoringService.trackCulturalContentView('altar_level', 'test');
      monitoringService.trackMemorialCreation({ relationship: 'padre', altarLevel: 2 });

      const report = monitoringService.generateReport();

      expect(report).toHaveProperty('session');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('cultural');
      expect(report).toHaveProperty('privacy');

      expect(report.session.id).toBe(monitoringService.sessionId);
      expect(report.performance.errorCount).toBe(1);
      expect(report.cultural.contentViewsCount).toBe(1);
      expect(report.cultural.memorialCreations).toBe(1);
      expect(report.privacy.personalDataCollected).toBe(false);
    });
  });

  describe('Device Information', () => {
    it('should collect device information', () => {
      const deviceInfo = monitoringService.getDeviceInfo();

      expect(deviceInfo).toHaveProperty('userAgent');
      expect(deviceInfo).toHaveProperty('language');
      expect(deviceInfo).toHaveProperty('platform');
      expect(deviceInfo).toHaveProperty('screenWidth');
      expect(deviceInfo).toHaveProperty('screenHeight');
      expect(deviceInfo.language).toBe('es-MX');
    });
  });
});