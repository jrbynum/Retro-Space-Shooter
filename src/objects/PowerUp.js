import Phaser from 'phaser';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        // Map type to frame/texture
        let texture = 'gems'; // Using gems spritesheet
        let frame = 0; // Default Red

        if (type === 'SPREAD') frame = 0; // Red
        else if (type === 'RAPID') frame = 1; // Blue/Green
        else if (type === 'SHIELD') {
            texture = 'shield_icon';
            frame = 0;
        }

        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.setVelocityY(100);
    }
}