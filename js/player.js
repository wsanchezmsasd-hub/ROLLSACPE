/* =====================================================================
   player.js  --  THE ROLLING CIRCLE.
   ===================================================================== */
var Player = { x: 0, y: 0, vx: 0, vy: 0, onGround: false, coyoteTimer: 0, angle: 0, classType: null, dashTimer: 0, dashCooldown: 0, invincibilityTimer: 0 };
Player.reset = function () { Player.x = Level.startX; Player.y = Level.startY; Player.vx = 0; Player.vy = 0; Player.onGround = false; Player.coyoteTimer = 0; Player.angle = 0; Player.dashTimer = 0; Player.dashCooldown = 0; Player.invincibilityTimer = 0; Player.fakeTesseractHit = false; };
Player.clampVelocity = function () {
  if (Player.vx > CONFIG.MAX_HORIZONTAL_SPEED) Player.vx = CONFIG.MAX_HORIZONTAL_SPEED;
  if (Player.vx < -CONFIG.MAX_HORIZONTAL_SPEED) Player.vx = -CONFIG.MAX_HORIZONTAL_SPEED;
  if (Player.vy > CONFIG.MAX_VERTICAL_SPEED) Player.vy = CONFIG.MAX_VERTICAL_SPEED;
  if (Player.vy < -CONFIG.MAX_VERTICAL_SPEED) Player.vy = -CONFIG.MAX_VERTICAL_SPEED;
};
Player.update = function () {
  Weapons.update();
  if (Player.invincibilityTimer > 0) Player.invincibilityTimer--;
  if (Player.dashCooldown > 0) Player.dashCooldown--;
  if (Player.dashTimer > 0) {
    var dashStepX = Player.vx > 0 ? 1 : -1, dashStepY = Player.vy > 0 ? 1 : -1;
    for (var dashX = 0; dashX < Math.abs(Player.vx); dashX++) {
      if (Collide.hitsSolid(Player.x + dashStepX, Player.y, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)) { Player.vx = 0; break; }
      Player.x += dashStepX;
    }
    for (var dashY = 0; dashY < Math.abs(Player.vy); dashY++) {
      if (Collide.hitsSolid(Player.x, Player.y + dashStepY, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)) { Player.vy = 0; break; }
      Player.y += dashStepY;
    }
    Player.dashTimer--;
    if (Player.dashTimer === 0) Player.dashCooldown = CONFIG.PISTOL_DASH_COOLDOWN;
    return;
  }
  var size = CONFIG.PLAYER_SIZE;
  if (!Input.left && !Input.right) { Player.vx *= 0.95; }
  var movement = (CONFIG.MOVE_SPEED + Game.blessings.speed * CONFIG.BLESSING_EFFECTS.moveAcceleration) * Math.pow(CONFIG.CURSES.roughEdging.movementMultiplier, Game.curseCount("roughEdging")) * (Weapons.parrySlowTimer > 0 ? CONFIG.KATANA_PARRY_SLOW_MULTIPLIER : 1);
  if (Input.left) { Player.vx -= movement; }
  if (Input.right) { Player.vx += movement; }
  Player.clampVelocity();
  if (Player.coyoteTimer > 0) Player.coyoteTimer--;
  var jumpPower = (CONFIG.JUMP_POWER + Game.blessings.jump * CONFIG.BLESSING_EFFECTS.jumpPower + (Game.levelNumber >= 2 ? CONFIG.LATER_LEVEL_JUMP_BONUS : 0)) * Math.pow(CONFIG.CURSES.lowerGravity.jumpPowerMultiplier, Game.curseCount("lowerGravity"));
  if (Input.jump && (Player.onGround || Player.coyoteTimer > 0)) { Player.vy = -jumpPower; Player.onGround = false; Player.coyoteTimer = 0; }
  Player.vy += CONFIG.GRAVITY * Math.pow(CONFIG.CURSES.lowerGravity.gravityMultiplier, Game.curseCount("lowerGravity")); if (Player.vy > CONFIG.MAX_FALL) Player.vy = CONFIG.MAX_FALL;
  var stepX = Player.vx > 0 ? 1 : (Player.vx < 0 ? -1 : 0);
  for (var i = 0; i < Math.abs(Player.vx); i++) { if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) break; Player.x += stepX; Player.angle += stepX / CONFIG.PLAYER_RADIUS; }
  var stepY = Player.vy > 0 ? 1 : (Player.vy < 0 ? -1 : 0); Player.onGround = false;
  for (var j = 0; j < Math.abs(Player.vy); j++) { if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) { if (stepY > 0) { Player.onGround = true; Player.coyoteTimer = CONFIG.COYOTE_TIME_FRAMES; } Player.vy = 0; break; } Player.y += stepY; }
  if (Player.x < 0) Player.x = 0;
  Player.clampVelocity();
};
Player.isDead = function () { var spikeMargin = Game.levelNumber >= 2 ? CONFIG.LATER_LEVEL_SPIKE_MARGIN : 0; return Player.dashTimer <= 0 && Player.invincibilityTimer <= 0 && (Player.fakeTesseractHit || Collide.hitsSpike(Player.x + spikeMargin, Player.y + spikeMargin, CONFIG.PLAYER_SIZE - spikeMargin * 2, CONFIG.PLAYER_SIZE - spikeMargin * 2) || Player.y > CONFIG.CANVAS_H + 200); };
Player.hasWon = function () { return Collide.hitsFinish(Player.x, Player.y, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE); };
