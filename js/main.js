// Configuración de imágenes y enlaces
const images = [
    { 
        url: 'images/hanumankind.jpg', 
        link: 'https://open.spotify.com/intl-es/track/5xvPXPOUITOU26irSi3XD5?si=20fb8b8e1fff4038'
    },
    { 
        url: 'images/basquiat.jpg', 
        link: 'https://artsandculture.google.com/story/qgXBfAEiMpFJzA'
    },
    { 
        url: 'images/howtotakesmartnotes.jpg', 
        link: 'https://fortelabs.com/blog/how-to-take-smart-notes/'
    }
];

// Variables para control táctil
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;

// Configuración básica de Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e9e9');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Variables para el Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Función para generar posiciones aleatorias
function getRandomPosition() {
    const spread = 8;
    return {
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread
    };
}

// Crear planos con imágenes
const planes = images.map((image) => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const texture = new THREE.TextureLoader().load(image.url);
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
camera.position.z = 12;

// Variables para el control
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isDragging = false;

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
        
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            isDragging = true;
        }
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Eventos táctiles
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouching = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isTouching) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        isDragging = true;
    }

    targetRotationY += deltaX * 0.01;
    targetRotationX += deltaY * 0.01;

    touchStartX = touchX;
    touchStartY = touchY;
}, { passive: false });

document.addEventListener('touchend', () => {
    isTouching = false;
});

// Función para manejar clics y toques
function onDocumentMouseClick(event) {
    if (isDragging) {
        isDragging = false;
        return;
    }

    event.preventDefault();
    
    // Obtener coordenadas correctas para mouse o touch
    const x = event.clientX || (event.touches && event.touches[0].clientX);
    const y = event.clientY || (event.touches && event.touches[0].clientY);
    
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = - (y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData && clickedObject.userData.link) {
            window.open(clickedObject.userData.link, '_blank');
        }
    }
}

document.addEventListener('click', onDocumentMouseClick);
document.addEventListener('touchend', onDocumentMouseClick);

// Zoom con la rueda del mouse y gestos pinch
let initialPinchDistance = null;

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e);
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
        const currentDistance = getPinchDistance(e);
        const delta = initialPinchDistance - currentDistance;
        camera.position.z += delta * 0.01;
        camera.position.z = Math.max(5, Math.min(20, camera.position.z));
        initialPinchDistance = currentDistance;
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    initialPinchDistance = null;
});

// Función auxiliar para calcular la distancia del pinch
function getPinchDistance(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
}

document.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * 0.01;
    camera.position.z = Math.max(5, Math.min(20, camera.position.z));
});

// Reset con doble click y doble toque
document.addEventListener('dblclick', () => {
    targetRotationX = 0;
    targetRotationY = 0;
    camera.position.z = 12;
});

// Función de animación
function animate() {
    requestAnimationFrame(animate);

    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;

    scene.rotation.x = currentRotationX;
    scene.rotation.y = currentRotationY;

    planes.forEach(plane => {
        plane.quaternion.copy(camera.quaternion);
    });

    renderer.render(scene, camera);
}

// Iniciar animación
animate();

// Manejar redimensionamiento de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});