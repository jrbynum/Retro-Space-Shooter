import Phaser from 'phaser';

export default class PowerUpMenuScene extends Phaser.Scene {
    constructor() {
        super('PowerUpMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Darken the background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setOrigin(0.5);

        this.add.text(width / 2, 60, 'CHOOSE POWER-UP', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.options = [
            { id: 'SHIELD', text: 'ENERGY SHIELD (20s)', color: '#00ffff' },
            { id: 'TWIN', text: 'TWIN CANNONS', color: '#ff00ff' },
            { id: 'SLOW', text: 'TIME SLOW (30s)', color: '#ffff00' }
        ];

        this.selectedIndex = 0;
        this.btns = [];
        this.options.forEach((opt, i) => {
            const btn = this.add.text(width / 2, 120 + (i * 40), opt.text, {
                fontSize: '16px',
                fill: opt.color,
                fontFamily: 'monospace'
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => {
                if (this.canSelect) this.selectPowerUp(opt.id);
            });
            this.btns.push(btn);
        });

        this.add.text(width / 2, 260, 'ARROWS: Nav | SPACE: Select', {
            fontSize: '12px',
            fill: '#aaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // --- INPUT DELAY ---
        // Prevent accidental selections from the previous scene's button press
        this.canSelect = false;
        this.time.delayedCall(500, () => {
            this.canSelect = true;
        });

        // Keyboard
        this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.canSelect) this.selectPowerUp(this.options[this.selectedIndex].id);
        });
        this.input.keyboard.on('keydown-ONE', () => { if (this.canSelect) this.selectPowerUp('SHIELD'); });
        this.input.keyboard.on('keydown-TWO', () => { if (this.canSelect) this.selectPowerUp('TWIN'); });
        this.input.keyboard.on('keydown-THREE', () => { if (this.canSelect) this.selectPowerUp('SLOW'); });

        this.updateSelection();
    }

    moveSelection(delta) {
        if (!this.canSelect) return;
        let newIndex = this.selectedIndex + delta;
        if (newIndex >= 0 && newIndex < this.options.length) {
            this.selectedIndex = newIndex;
            this.updateSelection();
            this.sound.play('laserSfx', { volume: 0.2 });
        }
    }

    updateSelection() {
        this.btns.forEach((btn, i) => {
            if (i === this.selectedIndex) {
                btn.setScale(1.2);
                btn.setAlpha(1);
                btn.setText(`> ${this.options[i].text} <`);
            } else {
                btn.setScale(1.0);
                btn.setAlpha(0.6);
                btn.setText(this.options[i].text);
            }
        });
    }

    getController() {
        const phaserPad = this.input.gamepad.getPad(0);
        if (phaserPad && phaserPad.connected) return phaserPad;
        const raw = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < raw.length; i++) {
            const p = raw[i];
            if (p && p.connected) return {
                axes: p.axes.map(v => ({ value: v })),
                buttons: p.buttons.map(b => ({ pressed: b.pressed }))
            };
        }
        return null;
    }

    update() {
        const pad = this.getController();
        if (pad) {
            const now = Date.now();
            if (now > (this.lastMove || 0) + 200) {
                const ay = pad.axes[1] ? pad.axes[1].value : 0;
                const up = (pad.buttons[12] && pad.buttons[12].pressed) || ay < -0.5;
                const down = (pad.buttons[13] && pad.buttons[13].pressed) || ay > 0.5;

                if (up) { this.moveSelection(-1); this.lastMove = now; }
                else if (down) { this.moveSelection(1); this.lastMove = now; }
            }
            if (this.canSelect && (pad.buttons[0].pressed || pad.buttons[1].pressed || pad.buttons[2].pressed || pad.buttons[3].pressed)) {
                this.selectPowerUp(this.options[this.selectedIndex].id);
            }
        }
    }

    selectPowerUp(choice) {
        // Safe Scene Communication
        this.scene.resume('GameScene', { powerUp: choice });
        this.scene.stop();
    }
}