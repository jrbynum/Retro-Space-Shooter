import Phaser from 'phaser';

export default class ShipSelectionScene extends Phaser.Scene {
    constructor() {
        super('ShipSelectionScene');
    }

    create() {
        this.add.tileSprite(0, 0, 400, 300, 'bg_1').setOrigin(0, 0);
        this.add.tileSprite(0, 0, 400, 300, 'stars').setOrigin(0, 0);

        this.add.text(200, 40, 'SELECT YOUR SHIP', { fontSize: '24px', fill: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);

        this.ships = [
            { id: 1, name: 'INTERCEPTOR', texture: 'ship_1', color: '#ffff00' },
            { id: 2, name: 'ENFORCER', texture: 'ship_2', color: '#ff0000' },
            { id: 3, name: 'CLASSIC', texture: 'ship_3', color: '#00ff00' },
            { id: 4, name: 'PROTOTYPE', texture: 'ship_4', color: '#00ffff' }
        ];

        this.selectedIndex = 0;
        this.shipItems = [];

        this.ships.forEach((ship, i) => {
            const x = 100 + (i % 2) * 200;
            const y = 110 + Math.floor(i / 2) * 100;
            
            const sprite = this.add.sprite(x, y, ship.texture, 0).setInteractive();
            if (ship.id === 4) sprite.setScale(0.4);
            
            const label = this.add.text(x, y + 40, ship.name, { fontSize: '12px', fill: ship.color, fontFamily: 'monospace' }).setOrigin(0.5);
            
            // Selection Ring
            const ring = this.add.circle(x, y, 40, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0);

            sprite.on('pointerdown', () => this.selectShip(ship.id));
            
            this.shipItems.push({ sprite, label, ring, id: ship.id });
        });

        this.updateSelection();

        // Keyboard Input
        this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-UP', () => this.moveSelection(-2));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(2));
        this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
        this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());

        this.add.text(200, 280, 'ARROWS: Nav | SPACE: Select', { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
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
                item.ring.setAlpha(1);
                item.ring.setVisible(true);
                item.sprite.setTint(0xffffff);
                item.label.setScale(1.2);
            } else {
                item.ring.setAlpha(0);
                item.sprite.setTint(0x666666);
                item.label.setScale(1);
            }
        });
    }

    confirmSelection() {
        const selectedShipId = this.ships[this.selectedIndex].id;
        this.selectShip(selectedShipId);
    }

    selectShip(id) {
        this.scene.start('GameScene', { level: 1, score: 0, lives: 3, weaponLevel: 1, shipId: id });
    }

    update() {
        // Gamepad Navigation
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            const pad = this.input.gamepad.getPad(0);
            if (pad) {
                const now = Date.now();
                if (now > (this.lastMove || 0) + 200) {
                    if (pad.left || pad.axes[0].value < -0.5) { this.moveSelection(-1); this.lastMove = now; }
                    else if (pad.right || pad.axes[0].value > 0.5) { this.moveSelection(1); this.lastMove = now; }
                    else if (pad.up || pad.axes[1].value < -0.5) { this.moveSelection(-2); this.lastMove = now; }
                    else if (pad.down || pad.axes[1].value > 0.5) { this.moveSelection(2); this.lastMove = now; }
                }
                
                if (pad.buttons[0].pressed || pad.buttons[1].pressed || pad.buttons[2].pressed || pad.buttons[3].pressed) {
                    this.confirmSelection();
                }
            }
        }
    }
}