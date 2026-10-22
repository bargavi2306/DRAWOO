/**
 * WordManager — Authoritative dictionary, used-word tracking, and mask helper
 */

export const WORD_DICTIONARY = [
  // Easy
  { word: 'ELEPHANT', category: 'Animals', difficulty: 'easy', emoji: '🐘' },
  { word: 'CAT', category: 'Animals', difficulty: 'easy', emoji: '🐱' },
  { word: 'DOG', category: 'Animals', difficulty: 'easy', emoji: '🐶' },
  { word: 'PIZZA', category: 'Food', difficulty: 'easy', emoji: '🍕' },
  { word: 'APPLE', category: 'Food', difficulty: 'easy', emoji: '🍎' },
  { word: 'SUN', category: 'Nature', difficulty: 'easy', emoji: '☀️' },
  { word: 'CAR', category: 'Vehicles', difficulty: 'easy', emoji: '🚗' },
  { word: 'HOUSE', category: 'Objects', difficulty: 'easy', emoji: '🏠' },
  { word: 'TREE', category: 'Nature', difficulty: 'easy', emoji: '🌳' },
  { word: 'BIRD', category: 'Animals', difficulty: 'easy', emoji: '🐦' },
  { word: 'FISH', category: 'Animals', difficulty: 'easy', emoji: '🐟' },
  { word: 'BOOK', category: 'Objects', difficulty: 'easy', emoji: '📖' },
  { word: 'STAR', category: 'Nature', difficulty: 'easy', emoji: '⭐' },
  { word: 'CAKE', category: 'Food', difficulty: 'easy', emoji: '🎂' },
  { word: 'CHAIR', category: 'Objects', difficulty: 'easy', emoji: '🪑' },
  { word: 'CLOCK', category: 'Objects', difficulty: 'easy', emoji: '⏰' },
  { word: 'SMILE', category: 'Faces', difficulty: 'easy', emoji: '😊' },
  { word: 'HEART', category: 'Shapes', difficulty: 'easy', emoji: '❤️' },
  { word: 'MOON', category: 'Nature', difficulty: 'easy', emoji: '🌙' },
  { word: 'BOAT', category: 'Vehicles', difficulty: 'easy', emoji: '⛵' },

  // Medium
  { word: 'DINOSAUR', category: 'Animals', difficulty: 'medium', emoji: '🦕' },
  { word: 'SPACESHIP', category: 'Vehicles', difficulty: 'medium', emoji: '🚀' },
  { word: 'HAMBURGER', category: 'Food', difficulty: 'medium', emoji: '🍔' },
  { word: 'RAINBOW', category: 'Nature', difficulty: 'medium', emoji: '🌈' },
  { word: 'GUITAR', category: 'Objects', difficulty: 'medium', emoji: '🎸' },
  { word: 'SUBMARINE', category: 'Vehicles', difficulty: 'medium', emoji: '🚤' },
  { word: 'TELESCOPE', category: 'Objects', difficulty: 'medium', emoji: '🔭' },
  { word: 'SKATEBOARD', category: 'Objects', difficulty: 'medium', emoji: '🛹' },
  { word: 'CAMPFIRE', category: 'Nature', difficulty: 'medium', emoji: '🔥' },
  { word: 'VOLCANO', category: 'Nature', difficulty: 'medium', emoji: '🌋' },
  { word: 'HELICOPTER', category: 'Vehicles', difficulty: 'medium', emoji: '🚁' },
  { word: 'WATERMELON', category: 'Food', difficulty: 'medium', emoji: '🍉' },
  { word: 'PENGUIN', category: 'Animals', difficulty: 'medium', emoji: '🐧' },
  { word: 'SUNFLOWER', category: 'Nature', difficulty: 'medium', emoji: '🌻' },
  { word: 'SANDCASTLE', category: 'Objects', difficulty: 'medium', emoji: '🏖️' },
  { word: 'BUTTERFLY', category: 'Animals', difficulty: 'medium', emoji: '🦋' },
  { word: 'PUPPY', category: 'Animals', difficulty: 'medium', emoji: '🐶' },
  { word: 'PIRATE', category: 'Characters', difficulty: 'medium', emoji: '🏴‍☠️' },
  { word: 'OCTOPUS', category: 'Animals', difficulty: 'medium', emoji: '🐙' },
  { word: 'LIGHTHOUSE', category: 'Places', difficulty: 'medium', emoji: '🏮' },

  // Hard
  { word: 'ROLLERCOASTER', category: 'Places', difficulty: 'hard', emoji: '🎢' },
  { word: 'CHANDELIER', category: 'Objects', difficulty: 'hard', emoji: '💡' },
  { word: 'ARCHAEOLOGIST', category: 'Jobs', difficulty: 'hard', emoji: '🦴' },
  { word: 'KALEIDOSCOPE', category: 'Objects', difficulty: 'hard', emoji: '🔮' },
  { word: 'STETHOSCOPE', category: 'Objects', difficulty: 'hard', emoji: '🩺' },
  { word: 'CONSTELLATION', category: 'Nature', difficulty: 'hard', emoji: '✨' },
  { word: 'ASTRONAUT', category: 'Jobs', difficulty: 'hard', emoji: '👨‍🚀' },
  { word: 'SUBWOOFER', category: 'Objects', difficulty: 'hard', emoji: '🔊' },
  { word: 'LABYRINTH', category: 'Places', difficulty: 'hard', emoji: '🏛️' },
  { word: 'METEORITE', category: 'Nature', difficulty: 'hard', emoji: '☄️' },
  { word: 'CAROUSEL', category: 'Places', difficulty: 'hard', emoji: '🎠' },
  { word: 'MICROPHONE', category: 'Objects', difficulty: 'hard', emoji: '🎙️' },
  { word: 'THERMOMETER', category: 'Objects', difficulty: 'hard', emoji: '🌡️' },
  { word: 'HOVERBOARD', category: 'Vehicles', difficulty: 'hard', emoji: '🛹' },
  { word: 'MICROSCOPE', category: 'Objects', difficulty: 'hard', emoji: '🔬' }
];

export class WordManager {
  constructor() {
    this.dictionary = WORD_DICTIONARY;
    this.usedWords = new Set();
  }

  /**
   * Reset the used-word collection when starting a genuinely new game
   */
  resetUsedWords() {
    this.usedWords.clear();
  }

  /**
   * Mark a word as used during gameplay
   */
  markWordUsed(word) {
    if (word) {
      this.usedWords.add(String(word).trim().toUpperCase());
    }
  }

  /**
   * Produce exactly 3 distinct word options for drawer based on game rules
   */
  getWordChoices(rules = {}) {
    let candidatePool = [];

    // 1. Build initial pool based on custom words or difficulty
    if (rules.customWords && Array.isArray(rules.customWordsList) && rules.customWordsList.length > 0) {
      const customItems = [];
      const seenCustom = new Set();
      for (const w of rules.customWordsList) {
        const cleaned = String(w || '').trim().toUpperCase();
        if (cleaned.length > 0 && !seenCustom.has(cleaned)) {
          seenCustom.add(cleaned);
          customItems.push({
            word: cleaned,
            category: 'Custom Word',
            difficulty: 'medium',
            emoji: '⭐'
          });
        }
      }
      candidatePool = customItems;

      // Safe fallback if custom pool is smaller than 3: supplement from dictionary
      if (candidatePool.length < 3) {
        for (const dictItem of this.dictionary) {
          if (!candidatePool.some(c => c.word === dictItem.word)) {
            candidatePool.push(dictItem);
            if (candidatePool.length >= 3) break;
          }
        }
      }
    } else {
      let pool = [...this.dictionary];
      const diff = String(rules.difficulty || 'mixed').toLowerCase();
      if (diff !== 'mixed' && diff !== 'all') {
        const filtered = pool.filter(w => w.difficulty.toLowerCase() === diff);
        if (filtered.length >= 3) {
          pool = filtered;
        }
      }
      candidatePool = pool;
    }

    // Deduplicate candidate pool by uppercase word string
    const uniqueMap = new Map();
    for (const item of candidatePool) {
      const key = item.word.toUpperCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    candidatePool = Array.from(uniqueMap.values());

    // Fallback: Ensure candidate pool has at least 3 distinct options
    if (candidatePool.length < 3) {
      for (const dictItem of this.dictionary) {
        const key = dictItem.word.toUpperCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, dictItem);
          candidatePool.push(dictItem);
          if (candidatePool.length >= 3) break;
        }
      }
    }

    // 2. Filter unused words from candidate pool
    let unused = candidatePool.filter(w => !this.usedWords.has(w.word.toUpperCase()));

    let chosen = [];

    // Case A: At least 3 unused words remain
    if (unused.length >= 3) {
      const shuffled = [...unused].sort(() => 0.5 - Math.random());
      chosen = shuffled.slice(0, 3);
    }
    // Case B: Fewer than 3 unused words remain (but at least 1)
    else if (unused.length > 0) {
      // Use the remaining unused words first
      chosen = [...unused];
      const needed = 3 - chosen.length;

      // Recycle used words pool
      this.usedWords.clear();
      // Keep the chosen words marked so we don't pick them again
      chosen.forEach(w => this.usedWords.add(w.word.toUpperCase()));

      // Pick the remaining needed words from candidatePool excluding current chosen
      const remainingCandidates = candidatePool.filter(
        c => !chosen.some(x => x.word.toUpperCase() === c.word.toUpperCase())
      );
      const shuffledRemaining = [...remainingCandidates].sort(() => 0.5 - Math.random());
      chosen = chosen.concat(shuffledRemaining.slice(0, needed));
    }
    // Case C: 0 unused words remain (pool exhausted)
    else {
      this.usedWords.clear();
      const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
      chosen = shuffled.slice(0, 3);
    }

    // Ultimate safeguard: Guarantee exactly 3 distinct items
    const finalSet = new Map();
    for (const item of chosen) {
      finalSet.set(item.word.toUpperCase(), item);
    }

    if (finalSet.size < 3) {
      for (const item of this.dictionary) {
        const key = item.word.toUpperCase();
        if (!finalSet.has(key)) {
          finalSet.set(key, item);
          if (finalSet.size === 3) break;
        }
      }
    }

    return Array.from(finalSet.values()).slice(0, 3);
  }

  /**
   * Create word mask pattern for guessers (e.g. ELEPHANT -> _ _ _ _ _ _ _ _)
   */
  createMask(word, revealedLetters = 0) {
    if (!word) return '';

    const upperWord = String(word).toUpperCase();
    const words = upperWord.split(' ');

    const patternWords = words.map(w => {
      const charArr = w.split('');
      const length = charArr.length;

      const indicesToReveal = new Set();
      if (revealedLetters > 0 && length > 2) {
        indicesToReveal.add(0);
        if (revealedLetters > 1 && length > 4) {
          indicesToReveal.add(Math.floor(length / 2));
        }
      }

      return charArr
        .map((ch, idx) => (indicesToReveal.has(idx) ? ch : '_'))
        .join(' ');
    });

    return patternWords.join('  ');
  }
}
