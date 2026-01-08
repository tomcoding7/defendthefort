// Battle Sound Effects System
// Handles all sound effects during battle (not pack opening)

const BATTLE_SOUNDS = {
    // Spell effects (two variations)
    spellEffect1: 'assets/soundeffects/battle/spellefect.wav',
    spellEffect2: 'assets/soundeffects/battle/spelleffect.wav',
    
    // Summoning effects (two variations)
    summonEffect1: 'assets/soundeffects/battle/monstersummoned.wav',
    summonEffect2: 'assets/soundeffects/battle/summoningeffect2.wav',
    
    // Attack sounds (two variations)
    attackSound1: 'assets/soundeffects/battle/attacksound.wav',
    attackSound2: 'assets/soundeffects/battle/swordswing.wav',
    
    // Monster effect activation (two variations)
    activateEffect1: 'assets/soundeffects/battle/activateeffect.wav',
    activateEffect2: 'assets/soundeffects/battle/activateeffect2.wav',
    
    // Coin effect (for star/currency related sounds)
    coinEffect: 'assets/soundeffects/battle/coineffect.wav'
};

// Play a battle sound with optional volume
function playBattleSound(soundName, volume = 0.6) {
    const soundPath = BATTLE_SOUNDS[soundName];
    if (!soundPath) {
        console.warn('[BATTLE SOUNDS] Sound not found:', soundName);
        return;
    }
    
    try {
        const audio = new Audio(soundPath);
        audio.volume = volume;
        audio.play().catch((error) => {
            // Silently fail if audio can't play (e.g., user hasn't interacted with page)
            console.debug('[BATTLE SOUNDS] Could not play sound:', soundName, error);
        });
    } catch (e) {
        console.debug('[BATTLE SOUNDS] Error playing sound:', soundName, e);
    }
}

// Play a random variation of a sound type
function playRandomSpellSound(volume = 0.6) {
    const variation = Math.random() < 0.5 ? 'spellEffect1' : 'spellEffect2';
    playBattleSound(variation, volume);
}

function playRandomSummonSound(volume = 0.6) {
    const variation = Math.random() < 0.5 ? 'summonEffect1' : 'summonEffect2';
    playBattleSound(variation, volume);
}

function playRandomAttackSound(volume = 0.6) {
    const variation = Math.random() < 0.5 ? 'attackSound1' : 'attackSound2';
    playBattleSound(variation, volume);
}

function playRandomEffectSound(volume = 0.6) {
    const variation = Math.random() < 0.5 ? 'activateEffect1' : 'activateEffect2';
    playBattleSound(variation, volume);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.playBattleSound = playBattleSound;
    window.playRandomSpellSound = playRandomSpellSound;
    window.playRandomSummonSound = playRandomSummonSound;
    window.playRandomAttackSound = playRandomAttackSound;
    window.playRandomEffectSound = playRandomEffectSound;
    window.BATTLE_SOUNDS = BATTLE_SOUNDS;
}
