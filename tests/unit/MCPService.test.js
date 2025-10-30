/**
 * Unit tests for MCPService
 * Tests MCP integrations for translation, image processing, and cultural validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MCPService from '../../src/services/MCPService.js';

// Mock canvas for image processing tests
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    canvas: { toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata') }
  })),
  width: 0,
  height: 0,
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata')
};

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.width = 800;
      this.height = 600;
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock document.createElement
global.document = {
  createElement: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  })
};

describe('MCPService', () => {
  let mcpService;

  beforeEach(async () => {
    // Reset the service for each test
    mcpService = MCPService;
    mcpService.isInitialized = false;
    
    // Mock the MCP server calls to return immediately
    vi.spyOn(mcpService, 'callMCPServer').mockImplementation(async (serverName, method, params) => {
      return mcpService.getMockResponse(serverName, method, params);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await mcpService.initialize();
      
      expect(result).toBe(true);
      expect(mcpService.isInitialized).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      vi.spyOn(mcpService, 'checkServerAvailability').mockRejectedValue(new Error('Server unavailable'));
      
      const result = await mcpService.initialize();
      
      expect(result).toBe(false);
      expect(mcpService.isInitialized).toBe(false);
    });
  });

  describe('Translation Services', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should translate text successfully', async () => {
      const result = await mcpService.translateText('Hola mundo', 'en', 'es');
      
      expect(result).toBe('Hola mundo'); // Mock returns original text
      expect(mcpService.callMCPServer).toHaveBeenCalledWith(
        'translation-mcp',
        'translateText',
        {
          text: 'Hola mundo',
          targetLanguage: 'en',
          sourceLanguage: 'es'
        }
      );
    });

    it('should detect language correctly', async () => {
      const result = await mcpService.detectLanguage('Hola mundo');
      
      expect(result).toBe('es');
      expect(mcpService.callMCPServer).toHaveBeenCalledWith(
        'translation-mcp',
        'detectLanguage',
        { text: 'Hola mundo' }
      );
    });

    it('should fallback when MCP is not available', async () => {
      mcpService.isInitialized = false;
      
      const result = await mcpService.translateText('Hello world', 'es');
      
      expect(result).toBe('Hello world'); // Fallback returns original
    });

    it('should use fallback language detection', async () => {
      mcpService.isInitialized = false;
      
      const spanishResult = await mcpService.detectLanguage('Hola que tal como estas');
      const englishResult = await mcpService.detectLanguage('Hello how are you');
      
      expect(spanishResult).toBe('es');
      expect(englishResult).toBe('en');
    });
  });

  describe('Image Processing Services', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should compress image successfully', async () => {
      const mockImageData = 'data:image/jpeg;base64,originaldata';
      
      const result = await mcpService.compressImage(mockImageData, 0.8, 1920, 1080);
      
      expect(result).toBe(mockImageData); // Mock returns original
      expect(mcpService.callMCPServer).toHaveBeenCalledWith(
        'image-processing-mcp',
        'compressImage',
        {
          imageData: mockImageData,
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1080
        }
      );
    });

    it('should generate thumbnail successfully', async () => {
      const mockImageData = 'data:image/jpeg;base64,originaldata';
      
      const result = await mcpService.generateThumbnail(mockImageData, 150, 150);
      
      expect(result).toBe(mockImageData); // Mock returns original
      expect(mcpService.callMCPServer).toHaveBeenCalledWith(
        'image-processing-mcp',
        'generateThumbnail',
        {
          imageData: mockImageData,
          width: 150,
          height: 150
        }
      );
    });

    it('should optimize for web successfully', async () => {
      const mockImageData = 'data:image/jpeg;base64,originaldata';
      
      const result = await mcpService.optimizeForWeb(mockImageData);
      
      expect(result).toHaveProperty('optimizedImage');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('size');
      expect(result.format).toBe('webp'); // Mock response
    });

    it('should fallback to canvas compression when MCP unavailable', async () => {
      mcpService.isInitialized = false;
      const mockImageData = 'data:image/jpeg;base64,originaldata';
      
      const result = await mcpService.compressImage(mockImageData, 0.8, 800, 600);
      
      // Should return a promise that resolves to compressed data
      expect(result).resolves.toBeDefined();
    });

    it('should fallback to canvas thumbnail generation', async () => {
      mcpService.isInitialized = false;
      const mockImageData = 'data:image/jpeg;base64,originaldata';
      
      const result = await mcpService.generateThumbnail(mockImageData, 150, 150);
      
      expect(result).resolves.toBeDefined();
    });
  });

  describe('Cultural Validation Services', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should validate tradition successfully', async () => {
      const content = 'Esta es una ofrenda tradicional de Día de Muertos';
      
      const result = await mcpService.validateTradition(content, 'dia_de_muertos');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('culturalAccuracy');
      expect(result.isValid).toBe(true);
      expect(result.culturalAccuracy).toBe('high');
    });

    it('should check cultural accuracy', async () => {
      const content = 'Información sobre altares de muertos';
      
      const result = await mcpService.checkCulturalAccuracy(content, 'educational');
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('recommendations');
      expect(result.score).toBe(0.9);
    });

    it('should validate offering types', async () => {
      const offerings = ['cempasuchil', 'pan de muerto', 'agua', 'sal'];
      
      const result = await mcpService.validateOfferingTypes(offerings);
      
      expect(result).toHaveProperty('validOfferings');
      expect(result).toHaveProperty('invalidOfferings');
      expect(result).toHaveProperty('suggestions');
      expect(result.validOfferings).toEqual(offerings);
    });

    it('should use fallback cultural validation', async () => {
      mcpService.isInitialized = false;
      
      const appropriateContent = 'Recordamos a nuestros seres queridos';
      const inappropriateContent = 'This is just a silly joke';
      
      const appropriateResult = await mcpService.validateTradition(appropriateContent);
      const inappropriateResult = await mcpService.validateTradition(inappropriateContent);
      
      expect(appropriateResult.isValid).toBe(true);
      expect(inappropriateResult.isValid).toBe(false);
    });

    it('should validate traditional offerings in fallback mode', async () => {
      mcpService.isInitialized = false;
      
      const traditionalOfferings = ['cempasuchil', 'pan de muerto', 'agua'];
      const nonTraditionalOfferings = ['pizza', 'hamburger', 'soda'];
      
      const traditionalResult = await mcpService.validateOfferingTypes(traditionalOfferings);
      const nonTraditionalResult = await mcpService.validateOfferingTypes(nonTraditionalOfferings);
      
      expect(traditionalResult.validOfferings.length).toBeGreaterThan(0);
      expect(nonTraditionalResult.invalidOfferings.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle MCP server errors gracefully', async () => {
      vi.spyOn(mcpService, 'callMCPServer').mockRejectedValue(new Error('Server error'));
      
      const result = await mcpService.translateText('test text');
      
      // Should fallback to original text
      expect(result).toBe('test text');
    });

    it('should handle image processing errors', async () => {
      vi.spyOn(mcpService, 'callMCPServer').mockRejectedValue(new Error('Processing error'));
      
      const mockImageData = 'data:image/jpeg;base64,test';
      const result = await mcpService.compressImage(mockImageData);
      
      // Should fallback to canvas compression
      expect(result).resolves.toBeDefined();
    });

    it('should handle cultural validation errors', async () => {
      vi.spyOn(mcpService, 'callMCPServer').mockRejectedValue(new Error('Validation error'));
      
      const result = await mcpService.validateTradition('test content');
      
      // Should use fallback validation
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('suggestions');
    });
  });

  describe('Mock Response Generation', () => {
    it('should generate appropriate mock responses', () => {
      const translationResponse = mcpService.getMockResponse('translation-mcp', 'translateText', {
        text: 'test'
      });
      
      expect(translationResponse).toHaveProperty('translatedText');
      
      const imageResponse = mcpService.getMockResponse('image-processing-mcp', 'compressImage', {
        imageData: 'test'
      });
      
      expect(imageResponse).toHaveProperty('compressedImage');
      
      const culturalResponse = mcpService.getMockResponse('cultural-validation-mcp', 'validateTradition', {
        content: 'test'
      });
      
      expect(culturalResponse).toHaveProperty('isValid');
    });

    it('should return empty object for unknown server/method', () => {
      const response = mcpService.getMockResponse('unknown-server', 'unknownMethod', {});
      
      expect(response).toEqual({});
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      await mcpService.initialize();
    });

    it('should handle complete memorial processing workflow', async () => {
      const memorialText = 'Mi querida abuela María';
      const memorialImage = 'data:image/jpeg;base64,imagedata';
      
      // Translate text
      const translatedText = await mcpService.translateText(memorialText, 'en');
      
      // Process image
      const compressedImage = await mcpService.compressImage(memorialImage);
      const thumbnail = await mcpService.generateThumbnail(memorialImage);
      
      // Validate cultural content
      const validation = await mcpService.validateTradition(memorialText);
      
      expect(translatedText).toBeDefined();
      expect(compressedImage).toBeDefined();
      expect(thumbnail).toBeDefined();
      expect(validation.isValid).toBe(true);
    });

    it('should handle offering validation workflow', async () => {
      const offerings = ['cempasuchil', 'pan de muerto', 'coca cola'];
      
      const validation = await mcpService.validateOfferingTypes(offerings);
      const culturalCheck = await mcpService.checkCulturalAccuracy(
        'Colocamos coca cola en el altar',
        'offering'
      );
      
      expect(validation).toHaveProperty('validOfferings');
      expect(validation).toHaveProperty('invalidOfferings');
      expect(culturalCheck).toHaveProperty('score');
    });
  });
});