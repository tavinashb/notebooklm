import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '../../types';

interface ImagePreviewProps {
  attachment: Attachment;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ attachment, onRemove }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: attachment.uri }} style={styles.image} />
      
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Ionicons name="close-circle" size={24} color="#F44336" />
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {attachment.fileName}
        </Text>
        {attachment.extractedText && (
          <Text style={styles.extractedText} numberOfLines={2}>
            {attachment.extractedText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 80,
    backgroundColor: '#f5f5f5',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoContainer: {
    padding: 8,
  },
  fileName: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  extractedText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 12,
  },
});

export default ImagePreview;