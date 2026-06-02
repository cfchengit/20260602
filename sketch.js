let stars = [];
const palette = ['#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 利用 JS 直接清除網頁的邊距與隱藏滾動條，確保真正的全螢幕
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  
  // 一開始先產生 20 個星星物件
  for (let i = 0; i < 20; i++) {
    stars.push(new Star());
  }
  
  // 每隔 3 秒鐘 (3000 毫秒) 產生一個新的星星物件
  setInterval(() => {
    stars.push(new Star());
  }, 3000);
}

function draw() {
  // 繪製半透明黑色背景，產生淡淡的拖影效果
  push();
  fill(0, 40);
  noStroke();
  rect(0, 0, width, height);
  pop();

  // 處理所有星星之間的互相碰撞
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      stars[i].collide(stars[j]);
    }
  }

  for (let star of stars) {
    star.update();
    star.display();
  }
}

// 確保視窗縮放時遊戲畫面也能跟著全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 星星粒子 Class
class Star {
  constructor() {
    // 亂數決定星星的大小
    this.r = random(20, 45); 
    
    // 亂數決定初始位置 (確保不會一開始就超出螢幕)
    this.x = random(this.r * 2, width - this.r * 2);
    this.y = random(this.r * 2, height - this.r * 2);
    
    // 亂數決定移動速度
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    
    // 亂數分配顏色
    this.color = random(palette);
    
    this.isScared = false;
  }
  
  collide(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = dist(this.x, this.y, other.x, other.y);
    
    // 使用兩者的半徑和作為碰撞距離閾值
    let minDist = this.r + other.r; 

    if (distance < minDist && distance > 0) {
      // 1. 修正重疊 (Overlap resolution)，避免兩顆星星互相卡住黏在一起
      let overlap = minDist - distance;
      let angle = atan2(dy, dx);
      let moveX = cos(angle) * overlap / 2;
      let moveY = sin(angle) * overlap / 2;
      
      this.x -= moveX;
      this.y -= moveY;
      other.x += moveX;
      other.y += moveY;

      // 2. 計算彈性碰撞 (Elastic collision) 改變速度向量
      let nx = dx / distance;
      let ny = dy / distance;
      let dvx = this.vx - other.vx;
      let dvy = this.vy - other.vy;
      let normalVelocity = dvx * nx + dvy * ny;
      
      if (normalVelocity > 0) return; // 如果已經在互相遠離則不處理
      
      // 假設質量與半徑的平方 (即面積) 成正比
      let m1 = this.r * this.r;
      let m2 = other.r * other.r;
      
      // 設定彈性係數為 0.9，讓碰撞後帶有一點點能量耗損 (才不會越撞越失控)
      let restitution = 0.9;
      let impulse = -(1 + restitution) * normalVelocity / (1 / m1 + 1 / m2);
      
      this.vx += (impulse * nx) / m1;
      this.vy += (impulse * ny) / m1;
      other.vx -= (impulse * nx) / m2;
      other.vy -= (impulse * ny) / m2;
    }
  }

  update() {
    // 計算星星與滑鼠之間的距離
    let d = dist(this.x, this.y, mouseX, mouseY);
    
    // 設定驚嚇距離閾值
    let interactionDist = 120 + this.r;
    this.isScared = (d < interactionDist);

    if (this.isScared) {
      // 當被嚇到時：計算滑鼠到星星的反向角度，並給予逃離的加速度
      let angleToMouse = atan2(this.y - mouseY, this.x - mouseX);
      this.vx += cos(angleToMouse) * 1.5;
      this.vy += sin(angleToMouse) * 1.5;
    }

    // 控制移動速度 (計算當前的向量長度)
    let speed = dist(0, 0, this.vx, this.vy);
    let maxSpeed = this.isScared ? 12 : 3;

    // 如果超過最高速，或是逃離後要減速，利用摩擦力漸漸緩下來
    if (speed > maxSpeed) {
      this.vx *= 0.92;
      this.vy *= 0.92;
    } else if (!this.isScared && speed < 1) {
      // 如果沒有被嚇到且速度太慢，給予微微的亂數動力讓它繼續漂浮
      this.vx += random(-0.2, 0.2);
      this.vy += random(-0.2, 0.2);
    }

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

    // 碰到邊緣時反彈
    let boundary = this.r * 1.5;
    if (this.x < boundary || this.x > width - boundary) this.vx *= -1;
    if (this.y < boundary || this.y > height - boundary) this.vy *= -1;
    
    // 把座標限制在畫面內，防止它跑出視窗卡住
    this.x = constrain(this.x, boundary, width - boundary);
    this.y = constrain(this.y, boundary, height - boundary);
  }

  display() {
    push();
    translate(this.x, this.y);

    // 繪製圓角星星的技巧：使用粗邊框且設定 ROUND
    fill(this.color);
    stroke(this.color);
    strokeWeight(this.r * 0.4); 
    strokeJoin(ROUND);
    
    beginShape();
    let points = 5;
    let angle = TWO_PI / points;
    let halfAngle = angle / 2.0;
    let outerRadius = this.r;
    let innerRadius = this.r * 0.5;
    
    // 畫星星的頂點
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cos(a - HALF_PI) * outerRadius;
      let sy = sin(a - HALF_PI) * outerRadius;
      vertex(sx, sy);
      sx = cos(a + halfAngle - HALF_PI) * innerRadius;
      sy = sin(a + halfAngle - HALF_PI) * innerRadius;
      vertex(sx, sy);
    }
    endShape(CLOSE);

    // 以下開始繪製表情 (無需邊框)
    noStroke();
    
    // 計算眼睛相關數值
    let eyeOffsetX = this.r * 0.35;
    let eyeOffsetY = -this.r * 0.15;
    
    // 依據是否驚嚇調整眼睛與眼球尺寸
    let eyeSize = this.isScared ? this.r * 0.55 : this.r * 0.35;
    let pupilSize = this.isScared ? eyeSize * 0.5 : eyeSize * 0.45;

    // 畫眼白
    fill(255);
    ellipse(-eyeOffsetX, eyeOffsetY, eyeSize, eyeSize); // 左眼
    ellipse(eyeOffsetX, eyeOffsetY, eyeSize, eyeSize);  // 右眼

    // 讓眼球轉動追蹤滑鼠
    // 分別計算左右眼對滑鼠的絕對角度
    let angleL = atan2(mouseY - (this.y + eyeOffsetY), mouseX - (this.x - eyeOffsetX));
    let angleR = atan2(mouseY - (this.y + eyeOffsetY), mouseX - (this.x + eyeOffsetX));
    
    // 計算眼球最多可以在眼白內移動的距離半徑
    let maxPupilDist = (eyeSize - pupilSize) / 2;
    
    let pupilLX = -eyeOffsetX + cos(angleL) * maxPupilDist;
    let pupilLY = eyeOffsetY + sin(angleL) * maxPupilDist;
    
    let pupilRX = eyeOffsetX + cos(angleR) * maxPupilDist;
    let pupilRY = eyeOffsetY + sin(angleR) * maxPupilDist;

    // 畫黑眼球
    fill(0);
    ellipse(pupilLX, pupilLY, pupilSize, pupilSize);
    ellipse(pupilRX, pupilRY, pupilSize, pupilSize);

    // 畫嘴巴
    if (this.isScared) {
      // 驚嚇時：O 型嘴
      fill(0);
      ellipse(0, this.r * 0.35, this.r * 0.4, this.r * 0.5);
    } else {
      // 正常時：圓弧笑臉
      noFill();
      stroke(0);
      strokeWeight(this.r * 0.08);
      strokeCap(ROUND);
      // 畫一個開口向上的半圓弧線
      arc(0, this.r * 0.25, this.r * 0.5, this.r * 0.4, 0, PI);
    }

    pop();
  }
}
