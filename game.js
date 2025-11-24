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
    x: 60,
    y: 200,
    width: 80,
    height: 40,
    dy: 0
};

let gravity = 0.2;
let jumpForce = -5;
let gameSpeed = 2;


let pipes = [];
let lifeItems = [];
let pipesSpawned = 0;
let frame = 0;
let score = 0;
let lives = 3;
let gameOver = false;
let flyingBirds = [];

// Asegurar posición inicial del bird en el DOM
birdDiv.style.left = bird.x + "px";
birdDiv.style.top = bird.y + "px";

const gameOverMsg = document.createElement("div");
gameOverMsg.id = "gameOverMsg";
gameOverMsg.classList.add("hidden");

gameArea.appendChild(gameOverMsg);

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
    const gap = 200;
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

    const pipeObj = {
        x: pipeX,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        topPipe,
        bottomPipe
    };

    pipes.push(pipeObj);

    // cada 5 pipes → spawn vida
    pipesSpawned++;
    if (pipesSpawned % 5 === 0) {
        spawnLifeItem(pipeObj);
    }
}

// ==========================
// VIDAS
// ==========================
function spawnLifeItem(pipe) {
    const item = document.createElement("div");
    item.className = "lifeItem";

    // Zona del hueco
    const gapTop = pipe.topHeight;
    const gapBottom = pipe.bottomY;

    // Elije si va arriba o abajo
    const zone = Math.random() < 0.5 ? "upper" : "lower";

    let posY;   

    if (zone === "upper") {
        posY = gapTop + 20; // un poco debajo del techo del hueco
    } else {
        posY = gapBottom - 60; // un poco encima del piso del hueco
    }

    // Posición inicial a la derecha de la pantalla
    item.style.left = pipe.x + "px";
    item.style.top = posY + "px";

    gameArea.appendChild(item);

    lifeItems.push({
        x: pipe.x,
        y: posY,
        width: 40,
        height: 40,
        div: item
    });
}
function triggerLifePickupEffect() {
    const pop = document.createElement("div");
    pop.className = "lifePopEffect";
    pop.style.left = (bird.x + 30) + "px";
    pop.style.top = (bird.y + 10) + "px";
    gameArea.appendChild(pop);

    setTimeout(() => pop.remove(), 300);
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
function checkLifeCollision(item) {
    const bx1 = bird.x;
    const bx2 = bird.x + bird.width;
    const by1 = bird.y;
    const by2 = bird.y + bird.height;

    const ix1 = item.x;
    const ix2 = item.x + item.width;
    const iy1 = item.y;
    const iy2 = item.y + item.height;

    return (bx2 > ix1 && bx1 < ix2 && by2 > iy1 && by1 < iy2);
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
    const bird = document.getElementById("bird");
    const flash = document.getElementById("hitFlash");
    bird.style.backgroundImage = 'url("img/img_batman/batmanColSS.png")';

    flash.classList.remove("flashActive");
    void flash.offsetWidth;
    flash.style.top = bird.style.top;
    flash.classList.add("flashActive");

    setTimeout(() => bird.style.backgroundImage = 'url("img/img_batman/batmanSS.png")', 400);
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

    gameOverMsg.classList.add("hidden");
    gameOverMsg.style.animation = "none";

    update();
}

// ==========================
// LOOP PRINCIPAL
// ==========================
function update() {
    if (gameOver) {
        // mostrar mensaje simple en DOM (puedes mejorar visual más tarde)
        gameOverMsg.innerHTML = 'GAME OVER<br>Puntuacion: ' + score + '<br>Toca para reiniciar el juego';
        gameOverMsg.classList.remove("hidden");
        gameOverMsg.style.animation = "gameOverPop 0.5s ease-out forwards";
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
    
    //mover items de vida
    for (let i = lifeItems.length - 1; i >= 0; i--) {
        let item = lifeItems[i];

        item.x -= gameSpeed;
        item.div.style.left = item.x + "px";

        // fuera de pantalla
        if (item.x < -40) {
            item.div.remove();
            lifeItems.splice(i, 1);
            continue;
        }

        // colisión con bird
        if (checkLifeCollision(item)) {
            item.div.remove();
            lifeItems.splice(i, 1);

            lives++;
            document.getElementById("lives").textContent = "Vidas x" + lives;

            // animación opcional
            triggerLifePickupEffect();
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
