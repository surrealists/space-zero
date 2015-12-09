; (function () {

// --------------------------------------------------------------------------
// Custom game objects
// --------------------------------------------------------------------------

Game = function() {
  var w = 500;
  var h = 600;

  Phaser.Game.call(this, w, h, Phaser.AUTO, 'game');
};

Game.prototype = Object.create(Phaser.Game.prototype);
Game.prototype.constructor = Game;

Player = function(g) {
  var w = 25;
  var h = 25;
  var x = g.width / 2;
  var y = g.height * .9;

  //var bmd = g.add.bitmapData(w, h);
  //bmd.ctx.beginPath();
  //bmd.ctx.rect(0, 0, w, h);
  //bmd.ctx.fillStyle = '#ffffff';
  //bmd.ctx.fill();

  Phaser.Sprite.call(this, g, x, y, 'player_red');

  this.width = w;
  this.height = h;

  this.bulletTimer = 0;
  this.bulletSpeed = 400;
  this.bulletSpacing = 100;

  this.anchor.setTo(.5, .5)

  g.physics.arcade.enable(this);

  this.body.collideWorldBounds = true;
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.fire = function() {
  if (g.time.now < this.bulletTimer) {
    return;
  }

  var bullet = this.bullets.getFirstExists(false);

  if (!bullet) {
    return;
  }

  bullet.reset(this.x, this.y - this.height * .5);
  bullet.body.velocity.y = -this.bulletSpeed;

  this.bulletTimer = g.time.now + this.bulletSpacing;
};

PlayerBulletGroup = function(g) {
  Phaser.Group.call(this, g);

  var w = 5;
  var h = 20;

  //var bmd = g.add.bitmapData(w, h);
  //bmd.ctx.beginPath();
  //bmd.ctx.rect(0, 0, w, h);
  //bmd.ctx.fillStyle = '#ffffff';
  //bmd.ctx.fill();

  this.createMultiple(30, 'laser_red');

  this.setAll('width', w);
  this.setAll('height', h);
  this.setAll('anchor.x', 0.5);
  this.setAll('anchor.y', 0.5);
  this.setAll('checkWorldBounds', true);
  this.setAll('outOfBoundsKill', true);

  g.physics.arcade.enable(this);
};

PlayerBulletGroup.prototype = Object.create(Phaser.Group.prototype);
PlayerBulletGroup.prototype.constructor = PlayerBulletGroup;

EnemyGroup = function(g) {
  Phaser.Group.call(this, g);

  var w = 25;
  var h = 25

  //var bmd = g.add.bitmapData(w, h);
  //bmd.ctx.beginPath();
  //bmd.ctx.rect(0, 0, w, h);
  //bmd.ctx.fillStyle = '#aaaaaa';
  //bmd.ctx.fill();

  this.createMultiple(5, 'ufo_green');

  this.setAll('width', w);
  this.setAll('height', h);
  this.setAll('anchor.x', 0.5);
  this.setAll('anchor.y', 0.5);
  this.setAll('checkWorldBounds', true);
  this.setAll('outOfBoundsKill', true);

  g.physics.arcade.enable(this);
};

EnemyGroup.prototype = Object.create(Phaser.Group.prototype);
EnemyGroup.prototype.constructor = EnemyGroup;

// --------------------------------------------------------------------------
// Everything else
// --------------------------------------------------------------------------

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
var randInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var keys = {};
var colors = {grey: '#777777'};

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

var InitState = function() {};

InitState.prototype = {
  init: function() {},

  preload: function() {
      g.scale.pageAlignHorizontally = true;
      g.scale.pageAlignVertically = true;
      g.scale.refresh();

      g.state.start('title');
  }
};

var TitleState = function() {};

TitleState.prototype = {
  preload: function() {
    keys.enter = g.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    keys.delete = g.input.keyboard.addKey(Phaser.Keyboard.DELETE);

    var style = {fill: colors.grey, align: "center"};
    var text = g.add.text(
      g.world.centerX, g.world.centerY,
      'Press ENTER to start', style
    );

    text.anchor.setTo(0.5, 0.5);
  },

  update: function() {
    if (keys.enter.isDown) {
      g.state.start('game');
    }
  }
};

var GameState = function() {
  this.fireButton = null;
  this.p = null;
  this.enemies = null;
  this.arcade = null;
  this.emitter = null;
  this.dfc = 10; // distance from center
};

GameState.prototype = {
  launchEnemy: function() {
    var minSpacing = 300;
    var maxSpacing = 3000;

    g.time.events.add(
      randInt(minSpacing, maxSpacing),
      this.launchEnemy, this
    );

    var e = this.enemies.getFirstExists(false);

    if (!e) {
      return;
    }

    var x = randInt(0 + e.width / 2, g.width - e.width / 2);
    var y = 0 - e.height / 2;
    var speed = 100;

    e.reset(x, y);
    e.body.velocity.y = speed;
    e.health = 3;
    e.immovable = true;
  },

  followMouse: function() {
    var dfc = 10; //distance from center

    if ((this.p.x <= g.input.x + this.dfc && this.p.x >= g.input.x - this.dfc)
        && (this.p.y <= g.input.y + this.dfc && this.p.y >= g.input.y - this.dfc)) {
      this.p.body.velocity.setTo(0, 0);
      return;
    }

    this.arcade.moveToPointer(this.p, 400);
  },

  checkCollisions: function() {
    var cb = function(p, e) {
      p.kill();
      e.kill();
      g.state.start('gameOver');
    };
    this.arcade.collide(this.p, this.enemies, cb, null, this);

    var cb = function(b, e) {
      this.particleBurst(e.x, e.y);
      b.kill();
      e.damage(1);
    };
    this.arcade.overlap(this.p.bullets, this.enemies, cb, null, this);
  },

  particleBurst: function(x, y) {
    this.emitter.x = x;
    this.emitter.y = y;

    this.emitter.start(true, 500, null, 5);
  },

  preload: function() {
    g.renderer.renderSession.roundPixels = true;
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.arcade = this.game.physics.arcade;
    g.time.advancedTiming = true;

    g.load.image('player_red', 'img/player.png');
    g.load.image('ufo_green', 'img/ufo_green.png');
    g.load.image('laser_red', 'img/laser_red.png');
    g.load.image('explosion_particle', 'img/explosion_particle.png');
  },

  create: function() {
    this.fireButton = g.input.keyboard.addKey(Phaser.Keyboard.Z);

    this.p = new Player(g);
    g.add.existing(this.p);

    this.p.bullets = new PlayerBulletGroup(g);

    this.enemies = new EnemyGroup(g);

    this.launchEnemy();

    this.emitter = g.add.emitter(0, 0, 100);

    var w = 5;
    var h = 5;

    var bmd = g.add.bitmapData(w, h);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, w, h);
    bmd.ctx.fillStyle = '#ffffff';
    bmd.ctx.fill();

    this.emitter.makeParticles(bmd);

    this.emitter.gravity = 0;
    this.emitter.setAlpha(.5, .5);
    this.emitter.setXSpeed(-2000, 2000);
    this.emitter.setYSpeed(-2000, 2000);
  },

  update: function() {
    this.followMouse();

    if (this.fireButton.isDown) {
      this.p.fire();
    }

    if (keys.delete.isDown) {
      g.state.start('gameOver');
    }

    this.checkCollisions();
  },

  render: function() {
    //uncomment to debug physics
    /*
    g.debug.body(this.p);

    var cb = function(enemy) {
      g.debug.body(enemy);
    }

    this.enemies.forEachAlive(cb, this);

    g.debug.text(g.time.fps || '--', 2, 14, '#00ff00');
    */
  }
};

var GameOverState = function() {};

GameOverState.prototype = {
  preload: function() {
    var style = {fill: colors.grey, align: "center"};
    var text = g.add.text(
      g.world.centerX, g.world.centerY,
      'GAME OVER\nPress ENTER to continue', style
    );

    text.anchor.setTo(0.5, 0.5);
  },

  update: function() {
    if (keys.enter.isDown) {
      g.state.start('game');
    }
  }
};

// ----------------------------------------------------------------------------
// Game creation and states loading
// ----------------------------------------------------------------------------

var g = new Game();

g.state.add('init', InitState);
g.state.add('title', TitleState);
g.state.add('game', GameState);
g.state.add('gameOver', GameOverState);

g.state.start('init');

}());
