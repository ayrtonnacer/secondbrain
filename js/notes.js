// ========================================
// NOTES.JS - Sistema de manejo de notas
// ========================================

const NotesManager = (() => {
  const STORAGE_KEY = 'secondbrain_notes';
  let notes = [];
  let listeners = [];

  // Cargar notas desde localStorage
  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      notes = stored ? JSON.parse(stored) : getInitialNotes();
      notifyListeners();
    } catch (e) {
      console.error('Error cargando notas:', e);
      notes = getInitialNotes();
    }
  }

  // Notas iniciales de ejemplo
  function getInitialNotes() {
    return [
      {
        id: '1',
        title: 'Hanumankind',
        description: 'Big Dawgs - Hip hop experimental desde Kerala',
        tags: ['musica', 'hip-hop', 'india'],
        image: 'images/hanumankind.jpg',
        link: 'https://open.spotify.com/intl-es/track/5xvPXPOUITOU26irSi3XD5?si=20fb8b8e1fff4038',
        connections: ['2'],
        createdAt: Date.now() - 86400000
      },
      {
        id: '2',
        title: 'Vygotsky',
        description: 'Zona de desarrollo proximo - psicologia del aprendizaje',
        tags: ['psicologia', 'educacion', 'teoria'],
        image: 'images/vygotsky.jpg',
        link: 'https://artsandculture.google.com/story/qgXBfAEiMpFJzA',
        connections: ['1', '3'],
        createdAt: Date.now() - 172800000
      },
      {
        id: '3',
        title: 'How to Take Smart Notes',
        description: 'Metodo Zettelkasten para tomar notas conectadas',
        tags: ['productividad', 'notas', 'libro'],
        image: 'images/howtotakesmartnotes.jpg',
        link: 'https://fortelabs.com/blog/how-to-take-smart-notes/',
        connections: ['2'],
        createdAt: Date.now() - 259200000
      }
    ];
  }

  // Guardar notas en localStorage
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      notifyListeners();
    } catch (e) {
      console.error('Error guardando notas:', e);
    }
  }

  // Listeners para cambios
  function subscribe(callback) {
    listeners.push(callback);
  }

  function notifyListeners() {
    listeners.forEach(cb => cb(notes));
  }

  // CRUD operations
  function getAll() {
    return [...notes];
  }

  function getById(id) {
    return notes.find(n => n.id === id);
  }

  function create(noteData) {
    const newNote = {
      id: generateId(),
      title: noteData.title || 'Sin titulo',
      description: noteData.description || '',
      tags: noteData.tags || [],
      image: noteData.image || '',
      link: noteData.link || '',
      connections: noteData.connections || [],
      createdAt: Date.now()
    };
    notes.push(newNote);
    save();
    return newNote;
  }

  function update(id, updates) {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;
    notes[index] = { ...notes[index], ...updates };
    save();
    return notes[index];
  }

  function remove(id) {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    // Remover conexiones de otras notas
    notes.forEach(note => {
      if (note.connections.includes(id)) {
        note.connections = note.connections.filter(c => c !== id);
      }
    });
    
    notes.splice(index, 1);
    save();
    return true;
  }

  // Buscar notas
  function search(query) {
    if (!query) return notes;
    const q = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(q) ||
      note.description.toLowerCase().includes(q) ||
      note.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Filtrar por tag
  function filterByTags(tags) {
    if (!tags || tags.length === 0) return notes;
    return notes.filter(note =>
      tags.some(tag => note.tags.includes(tag))
    );
  }

  // Obtener todos los tags unicos
  function getAllTags() {
    const tagSet = new Set();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  // Generar ID unico
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtener notas conectadas
  function getConnected(noteId) {
    const note = getById(noteId);
    if (!note) return [];
    return note.connections.map(id => getById(id)).filter(Boolean);
  }

  // Obtener red de conexiones (para grafos)
  function getConnectionGraph() {
    const nodes = notes.map(note => ({
      id: note.id,
      title: note.title,
      image: note.image,
      tags: note.tags
    }));
    
    const links = [];
    notes.forEach(note => {
      note.connections.forEach(targetId => {
        // Evitar duplicados (A->B y B->A)
        if (!links.some(l => 
          (l.source === note.id && l.target === targetId) ||
          (l.source === targetId && l.target === note.id)
        )) {
          links.push({
            source: note.id,
            target: targetId
          });
        }
      });
    });
    
    return { nodes, links };
  }

  // Inicializar
  load();

  // API publica
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    search,
    filterByTags,
    getAllTags,
    getConnected,
    getConnectionGraph,
    subscribe
  };
})();

// Exportar globalmente
window.NotesManager = NotesManager;
