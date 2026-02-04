import Phaser from 'phaser';

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

        this.ships = [
            { id: 1, name: 'INTERCEPTOR', texture: 'ship_1', color: '#ffff00', cost: 0 },
            { id: 2, name: 'ENFORCER', texture: 'ship_2', color: '#ff0000', cost: 1000 },
            { id: 3, name: 'CLASSIC', texture: 'ship_3', color: '#00ff00', cost: 2500 },
            { id: 4, name: 'PROTOTYPE', texture: 'ship_4', color: '#00ffff', cost: 5000 }
        ];

        this.selectedIndex = 0;
        this.shipItems = [];
        this.ships.forEach((ship, i) => {
            const x = 100 + (i % 2) * 200;
            const y = 130 + Math.floor(i / 2) * 80;
            const sprite = this.add.sprite(x, y, ship.texture, 0).setInteractive();
            if (ship.id === 4) sprite.setScale(0.4);
            
            // Force first ship to be always unlocked, check costs for others
            const isUnlocked = ship.id === 1 || this.totalKills >= ship.cost;
            
            const label = this.add.text(x, y + 40, isUnlocked ? ship.name : `LOCKED (${ship.cost})`, { fontSize: '10px', fill: isUnlocked ? ship.color : '#666', fontFamily: 'monospace' }).setOrigin(0.5);
            const ring = this.add.circle(x, y, 40, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0);
            sprite.on('pointerdown', () => { if(isUnlocked) this.selectShip(ship.id); });
            this.shipItems.push({ sprite, label, ring, id: ship.id, unlocked: isUnlocked });
        });

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
            } else {
                item.ring.setVisible(false);
                item.sprite.setTint(0x444444);
                item.label.setScale(1);
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