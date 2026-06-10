// ========================================
// MAIN.JS - Coordinador central
// ========================================

// Inicializar aplicacion
document.addEventListener('DOMContentLoaded', () => {
  UIManager.init();
  Graph3DManager.init();
  Graph2DManager.init();
  TableViewManager.init();
  
  // Setup view switcher
  setupViewSwitcher();
  
  // Escuchar cambios en notas
  window.addEventListener('notes-changed', handleNotesChanged);
  window.addEventListener('search-query', handleSearch);
});

function setupViewSwitcher() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  // Actualizar botones
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Actualizar vistas
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) {
    activeView.classList.add('active');
    
    // Trigger render si es necesario
    if (viewName === '2d') Graph2DManager.render();
    if (viewName === 'table') TableViewManager.render();
  }
}

function handleNotesChanged() {
  Graph3DManager.update();
  Graph2DManager.render();
  TableViewManager.render();
}

function handleSearch(e) {
  const query = e.detail;
  Graph3DManager.search(query);
  Graph2DManager.search(query);
  TableViewManager.search(query);
}
