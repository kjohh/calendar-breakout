// 遊戲變數
let canvas, ctx;
let gameRunning = false;
let animationId;

// 遊戲狀態
let score = 0;
let destroyedMeetings = 0;
let freeHours = 0;
let gameWon = false;
let gameOver = false;
let gameStartTime = 0;
let lastSpeedIncrease = 0;
let destroyedMeetingsList = [];

// 遊戲物件
let ball = {};
let paddle = {};
let meetings = [];

// 控制相關
let keys = {};
let mouseX = 0;
let touchX = 0;

// DOM 元素
let paddleElement;

// 響應式設計
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

// 會議名稱
const meetingNames = [
    "沒有人想聽的公司大會",
    "假裝關心我的1 on 1", 
    "無意義的腦力激盪會議",
    "又是一個status update",
    "老闆的自我膨脹時間",
    "30分鐘講5分鐘內容",
    "只為了show face的會議",
    "昨天email就能解決的事",
    "沒有agenda的神秘會議",
    "HR的假裝關懷時光",
    "預算削減但要做更多事",
    "跨部門甩鍋大會",
    "聽不懂但要點頭的技術會議",
    "又要加班的專案檢討",
    "老闆兒子的想法分享",
    "為了開會而開會的會議",
    "客戶的無理要求討論",
    "Team Building強迫歡樂",
    "績效評估恐嚇大會",
    "新系統又當機檢討會"
];

// 初始化
function init() {
    // 設定Canvas (隱藏用於碰撞檢測)
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 獲取控制板元素
    paddleElement = document.getElementById('gamePaddle');
    
    // 設定初始頁面狀態
    document.body.classList.add('homepage');
    
    // 設定Canvas大小
    setupCanvas();
    
    // 事件監聽
    setupEventListeners();
    
    // 開始按鈕事件
    document.getElementById('startBtn').addEventListener('click', startGame);
}

// 設定Canvas大小
function setupCanvas() {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
    
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '5';
    canvas.style.pointerEvents = 'none';
}

// 設定事件監聽
function setupEventListeners() {
    // 鍵盤事件
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // 滑鼠事件 - 監聽整個文檔
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
    });
    
    // 觸控事件 - 只在遊戲進行時處理
    document.addEventListener('touchmove', (e) => {
        if (gameRunning) {
            e.preventDefault();
            touchX = e.touches[0].clientX;
        }
    }, { passive: false });
    
    document.addEventListener('touchstart', (e) => {
        if (gameRunning) {
            e.preventDefault();
            touchX = e.touches[0].clientX;
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (gameRunning) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 視窗大小調整
    window.addEventListener('resize', () => {
        if (gameRunning) {
            setupCanvas();
            initGameObjects();
        }
    });
}

// 開始遊戲
function startGame() {
    // 切換畫面
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('gameArea').classList.add('active');
    document.body.classList.remove('homepage');
    document.body.classList.add('game-active');
    
    // 重設遊戲狀態
    gameRunning = true;
    gameWon = false;
    gameOver = false;
    score = 0;
    destroyedMeetings = 0;
    freeHours = 0;
    destroyedMeetingsList = [];
    gameStartTime = Date.now();
    lastSpeedIncrease = 0;
    
    // 重設Canvas大小
    setupCanvas();
    
    // 初始化遊戲物件
    initGameObjects();
    generateMeetings();
    
    // 開始遊戲迴圈
    gameLoop();
}

// 初始化遊戲物件
function initGameObjects() {
    // 球 - 根據裝置設定不同速度
    const isMobile = window.innerWidth <= 768;
    const ballSpeed = isMobile ? 7 : 10;
    
    ball = {
        x: gameWidth / 2,
        y: gameHeight - 200,
        dx: ballSpeed,
        dy: -ballSpeed,
        radius: 10,
        color: '#ff6b6b'
    };
    
    // 控制板
    paddle = {
        x: gameWidth / 2 - 104.5, // 209/2 = 104.5
        y: gameHeight - 124, // 根據CSS位置
        width: 209,
        height: 24,
        color: '#4ecdc4'
    };
}

// 生成會議
function generateMeetings() {
    meetings = [];
    const isMobile = window.innerWidth <= 768;
    
    // 創建所有可能的時間段位置，手機版避免底部區域
    const timeSlots = [];
    const maxHours = isMobile ? 7 : 9; // 手機版減少時段避免與控制板重疊
    
    for (let day = 0; day < 5; day++) {
        for (let hour = 0; hour < maxHours; hour++) {
            timeSlots.push({ day, hour });
        }
    }
    
    // 隨機打亂時間段
    for (let i = timeSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [timeSlots[i], timeSlots[j]] = [timeSlots[j], timeSlots[i]];
    }
    
    // 根據裝置調整會議數量
    const minMeetings = isMobile ? 12 : 15;
    const maxMeetings = isMobile ? 18 : 25;
    const totalMeetings = Math.floor(Math.random() * (maxMeetings - minMeetings + 1)) + minMeetings;
    const selectedSlots = timeSlots.slice(0, totalMeetings);
    
    // 清空所有日期容器
    for (let day = 0; day < 5; day++) {
        const dayContainer = document.getElementById(`day-${day}-meetings`);
        dayContainer.innerHTML = '';
        dayContainer.style.position = 'relative';
    }
    
    // 創建會議
    selectedSlots.forEach((slot, index) => {
        const dayContainer = document.getElementById(`day-${slot.day}-meetings`);
        
        const meetingElement = document.createElement('div');
        meetingElement.className = 'meeting-card';
        meetingElement.style.position = 'relative';
        meetingElement.style.transform = 'none';
        
        // 隨機選擇顏色
        const colorClass = Math.random() < 0.3 ? 'purple' : Math.random() < 0.6 ? 'yellow' : '';
        if (colorClass) {
            meetingElement.classList.add(colorClass);
        }
        
        // 隨機隱藏一些會議 (透明效果)
        const isHidden = Math.random() < 0.15;
        if (isHidden) {
            meetingElement.classList.add('hidden');
        }
        
        const meetingName = meetingNames[Math.floor(Math.random() * meetingNames.length)];
        const startHour = 8 + slot.hour;
        const duration = Math.floor(Math.random() * 2) + 1; // 1-2小時
        const endHour = startHour + duration;
        
        meetingElement.innerHTML = `
            <div class="meeting-title">${meetingName}</div>
            <div class="meeting-duration">${duration} hr</div>
            <div class="meeting-time">${startHour}:00-${endHour}:00</div>
        `;
        
        // 存儲會議資料
        const meetingData = {
            element: meetingElement,
            day: slot.day,
            name: meetingName,
            duration: duration,
            destroyed: false,
            hidden: isHidden,
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        
        meetings.push(meetingData);
        dayContainer.appendChild(meetingElement);
        
        // 添加點擊事件用於測試
        meetingElement.addEventListener('click', () => {
            destroyMeeting(meetingData);
        });
    });
    
    // 計算會議元素的位置和大小（用於碰撞檢測）
    setTimeout(() => {
        updateMeetingPositions();
    }, 100);
}

// 更新會議位置
function updateMeetingPositions() {
    meetings.forEach(meeting => {
        if (meeting.element && !meeting.destroyed) {
            const rect = meeting.element.getBoundingClientRect();
            meeting.x = rect.left;
            meeting.y = rect.top;
            meeting.width = rect.width;
            meeting.height = rect.height;
        }
    });
}

// 摧毀會議
function destroyMeeting(meeting) {
    if (!meeting.destroyed) {
        meeting.destroyed = true;
        
        // 記錄被摧毀的會議
        destroyedMeetingsList.push(meeting.name);
        
        // 添加破裂效果
        meeting.element.classList.add('break-particles');
        meeting.element.classList.add('destroyed');
        
        destroyedMeetings++;
        freeHours += meeting.duration;
        score += meeting.duration * 100;
        
        // 延遲移除元素
        setTimeout(() => {
            if (meeting.element.parentNode) {
                meeting.element.remove();
            }
        }, 600);
    }
}

// 隨機顏色
function getRandomColor() {
    const colors = ['#2d3436', '#636e72', '#74b9ff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 遊戲主迴圈
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// 更新遊戲
function update() {
    // 移除球速加速機制
    
    // 更新控制板
    updatePaddle();
    
    // 更新球
    updateBall();
    
    // 更新會議位置
    updateMeetingPositions();
    
    // 檢查碰撞
    checkCollisions();
    
    // 檢查遊戲結束
    checkGameEnd();
    
}

// 更新控制板
function updatePaddle() {
    // 鍵盤控制
    if (keys['ArrowLeft']) {
        paddle.x -= 8;
    }
    if (keys['ArrowRight']) {
        paddle.x += 8;
    }
    
    // 滑鼠控制
    if (mouseX > 0) {
        paddle.x = mouseX - paddle.width / 2;
    }
    
    // 觸控控制
    if (touchX > 0) {
        paddle.x = touchX - paddle.width / 2;
    }
    
    // 限制邊界
    paddle.x = Math.max(0, Math.min(paddle.x, gameWidth - paddle.width));
    
    // 更新 DOM 元素位置
    if (paddleElement) {
        paddleElement.style.left = `${paddle.x + paddle.width / 2}px`;
    }
}

// 更新球
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 牆壁碰撞
    if (ball.x <= ball.radius || ball.x >= gameWidth - ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y <= ball.radius) {
        ball.dy = -ball.dy;
    }
    
    // 球掉落 - 一擊死亡
    if (ball.y >= gameHeight + ball.radius) {
        gameOver = true;
        gameRunning = false;
        showGameOverModal(false);
    }
}

// 重置球
function resetBall() {
    const isMobile = window.innerWidth <= 768;
    const ballSpeed = isMobile ? 7 : 10;
    
    ball.x = gameWidth / 2;
    ball.y = gameHeight - 200;
    ball.dx = Math.random() > 0.5 ? ballSpeed : -ballSpeed;
    ball.dy = -ballSpeed;
}

// 檢查碰撞
function checkCollisions() {
    // 控制板碰撞
    if (ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width) {
        
        // 保持球的速度大小
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        
        ball.dy = -Math.abs(ball.dy);
        
        // 根據碰撞位置調整角度，但保持速度
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const newDx = (hitPos - 0.5) * currentSpeed * 0.8;
        const newDy = -Math.sqrt(currentSpeed * currentSpeed - newDx * newDx);
        
        ball.dx = newDx;
        ball.dy = newDy;
    }
    
    // 會議碰撞
    for (let meeting of meetings) {
        if (meeting.destroyed || meeting.hidden) continue;
        
        if (ball.x + ball.radius >= meeting.x &&
            ball.x - ball.radius <= meeting.x + meeting.width &&
            ball.y + ball.radius >= meeting.y &&
            ball.y - ball.radius <= meeting.y + meeting.height) {
            
            destroyMeeting(meeting);
            ball.dy = -ball.dy;
            
            break;
        }
    }
}

// 創建粒子效果
function createParticles(brick) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height / 2,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            color: brick.color,
            life: 20,
            maxLife: 20
        });
    }
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 檢查遊戲結束
function checkGameEnd() {
    // 檢查勝利
    const activeMeetings = meetings.filter(meeting => !meeting.destroyed && !meeting.hidden);
    if (activeMeetings.length === 0) {
        gameWon = true;
        gameRunning = false;
        showGameOverModal(true);
        return;
    }
    
    // 檢查失敗（已在球掉落時處理）
}



// 返回首頁
function showHomePage(buttonText) {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    document.getElementById('gameArea').classList.remove('active');
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('startBtn').textContent = buttonText;
    document.body.classList.remove('game-active');
    document.body.classList.add('homepage');
    document.getElementById('gameStatus').textContent = '';
}

// 繪製遊戲
function draw() {
    // 清除畫面 - 完全透明
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    
    // 繪製球
    drawBall();
}

// 繪製背景
function drawBackground() {
    const isMobile = window.innerWidth <= 768;
    const numDays = isMobile ? 3 : 7;
    const timeColumnWidth = 60;
    const availableWidth = gameWidth - timeColumnWidth;
    const dayWidth = availableWidth / numDays;
    const daysOfWeek = isMobile ? 
        ['MON', 'TUE', 'WED'] : 
        ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // 時間刻度 - 適中字體
    const timeFont = isMobile ? '14px Arial' : '16px Arial';
    ctx.font = timeFont;
    ctx.textAlign = 'right';
    for (let hour = 9; hour <= 17; hour++) {
        const y = ((hour - 9) / 8) * (gameHeight * 0.6) + 35;
        ctx.fillText(`${hour}:00`, timeColumnWidth - 5, y);
    }
    
    // 日期欄位 - 適中字體
    const dayFont = isMobile ? '16px Arial' : '18px Arial';
    ctx.font = dayFont;
    ctx.textAlign = 'center';
    for (let i = 0; i < numDays; i++) {
        const x = timeColumnWidth + i * dayWidth;
        ctx.strokeRect(x, 0, dayWidth, gameHeight * 0.6);
        ctx.fillText(daysOfWeek[i], x + dayWidth / 2, 22);
    }
}

// 繪製磚塊
function drawBricks() {
    const isMobile = window.innerWidth <= 768;
    ctx.textAlign = 'center';
    
    for (let brick of bricks) {
        if (!brick.visible) continue;
        
        // 繪製磚塊
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // 邊框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // 時間 - 適中字體
        ctx.fillStyle = 'white';
        const timeFont = isMobile ? '11px Arial' : '13px Arial';
        ctx.font = timeFont;
        ctx.fillText(brick.time, brick.x + brick.width / 2, brick.y + 15);
        
        // 會議名稱 - 調整字體大小避免重疊
        const meetingFont = isMobile ? '12px Arial' : '14px Arial';
        ctx.font = meetingFont;
        
        // 按單詞分割而非字符
        const words = brick.meeting.split('');
        let line = '';
        let lines = [];
        const maxWidth = brick.width - 20;
        
        for (let char of words) {
            const testLine = line + char;
            if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                lines.push(line);
                line = char;
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        // 限制最多3行，避免重疊
        if (lines.length > 3) {
            lines = lines.slice(0, 2);
            lines.push('...');
        }
        
        const lineHeight = 14;
        const startY = brick.y + brick.height / 2 - (lines.length - 1) * lineHeight / 2 + 5;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, brick.x + brick.width / 2, startY + index * lineHeight);
        });
    }
}

// 繪製球
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// 繪製控制板
function drawPaddle() {
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, paddle.color);
    gradient.addColorStop(1, '#2c9a92');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// 繪製粒子
function drawParticles() {
    for (let particle of particles) {
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        ctx.restore();
    }
}

// 顯示遊戲結束 Modal
function showGameOverModal(isWin) {
    const overlay = document.getElementById('gameOverOverlay');
    const title = document.getElementById('gameOverTitle');
    const finalFreeHours = document.getElementById('finalFreeHours');
    const finalDestroyedMeetings = document.getElementById('finalDestroyedMeetings');
    const finalGameTime = document.getElementById('finalGameTime');
    const destroyedMeetingsListEl = document.getElementById('destroyedMeetingsList');
    const humorousSummary = document.getElementById('humorousSummary');
    
    // 計算遊戲時間
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // 設置標題和樣式
    if (isWin) {
        title.textContent = '恭喜勝利！';
        title.className = 'game-over-title win';
    } else {
        title.textContent = '遊戲結束';
        title.className = 'game-over-title lose';
    }
    
    // 更新統計
    finalFreeHours.textContent = `${freeHours} 小時`;
    finalDestroyedMeetings.textContent = destroyedMeetings;
    finalGameTime.textContent = `${gameTime} 秒`;
    
    // 顯示被摧毀的會議列表
    if (destroyedMeetingsList.length > 0) {
        destroyedMeetingsListEl.innerHTML = destroyedMeetingsList.map(meeting => 
            `<div class="meeting-item">• ${meeting}</div>`
        ).join('');
        
        // 生成幽默總結
        const summaries = [
            `恭喜你成功逃脫了 ${destroyedMeetings} 個毫無意義的會議！你的生命重獲自由！`,
            `太棒了！你剛剪掉了 ${freeHours} 小時的廢話時間，可以去做更有意義的事了！`,
            `你是會議終結者！${destroyedMeetings} 個煩人的會議被你完美粉碎！`,
            `哇！你拯救了自己 ${freeHours} 小時的寶貴時間，現在可以去追求夢想了！`,
            `你就是職場英雄！成功摧毀了 ${destroyedMeetings} 個浪費時間的會議！`,
            `太神了！你用 ${gameTime} 秒的時間，換回了 ${freeHours} 小時的自由！這筆交易太划算了！`
        ];
        humorousSummary.textContent = summaries[Math.floor(Math.random() * summaries.length)];
    } else {
        destroyedMeetingsListEl.innerHTML = '<div class="meeting-item">還沒有擊破任何會議...</div>';
        humorousSummary.textContent = '下次加油！讓我們一起解放更多被會議綁架的時間！';
    }
    
    // 顯示 Modal
    overlay.classList.add('show');
}

// 隱藏遊戲結束 Modal
function hideGameOverModal() {
    const overlay = document.getElementById('gameOverOverlay');
    overlay.classList.remove('show');
}

// 分享功能
function shareGame(platform) {
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const shareText = `我在 Calendar Breaker 遊戲中擊破了 ${destroyedMeetings} 個會議，重獲 ${freeHours} 小時自由時間！你也來試試吧！`;
    const shareUrl = window.location.href;
    
    switch (platform) {
        case 'line':
            window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
            break;
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            break;
        case 'copy':
            if (navigator.clipboard) {
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                    alert('連結已複製到剪貼板！');
                });
            } else {
                // 備用方法
                const textArea = document.createElement('textarea');
                textArea.value = `${shareText} ${shareUrl}`;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('連結已複製到剪貼板！');
            }
            break;
    }
    
    hideShareSheet();
}

// 顯示分享面板
function showShareSheet() {
    const shareSheet = document.getElementById('shareSheet');
    shareSheet.classList.add('show');
}

// 隱藏分享面板
function hideShareSheet() {
    const shareSheet = document.getElementById('shareSheet');
    shareSheet.classList.remove('show');
}

// 設置事件監聽器
function setupGameOverEvents() {
    // 再玩一次
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        hideGameOverModal();
        startGame();
    });
    
    // 回到首頁
    document.getElementById('goHomeBtn').addEventListener('click', () => {
        hideGameOverModal();
        showHomePage('Start Game');
    });
    
    // 分享按鈕
    document.getElementById('shareBtn').addEventListener('click', () => {
        showShareSheet();
    });
    
    // 分享選項
    document.querySelectorAll('.share-option').forEach(option => {
        option.addEventListener('click', () => {
            const platform = option.dataset.platform;
            shareGame(platform);
        });
    });
    
    // 關閉分享面板
    document.getElementById('shareSheetClose').addEventListener('click', () => {
        hideShareSheet();
    });
    
    // 移除點擊背景關閉 Modal 功能
}

// 頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupGameOverEvents();
}); 