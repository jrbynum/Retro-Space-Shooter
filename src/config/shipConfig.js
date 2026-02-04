// Ship Configuration - Stats and Properties
export const SHIP_STATS = {
    1: { // INTERCEPTOR - Glass Cannon
        name: 'INTERCEPTOR',
        texture: 'ship_1',
        color: '#ffff00',
        cost: 0,
        description: 'FAST & FRAGILE',
        stats: {
            speed: 1.3,        // 30% faster movement
            lives: 2,          // Fewer starting lives
            fireRate: 150,     // Faster fire rate (lower = faster)
            damage: 1,         // Normal damage
            startWeapon: 1     // No special starting weapon
        },
        statDisplay: {
            speed: 7,
            armor: 2,
            fireRate: 7,
            damage: 5
        }
    },
    2: { // ENFORCER - Tank
        name: 'ENFORCER',
        texture: 'ship_2',
        color: '#ff0000',
        cost: 1000,
        description: 'HEAVY ARMOR',
        stats: {
            speed: 0.75,       // 25% slower movement
            lives: 4,          // More starting lives
            fireRate: 300,     // Slower fire rate
            damage: 2,         // Double damage
            startWeapon: 1
        },
        statDisplay: {
            speed: 3,
            armor: 8,
            fireRate: 3,
            damage: 8
        }
    },
    3: { // CLASSIC - Balanced
        name: 'CLASSIC',
        texture: 'ship_3',
        color: '#00ff00',
        cost: 2500,
        description: 'WELL BALANCED',
        stats: {
            speed: 1.0,        // Normal speed
            lives: 3,          // Normal lives
            fireRate: 200,     // Normal fire rate
            damage: 1,         // Normal damage
            startWeapon: 1
        },
        statDisplay: {
            speed: 5,
            armor: 5,
            fireRate: 5,
            damage: 5
        }
    },
    4: { // PROTOTYPE - Special
        name: 'PROTOTYPE',
        texture: 'ship_4',
        color: '#00ffff',
        cost: 5000,
        description: 'TWIN CANNONS',
        stats: {
            speed: 1.1,        // Slightly faster
            lives: 3,          // Normal lives
            fireRate: 200,     // Normal fire rate
            damage: 1,         // Normal damage
            startWeapon: 2     // STARTS WITH TWIN CANNONS!
        },
        statDisplay: {
            speed: 6,
            armor: 5,
            fireRate: 5,
            damage: 6
        }
    }
};

// Helper function to get ship stats by ID
export function getShipStats(shipId) {
    return SHIP_STATS[shipId] || SHIP_STATS[1];
}
