import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryConfig } from '../../types';

interface CategoryCardProps {
  config: CategoryConfig;
  count: number;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ config, count, onPress }) => {
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: config.color }]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {config.description}
        </Text>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{count} items</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  iconContainer: {
    marginBottom: 10,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  countContainer: {
    marginTop: 'auto',
  },
  countText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});

export default CategoryCard;