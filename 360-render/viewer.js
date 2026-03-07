import * as THREE from './three.module.js';

const params = new URLSearchParams(window.location.search);
const videoSrc = params.get("src");

const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// VIDEO
const video = document.createElement("video");
video.src = videoSrc;
video.crossOrigin = "anonymous";
video.loop = false;
video.muted = false;
video.playsInline = true;

const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1);

const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.set(0, 0, 0.1);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();


// 🎛 CONTROLES

const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const timeLabel = document.getElementById("time");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
  } else {
    video.pause();
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  }
});

video.addEventListener("timeupdate", () => {
  const percent = (video.currentTime / video.duration) * 100;
  progress.value = percent || 0;

  timeLabel.textContent =
    formatTime(video.currentTime) + " / " + formatTime(video.duration);
});

progress.addEventListener("input", () => {
  video.currentTime = (progress.value / 100) * video.duration;
});

fullscreenBtn.addEventListener("click", () => {
  const container = document.getElementById("player-container");
  if (!document.fullscreenElement) {
    container.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + s.toString().padStart(2, "0");
}
const MIN_FOV = 30;   // más zoom
const MAX_FOV = 100;  // menos zoom
let currentFov = 75;
camera.fov = currentFov;
camera.updateProjectionMatrix();
const zoomSlider = document.getElementById("zoomSlider");

zoomSlider.addEventListener("input", () => {

  const sliderValue = parseInt(zoomSlider.value);

  // Invertimos SOLO aquí
  currentFov = MAX_FOV - (sliderValue - MIN_FOV);

  currentFov = Math.max(MIN_FOV, Math.min(MAX_FOV, currentFov));

  camera.fov = currentFov;
  camera.updateProjectionMatrix();
});
renderer.domElement.addEventListener("wheel", (e) => {
  e.preventDefault();

  const zoomSpeed = 0.05;

  // Scroll hacia abajo (deltaY positivo) → menos zoom → aumentar FOV
  currentFov += e.deltaY * zoomSpeed;

  currentFov = Math.max(MIN_FOV, Math.min(MAX_FOV, currentFov));

  camera.fov = currentFov;
  camera.updateProjectionMatrix();

  zoomSlider.value = MAX_FOV - (currentFov - MIN_FOV);
});

// 🖱 CONTROLES DE CÁMARA

let isDragging = false;
let lon = 0;
let lat = 0;

renderer.domElement.addEventListener("mousedown", () => isDragging = true);
window.addEventListener("mouseup", () => isDragging = false);

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    lon -= e.movementX * 0.1;
    lat += e.movementY * 0.1;
    lat = Math.max(-85, Math.min(85, lat));

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    camera.lookAt(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );
  }
});
function resizeRenderer() {
  const w = container.clientWidth;
  const h = container.clientHeight;

  // Si estamos en fullscreen, usamos tamaño de la ventana
  const fs = document.fullscreenElement ? window.innerWidth : w;
  const fh = document.fullscreenElement ? window.innerHeight : h;

  camera.aspect = fs / fh;
  camera.updateProjectionMatrix();
  renderer.setSize(fs, fh);
}

window.addEventListener("resize", resizeRenderer);
document.addEventListener("fullscreenchange", resizeRenderer);
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const volumeIcon = document.getElementById("volumeIcon");
const muteIcon = document.getElementById("muteIcon");

// Volumen inicial
video.volume = 1;

volumeSlider.addEventListener("input", () => {
  video.volume = volumeSlider.value;

  if (video.volume == 0) {
    video.muted = true;
    volumeIcon.style.display = "none";
    muteIcon.style.display = "block";
  } else {
    video.muted = false;
    volumeIcon.style.display = "block";
    muteIcon.style.display = "none";
  }
});

muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;

  if (video.muted) {
    volumeSlider.value = 0;
    volumeIcon.style.display = "none";
    muteIcon.style.display = "block";
  } else {
    volumeSlider.value = 1;
    video.volume = 1;
    volumeIcon.style.display = "block";
    muteIcon.style.display = "none";
  }
});
// Llamada inicial
resizeRenderer();
window.addEventListener("resize", () => {
  const w = container.clientWidth;
  const h = container.clientHeight;

  camera.aspect = w / h;       // <--- actualizar
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
});