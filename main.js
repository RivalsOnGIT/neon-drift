const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 20, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x404040));

const neonLight = new THREE.PointLight(0x00ffff, 3, 200);
neonLight.position.set(0, 20, 0);
scene.add(neonLight);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Track (simple rectangular boundary)
const trackSize = 100;

function createWall(x, z, w, h) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, 5, h),
    new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x002222
    })
  );
  wall.position.set(x, 2.5, z);
  scene.add(wall);
  return wall;
}

const walls = [
  createWall(0, -trackSize, trackSize*2, 2),
  createWall(0, trackSize, trackSize*2, 2),
  createWall(-trackSize, 0, 2, trackSize*2),
  createWall(trackSize, 0, 2, trackSize*2),
];

// Car
const car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x003333
  })
);
car.position.y = 0.5;
scene.add(car);

// Movement
let speed = 0;
let direction = 0;
let boost = 0;
let driftScore = 0;
let lap = 0;

const keys = {};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Checkpoint (start/finish line)
const checkpoint = new THREE.Mesh(
  new THREE.BoxGeometry(20, 1, 2),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
checkpoint.position.set(0, 0.5, -trackSize + 5);
scene.add(checkpoint);

let passedCheckpoint = false;

// Collision detection
function checkCollision() {
  for (let wall of walls) {
    const dx = Math.abs(car.position.x - wall.position.x);
    const dz = Math.abs(car.position.z - wall.position.z);

    if (dx < 3 && dz < 3) {
      speed *= -0.3; // bounce back
    }
  }
}

// UI
const ui = document.getElementById("ui");

function updateUI() {
  ui.innerHTML = `
    <h1>NEON DRIFT</h1>
    <p>Speed: ${speed.toFixed(2)}</p>
    <p>Drift Score: ${Math.floor(driftScore)}</p>
    <p>Lap: ${lap}</p>
  `;
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Acceleration
  if (keys["w"]) speed += 0.03;
  if (keys["s"]) speed -= 0.02;

  speed *= 0.98;

  // Boost
  if (keys[" "] && boost > 0) {
    speed += 0.05;
    boost -= 0.5;
  }

  // Steering
  if (keys["a"]) direction += 0.04 * speed;
  if (keys["d"]) direction -= 0.04 * speed;

  // Drift
  let drifting = keys["shift"];
  let driftFactor = drifting ? 0.94 : 0.98;

  if (drifting && Math.abs(speed) > 0.1) {
    driftScore += Math.abs(speed) * 0.5;
    boost += 0.2;
  }

  car.rotation.y += direction;
  car.position.x += Math.sin(car.rotation.y) * speed * driftFactor;
  car.position.z += Math.cos(car.rotation.y) * speed * driftFactor;

  // Collision
  checkCollision();

  // Checkpoint logic
  const distToCheckpoint =
    Math.hypot(
      car.position.x - checkpoint.position.x,
      car.position.z - checkpoint.position.z
    );

  if (distToCheckpoint < 10 && !passedCheckpoint) {
    passedCheckpoint = true;
    lap++;
    boost += 10;
  }

  if (distToCheckpoint > 15) {
    passedCheckpoint = false;
  }

  // Camera follow
  camera.position.x = car.position.x - Math.sin(car.rotation.y) * 12;
  camera.position.z = car.position.z - Math.cos(car.rotation.y) * 12;
  camera.position.y = 6;

  camera.lookAt(car.position);

  updateUI();
  renderer.render(scene, camera);
}

animate();

// Resize fix
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});