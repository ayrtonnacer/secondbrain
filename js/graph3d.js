// ========================================
// GRAPH3D.JS - Vista 3D con Three.js + Mobile FIXED
// ========================================

const Graph3DManager = (() => {
  let scene, camera, renderer, planes = [], edges = [];
  let mouseDown = false, isDragging = false;
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;
  let currentRotationX = 0, currentRotationY = 0;
  let raycaster, mouse;
  let touchStartX = 0, touchStartY = 0;
  let isTouching = false;
  let initialPinchDistance = null;
  let lastTapTime = 0;

  function init() {
    const container = document.getElementById('view-3d');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e9e9');
    
    camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / (window.innerHeight - 60), 
      0.1, 
      1000
    );
    camera.position.z = window.innerWidth < 768 ? 15 : 12;
    
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
    const spread = window.innerWidth < 768 ? 6 : 8;
    return {
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread
    };
  }

  function getSensitivity() {
    return window.innerWidth < 768 ? 0.008 : 0.01;
  }

  function getZoomSpeed() {
    return window.innerWidth < 768 ? 0.02 : 0.01;
  }

  function setupEvents() {
    const canvas = renderer.domElement;
    
    // MOUSE EVENTS
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
        
        targetRotationY += deltaX * getSensitivity();
        targetRotationX += deltaY * getSensitivity();
        
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      mouseDown = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
      mouseDown = false;
    });
    
    canvas.addEventListener('click', (e) => {
      if (isDragging) return;
      handleClick(e.clientX, e.clientY);
    });
    
    canvas.addEventListener('dblclick', resetView);
    
    // TOUCH EVENTS
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
      } else if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e);
        isTouching = false;
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && isTouching) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true;
        }
        
        targetRotationY += deltaX * getSensitivity();
        targetRotationX += deltaY * getSensitivity();
        
        touchStartX = touchX;
        touchStartY = touchY;
      } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        const currentDistance = getPinchDistance(e);
        const delta = initialPinchDistance - currentDistance;
        camera.position.z += delta * getZoomSpeed();
        camera.position.z = Math.max(5, Math.min(20, camera.position.z));
        initialPinchDistance = currentDistance;
      }
    }, { passive: false });
    
    // CONSOLIDATED touchend - handles both tap and double tap
    canvas.addEventListener('touchend', (e) => {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - lastTapTime;
      
      // Double tap detection
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        resetView();
        lastTapTime = 0;
      } else {
        // Single tap - open note if not dragging
        if (!isDragging && e.changedTouches.length === 1) {
          const touch = e.changedTouches[0];
          handleClick(touch.clientX, touch.clientY);
        }
        lastTapTime = currentTime;
      }
      
      isTouching = false;
      initialPinchDistance = null;
    });
    
    // Zoom con scroll
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * getZoomSpeed();
      camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    }, { passive: false });
    
    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / (window.innerHeight - 60);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight - 60);
      camera.position.z = window.innerWidth < 768 ? 15 : 12;
    });
  }

  function handleClick(x, y) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);
    
    if (intersects.length > 0) {
      const noteId = intersects[0].object.userData.noteId;
      UIManager.openViewModal(noteId);
    }
  }

  function getPinchDistance(e) {
    return Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }

  function resetView() {
    targetRotationX = 0;
    targetRotationY = 0;
    camera.position.z = window.innerWidth < 768 ? 15 : 12;
  }

  function animate() {
    requestAnimationFrame(animate);
    
    const dampingFactor = window.innerWidth < 768 ? 0.08 : 0.05;
    currentRotationX += (targetRotationX - currentRotationX) * dampingFactor;
    currentRotationY += (targetRotationY - currentRotationY) * dampingFactor;
    
    scene.rotation.x = currentRotationX;
    scene.rotation.y = currentRotationY;
    
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
