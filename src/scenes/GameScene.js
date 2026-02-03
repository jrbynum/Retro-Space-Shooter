import Phaser from 'phaser';
import Boss from '../objects/Boss';
import PowerUp from '../objects/PowerUp';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.lives = data.lives !== undefined ? data.lives : 3;
        this.weaponLevel = data.weaponLevel || 1;
        this.shipId = data.shipId || 1;
        this.volume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
        this.enemiesKilled = data.enemiesKilled || 0;
        this.enemiesMissed = data.enemiesMissed || 0;
        this.timeScale = 1.0;
    }

    create() {
        // --- State ---
        this.scoreInLevel = 0;
        this.bossThreshold = 1000;
        this.waveActive = true;
        this.bossTriggered = false;
        this.bossActive = false;
        this.isShielded = false;
        this.shieldTime = 0;
        this.isPaused = false;
        this.isRestarting = false;
        this.difficulty = 1 + (this.level - 1) * 0.25;

        // --- PowerUp Handling ---
        this.events.off('resume');
        this.events.on('resume', (scene, data) => {
            if (data && data.powerUp) this.applyPowerUp(data.powerUp);
        });

        // --- Visuals ---
        const bgId = ((this.level - 1) % 20) + 1;
        this.bg = this.add.tileSprite(0, 0, 400, 300, `bg_${bgId}`).setOrigin(0, 0);
        this.stars = this.add.tileSprite(0, 0, 400, 300, 'stars').setOrigin(0, 0);

        // --- Audio ---
        this.sound.volume = this.volume;
        this.currentMusic = this.sound.add(`m_${bgId}`, { loop: true });
        this.currentMusic.play();

        // --- Groups ---
        this.lasers = this.physics.add.group({ defaultKey: 'laser' });
        this.enemies = this.physics.add.group();
        this.bossBolts = this.physics.add.group({ defaultKey: 'boss_bolt' });
        this.ufos = this.physics.add.group();
        this.boss = null;

        // --- Player ---
        const playerTex = `ship_${this.shipId}`;
        this.player = this.physics.add.sprite(200, 250, playerTex, 0);
        this.player.setCollideWorldBounds(true).setDepth(100);
        if (this.shipId === 4) this.player.setScale(0.4);
        
        this.playerTwin = this.add.sprite(0, 0, playerTex, 0).setVisible(false).setAlpha(0.7).setDepth(99);
        if (this.shipId === 4) this.playerTwin.setScale(0.4);

        this.shieldGlow = this.add.circle(0, 0, 30, 0x00ffff, 0.2).setDepth(101).setVisible(false);
        this.shieldGlow.setStrokeStyle(2, 0x00ffff, 0.8);

        // --- Physics ---
        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.bossBolts, this.hitPlayer, null, this);

        // --- UI ---
        this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { fontSize: '12px', fill: '#fff', fontFamily: 'monospace' });
        this.livesText = this.add.text(10, 22, `Lives: ${'❤️'.repeat(this.lives)}`, { fontSize: '12px' });
        this.levelText = this.add.text(330, 10, `LVL ${this.level}`, { fontSize: '12px', fill: '#ff0', fontFamily: 'monospace' });
        this.volumeText = this.add.text(10, 34, `VOL: ${Math.round(this.volume * 10)}`, { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' });
        
        this.shieldTimerText = this.add.text(200, 250, '', { fontSize: '14px', fill: '#0ff', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false).setDepth(2000);
        this.statusText = this.add.text(200, 280, '', { fontSize: '10px', fill: '#0ff', fontFamily: 'monospace' }).setOrigin(0.5);
        this.pauseText = this.add.text(200, 150, 'PAUSED', { fontSize: '20px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false).setDepth(4000);

        this.hb = this.add.graphics().setDepth(3000);
        this.hpText = this.add.text(200, 20, '', { fontSize: '10px', fill: '#0f0', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(2001);
        this.bossText = this.add.text(200, 150, 'BOSS INBOUND', { fontSize: '24px', fill: '#f00', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false);

        // --- Loops ---
        if(!this.anims.exists('explode')) {
            this.anims.create({ key: 'explode', frames: this.anims.generateFrameNumbers('explosion'), frameRate: 15, hideOnComplete: true });
        }
        this.spawnTimer = this.time.addEvent({ delay: 1500 / this.difficulty, callback: this.spawnEnemy, callbackScope: this, loop: true });
        
        // UFO Spawner: 30% slower -> Between 6500 and 15600
        this.ufoTimer = this.time.addEvent({ 
            delay: Phaser.Math.Between(6500, 15600), 
            callback: this.spawnUFO, 
            callbackScope: this, 
            loop: true 
        });

        this.input.keyboard.on('keydown-EQUALS', () => this.adjustVolume(0.1));
        this.input.keyboard.on('keydown-MINUS', () => this.adjustVolume(-0.1));
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        let pad = null;
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            pad = this.input.gamepad.getPad(0);
            if (pad && (pad.buttons[8].pressed || pad.buttons[9].pressed)) {
                if (this.time.now > (this.lastPauseTime || 0) + 500) { this.togglePause(); this.lastPauseTime = this.time.now; }
            }
        }

        if (this.isPaused || this.isRestarting) return;

        // Integer Scroll
        this.bg.tilePositionY -= Math.floor(1 * this.difficulty * this.timeScale);
        this.stars.tilePositionY -= Math.floor(2 * this.difficulty * this.timeScale);

        // --- SHIELD TIMER ---
        if (this.isShielded) {
            this.shieldTime -= this.game.loop.delta;
            const remaining = Math.ceil(this.shieldTime / 1000);
            this.shieldTimerText.setText(`SHIELD: ${remaining}s`).setVisible(true);
            this.player.setAlpha(0.5 + Math.sin(this.time.now / 100) * 0.2);
            this.shieldGlow.setPosition(this.player.x, this.player.y).setVisible(true);
            if (this.shieldTime <= 0) {
                this.isShielded = false;
                this.shieldTimerText.setVisible(false);
                this.player.setAlpha(1);
                this.shieldGlow.setVisible(false);
            }
        }

        if (this.weaponLevel === 2) {
            this.playerTwin.setPosition(this.player.x + 25, this.player.y).setVisible(true);
        }

        this.player.setVelocity(0);
        if (pad) {
            const stickX = pad.leftStick.x;
            const stickY = pad.leftStick.y;
            if (Math.abs(stickX) > 0.15) this.player.setVelocityX(200 * stickX);
            if (Math.abs(stickY) > 0.15) this.player.setVelocityY(200 * stickY);
            if (pad.buttons[14].pressed) this.player.setVelocityX(-200);
            else if (pad.buttons[15].pressed) this.player.setVelocityX(200);
            if (pad.buttons[12].pressed) this.player.setVelocityY(-200);
            else if (pad.buttons[13].pressed) this.player.setVelocityY(200);
            if (pad.buttons[0].pressed || pad.buttons[1].pressed || pad.buttons[2].pressed || pad.buttons[3].pressed) {
                if (this.time.now > (this.lastFireTime || 0) + 200) { this.fireLaser(); this.lastFireTime = this.time.now; }
            }
        }

        if (this.cursors.left.isDown) this.player.setVelocityX(-200);
        else if (this.cursors.right.isDown) this.player.setVelocityX(200);
        if (this.cursors.up.isDown) this.player.setVelocityY(-200);
        else if (this.cursors.down.isDown) this.player.setVelocityY(200);

        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) this.fireLaser();

        // --- BOSS ENGINE ---
        this.hb.clear();
        this.hpText.setText('');
        if (this.boss && this.boss.active && !this.boss.isDead) {
            this.boss.update();
            const barWidth = 240;
            const x = 80; const y = 50;
            this.hb.fillStyle(0x000000, 0.9).fillRect(x - 4, y - 4, barWidth + 8, 20); 
            this.hb.fillStyle(0x00ff00, 1).fillRect(x, y, barWidth * (this.boss.hp / this.boss.maxHp), 12);
            this.hpText.setPosition(200, y + 25).setText(`BOSS HP: ${Math.floor(this.boss.hp)}`);

            this.lasers.getChildren().forEach(laser => {
                if (laser.active) {
                    const dist = Phaser.Math.Distance.Between(laser.x, laser.y, this.boss.x, this.boss.y);
                    const radius = (this.boss.type === 2) ? 40 : (this.boss.displayWidth / 2);
                    if (dist < radius + 15) this.handleBossHit(laser, this.boss);
                }
            });

            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) < 40) {
                this.hitPlayer(this.player, this.boss);
            }
        }

        // UFO
        this.ufos.getChildren().forEach(ufo => {
            if (ufo.active) {
                this.lasers.getChildren().forEach(laser => {
                    if (laser.active && Phaser.Math.Distance.Between(laser.x, laser.y, ufo.x, ufo.y) < 35) {
                        this.handleUFOHit(laser, ufo);
                    }
                });
                if (ufo.x < -100 || ufo.x > 500) ufo.destroy();
            }
        });

        if (this.scoreInLevel >= this.bossThreshold && !this.bossTriggered) {
            this.bossTriggered = true;
            this.triggerBossSpawn();
        }

        this.lasers.getChildren().forEach(l => { if (l.y < -10) l.destroy(); });
        this.enemies.getChildren().forEach(e => { 
            if (e.y > 310) {
                if (e.active && !e.isBoss) {
                    this.enemiesMissed++;
                    if (e.getData('isHealer') && this.boss && this.boss.active && !this.boss.isDead) {
                        this.healBoss(Math.floor(this.boss.maxHp * 0.05));
                    }
                }
                e.destroy();
            }
        });
        this.bossBolts.getChildren().forEach(b => { if (b.y > 310) b.destroy(); });
    }

    fireLaser() {
        if (this.isPaused || this.isRestarting) return;
        this.sound.play('laserSfx');
        this.spawnLaser(this.player.x, this.player.y - 10);
        if (this.weaponLevel === 2) this.spawnLaser(this.player.x + 25, this.player.y - 10);
    }

    spawnLaser(x, y) {
        const l = this.lasers.get(x, y);
        if(l && l.body) { l.setActive(true).setVisible(true); l.body.velocity.y = -300; }
    }

    spawnUFO() {
        if (this.isPaused || this.isRestarting) return;
        const side = Phaser.Math.Between(0, 1);
        const ufo = this.ufos.create(side === 0 ? -40 : 440, 30, 'ufo');
        if (ufo && ufo.body) {
            ufo.setScale(0.3).setDepth(150);
            ufo.setVelocityX(Phaser.Math.Between(120, 220) * (side === 0 ? 1 : -1));
            ufo.body.setAllowGravity(false);
        }
    }

    handleUFOHit(laser, ufo) {
        laser.destroy(); ufo.destroy();
        this.sound.play('explosionSfx');
        this.scene.pause();
        this.scene.launch('PowerUpMenuScene');
    }

    applyPowerUp(choice) {
        if (choice === 'SHIELD') {
            this.isShielded = true;
            this.shieldTime = 20000;
        } else if (choice === 'TWIN') {
            this.weaponLevel = 2;
        } else if (choice === 'SLOW') {
            this.timeScale = 0.7;
            this.time.delayedCall(30000, () => { if(this.active) this.timeScale = 1.0; });
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause(); this.spawnTimer.paused = true; this.ufoTimer.paused = true;
            this.pauseText.setVisible(true); this.currentMusic.pause();
        } else {
            this.physics.resume(); this.spawnTimer.paused = false; this.ufoTimer.paused = false;
            this.pauseText.setVisible(false); this.currentMusic.resume();
        }
    }

    adjustVolume(amount) {
        this.volume = Phaser.Math.Clamp(this.volume + amount, 0, 1);
        this.sound.volume = this.volume;
        localStorage.setItem('gameVolume', this.volume.toString());
        this.volumeText.setText(`VOL: ${Math.round(this.volume * 10)}`);
    }

    healBoss(amount) {
        if (!this.boss || !this.boss.active || this.boss.isDead) return;
        this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + amount);
        this.boss.setTint(0x00ff00);
        this.time.delayedCall(200, () => { if(this.boss && this.boss.active) this.boss.clearTint(); });
    }

    triggerBossSpawn() {
        this.waveActive = false;
        this.bossActive = true;
        this.sound.stopAll();
        const music = this.sound.add('music_boss', { loop: true });
        music.play();
        this.bossText.setVisible(true);
        this.time.delayedCall(2000, () => {
            if (this.isRestarting) return;
            this.bossText.setVisible(false);
            this.boss = new Boss(this, 200, -50, this.level);
            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    if (!this.isPaused && !this.isRestarting && this.boss && this.boss.active && !this.boss.isDead && this.boss.y > 20) {
                        const bolt = this.bossBolts.get(this.boss.x, this.boss.y + 40);
                        if (bolt && bolt.body) { bolt.setActive(true).setVisible(true); bolt.body.velocity.y = 200 * this.timeScale; }
                    }
                },
                loop: true
            });
        });
    }

    handleBossHit(laser, boss) {
        if (boss.isDead || boss.hitCooldown) return;
        laser.setActive(false).setVisible(false);
        boss.hp -= 5; boss.setTint(0xff0000); boss.hitCooldown = true;
        this.time.delayedCall(100, () => { if (boss.active) { boss.clearTint(); boss.hitCooldown = false; } });
        if (boss.hp <= 0) {
            boss.isDead = true; this.enemiesKilled++; this.handleBossVictory(boss);
        }
        this.time.delayedCall(1, () => laser.destroy());
    }

    handleBossVictory(boss) {
        if (this.isRestarting) return;
        this.isRestarting = true;
        this.waveActive = false;
        this.sound.stopAll();
        
        boss.setVelocity(0, 0);
        this.add.sprite(boss.x, boss.y, 'explosion').setScale(5).play('explode');
        this.sound.play('explosionSfx');
        this.hb.clear(); this.hpText.setText('');
        
        const winText = this.add.text(200, 140, 'SECTOR CLEAR', { fontSize: '24px', fill: '#0f0', fontFamily: 'monospace' }).setOrigin(0.5);
        const promptText = this.add.text(200, 180, 'Press SPACE to Warp', { fontSize: '14px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5);
        
        // --- WAIT FOR USER INPUT ---
        const startNextLevel = () => {
            const nl = this.level + 1;
            const nlv = Math.min(5, this.lives + (nl % 5 === 0 ? 1 : 0));
            this.scene.restart({ level: nl, score: this.score, lives: nlv, weaponLevel: this.weaponLevel, volume: this.volume, enemiesKilled: this.enemiesKilled, enemiesMissed: this.enemiesMissed, shipId: this.shipId });
        };

        this.input.keyboard.once('keydown-SPACE', startNextLevel);
        if (this.input.gamepad) {
            this.input.gamepad.once('down', startNextLevel);
        }
        
        this.time.delayedCall(10, () => boss.destroy());
    }

    hitEnemy(laser, enemy) {
        if (!laser.active || !enemy.active) return;
        laser.disableBody(true, true);
        this.time.delayedCall(1, () => laser.destroy());
        this.add.sprite(enemy.x, enemy.y, 'explosion').play('explode');
        this.sound.play('explosionSfx');
        enemy.destroy();
        this.score += 100;
        this.scoreInLevel += 100;
        this.enemiesKilled++;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    hitPlayer(p, hazard) {
        if (this.isRestarting) return;
        const isHazardDead = hazard.isDead || false;
        if (!hazard.active || isHazardDead) return;
        if (this.isShielded) { if (hazard !== this.boss) hazard.destroy(); return; }
        
        this.lives--; this.livesText.setText(`Lives: ${'❤️'.repeat(this.lives)}`);
        if (hazard !== this.boss) hazard.destroy();
        this.sound.play('hurtSfx'); this.cameras.main.shake(200, 0.01);
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            const pad = this.input.gamepad.getPad(0);
            if (pad && pad.vibration) pad.vibration.playEffect('dual-rumble', { duration: 500, weakMagnitude: 1.0, strongMagnitude: 1.0 });
        }
        this.sound.play('explosionSfx');
        this.isShielded = true; 
        this.shieldTime = 2000; // 2s recovery shield
        
        if (this.lives <= 0) {
            this.isRestarting = true;
            this.physics.pause(); this.sound.stopAll();
            this.add.sprite(p.x, p.y, 'explosion').setScale(2).play('explode');
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { score: this.score, level: this.level, enemiesKilled: this.enemiesKilled, enemiesMissed: this.enemiesMissed });
            });
        }
    }

    spawnEnemy() {
        if (this.isPaused || this.isRestarting) return;
        const isBossFight = (this.boss && this.boss.active && !this.boss.isDead);
        if (isBossFight && Phaser.Math.Between(0, 100) > 25) return;
        if (!this.waveActive && !isBossFight) return;
        
        const x = Phaser.Math.Between(20, 380);
        const enemyKey = `e_${((this.level - 1) % 20) + 1}`;
        const e = this.enemies.create(x, -20, enemyKey);
        if (e && e.body) {
            if (e.width > 150) e.setScale(0.3); else if (e.width > 64) e.setScale(0.5); else if (e.width < 20) e.setScale(2);
            e.setVelocityY(100 * this.difficulty * this.timeScale);
            if (isBossFight) { e.setTint(0x00ff00); e.setData('isHealer', true); }
        }
    }
}