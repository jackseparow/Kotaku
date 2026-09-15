const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. Muat Gambar Latar Belakang Peta (background.jpg)
const mapImage = new Image();
mapImage.src = 'background.jpg';

// 2. Muat Gambar Maskot Si Yo (siyo.png) sebagai Ikon Karakter
const siyoImage = new Image();
siyoImage.src = 'siyo.png';

let imagesLoaded = 0;
function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        drawMap();
    }
}

mapImage.onload = checkImagesLoaded;
siyoImage.onload = checkImagesLoaded;

// Posisi Awal Karakter (Rumahku - Kanan Bawah)
// Angle: 270 = Menghadap ke Atas / Utara
const initialPos = { x: 790, y: 390, angle: 270 };
let player = { ...initialPos };

let commandQueue = [];
let isExecuting = false;

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar Peta Background
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Gambar Karakter (Si Yo) di atas Canvas
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate((player.angle * Math.PI) / 180);

    const size = 38; // Ukuran sprite karakter Si Yo di peta
    ctx.drawImage(siyoImage, -size / 2, -size / 2, size, size);

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
        queueBox.innerHTML = '<span class="placeholder-text">Pilih kartu instruksi di bawah untuk merencanakan perjalananmu...</span>';
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
        const duration = 600; // Durasi animasi per langkah (milidetik)
        const stepDistance = 50; // Jarak perpindahan piksel

        const startX = player.x;
        const startY = player.y;
        const startAngle = player.angle;

        let targetX = startX;
        let targetY = startY;
        let targetAngle = startAngle;

        const rad = (player.angle * Math.PI) / 180;

        // Perhitungan arah berdasarkan sudut orientasi karakter
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
            targetAngle = startAngle + 45; // Mendukung belok diagonal ke Hutan Kota / Bioskop
        } else if (cmd === 'BELOK_KIRI_45') {
            targetAngle = startAngle - 45;
        }

        // Pembatasan area agar karakter tidak keluar canvas
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
                player.angle = targetAngle % 360;
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}
