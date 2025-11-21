const gameArea = document.getElementById("gameArea");
const birdDiv = document.getElementById("bird");
const birdsContainer = document.getElementById("birdsContainer");

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const PIPE_WIDTH = 60;

// ==========================
// BIRD
// ==========================
let bird = {
    x: 80,
    y: 200,
    width: 40,
    height: 30,
    dy: 0
};

let gravity = 0.35;
let jumpForce = -7;
let gameSpeed = 2;

let pipes = [];
let frame = 0;
let score = 0;
let lives = 3;
let gameOver = false;
let flyingBirds = [];

// Asegurar posición inicial del bird en el DOM
birdDiv.style.left = bird.x + "px";
birdDiv.style.top = bird.y + "px";

// ==========================
// CONTROLES
// ==========================
document.addEventListener("keydown", (e) => {
    // evitar scroll en space
    if (e.code === "Space") e.preventDefault();
    jump();
});
document.addEventListener("mousedown", jump);
document.addEventListener("touchstart", jump);

function jump() {
    if (gameOver) {
        resetGame();
        return;
    }
    bird.dy = jumpForce;
}

// ==========================
// TUBERÍAS
// ==========================
function spawnPipe() {
    const gap = 140;
    const minTop = 50;
    const maxTop = GAME_HEIGHT - gap - 50;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    const pipeX = GAME_WIDTH;

    const topPipe = document.createElement("div");
    topPipe.className = "pipe topPipe";
    topPipe.style.height = topHeight + "px";
    topPipe.style.left = pipeX + "px";
    topPipe.style.top = "0px";
    topPipe.style.width = PIPE_WIDTH + "px";

    const bottomPipe = document.createElement("div");
    bottomPipe.className = "pipe bottomPipe";
    bottomPipe.style.height = (GAME_HEIGHT - (topHeight + gap)) + "px";
    bottomPipe.style.left = pipeX + "px";
    bottomPipe.style.bottom = "0px";
    bottomPipe.style.width = PIPE_WIDTH + "px";

    gameArea.appendChild(topPipe);
    gameArea.appendChild(bottomPipe);

    pipes.push({
        x: pipeX,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        topPipe,
        bottomPipe
    });
}

// ==========================
// COLISIONES
// ==========================
function checkCollision(pipe) {
    // caja pájaro
    const bx1 = bird.x;
    const bx2 = bird.x + bird.width;
    const by1 = bird.y;
    const by2 = bird.y + bird.height;

    // caja pipe (horizontal rango)
    const px1 = pipe.x;
    const px2 = pipe.x + PIPE_WIDTH;

    // si hay superposición horizontal
    if (bx2 > px1 && bx1 < px2) {
        // si está por encima del hueco o por debajo -> choque
        if (by1 < pipe.topHeight || by2 > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

// ==========================
// ANIMACIÓN DEL BIRD (spritesheet)
// ==========================
let birdFrame = 0;
let birdFrameCount = 0;

function animateBird() {
    birdFrameCount++;
    if (birdFrameCount % 6 === 0) {
        birdFrame = (birdFrame + 1) % 3;
        birdDiv.style.backgroundPositionX = -(birdFrame * bird.width) + "px";
    }
}

// ==========================
// EXPLOSIÓN
// ==========================
function triggerExplosion() {
    const explosion = document.createElement("div");
    explosion.className = "explosion-element birdExplode";
    explosion.style.left = bird.x + "px";
    explosion.style.top = bird.y + "px";
    explosion.style.width = bird.width + "px";
    explosion.style.height = bird.height + "px";

    // tomar la misma imagen usada por bird (si está en CSS, la obtenemos)
    const computed = getComputedStyle(birdDiv);
    if (computed && computed.backgroundImage) {
        explosion.style.backgroundImage = computed.backgroundImage;
        explosion.style.backgroundSize = computed.backgroundSize || `${bird.width * 3}px ${bird.height}px`;
        explosion.style.backgroundPosition = computed.backgroundPosition || `${-birdFrame * bird.width}px 0px`;
        explosion.style.backgroundRepeat = "no-repeat";
    }

    gameArea.appendChild(explosion);
    setTimeout(() => explosion.remove(), 400);
}

// ==========================
// REINICIAR
// ==========================
function resetGame() {
    // eliminar dom pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        if (p.topPipe) p.topPipe.remove();
        if (p.bottomPipe) p.bottomPipe.remove();
    }
    document.getElementById("score").textContent = "Puntaje: 0";
    document.getElementById("lives").textContent = "Vidas x3";
    pipes = [];
    score = 0;
    lives = 3;
    bird.y = 200;
    bird.dy = 0;
    gameOver = false;
    frame = 0;
}

// ==========================
// LOOP PRINCIPAL
// ==========================
function update() {
    if (gameOver) {
        // mostrar mensaje simple en DOM (puedes mejorar visual más tarde)
        if (!document.getElementById("gameOverMsg")) {
            const msg = document.createElement("div");
            msg.id = "gameOverMsg";
            msg.style.position = "absolute";
            msg.style.left = "50%";
            msg.style.top = "45%";
            msg.style.transform = "translate(-50%,-50%)";
            msg.style.zIndex = 30;
            msg.style.color = "red";
            msg.style.fontSize = "28px";
            msg.style.textAlign = "center";
            msg.innerHTML = `GAME OVER<br>Reinicia el juego`;
            gameArea.appendChild(msg);
        }
        return;
    }

    // física
    bird.dy += gravity;
    bird.y += bird.dy;

    // suelo (y techo)
    if (bird.y + bird.height >= GAME_HEIGHT) {
        triggerExplosion();
        lives--;
        bird.y = 200;
        bird.dy = 0;
        document.getElementById("lives").textContent = "Vidas x" + lives;
        if (lives <= 0) gameOver = true;
    }
    if (bird.y < 0) {
        bird.y = 0;
        bird.dy = 0;
    }

    // spawn pipes
    if (frame % 120 === 0) spawnPipe();

    // mover pipes (iterar hacia atrás para poder eliminar)
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= gameSpeed;

        // actualizar DOM
        pipe.topPipe.style.left = pipe.x + "px";
        pipe.bottomPipe.style.left = pipe.x + "px";

        // pasado el borde izquierdo -> eliminar y sumar puntaje
        if (pipe.x + PIPE_WIDTH < 0) {
            pipe.topPipe.remove();
            pipe.bottomPipe.remove();
            pipes.splice(i, 1);
            score = score + 5;
            document.getElementById("score").textContent = "Puntaje: " + score;
            continue;
        }

        // colisión
        if (checkCollision(pipe)) {
            triggerExplosion();
            // eliminar la pareja de pipes colisionada
            pipe.topPipe.remove();
            pipe.bottomPipe.remove();
            pipes.splice(i, 1);
            lives--;
            document.getElementById("lives").textContent = "Vidas x" + lives;
            if (lives <= 0) gameOver = true;
            
        }
    }

    // update bird DOM
    birdDiv.style.top = bird.y + "px";

    animateBird();

    frame++;
    requestAnimationFrame(update);
}
function spawnFlyingBird() {
    const bird = document.createElement("div");
    bird.className = "flyingBird";

    // posición inicial (derecha)
    bird.style.left = GAME_WIDTH + "px";
    bird.style.top = (Math.random() * 200 + 50) + "px";

    birdsContainer.appendChild(bird);

    flyingBirds.push({
        x: GAME_WIDTH,
        y: parseFloat(bird.style.top),
        div: bird,
        frame: 0,
        frameCount: 0,
        speed: 1 + Math.random() * 1.5
    });
}


update();
