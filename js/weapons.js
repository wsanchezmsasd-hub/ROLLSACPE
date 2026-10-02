/* Player classes, projectiles, ammo, and class abilities. */
var Weapons = { ammo: 0, reloadTimer: 0, fireCooldown: 0, abilityCooldown: 0, parryTimer: 0, parryCooldown: 0, parrySlowTimer: 0, parryResolved: false, projectiles: [], explosions: [], slashes: [], abilityWasDown: false, fireWasDown: false };
Weapons.reset = function () {
  var stats = CONFIG.CLASS_STATS[Player.classType];
  Weapons.ammo = stats ? stats.ammo + Game.blessings.ammo * CONFIG.BLESSING_EFFECTS.ammoBonus : 0;
  Weapons.reloadTimer = 0;
  Weapons.fireCooldown = 0;
  Weapons.abilityCooldown = 0;
  Weapons.parryTimer = 0;
  Weapons.parryCooldown = 0;
  Weapons.parrySlowTimer = 0;
  Weapons.parryResolved = false;
  Weapons.projectiles = [];
  Weapons.explosions = [];
  Weapons.slashes = [];
  Weapons.abilityWasDown = false;
  Weapons.fireWasDown = false;
};
Weapons.update = function () {
  if (!Player.classType) return;
  if (Weapons.fireCooldown > 0) Weapons.fireCooldown--;
  if (Weapons.abilityCooldown > 0) Weapons.abilityCooldown--;
  if (Weapons.parryCooldown > 0) Weapons.parryCooldown--;
  if (Weapons.parrySlowTimer > 0) Weapons.parrySlowTimer--;
  if (Weapons.parryTimer > 0) {
    Weapons.parryTimer--;
    if (Weapons.parryTimer === 0 && !Weapons.parryResolved) {
      Weapons.parrySlowTimer = CONFIG.KATANA_PARRY_SLOW_TIME;
      Weapons.parryCooldown = CONFIG.KATANA_PARRY_MISS_COOLDOWN;
      Weapons.parryResolved = true;
    }
  }
  if (Weapons.reloadTimer > 0) { Weapons.reloadTimer--; if (Weapons.reloadTimer === 0) Weapons.ammo = CONFIG.CLASS_STATS[Player.classType].ammo + Game.blessings.ammo * CONFIG.BLESSING_EFFECTS.ammoBonus; }
  if (Player.classType === "katana" || Player.classType === "tomahawk" ? Input.mouseDown : Input.mouseDown && !Weapons.fireWasDown) Weapons.fire();
  if (Input.ability && !Weapons.abilityWasDown) Weapons.useAbility();
  Weapons.fireWasDown = Input.mouseDown;
  Weapons.abilityWasDown = Input.ability;
  Weapons.updateProjectiles();
  for (var s = Weapons.slashes.length - 1; s >= 0; s--) { Weapons.slashes[s].age++; if (Weapons.slashes[s].age >= CONFIG.KATANA_SLASH_VISUAL_LIFE) Weapons.slashes.splice(s, 1); }
  for (var i = Weapons.explosions.length - 1; i >= 0; i--) {
    Weapons.explosions[i].age++;
    if (Weapons.explosions[i].age > CONFIG.BAZOOKA_EXPLOSION_TIME) Weapons.explosions.splice(i, 1);
  }
};
Weapons.fire = function () {
  var stats = CONFIG.CLASS_STATS[Player.classType];
  if (!stats || Weapons.reloadTimer > 0 || Weapons.fireCooldown > 0) return;
  if (Player.classType === "tomahawk") {
    Weapons.throwTomahawk(Input.mouseX, Input.mouseY, 0);
    Weapons.fireCooldown = CONFIG.TOMAHAWK_COOLDOWN;
    return;
  }
  if (Player.classType === "katana") {
    var slashDx = Input.mouseX - (Player.x + CONFIG.PLAYER_SIZE / 2), slashDy = Input.mouseY - (Player.y + CONFIG.PLAYER_SIZE / 2), slashDistance = Math.hypot(slashDx, slashDy) || 1;
    Enemy.damageAt(Player.x + CONFIG.PLAYER_SIZE / 2 + slashDx / slashDistance * CONFIG.KATANA_SLASH_RANGE, Player.y + CONFIG.PLAYER_SIZE / 2 + slashDy / slashDistance * CONFIG.KATANA_SLASH_RANGE, stats.damage, CONFIG.KATANA_SLASH_REACH);
    Weapons.slashes.push({ angle: Math.atan2(slashDy, slashDx), age: 0 });
    Weapons.fireCooldown = CONFIG.KATANA_SLASH_COOLDOWN;
    return;
  }
  if (Player.classType === "tomahawk") {
    var startX = Player.x + CONFIG.PLAYER_SIZE / 2, startY = Player.y + CONFIG.PLAYER_SIZE / 2;
    var dx = Input.mouseX - startX, dy = Input.mouseY - startY, distance = Math.hypot(dx, dy) || 1;
    Weapons.projectiles.push({ kind: "tomahawk", x: startX, y: startY, vx: dx / distance * CONFIG.TOMAHAWK_THROW_SPEED, vy: dy / distance * CONFIG.TOMAHAWK_THROW_SPEED, spin: 0, damage: stats.damage, life: CONFIG.WEAPON_PROJECTILE_LIFE });
    Weapons.fireCooldown = CONFIG.TOMAHAWK_COOLDOWN;
    return;
  }
  if (stats.ammo === 0) return;
  Weapons.ammo--;
  var startX = Player.x + CONFIG.PLAYER_SIZE / 2, startY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = Input.mouseX - startX, dy = Input.mouseY - startY, distance = Math.hypot(dx, dy) || 1;
  Weapons.projectiles.push({ kind: Player.classType, x: startX, y: startY, vx: dx / distance * CONFIG.WEAPON_PROJECTILE_SPEED, vy: dy / distance * CONFIG.WEAPON_PROJECTILE_SPEED, damage: stats.damage, life: CONFIG.WEAPON_PROJECTILE_LIFE });
  if (Weapons.ammo === 0) Weapons.reloadTimer = CONFIG.WEAPON_RELOAD_FRAMES[Player.classType];
  if (Player.classType === "bazooka") Weapons.fireCooldown = CONFIG.BAZOOKA_FIRE_COOLDOWN;
};
Weapons.useAbility = function () {
  if (Player.classType === "tomahawk") {
    if (Weapons.abilityCooldown > 0) return;
    for (var spread = -1; spread <= 1; spread++) Weapons.throwTomahawk(Input.mouseX, Input.mouseY, spread * CONFIG.TOMAHAWK_VOLLEY_SPREAD);
    Weapons.abilityCooldown = CONFIG.TOMAHAWK_VOLLEY_COOLDOWN;
    return;
  }
  if (Player.classType === "katana") {
    if (Weapons.parryCooldown > 0 || Weapons.parryTimer > 0) return;
    Weapons.parryTimer = CONFIG.KATANA_PARRY_WINDOW;
    Weapons.parryResolved = false;
    return;
  }
  if (Player.classType === "tomahawk") {
    if (Weapons.volleyCooldown > 0) return;
    var throwX = Player.x + CONFIG.PLAYER_SIZE / 2, throwY = Player.y + CONFIG.PLAYER_SIZE / 2;
    var baseAngle = Math.atan2(Input.mouseY - throwY, Input.mouseX - throwX);
    for (var a = -1; a <= 1; a++) {
      var angle = baseAngle + a * CONFIG.TOMAHAWK_VOLLEY_SPREAD;
      Weapons.projectiles.push({ kind: "tomahawk", x: throwX, y: throwY, vx: Math.cos(angle) * CONFIG.TOMAHAWK_THROW_SPEED, vy: Math.sin(angle) * CONFIG.TOMAHAWK_THROW_SPEED, spin: 0, damage: CONFIG.CLASS_STATS.tomahawk.damage, life: CONFIG.WEAPON_PROJECTILE_LIFE });
    }
    Weapons.volleyCooldown = CONFIG.TOMAHAWK_VOLLEY_COOLDOWN;
    return;
  }
  if (Player.classType !== "pistols" || Player.dashTimer > 0 || Player.dashCooldown > 0) return;
  var dx = Input.mouseX - (Player.x + CONFIG.PLAYER_SIZE / 2), dy = Input.mouseY - (Player.y + CONFIG.PLAYER_SIZE / 2), distance = Math.hypot(dx, dy) || 1;
  Player.vx = dx / distance * CONFIG.PISTOL_DASH_SPEED;
  Player.vy = dy / distance * CONFIG.PISTOL_DASH_SPEED;
  Player.dashTimer = CONFIG.PISTOL_DASH_TIME + Game.blessings.dash * CONFIG.BLESSING_EFFECTS.dashFrames;
};
Weapons.throwTomahawk = function (targetX, targetY, spread) {
  var startX = Player.x + CONFIG.PLAYER_SIZE / 2, startY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var angle = Math.atan2(targetY - startY, targetX - startX) + spread;
  Weapons.projectiles.push({ kind: "tomahawk", x: startX, y: startY, vx: Math.cos(angle) * CONFIG.TOMAHAWK_THROW_SPEED, vy: Math.sin(angle) * CONFIG.TOMAHAWK_THROW_SPEED, damage: CONFIG.CLASS_STATS.tomahawk.damage, life: CONFIG.WEAPON_PROJECTILE_LIFE, spin: 0 });
};
Weapons.parryBodyHit = function () {
  if (Player.classType !== "katana" || Weapons.parryTimer <= 0 || Weapons.parryResolved) return false;
  Weapons.parryResolved = true;
  Weapons.parryTimer = 0;
  Weapons.parryCooldown = CONFIG.KATANA_PARRY_HIT_COOLDOWN;
  Player.invincibilityTimer = CONFIG.KATANA_PARRY_INVINCIBILITY;
  Player.vy = -CONFIG.KATANA_PARRY_LAUNCH;
  return true;
};
Weapons.parryProjectile = function (bullet) {
  if (Player.classType !== "katana" || Weapons.parryTimer <= 0 || Weapons.parryResolved) return false;
  var length = Math.hypot(bullet.vx, bullet.vy) || 1, speed = length * CONFIG.KATANA_PARRY_REFLECT_SPEED;
  bullet.vx = -bullet.vx / length * speed;
  bullet.vy = -bullet.vy / length * speed;
  bullet.reflected = true;
  bullet.damage = 25;
  Weapons.parryResolved = true;
  Weapons.parryTimer = 0;
  Weapons.parryCooldown = CONFIG.KATANA_PARRY_HIT_COOLDOWN;
  Player.invincibilityTimer = CONFIG.KATANA_PARRY_INVINCIBILITY;
  return true;
};
Weapons.updateProjectiles = function () {
  for (var i = Weapons.projectiles.length - 1; i >= 0; i--) {
    var projectile = Weapons.projectiles[i];
    projectile.age++;
    if (projectile.kind === "ak") Weapons.updateAk(projectile, i);
    else if (projectile.kind === "tomahawk") Weapons.updateTomahawk(projectile, i);
    else Weapons.updateBullet(projectile, i);
  }
};
Weapons.updateBullet = function (projectile, index) {
  projectile.x += projectile.vx; projectile.y += projectile.vy; projectile.life--;
  if (projectile.kind === "tomahawk") { projectile.vy += CONFIG.TOMAHAWK_GRAVITY; projectile.spin = (projectile.spin || 0) + CONFIG.TOMAHAWK_SPIN_RATE; }
  var hit = projectile.kind === "bazooka" ? Enemy.damageAt(projectile.x, projectile.y, 0, CONFIG.WEAPON_HIT_REACH) : Enemy.damageAt(projectile.x, projectile.y, projectile.damage, CONFIG.WEAPON_HIT_REACH);
  if (hit || projectile.life <= 0) {
    if (projectile.kind === "bazooka") Weapons.explode(projectile.x, projectile.y);
    Weapons.projectiles.splice(index, 1);
  } else if (projectile.kind === "bazooka" && Collide.hitsSolid(projectile.x - 4, projectile.y - 4, 8, 8)) {
    Weapons.explode(projectile.x, projectile.y); Weapons.projectiles.splice(index, 1);
  }
};
Weapons.updateTomahawk = function (projectile, index) {
  projectile.vy += CONFIG.TOMAHAWK_GRAVITY;
  projectile.x += projectile.vx;
  projectile.y += projectile.vy;
  projectile.spin += CONFIG.TOMAHAWK_SPIN_RATE;
  projectile.life--;
  if (Enemy.damageAt(projectile.x, projectile.y, projectile.damage, CONFIG.WEAPON_HIT_REACH) || projectile.life <= 0 || Collide.hitsSolid(projectile.x - 8, projectile.y - 8, 16, 16)) Weapons.projectiles.splice(index, 1);
};
Weapons.explode = function (x, y) {
  Level.destroyCircle(x, y, CONFIG.BAZOOKA_BLAST_RADIUS);
  Enemy.damageRadius(x, y, CONFIG.BAZOOKA_BLAST_RADIUS, CONFIG.CLASS_STATS.bazooka.damage);
  Weapons.explosions.push({ x: x, y: y, age: 0 });
};
