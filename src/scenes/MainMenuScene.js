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
        const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
        this.sound.volume = savedVolume;
        const highScore = localStorage.getItem('highScore') || '0';
        const initials = localStorage.getItem('highScoreInitials') || '???';

        this.add.tileSprite(200, 150, 400, 300, 'background');
        this.add.tileSprite(200, 150, 400, 300, 'stars');

        this.add.text(200, 70, 'RETRO SPACE', { fontSize: '32px', fill: '#ff0000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(200, 110, 'SHOOTER', { fontSize: '24px', fill: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);
        this.add.text(200, 145, `HIGH SCORE: ${highScore} (${initials})`, { fontSize: '14px', fill: '#ffff00', fontFamily: 'monospace' }).setOrigin(0.5);

        this.startText = this.add.text(200, 200, 'PRESS SPACE OR BUTTON TO START', { fontSize: '16px', fill: '#00ff00', fontFamily: 'monospace' }).setOrigin(0.5);
        
        // Blink effect
        this.time.addEvent({ delay: 500, callback: () => this.startText.setVisible(!this.startText.visible), loop: true });

        this.volumeText = this.add.text(10, 10, `VOL: ${Math.round(savedVolume * 10)}`, { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' });

        // Key Handlers
        this.input.keyboard.on('keydown-EQUALS', () => this.adjustVolume(0.1));
        this.input.keyboard.on('keydown-MINUS', () => this.adjustVolume(-0.1));
        this.input.keyboard.on('keydown-A', () => this.scene.start('AboutScene'));
        // ANY Interaction wakes up the Hardware/Gamepad API
        this.canStart = false;
        this.time.delayedCall(500, () => { this.canStart = true; });

        this.input.on('pointerdown', () => { if(this.canStart) this.startGame(); });
        this.input.keyboard.on('keydown-SPACE', () => { if(this.canStart) this.startGame(); });
        
        // Gamepad Start
        this.input.gamepad.on('down', () => { if(this.canStart) this.startGame(); });
    }

    startGame() {
        this.scene.start('ShipSelectionScene');
    }

    adjustVolume(amount) {
        let volume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
        volume = Phaser.Math.Clamp(volume + amount, 0, 1);
        this.sound.volume = volume;
        localStorage.setItem('gameVolume', volume.toString());
        if (this.volumeText) this.volumeText.setText(`VOL: ${Math.round(volume * 10)}`);
    }
}