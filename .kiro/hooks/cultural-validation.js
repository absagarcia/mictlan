/**
 * Cultural Validation Hook for Mictla
 * Validates content for cultural appropriateness and accuracy in real-time
 */

export default {
  name: 'cultural-validation',
  description: 'Validates content for cultural appropriateness and provides educational guidance',
  
  // Hook configuration
  config: {
    trigger: 'onContentChange',
    target: '.memory-form textarea, .offering-selector, .cultural-content',
    debounce: 1500, // Wait 1.5 seconds after user stops typing
    enabled: true,
    strictMode: false // Set to true for stricter validation
  },

  // Cultural validation rules and data
  culturalData: {
    // Traditional Day of the Dead offerings
    traditionalOfferings: [
      'cempasuchil', 'marigold', 'flor de muerto',
      'pan de muerto', 'bread of the dead',
      'agua', 'water', 'sal', 'salt',
      'velas', 'candles', 'veladoras',
      'copal', 'incense', 'incienso',
      'papel picado', 'perforated paper',
      'calaveras de azúcar', 'sugar skulls',
      'mole', 'tamales', 'atole', 'chocolate',
      'tequila', 'mezcal', 'pulque',
      'fotografías', 'photos', 'retratos'
    ],

    // Inappropriate terms or concepts
    inappropriateTerms: [
      'scary', 'frightening', 'spooky', 'creepy',
      'halloween', 'trick or treat', 'costume party',
      'zombie', 'ghost', 'haunted', 'evil',
      'joke', 'funny', 'silly', 'mockery',
      'fake', 'pretend', 'make-believe'
    ],

    // Respectful language patterns
    respectfulPhrases: [
      'recordar', 'honrar', 'celebrar la vida',
      'memoria', 'legado', 'tradición',
      'familia', 'ancestros', 'seres queridos',
      'ofrenda', 'altar', 'ritual sagrado',
      'conexión espiritual', 'amor eterno'
    ],

    // Altar level meanings
    altarLevels: {
      1: {
        name: 'Nivel Terrenal',
        meaning: 'Representa el mundo físico y los elementos de la tierra',
        appropriateOfferings: ['sal', 'agua', 'pan', 'frutas']
      },
      2: {
        name: 'Nivel Purgatorio', 
        meaning: 'Representa la transición entre mundos',
        appropriateOfferings: ['velas', 'incienso', 'flores']
      },
      3: {
        name: 'Nivel Celestial',
        meaning: 'Representa el mundo espiritual y divino',
        appropriateOfferings: ['fotografías', 'objetos personales', 'comida favorita']
      }
    },

    // Family relationship terms in Spanish
    familyRelationships: [
      'abuelo', 'abuela', 'bisabuelo', 'bisabuela',
      'padre', 'madre', 'papá', 'mamá',
      'hermano', 'hermana', 'tío', 'tía',
      'primo', 'prima', 'sobrino', 'sobrina',
      'esposo', 'esposa', 'hijo', 'hija',
      'nieto', 'nieta', 'compadre', 'comadre'
    ]
  },

  // Main validation execution
  async execute(context) {
    const { element, value, contentType } = context;
    
    try {
      // Determine validation type based on element
      const validationType = this.determineValidationType(element, contentType);
      
      // Perform validation
      const validationResult = await this.validateContent(value, validationType);
      
      // Show validation feedback
      this.showValidationFeedback(element, validationResult);
      
      // Log validation for monitoring
      this.logValidation(validationType, validationResult);
      
    } catch (error) {
      console.error('Cultural validation failed:', error);
      this.showValidationError(element, error);
    }
  },

  // Determine what type of validation to perform
  determineValidationType(element, contentType) {
    if (contentType) return contentType;
    
    // Determine from element classes or data attributes
    if (element.classList.contains('memorial-story')) return 'memorial_story';
    if (element.classList.contains('offering-description')) return 'offering_description';
    if (element.classList.contains('family-relationship')) return 'family_relationship';
    if (element.classList.contains('altar-content')) return 'altar_content';
    
    // Default to general content validation
    return 'general_content';
  },

  // Main content validation logic
  async validateContent(content, type) {
    const result = {
      isValid: true,
      score: 1.0,
      issues: [],
      suggestions: [],
      culturalContext: [],
      type: type
    };

    if (!content || content.trim().length === 0) {
      return result;
    }

    const contentLower = content.toLowerCase();

    // Check for inappropriate terms
    const inappropriateFound = this.culturalData.inappropriateTerms.filter(term => 
      contentLower.includes(term.toLowerCase())
    );

    if (inappropriateFound.length > 0) {
      result.isValid = false;
      result.score -= 0.5;
      result.issues.push({
        type: 'inappropriate_language',
        terms: inappropriateFound,
        message: 'El contenido contiene términos que no son apropiados para el contexto cultural del Día de Muertos'
      });
      result.suggestions.push('Considera usar un lenguaje más respetuoso que honre la tradición');
    }

    // Check for respectful language
    const respectfulFound = this.culturalData.respectfulPhrases.filter(phrase =>
      contentLower.includes(phrase.toLowerCase())
    );

    if (respectfulFound.length > 0) {
      result.score += 0.2;
      result.culturalContext.push({
        type: 'respectful_language',
        phrases: respectfulFound,
        message: 'El contenido usa lenguaje respetuoso apropiado para la tradición'
      });
    }

    // Type-specific validations
    switch (type) {
      case 'offering_description':
        await this.validateOfferings(content, result);
        break;
      case 'memorial_story':
        await this.validateMemorialStory(content, result);
        break;
      case 'family_relationship':
        await this.validateFamilyRelationship(content, result);
        break;
      case 'altar_content':
        await this.validateAltarContent(content, result);
        break;
    }

    // Normalize score
    result.score = Math.max(0, Math.min(1, result.score));
    
    // Determine overall validity
    result.isValid = result.score >= 0.6 && result.issues.length === 0;

    return result;
  },

  // Validate offering descriptions
  async validateOfferings(content, result) {
    const contentLower = content.toLowerCase();
    
    // Check for traditional offerings
    const traditionalFound = this.culturalData.traditionalOfferings.filter(offering =>
      contentLower.includes(offering.toLowerCase())
    );

    if (traditionalFound.length > 0) {
      result.score += 0.3;
      result.culturalContext.push({
        type: 'traditional_offerings',
        offerings: traditionalFound,
        message: 'Se mencionan ofrendas tradicionales del Día de Muertos'
      });
    } else {
      result.suggestions.push('Considera incluir ofrendas tradicionales como cempasúchil, pan de muerto, agua, sal, o velas');
    }

    // Check for non-traditional items that might be inappropriate
    const modernItems = ['pizza', 'hamburger', 'soda', 'candy', 'chips'];
    const modernFound = modernItems.filter(item => contentLower.includes(item));

    if (modernFound.length > 0) {
      result.issues.push({
        type: 'non_traditional_offerings',
        items: modernFound,
        message: 'Se mencionan elementos no tradicionales que podrían no ser apropiados'
      });
      result.suggestions.push('Las ofrendas tradicionales tienen significados espirituales específicos. Considera usar elementos tradicionales.');
    }
  },

  // Validate memorial stories
  async validateMemorialStory(content, result) {
    const contentLower = content.toLowerCase();

    // Check for family connection themes
    const familyThemes = ['familia', 'recuerdo', 'amor', 'memoria', 'legado', 'historia'];
    const familyFound = familyThemes.filter(theme => contentLower.includes(theme));

    if (familyFound.length > 0) {
      result.score += 0.2;
      result.culturalContext.push({
        type: 'family_themes',
        themes: familyFound,
        message: 'La historia incluye temas familiares importantes para la tradición'
      });
    }

    // Check story length and depth
    if (content.length < 50) {
      result.suggestions.push('Considera agregar más detalles sobre los recuerdos y la importancia de esta persona en tu familia');
    }

    // Check for Coco movie themes (positive)
    const cocoThemes = ['música', 'guitarra', 'canción', 'talento', 'pasión', 'sueños'];
    const cocoFound = cocoThemes.filter(theme => contentLower.includes(theme));

    if (cocoFound.length > 0) {
      result.culturalContext.push({
        type: 'coco_themes',
        themes: cocoFound,
        message: 'La historia conecta con temas de la película Coco sobre familia y memoria'
      });
    }
  },

  // Validate family relationships
  async validateFamilyRelationship(content, result) {
    const contentLower = content.toLowerCase();

    // Check for valid Spanish family terms
    const validRelationships = this.culturalData.familyRelationships.filter(rel =>
      contentLower.includes(rel.toLowerCase())
    );

    if (validRelationships.length > 0) {
      result.score += 0.3;
      result.culturalContext.push({
        type: 'valid_relationships',
        relationships: validRelationships,
        message: 'Se usan términos familiares apropiados en español'
      });
    } else {
      result.suggestions.push('Usa términos familiares en español como abuelo, abuela, padre, madre, etc.');
    }
  },

  // Validate altar content
  async validateAltarContent(content, result) {
    const contentLower = content.toLowerCase();

    // Check for altar level references
    Object.keys(this.culturalData.altarLevels).forEach(level => {
      const levelData = this.culturalData.altarLevels[level];
      if (contentLower.includes(levelData.name.toLowerCase())) {
        result.culturalContext.push({
          type: 'altar_level_reference',
          level: level,
          meaning: levelData.meaning,
          message: `Se hace referencia al ${levelData.name}: ${levelData.meaning}`
        });
      }
    });

    // Check for spiritual context
    const spiritualTerms = ['alma', 'espíritu', 'viaje', 'regreso', 'conexión', 'sagrado'];
    const spiritualFound = spiritualTerms.filter(term => contentLower.includes(term));

    if (spiritualFound.length > 0) {
      result.score += 0.2;
      result.culturalContext.push({
        type: 'spiritual_context',
        terms: spiritualFound,
        message: 'El contenido incluye contexto espiritual apropiado'
      });
    }
  },

  // Show validation feedback to user
  showValidationFeedback(element, result) {
    // Remove existing feedback
    this.removeExistingFeedback(element);

    // Create feedback container
    const feedback = document.createElement('div');
    feedback.className = 'cultural-validation-feedback';
    feedback.style.cssText = `
      margin-top: 8px;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.4;
    `;

    // Set feedback style based on validation result
    if (result.isValid) {
      feedback.style.backgroundColor = '#ecfdf5';
      feedback.style.borderLeft = '4px solid #10b981';
      feedback.style.color = '#065f46';
    } else {
      feedback.style.backgroundColor = '#fef2f2';
      feedback.style.borderLeft = '4px solid #ef4444';
      feedback.style.color = '#991b1b';
    }

    // Build feedback content
    let feedbackHTML = '';

    // Show validation score
    const scorePercentage = Math.round(result.score * 100);
    feedbackHTML += `<div style="font-weight: 600; margin-bottom: 8px;">
      Validación Cultural: ${scorePercentage}% ${result.isValid ? '✓' : '⚠'}
    </div>`;

    // Show issues
    if (result.issues.length > 0) {
      feedbackHTML += '<div style="margin-bottom: 8px;"><strong>Problemas encontrados:</strong></div>';
      result.issues.forEach(issue => {
        feedbackHTML += `<div style="margin-bottom: 4px;">• ${issue.message}</div>`;
      });
    }

    // Show suggestions
    if (result.suggestions.length > 0) {
      feedbackHTML += '<div style="margin-bottom: 8px;"><strong>Sugerencias:</strong></div>';
      result.suggestions.forEach(suggestion => {
        feedbackHTML += `<div style="margin-bottom: 4px;">• ${suggestion}</div>`;
      });
    }

    // Show cultural context (positive feedback)
    if (result.culturalContext.length > 0) {
      feedbackHTML += '<div style="margin-bottom: 8px;"><strong>Contexto Cultural:</strong></div>';
      result.culturalContext.forEach(context => {
        feedbackHTML += `<div style="margin-bottom: 4px;">• ${context.message}</div>`;
      });
    }

    feedback.innerHTML = feedbackHTML;

    // Insert feedback after the element
    element.parentNode.insertBefore(feedback, element.nextSibling);

    // Add educational resources link if there are issues
    if (!result.isValid) {
      this.addEducationalResources(feedback);
    }
  },

  // Remove existing validation feedback
  removeExistingFeedback(element) {
    const existingFeedback = element.parentNode.querySelector('.cultural-validation-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
  },

  // Add educational resources
  addEducationalResources(feedbackElement) {
    const resourcesDiv = document.createElement('div');
    resourcesDiv.style.cssText = `
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #d1d5db;
    `;
    
    resourcesDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">Recursos Educativos:</div>
      <div style="margin-bottom: 4px;">
        <a href="#/learn/altar-levels" style="color: #2563eb; text-decoration: underline;">
          Aprende sobre los niveles del altar
        </a>
      </div>
      <div style="margin-bottom: 4px;">
        <a href="#/learn/traditional-offerings" style="color: #2563eb; text-decoration: underline;">
          Ofrendas tradicionales y sus significados
        </a>
      </div>
      <div>
        <a href="#/learn/cultural-context" style="color: #2563eb; text-decoration: underline;">
          Contexto cultural del Día de Muertos
        </a>
      </div>
    `;

    feedbackElement.appendChild(resourcesDiv);
  },

  // Show validation error
  showValidationError(element, error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'cultural-validation-error';
    errorDiv.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 4px;
      color: #991b1b;
      font-size: 14px;
    `;
    errorDiv.textContent = 'Error en la validación cultural. Por favor, intenta de nuevo.';

    element.parentNode.insertBefore(errorDiv, element.nextSibling);

    // Remove error after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  },

  // Log validation for monitoring
  logValidation(type, result) {
    // Send to monitoring service if available
    if (window.MonitoringService) {
      window.MonitoringService.trackCulturalAccuracy(type, result.score, result.suggestions);
    }

    // Console log for development
    console.log('Cultural Validation:', {
      type,
      score: result.score,
      isValid: result.isValid,
      issuesCount: result.issues.length,
      suggestionsCount: result.suggestions.length
    });
  },

  // Initialize hook
  initialize() {
    let validationTimeout;

    // Set up debounced validation
    const debouncedValidation = (element, value, contentType) => {
      clearTimeout(validationTimeout);
      
      validationTimeout = setTimeout(() => {
        this.execute({ element, value, contentType });
      }, this.config.debounce);
    };

    // Attach event listeners
    document.addEventListener('input', (event) => {
      const element = event.target;
      
      if (element.matches(this.config.target)) {
        // Show immediate feedback that validation is pending
        this.showValidationPending(element);
        
        // Determine content type from data attribute or class
        const contentType = element.dataset.culturalType || 
                           element.className.split(' ').find(cls => cls.includes('cultural-'));
        
        debouncedValidation(element, element.value, contentType);
      }
    });

    // Also validate on blur for immediate feedback
    document.addEventListener('blur', (event) => {
      const element = event.target;
      
      if (element.matches(this.config.target) && element.value.trim()) {
        clearTimeout(validationTimeout);
        
        const contentType = element.dataset.culturalType || 
                           element.className.split(' ').find(cls => cls.includes('cultural-'));
        
        this.execute({ element, value: element.value, contentType });
      }
    }, true);

    console.log('Cultural validation hook initialized');
  },

  // Show validation pending indicator
  showValidationPending(element) {
    this.removeExistingFeedback(element);
    
    const pending = document.createElement('div');
    pending.className = 'cultural-validation-feedback';
    pending.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      color: #92400e;
      font-size: 14px;
    `;
    pending.innerHTML = '⏳ Validando contenido cultural...';

    element.parentNode.insertBefore(pending, element.nextSibling);
  }
};