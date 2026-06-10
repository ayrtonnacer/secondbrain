// ========================================
// TABLEVIEW.JS - Vista tabla con filtros
// ========================================

const TableViewManager = (() => {
  function init() {
    render();
    setupFilters();
  }

  function render(filteredNotes = null) {
    const notes = filteredNotes || NotesManager.getAll();
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    notes.forEach(note => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${note.image || ''}" class="table-thumbnail" onerror="this.style.display='none'" /></td>
        <td><strong>${note.title}</strong></td>
        <td>${note.description.substring(0, 80)}...</td>
        <td><div class="table-tags">${note.tags.map(t => `<span class="table-tag">#${t}</span>`).join('')}</div></td>
        <td>${note.connections.length}</td>
        <td>${new Date(note.createdAt).toLocaleDateString()}</td>
      `;
      tr.onclick = () => UIManager.openViewModal(note.id);
      tbody.appendChild(tr);
    });
    
    renderTagFilters();
  }

  function renderTagFilters() {
    const tags = NotesManager.getAllTags();
    const container = document.getElementById('tag-filters');
    container.innerHTML = '';
    
    if (tags.length === 0) {
      container.innerHTML = '<span style="color: #999;">Sin tags</span>';
      return;
    }
    
    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-filter';
      btn.textContent = '#' + tag;
      btn.onclick = () => {
        btn.classList.toggle('active');
        applyFilters();
      };
      container.appendChild(btn);
    });
  }

  function setupFilters() {
    renderTagFilters();
  }

  function applyFilters() {
    const activeTags = Array.from(document.querySelectorAll('.tag-filter.active'))
      .map(btn => btn.textContent.substring(1));
    
    if (activeTags.length === 0) {
      render();
    } else {
      const filtered = NotesManager.filterByTags(activeTags);
      render(filtered);
    }
  }

  function search(query) {
    if (!query) {
      render();
    } else {
      render(NotesManager.search(query));
    }
  }

  return { init, render, search };
})();

window.TableViewManager = TableViewManager;
