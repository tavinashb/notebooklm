import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnyItem } from '../../types';
import { CATEGORY_CONFIGS } from '../../constants/categories';

interface ReminderCardProps {
  item: AnyItem;
  onPress: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ item, onPress }) => {
  const categoryConfig = CATEGORY_CONFIGS[item.category];
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '#F44336'; // Red - overdue
    if (diffDays <= 3) return '#FF9800'; // Orange - urgent
    return '#4CAF50'; // Green - upcoming
  };

  const urgencyColor = item.reminderDate ? getUrgencyColor(item.reminderDate) : '#4CAF50';

  return (
    <TouchableOpacity style={[styles.card, { borderTopColor: urgencyColor }]} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryConfig.color + '20' }]}>
          <Ionicons name={categoryConfig.icon as any} size={16} color={categoryConfig.color} />
        </View>
        <View style={styles.urgencyIndicator}>
          <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text style={styles.category}>
        {categoryConfig.title}
      </Text>
      
      {item.reminderDate && (
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={12} color="#666" />
          <Text style={[styles.dateText, { color: urgencyColor }]}>
            {formatDate(item.reminderDate)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  category: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ReminderCard;