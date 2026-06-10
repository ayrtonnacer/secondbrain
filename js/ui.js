// ========================================
// UI.JS - Interfaz de usuario y modales
// ========================================

const UIManager = (() => {
  let currentEditingId = null;
  let croppedImageData = null;

  // Elementos del DOM
  const elements = {
    modalNote: document.getElementById('modal-note'),
    modalView: document.getElementById('modal-view'),
    imageInput: document.getElementById('image-input'),
    imagePreview: document.getElementById('image-preview'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    uploadPlaceholder: document.getElementById('upload-placeholder'),
    noteTitleInput: document.getElementById('note-title-input'),
    noteDescInput: document.getElementById('note-desc-input'),
    noteLinkInput: document.getElementById('note-link-input'),
    noteTagsInput: document.getElementById('note-tags-input'),
    connectionsSelector: document.getElementById('connections-selector'),
    saveNoteBtn: document.getElementById('save-note-btn'),
    deleteNoteBtn: document.getElementById('delete-note-btn'),
    addBtn: document.getElementById('add-btn'),
    searchInput: document.getElementById('search-input')
  };

  function init() {
    setupEventListeners();
  }

  function setupEventListeners() {
    // Boton agregar nota
    elements.addBtn.addEventListener('click', () => openNoteModal());

    // Upload imagen
    elements.imagePreviewContainer.addEventListener('click', () => {
      elements.imageInput.click();
    });

    elements.imageInput.addEventListener('change', handleImageUpload);

    // Guardar nota
    elements.saveNoteBtn.addEventListener('click', saveNote);

    // Eliminar nota
    elements.deleteNoteBtn.addEventListener('click', deleteNote);

    // Cerrar modales
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        closeModal(modalId);
      });
    });

    // Cerrar al click en backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) closeModal(modal.id);
      });
    });

    // Busqueda
    elements.searchInput.addEventListener('input', handleSearch);
  }

  // CROP IMAGEN CUADRADO
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Crop al centro
      ctx.drawImage(
        img,
        (img.width - size) / 2, 
        (img.height - size) / 2,
        size, 
        size,
        0, 
        0, 
        512, 
        512
      );
      
      croppedImageData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Mostrar preview
      elements.imagePreview.src = croppedImageData;
      elements.imagePreview.classList.remove('hidden');
      elements.uploadPlaceholder.style.display = 'none';
    };
    
    img.src = URL.createObjectURL(file);
  }

  // ABRIR MODAL NUEVA NOTA
  function openNoteModal(noteId = null) {
    currentEditingId = noteId;
    croppedImageData = null;
    
    if (noteId) {
      // Modo editar
      const note = NotesManager.getById(noteId);
      if (!note) return;
      
      document.getElementById('modal-note-title').textContent = 'Editar Nota';
      elements.noteTitleInput.value = note.title;
      elements.noteDescInput.value = note.description;
      elements.noteLinkInput.value = note.link;
      elements.noteTagsInput.value = note.tags.join(', ');
      
      if (note.image) {
        elements.imagePreview.src = note.image;
        elements.imagePreview.classList.remove('hidden');
        elements.uploadPlaceholder.style.display = 'none';
        croppedImageData = note.image;
      }
      
      renderConnectionsSelector(note.connections);
      elements.deleteNoteBtn.classList.remove('hidden');
    } else {
      // Modo nuevo
      document.getElementById('modal-note-title').textContent = 'Nueva Nota';
      elements.noteTitleInput.value = '';
      elements.noteDescInput.value = '';
      elements.noteLinkInput.value = '';
      elements.noteTagsInput.value = '';
      elements.imagePreview.classList.add('hidden');
      elements.uploadPlaceholder.style.display = 'flex';
      renderConnectionsSelector([]);
      elements.deleteNoteBtn.classList.add('hidden');
    }
    
    openModal('modal-note');
  }

  // RENDER CONNECTIONS SELECTOR
  function renderConnectionsSelector(selectedIds = []) {
    const notes = NotesManager.getAll().filter(n => n.id !== currentEditingId);
    elements.connectionsSelector.innerHTML = '';
    
    if (notes.length === 0) {
      elements.connectionsSelector.innerHTML = '<p style="color: #999; margin: 0;">No hay otras notas para conectar</p>';
      return;
    }
    
    notes.forEach(note => {
      const chip = document.createElement('div');
      chip.className = 'connection-chip';
      if (selectedIds.includes(note.id)) {
        chip.classList.add('selected');
      }
      chip.textContent = note.title;
      chip.dataset.noteId = note.id;
      
      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
      });
      
      elements.connectionsSelector.appendChild(chip);
    });
  }

  // GUARDAR NOTA
  function saveNote() {
    const title = elements.noteTitleInput.value.trim();
    if (!title) {
      alert('Por favor ingresa un titulo');
      return;
    }
    
    const tags = elements.noteTagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    
    const selectedConnections = Array.from(
      elements.connectionsSelector.querySelectorAll('.connection-chip.selected')
    ).map(chip => chip.dataset.noteId);
    
    const noteData = {
      title,
      description: elements.noteDescInput.value.trim(),
      link: elements.noteLinkInput.value.trim(),
      tags,
      connections: selectedConnections,
      image: croppedImageData || ''
    };
    
    if (currentEditingId) {
      NotesManager.update(currentEditingId, noteData);
    } else {
      NotesManager.create(noteData);
    }
    
    closeModal('modal-note');
    window.dispatchEvent(new CustomEvent('notes-changed'));
  }

  // ELIMINAR NOTA
  function deleteNote() {
    if (!currentEditingId) return;
    
    if (confirm('¿Seguro que quieres eliminar esta nota?')) {
      NotesManager.remove(currentEditingId);
      closeModal('modal-note');
      window.dispatchEvent(new CustomEvent('notes-changed'));
    }
  }

  // ABRIR MODAL VER NOTA
  function openViewModal(noteId) {
    const note = NotesManager.getById(noteId);
    if (!note) return;
    
    document.getElementById('view-card-img').src = note.image || '';
    document.getElementById('view-card-title').textContent = note.title;
    document.getElementById('view-card-desc').textContent = note.description;
    
    // Tags
    const tagsContainer = document.getElementById('view-card-tags');
    tagsContainer.innerHTML = '';
    note.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'view-tag';
      tagEl.textContent = '#' + tag;
      tagsContainer.appendChild(tagEl);
    });
    
    // Conexiones
    const connList = document.getElementById('view-card-conn-list');
    connList.innerHTML = '';
    const connectedNotes = NotesManager.getConnected(noteId);
    
    if (connectedNotes.length === 0) {
      connList.innerHTML = '<p style="color: #999; margin: 0;">Sin conexiones</p>';
    } else {
      connectedNotes.forEach(connNote => {
        const connItem = document.createElement('div');
        connItem.className = 'conn-item';
        connItem.textContent = '→ ' + connNote.title;
        connItem.addEventListener('click', () => {
          closeModal('modal-view');
          setTimeout(() => openViewModal(connNote.id), 300);
        });
        connList.appendChild(connItem);
      });
    }
    
    // Link
    const linkBtn = document.getElementById('view-card-link');
    if (note.link) {
      linkBtn.href = note.link;
      linkBtn.classList.remove('hidden');
    } else {
      linkBtn.classList.add('hidden');
    }
    
    // Boton editar
    document.getElementById('view-card-edit').onclick = () => {
      closeModal('modal-view');
      setTimeout(() => openNoteModal(noteId), 300);
    };
    
    openModal('modal-view');
  }

  // ABRIR/CERRAR MODALES
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // BUSQUEDA
  function handleSearch(e) {
    const query = e.target.value;
    window.dispatchEvent(new CustomEvent('search-query', { detail: query }));
  }

  return {
    init,
    openNoteModal,
    openViewModal,
    closeModal
  };
})();

// Exportar globalmente
window.UIManager = UIManager;
