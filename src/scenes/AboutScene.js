import Phaser from 'phaser';

export default class AboutScene extends Phaser.Scene {
    constructor() {
        super('AboutScene');
    }

    preload() {
        this.load.image('logo', 'assets/logo.png');
        this.load.image('bg_about', 'assets/background.png');
        this.load.image('stars_about', 'assets/stars.png');
    }

    create() {
        this.add.tileSprite(200, 150, 400, 300, 'bg_about');
        this.add.tileSprite(200, 150, 400, 300, 'stars_about');

        // Logo
        const logo = this.add.image(200, 100, 'logo');
        logo.setScale(0.3); // Scale 320x320 down to fit nicely

        // Bio
        this.add.text(200, 190, 'ABOUT THE DEVELOPER', {
            fontSize: '18px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(200, 220, "Hi, I'm Manawar!\nI'm retired and love playing\nand developing games.", {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        // Back button
        const backBtn = this.add.text(200, 270, 'Press SPACE to go back', {
            fontSize: '12px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainMenuScene');
        });

        // Gamepad support
        if (this.input.gamepad) {
            this.input.gamepad.once('down', () => {
                this.scene.start('MainMenuScene');
            });
        }
    }
}
