const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Gambar Peta Latar Belakang
const mapImage = new Image();
mapImage.src = 'map.jpg';

// Posisi Awal Karakter (Rumahku - Kanan Bawah)
// Angle: 270 = Menghadap Ke Atas / Utara
const initialPos = { x: 790, y: 390, angle: 270 };
let player = { ...initialPos };

let commandQueue = [];
let isExecuting = false;

mapImage.onload = () => {
    drawMap();
};

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Gambar Peta Kota
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // 2. Gambar Karakter (Avatar Panah Penunjuk Arah)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate((player.angle * Math.PI) / 180);

    // Lingkaran Luar Karakter
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();

    // Panah Merah Penunjuk Orientasi Sudut
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 9);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function tambahPerintah(jenis) {
    if (isExecuting) return;
    commandQueue.push(jenis);
    renderQueueUI();
}

function renderQueueUI() {
    const queueBox = document.getElementById('commandQueue');
    queueBox.innerHTML = '';

    if (commandQueue.length === 0) {
        queueBox.innerHTML = '<span class="placeholder-text">Pilih kartu instruksi di bawah...</span>';
        return;
    }

    commandQueue.forEach((cmd) => {
        const item = document.createElement('div');
        item.className = 'card-item';
        let label = cmd;
        if (cmd === 'MAJU') label = '⬆️ Maju';
        if (cmd === 'MUNDUR') label = '⬇️ Mundur';
        if (cmd === 'BELOK_KANAN_90') label = '↪️ Kanan 90°';
        if (cmd === 'BELOK_KIRI_90') label = '↩️ Kiri 90°';
        if (cmd === 'BELOK_KANAN_45') label = '↗️ Kanan 45°';
        if (cmd === 'BELOK_KIRI_45') label = '↖️ Kiri 45°';
        item.innerText = label;
        queueBox.appendChild(item);
    });
}

function resetRute() {
    if (isExecuting) return;
    commandQueue = [];
    player = { ...initialPos };
    renderQueueUI();
    drawMap();
}

async function jalankanAlur() {
    if (isExecuting || commandQueue.length === 0) return;
    isExecuting = true;

    for (let i = 0; i < commandQueue.length; i++) {
        await eksekusiLangkah(commandQueue[i]);
    }

    isExecuting = false;
}

function eksekusiLangkah(cmd) {
    return new Promise((resolve) => {
        const duration = 600; // Jeda animasi 0.6 detik
        const stepDistance = 50; // Jarak per langkah (piksel)

        const startX = player.x;
        const startY = player.y;
        const startAngle = player.angle;

        let targetX = startX;
        let targetY = startY;
        let targetAngle = startAngle;

        const rad = (player.angle * Math.PI) / 180;

        // Hitung Pergerakan atau Rotasi berdasarkan perintah
        if (cmd === 'MAJU') {
            targetX = startX + Math.cos(rad) * stepDistance;
            targetY = startY + Math.sin(rad) * stepDistance;
        } else if (cmd === 'MUNDUR') {
            targetX = startX - Math.cos(rad) * stepDistance;
            targetY = startY - Math.sin(rad) * stepDistance;
        } else if (cmd === 'BELOK_KANAN_90') {
            targetAngle = startAngle + 90;
        } else if (cmd === 'BELOK_KIRI_90') {
            targetAngle = startAngle - 90;
        } else if (cmd === 'BELOK_KANAN_45') {
            targetAngle = startAngle + 45;
        } else if (cmd === 'BELOK_KIRI_45') {
            targetAngle = startAngle - 45;
        }

        // Batasi karakter agar tidak keluar dari tepi Canvas
        targetX = Math.min(Math.max(targetX, 20), canvas.width - 20);
        targetY = Math.min(Math.max(targetY, 20), canvas.height - 20);

        let startTime = null;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            player.x = startX + (targetX - startX) * progress;
            player.y = startY + (targetY - startY) * progress;
            player.angle = startAngle + (targetAngle - startAngle) * progress;

            drawMap();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                player.x = targetX;
                player.y = targetY;
                player.angle = targetAngle;
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}
