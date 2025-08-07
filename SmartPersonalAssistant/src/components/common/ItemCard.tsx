import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnyItem } from '../../types';
import { CATEGORY_CONFIGS } from '../../constants/categories';

interface ItemCardProps {
  item: AnyItem;
  onPress: () => void;
  showCategory?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, showCategory = true }) => {
  const categoryConfig = CATEGORY_CONFIGS[item.category];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '#F44336'; // Red - overdue
    if (diffDays <= 3) return '#FF9800'; // Orange - urgent
    if (diffDays <= 7) return '#FFC107'; // Yellow - upcoming
    return '#4CAF50'; // Green - future
  };

  const renderReminderIndicator = () => {
    if (!item.isReminderActive || !item.reminderDate) return null;

    const urgencyColor = getUrgencyColor(item.reminderDate);
    const now = new Date();
    const diffTime = item.reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let reminderText = '';
    if (diffDays <= 0) reminderText = 'Overdue';
    else if (diffDays === 1) reminderText = 'Tomorrow';
    else if (diffDays <= 7) reminderText = `${diffDays} days`;
    else reminderText = formatDate(item.reminderDate);

    return (
      <View style={[styles.reminderBadge, { backgroundColor: urgencyColor }]}>
        <Ionicons name="time" size={12} color="#fff" />
        <Text style={styles.reminderText}>{reminderText}</Text>
      </View>
    );
  };

  const renderAttachmentIndicator = () => {
    if (!item.attachments || item.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentIndicator}>
        <Ionicons name="attach" size={14} color="#666" />
        <Text style={styles.attachmentCount}>{item.attachments.length}</Text>
      </View>
    );
  };

  const renderThumbnail = () => {
    const photoAttachment = item.attachments?.find(att => att.type === 'photo');
    
    if (photoAttachment) {
      return (
        <Image source={{ uri: photoAttachment.uri }} style={styles.thumbnail} />
      );
    }

    return (
      <View style={[styles.iconThumbnail, { backgroundColor: categoryConfig.color + '20' }]}>
        <Ionicons name={categoryConfig.icon as any} size={20} color={categoryConfig.color} />
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.thumbnailContainer}>
          {renderThumbnail()}
        </View>

        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {renderReminderIndicator()}
          </View>

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.metaInfo}>
              {showCategory && (
                <View style={styles.categoryBadge}>
                  <Ionicons name={categoryConfig.icon as any} size={12} color={categoryConfig.color} />
                  <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                    {categoryConfig.title}
                  </Text>
                </View>
              )}
              <Text style={styles.dateText}>
                {formatDate(item.updatedAt)}
              </Text>
            </View>
            
            <View style={styles.indicators}>
              {renderAttachmentIndicator()}
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  iconThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  reminderText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  attachmentCount: {
    fontSize: 11,
    color: '#666',
  },
});

export default ItemCard;