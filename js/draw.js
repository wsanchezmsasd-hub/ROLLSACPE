/* =====================================================================
   draw.js -- EVERYTHING YOU CAN SEE.
   Color palette is purple-themed. Different roles get different shades
   on purpose (terrain vs. enemies vs. warnings vs. your own projectiles
   vs. enemy projectiles) so things stay readable instead of turning into
   one undifferentiated purple blob. Invincibility stays cyan (#66eaff)
   deliberately -- it's the one non-purple color on screen, so it reads
   instantly as "something special is happening."
   ===================================================================== */
var Draw = { canvas: null, ctx: null, cameraX: 0, particles: [] };
Draw.dominoEasterEggImage = new Image();
Draw.dominoEasterEggImage.src = "https://pbs.twimg.com/profile_images/1907274219173404672/eIWDuAGg_400x400.jpg";

Draw.setup = function () { Draw.canvas = document.getElementById("game"); Draw.ctx = Draw.canvas.getContext("2d"); Draw.initParticles(); };
Draw.updateCamera = function () { Draw.cameraX = Player.x - CONFIG.CANVAS_W / 2; if (Draw.cameraX < 0) Draw.cameraX = 0; var furthest = Level.pixelWidth() - CONFIG.CANVAS_W; if (furthest < 0) furthest = 0; if (Draw.cameraX > furthest) Draw.cameraX = furthest; };

Draw.initParticles = function () {
  Draw.particles = [];
  for (var i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    Draw.particles.push({
      x: Math.random() * CONFIG.CANVAS_W,
      y: Math.random() * CONFIG.CANVAS_H,
      size: 1 + Math.random() * 2.5,
      speed: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: 0.12 + Math.random() * 0.3
    });
  }
};
Draw.updateParticles = function () {
  Draw.particles.forEach(function (particle) {
    particle.y -= particle.speed;
    particle.x += particle.drift;
    if (particle.y < -4) { particle.y = CONFIG.CANVAS_H + 4; particle.x = Math.random() * CONFIG.CANVAS_W; }
    if (particle.x < -4) particle.x = CONFIG.CANVAS_W + 4;
    if (particle.x > CONFIG.CANVAS_W + 4) particle.x = -4;
  });
};
Draw.drawParticles = function () {
  var ctx = Draw.ctx;
  ctx.save();
  Draw.particles.forEach(function (particle) {
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = "#c77dff";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

Draw.everything = function () {
  var ctx = Draw.ctx;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  Draw.updateParticles();
  Draw.drawParticles();
  ctx.save();
  ctx.translate(-Draw.cameraX, 0);
  Draw.world();
  Draw.dominoEffects();
  Draw.enemies();
  Draw.projectiles();
  Draw.player();
  ctx.restore();
  Draw.hud();
};

Draw.world = function () {
  var size = CONFIG.TILE, firstCol = Math.floor(Draw.cameraX / size) - 1, lastCol = firstCol + Math.ceil(CONFIG.CANVAS_W / size) + 2, ctx = Draw.ctx;
  var warning = Level.collapseWarning > 0, warningCols = warning ? Level.collapseColumns : null;
  for (var row = 0; row < CONFIG.ROWS; row++) for (var col = firstCol; col <= lastCol; col++) {
    var here = Level.charAt(col, row), x = col * size, y = row * size;
    var atRisk = warning && warningCols.indexOf(col) >= 0;
    if (here === "#") { if (atRisk) Draw.blockWarning(x, y, size); else Draw.block(x, y, size); }
    if (here === "^") { if (atRisk) Draw.spikeWarning(x, y, size); else Draw.spike(x, y, size); }
    if (here === "F") Draw.finish(x, y, size);
  }
  if (warning && warningCols.length) {
    var spanStart = Math.min.apply(null, warningCols) * size, spanEnd = (Math.max.apply(null, warningCols) + 1) * size;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(spanStart, 0); ctx.lineTo(spanStart, CONFIG.CANVAS_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(spanEnd, 0); ctx.lineTo(spanEnd, CONFIG.CANVAS_H); ctx.stroke();
    ctx.restore();
  }
  Level.redTesseracts.forEach(function (tesseract) { if (!tesseract.collected) Draw.tesseract(tesseract.x, tesseract.y, "#c724ff"); });
  if (Level.goldActive) Level.goldTesseracts.forEach(function (tesseract) { if (!tesseract.collected) Draw.tesseract(tesseract.x, tesseract.y, "#e0b3ff"); });
  Level.fakeTesseracts.forEach(function (tesseract) { Draw.fakeTesseract(tesseract.x, tesseract.y); });
};
Draw.dominoEffects = function () {
  var ctx = Draw.ctx;
  Enemy.enemies.forEach(function (e) {
    if (e.type !== "domino" || e.deadTimer > 0) return;
    if (e.leapState === "warning" || e.leapState === "airborne") {
      ctx.save();
      ctx.strokeStyle = "#ff2fd0";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(e.targetX, 0);
      ctx.lineTo(e.targetX, CONFIG.CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (e.shockwaveTimer > 0) {
      var progress = 1 - e.shockwaveTimer / CONFIG.DOMINO_SHOCKWAVE_LIFE;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = "#ff2fd0";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 12 + CONFIG.DOMINO_SHOCKWAVE_RADIUS * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
};
Draw.fakeTesseract = function (x, y) { var ctx = Draw.ctx; ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#6a0dad"; ctx.beginPath(); for (var i = 0; i < 5; i++) { var angle = -Math.PI / 2 + i * Math.PI * 2 / 5; if (i === 0) ctx.moveTo(Math.cos(angle) * 11, Math.sin(angle) * 11); else ctx.lineTo(Math.cos(angle) * 11, Math.sin(angle) * 11); } ctx.closePath(); ctx.fill(); ctx.restore(); };
Draw.tesseract = function (x, y, color) { var ctx = Draw.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = color; ctx.fillRect(-9, -9, 18, 18); ctx.fillStyle = "#1a0033"; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); };
Draw.block = function (x, y, size) { var ctx = Draw.ctx; ctx.fillStyle = "#9d3fff"; ctx.fillRect(x, y, size, size); ctx.strokeStyle = "#9d3fff"; ctx.lineWidth = CONFIG.LINE_WIDTH; ctx.strokeRect(x, y, size, size); };
Draw.blockWarning = function (x, y, size) { var ctx = Draw.ctx; ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, size, size); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = CONFIG.LINE_WIDTH; ctx.strokeRect(x, y, size, size); };
Draw.spike = function (x, y, size) { var ctx = Draw.ctx; ctx.fillStyle = "#9d3fff"; ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x + size / 2, y); ctx.lineTo(x + size, y + size); ctx.closePath(); ctx.fill(); };
Draw.spikeWarning = function (x, y, size) { var ctx = Draw.ctx; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x + size / 2, y); ctx.lineTo(x + size, y + size); ctx.closePath(); ctx.fill(); };
Draw.finish = function (x, y, size) { var ctx = Draw.ctx; ctx.fillStyle = "#9d3fff"; ctx.fillRect(x + size / 2 - 2, y, 4, size); ctx.beginPath(); ctx.moveTo(x + size / 2 + 2, y + 4); ctx.lineTo(x + size - 4, y + 12); ctx.lineTo(x + size / 2 + 2, y + 20); ctx.closePath(); ctx.fill(); };
Draw.enemies = function () { var ctx = Draw.ctx; for (var i = 0; i < Enemy.enemies.length; i++) { var e = Enemy.enemies[i]; if (e.deadTimer > 0) continue; if (e.state === "windup") { ctx.save(); ctx.strokeStyle = "#f0e6ff"; ctx.lineWidth = 2; ctx.globalAlpha = 0.35 + 0.65 * (1 - e.windup / CONFIG.ENEMY_WINDUP_FRAMES); ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } if (e.type === "drill" && (e.state === "approach" || e.state === "warning")) { ctx.save(); ctx.strokeStyle = "#ff2fd0"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.state === "warning" ? e.targetX : Player.x + CONFIG.PLAYER_SIZE / 2, e.state === "warning" ? e.targetY : Player.y + CONFIG.PLAYER_SIZE / 2); ctx.stroke(); ctx.restore(); } if (e.type === "domino" && e.leapState === "airborne") { ctx.save(); ctx.strokeStyle = "#ff2fd0"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(e.targetX, 0); ctx.lineTo(e.targetX, CONFIG.CANVAS_H); ctx.stroke(); ctx.restore(); } ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle || 0); if (e.type === "cuboid") { var r = e.radius; ctx.fillStyle = "#080808"; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.strokeStyle = "#b026ff"; ctx.lineWidth = 3; ctx.strokeRect(-r, -r, r * 2, r * 2); } else if (e.type === "drone") { ctx.fillStyle = "#9d4edd"; ctx.fillRect(-20, -12, 40, 24); ctx.fillRect(-28, -18, 56, 5); } else if (e.type === "drill") { ctx.fillStyle = "#7b2cbf"; ctx.beginPath(); ctx.moveTo(e.radius + 8, 0); ctx.lineTo(-e.radius, -e.radius); ctx.lineTo(-e.radius, e.radius); ctx.closePath(); ctx.fill(); } else if (e.type === "domino") { var squash = e.squash || 0, dw = CONFIG.DOMINO_WIDTH, dh = CONFIG.DOMINO_HEIGHT; ctx.scale(1 + squash * 0.3, 1 - squash * 0.3); if (e.easterEgg && Draw.dominoEasterEggImage.complete && Draw.dominoEasterEggImage.naturalWidth) { ctx.drawImage(Draw.dominoEasterEggImage, -dw / 2, -dh / 2, dw, dh); } else { var pipX = dw * 0.22, pipY = dh * 0.22, pipR = Math.max(4, dw * 0.09); ctx.fillStyle = "#d9c9f0"; ctx.fillRect(-dw / 2, -dh / 2, dw, dh); ctx.strokeStyle = "#2e1a47"; ctx.lineWidth = 4; ctx.strokeRect(-dw / 2, -dh / 2, dw, dh); ctx.beginPath(); ctx.moveTo(-dw / 2, 0); ctx.lineTo(dw / 2, 0); ctx.stroke(); ctx.fillStyle = "#2e1a47"; ctx.beginPath(); ctx.arc(-pipX, -pipY, pipR, 0, Math.PI * 2); ctx.arc(pipX, -pipY, pipR, 0, Math.PI * 2); ctx.arc(-pipX, pipY, pipR, 0, Math.PI * 2); ctx.arc(pipX, pipY, pipR, 0, Math.PI * 2); ctx.fill(); } } else { ctx.fillStyle = "#c77dff"; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#e0aaff"; ctx.stroke(); } ctx.restore(); if (e.type === "domino" && e.leapState === "landed") { var shockProgress = 1 - e.leapTimer / CONFIG.DOMINO_SHOCKWAVE_LIFE; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - shockProgress); ctx.strokeStyle = "#ff2fd0"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(e.x, e.y, shockProgress * CONFIG.DOMINO_SHOCKWAVE_RADIUS, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } } ctx.fillStyle = "#ff2fd0"; for (var j = 0; j < Enemy.bullets.length; j++) { var b = Enemy.bullets[j]; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); } };
Draw.projectiles = function () { var ctx = Draw.ctx; for (var i = 0; i < Weapons.projectiles.length; i++) { var p = Weapons.projectiles[i]; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.kind === "tomahawk" ? (p.spin || 0) : Math.atan2(p.vy, p.vx)); if (p.kind === "tomahawk") { ctx.fillStyle = "#5a3d7a"; ctx.fillRect(-9, -2, 18, 4); ctx.fillStyle = "#e8dcff"; ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(16, 0); ctx.lineTo(9, 8); ctx.closePath(); ctx.fill(); } else { ctx.fillStyle = p.kind === "bazooka" ? "#bf5fff" : "#a78bfa"; ctx.beginPath(); ctx.arc(0, 0, p.kind === "bazooka" ? 7 : 4, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); } for (var s = 0; s < Weapons.slashes.length; s++) { var slash = Weapons.slashes[s], centerX = Player.x + CONFIG.PLAYER_SIZE / 2, centerY = Player.y + CONFIG.PLAYER_SIZE / 2; ctx.save(); ctx.strokeStyle = "#f0e6ff"; ctx.lineWidth = CONFIG.KATANA_SLASH_VISUAL_WIDTH; ctx.globalAlpha = 1 - slash.age / CONFIG.KATANA_SLASH_VISUAL_LIFE; ctx.beginPath(); ctx.arc(centerX, centerY, CONFIG.KATANA_SLASH_VISUAL_RADIUS, slash.angle - CONFIG.KATANA_SLASH_VISUAL_ARC, slash.angle + CONFIG.KATANA_SLASH_VISUAL_ARC); ctx.stroke(); ctx.restore(); } for (var j = 0; j < Weapons.explosions.length; j++) { var explosion = Weapons.explosions[j], progress = explosion.age / CONFIG.BAZOOKA_EXPLOSION_TIME; ctx.save(); ctx.globalAlpha = 1 - progress; ctx.strokeStyle = "#c77dff"; ctx.fillStyle = "#7b2cbf"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(explosion.x, explosion.y, 12 + CONFIG.BAZOOKA_BLAST_RADIUS * progress, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); } };
Draw.hud = function () { var ctx = Draw.ctx; if (!Player.classType) return; var stats = CONFIG.CLASS_STATS[Player.classType], redLeft = Level.redTesseracts.filter(function (tesseract) { return !tesseract.collected; }).length; ctx.fillStyle = "#ffffff"; ctx.font = "14px monospace"; ctx.textAlign = "left"; ctx.fillText(Player.classType.toUpperCase() + "  " + Weapons.ammo + "/" + (stats.ammo + Game.blessings.ammo * CONFIG.BLESSING_EFFECTS.ammoBonus) + (Weapons.reloadTimer > 0 ? "  RELOADING" : ""), 12, 20); ctx.fillStyle = "#c724ff"; ctx.fillText("RED " + redLeft, 12, 38); ctx.fillStyle = "#e0b3ff"; ctx.fillText("GOLD " + Game.goldTesseracts, 12, 56); if (Player.dashTimer > 0) ctx.fillStyle = "#66ccff"; };
Draw.player = function () { var ctx = Draw.ctx, r = CONFIG.PLAYER_RADIUS, centerX = Player.x + CONFIG.PLAYER_SIZE / 2, centerY = Player.y + CONFIG.PLAYER_SIZE / 2; ctx.fillStyle = "#000000"; ctx.strokeStyle = Player.invincibilityTimer > 0 ? "#66eaff" : "#c77dff"; ctx.lineWidth = CONFIG.LINE_WIDTH; ctx.beginPath(); ctx.arc(centerX, centerY, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); var dotX = centerX + Math.cos(Player.angle) * r * CONFIG.DOT_DISTANCE, dotY = centerY + Math.sin(Player.angle) * r * CONFIG.DOT_DISTANCE; ctx.fillStyle = "#c77dff"; ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill(); };