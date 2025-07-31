class TeenPattiGame {
  constructor() {
    this.suits = ['♠', '♥', '♦', '♣'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.handRankings = {
      'TRAIL': 5,        // Three of a kind (AAA)
      'PURE_SEQUENCE': 4, // Straight flush (A23 of same suit)
      'SEQUENCE': 3,      // Straight (A23 of different suits)
      'COLOR': 2,         // Flush (same suit)
      'PAIR': 1,          // One pair
      'HIGH_CARD': 0      // High card
    };
  }

  // Create a new deck
  createDeck() {
    const deck = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push(`${rank}${suit}`);
      }
    }
    return this.shuffleDeck(deck);
  }

  // Shuffle deck using Fisher-Yates algorithm
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Deal cards to players
  dealCards(deck, numPlayers) {
    const hands = [];
    for (let i = 0; i < numPlayers; i++) {
      hands.push([]);
    }
    
    // Deal 3 cards to each player
    for (let round = 0; round < 3; round++) {
      for (let player = 0; player < numPlayers; player++) {
        hands[player].push(deck.pop());
      }
    }
    
    return hands;
  }

  // Get card value for comparison
  getCardValue(card) {
    const rank = card.slice(0, -1);
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  }

  // Get card suit
  getCardSuit(card) {
    return card.slice(-1);
  }

  // Evaluate hand strength
  evaluateHand(cards) {
    if (cards.length !== 3) {
      throw new Error('Teen Patti requires exactly 3 cards');
    }

    const values = cards.map(card => this.getCardValue(card)).sort((a, b) => b - a);
    const suits = cards.map(card => this.getCardSuit(card));
    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = this.isStraight(values);

    // Trail (Three of a kind)
    if (values[0] === values[1] && values[1] === values[2]) {
      return {
        rank: this.handRankings.TRAIL,
        type: 'TRAIL',
        value: values[0],
        description: `Trail of ${this.getCardRank(values[0])}s`
      };
    }

    // Pure Sequence (Straight Flush)
    if (isFlush && isStraight) {
      return {
        rank: this.handRankings.PURE_SEQUENCE,
        type: 'PURE_SEQUENCE',
        value: values[0],
        description: 'Pure Sequence'
      };
    }

    // Sequence (Straight)
    if (isStraight) {
      return {
        rank: this.handRankings.SEQUENCE,
        type: 'SEQUENCE',
        value: values[0],
        description: 'Sequence'
      };
    }

    // Color (Flush)
    if (isFlush) {
      return {
        rank: this.handRankings.COLOR,
        type: 'COLOR',
        value: values[0],
        description: 'Color'
      };
    }

    // Pair
    if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
      const pairValue = values[0] === values[1] ? values[0] : 
                       values[1] === values[2] ? values[1] : values[0];
      return {
        rank: this.handRankings.PAIR,
        type: 'PAIR',
        value: pairValue,
        description: `Pair of ${this.getCardRank(pairValue)}s`
      };
    }

    // High Card
    return {
      rank: this.handRankings.HIGH_CARD,
      type: 'HIGH_CARD',
      value: values[0],
      description: `${this.getCardRank(values[0])} High`
    };
  }

  // Check if cards form a straight
  isStraight(values) {
    // Special case: A-2-3
    if (values[0] === 14 && values[1] === 3 && values[2] === 2) {
      return true;
    }
    
    // Regular straight
    return values[0] - values[1] === 1 && values[1] - values[2] === 1;
  }

  // Get card rank name
  getCardRank(value) {
    if (value === 14) return 'Ace';
    if (value === 13) return 'King';
    if (value === 12) return 'Queen';
    if (value === 11) return 'Jack';
    return value.toString();
  }

  // Compare two hands
  compareHands(hand1, hand2) {
    const eval1 = this.evaluateHand(hand1);
    const eval2 = this.evaluateHand(hand2);

    if (eval1.rank !== eval2.rank) {
      return eval1.rank - eval2.rank;
    }

    // Same rank, compare values
    if (eval1.value !== eval2.value) {
      return eval1.value - eval2.value;
    }

    // For high card and color, compare all cards
    if (eval1.type === 'HIGH_CARD' || eval1.type === 'COLOR') {
      const values1 = hand1.map(card => this.getCardValue(card)).sort((a, b) => b - a);
      const values2 = hand2.map(card => this.getCardValue(card)).sort((a, b) => b - a);
      
      for (let i = 0; i < 3; i++) {
        if (values1[i] !== values2[i]) {
          return values1[i] - values2[i];
        }
      }
    }

    return 0; // Tie
  }

  // Find the winner among multiple hands
  findWinner(playersWithHands) {
    if (playersWithHands.length === 0) return null;
    if (playersWithHands.length === 1) return playersWithHands[0];

    let winner = playersWithHands[0];
    for (let i = 1; i < playersWithHands.length; i++) {
      const comparison = this.compareHands(winner.cards, playersWithHands[i].cards);
      if (comparison < 0) {
        winner = playersWithHands[i];
      }
    }

    return winner;
  }

  // Calculate pot odds
  calculatePotOdds(currentBet, potSize) {
    return currentBet / (potSize + currentBet);
  }

  // Suggest action based on hand strength (for AI players)
  suggestAction(cards, currentBet, potSize, playerChips) {
    const handEval = this.evaluateHand(cards);
    const potOdds = this.calculatePotOdds(currentBet, potSize);
    
    // Strong hands
    if (handEval.rank >= this.handRankings.SEQUENCE) {
      if (currentBet < playerChips * 0.3) {
        return { action: 'raise', amount: Math.min(currentBet * 2, playerChips * 0.5) };
      }
      return { action: 'call' };
    }
    
    // Medium hands
    if (handEval.rank >= this.handRankings.PAIR) {
      if (potOdds < 0.3) {
        return { action: 'call' };
      }
      return { action: 'fold' };
    }
    
    // Weak hands
    if (potOdds < 0.2 && currentBet < playerChips * 0.1) {
      return { action: 'call' };
    }
    
    return { action: 'fold' };
  }

  // Generate game statistics
  generateGameStats(players, winner, pot) {
    const stats = {
      totalPlayers: players.length,
      totalPot: pot.total,
      commission: pot.commission,
      netPot: pot.netPot,
      winner: winner ? {
        username: winner.username,
        hand: this.evaluateHand(winner.cards),
        winAmount: pot.netPot
      } : null,
      players: players.map(player => ({
        username: player.username,
        hand: this.evaluateHand(player.cards),
        totalBet: player.totalBet,
        status: player.status
      }))
    };

    return stats;
  }
}

module.exports = TeenPattiGame;