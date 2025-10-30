/**
 * Auto-save Hook for Mictla Memorial Editing
 * Automatically saves memorial entries as users type to prevent data loss
 */

export default {
  name: 'auto-save-memories',
  description: 'Automatically saves memorial entries while editing to prevent data loss',
  
  // Hook configuration
  config: {
    trigger: 'onTextChange',
    target: '.memory-form input, .memory-form textarea',
    debounce: 2000, // Wait 2 seconds after user stops typing
    enabled: true
  },

  // Hook execution
  async execute(context) {
    const { element, value, formData } = context;
    
    try {
      // Get the form container
      const form = element.closest('.memory-form');
      if (!form) return;

      // Extract memorial ID from form
      const memorialId = form.dataset.memorialId || 'draft';
      
      // Collect all form data
      const formElements = form.querySelectorAll('input, textarea, select');
      const memorialData = {};
      
      formElements.forEach(el => {
        if (el.name) {
          memorialData[el.name] = el.value;
        }
      });

      // Add metadata
      memorialData.lastSaved = new Date().toISOString();
      memorialData.isDraft = true;
      memorialData.autoSaved = true;

      // Save to IndexedDB
      await this.saveMemorialDraft(memorialId, memorialData);
      
      // Show subtle save indicator
      this.showSaveIndicator(form, 'saved');
      
      // Log for monitoring
      console.log(`Auto-saved memorial ${memorialId} at ${memorialData.lastSaved}`);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.showSaveIndicator(form, 'error');
    }
  },

  // Save memorial draft to IndexedDB
  async saveMemorialDraft(memorialId, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MictlaDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['memorialDrafts'], 'readwrite');
        const store = transaction.objectStore('memorialDrafts');
        
        const draftData = {
          id: memorialId,
          data: data,
          timestamp: Date.now()
        };
        
        const saveRequest = store.put(draftData);
        
        saveRequest.onsuccess = () => resolve();
        saveRequest.onerror = () => reject(saveRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('memorialDrafts')) {
          const store = db.createObjectStore('memorialDrafts', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  },

  // Show save status indicator
  showSaveIndicator(form, status) {
    let indicator = form.querySelector('.auto-save-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'auto-save-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
      `;
      form.style.position = 'relative';
      form.appendChild(indicator);
    }

    // Update indicator based on status
    switch (status) {
      case 'saved':
        indicator.textContent = '✓ Guardado automáticamente';
        indicator.style.backgroundColor = '#10b981';
        indicator.style.color = 'white';
        break;
      case 'saving':
        indicator.textContent = '⏳ Guardando...';
        indicator.style.backgroundColor = '#f59e0b';
        indicator.style.color = 'white';
        break;
      case 'error':
        indicator.textContent = '⚠ Error al guardar';
        indicator.style.backgroundColor = '#ef4444';
        indicator.style.color = 'white';
        break;
    }

    // Show indicator
    indicator.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 3000);
  },

  // Recovery function to restore drafts
  async recoverDrafts() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MictlaDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['memorialDrafts'], 'readonly');
        const store = transaction.objectStore('memorialDrafts');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const drafts = getAllRequest.result;
          resolve(drafts);
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  },

  // Clean up old drafts (older than 7 days)
  async cleanupOldDrafts() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MictlaDB', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['memorialDrafts'], 'readwrite');
        const store = transaction.objectStore('memorialDrafts');
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(sevenDaysAgo);
        
        const deleteRequest = index.openCursor(range);
        
        deleteRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  },

  // Initialize hook when page loads
  initialize() {
    // Set up debounced save function
    let saveTimeout;
    
    const debouncedSave = (element, value) => {
      clearTimeout(saveTimeout);
      
      // Show saving indicator immediately
      const form = element.closest('.memory-form');
      if (form) {
        this.showSaveIndicator(form, 'saving');
      }
      
      saveTimeout = setTimeout(() => {
        this.execute({ element, value });
      }, this.config.debounce);
    };

    // Attach event listeners to form elements
    document.addEventListener('input', (event) => {
      const element = event.target;
      
      // Check if element matches our target selector
      if (element.matches(this.config.target)) {
        debouncedSave(element, element.value);
      }
    });

    // Clean up old drafts on initialization
    this.cleanupOldDrafts().catch(console.error);

    // Offer to recover drafts if any exist
    this.recoverDrafts().then(drafts => {
      if (drafts.length > 0) {
        this.offerDraftRecovery(drafts);
      }
    }).catch(console.error);
  },

  // Offer to recover unsaved drafts
  offerDraftRecovery(drafts) {
    const modal = document.createElement('div');
    modal.className = 'draft-recovery-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Recuperar Borradores</h3>
          <p>Se encontraron ${drafts.length} borrador(es) no guardado(s). ¿Deseas recuperarlos?</p>
          <div class="draft-list">
            ${drafts.map(draft => `
              <div class="draft-item">
                <strong>${draft.data.name || 'Memorial sin nombre'}</strong>
                <small>Guardado: ${new Date(draft.timestamp).toLocaleString('es-MX')}</small>
              </div>
            `).join('')}
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" onclick="this.closest('.draft-recovery-modal').remove()">
              Descartar
            </button>
            <button class="btn-primary" onclick="window.mictlaHooks.autoSave.restoreDrafts()">
              Recuperar
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
    `;

    document.body.appendChild(modal);
  },

  // Restore drafts to the form
  async restoreDrafts() {
    try {
      const drafts = await this.recoverDrafts();
      
      // For now, restore the most recent draft
      if (drafts.length > 0) {
        const mostRecent = drafts.reduce((latest, current) => 
          current.timestamp > latest.timestamp ? current : latest
        );
        
        this.populateForm(mostRecent.data);
        
        // Remove the modal
        const modal = document.querySelector('.draft-recovery-modal');
        if (modal) modal.remove();
        
        // Show success message
        this.showNotification('Borrador recuperado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error recovering drafts:', error);
      this.showNotification('Error al recuperar borradores', 'error');
    }
  },

  // Populate form with draft data
  populateForm(data) {
    const form = document.querySelector('.memory-form');
    if (!form) return;

    Object.keys(data).forEach(key => {
      const element = form.querySelector(`[name="${key}"]`);
      if (element && data[key]) {
        element.value = data[key];
        
        // Trigger change event for reactive updates
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  },

  // Show notification to user
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10001;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
};

// Make available globally for recovery modal
window.mictlaHooks = window.mictlaHooks || {};
window.mictlaHooks.autoSave = module.exports;