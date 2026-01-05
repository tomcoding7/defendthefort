// Monster class and logic
class Monster {
    constructor(cardData) {
        this.id = cardData.id;
        this.name = cardData.name;
        this.baseAttack = cardData.attack;
        this.baseDefense = cardData.defense;
        this.baseHealth = cardData.health;
        this.maxHealth = cardData.health;
        this.currentHealth = cardData.health;
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 5;
        this.weaponLevel = 0;
        this.armorLevel = 0;
        this.abilities = cardData.abilities || [];
        this.temporaryAttackBoost = 0;
        this.permanentAttackBoost = 0; // Permanent attack boost from spells
        this.owner = null; // Will be set when placed on field
        this.hasAttackedThisTurn = false;
        this.attackCountThisTurn = 0;
    }

    get attack() {
        return this.baseAttack + (this.weaponLevel * 2) + this.temporaryAttackBoost + this.permanentAttackBoost;
    }

    get defense() {
        return this.baseDefense + (this.armorLevel * 2);
    }

    get health() {
        return this.currentHealth;
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.defense);
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        return actualDamage;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    gainExperience(amount) {
        this.experience += amount;
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        this.baseAttack += 1;
        this.baseDefense += 1;
        this.maxHealth += 2;
        this.currentHealth += 2; // Heal when leveling up
        this.experienceToNext = Math.floor(this.experienceToNext * 1.5);
    }

    upgradeWeapon() {
        this.weaponLevel++;
    }

    upgradeArmor() {
        this.armorLevel++;
    }

    isAlive() {
        return this.currentHealth > 0;
    }

    canAttack() {
        // Check if monster can attack this turn
        if (!this.isAlive()) return false;
        
        // Monsters with double_attack or multiple_attacks can attack multiple times
        const maxAttacks = this.abilities.includes('double_attack') ? 2 : 
                          this.abilities.includes('multiple_attacks') ? 999 : 1;
        
        return this.attackCountThisTurn < maxAttacks;
    }

    resetTurn() {
        // Reset attack status for new turn
        this.hasAttackedThisTurn = false;
        this.attackCountThisTurn = 0;
        this.temporaryAttackBoost = 0;
    }

    attackMonster(target, isCounterAttack = false) {
        if (!target || !target.isAlive()) {
            return { success: false, message: 'Invalid target' };
        }

        // Only check attack limit for voluntary attacks, not counter-attacks
        if (!isCounterAttack && !this.canAttack()) {
            return { success: false, message: 'This monster has already attacked this turn' };
        }

        const damage = this.attack;
        const actualDamage = target.takeDamage(damage);
        
        // Only mark as attacked for voluntary attacks, not counter-attacks
        if (!isCounterAttack) {
            this.hasAttackedThisTurn = true;
            this.attackCountThisTurn++;
        }
        
        // Gain experience for dealing damage
        this.gainExperience(Math.floor(actualDamage / 2));
        
        // Target gains experience for taking damage (survival experience)
        if (target.isAlive()) {
            target.gainExperience(1);
        }

        return {
            success: true,
            damage: actualDamage,
            attacker: this.name,
            target: target.name,
            targetKilled: !target.isAlive()
        };
    }

    attackFort(fort) {
        if (!this.canAttack()) {
            return { success: false, message: 'This monster has already attacked this turn' };
        }

        const damage = this.attack;
        fort.takeDamage(damage);
        
        // Mark as attacked
        this.hasAttackedThisTurn = true;
        this.attackCountThisTurn++;
        
        this.gainExperience(Math.floor(damage / 3));
        return {
            success: true,
            damage: damage,
            attacker: this.name
        };
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'monster-card';
        card.dataset.monsterId = this.id;
        
        // Add visual indicator if already attacked
        if (!this.canAttack()) {
            card.classList.add('monster-attacked');
            card.style.opacity = '0.6';
        }
        
        // Add monster image if available (using same logic as Card class)
        const basePath = `assets/images/cards/monsters/`;
        const imageVariations = [
            `${this.id}.png`, // Exact match (e.g., knight.png, dragon.png)
            `${this.id.replace(/_/g, '')}.png`, // Without underscore (e.g., valiantknight.png)
            `${this.name.toLowerCase().replace(/\s+/g, '')}.png`, // From card name (e.g., valiantknight.png, bloodberserker.png)
            `${this.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`, // Normalized name
            `${this.id}.jpg`,
            `${this.id.replace(/_/g, '')}.jpg`,
            `${this.name.toLowerCase().replace(/\s+/g, '')}.jpg`
        ];
        
        const monsterImage = document.createElement('img');
        monsterImage.className = 'monster-image';
        monsterImage.alt = this.name;
        monsterImage.style.width = '100%';
        monsterImage.style.height = '120px';
        monsterImage.style.objectFit = 'cover';
        monsterImage.style.borderRadius = '8px';
        monsterImage.style.marginBottom = '8px';
        monsterImage.style.display = 'block';
        
        // Use cached mapping if available (from Card class image detection)
        // Access the global imageMappingCache from cards.js
        const imageCache = (typeof window !== 'undefined' && window.imageMappingCache) || 
                          (typeof imageMappingCache !== 'undefined' ? imageMappingCache : null);
        
        if (imageCache && imageCache[this.id]) {
            monsterImage.src = imageCache[this.id];
        } else {
            // Fallback: try multiple filename variations
            let currentVariationIndex = 0;
            const tryNextVariation = () => {
                currentVariationIndex++;
                if (currentVariationIndex < imageVariations.length) {
                    monsterImage.src = basePath + imageVariations[currentVariationIndex];
                } else {
                    // Hide image if all variations fail
                    monsterImage.style.display = 'none';
                }
            };
            
            monsterImage.onerror = tryNextVariation;
            monsterImage.src = basePath + imageVariations[0];
        }
        
        // Final fallback: hide if image fails to load
        monsterImage.addEventListener('error', () => {
            monsterImage.style.display = 'none';
        }, { once: true });
        monsterImage.style.width = '100%';
        monsterImage.style.height = '120px';
        monsterImage.style.objectFit = 'cover';
        monsterImage.style.borderRadius = '8px';
        monsterImage.style.marginBottom = '8px';
        
        const level = document.createElement('div');
        level.className = 'monster-level';
        level.textContent = `Lv.${this.level}`;
        
        const name = document.createElement('div');
        name.className = 'monster-name';
        name.textContent = this.name;
        
        card.appendChild(monsterImage);
        
        const stats = document.createElement('div');
        stats.className = 'monster-stats';
        // Show temporary boost with visual indicator
        const attackDisplay = this.temporaryAttackBoost > 0 
            ? `${this.attack} <span style="color: #ffd700; font-size: 0.9em;">(+${this.temporaryAttackBoost})</span>`
            : this.attack;
        stats.innerHTML = `
            <div class="monster-stat">
                <div class="monster-stat-label">⚔️ ATK</div>
                <div class="monster-stat-value">${attackDisplay}</div>
            </div>
            <div class="monster-stat">
                <div class="monster-stat-label">🛡️ DEF</div>
                <div class="monster-stat-value">${this.defense}</div>
            </div>
            <div class="monster-stat">
                <div class="monster-stat-label">❤️ HP</div>
                <div class="monster-stat-value">${this.currentHealth}/${this.maxHealth}</div>
            </div>
        `;
        
        const equipment = document.createElement('div');
        equipment.className = 'monster-equipment';
        const equipText = [];
        if (this.weaponLevel > 0) equipText.push(`⚔️+${this.weaponLevel}`);
        if (this.armorLevel > 0) equipText.push(`🛡️+${this.armorLevel}`);
        equipment.textContent = equipText.length > 0 ? equipText.join(' ') : '';
        
        const exp = document.createElement('div');
        exp.className = 'monster-equipment';
        exp.textContent = `XP: ${this.experience}/${this.experienceToNext}`;
        exp.style.fontSize = '0.7em';
        exp.style.marginTop = '3px';
        
        card.appendChild(monsterImage);
        card.appendChild(level);
        card.appendChild(name);
        card.appendChild(stats);
        card.appendChild(equipment);
        card.appendChild(exp);
        
        return card;
    }

    updateElement(element) {
        if (!element) return;
        
        // Update attack status visual
        if (!this.canAttack()) {
            element.classList.add('monster-attacked');
            element.style.opacity = '0.6';
        } else {
            element.classList.remove('monster-attacked');
            element.style.opacity = '1';
        }
        
        const level = element.querySelector('.monster-level');
        if (level) level.textContent = `Lv.${this.level}`;
        
        const stats = element.querySelector('.monster-stats');
        if (stats) {
            // Show temporary boost with visual indicator
            const attackDisplay = this.temporaryAttackBoost > 0 
                ? `${this.attack} <span style="color: #ffd700; font-size: 0.9em;">(+${this.temporaryAttackBoost})</span>`
                : this.attack;
            stats.innerHTML = `
                <div class="monster-stat">
                    <div class="monster-stat-label">⚔️ ATK</div>
                    <div class="monster-stat-value">${attackDisplay}</div>
                </div>
                <div class="monster-stat">
                    <div class="monster-stat-label">🛡️ DEF</div>
                    <div class="monster-stat-value">${this.defense}</div>
                </div>
                <div class="monster-stat">
                    <div class="monster-stat-label">❤️ HP</div>
                    <div class="monster-stat-value">${this.currentHealth}/${this.maxHealth}</div>
                </div>
            `;
        }
        
        const equipment = element.querySelector('.monster-equipment');
        if (equipment) {
            const equipText = [];
            if (this.weaponLevel > 0) equipText.push(`⚔️+${this.weaponLevel}`);
            if (this.armorLevel > 0) equipText.push(`🛡️+${this.armorLevel}`);
            equipment.textContent = equipText.length > 0 ? equipText.join(' ') : '';
        }
    }
}

