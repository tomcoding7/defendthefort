# Testing Guide - Defend the Fort

## 🎮 How to Test the Game

### Quick Start
1. **Open the game**: Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, etc.)
2. **No installation needed**: The game runs entirely in the browser with no build process required

### Game Modes

#### Player vs Player Mode
- Play against another person on the same computer
- Take turns manually
- Great for testing all game mechanics

#### Player vs AI Mode (Recommended for Solo Testing)
- Play against an AI opponent
- AI automatically takes its turn after you end yours
- Perfect for testing the game solo
- AI makes strategic decisions:
  - Plays monsters when possible
  - Uses beneficial spells
  - Upgrades monsters and fort
  - Attacks strategically

## 🎯 Testing Checklist

### Core Mechanics
- [ ] **Monster Placement**: Click a monster card, then click an empty slot
- [ ] **Spell Casting**: Click a spell card to play it immediately
- [ ] **Monster Combat**: Click your monster, then click opponent's monster to attack
- [ ] **Fort Attacks**: Attack fort when opponent has no monsters
- [ ] **Resource Management**: Spend Stars on cards, upgrades, and fort improvements
- [ ] **Turn System**: End turn button switches to next player/AI

### Monster Features
- [ ] **Leveling**: Monsters gain XP from battles and level up
- [ ] **Equipment**: Upgrade weapons (2⭐) and armor (2⭐) for monsters
- [ ] **Health System**: Monsters take damage based on Attack - Defense
- [ ] **Death**: Defeated monsters go to graveyard

### Fort System
- [ ] **Fort Upgrades**: Upgrade fort defense, star generation, or HP (5⭐ each)
- [ ] **Fort HP**: Fort takes damage when attacked
- [ ] **Win Condition**: Game ends when fort HP reaches 0

### Visual Features (Duel Links Style)
- [ ] **Battle Animations**: Monsters animate when attacking
- [ ] **Card Animations**: Cards animate when played
- [ ] **Damage Effects**: Visual feedback when damage is dealt
- [ ] **Monster Destruction**: Animated when monsters are defeated
- [ ] **Fort Attacks**: Visual effects when fort is hit

### Spell System
- [ ] **Reload**: Draw 2 cards
- [ ] **Redraw**: Return a card and draw a new one
- [ ] **Battle Rage**: All monsters gain +2 Attack
- [ ] **Fort Strike**: Deal 10 damage to opponent's fort
- [ ] **Healing Light**: Restore 5 HP to a monster
- [ ] **Star Burst**: Gain 2 additional Stars

## 🐛 Common Issues & Solutions

### Game Not Starting
- **Solution**: Make sure all JavaScript files are in the `js/` folder
- Check browser console for errors (F12)

### AI Not Taking Turns
- **Solution**: Make sure you clicked "Player vs AI" mode
- AI takes turns automatically after you end yours
- There's a 1.5 second delay before AI starts

### Cards Not Playing
- **Solution**: Make sure you have enough Stars (⭐)
- Check that you're clicking in the correct order (card first, then target)

### Animations Not Working
- **Solution**: Make sure CSS file is loaded
- Try refreshing the page

## 🎨 Duel Links-Style Features

The game includes several Duel Links-inspired features:

1. **Battle Animations**: Monsters pulse and move when attacking
2. **Visual Feedback**: Damage numbers and effects appear
3. **Card Animations**: Cards animate when played from hand
4. **Smooth Transitions**: All actions have visual feedback
5. **AI Opponent**: Smart AI that plays strategically
6. **Turn Indicators**: Clear visual indication of whose turn it is

## 📝 Testing Tips

1. **Start with AI Mode**: Easier to test solo
2. **Watch the Battle Log**: All actions are logged
3. **Test Different Strategies**: 
   - Aggressive (play many monsters)
   - Defensive (upgrade fort)
   - Balanced (mix of both)
4. **Try All Card Types**: Test each monster and spell
5. **Test Edge Cases**:
   - Empty hand
   - Full monster field
   - Low HP situations
   - Win conditions

## 🚀 Performance

- Game runs smoothly in modern browsers
- No lag with animations
- Responsive design works on different screen sizes

Enjoy testing! 🛡️🏰



