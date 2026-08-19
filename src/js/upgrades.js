// Upgrade Pool & Level-Up Selection Logic

export const UPGRADES = [
  {
    id: 'RAPID_FIRE',
    name: 'Rapid Fire',
    desc: 'Increases attack speed by +20%',
    icon: '⚡',
    apply: (player) => { player.attackSpeed *= 1.20; }
  },
  {
    id: 'POWER_SHOT',
    name: 'Power Shot',
    desc: 'Increases weapon damage by +25%',
    icon: '💥',
    apply: (player) => { player.damage *= 1.25; }
  },
  {
    id: 'SWIFT_MOVEMENT',
    name: 'Swift Movement',
    desc: 'Increases player movement speed by +15%',
    icon: '👟',
    apply: (player) => { player.speed *= 1.15; }
  },
  {
    id: 'REINFORCED_ARMOR',
    name: 'Reinforced Armor',
    desc: 'Increases Max HP by +25 and restores +25 HP',
    icon: '🛡️',
    apply: (player) => {
      player.maxHealth += 25;
      player.health = Math.min(player.maxHealth, player.health + 25);
    }
  },
  {
    id: 'REGENERATION',
    name: 'Nanite Regen',
    desc: 'Restores +1.0 HP every second',
    icon: '💚',
    apply: (player) => { player.regenRate += 1.0; }
  },
  {
    id: 'EXTENDED_RANGE',
    name: 'Extended Range',
    desc: 'Increases weapon targeting range by +30%',
    icon: '📡',
    apply: (player) => { player.attackRange *= 1.30; }
  },
  {
    id: 'MAGNET',
    name: 'XP Magnet',
    desc: 'Increases XP collection radius by +40%',
    icon: '🧲',
    apply: (player) => { player.magnetRadius *= 1.40; }
  },
  {
    id: 'MULTI_SHOT',
    name: 'Multi-Shot',
    desc: 'Fires +1 additional projectile per shot',
    icon: '🔱',
    apply: (player) => { player.multiShot += 1; }
  },
  {
    id: 'PROJECTILE_SPEED',
    name: 'Hyper Velocity',
    desc: 'Increases projectile travel speed by +35%',
    icon: '🚀',
    apply: (player) => { player.projectileSpeed *= 1.35; }
  },
  {
    id: 'CRITICAL_STRIKE',
    name: 'Critical Strike',
    desc: 'Adds +15% chance to deal 2.0x Critical Damage',
    icon: '🎯',
    apply: (player) => { player.critChance += 0.15; }
  },
  {
    id: 'LIFE_BOOST',
    name: 'Life Boost',
    desc: 'Increases Max HP by +40 and heals +50 HP',
    icon: '🧪',
    apply: (player) => {
      player.maxHealth += 40;
      player.health = Math.min(player.maxHealth, player.health + 50);
    }
  },
  {
    id: 'FREEZE_SHOT',
    name: 'Cryo Freeze',
    desc: '25% chance for attacks to slow enemies by 50%',
    icon: '❄️',
    apply: (player) => { player.freezeChance += 0.25; }
  }
];

export function getRandomUpgrades(count = 3) {
  const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
