// ========================================
// GRAPH3D.JS - Vista 3D con Three.js
// ========================================

const Graph3DManager = (() => {
  let scene, camera, renderer, planes = [], edges = [];
  let mouseDown = false, isDragging = false;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;
  let currentRotationX = 0, currentRotationY = 0;
  let raycaster, mouse;

  function init() {
    const container = document.getElementById('view-3d');
    
    // Setup Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e9e9');
    
    camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / (window.innerHeight - 60), 
      0.1, 
      1000
    );
    camera.position.z = 12;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 60);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    update();
    setupEvents();
    animate();
  }

  function update() {
    clearScene();
    const notes = NotesManager.getAll();
    const { nodes, links } = NotesManager.getConnectionGraph();
    
    // Crear planos con imagenes
    notes.forEach((note, index) => {
      const geometry = new THREE.PlaneGeometry(2, 2);
      
      let material;
      if (note.image) {
        const texture = new THREE.TextureLoader().load(note.image);
        texture.minFilter = THREE.LinearFilter;
        material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
      } else {
        material = new THREE.MeshBasicMaterial({
          color: 0xcccccc,
          side: THREE.DoubleSide
        });
      }
      
      const plane = new THREE.Mesh(geometry, material);
      const pos = getRandomPosition();
      plane.position.set(pos.x, pos.y, pos.z);
      plane.lookAt(new THREE.Vector3(0, 0, 0));
      plane.userData = { noteId: note.id, title: note.title };
      
      scene.add(plane);
      planes.push(plane);
    });
    
    // Crear lineas de conexion
    links.forEach(link => {
      const sourcePlane = planes.find(p => p.userData.noteId === link.source);
      const targetPlane = planes.find(p => p.userData.noteId === link.target);
      
      if (sourcePlane && targetPlane) {
        const points = [
          sourcePlane.position.clone(),
          targetPlane.position.clone()
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x888888, 
          opacity: 0.4, 
          transparent: true 
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        edges.push(line);
      }
    });
  }

  function clearScene() {
    planes.forEach(p => scene.remove(p));
    edges.forEach(e => scene.remove(e));
    planes = [];
    edges = [];
  }

  function getRandomPosition() {
    const spread = 8;
    return {
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread
    };
  }

  function setupEvents() {
    const canvas = renderer.domElement;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
      mouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      isDragging = false;
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (mouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          isDragging = true;
        }
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      mouseDown = false;
    });
    
    // Click para abrir nota
    canvas.addEventListener('click', (e) => {
      if (isDragging) return;
      
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planes);
      
      if (intersects.length > 0) {
        const noteId = intersects[0].object.userData.noteId;
        UIManager.openViewModal(noteId);
      }
    });
    
    // Zoom con scroll
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    }, { passive: false });
    
    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / (window.innerHeight - 60);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight - 60);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // Smooth rotation
    const dampingFactor = 0.05;
    currentRotationX += (targetRotationX - currentRotationX) * dampingFactor;
    currentRotationY += (targetRotationY - currentRotationY) * dampingFactor;
    
    scene.rotation.x = currentRotationX;
    scene.rotation.y = currentRotationY;
    
    // Mantener imagenes mirando a la camara
    planes.forEach(plane => {
      plane.quaternion.copy(camera.quaternion);
    });
    
    renderer.render(scene, camera);
  }

  function search(query) {
    if (!query) {
      planes.forEach(p => p.material.opacity = 0.9);
      return;
    }
    
    const results = NotesManager.search(query);
    const resultIds = results.map(r => r.id);
    
    planes.forEach(plane => {
      if (resultIds.includes(plane.userData.noteId)) {
        plane.material.opacity = 1.0;
      } else {
        plane.material.opacity = 0.3;
      }
    });
  }

  return { init, update, search };
})();

window.Graph3DManager = Graph3DManager;
