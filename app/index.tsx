/*
  Strategy:
  - Represent board as a 2D array of Cell objects { isBomb, adjacentBombs, isRevealed }.
  - On generate: create an empty rows x cols grid, randomly place bombs, then compute adjacentBombs.
  - Render grid with nested map; each cell is a TouchableOpacity.
  - On tap: reveal cell; if bomb, reveal all bombs and show an alert; else show number.
  - Provide TextInputs and buttons to set rows, cols, bombs and regenerate the board.
*/

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

type Cell = {
  isBomb: boolean;
  adjacentBombs: number;
  isRevealed: boolean;
};

const App = () => {
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [bombs, setBombs] = useState(10);

  const [rowsInput, setRowsInput] = useState('8');
  const [colsInput, setColsInput] = useState('8');
  const [bombsInput, setBombsInput] = useState('10');

  const [board, setBoard] = useState<Cell[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateBoard(8, 8, 10);
  }, []);

  const createEmptyBoard = (r: number, c: number): Cell[][] => {
    return Array.from({ length: r }, () =>
      Array.from({ length: c }, () => ({
        isBomb: false,
        adjacentBombs: 0,
        isRevealed: false,
      })),
    );
  };

  const placeBombs = (b: Cell[][], bombCount: number, r: number, c: number) => {
    const totalCells = r * c;
    const maxBombs = totalCells - 1;
    const finalBombs = Math.min(Math.max(bombCount, 1), maxBombs);
    const used = new Set<string>();

    while (used.size < finalBombs) {
      const index = Math.floor(Math.random() * totalCells);
      const row = Math.floor(index / c);
      const col = index % c;
      const key = `${row},${col}`;
      if (!used.has(key)) {
        used.add(key);
        b[row][col].isBomb = true;
      }
    }
  };

  const calculateNumbers = (b: Cell[][], r: number, c: number) => {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (b[i][j].isBomb) {
          b[i][j].adjacentBombs = 0;
          continue;
        }
        let count = 0;
        for (const [dr, dc] of directions) {
          const nr = i + dr;
          const nc = j + dc;
          if (nr >= 0 && nr < r && nc >= 0 && nc < c) {
            if (b[nr][nc].isBomb) count++;
          }
        }
        b[i][j].adjacentBombs = count;
      }
    }
  };

  const generateBoard = (r: number, c: number, bombCount: number) => {
    setLoading(true);
    const empty = createEmptyBoard(r, c);
    placeBombs(empty, bombCount, r, c);
    calculateNumbers(empty, r, c);
    setBoard(empty);
    setRows(r);
    setCols(c);
    setBombs(bombCount);
    setLoading(false);
  };

  const handleCellPress = (row: number, col: number) => {
    if (!board.length) return;
    const cell = board[row][col];
    if (cell.isRevealed) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));

    if (cell.isBomb) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newBoard[i][j].isBomb) newBoard[i][j].isRevealed = true;
        }
      }
      setBoard(newBoard);
      Alert.alert('Boom!', 'You hit a bomb. Regenerating board...', [
        {
          text: 'OK',
          onPress: () => generateBoard(rows, cols, bombs),
        },
      ]);
      return;
    }

    newBoard[row][col].isRevealed = true;
    setBoard(newBoard);
  };

  const applySettings = () => {
    const r = parseInt(rowsInput, 10);
    const c = parseInt(colsInput, 10);
    const b = parseInt(bombsInput, 10);

    if (isNaN(r) || isNaN(c) || isNaN(b) || r <= 0 || c <= 0 || b <= 0) {
      Alert.alert('Invalid input', 'Enter positive numbers for rows, columns, and bombs.');
      return;
    }

    const maxRows = 20;
    const maxCols = 20;
    const finalRows = Math.min(Math.max(r, 2), maxRows);
    const finalCols = Math.min(Math.max(c, 2), maxCols);
    const maxBombs = finalRows * finalCols - 1;
    const finalBombs = Math.min(b, maxBombs);

    if (finalBombs <= 0) {
      Alert.alert('Invalid bombs', 'Bombs must be less than total cells.');
      return;
    }

    setRowsInput(String(finalRows));
    setColsInput(String(finalCols));
    setBombsInput(String(finalBombs));
    generateBoard(finalRows, finalCols, finalBombs);
  };

  if (loading && !board.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Generating board...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Minesweeper Board</Text>

        <View style={styles.controlsRow}>
          <View style={styles.controlInputContainer}>
            <Text style={styles.label}>Rows</Text>
            <TextInput
              style={styles.input}
              value={rowsInput}
              onChangeText={setRowsInput}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.controlInputContainer}>
            <Text style={styles.label}>Columns</Text>
            <TextInput
              style={styles.input}
              value={colsInput}
              onChangeText={setColsInput}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.controlInputContainer}>
            <Text style={styles.label}>Bombs</Text>
            <TextInput
              style={styles.input}
              value={bombsInput}
              onChangeText={setBombsInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={applySettings}>
            <Text style={styles.controlButtonText}>Apply Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => generateBoard(rows, cols, bombs)}
          >
            <Text style={styles.controlButtonText}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>
          Grid: {rows} x {cols} • Bombs: {bombs}
        </Text>

        <View style={styles.board}>
          {board.map((row, rowIndex) => (
            <View style={styles.row} key={`row-${rowIndex}`}>
              {row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const revealedStyle = cell.isRevealed ? styles.cellRevealed : styles.cellHidden;
                let content = '';
                if (cell.isRevealed) {
                  if (cell.isBomb) content = '💣';
                  else if (cell.adjacentBombs > 0) content = String(cell.adjacentBombs);
                }
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.cell, revealedStyle]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cellText}>{content}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 40,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    width: '100%',
    gap: 8,
    justifyContent: 'space-between',
  },
  controlInputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  controlButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  board: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellHidden: {
    backgroundColor: '#bbb',
  },
  cellRevealed: {
    backgroundColor: '#eee',
  },
  cellText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default App;