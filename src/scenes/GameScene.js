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
        this.isRestarting = false;
        this.bossActive = false;
        this.bossTriggered = false;
        this.waveActive = true;
        this.isPaused = false;
        this.isShielded = false;
        this.shieldTime = 0;
        this.scoreInLevel = 0;
        this.bossThreshold = 1000;
        this.difficulty = 1 + (this.level - 1) * 0.25;

        // --- Visuals (Fixed for Seams) ---
        const bgId = ((this.level - 1) % 20) + 1;
        const bgKey = `bg_${bgId}`;
        
        this.bg1 = this.add.image(0, 0, bgKey).setOrigin(0, 0);
        this.bg2 = this.add.image(0, 0, bgKey).setOrigin(0, 0).setFlipY(true);
        
        const targetWidth = 400;
        const scale = targetWidth / this.bg1.width;
        this.bgHeight = Math.floor(this.bg1.height * scale);
        
        this.bg1.setDisplaySize(targetWidth, this.bgHeight);
        this.bg2.setDisplaySize(targetWidth, this.bgHeight);
        this.bg2.y = -this.bgHeight + 2; // 2px overlap to hide seams
        
        this.stars = this.add.tileSprite(0, 0, 400, 300, 'stars').setOrigin(0, 0).setAlpha(0.4).setDepth(1);

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

        // --- Entities ---
        const playerTex = `ship_${this.shipId}`;
        this.player = this.physics.add.sprite(200, 250, playerTex, 0);
        this.player.setCollideWorldBounds(true).setDepth(100);
        if (this.shipId === 4) this.player.setScale(0.4);
        
        this.playerTwin = this.add.sprite(0, 0, playerTex, 0).setVisible(false).setAlpha(0.7).setDepth(99);
        if (this.shipId === 4) this.playerTwin.setScale(0.4);

        this.shieldGlow = this.add.circle(0, 0, 30, 0x00ffff, 0.2).setDepth(101).setVisible(false);
        this.shieldGlow.setStrokeStyle(2, 0x00ffff, 0.8);

        // --- UI ---
        this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { fontSize: '12px', fill: '#fff', fontFamily: 'monospace' });
        this.livesText = this.add.text(10, 22, `Lives: ${'❤️'.repeat(this.lives)}`, { fontSize: '12px' });
        this.levelText = this.add.text(330, 10, `LVL ${this.level}`, { fontSize: '12px', fill: '#ff0', fontFamily: 'monospace' });
        this.volumeText = this.add.text(10, 34, `VOL: ${Math.round(this.volume * 10)}`, { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' });
        this.shieldTimerText = this.add.text(200, 250, '', { fontSize: '14px', fill: '#0ff', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false).setDepth(2000);
        this.pauseText = this.add.text(200, 150, 'PAUSED', { fontSize: '20px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false).setDepth(4000);

        this.hb = this.add.graphics().setDepth(3000);
        this.hpText = this.add.text(200, 20, '', { fontSize: '10px', fill: '#0f0', fontStyle: 'bold', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(2001);
        this.bossText = this.add.text(200, 150, 'BOSS INBOUND', { fontSize: '24px', fill: '#f00', fontFamily: 'monospace' }).setOrigin(0.5).setVisible(false);

        // --- Timers ---
        if(!this.anims.exists('explode')) {
            this.anims.create({ key: 'explode', frames: this.anims.generateFrameNumbers('explosion'), frameRate: 15, hideOnComplete: true });
        }
        this.spawnTimer = this.time.addEvent({ delay: 1500 / this.difficulty, callback: this.spawnEnemy, callbackScope: this, loop: true });
        this.ufoTimer = this.time.addEvent({ delay: Phaser.Math.Between(10000, 20000), callback: this.spawnUFO, callbackScope: this, loop: true });

        // --- Input (Safe) ---
        this.keys = {
            volUp: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUALS),
            volUpNum: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD),
            volDown: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
            volDownNum: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT),
            pause: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };
        this.cursors = this.input.keyboard.createCursorKeys();

        this.events.off('resume');
        this.events.on('resume', (scene, data) => {
            if (data && data.powerUp) this.applyPowerUp(data.powerUp);
        });

        // --- Physics Colliders (MOVED TO END TO PREVENT CRASH) ---
        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.bossBolts, this.hitPlayer, null, this);
        this.physics.add.overlap(this.lasers, this.ufos, (l, u) => this.handleUFOHit(l, u), null, this);
    }

    update(time, delta) {
        let pad = null;
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            pad = this.input.gamepad.getPad(0);
            if (pad && (pad.buttons[8].pressed || pad.buttons[9].pressed)) {
                if (time > (this.lastPauseTime || 0) + 500) { this.togglePause(); this.lastPauseTime = time; }
            }
        }

        if (this.isPaused || this.isRestarting) return;

        // Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.volUp) || Phaser.Input.Keyboard.JustDown(this.keys.volUpNum)) this.adjustVolume(0.1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.volDown) || Phaser.Input.Keyboard.JustDown(this.keys.volDownNum)) this.adjustVolume(-0.1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePause();
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this.fireLaser();

        // Scrolling
        const speed = Math.floor(1 * this.difficulty * this.timeScale);
        this.bg1.y += speed;
        this.bg2.y += speed;
        this.stars.tilePositionY -= speed * 2;
        if (this.bg1.y >= 300) this.bg1.y = this.bg2.y - this.bgHeight + 2;
        if (this.bg2.y >= 300) this.bg2.y = this.bg1.y - this.bgHeight + 2;

        // Shield
        if (this.isShielded) {
            this.shieldTime -= delta;
            if (this.shieldTime > 2000) {
                this.shieldTimerText.setText(`SHIELD: ${Math.ceil(this.shieldTime/1000)}s`).setVisible(true);
            } else {
                this.shieldTimerText.setVisible(false);
            }
            this.player.setAlpha(0.5 + Math.sin(time / 100) * 0.2);
            this.shieldGlow.setPosition(this.player.x, this.player.y).setVisible(true);
            if (this.shieldTime <= 0) { this.isShielded = false; this.player.setAlpha(1); this.shieldGlow.setVisible(false); }
        }

        if (this.weaponLevel === 2) this.playerTwin.setPosition(this.player.x + 25, this.player.y).setVisible(true);

        this.player.setVelocity(0);
        if (pad) {
            const sx = pad.leftStick.x; const sy = pad.leftStick.y;
            if (Math.abs(sx) > 0.15) this.player.setVelocityX(200 * sx);
            if (Math.abs(sy) > 0.15) this.player.setVelocityY(200 * sy);
            if (pad.buttons[14].pressed) this.player.setVelocityX(-200);
            else if (pad.buttons[15].pressed) this.player.setVelocityX(200);
            if (pad.buttons[12].pressed) this.player.setVelocityY(-200);
            else if (pad.buttons[13].pressed) this.player.setVelocityY(200);
            if (pad.buttons[0].pressed && time > (this.lFire || 0) + 200) { this.fireLaser(); this.lFire = time; }
        }

        if (this.cursors.left.isDown) this.player.setVelocityX(-200);
        else if (this.cursors.right.isDown) this.player.setVelocityX(200);
        if (this.cursors.up.isDown) this.player.setVelocityY(-200);
        else if (this.cursors.down.isDown) this.player.setVelocityY(200);

        // Boss
        this.hb.clear();
        this.hpText.setText('');
        if (this.boss && this.boss.active && !this.boss.isDead) {
            this.boss.update();
            const barWidth = 240; const x = 80; const y = 50;
            this.hb.fillStyle(0x000000, 0.9).fillRect(x-4, y-4, barWidth+8, 20);
            this.hb.fillStyle(0x00ff00, 1).fillRect(x, y, barWidth * (this.boss.hp/this.boss.maxHp), 12);
            this.hpText.setPosition(200, y + 25).setText(`BOSS HP: ${Math.floor(this.boss.hp)}`);
            this.physics.overlap(this.lasers, this.boss, (b, l) => this.handleBossHit(l, b));
            if (!this.isShielded) this.physics.overlap(this.player, this.boss, () => this.hitPlayer(this.player, this.boss));
        }

        if (this.scoreInLevel >= this.bossThreshold && !this.bossTriggered) {
            this.bossTriggered = true; this.triggerBossSpawn();
        }

        this.lasers.getChildren().forEach(l => { if (l.y < -10) l.destroy(); });
        this.enemies.getChildren().forEach(e => { 
            if (e.y > 310) { 
                if (e.active && !e.isBoss) {
                    this.enemiesMissed++;
                    // --- BOSS HEALING MECHANIC ---
                    if (e.getData('isHealer') && this.boss && this.boss.active && !this.boss.isDead) {
                        this.healBoss(Math.floor(this.boss.maxHp * 0.05));
                    }
                }
                e.destroy(); 
            } 
        });
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
        if (this.isPaused || this.bossActive || this.isRestarting) return;
        const side = Phaser.Math.Between(0, 1);
        const x = side === 0 ? -40 : 440;
        const ufo = this.ufos.create(x, 30, 'ufo');
        if (ufo && ufo.body) {
            ufo.setActive(true).setVisible(true);
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
        if (choice === 'SHIELD') { this.isShielded = true; this.shieldTime = 20000; }
        else if (choice === 'TWIN') { this.weaponLevel = 2; }
        else if (choice === 'SLOW') { this.timeScale = 0.7; this.time.delayedCall(30000, () => { if(this.active) this.timeScale = 1.0; }); }
    }

    triggerBossSpawn() {
        this.waveActive = false; this.bossActive = true;
        if (this.currentMusic) this.currentMusic.stop();
        this.currentMusic = this.sound.add('music_boss', { loop: true });
        this.currentMusic.play();
        this.bossText.setVisible(true);
        this.time.delayedCall(2000, () => {
            if (this.isRestarting) return;
            this.bossText.setVisible(false);
            this.boss = new Boss(this, 200, -50, this.level);
            
            // --- RESTORED BOSS FIRING ---
            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    if (!this.isPaused && !this.isRestarting && this.boss && this.boss.active && !this.boss.isDead && this.boss.y > 20) {
                        const bolt = this.bossBolts.get(this.boss.x, this.boss.y + 40);
                        if (bolt && bolt.body) { 
                            bolt.setActive(true).setVisible(true); 
                            bolt.body.velocity.y = 200 * this.timeScale; 
                        }
                    }
                },
                loop: true
            });
        });
    }

    handleBossHit(laser, boss) {
        if (boss.isDead || boss.hitCooldown) return;
        laser.destroy();
        boss.hp -= 5; boss.setTint(0xff0000); boss.hitCooldown = true;
        this.time.delayedCall(100, () => { if (boss.active) { boss.clearTint(); boss.hitCooldown = false; } });
        if (boss.hp <= 0) { boss.isDead = true; this.enemiesKilled++; this.handleBossVictory(boss); }
    }

    handleBossVictory(boss) {
        if (this.isRestarting) return;
        this.isRestarting = true;
        this.sound.stopAll();
        
        // Stop player movement immediately
        this.player.setVelocity(0, 0);
        
        // Disable boss immediately
        boss.setVelocity(0, 0);
        boss.body.enable = false;
        boss.setVisible(false);
        
        this.add.sprite(boss.x, boss.y, 'explosion').setScale(5).play('explode');
        this.sound.play('explosionSfx');
        this.hb.clear(); this.hpText.setText('');

        this.time.delayedCall(1500, () => {
            const winText = this.add.text(200, 140, 'SECTOR CLEAR', { fontSize: '24px', fill: '#0f0', fontFamily: 'monospace' }).setOrigin(0.5);
            const prompt = this.add.text(200, 180, 'Press Button to Warp', { fontSize: '14px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0.5);
            
            const next = () => {
                const nl = this.level + 1;
                this.scene.restart({ level: nl, score: this.score, lives: this.lives, weaponLevel: this.weaponLevel, volume: this.volume, enemiesKilled: this.enemiesKilled, enemiesMissed: this.enemiesMissed, shipId: this.shipId });
            };
            
            this.input.keyboard.once('keydown-SPACE', next);
            if (this.input.gamepad) {
                this.input.gamepad.once('down', next);
            }
        });
        this.time.delayedCall(100, () => boss.destroy());
    }

    hitEnemy(laser, enemy) {
        if (!laser.active || !enemy.active) return;
        laser.destroy();
        this.add.sprite(enemy.x, enemy.y, 'explosion').play('explode');
        this.sound.play('explosionSfx');
        enemy.destroy();
        this.score += 100; this.scoreInLevel += 100; this.enemiesKilled++;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    hitPlayer(p, hazard) {
        if (this.isRestarting || this.isShielded) return;
        this.lives--; this.livesText.setText(`Lives: ${'❤️'.repeat(this.lives)}`);
        if (hazard !== this.boss) hazard.destroy();
        this.sound.play('hurtSfx'); this.cameras.main.shake(200, 0.01);
        this.isShielded = true; this.shieldTime = 2000;
        if (this.lives <= 0) {
            this.isRestarting = true; this.physics.pause(); this.sound.stopAll();
            this.add.sprite(p.x, p.y, 'explosion').setScale(2).play('explode');
            this.time.delayedCall(1000, () => this.scene.start('GameOverScene', { score: this.score, level: this.level, enemiesKilled: this.enemiesKilled, enemiesMissed: this.enemiesMissed }));
        }
    }

    spawnEnemy() {
        if (this.isPaused || this.isRestarting) return;
        const isBossFight = (this.boss && this.boss.active && !this.boss.isDead);
        if (isBossFight && Phaser.Math.Between(0, 100) > 25) return;
        if (!this.waveActive && !isBossFight) return;
        
        const enemyId = ((this.level - 1) % 20) + 1;
        const e = this.enemies.create(Phaser.Math.Between(20, 380), -20, `e_${enemyId}`);
        if (e && e.body) {
            if (e.width > 150) e.setScale(0.3); else if (e.width > 64) e.setScale(0.5); else if (e.width < 20) e.setScale(2);
            e.setVelocityY(100 * this.difficulty * this.timeScale);
            
            // --- HEALER LOGIC ---
            if (isBossFight) {
                e.setTint(0x00ff00);
                e.setData('isHealer', true);
            }
            
            const animKey = `anim_e_${enemyId}`;
            if (!this.anims.exists(animKey)) {
                const frameTotal = this.textures.get(`e_${enemyId}`).frameTotal;
                if (frameTotal > 2) {
                    this.anims.create({
                        key: animKey,
                        frames: this.anims.generateFrameNumbers(`e_${enemyId}`, { start: 0, end: frameTotal - 2 }),
                        frameRate: 10,
                        repeat: -1
                    });
                }
            }
            if (this.anims.exists(animKey)) e.play(animKey);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) { this.physics.pause(); this.pauseText.setVisible(true); this.currentMusic.pause(); }
        else { this.physics.resume(); this.pauseText.setVisible(false); this.currentMusic.resume(); }
    }

    adjustVolume(amount) {
        this.volume = Phaser.Math.Clamp(this.volume + amount, 0, 1);
        this.sound.volume = this.volume;
        localStorage.setItem('gameVolume', this.volume.toString());
        if (this.volumeText) this.volumeText.setText(`VOL: ${Math.round(this.volume * 10)}`);
    }

    healBoss(amount) {
        if (!this.boss || !this.boss.active || this.boss.isDead) return;
        this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + amount);
        this.boss.setTint(0x00ff00);
        this.time.delayedCall(200, () => { if(this.boss && this.boss.active) this.boss.clearTint(); });
    }

    healBoss(amount) {
        if (!this.boss || !this.boss.active || this.boss.isDead) return;
        this.boss.hp = Math.min(this.boss.maxHp, this.boss.hp + amount);
        this.boss.setTint(0x00ff00);
        this.time.delayedCall(200, () => { if(this.boss && this.boss.active) this.boss.clearTint(); });
    }
}