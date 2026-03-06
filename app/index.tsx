// app/index.tsx - EVERYTHING IN INDEX, NO EXCUSES

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';

export default function Index() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedImages, setLikedImages] = useState(new Set());
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const SAMPLE_IMAGES = [
    { id: 1, uri: 'https://picsum.photos/300/200?random=1', title: 'Mountain Landscape' },
    { id: 2, uri: 'https://picsum.photos/300/200?random=2', title: 'Ocean Sunset' },
    { id: 3, uri: 'https://picsum.photos/300/200?random=3', title: 'Forest Path' },
    { id: 4, uri: 'https://picsum.photos/300/200?random=4', title: 'City Skyline' },
    { id: 5, uri: 'https://picsum.photos/300/200?random=5', title: 'Desert Dunes' },
  ];

  const toggleLike = (imageId) => {
    const newLikedImages = new Set(likedImages);
    if (newLikedImages.has(imageId)) {
      newLikedImages.delete(imageId);
      Alert.alert('Unliked', 'Removed from favorites');
    } else {
      newLikedImages.add(imageId);
      Alert.alert('Liked!', 'Added to favorites ❤️');
    }
    setLikedImages(newLikedImages);
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === SAMPLE_IMAGES.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? SAMPLE_IMAGES.length - 1 : prevIndex - 1
    );
  };

  const currentImage = SAMPLE_IMAGES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Simple Image Gallery</Text>
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: currentImage.uri }} 
          style={[styles.image, { width: SCREEN_WIDTH - 40 }]}
          resizeMode="cover"
        />
        
        <Text style={styles.imageTitle}>{currentImage.title}</Text>
        
        <TouchableOpacity 
          style={[styles.likeButton, likedImages.has(currentImage.id) && styles.likedButton]}
          onPress={() => toggleLike(currentImage.id)}
        >
          <Text style={styles.likeButtonText}>
            {likedImages.has(currentImage.id) ? '❤️ Liked' : '🤍 Like'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={prevImage}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.counter}>
          {currentIndex + 1} / {SAMPLE_IMAGES.length}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={nextImage}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailContainer}
      >
        {SAMPLE_IMAGES.map((image, index) => (
          <TouchableOpacity 
            key={image.id}
            style={[
              styles.thumbnail,
              currentIndex === index && styles.activeThumbnail
            ]}
            onPress={() => setCurrentIndex(index)}
          >
            <Image 
              source={{ uri: image.uri }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            {likedImages.has(image.id) && (
              <View style={styles.thumbnailLikeIndicator}>
                <Text style={styles.thumbnailLikeText}>❤️</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    height: 300,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#333',
  },
  likeButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  likedButton: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  counter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#2196F3',
    transform: [{ scale: 1.1 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailLikeIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 2,
  },
  thumbnailLikeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});