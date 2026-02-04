import Phaser from 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, level) {
        const bossId = ((level - 1) % 20) + 1;
        const texture = `b_${bossId}`;
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5).setDepth(1000);

        this.type = bossId;
        // Balanced for combo multipliers: 1.12x per level with higher base
        // Level 1: 150 HP, Level 10: 415 HP, Level 20: 1150 HP
        this.hp = Math.floor(150 * Math.pow(1.12, level - 1));
        this.maxHp = this.hp;
        this.isBoss = true;
        this.isDead = false;
        
        this.body.setImmovable(true);
        
        // Accurate Scale & Hitboxes
        if (bossId === 1) { 
            this.setScale(2.5); 
            this.body.setSize(100, 40); 
        } else if (bossId === 3) { 
            this.setScale(0.45); 
            this.body.setSize(180, 120); 
        } else {
            this.setScale(1);
            if (this.width > 200) this.setScale(0.5);
            if (this.width < 40) this.setScale(2.5);
            this.body.setSize(this.width * 0.8, this.height * 0.8);
        }

        this.setVelocityY(50);
        this.setupAnims(scene, bossId);
    }

    setupAnims(scene, id) {
        const key = `boss_${id}_anim`;
        if (scene.anims.exists(key)) {
            this.play(key);
            return;
        }

        const frameTotal = scene.textures.get(`b_${id}`).frameTotal - 1;
        if (frameTotal > 1) {
            scene.anims.create({
                key,
                frames: scene.anims.generateFrameNumbers(`b_${id}`, { start: 0, end: frameTotal - 1 }),
                frameRate: 10,
                repeat: -1
            });
            this.play(key);
        }
    }

    update() {
        if (!this.active || this.isDead) return;
        if (this.y >= 100 && this.body.velocity.y > 0) {
            this.setVelocityY(0);
            this.setVelocityX(100);
        }
        if (this.y >= 100) {
            if (this.x > 340) this.setVelocityX(-100);
            else if (this.x < 60) this.setVelocityX(100);
        }
    }
}