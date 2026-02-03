import Phaser from 'phaser';

export default class PowerUpMenuScene extends Phaser.Scene {
    constructor() {
        super('PowerUpMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Darken the background
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8).setOrigin(0.5);

        this.add.text(width/2, 60, 'CHOOSE POWER-UP', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const options = [
            { id: 'SHIELD', text: '1. ENERGY SHIELD (20s)', color: '#00ffff' },
            { id: 'TWIN', text: '2. TWIN CANNONS', color: '#ff00ff' },
            { id: 'SLOW', text: '3. TIME SLOW (30s)', color: '#ffff00' }
        ];

        this.btns = [];
        options.forEach((opt, i) => {
            const btn = this.add.text(width/2, 120 + (i * 40), opt.text, {
                fontSize: '16px',
                fill: opt.color,
                fontFamily: 'monospace'
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => this.selectPowerUp(opt.id));
            this.btns.push(btn);
        });

        this.add.text(width/2, 260, 'Press 1, 2, or 3', {
            fontSize: '12px',
            fill: '#aaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Keyboard
        this.input.keyboard.on('keydown-ONE', () => this.selectPowerUp('SHIELD'));
        this.input.keyboard.on('keydown-TWO', () => this.selectPowerUp('TWIN'));
        this.input.keyboard.on('keydown-THREE', () => this.selectPowerUp('SLOW'));

        // Gamepad
        if (this.input.gamepad) {
            this.input.gamepad.once('down', (pad, button) => {
                if (button.index === 0) this.selectPowerUp('SHIELD');
                if (button.index === 1) this.selectPowerUp('TWIN');
                if (button.index === 2) this.selectPowerUp('SLOW');
            });
        }
    }

    selectPowerUp(choice) {
        // Safe Scene Communication
        this.scene.resume('GameScene', { powerUp: choice });
        this.scene.stop();
    }
}