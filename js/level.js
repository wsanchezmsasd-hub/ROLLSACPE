/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.
   ===================================================================== */
var Level = {
  pieces: null, levels: null, grid: [], cols: 0, name: "", startX: 0, startY: 0, spawnStartCol: 0, spawnEndCol: -1, protectedPieceIndices: [], collapseOrder: [], collapsePieceCursor: 0,
  redTesseracts: [], goldTesseracts: [], fakeTesseracts: [], goldActive: false, collapseActive: false, collapseTimer: 0, collapseWarning: 0, collapseColumn: -1, collapseColumns: []
};

Level.loadData = function (whenDone) {
  fetch("data/pieces.json").then(function (r) { if (!r.ok) throw new Error("Could not load data/pieces.json"); return r.json(); }).then(function (piecesFile) {
    Level.pieces = piecesFile;
    return fetch("data/levels.json");
  }).then(function (r) { if (!r.ok) throw new Error("Could not load data/levels.json"); return r.json(); }).then(function (levelsFile) {
    Level.levels = levelsFile.levels;
    whenDone();
  }).catch(function (error) {
    document.getElementById("message").textContent = "Something went wrong, check the last file you edited. Error: " + error.message;
    console.error(error);
  });
};

Level.build = function (levelNumber) {
  var level = Level.getDefinition(levelNumber);
  level = { name: level.name, pieces: Level.arrangePieces(level.pieces) };
  Level.name = level.name; Level.grid = []; Level.redTesseracts = []; Level.goldTesseracts = []; Level.fakeTesseracts = []; Level.goldActive = false; Level.collapseActive = false; Level.collapseTimer = 0; Level.collapseWarning = 0; Level.collapseColumn = -1; Level.collapseColumns = []; Level.cols = level.pieces.length * CONFIG.PIECE_COLS; Level.spawnStartCol = 0; Level.spawnEndCol = -1; Level.protectedPieceIndices = []; Level.collapseOrder = []; Level.collapsePieceCursor = 0;
  Level.tesseractGoal = CONFIG.RED_TESSERACTS_BASE + levelNumber * CONFIG.RED_TESSERACTS_STEP;
  for (var row = 0; row < CONFIG.ROWS; row++) { Level.grid.push(""); }
  for (var p = 0; p < level.pieces.length; p++) {
    var piece = Level.pieces[level.pieces[p]];
    if (!piece) { console.error("No piece named '" + level.pieces[p] + "' in data/pieces.json"); piece = Level.pieces.flat; }
    if (Level.pieceHasStartOrFinish(level.pieces[p])) Level.protectedPieceIndices.push(p);
    for (var r = 0; r < CONFIG.ROWS; r++) { Level.grid[r] += piece[r]; }
  }
  Level.buildCollapseOrder(level.pieces.length);
  Level.findStart();
  Level.placeTesseracts(level.pieces);
};

Level.pieceHasStart = function (pieceName) {
  var piece = Level.pieces[pieceName];
  if (!piece) return false;
  for (var r = 0; r < CONFIG.ROWS; r++) { if (piece[r].indexOf("S") >= 0) return true; }
  return false;
};
// Spawn piece goes in the middle of the map; the finish stays at the far right end.
Level.arrangePieces = function (names) {
  var arranged = names.slice(), startIndex = -1;
  for (var i = 0; i < arranged.length; i++) { if (Level.pieceHasStart(arranged[i])) { startIndex = i; break; } }
  if (startIndex < 0) return arranged;
  var startPiece = arranged.splice(startIndex, 1)[0];
  arranged.splice(Math.floor(arranged.length / 2), 0, startPiece);
  return arranged;
};
Level.getDefinition = function (levelNumber) {
  if (levelNumber < Level.levels.length) return Level.levels[levelNumber];
  var source = Level.levels[levelNumber % Level.levels.length];
  var pieces = source.pieces.filter(function (pieceName) { return !Level.pieceHasStartOrFinish(pieceName); });
  var extraRounds = Math.floor(levelNumber / Level.levels.length) + 1;
  var generatedPieces = ["start"];
  for (var i = 0; i < extraRounds + 1; i++) generatedPieces = generatedPieces.concat(pieces);
  generatedPieces.push("finish");
  return { name: "Endless Level " + (levelNumber + 1), pieces: generatedPieces };
};
Level.pieceHasStartOrFinish = function (pieceName) {
  var piece = Level.pieces[pieceName];
  if (!piece) return false;
  for (var r = 0; r < CONFIG.ROWS; r++) { if (piece[r].indexOf("S") >= 0 || piece[r].indexOf("F") >= 0) return true; }
  return false;
};
Level.buildCollapseOrder = function (pieceCount) {
  var protectedPieces = Level.protectedPieceIndices;
  for (var left = 0, right = pieceCount - 1; left <= right; left++, right--) {
    if (protectedPieces.indexOf(left) < 0) Level.collapseOrder.push(left);
    if (right !== left && protectedPieces.indexOf(right) < 0) Level.collapseOrder.push(right);
  }
};

Level.placeTesseracts = function (pieceNames) {
  var authored = [];
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      if (Level.grid[row].charAt(col) === "T") authored.push({ x: col * CONFIG.TILE + CONFIG.TILE / 2, y: row * CONFIG.TILE + CONFIG.TILE / 2 });
    }
  }
  pieceNames.forEach(function (pieceName, pieceIndex) {
    var spots = Level.pieces._tesseracts && Level.pieces._tesseracts[pieceName];
    if (!spots) return;
    spots.forEach(function (spot) { authored.push({ x: (pieceIndex * CONFIG.PIECE_COLS + spot[0]) * CONFIG.TILE + CONFIG.TILE / 2, y: spot[1] * CONFIG.TILE + CONFIG.TILE / 2 }); });
  });
  var selected = authored; // use however many the level actually has
  if (!selected.length) { // safety net: a level with zero authored tesseracts would be instantly "complete"
    var candidates = [];
    for (var col2 = 2; col2 < Level.cols - 2; col2++) for (var row2 = 1; row2 < CONFIG.ROWS - 1; row2++) {
      if (Level.charAt(col2, row2) === "." && Level.charAt(col2, row2 - 1) === "." && !Level.isSpike(col2, row2 + 1) && !Level.isSpike(col2, row2)) {
        var x = col2 * CONFIG.TILE + CONFIG.TILE / 2, y = row2 * CONFIG.TILE + CONFIG.TILE / 2;
        if (!selected.some(function (spot) { return spot.x === x && spot.y === y; })) candidates.push({ x: x, y: y });
      }
    }
    var needed = Level.tesseractGoal - selected.length;
    var step = Math.max(1, Math.floor(candidates.length / needed));
    for (var i = 0; i < needed && candidates.length; i++) {
      var extra = candidates[Math.min(i * step, candidates.length - 1)];
      if (!selected.some(function (spot) { return spot.x === extra.x && spot.y === extra.y; })) selected.push(extra);
    }
  }
  Level.tesseractGoal = selected.length;
  Level.addTesseractSlots(selected);
  Level.placeFakeTesseracts();
};

Level.addTesseractSlots = function (spots) {
  var fakeCount = Game.hasCurse("fiveCube") && CONFIG.CURSES.fiveCube.fakeTesseracts ? Math.min(CONFIG.FIVE_CUBE_COUNT, Math.max(0, spots.length - 1)) : 0;
  var goldCount = Math.min(CONFIG.GOLD_TESSERACTS_PER_LEVEL, spots.length - fakeCount);
  var fakeIndex = {};
  for (var i = 0; i < fakeCount; i++) fakeIndex[Math.floor((i + 1) * spots.length / (fakeCount + 1))] = true;
  for (var j = 0; j < spots.length; j++) {
    if (fakeIndex[j]) { Level.fakeTesseracts.push({ x: spots[j].x, y: spots[j].y }); continue; }
    Level.redTesseracts.push({ x: spots[j].x, y: spots[j].y, collected: false });
    if (Level.goldTesseracts.length < goldCount) Level.goldTesseracts.push({ x: spots[j].x, y: spots[j].y, collected: false });
  }
};
Level.findTesseractSpot = function (reserved) {
  for (var col = 2; col < Level.cols - 2; col++) for (var row = 1; row < CONFIG.ROWS - 1; row++) {
    var x = col * CONFIG.TILE + CONFIG.TILE / 2, y = row * CONFIG.TILE + CONFIG.TILE / 2;
    if (Level.charAt(col, row) !== "." || Level.charAt(col, row - 1) !== "." || Level.isSpike(col, row + 1) || Level.isSpike(col, row)) continue;
    if (reserved.some(function (spot) { return spot.x === x && spot.y === y; })) continue;
    if (Level.redTesseracts.concat(Level.goldTesseracts).concat(Level.fakeTesseracts).some(function (spot) { return spot.x === x && spot.y === y; })) continue;
    return { x: x, y: y };
  }
  return null;
};
Level.placeFakeTesseracts = function () {};

Level.updateTesseracts = function () {
  var playerX = Player.x + CONFIG.PLAYER_SIZE / 2, playerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  Level.fakeTesseracts.forEach(function (tesseract) { if (Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < 24) Player.fakeTesseractHit = true; });
  var collectionRange = CONFIG.TESSERACT_COLLECTION_RANGE + Game.blessings.magnet * CONFIG.TESSERACT_MAGNET_BONUS;
  Level.redTesseracts.forEach(function (tesseract) {
    if (!tesseract.collected && Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < collectionRange) tesseract.collected = true;
  });
  if (!Level.goldActive && Level.redTesseracts.every(function (tesseract) { return tesseract.collected; })) { Level.goldActive = true; Level.collapseActive = true; Level.collapseTimer = Game.hasCurse("unstablePlain") ? CONFIG.CURSES.unstablePlain.collapseFrames : CONFIG.COLLAPSE_INTERVAL; }
  if (Level.goldActive) Level.goldTesseracts.forEach(function (tesseract) {
    if (!tesseract.collected && Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < collectionRange) { tesseract.collected = true; Game.goldTesseracts += Math.pow(CONFIG.CURSES.unstablePlain.goldMultiplier, Game.curseCount("unstablePlain")); }
  });
};

Level.updateCollapse = function () {
  if (!Level.collapseActive) return;
  if (Level.collapseWarning > 0) return;
  Level.collapseTimer--;
  if (Level.collapseTimer > 0) return;
  if (Game.hasCurse("unstablePlain")) Level.legacyCollapse();
  else Level.bigCollapse();
};
Level.legacyCollapse = function () {
  Level.collapseTimer = CONFIG.CURSES.unstablePlain.collapseFrames;
  Level.collapseColumns = Level.nextCollapseColumns();
  if (!Level.collapseColumns.length) { Level.collapseActive = false; return; }
  Level.collapseColumn = Level.collapseColumns[0];
  Level.collapseWarning = CONFIG.CURSES.unstablePlain.warningFrames;
};
Level.bigCollapse = function () {
  Level.collapseTimer = CONFIG.COLLAPSE_INTERVAL;
  Level.collapseColumns = Level.nextCollapseColumns();
  if (!Level.collapseColumns.length) { Level.collapseActive = false; return; }
  Level.collapseColumn = Level.collapseColumns[0];
  Level.collapseWarning = CONFIG.COLLAPSE_WARNING_FRAMES;
};
Level.nextCollapseColumns = function () {
  var collapseLimit = Math.ceil(Level.collapseOrder.length * Math.max(0, Math.min(1, CONFIG.COLLAPSE_MAP_FRACTION)));
  if (Level.collapsePieceCursor >= collapseLimit) return [];
  var pieceIndex = Level.collapseOrder[Level.collapsePieceCursor++];
  var columns = [];
  for (var col = pieceIndex * CONFIG.PIECE_COLS; col < (pieceIndex + 1) * CONFIG.PIECE_COLS; col++) columns.push(col);
  return columns;
};
Level.columnHasTesseract = function (column) {
  return Level.redTesseracts.concat(Level.goldTesseracts).concat(Level.fakeTesseracts).some(function (tesseract) { return Math.floor(tesseract.x / CONFIG.TILE) === column; });
};
Level.columnHasTerrain = function (column) {
  for (var row = 0; row < CONFIG.ROWS; row++) if (Level.isSolid(column, row) || Level.isSpike(column, row)) return true;
  return false;
};
Level.finishCollapse = function () {
  if (Level.collapseWarning <= 0 || Level.collapseColumn < 0) return;
  Level.collapseWarning--;
  if (Level.collapseWarning > 0) return;

  var columns = Level.collapseColumns.slice();
  var minCol = Math.min.apply(null, columns), maxCol = Math.max.apply(null, columns);

  for (var row = 0; row < CONFIG.ROWS; row++) {
    // Convert the map row into a clean array of single characters
    var rowChars = Level.grid[row].split("");
    
    // Clear out both standard blocks and spikes on the collapsing columns
    columns.forEach(function (col) {
      if (col >= 0 && col < Level.cols && !Level.isSpawnColumn(col)) {
        rowChars[col] = "."; 
      }
    });
    
    // Stitch the characters back into your level grid string
    Level.grid[row] = rowChars.join("");
  }

  // Gold tesseracts caught inside the collapsing zone are deleted, not just uncollectable.
  for (var g = Level.goldTesseracts.length - 1; g >= 0; g--) {
    var tesseract = Level.goldTesseracts[g];
    if (tesseract.collected) continue;
    var tesseractCol = Math.floor(tesseract.x / CONFIG.TILE);
    if (tesseractCol >= minCol && tesseractCol <= maxCol) Level.goldTesseracts.splice(g, 1);
  }

  Level.collapseColumns = [];
  Level.collapseColumn = -1;
};


Level.findStart = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) for (var col = 0; col < Level.cols; col++) {
    if (Level.charAt(col, row) === "S") { Level.startX = col * CONFIG.TILE; Level.startY = row * CONFIG.TILE; Level.spawnStartCol = Math.floor(col / CONFIG.PIECE_COLS) * CONFIG.PIECE_COLS; Level.spawnEndCol = Math.min(Level.cols - 1, Level.spawnStartCol + CONFIG.PIECE_COLS - 1); return; }
  }
  Level.startX = 0; Level.startY = 0;
};
Level.charAt = function (col, row) { if (row < 0 || row >= CONFIG.ROWS || col < 0 || col >= Level.cols) return "."; return Level.grid[row].charAt(col); };
Level.isSolid = function (col, row) { if (col >= Level.cols) return true; /* right-hand wall */ return Level.charAt(col, row) === "#"; };
Level.isSpawnColumn = function (col) { return Level.protectedPieceIndices.indexOf(Math.floor(col / CONFIG.PIECE_COLS)) >= 0; };
Level.isSpike = function (col, row) { return Level.charAt(col, row) === "^"; };
Level.isFinish = function (col, row) { return Level.goldActive && Level.charAt(col, row) === "F"; };
Level.destroyCircle = function (x, y, radius) {
  var firstCol = Math.floor((x - radius) / CONFIG.TILE), lastCol = Math.floor((x + radius) / CONFIG.TILE);
  var firstRow = Math.floor((y - radius) / CONFIG.TILE), lastRow = Math.floor((y + radius) / CONFIG.TILE);
  for (var row = firstRow; row <= lastRow; row++) for (var col = firstCol; col <= lastCol; col++) {
    var centerX = col * CONFIG.TILE + CONFIG.TILE / 2, centerY = row * CONFIG.TILE + CONFIG.TILE / 2;
    if (Math.hypot(centerX - x, centerY - y) <= radius && Level.charAt(col, row) === "#" && !Level.isSpawnColumn(col)) {
      if (row >= 0 && row < CONFIG.ROWS && col >= 0 && col < Level.cols) Level.grid[row] = Level.grid[row].substring(0, col) + "." + Level.grid[row].substring(col + 1);
    }
  }
  var playerX = Player.x + CONFIG.PLAYER_SIZE / 2, playerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = playerX - x, dy = playerY - y, distance = Math.hypot(dx, dy) || 1;
  if (distance < radius + CONFIG.PLAYER_RADIUS) {
    var force = CONFIG.BAZOOKA_KNOCKBACK * (1 - Math.min(distance / radius, 1));
    Player.vx += dx / distance * force;
    Player.vy += dy / distance * force;
  }
};
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };