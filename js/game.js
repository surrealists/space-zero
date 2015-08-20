; (function () {

  var WIDTH = 500;
  var HEIGHT = 600;

  var keys = {};
  var colors = {grey: '#777777'};

  var player;
  var blackEnemies;
  var cursors;
  var bullets;
  var fireButton;
  var bulletTimer = 0;

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

  var launchBlackEnemy = function() {
    var MIN_ENEMY_SPACING = 300;
    var MAX_ENEMY_SPACING = 3000;
    var ENEMY_SPEED = 100;

    game.time.events.add(
      game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING),
      launchBlackEnemy
    );

    var enemy = blackEnemies.getFirstExists(false);

    if (!enemy) {
      return;
    }

    var x = game.rnd.integerInRange(
      0 + enemy.width / 2,
      game.width - enemy.width / 2
    );
    var y = 0 - enemy.height / 2;

    enemy.reset(x, y);
    enemy.body.velocity.y = ENEMY_SPEED;
  };

  var states = {
    init: {
      preload: function() {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.refresh();

        game.state.start('title');
      }
    },

    title: {
      preload: function() {
        keys.enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        keys.delete = game.input.keyboard.addKey(Phaser.Keyboard.DELETE);

        var style = {fill: colors.grey, align: "center"};
        var text = game.add.text(
          game.world.centerX, game.world.centerY,
          'Press ENTER to start', style
        );

        text.anchor.setTo(0.5, 0.5);
      },

      update: function() {
        if (keys.enter.isDown) {
          game.state.start('game');
        }
      }
    },

    game: {
      preload: function() {
        game.load.image('ship', 'assets/playerShip3_blue.png');
        game.load.image('blackEnemy', 'assets/enemyBlack3.png');
        game.load.image('blueBullet', 'assets/laserBlue03.png');
        game.load.image('redBullet', 'assets/laserRed03.png');
      },

      create: function() {
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        var createPlayer = function() {
          var PLAYER_WIDTH = 50;
          var PLAYER_HEIGHT = 50;

          player = game.add.sprite(game.width / 2, game.height * .9, 'ship');
          player.anchor.setTo(0.5, 0.5);
          player.width = PLAYER_WIDTH;
          player.height = PLAYER_HEIGHT;

          game.physics.enable(player, Phaser.Physics.ARCADE);

          player.body.collideWorldBounds = true;

          player.body.setSize(player.width * 1, player.height * 1);
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

          blackEnemies.forEach(function(enemy) {
            enemy.body.setSize(enemy.width, enemy.height * 3/4);
          });
        };

        createPlayer();
        createPlayerBullets();
        createBlackEnemies();

        launchBlackEnemy();
      },

      update: function() {
        var onPressCursors = function() {
          var PLAYER_VELOCITY = 300;
          player.body.velocity.setTo(0, 0);

          if (cursors.left.isDown)  { player.body.velocity.x += -PLAYER_VELOCITY; }
          if (cursors.right.isDown) { player.body.velocity.x += PLAYER_VELOCITY; }
          if (cursors.up.isDown)    { player.body.velocity.y += -PLAYER_VELOCITY; }
          if (cursors.down.isDown)  { player.body.velocity.y += PLAYER_VELOCITY; }
        };

        var onPressFire = function() {
          if (fireButton.isDown) {
            fireBullet();
          }
        };

        var onPressDelete = function() {
          if (keys.delete.isDown) {
            game.state.start('gameOver');
          }
        };

        var checkCollisions = function() {
          var shipCollide = function(player, enemy) {
            enemy.kill();
          };

          game.physics.arcade.overlap(player, blackEnemies, shipCollide, null, this);
        };

        onPressCursors();
        onPressFire();
        onPressDelete();
        checkCollisions();
      },

      render: function() {
        game.debug.body(player);

        for (var i = 0; i < blackEnemies.length; i++) {
          game.debug.body(blackEnemies.children[i]);
        }
      }
    },

    gameOver: {
      preload: function() {
        var style = {fill: colors.grey, align: "center"};
        var text = game.add.text(
            game.world.centerX, game.world.centerY,
            'GAME OVER\nPress ENTER to continue', style
        );

        text.anchor.setTo(0.5, 0.5);
      },

      update: function() {
        if (keys.enter.isDown) {
          game.state.start('game');
        }
      }
    }
  }

  var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'game');

  game.state.add('init', states.init);
  game.state.add('title', states.title);
  game.state.add('game', states.game);
  game.state.add('gameOver', states.gameOver);

  game.state.start('init');

}());
