/* =====================================================================
   enemy.js -- ENEMIES AND THEIR PROJECTILES.
   ===================================================================== */
var Enemy = {
  type: null, types: [], enemies: [], bullets: [],
  choices: [
    { type: "cuboid", name: "Cuboid", description: "Two large, slippery cubes follow you and are knocked back by damage." },
    { type: "drone", name: "Drone", description: "25 HP. Respawns after 3.5 seconds and fires short, slow bursts." },
    { type: "drill", name: "Drill", description: "45 HP. Respawns after 2 seconds, then locks on and dashes." },
    { type: "greenBall4", name: "Green ball 4", description: "Two 15 HP balls respawn after 1.25 seconds and leap toward you." },
    { type: "domino", name: "Domino", description: "An unkillable giant slab. Crouches, leaps high, and slams down near you, sending out a shockwave." },
    { type: "ase", name: "ASE", description: "All Seeing Eye. 30 HP. Drifts toward you slowly, then teleports far ahead of the direction you are moving." },
    { type: "roller", name: "Roller", description: "Unkillable. Copies your exact path 1.5 seconds behind you and kills on contact. Each extra Roller trails 3 seconds further back." }
  ]
};
Enemy.history = [];
Enemy.isType = function (type, wanted) { return type === wanted || (wanted === "cuboid" && type === "cuobid") || (wanted === "drill" && type === "evilSpike"); };
Enemy.resetRoster = function () { Enemy.types = []; Enemy.type = null; };
Enemy.reset = function (type, resetRoster) {
  if (resetRoster) Enemy.resetRoster();
  if (type) Enemy.types.push(type);
  Enemy.type = Enemy.types.length === 1 ? Enemy.types[0] : (Enemy.types.length ? "mixed" : null);
  Enemy.enemies = []; Enemy.bullets = []; Enemy.history = []; if (!Enemy.types.length) return;
  for (var t = 0; t < Enemy.types.length; t++) { var point = Enemy.types[t] === "domino" ? Enemy.dominoSpawnPoint(CONFIG.ENEMY_START_DISTANCE) : Enemy.randomSpawnPoint(24, CONFIG.ENEMY_START_DISTANCE); Enemy.spawnType(Enemy.types[t], point.x, point.y); }
};
Enemy.randomSpawnPoint = function (radius, distance) {
  var spawnDistance = distance == null ? CONFIG.ENEMY_START_DISTANCE : distance;
  var point = {
    x: Math.max(radius, Math.min(Level.pixelWidth() - radius, Player.x + spawnDistance)),
    y: Math.max(radius, Math.min(CONFIG.CANVAS_H - radius, Player.y - CONFIG.ENEMY_SPAWN_HEIGHT))
  };

  for (var attempt = 0; attempt < 20; attempt++) {
    var x = Math.max(radius, Math.min(Level.pixelWidth() - radius, point.x + (Math.random() - 0.5) * radius * 4)),
      y = Math.max(radius, Math.min(CONFIG.CANVAS_H - radius, point.y + (Math.random() - 0.5) * radius * 4));
    if (!Collide.hitsSolid(x - radius, y - radius, radius * 2, radius * 2)) {
      return { x: x, y: y };
    }
  }
  return point;
};
Enemy.dominoSpawnPoint = function (distance) {
  var bounds = Enemy.dominoBounds({ angle: 0 });
  var minX = bounds.halfWidth, maxX = Level.pixelWidth() - bounds.halfWidth;
  var targetX = Math.max(minX, Math.min(maxX, Player.x + distance));
  var spawnY = bounds.halfHeight, bestX = null, bestDistance = Infinity;
  for (var x = minX; x <= maxX; x += CONFIG.TILE / 2) {
    if (!Collide.hitsSolid(x - bounds.halfWidth, spawnY - bounds.halfHeight, bounds.halfWidth * 2, bounds.halfHeight * 2)) {
      var distanceFromTarget = Math.abs(x - targetX);
      if (distanceFromTarget < bestDistance) { bestX = x; bestDistance = distanceFromTarget; }
    }
  }
  return bestX === null ? { x: targetX, y: -bounds.halfHeight } : { x: bestX, y: spawnY };
};

Enemy.spawnType = function (type, x, y) {
  if (Enemy.isType(type, "greenBall4")) for (var i = 0; i < CONFIG.GREEN_BALL_COUNT; i++) Enemy.enemies.push(Enemy.makeEnemy("greenBall4", x + i * CONFIG.GREEN_BALL_SPAWN_X_SPACING, y - i * CONFIG.GREEN_BALL_SPAWN_Y_SPACING, CONFIG.GREEN_BALL_SIZE / 2, CONFIG.ENEMY_HP.greenBall4, CONFIG.ENEMY_RESPAWN_FRAMES.greenBall4));
  else if (Enemy.isType(type, "cuboid")) for (var j = 0; j < CONFIG.CUOBID_GROUP_SIZE; j++) Enemy.enemies.push(Enemy.makeEnemy("cuboid", x + j * CONFIG.CUOBID_SPAWN_SPACING, y + (Math.random() * CONFIG.CUBOID_SPAWN_Y_RANGE - CONFIG.CUBOID_SPAWN_Y_RANGE / 2), CONFIG.CUOBID_SIZE / 2, Infinity, 0));
  else if (type === "ase") Enemy.enemies.push(Enemy.makeEnemy("ase", x, y, CONFIG.ASE_RADIUS, CONFIG.ENEMY_HP.ase, CONFIG.ENEMY_RESPAWN_FRAMES.ase));
  else if (type === "roller") { var rollerIndex = Enemy.enemies.filter(function (en) { return en.type === "roller"; }).length, roller = Enemy.makeEnemy("roller", x, y, CONFIG.ROLLER_RADIUS, Infinity, 0); roller.delayFrames = CONFIG.ROLLER_BASE_DELAY_FRAMES + rollerIndex * CONFIG.ROLLER_STACK_DELAY_FRAMES; roller.dormant = true; Enemy.enemies.push(roller); }
  else { var actualType = Enemy.isType(type, "drill") ? "drill" : type, count = actualType === "drone" ? CONFIG.DRONE_COUNT : 1, radius = actualType === "drone" ? CONFIG.CUOBID_SIZE / 2 : actualType === "domino" ? CONFIG.DOMINO_HEIGHT / 2 : CONFIG.EVIL_SPIKE_SIZE / 2, hp = actualType === "drone" ? CONFIG.ENEMY_HP.drone : actualType === "domino" ? Infinity : CONFIG.ENEMY_HP.drill, respawnFrames = actualType === "drone" ? CONFIG.ENEMY_RESPAWN_FRAMES.drone : CONFIG.ENEMY_RESPAWN_FRAMES.drill; for (var k = 0; k < count; k++) Enemy.enemies.push(Enemy.makeEnemy(actualType, x + k * 70, y - k * 45, radius, hp, respawnFrames)); }
};
Enemy.makeEnemy = function (type, x, y, radius, hp, respawnFrames) { return { type: type, x: x, y: y, spawnX: x, spawnY: y, vx: 0, vy: 0, state: "windup", timer: 0, shotTimer: 0, burstShots: 0, fireTimer: 0, radius: radius, angle: 0, targetAngle: 0, hp: hp, maxHp: hp, respawnFrames: respawnFrames, deadTimer: 0, jumpTimer: CONFIG.GREEN_BALL_JUMP_INTERVAL, grounded: false, combined: false, windup: CONFIG.ENEMY_WINDUP_FRAMES };
};
Enemy.randomChoices = function () { var pool = Enemy.choices.slice(), result = []; while (result.length < 3 && pool.length) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return result; };
Enemy.update = function () { if (!Enemy.types.length) return; Enemy.recordPlayer(); for (var i = 0; i < Enemy.enemies.length; i++) { var e = Enemy.enemies[i]; if (e.deadTimer > 0) { e.deadTimer--; if (e.deadTimer === 0) { var point = e.type === "domino" ? Enemy.dominoSpawnPoint(CONFIG.ENEMY_RESPAWN_DISTANCE) : Enemy.randomSpawnPoint(e.radius, CONFIG.ENEMY_RESPAWN_DISTANCE); e.hp = e.maxHp; e.x = point.x; e.y = point.y; e.spawnX = e.x; e.spawnY = e.y; e.vx = 0; e.vy = 0; e.state = "windup"; e.timer = 0; e.grounded = false; e.aseState = undefined; e.windup = CONFIG.ENEMY_WINDUP_FRAMES; } continue; } if (e.state === "windup") { e.windup--; if (e.windup > 0) continue; e.state = "approach"; } if (e.type === "cuboid") Enemy.updateCuboid(e); if (e.type === "drone") Enemy.updateDrone(e); if (e.type === "drill") Enemy.updateDrill(e); if (e.type === "greenBall4") Enemy.updateGreenBall(e); if (e.type === "domino") Enemy.updateDomino(e); if (e.type === "ase") Enemy.updateAse(e); if (e.type === "roller") Enemy.updateRoller(e); } if (Game.curseCount("unknownDimension") > 0 && CONFIG.CURSES.unknownDimension.allowCuboidMerge) Enemy.tryCombineCuboids(); Enemy.updateBullets(); };
Enemy.updateDomino = function (e) {
  if (e.leapState === undefined) { e.leapState = "grounded"; e.leapTimer = CONFIG.DOMINO_GROUND_PAUSE_FRAMES; e.squash = 0; }
  var halfW = CONFIG.DOMINO_WIDTH / 2, halfH = CONFIG.DOMINO_HEIGHT / 2;
  e.vy += CONFIG.GRAVITY;
  if (e.vy > CONFIG.MAX_FALL) e.vy = CONFIG.MAX_FALL;
  var nextY = e.y + e.vy;
  if (Collide.hitsSolid(e.x - halfW, nextY - halfH, CONFIG.DOMINO_WIDTH, CONFIG.DOMINO_HEIGHT)) {
    if (e.vy > 0) { e.y = Math.floor((nextY + halfH) / CONFIG.TILE) * CONFIG.TILE - halfH; if (e.leapState === "airborne") Enemy.dominoLand(e); }
    else if (e.vy < 0) { e.y = (Math.floor((nextY - halfH) / CONFIG.TILE) + 1) * CONFIG.TILE + halfH; }
    e.vy = 0;
  } else { e.y = nextY; }
  if (!Collide.hitsSolid(e.x - halfW + e.vx, e.y - halfH, CONFIG.DOMINO_WIDTH, CONFIG.DOMINO_HEIGHT)) e.x += e.vx; else e.vx = 0;
  // Probe 1px below so "grounded" is steady (resting gravity otherwise flickers it every other frame).
  e.grounded = Collide.hitsSolid(e.x - halfW, e.y - halfH + 1, CONFIG.DOMINO_WIDTH, CONFIG.DOMINO_HEIGHT);

  if (e.leapState === "grounded") {
    e.squash *= 0.8; e.angle *= 0.8;
    if (e.grounded) { e.leapTimer--; if (e.leapTimer <= 0) { e.leapState = "crouch"; e.leapTimer = CONFIG.DOMINO_TELEGRAPH_FRAMES; } }
  } else if (e.leapState === "crouch") {
    e.squash = 1 - e.leapTimer / CONFIG.DOMINO_TELEGRAPH_FRAMES; e.leapTimer--;
    if (e.leapTimer <= 0) {
      var offset = (Math.random() * 2 - 1) * CONFIG.DOMINO_LEAP_RANGE;
      e.targetX = Math.max(halfW, Math.min(Level.pixelWidth() - halfW, Player.x + CONFIG.PLAYER_SIZE / 2 + offset));
      // Launch speed derived from the desired apex so DOMINO_JUMP_HEIGHT actually means "high".
      var jumpSpeed = Math.sqrt(2 * CONFIG.GRAVITY * CONFIG.DOMINO_JUMP_HEIGHT);
      var airFrames = Math.max(1, Math.round(2 * jumpSpeed / CONFIG.GRAVITY));
      e.vx = (e.targetX - e.x) / airFrames; e.vy = -jumpSpeed; e.grounded = false; e.leapState = "airborne"; e.squash = 0;
    }
  } else if (e.leapState === "airborne") {
    e.angle = Math.atan2(e.vy, e.vx) * 0.25;
    e.squash = -Math.min(1, Math.abs(e.vy) / 12) * 0.3;
  } else if (e.leapState === "landed") {
    e.squash = e.leapTimer / CONFIG.DOMINO_SHOCKWAVE_LIFE; e.leapTimer--;
    if (e.leapTimer <= 0) { e.leapState = "grounded"; e.leapTimer = CONFIG.DOMINO_GROUND_PAUSE_FRAMES; e.vx = 0; e.squash = 0; }
  }
};
Enemy.dominoLand = function (e) {
  e.leapState = "landed"; e.leapTimer = CONFIG.DOMINO_SHOCKWAVE_LIFE; e.vx = 0; e.angle = 0;
  var px = Player.x + CONFIG.PLAYER_SIZE / 2, py = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = px - e.x, dy = py - e.y, distance = Math.hypot(dx, dy) || 1;
  if (distance < CONFIG.DOMINO_SHOCKWAVE_RADIUS) {
    var force = CONFIG.DOMINO_SHOCKWAVE_FORCE * (1 - distance / CONFIG.DOMINO_SHOCKWAVE_RADIUS);
    Player.vx += dx / distance * force;
    Player.vy += dy / distance * force - force * 0.35;
  }
};
// Only lethal while falling or on the landing frame; touching it otherwise is harmless.
Enemy.dominoCrushesPlayer = function (e) {
  var justLanded = e.leapState === "landed" && e.leapTimer >= CONFIG.DOMINO_SHOCKWAVE_LIFE - 1;
  if (e.leapState !== "airborne" && !justLanded) return false;
  if (e.vy < 0) return false;
  var halfW = CONFIG.DOMINO_WIDTH / 2, halfH = CONFIG.DOMINO_HEIGHT / 2;
  var overlapX = Math.abs((Player.x + CONFIG.PLAYER_SIZE / 2) - e.x) < halfW + CONFIG.PLAYER_SIZE / 2;
  var overlapY = Math.abs((Player.y + CONFIG.PLAYER_SIZE / 2) - e.y) < halfH + CONFIG.PLAYER_SIZE / 2;
  return overlapX && overlapY;
};
Enemy.dominoBounds = function (e) {
  var cos = Math.abs(Math.cos(e.angle || 0)), sin = Math.abs(Math.sin(e.angle || 0));
  return { halfWidth: cos * CONFIG.DOMINO_WIDTH / 2 + sin * CONFIG.DOMINO_HEIGHT / 2, halfHeight: sin * CONFIG.DOMINO_WIDTH / 2 + cos * CONFIG.DOMINO_HEIGHT / 2 };
};
// Bullets/slashes test against the slab's real rectangle, not a 75px circle.
Enemy.dominoOverlapsCircle = function (e, x, y, r) {
  var a = e.angle || 0, cos = Math.cos(a), sin = Math.sin(a), dx = x - e.x, dy = y - e.y;
  var lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
  var nx = Math.max(-CONFIG.DOMINO_WIDTH / 2, Math.min(CONFIG.DOMINO_WIDTH / 2, lx));
  var ny = Math.max(-CONFIG.DOMINO_HEIGHT / 2, Math.min(CONFIG.DOMINO_HEIGHT / 2, ly));
  return (lx - nx) * (lx - nx) + (ly - ny) * (ly - ny) < r * r;
};
Enemy.tryCombineCuboids = function () { var cuboids = Enemy.enemies.filter(function (e) { return e.type === "cuboid" && !e.combined; }); if (cuboids.length < CONFIG.CUOBID_GROUP_SIZE) return; var cx = 0, cy = 0; cuboids.forEach(function (e) { cx += e.x; cy += e.y; }); cx /= cuboids.length; cy /= cuboids.length; if (!cuboids.every(function (e) { return Math.hypot(e.x - cx, e.y - cy) < CONFIG.CUOBID_MERGE_DISTANCE; })) return; Enemy.enemies = Enemy.enemies.filter(function (e) { return e.type !== "cuboid" || e.combined; }); Enemy.enemies.push({ type: "cuboid", x: cx, y: cy, vx: 0, vy: 0, radius: CONFIG.CUOBID_SIZE / 2 * Math.sqrt(cuboids.length), angle: 0, combined: true, state: "approach", deadTimer: 0, hp: Infinity, maxHp: Infinity, respawnFrames: 0 }); };
Enemy.updateCuboid = function (e) { var dx = Player.x - e.x, dy = Player.y - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1, speedMultiplier = e.combined ? CONFIG.CUOBID_COMBINED_SPEED_MULT : 1, speed = Math.min(CONFIG.CUOBID_MAX_SPEED, (CONFIG.CUOBID_SPEED + distance * CONFIG.CUOBID_DISTANCE_SPEED) * speedMultiplier); e.x += dx / distance * speed + e.vx; e.y += dy / distance * speed + e.vy; e.vx *= CONFIG.CUOBID_KNOCKBACK_DECAY; e.vy *= CONFIG.CUOBID_KNOCKBACK_DECAY; e.angle += 0.025; };
Enemy.rollDroneOffset = function (e) {
  e.offsetX = (Math.random() * 2 - 1) * CONFIG.DRONE_OFFSET_X;
  e.offsetY = -CONFIG.DRONE_HEIGHT_ABOVE_PLAYER + (Math.random() * 2 - 1) * CONFIG.DRONE_OFFSET_Y;
};
Enemy.updateDrone = function (e) {
  if (e.offsetX === undefined) Enemy.rollDroneOffset(e);
  e.timer++; if (e.fireTimer > 0) e.fireTimer--;
  var pcx = Player.x + CONFIG.PLAYER_SIZE / 2, pcy = Player.y + CONFIG.PLAYER_SIZE / 2;
  // Aim at where you're GOING, plus this drone's own random offset so several drones spread out.
  var targetX = Math.max(0, Math.min(Level.pixelWidth(), pcx + Player.vx * CONFIG.DRONE_LEAD_FRAMES + e.offsetX));
  var targetY = Math.max(30, pcy + Player.vy * CONFIG.DRONE_LEAD_FRAMES * 0.25 + e.offsetY);
  var firing = e.burstShots > 0 || e.fireTimer > 0, slow = firing ? CONFIG.DRONE_FIRE_MOVE_FACTOR : 1;
  var mx = (targetX - e.x) * CONFIG.DRONE_FAST_FOLLOW_RATE * slow, my = (targetY - e.y) * CONFIG.DRONE_FAST_FOLLOW_RATE * slow;
  var mag = Math.hypot(mx, my), cap = CONFIG.DRONE_MAX_SPEED * slow;
  if (mag > cap) { mx *= cap / mag; my *= cap / mag; }
  e.x += mx; e.y += my; // still creeping toward you while shooting, just slowly
  e.shotTimer--;
  var slug = Game.hasCurse("shotgunSlug");
  if (e.shotTimer <= 0 && e.burstShots > 0) {
    var dx = pcx - e.x, dy = pcy - e.y, distance = Math.hypot(dx, dy) || 1, bulletSpeed = slug ? CONFIG.CURSES.shotgunSlug.bulletSpeed : CONFIG.DRONE_BULLET_SPEED;
    Enemy.bullets.push({ x: e.x, y: e.y, vx: dx / distance * bulletSpeed, vy: dy / distance * bulletSpeed, life: CONFIG.DRONE_BULLET_LIFE });
    e.burstShots--;
    e.shotTimer = slug ? CONFIG.DRONE_BURST_COOLDOWN : (e.burstShots ? CONFIG.DRONE_SHOT_INTERVAL : CONFIG.DRONE_BURST_COOLDOWN);
    if (e.burstShots === 0) Enemy.rollDroneOffset(e); // new position to approach for the next burst
  } else if (e.shotTimer <= 0 && e.burstShots === 0 && Math.hypot(pcx - e.x, pcy - e.y) < CONFIG.DRONE_FIRE_RANGE) {
    e.burstShots = slug ? 1 : CONFIG.DRONE_SHOTS; e.fireTimer = CONFIG.DRONE_FIRE_TIME; e.shotTimer = 1;
  }
};
Enemy.aseDirection = function (e) {
  // Horizontal only: remember which way you were last running (+1 right, -1 left).
  if (Math.abs(Player.vx) > 0.8) e.dirX = Player.vx > 0 ? 1 : -1;
  if (e.dirX === undefined) e.dirX = 1;
};
Enemy.aseDestination = function (e) {
  var pcx = Player.x + CONFIG.PLAYER_SIZE / 2, pcy = Player.y + CONFIG.PLAYER_SIZE / 2, r = e.radius, W = Level.pixelWidth();
  var sides = [e.dirX, -e.dirX], distances = [1, 0.85, 0.7], heights = [0, -70, 70];
  for (var s = 0; s < sides.length; s++) for (var i = 0; i < distances.length; i++) for (var h = 0; h < heights.length; h++) {
    var x = pcx + sides[s] * CONFIG.ASE_TELEPORT_DISTANCE * distances[i], y = Math.max(r, Math.min(CONFIG.CANVAS_H - r, pcy + heights[h]));
    if (x < r || x > W - r) continue;
    if (Math.abs(x - pcx) < CONFIG.ASE_MIN_DISTANCE) continue;
    if (!Collide.hitsSolid(x - r, y - r, r * 2, r * 2)) return { x: x, y: y };
  }
  // Nothing clean: straight ahead, clamped to the map.
  return { x: Math.max(r, Math.min(W - r, pcx + e.dirX * CONFIG.ASE_TELEPORT_DISTANCE)), y: Math.max(r, Math.min(CONFIG.CANVAS_H - r, pcy)) };
};
Enemy.updateAse = function (e) {
  var pcx = Player.x + CONFIG.PLAYER_SIZE / 2, pcy = Player.y + CONFIG.PLAYER_SIZE / 2;
  Enemy.aseDirection(e);
  if (e.aseState === undefined) { e.aseState = "drift"; e.aseTimer = CONFIG.ASE_TELEPORT_INTERVAL; }
  if (e.aseState === "drift") {
    // Same chase as a Cuboid (faster the farther away you are), just slower.
    var dx = pcx - e.x, dy = pcy - e.y, d = Math.hypot(dx, dy) || 1;
    var speed = Math.min(CONFIG.CUOBID_MAX_SPEED, CONFIG.CUOBID_SPEED + d * CONFIG.CUOBID_DISTANCE_SPEED) * CONFIG.ASE_SPEED_MULT;
    e.x += dx / d * speed; e.y += dy / d * speed;
    e.aseTimer--;
    if (e.aseTimer <= 0) { e.aseState = "warning"; e.aseTimer = CONFIG.ASE_TELEPORT_WARNING; var first = Enemy.aseDestination(e); e.destX = first.x; e.destY = first.y; }
  } else {
    // The ring tracks the spot ahead of you, then locks for the last 12 frames so you can react.
    if (e.aseTimer > 12) { var dest = Enemy.aseDestination(e); e.destX = dest.x; e.destY = dest.y; }
    e.aseTimer--;
    if (e.aseTimer <= 0) { e.x = e.destX; e.y = e.destY; e.aseState = "drift"; e.aseTimer = CONFIG.ASE_TELEPORT_INTERVAL; }
  }
};
Enemy.recordPlayer = function () {
  var maxDelay = 0;
  for (var i = 0; i < Enemy.enemies.length; i++) if (Enemy.enemies[i].type === "roller") maxDelay = Math.max(maxDelay, Enemy.enemies[i].delayFrames);
  if (!maxDelay) return;
  Enemy.history.push({ x: Player.x + CONFIG.PLAYER_SIZE / 2, y: Player.y + CONFIG.PLAYER_SIZE / 2, angle: Player.angle });
  while (Enemy.history.length > maxDelay + 2) Enemy.history.shift();
};
Enemy.updateRoller = function (e) {
  var index = Enemy.history.length - 1 - e.delayFrames;
  if (index < 0) { e.dormant = true; return; } // not enough history yet; harmless until it "arrives"
  var sample = Enemy.history[index];
  e.dormant = false; e.x = sample.x; e.y = sample.y; e.angle = sample.angle;
};
Enemy.updateDrill = function (e) {
  e.timer++;
  if (e.state === "approach") {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
    e.targetAngle = Math.atan2(dy, dx);
    var turn = e.targetAngle - e.angle;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    e.angle += turn * CONFIG.DRILL_TURN_RATE;
    if (e.timer > CONFIG.EVIL_SPIKE_WARNING_TIME) {
      e.targetX = Player.x + CONFIG.PLAYER_SIZE / 2;
      e.targetY = Player.y + CONFIG.PLAYER_SIZE / 2;
      e.state = "warning";
      e.timer = 0;
    }
  } else if (e.state === "warning") {
    if (e.timer > CONFIG.DRILL_DASH_DELAY) {
      var targetDx = e.targetX - e.x, targetDy = e.targetY - e.y, targetDistance = Math.hypot(targetDx, targetDy) || 1;
      e.vx = targetDx / targetDistance * CONFIG.EVIL_SPIKE_DASH_SPEED;
      e.vy = targetDy / targetDistance * CONFIG.EVIL_SPIKE_DASH_SPEED;
      e.state = "dash";
      e.timer = 0;
    }
  } else if (e.state === "dash") {
    e.x += e.vx;
    e.y += e.vy;
    if (e.timer > CONFIG.EVIL_SPIKE_DASH_TIME) {
      if (Game.curseCount("batteryLife") > 0 && CONFIG.CURSES.batteryLife.extraDrillDash && !e.doubleDashUsed) { e.doubleDashUsed = true; e.state = "warning"; e.timer = 0; e.targetX = Player.x + CONFIG.PLAYER_SIZE / 2; e.targetY = Player.y + CONFIG.PLAYER_SIZE / 2; }
      else { e.state = "approach"; e.timer = 0; e.doubleDashUsed = false; }
    }
  }
};
Enemy.updateGreenBall = function (e) {
  e.jumpTimer--;
  e.vy += CONFIG.GRAVITY;
  var nextY = e.y + e.vy, falling = e.vy > 0;
  if (Collide.hitsSolid(e.x - e.radius, nextY - e.radius, e.radius * 2, e.radius * 2)) {
    if (falling) e.y = Math.floor((nextY + e.radius) / CONFIG.TILE) * CONFIG.TILE - e.radius;
    else if (e.vy < 0) e.y = (Math.floor((nextY - e.radius) / CONFIG.TILE) + 1) * CONFIG.TILE + e.radius;
    e.vy = 0;
    e.grounded = falling;
  } else {
    e.y = nextY;
    e.grounded = false;
  }
  if (e.grounded && e.jumpTimer <= 0) {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1;
    e.vx = dx / distance * CONFIG.GREEN_BALL_JUMP_SPEED;
    e.vy = dy / distance * CONFIG.GREEN_BALL_JUMP_SPEED - CONFIG.GREEN_BALL_BOUNCE;
    e.grounded = false;
    e.jumpTimer = CONFIG.GREEN_BALL_JUMP_INTERVAL;
  }
  if (!Collide.hitsSolid(e.x - e.radius + e.vx, e.y - e.radius, e.radius * 2, e.radius * 2)) e.x += e.vx; else e.vx = 0;
  e.vx *= 0.96;
  e.angle += e.vx / e.radius;
};
Enemy.updateBullets = function () { for (var i = Enemy.bullets.length - 1; i >= 0; i--) { var b = Enemy.bullets[i]; b.x += b.vx; b.y += b.vy; b.life--; if (b.reflected && Enemy.damageAt(b.x, b.y, b.damage || 25, 6)) { Enemy.bullets.splice(i, 1); continue; } if (b.life <= 0 || Collide.hitsSolid(b.x - 4, b.y - 4, 8, 8)) Enemy.bullets.splice(i, 1); } };
Enemy.damageAt = function (x, y, damage, reach) {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i]; if (e.deadTimer > 0 || e.dormant) continue;
    var dx = x - e.x, dy = y - e.y, hitReach = (reach || 0) + e.radius;
    if (e.type === "domino" ? Enemy.dominoOverlapsCircle(e, x, y, reach || 0) : dx * dx + dy * dy < hitReach * hitReach) {
      if (e.hp !== Infinity) e.hp -= damage * Math.pow(CONFIG.CURSES.wearAndTear.damageMultiplier, Game.curseCount("wearAndTear"));
      if (e.type === "cuboid") { var distance = Math.sqrt(dx * dx + dy * dy) || 1; e.vx -= dx / distance * CONFIG.CUOBID_HIT_KNOCKBACK; e.vy -= dy / distance * CONFIG.CUOBID_HIT_KNOCKBACK; }
      if (e.hp <= 0) e.deadTimer = e.respawnFrames;
      return true;
    }
  }
  return false;
};
Enemy.damageRadius = function (x, y, radius, damage) {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i]; if (e.deadTimer > 0 || e.dormant) continue;
    var dx = x - e.x, dy = y - e.y, distance = Math.hypot(dx, dy);
    if (distance < radius + e.radius) {
      if (e.hp !== Infinity) e.hp -= damage * (1 - Math.min(distance / (radius + e.radius), 1) * 0.5) * Math.pow(CONFIG.CURSES.wearAndTear.damageMultiplier, Game.curseCount("wearAndTear"));
      var force = CONFIG.BAZOOKA_KNOCKBACK * (1 - Math.min(distance / (radius + e.radius), 1));
      if (distance > 0) { e.vx += -dx / distance * force; e.vy += -dy / distance * force; }
      if (e.hp <= 0) e.deadTimer = e.respawnFrames;
    }
  }
};
Enemy.hitsPlayer = function () {
  var px = Player.x + CONFIG.PLAYER_SIZE / 2, py = Player.y + CONFIG.PLAYER_SIZE / 2;
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i];
    if (e.deadTimer > 0 || e.dormant || e.state === "windup" || e.type === "drone") continue; // drones only hurt via their bullets
    var hit = e.type === "domino" ? Enemy.dominoCrushesPlayer(e) : Math.hypot(px - e.x, py - e.y) < e.radius + CONFIG.PLAYER_SIZE / 2;
    if (hit) {
      if (Weapons.parryBodyHit() || Player.invincibilityTimer > 0) continue;
      return true;
    }
  }
  for (var j = Enemy.bullets.length - 1; j >= 0; j--) {
    var b = Enemy.bullets[j], bx = px - b.x, by = py - b.y;
    if (bx * bx + by * by < 18 * 18) {
      if (Weapons.parryProjectile(b) || Player.invincibilityTimer > 0) continue;
      if (!b.reflected) return true;
    }
  }
  return false;
};
