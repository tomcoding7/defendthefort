# Image Generation Guide for Defend the Fort

## Quick Start

The game is now set up to support images! Images are **optional** - the game will work fine without them, but they'll make it look much better.

## Where to Get Images

### Option 1: AI Image Generators (Recommended)

**Free Options:**
- **Bing Image Creator** (Free) - https://bing.com/create
  - Just search "Bing Image Creator" in Edge browser
  - Free credits daily
  - Great quality

- **Leonardo.ai** (Free tier) - https://leonardo.ai
  - Free daily credits
  - Good for card art

- **Stable Diffusion** (Free) - Various online tools
  - Completely free
  - Requires some setup

**Paid but High Quality:**
- **Midjourney** - Best quality, requires Discord
- **DALL-E 3** - Via ChatGPT Plus or Bing
- **Adobe Firefly** - Free tier available

### Option 2: Free Stock Images

- **Unsplash** - https://unsplash.com
- **Pixabay** - https://pixabay.com
- **Pexels** - https://pexels.com

### Option 3: Game Asset Sites

- **OpenGameArt** - https://opengameart.org
- **Game Icons** - https://game-icons.net
- **Itch.io Assets** - Many free packs

## Prompt Suggestions for AI Generators

### Monster Cards
Use prompts like:
- "Fire dragon fantasy card art, trading card game style, detailed illustration, epic battle scene"
- "Valiant knight in armor, fantasy card game art, professional illustration"
- "Mystical unicorn, magical creature, fantasy card art style"
- "Siege tank, mechanical war machine, fantasy card game illustration"

### Spell Cards
- "Lightning bolt magic spell, fantasy card game art, electric energy, mystical"
- "Healing light spell, magical energy, fantasy card illustration"
- "Fort strike spell, epic magical attack, trading card game art style"

## Image Specifications

- **Format:** PNG (preferred) or JPG
- **Size:** 300x400px or 240x336px (standard card ratio)
- **Naming:** Use the card ID exactly:
  - `dragon.png`
  - `knight.png`
  - `lightning_bolt.png`
  - etc.

## File Structure

Place images in:
```
assets/
  images/
    cards/
      monsters/
        dragon.png
        knight.png
        unicorn.png
        ...
      spells/
        lightning_bolt.png
        heal.png
        reload.png
        ...
```

## Card IDs Reference

**Monsters:**
- dragon, unicorn, knight, mage, tank, rocket, archer, golem, wyvern, berserker, paladin, necromancer, phoenix

**Spells:**
- reload, redraw, attack_boost, fort_strike, heal, star_burst, lightning_bolt, fortify, rally

## Tips

1. **Consistent Style:** Try to use the same art style for all cards
2. **File Size:** Keep images under 200KB for fast loading
3. **Test:** Place one image and test it works before generating all
4. **Fallback:** Game works without images - they're optional!

## Testing

1. Create one test image (e.g., `dragon.png`)
2. Place it in `assets/images/cards/monsters/`
3. Open the game - if the image loads, you're good!
4. If image doesn't show, check:
   - File name matches card ID exactly
   - File is in the correct folder
   - File format is PNG or JPG

## Need Help?

The game will automatically hide images that don't exist, so you can add them gradually. Start with a few key cards and expand from there!






