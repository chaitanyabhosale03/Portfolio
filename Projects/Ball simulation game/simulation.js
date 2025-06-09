const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

let paused = false;
let gravityX = 0;
let gravityY = 0.5;
const damping = 0.98;
const balls = [];
const radiusRange = [5, 10];
let isMobile = false;
let idCounter = 1;
const counter = document.getElementById("counter");




class Ball {
  constructor(x, y, radius, id) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = radius * 0.5;
    this.vx = (Math.random() * 2 - 1) * 5;
    this.vy = 0;
    this.color = `hsl(${Math.random() * 360}, 80%, 50%)`;
  }

  update() {
    this.vx += gravityX;
    this.vy += gravityY;

    this.vx *= damping;
    this.vy *= damping;

    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.vx *= -1;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.vy *= -1;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

canvas.addEventListener("click", () => {
  const radius = Math.random() * (radiusRange[1] - radiusRange[0]) + radiusRange[0];
  const x = Math.random() * (canvas.width - 2 * radius) + radius;
  const y = 50;
  balls.push(new Ball(x, y, radius, idCounter++));
  counter.textContent = `Balls: ${balls.length}`;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") paused = !paused;

  if (e.key === "c" || e.key === "C") {
    balls.length = 0;
    counter.textContent = `Balls: 0`;
  }

  // Desktop arrow keys for gravity
  if (!isMobile) {
    switch (e.key) {
      case "ArrowLeft": gravityX = -0.5; break;
      case "ArrowRight": gravityX = 0.5; break;
      case "ArrowUp": gravityY = -0.5; break;
      case "ArrowDown": gravityY = 0.5; break;
    }
  }
});

// Device detection
function detectDevice() {
  if (window.DeviceOrientationEvent && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    isMobile = true;
    info.textContent = "Mobile detected: Tilt to control gravity!";
    // Ask permission for iOS
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(permissionState => {
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      }).catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  } else {
    info.textContent = "Desktop detected: Use arrow keys to control gravity.";
  }
}

function handleOrientation(event) {
  const tiltX = event.gamma || 0;
  const tiltY = event.beta || 0;
  gravityX = tiltX / 30;
  gravityY = tiltY / 30;
}

function loop() {
  if (!paused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let ball of balls) {
      ball.update();
      ball.draw();
    }
  }
  requestAnimationFrame(loop);
}

detectDevice();
loop();
