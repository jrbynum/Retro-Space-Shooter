import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.add.text(200, 150, 'CALIBRATING WARP DRIVE...', { fontFamily: 'monospace', fill: '#0f0' }).setOrigin(0.5);

        // --- Core ---
        this.load.image('stars', 'assets/stars.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('boss_bolt', 'assets/boss_bolt.png');
        this.load.image('ufo', 'assets/ufo.png');
        this.load.image('logo', 'assets/logo.png');
        this.load.spritesheet('explosion', 'assets/explosion.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('shield_effect', 'assets/shield_icon.png');
        
        // --- Ships ---
        this.load.spritesheet('ship_1', 'assets/ship_1.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('ship_2', 'assets/ship_2.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('ship_3', 'assets/ship_3.png', { frameWidth: 48, frameHeight: 48 });
        this.load.image('ship_4', 'assets/ship_4.png');

        // --- Audio ---
        this.load.audio('laserSfx', 'assets/laser.wav');
        this.load.audio('explosionSfx', 'assets/explosion.wav');
        this.load.audio('hurtSfx', 'assets/hurt.ogg');
        this.load.audio('music_boss', 'assets/music_boss_epic.ogg');

        // --- 20 Backgrounds & Music ---
        for(let i=1; i<=20; i++) {
            this.load.image(`bg_${i}`, `assets/bg_${i}.png`);
            this.load.audio(`m_${i}`, `assets/m_${i}.ogg`);
        }

        // --- 20 Enemies (Animated) ---
        this.load.spritesheet('e_1', 'assets/e_1.png', { frameWidth: 83, frameHeight: 64 });
        this.load.spritesheet('e_2', 'assets/e_2.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('e_3', 'assets/e_3.png', { frameWidth: 96, frameHeight: 112 });
        this.load.spritesheet('e_4', 'assets/e_4.png', { frameWidth: 64, frameHeight: 80 });
        this.load.spritesheet('e_5', 'assets/e_5.png', { frameWidth: 192, frameHeight: 144 });
        this.load.spritesheet('e_6', 'assets/e_6.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('e_7', 'assets/e_7.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('e_8', 'assets/e_8.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('e_12', 'assets/e_12.png', { frameWidth: 54, frameHeight: 49 });
        this.load.spritesheet('e_14', 'assets/e_14.png', { frameWidth: 64, frameHeight: 80 });
        this.load.spritesheet('e_17', 'assets/e_1.png', { frameWidth: 83, frameHeight: 64 });
        this.load.spritesheet('e_18', 'assets/e_1.png', { frameWidth: 83, frameHeight: 64 });
        this.load.spritesheet('e_19', 'assets/e_1.png', { frameWidth: 83, frameHeight: 64 });
        this.load.spritesheet('e_20', 'assets/e_1.png', { frameWidth: 83, frameHeight: 64 });
        
        // Statics
        const eStatics = [9, 10, 11, 13, 15, 16];
        eStatics.forEach(i => this.load.image(`e_${i}`, `assets/e_${i}.png`));

        // --- 20 Bosses (Comprehensive Audit) ---
        this.load.spritesheet('b_1', 'assets/b_1.png', { frameWidth: 144, frameHeight: 64 });
        this.load.spritesheet('b_3', 'assets/b_3.png', { frameWidth: 192, frameHeight: 144 });
        this.load.spritesheet('b_6', 'assets/b_6.png', { frameWidth: 80, frameHeight: 160 });
        this.load.spritesheet('b_7', 'assets/b_7.png', { frameWidth: 64, frameHeight: 48 });
        this.load.spritesheet('b_8', 'assets/b_8.png', { frameWidth: 80, frameHeight: 64 });
        this.load.spritesheet('b_9', 'assets/b_9.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('b_10', 'assets/b_10.png', { frameWidth: 192, frameHeight: 176 });
        this.load.spritesheet('b_11', 'assets/b_11.png', { frameWidth: 160, frameHeight: 96 });
        this.load.spritesheet('b_12', 'assets/b_12.png', { frameWidth: 81, frameHeight: 66 });
        this.load.spritesheet('b_13', 'assets/b_13.png', { frameWidth: 128, frameHeight: 96 });
        this.load.spritesheet('b_15', 'assets/b_15.png', { frameWidth: 144, frameHeight: 80 });
        this.load.spritesheet('b_16', 'assets/b_16.png', { frameWidth: 96, frameHeight: 76 });
        this.load.spritesheet('b_17', 'assets/b_17.png', { frameWidth: 80, frameHeight: 160 });
        this.load.spritesheet('b_18', 'assets/b_18.png', { frameWidth: 144, frameHeight: 64 });

        const bStatics = [2, 4, 5, 14, 19, 20];
        bStatics.forEach(i => this.load.image(`b_${i}`, `assets/b_${i}.png`));
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}