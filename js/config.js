/* =====================================================================
   config.js -- ALL THE NUMBERS.
   Change values here to tune the game, including individual curses.
   ===================================================================== */
var CONFIG = {
  TILE: 40,
  ROWS: 10,
  PIECE_COLS: 8,
  CANVAS_W: 800,
  CANVAS_H: 400,

  MOVE_SPEED: 0.2,
  JUMP_POWER: 12,
  GRAVITY: 0.5,
  MAX_FALL: 16,
  MAX_HORIZONTAL_SPEED: 8,
  MAX_VERTICAL_SPEED: 16,
  COYOTE_TIME_FRAMES: 8, // 0.133 seconds 
  PLAYER_SIZE: 32,
  PLAYER_RADIUS: 16,

  WEAPON_PROJECTILE_SPEED: 12,
  WEAPON_PROJECTILE_LIFE: 90,
  WEAPON_HIT_REACH: 14,
  WEAPON_RELOAD_FRAMES: { bazooka: 240, pistols: 180 },
  BAZOOKA_FIRE_COOLDOWN: 0,
  CLASS_STATS: {
    bazooka: { damage: 85, ammo: 6 },
    tomahawk: { damage: 10, ammo: 0 },
    pistols: { damage: 4, ammo: 24 },
    katana: { damage: 8, ammo: 0 }
  },
  BAZOOKA_BLAST_RADIUS: 116,
  BAZOOKA_KNOCKBACK: 28,
  BAZOOKA_EXPLOSION_TIME: 18,
  TOMAHAWK_COOLDOWN: 42,
  TOMAHAWK_THROW_SPEED: 13,
  TOMAHAWK_GRAVITY: 0.1,
  TOMAHAWK_SPIN_RATE: 0.35,
  TOMAHAWK_VOLLEY_SPREAD: 0.3,
  TOMAHAWK_VOLLEY_COOLDOWN: 180,
  PISTOL_DASH_SPEED: 10,
  PISTOL_DASH_TIME: 14,
  PISTOL_DASH_COOLDOWN: 45,
  KATANA_SLASH_COOLDOWN: 36,
  KATANA_PARRY_WINDOW: 39,
  KATANA_PARRY_HIT_COOLDOWN: 50,
  KATANA_PARRY_MISS_COOLDOWN: 180,
  KATANA_PARRY_LAUNCH: 12,
  KATANA_PARRY_SLOW_TIME: 60,
  KATANA_PARRY_INVINCIBILITY: 60,
  KATANA_SLASH_RANGE: 34,
  KATANA_SLASH_REACH: 28,
  KATANA_PARRY_REFLECT_SPEED: 1.6,
  KATANA_PARRY_SLOW_MULTIPLIER: 0.2,
  KATANA_SLASH_VISUAL_RADIUS: 42,
  KATANA_SLASH_VISUAL_ARC: 0.75,
  KATANA_SLASH_VISUAL_WIDTH: 7,
  KATANA_SLASH_VISUAL_LIFE: 9,

  LINE_WIDTH: 3,
  DOT_DISTANCE: 0.55,

  // --- adjustable enemy variables --------------------------------------
  ENEMY_START_DISTANCE: 280,
  ENEMY_RESPAWN_DISTANCE: 520,
  ENEMY_WINDUP_FRAMES: 60,
  ENEMY_SPAWN_HEIGHT: 100,
  ENEMY_HP: { drone: 25, drill: 45, greenBall4: 15, ase: 30 },
  ENEMY_RESPAWN_FRAMES: { drone: 210, drill: 120, greenBall4: 75, ase: 180 },
  CUOBID_SPEED: 1.3,
  CUOBID_DISTANCE_SPEED: 0.0025,
  CUOBID_MAX_SPEED: 8.5,
  CUOBID_COMBINED_SPEED_MULT: 1.9,
  CUOBID_GROUP_SIZE: 2,
  CUOBID_SIZE: 48,
  CUOBID_SPAWN_SPACING: 500,
  CUOBID_MERGE_DISTANCE: 72,
  CUOBID_HIT_KNOCKBACK: 6,
  CUOBID_KNOCKBACK_DECAY: 0.85,
  DRONE_FOLLOW_RATE: 0.02,
  DRONE_FAST_FOLLOW_RATE: 0.045,
  DRONE_HEIGHT_ABOVE_PLAYER: 105,
  DRONE_BULLET_SPEED: 5,
  DRONE_BULLET_LIFE: 100,
  DRONE_SHOT_INTERVAL: 22,
  DRONE_SHOTS: 2,
  DRONE_FIRE_TIME: 45,
  DRONE_BURST_COOLDOWN: 130,
  DRONE_FIRE_MOVE_FACTOR: 0.2,
  DRONE_COUNT: 1,
  DRONE_OFFSET_X: 150,          // each drone picks a random spot this far left/right of you (so they stack)
  DRONE_OFFSET_Y: 45,           // ...and this much random vertical variation
  DRONE_LEAD_FRAMES: 25,        // aims this many frames ahead of your velocity
  DRONE_MAX_SPEED: 6,           // top flying speed while approaching
  DRONE_FIRE_RANGE: 340,        // only starts a burst when this close to you
  // ASE (All Seeing Eye)
  ASE_RADIUS: 22,
  ASE_SPEED_MULT: 0.4,          // moves like a Cuboid (speeds up with distance) times this
  ASE_TELEPORT_INTERVAL: 240,   // frames between teleports
  ASE_TELEPORT_WARNING: 45,     // frames the destination ring is shown
  ASE_TELEPORT_DISTANCE: 380,   // how far ahead of you (horizontally) it lands
  ASE_MIN_DISTANCE: 260,        // never lands closer than this
  // ROLLER: copies your path, delayed. Stack N delays by BASE + N * STACK.
  ROLLER_RADIUS: 15,
  ROLLER_BASE_DELAY_FRAMES: 90,    // 1.5 s
  ROLLER_STACK_DELAY_FRAMES: 90,  // +1.5 s per extra roller
  DOMINO_WIDTH: 90,
  DOMINO_HEIGHT: 150,
  DOMINO_SPEED: 2.5,
  DOMINO_JUMP_SPEED: 7,
  DOMINO_JUMP_HEIGHT: 300,
  DOMINO_LEAP_RANGE: 220,
  DOMINO_TELEGRAPH_FRAMES: 32,
  DOMINO_GROUND_PAUSE_FRAMES: 55,
  DOMINO_SHOCKWAVE_RADIUS: 300,
  DOMINO_SHOCKWAVE_FORCE: 18,
  DOMINO_SHOCKWAVE_LIFE: 22,
  EVIL_SPIKE_WARNING_TIME: 40,
  EVIL_SPIKE_DASH_SPEED: 12,
  EVIL_SPIKE_DASH_TIME: 18,
  EVIL_SPIKE_SIZE: 24,
  DRILL_TURN_RATE: 0.14,
  DRILL_DASH_DELAY: 24,
  GREEN_BALL_COUNT: 2,
  GREEN_BALL_BOUNCE: 9,
  GREEN_BALL_SIZE: 30,
  GREEN_BALL_JUMP_INTERVAL: 75,
  GREEN_BALL_JUMP_SPEED: 6,
  GREEN_BALL_SPAWN_X_SPACING: 42,
  GREEN_BALL_SPAWN_Y_SPACING: 24,
  CUBOID_SPAWN_Y_RANGE: 180,

  RED_TESSERACTS_BASE: 10,
  RED_TESSERACTS_STEP: 5,
  GOLD_TESSERACTS_PER_LEVEL: 20,
  FIVE_CUBE_COUNT: 2,
  TESSERACT_COLLECTION_RANGE: 24,
  TESSERACT_MAGNET_BONUS: 20,
  BLESSING_EFFECTS: { jumpPower: 2, ammoBonus: 2, moveAcceleration: 0.05, dashFrames: 6 },
  LATER_LEVEL_JUMP_BONUS: 1,
  LATER_LEVEL_SPIKE_MARGIN: 5,
  BLESSING_COSTS: { jump: 3, ammo: 3, speed: 3, dash: 4, magnet: 4 },

  // Collapse timing is measured in frames (60 frames = 1 second).
  COLLAPSE_INTERVAL: 150,
  COLLAPSE_WARNING_FRAMES: 180,
  COLLAPSE_MAP_FRACTION: 0.5,

  PARTICLE_COUNT: 100,

  // Values used by curses.js. These are deliberately separate from the
  // normal tuning values so a curse can be changed without hunting through
  // gameplay code.
  CURSES: {
    roughEdging: { movementMultiplier: 0.90 },
    lowerGravity: { gravityMultiplier: 0.50, jumpPowerMultiplier: 0.65 },
    unstablePlain: { goldMultiplier: 2, collapseFrames: 10, warningFrames: 25 },
    wearAndTear: { damageMultiplier: 0.75 },
    fiveCube: { fakeTesseracts: true },
    batteryLife: { extraDrillDash: true },
    unknownDimension: { allowCuboidMerge: true },
    shotgunSlug: { focusedShot: true, bulletSpeed: 9 }
  },

  START_LEVEL: 0
};
