import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';


const SYMBOLS = ['🐶', '🐱', '🐭', '🐰', '🐼', '🐸', '🦊', '🐨'];

function createShuffledDeck() {
  // create 2 cards per symbol
  let id = 0;
  const cards = SYMBOLS.flatMap((sym) => [
    { id: id++, value: sym, isMatched: false, isRevealed: false, seenCount: 0 },
    { id: id++, value: sym, isMatched: false, isRevealed: false, seenCount: 0 },
  ]);

  
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export default function App() {
  const [cards, setCards] = useState(createShuffledDeck);
  const [revealedIds, setRevealedIds] = useState([]); // up to 2 ids
  const [isBusy, setIsBusy] = useState(false); // lock while resolving
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  
  useEffect(() => {
    if (cards.every((c) => c.isMatched)) {
      setGameOver(true);
    }
  }, [cards]);

  const resetGame = () => {
    setCards(createShuffledDeck());
    setRevealedIds([]);
    setIsBusy(false);
    setScore(0);
    setGameOver(false);
  };

  const handleCardPress = (card) => {
    if (isBusy) return; // lock while resolving
    if (card.isMatched || card.isRevealed) return; // can't tap matched or already revealed in current pair
    if (revealedIds.length === 2) return; // never allow more than 2

    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              isRevealed: true,
              seenCount: c.seenCount + 1,
            }
          : c
      )
    );

    setRevealedIds((prev) => {
      const next = [...prev, card.id];

      // scoring: if this card was seen before (seenCount >= 1 in prev state), deduct -1
      const prevCardState = cards.find((c) => c.id === card.id);
      if (prevCardState && prevCardState.seenCount >= 1) {
        setScore((s) => s - 1);
      }

      if (next.length === 2) {
        resolvePair(next);
      }

      return next;
    });
  };

  const resolvePair = (pairIds) => {
    const [firstId, secondId] = pairIds;
    const firstCard = cards.find((c) => c.id === firstId);
    const secondCard = cards.find((c) => c.id === secondId);
    if (!firstCard || !secondCard) return;

    setIsBusy(true);

    if (firstCard.value === secondCard.value) {
      
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            pairIds.includes(c.id)
              ? { ...c, isMatched: true, isRevealed: true }
              : c
          )
        );
        setScore((s) => s + 20);
        setRevealedIds([]);
        setIsBusy(false);
      }, 400);
    } else {
      
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            pairIds.includes(c.id)
              ? { ...c, isRevealed: false }
              : c
          )
        );
        setRevealedIds([]);
        setIsBusy(false);
      }, 700);
    }
  };

  const renderCard = (card) => {
    const show = card.isRevealed || card.isMatched;
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          show ? styles.cardRevealed : styles.cardHidden,
          card.isMatched && styles.cardMatched,
        ]}
        onPress={() => handleCardPress(card)}
        activeOpacity={0.8}
        disabled={isBusy || card.isMatched || card.isRevealed}
      >
        <Text style={styles.cardText}>{show ? card.value : '?'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Memory Game</Text>
        <Text style={styles.score}>Score: {score}</Text>

        <View style={styles.grid}>
          {cards.map(renderCard)}
        </View>

        {gameOver && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>🎉 All pairs matched!</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!gameOver && (
          <TouchableOpacity style={styles.resetSmall} onPress={resetGame}>
            <Text style={styles.resetSmallText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginTop: 8,
    marginBottom: 4,
  },
  score: {
    fontSize: 18,
    color: '#E5E7EB',
    marginBottom: 16,
  },
  grid: {
    width: '100%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    width: '22%',
    aspectRatio: 1,
    margin: '2%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHidden: {
    backgroundColor: '#4B5563',
  },
  cardRevealed: {
    backgroundColor: '#FBBF24',
  },
  cardMatched: {
    backgroundColor: '#10B981',
  },
  cardText: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '700',
  },
  gameOverContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 20,
    color: '#F9FAFB',
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  resetSmall: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  resetSmallText: {
    color: '#D1D5DB',
  },
});