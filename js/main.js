// Configuración de imágenes y enlaces
const images = [
    { 
        url: 'images/hanumankind.jpg', 
        link: 'https://open.spotify.com/intl-es/track/5xvPXPOUITOU26irSi3XD5?si=20fb8b8e1fff4038'
    },
    { 
        url: 'images/vygotsky.jpg', 
        link: 'https://artsandculture.google.com/story/qgXBfAEiMpFJzA'
    },
    { 
        url: 'images/howtotakesmartnotes.jpg', 
        link: 'https://fortelabs.com/blog/how-to-take-smart-notes/'
    }
];

// Variables para control táctil y mouse
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isDragging = false;
let initialPinchDistance = null;

// Configuración básica de Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e9e9');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Variables para el Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Funciones de utilidad
function getRandomPosition() {
    const spread = window.innerWidth < 768 ? 6 : 8;
    return {
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread
    };
}

function getSensitivityFactor() {
    return window.innerWidth < 768 ? 0.008 : 0.01;
}

function getZoomFactor() {
    return window.innerWidth < 768 ? 0.02 : 0.01;
}

function getDragThreshold() {
    return window.innerWidth < 768 ? 5 : 2;
}

// Crear planos con imágenes
const planes = images.map((image) => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texture = new THREE.TextureLoader().load(image.url);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    const plane = new THREE.Mesh(geometry, material);
    const pos = getRandomPosition();
    plane.position.set(pos.x, pos.y, pos.z);
    plane.lookAt(new THREE.Vector3(0, 0, 0));
    plane.userData = { link: image.link };
    scene.add(plane);
    return plane;
});

// Posicionar cámara
camera.position.z = window.innerWidth < 768 ? 15 : 12;

// Eventos del mouse
document.addEventListener('mousedown', (e) => {
    mouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (mouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        if (Math.abs(deltaX) > getDragThreshold() || Math.abs(deltaY) > getDragThreshold()) {
            isDragging = true;
        }
        
        targetRotationY += deltaX * getSensitivityFactor();
        targetRotationX += deltaY * getSensitivityFactor();
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Eventos táctiles mejorados
document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        e.preventDefault();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
    } else if (e.touches.length === 2) {
        e.preventDefault();
        initialPinchDistance = getPinchDistance(e);
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isTouching) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;

        if (Math.abs(deltaX) > getDragThreshold() || Math.abs(deltaY) > getDragThreshold()) {
            isDragging = true;
        }

        targetRotationY += deltaX * getSensitivityFactor();
        targetRotationX += deltaY * getSensitivityFactor();

        touchStartX = touchX;
        touchStartY = touchY;
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        const currentDistance = getPinchDistance(e);
        const delta = initialPinchDistance - currentDistance;
        camera.position.z += delta * getZoomFactor();
        camera.position.z = Math.max(5, Math.min(20, camera.position.z));
        initialPinchDistance = currentDistance;
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (!isDragging && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        handleClick(touch.clientX, touch.clientY);
    }
    isTouching = false;
    initialPinchDistance = null;
});

// Función mejorada para manejar clics
function handleClick(x, y) {
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData && clickedObject.userData.link) {
            window.open(clickedObject.userData.link, '_blank');
        }
    }
}

document.addEventListener('click', (event) => {
    if (!isDragging) {
        handleClick(event.clientX, event.clientY);
    }
});

function getPinchDistance(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
}

// Zoom con la rueda del mouse
document.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.position.z += e.deltaY * getZoomFactor();
    camera.position.z = Math.max(5, Math.min(20, camera.position.z));
}, { passive: false });

// Reset con doble click/toque
document.addEventListener('dblclick', () => {
    targetRotationX = 0;
    targetRotationY = 0;
    camera.position.z = window.innerWidth < 768 ? 15 : 12;
});

// Función de animación
function animate() {
    requestAnimationFrame(animate);

    // Factor de suavizado adaptativo
    const dampingFactor = window.innerWidth < 768 ? 0.08 : 0.05;
    
    // Actualizar rotaciones con suavizado
    currentRotationX += (targetRotationX - currentRotationX) * dampingFactor;
    currentRotationY += (targetRotationY - currentRotationY) * dampingFactor;

    scene.rotation.x = currentRotationX;
    scene.rotation.y = currentRotationY;

    // Mantener las imágenes mirando a la cámara
    planes.forEach(plane => {
        plane.quaternion.copy(camera.quaternion);
    });

    renderer.render(scene, camera);
}

// Iniciar animación
animate();

// Manejar redimensionamiento de ventana
window.addEventListener('resize', () => {
    // Actualizar cámara
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Actualizar renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Ajustar posición de cámara según dispositivo
    camera.position.z = window.innerWidth < 768 ? 15 : 12;
});

// Prevenir comportamientos por defecto en móviles
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Optimización para dispositivos móviles
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}