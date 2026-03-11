window.onload = function () {
    setTimeout(function () {
        const title = document.getElementById('game-title');
        if (title) title.classList.add('fade-out');
    }, 2500);

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vogel-Variablen
    let birdY = canvas.height / 2;
    let birdVelocity = 0;
    const gravity = 0.5;
    const jumpStrength = -6; 
    const birdX = 100;
    const birdRadius = 20;

    // Bilder laden
    const bgImages = [];
    const bgPaths = [
        'assets/Background/Background2.png', 
        'assets/Background/Background3.png', 
        'assets/Background/Background4.png', 
        'assets/Background/Background5.png'  
    ];
    
    let imagesLoaded = 0;
    bgPaths.forEach((path, index) => {
        bgImages[index] = new Image();
        bgImages[index].src = path;
        bgImages[index].onload = () => { imagesLoaded++; checkAllLoaded(); };
    });

    const birdImg = new Image();
    birdImg.src = 'assets/Background/Player/StyleBird1/flappybird.png';
    birdImg.onload = () => { imagesLoaded++; checkAllLoaded(); };

    function checkAllLoaded() {
        if (imagesLoaded === 5) gameLoop();
    }

    // Spiel-Logik Variablen
    let level = 1;
    let score = 0; 
    let gameOver = false;
    let gameStarted = false;
    let waitingForNextLevel = false;
    let gameWon = false;
    
    let bgX = 0;
    const bgSpeed = 1;

    // Pipes-Variablen
    const basePipeSpeed = 4; // Startet bei 4 wie gewünscht
    const pipeInterval = 90; // Der zeitliche Abstand bleibt gleich
    const pipeWidth = 60;
    const pipeGap = 200; 
    const pipeEndHeight = 30;
    const pipeEndWidth = 80;
    let pipes = [];
    let pipeTimer = 0;

    const levelGoals = [10, 15, 20, 25]; 
    let levelTitleTimer = 0; 

    // Tastensteuerung
    document.addEventListener('keydown', function (e) {
        if ((e.key === 's' || e.key === 'S') && !gameOver && !gameWon) {
            if (!gameStarted) {
                gameStarted = true;
                birdVelocity = jumpStrength;
            } else if (waitingForNextLevel) {
                waitingForNextLevel = false;
                score = 0; 
                pipes = []; 
                birdY = canvas.height / 2; 
                birdVelocity = 0;
                levelTitleTimer = 120; 
            }
        }

        if (e.key === 'r' || e.key === 'R') {
            level = 1; score = 0; gameOver = false; gameStarted = false;
            waitingForNextLevel = false; gameWon = false; birdY = canvas.height / 2;
            birdVelocity = 0; pipes = []; pipeTimer = 0;
        }

        if (e.code === 'Space' && gameStarted && !gameOver && !waitingForNextLevel && !gameWon) {
            birdVelocity = jumpStrength;
        }
    });

    function drawPipe(x, y, height, isTop) {
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + pipeWidth - 10, y);
        ctx.quadraticCurveTo(x + pipeWidth, y, x + pipeWidth, y + 10);
        ctx.lineTo(x + pipeWidth, y + height - 10);
        ctx.quadraticCurveTo(x + pipeWidth, y + height, x + pipeWidth - 10, y + height);
        ctx.lineTo(x + 10, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - 10);
        ctx.lineTo(x, y + 10);
        ctx.quadraticCurveTo(x, y, x + 10, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#388E3C';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (isTop) {
            ctx.moveTo(x - (pipeEndWidth - pipeWidth) / 2, y + height);
            ctx.lineTo(x + pipeWidth + (pipeEndWidth - pipeWidth) / 2, y + height);
            ctx.lineTo(x + pipeWidth + (pipeEndWidth - pipeWidth) / 2, y + height + pipeEndHeight);
            ctx.lineTo(x - (pipeEndWidth - pipeWidth) / 2, y + height + pipeEndHeight);
            ctx.closePath();
        } else {
            ctx.moveTo(x - (pipeEndWidth - pipeWidth) / 2, y);
            ctx.lineTo(x + pipeWidth + (pipeEndWidth - pipeWidth) / 2, y);
            ctx.lineTo(x + pipeWidth + (pipeEndWidth - pipeWidth) / 2, y - pipeEndHeight);
            ctx.lineTo(x - (pipeEndWidth - pipeWidth) / 2, y - pipeEndHeight);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 

        const currentBg = bgImages[level - 1]; 
        if (gameStarted && !gameOver && !gameWon && !waitingForNextLevel) {
            bgX -= bgSpeed;
        }
        if (bgX <= -canvas.width) bgX = 0;
        ctx.drawImage(currentBg, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(currentBg, bgX + canvas.width, 0, canvas.width, canvas.height);

        if (gameStarted && !gameOver && !gameWon && !waitingForNextLevel) {
            // --- NEUE GESCHWINDIGKEIT: Wird mit jedem Level kleiner ---
            // Level 1: 4 | Level 2: 3.4 | Level 3: 2.8 | Level 4: 2.2
            const currentSpeed = basePipeSpeed - (level - 1) * 0.6; 

            pipeTimer++;
            if (pipeTimer >= pipeInterval) {
                pipeTimer = 0;
                const gapY = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
                pipes.push({ x: canvas.width, gapY: gapY, passed: false });
            }

            for (let i = 0; i < pipes.length; i++) {
                pipes[i].x -= currentSpeed;

                const tolerance = 6; 
                let hitboxX = pipes[i].x - (pipeEndWidth - pipeWidth) / 2;
                let topPipeBottomY = pipes[i].gapY + pipeEndHeight; 
                let bottomPipeTopY = pipes[i].gapY + pipeGap - pipeEndHeight;

                if (birdX + birdRadius - tolerance > hitboxX && birdX - birdRadius + tolerance < hitboxX + pipeEndWidth) {
                    if (birdY - birdRadius + tolerance < topPipeBottomY || birdY + birdRadius - tolerance > bottomPipeTopY) {
                        gameOver = true;
                    }
                }

                if (!pipes[i].passed && pipes[i].x + pipeEndWidth < birdX - birdRadius) {
                    pipes[i].passed = true;
                    score++;
                    if (score >= levelGoals[level - 1]) {
                        if (level < 4) { level++; waitingForNextLevel = true; } 
                        else { gameWon = true; }
                    }
                }
            }
            pipes = pipes.filter(pipe => pipe.x + pipeWidth > -100);

            birdVelocity += gravity;
            birdY += birdVelocity;
            if (birdY + birdRadius >= canvas.height || birdY - birdRadius <= 0) gameOver = true;
        }

        for (let i = 0; i < pipes.length; i++) {
            drawPipe(pipes[i].x, 0, pipes[i].gapY, true);
            drawPipe(pipes[i].x, pipes[i].gapY + pipeGap, canvas.height - pipes[i].gapY - pipeGap, false);
        }

        ctx.drawImage(birdImg, birdX - birdRadius, birdY - birdRadius, birdRadius * 2, birdRadius * 2);

        // Texte anzeigen (Alles Goldgelb, außer Game Over)
        if (gameWon) {
            drawText('BRAVOOOOO!', '#ffd700', 80, -50);
            drawText('Alle Levels geschafft!', '#ffd700', 40, 30);
            drawText('Drücke "R" für Neustart', '#ffd700', 30, 100);
        } else if (gameOver) {
            drawText('GAME OVER', '#FF0000', 80, -20); 
            drawText('Drücke "R" zum Neustarten', '#ffd700', 30, 50);
        } else if (waitingForNextLevel) {
            drawText(`Level ${level-1} geschafft!`, '#ffd700', 60, -20);
            drawText('Drücke "S" für nächstes Level', '#ffd700', 30, 50);
        } else if (!gameStarted) {
            drawText('Drücke "S" zum Starten', '#ffd700', 40, 100);
            drawText('Leertaste zum Springen', '#ffd700', 25, 150);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 30px Arial Black';
            ctx.textAlign = 'left';
            ctx.strokeText(`Level: ${level} | Röhren: ${score}/${levelGoals[level-1]}`, 20, 50);
            ctx.fillText(`Level: ${level} | Röhren: ${score}/${levelGoals[level-1]}`, 20, 50);

            if (levelTitleTimer > 0) {
                ctx.globalAlpha = levelTitleTimer / 120;
                drawText(`LEVEL ${level}`, '#ffd700', 100, 0);
                ctx.globalAlpha = 1.0;
                levelTitleTimer--;
            }
        }
        requestAnimationFrame(gameLoop);
    }

    function drawText(text, color, size, offset = 0) {
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px Arial Black`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + offset);
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + offset);
    }
};