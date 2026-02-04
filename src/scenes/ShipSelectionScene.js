import Phaser from 'phaser';
import { SHIP_STATS } from '../config/shipConfig.js';

export default class ShipSelectionScene extends Phaser.Scene {
    constructor() {
        super('ShipSelectionScene');
    }

    create() {
        this.add.tileSprite(0, 0, 400, 300, 'bg_1').setOrigin(0, 0);
        this.add.tileSprite(0, 0, 400, 300, 'stars').setOrigin(0, 0);

        this.add.text(200, 30, 'SELECT YOUR SHIP', { fontSize: '24px', fill: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);

        let savedKills = localStorage.getItem('totalKilled');
        this.totalKills = (savedKills && !isNaN(parseInt(savedKills))) ? parseInt(savedKills) : 0;

        this.add.text(200, 60, `TOTAL KILLS: ${this.totalKills}`, { fontSize: '12px', fill: '#0f0', fontFamily: 'monospace' }).setOrigin(0.5);

        // Use ship config instead of hardcoded array
        this.ships = [
            { id: 1, ...SHIP_STATS[1] },
            { id: 2, ...SHIP_STATS[2] },
            { id: 3, ...SHIP_STATS[3] },
            { id: 4, ...SHIP_STATS[4] }
        ];

        this.selectedIndex = 0;
        this.shipItems = [];
        this.statDisplays = [];

        this.ships.forEach((ship, i) => {
            const x = 100 + (i % 2) * 200;
            const y = 110 + Math.floor(i / 2) * 90;
            const sprite = this.add.sprite(x, y, ship.texture, 0).setInteractive();
            if (ship.id === 4) sprite.setScale(0.4);

            // Force first ship to be always unlocked, check costs for others
            const isUnlocked = ship.id === 1 || this.totalKills >= ship.cost;

            const label = this.add.text(x, y + 30, isUnlocked ? ship.name : `LOCKED (${ship.cost})`, { fontSize: '9px', fill: isUnlocked ? ship.color : '#666', fontFamily: 'monospace' }).setOrigin(0.5);
            const desc = this.add.text(x, y + 41, ship.description, { fontSize: '7px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
            const ring = this.add.circle(x, y, 40, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0);

            sprite.on('pointerdown', () => { if(isUnlocked) this.selectShip(ship.id); });

            this.shipItems.push({ sprite, label, desc, ring, id: ship.id, unlocked: isUnlocked, ship });
        });

        // Stats display panel (bottom of screen)
        this.createStatsPanel();
        this.updateSelection();

        // --- INPUT COOLDOWN ---
        this.canSelect = false;
        this.time.delayedCall(500, () => { this.canSelect = true; });

        // Keyboard
        this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-UP', () => this.moveSelection(-2));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(2));
        this.input.keyboard.on('keydown-SPACE', () => { if(this.canSelect) this.confirmSelection(); });

        this.add.text(200, 285, 'Nav with D-Pad | SPACE to Launch', { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
    }

    createStatsPanel() {
        const panelY = 230;

        // Panel background
        this.add.rectangle(200, panelY, 380, 45, 0x000000, 0.7).setOrigin(0.5);

        // Stat labels (will be updated based on selection)
        this.statLabels = {
            speed: this.add.text(20, panelY - 15, 'SPEED', { fontSize: '7px', fill: '#aaa', fontFamily: 'monospace' }),
            armor: this.add.text(20, panelY, 'ARMOR', { fontSize: '7px', fill: '#aaa', fontFamily: 'monospace' }),
            fireRate: this.add.text(200, panelY - 15, 'FIRE RATE', { fontSize: '7px', fill: '#aaa', fontFamily: 'monospace' }),
            damage: this.add.text(200, panelY, 'DAMAGE', { fontSize: '7px', fill: '#aaa', fontFamily: 'monospace' })
        };

        // Stat bars (will be drawn in updateSelection)
        this.statBars = this.add.graphics();
    }

    drawStatBar(x, y, value, maxValue = 8, color = 0x00ff00) {
        const barWidth = 80;
        const barHeight = 6;
        const fillWidth = (value / maxValue) * barWidth;

        // Background
        this.statBars.fillStyle(0x333333, 1);
        this.statBars.fillRect(x, y, barWidth, barHeight);

        // Fill
        this.statBars.fillStyle(color, 1);
        this.statBars.fillRect(x, y, fillWidth, barHeight);

        // Border
        this.statBars.lineStyle(1, 0x666666, 1);
        this.statBars.strokeRect(x, y, barWidth, barHeight);
    }

    moveSelection(delta) {
        let newIndex = this.selectedIndex + delta;
        if (newIndex >= 0 && newIndex < this.ships.length) {
            this.selectedIndex = newIndex;
            this.updateSelection();
            this.sound.play('laserSfx', { volume: 0.2 });
        }
    }

    updateSelection() {
        this.shipItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.ring.setVisible(true).setAlpha(1);
                item.sprite.setTint(item.unlocked ? 0xffffff : 0xff0000);
                item.label.setScale(1.1);
                item.desc.setScale(1.1);

                // Update stat bars for selected ship
                if (this.statBars && item.ship.statDisplay) {
                    this.statBars.clear();
                    const panelY = 230;
                    const stats = item.ship.statDisplay;

                    // Speed bar (yellow)
                    this.drawStatBar(70, panelY - 15, stats.speed, 8, 0xffff00);

                    // Armor bar (blue)
                    this.drawStatBar(70, panelY, stats.armor, 8, 0x00aaff);

                    // Fire Rate bar (orange)
                    this.drawStatBar(280, panelY - 15, stats.fireRate, 8, 0xff8800);

                    // Damage bar (red)
                    this.drawStatBar(280, panelY, stats.damage, 8, 0xff0000);
                }
            } else {
                item.ring.setVisible(false);
                item.sprite.setTint(0x444444);
                item.label.setScale(1);
                item.desc.setScale(1);
            }
        });
    }

    confirmSelection() {
        const item = this.shipItems[this.selectedIndex];
        if (item.unlocked) this.selectShip(item.id);
        else this.cameras.main.shake(100, 0.01);
    }

    selectShip(id) {
        this.scene.start('GameScene', { level: 1, score: 0, lives: 3, weaponLevel: 1, shipId: id });
    }

    getPad() {
        const phaserPad = this.input.gamepad.getPad(0);
        if (phaserPad && phaserPad.connected) return phaserPad;
        const raw = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < raw.length; i++) {
            const p = raw[i];
            if (p && p.connected) return { axes: p.axes.map(v => ({ value: v })), buttons: p.buttons.map(b => ({ pressed: b.pressed })) };
        }
        return null;
    }

    update() {
        const pad = this.getPad();
        if (pad) {
            const now = Date.now();
            if (now > (this.lastMove || 0) + 200) {
                const ax = pad.axes[0] ? pad.axes[0].value : 0;
                const ay = pad.axes[1] ? pad.axes[1].value : 0;
                if (ax < -0.5) { this.moveSelection(-1); this.lastMove = now; }
                else if (ax > 0.5) { this.moveSelection(1); this.lastMove = now; }
                else if (ay < -0.5) { this.moveSelection(-2); this.lastMove = now; }
                else if (ay > 0.5) { this.moveSelection(2); this.lastMove = now; }
            }
            if (this.canSelect && (pad.buttons[0].pressed || pad.buttons[1].pressed)) this.confirmSelection();
        }
    }
}