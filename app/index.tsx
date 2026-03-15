import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PENALTY_RATE = 2; // PHP 2 per day

export default function App() {
  const [cds, setCds] = useState([]);
  const [borrowed, setBorrowed] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalBorrowed, setTotalBorrowed] = useState(0);

  
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedCdId, setSelectedCdId] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');

  
  useEffect(() => {
    loadData();
  }, []);

  
  useEffect(() => {
    saveData();
  }, [cds, borrowed, totalIncome, totalBorrowed]);

  const loadData = async () => {
    try {
      const savedData = await SecureStore.getItemAsync('cd_library_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCds(data.cds || []);
        setBorrowed(data.borrowed || []);
        setTotalIncome(data.totalIncome || 0);
        setTotalBorrowed(data.totalBorrowed || 0);
      } else {
        
        const initialCds = [
          { id: 1, title: "Thriller", artist: "Michael Jackson", copies: 3 },
          { id: 2, title: "Abbey Road", artist: "The Beatles", copies: 2 },
          { id: 3, title: "Rumours", artist: "Fleetwood Mac", copies: 1 },
        ];
        setCds(initialCds);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      
      const initialCds = [
        { id: 1, title: "Thriller", artist: "Michael Jackson", copies: 3 },
        { id: 2, title: "Abbey Road", artist: "The Beatles", copies: 2 },
        { id: 3, title: "Rumours", artist: "Fleetwood Mac", copies: 1 },
      ];
      setCds(initialCds);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        cds,
        borrowed,
        totalIncome,
        totalBorrowed,
      };
      await SecureStore.setItemAsync('cd_library_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    }
  };

  const borrowCd = () => {
    if (!borrowerName.trim()) {
      Alert.alert('Error', 'Please enter borrower name');
      return;
    }

    const cd = cds.find(c => c.id === selectedCdId);
    if (!cd || cd.copies <= 0) {
      Alert.alert('Unavailable', 'CD not available');
      return;
    }

    
    const updatedCds = cds.map(c =>
      c.id === selectedCdId ? { ...c, copies: c.copies - 1 } : c
    );

    
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

    const newBorrow = {
      id: Date.now(),
      cdId: selectedCdId,
      title: cd.title,
      borrower: borrowerName,
      borrowDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    };

    setCds(updatedCds);
    setBorrowed([...borrowed, newBorrow]);
    setTotalBorrowed(totalBorrowed + 1);
    setShowBorrowModal(false);
    setBorrowerName('');
    setSelectedCdId(null);
  };

  const returnCd = (borrowId) => {
    const borrowRecord = borrowed.find(b => b.id === borrowId);
    if (!borrowRecord) return;

    
    const today = new Date();
    const dueDate = new Date(borrowRecord.dueDate);
    let penalty = 0;

    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      penalty = diffDays * PENALTY_RATE;
    }

    
    const cd = cds.find(c => c.id === borrowRecord.cdId);
    const updatedCds = cds.map(c =>
      c.id === borrowRecord.cdId ? { ...c, copies: c.copies + 1 } : c
    );

    
    const updatedBorrowed = borrowed.filter(b => b.id !== borrowId);

    setCds(updatedCds);
    setBorrowed(updatedBorrowed);
    setShowReturnModal(false);

    
    if (penalty > 0) {
      setTotalIncome(prevIncome => prevIncome + penalty);
      Alert.alert(
        'Returned with Penalty',
        `Penalty: PHP ${penalty.toFixed(2)}\nTotal Income: PHP ${(totalIncome + penalty).toFixed(2)}`
      );
    } else {
      Alert.alert('Returned Successfully', 'No penalty applied');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculatePenalty = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    if (today <= due) return 0;
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    return diffDays * PENALTY_RATE;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CD Library Management</Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Income</Text>
          <Text style={styles.statValue}>PHP {totalIncome.toFixed(2)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Borrowed</Text>
          <Text style={styles.statValue}>{totalBorrowed}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Available CDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available CDs ({cds.filter(c => c.copies > 0).length})</Text>
          {cds.map(cd => (
            cd.copies > 0 && (
              <View key={cd.id} style={styles.cdCard}>
                <Text style={styles.cdTitle}>{cd.title}</Text>
                <Text style={styles.cdArtist}>by {cd.artist}</Text>
                <Text style={styles.cdCopies}>Available: {cd.copies}</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedCdId(cd.id);
                    setShowBorrowModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Borrow</Text>
                </TouchableOpacity>
              </View>
            )
          ))}
        </View>

        {/* Borrowed CDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Borrowed CDs ({borrowed.length})</Text>
          {borrowed.map(borrow => {
            const penalty = calculatePenalty(borrow.dueDate);
            const isOverdue = penalty > 0;
            return (
              <View key={borrow.id} style={[styles.cdCard, styles.borrowedCard]}>
                <Text style={styles.cdTitle}>{borrow.title}</Text>
                <Text style={styles.cdDetail}>Borrower: {borrow.borrower}</Text>
                <Text style={styles.cdDetail}>Borrowed: {formatDate(borrow.borrowDate)}</Text>
                <Text style={[styles.cdDetail, isOverdue && styles.overdueText]}>
                  Due: {formatDate(borrow.dueDate)}
                  {isOverdue && ` (OVERDUE - PHP ${penalty.toFixed(2)})`}
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.returnButton]}
                  onPress={() => returnCd(borrow.id)}
                >
                  <Text style={styles.actionButtonText}>Return</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Borrow Modal */}
      <Modal visible={showBorrowModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Borrow CD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter borrower name"
            value={borrowerName}
            onChangeText={setBorrowerName}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowBorrowModal(false);
                setBorrowerName('');
                setSelectedCdId(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={borrowCd}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Return Modal */}
      <Modal visible={showReturnModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Return CD</Text>
          <Text>Are you sure you want to return this CD?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowReturnModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => returnCd(selectedCdId)}
            >
              <Text style={styles.modalButtonText}>Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  cdCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  borrowedCard: {
    borderColor: '#ff9800',
    borderWidth: 2,
  },
  cdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cdArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cdCopies: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  cdDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  overdueText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  returnButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    padding: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});