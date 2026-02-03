import Phaser from 'phaser';

export default class ShipSelectionScene extends Phaser.Scene {
    constructor() {
        super('ShipSelectionScene');
    }

    create() {
        this.add.tileSprite(0, 0, 400, 300, 'bg_1').setOrigin(0, 0);
        this.add.tileSprite(0, 0, 400, 300, 'stars').setOrigin(0, 0);

        this.add.text(200, 50, 'SELECT YOUR SHIP', { fontSize: '24px', fill: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);

        const ships = [
            { id: 1, name: 'INTERCEPTOR', texture: 'ship_1', color: '#ffff00' },
            { id: 2, name: 'ENFORCER', texture: 'ship_2', color: '#ff0000' },
            { id: 3, name: 'CLASSIC', texture: 'ship_3', color: '#00ff00' },
            { id: 4, name: 'PROTOTYPE', texture: 'ship_4', color: '#00ffff' }
        ];

        this.shipSprites = [];
        ships.forEach((ship, i) => {
            const x = 100 + (i % 2) * 200;
            const y = 130 + Math.floor(i / 2) * 100;
            const sprite = this.add.sprite(x, y, ship.texture, 0).setInteractive();
            if (ship.id === 4) sprite.setScale(0.4);
            
            this.add.text(x, y + 40, ship.name, { fontSize: '12px', fill: ship.color, fontFamily: 'monospace' }).setOrigin(0.5);
            
            sprite.on('pointerdown', () => this.selectShip(ship.id));
            this.shipSprites.push({ sprite, id: ship.id });
        });

        // Gamepad Support for Selection
        if (this.input.gamepad) {
            this.input.gamepad.once('down', (pad, button) => {
                // Any button starts with Ship 1 for now, or use stick to navigate (simplified for stability)
                this.selectShip(1); 
            });
        }

        this.add.text(200, 280, 'Click a Ship to Launch', { fontSize: '10px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
    }

    selectShip(id) {
        this.scene.start('GameScene', { level: 1, score: 0, lives: 3, weaponLevel: 1, shipId: id });
    }
}