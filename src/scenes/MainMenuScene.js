import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('stars', 'assets/stars.png');
    }

    create() {
        // Apply saved volume
        const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
        this.sound.volume = savedVolume;

        // Load stats
        const highScore = localStorage.getItem('highScore') || '0';
        const initials = localStorage.getItem('highScoreInitials') || '???';

        // Background
        this.add.tileSprite(200, 150, 400, 300, 'background');
        this.add.tileSprite(200, 150, 400, 300, 'stars');

        // Title
        this.add.text(200, 70, 'ROUGE SPACE', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(200, 110, 'SHOOTER', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // High Score with Initials
        this.add.text(200, 145, `HIGH SCORE: ${highScore} (${initials})`, {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(200, 190, 'Press SPACE to Start', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(200, 235, 'ARROWS: Move | SPACE: Shoot\n+ / - : Volume Control\nGAMEPAD SUPPORTED', {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        const aboutBtn = this.add.text(200, 260, '[ ABOUT MANAWAR ]', {
            fontSize: '10px',
            fill: '#00ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        aboutBtn.on('pointerdown', () => {
            this.scene.start('AboutScene');
        });

        this.volumeText = this.add.text(10, 10, `VOL: ${Math.round(savedVolume * 10)}`, {
            fontSize: '10px',
            fill: '#aaa',
            fontFamily: 'monospace'
        });

        this.add.text(200, 280, 'New Life every 5 Levels', {
            fontSize: '10px',
            fill: '#aaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Input - Keyboard
        this.input.keyboard.on('keydown-EQUALS', () => this.adjustVolume(0.1));
        this.input.keyboard.on('keydown-NUMPAD_ADD', () => this.adjustVolume(0.1));
        this.input.keyboard.on('keydown-MINUS', () => this.adjustVolume(-0.1));
        this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this.adjustVolume(-0.1));

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('ShipSelectionScene');
        });

        this.input.keyboard.once('keydown-A', () => {
            this.scene.start('AboutScene');
        });

        // Input - Gamepad
        if (this.input.gamepad) {
            this.input.gamepad.once('down', (pad, button) => {
                this.scene.start('ShipSelectionScene');
            });
        }
    }

    adjustVolume(amount) {
        let volume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
        volume = Phaser.Math.Clamp(volume + amount, 0, 1);
        this.sound.volume = volume;
        localStorage.setItem('gameVolume', volume.toString());
        if (this.volumeText) this.volumeText.setText(`VOL: ${Math.round(volume * 10)}`);
    }
}