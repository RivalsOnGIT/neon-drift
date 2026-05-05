// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 50, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x888888));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 50, 50);
scene.add(dirLight);

const neon1 = new THREE.PointLight(0x00ffff, 2, 150);
neon1.position.set(20, 10, 20);
scene.add(neon1);

const neon2 = new THREE.PointLight(0xff00ff, 2, 150);
neon2.position.set(-20, 10, -20);
scene.add(neon2);

// Ground grid
const grid = new THREE.GridHelper(500, 50, 0x00ffff, 0x004444);
scene.add(grid);

// Walls
const trackSize = 100;
const walls = [];

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
  walls.push(wall);
}

createWall(0, -trackSize, trackSize*2, 2);
createWall(0, trackSize, trackSize*2, 2);
createWall(-trackSize, 0, 2, trackSize*2);
createWall(trackSize, 0, 2, trackSize*2);

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

// Movement variables
let speed = 0;
let maxSpeed = 1.2;
let acceleration = 0.02;
let friction = 0.96;

let turnSpeed = 0;
let maxTurn = 0.04;

let velocity = new THREE.Vector3();

let boost = 0;
let driftScore = 0;

// Input
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Collision
function checkCollision() {
  for (let wall of walls) {
    const dx = Math.abs(car.position.x - wall.position.x);
    const dz = Math.abs(car.position.z - wall.position.z);

    if (dx < 3 && dz < 3) {
      velocity.multiplyScalar(-0.3);
      speed *= -0.3;
    }
  }
}

// UI
const ui = document.getElementById("ui");

function updateUI() {
  ui.innerHTML = `
    <b>NEON DRIFT</b><br>
    Speed: ${speed.toFixed(2)}<br>
    Drift: ${Math.floor(driftScore)}<br>
    Boost: ${Math.floor(boost)}
  `;
}

// Camera
const camOffset = new THREE.Vector3(0, 6, -12);

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Acceleration
  if (keys["w"]) speed += acceleration;
  if (keys["s"]) speed -= acceleration;

  speed = Math.max(-0.6, Math.min(maxSpeed, speed));
  speed *= friction;

  // Boost
  if (keys[" "] && boost > 0) {
    speed += 0.05;
    boost -= 0.5;
  }

  // Turning
  if (keys["a"]) turnSpeed = maxTurn;
  else if (keys["d"]) turnSpeed = -maxTurn;
  else turnSpeed = 0;

  let speedFactor = Math.min(Math.abs(speed) * 1.5, 1);
  car.rotation.y += turnSpeed * speedFactor;

  // Drift
  let drifting = keys["shift"];
  let grip = drifting ? 0.92 : 0.98;

  if (drifting && Math.abs(speed) > 0.2) {
    driftScore += Math.abs(speed) * 0.5;
    boost += 0.2;
  }

  // Movement vector
  let forward = new THREE.Vector3(
    Math.sin(car.rotation.y),
    0,
    Math.cos(car.rotation.y)
  );

  velocity.add(forward.multiplyScalar(speed));
  velocity.multiplyScalar(grip);

  car.position.add(velocity);

  checkCollision();

  // Camera follow
  let desired = car.position.clone().add(
    camOffset.clone().applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y)
  );

  camera.position.lerp(desired, 0.1);
  camera.lookAt(car.position);

  updateUI();
  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
