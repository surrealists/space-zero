// ----------------------------------------------------------------------------
// init state
// ----------------------------------------------------------------------------

var initState = {
  preload: function() {
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    game.state.start('title');
  }
};

// ----------------------------------------------------------------------------
// title state
// ----------------------------------------------------------------------------

var enterKey;
var deleteKey;

var greyColor = '#777777';

var titleState = {
  preload: function() {
    enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    deleteKey = game.input.keyboard.addKey(Phaser.Keyboard.DELETE);

    var style = {fill: greyColor, align: "center"};
    var text = game.add.text(
      game.world.centerX, game.world.centerY,
      'Press ENTER to start', style
    );

    text.anchor.setTo(0.5, 0.5);
  },
  update: function() {
    if (enterKey.isDown) {
      game.state.start('game');
    }
  }
};

// ----------------------------------------------------------------------------
// game state
// ----------------------------------------------------------------------------

var player;
var blackEnemies;
var cursors;
var bullets;
var fireButton;
var bulletTimer = 0;

var onCursorsPress = function() {
  var PLAYER_VELOCITY = 300;
  player.body.velocity.setTo(0, 0);

  if (cursors.left.isDown)  { player.body.velocity.x += -PLAYER_VELOCITY; }
  if (cursors.right.isDown) { player.body.velocity.x += PLAYER_VELOCITY; }
  if (cursors.up.isDown)    { player.body.velocity.y += -PLAYER_VELOCITY; }
  if (cursors.down.isDown)  { player.body.velocity.y += PLAYER_VELOCITY; }
};

var fireBullet = function() {
  if (game.time.now < bulletTimer) {
    return;
  }

  var BULLET_SPEED = 400;
  var BULLET_SPACING = 250;

  var bullet = bullets.getFirstExists(false);

  if (!bullet) {
    return;
  }

  bullet.reset(player.x, player.y - player.height * 0.7);
  bullet.body.velocity.y = -BULLET_SPEED;

  bulletTimer = game.time.now + BULLET_SPACING;
};

var onFireButtonPress = function() {
  if (fireButton.isDown) {
    fireBullet();
  }
};

var onDeleteKeyPress = function() {
  if (deleteKey.isDown) {
    game.state.start('gameOver');
  }
};

var createPlayer = function() {
  var PLAYER_WIDTH = 50;
  var PLAYER_HEIGHT = 50;
  player = game.add.sprite(game.width / 2, game.height * .9, 'ship');
  player.anchor.setTo(0.5, 0.5);
  player.width = PLAYER_WIDTH;
  player.height = PLAYER_HEIGHT;

  game.physics.enable(player, Phaser.Physics.ARCADE);

  player.body.collideWorldBounds = true;
};

var createPlayerBullets = function() {
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'blueBullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);
};

var createBlackEnemies = function() {
  blackEnemies = game.add.group();
  blackEnemies.enableBody = true;
  blackEnemies.physicsBodyType = Phaser.Physics.ARCADE;
  blackEnemies.createMultiple(5, 'blackEnemy');
  blackEnemies.setAll('anchor.x', 0.5);
  blackEnemies.setAll('anchor.y', 0.5);
  blackEnemies.setAll('scale.x', 0.5);
  blackEnemies.setAll('scale.y', 0.5);
  blackEnemies.setAll('outOfBoundsKill', true);
  blackEnemies.setAll('checkWorldBounds', true);
};

var launchBlackEnemy = function() {
  var MIN_ENEMY_SPACING = 300;
  var MAX_ENEMY_SPACING = 3000;
  var ENEMY_SPEED = 300;

  game.time.events.add(
    game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING),
    launchBlackEnemy
  );

  var enemy = blackEnemies.getFirstExists(false);

  if (!enemy) {
    return;
  }

  enemy.reset(game.rnd.integerInRange(0, game.width), 20);
  enemy.body.velocity.x = game.rnd.integerInRange(-300, 300);
  enemy.body.velocity.y = ENEMY_SPEED;
  enemy.body.drag.x = 100;
};

var preload = function() {
  game.load.image('ship', 'assets/playerShip3_blue.png');
  game.load.image('blackEnemy', 'assets/enemyBlack3.png');
  game.load.image('blueBullet', 'assets/laserBlue03.png');
  game.load.image('redBullet', 'assets/laserRed03.png');
};

var create = function() {
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  createPlayer();
  createPlayerBullets();
  createBlackEnemies();

  launchBlackEnemy();
};

var update = function() {
  onCursorsPress();
  onFireButtonPress();
  onDeleteKeyPress();
};

var render = function() {};

var gameState = {
  preload: preload,
  create: create,
  update: update,
  render: render
};

// ----------------------------------------------------------------------------
// game over state
// ----------------------------------------------------------------------------

var gameOverState = {
  preload: function() {
    var style = {fill: greyColor, align: "center"};
    var text = game.add.text(
        game.world.centerX, game.world.centerY,
        'GAME OVER\nPress ENTER to continue', style
    );

    text.anchor.setTo(0.5, 0.5);
  },
  update: function() {
    if (enterKey.isDown) {
      game.state.start('game');
    }
  }
};

// ----------------------------------------------------------------------------
// game creation
// ----------------------------------------------------------------------------

var WIDTH = 500;
var HEIGHT = 600;

var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game');

game.state.add('init', initState);
game.state.add('title', titleState);
game.state.add('game', gameState);
game.state.add('gameOver', gameOverState);

game.state.start('init');
