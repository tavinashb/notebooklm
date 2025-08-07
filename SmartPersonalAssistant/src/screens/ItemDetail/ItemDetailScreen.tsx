import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, AnyItem } from '../../types';
import { CATEGORY_CONFIGS } from '../../constants/categories';
import { databaseService } from '../../services/database';

type ItemDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetail'>;
type ItemDetailScreenRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

const ItemDetailScreen: React.FC = () => {
  const navigation = useNavigation<ItemDetailScreenNavigationProp>();
  const route = useRoute<ItemDetailScreenRouteProp>();
  const { item } = route.params;

  const categoryConfig = CATEGORY_CONFIGS[item.category];

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteItem(item.id);
              navigation.goBack();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: categoryConfig.color }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={categoryConfig.icon as any} size={32} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{item.title}</Text>
          <Text style={styles.headerSubtitle}>{categoryConfig.title}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.value}>{item.title}</Text>
      </View>

      {item.description && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{item.description}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.label}>Created</Text>
        <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Last Updated</Text>
        <Text style={styles.value}>{formatDate(item.updatedAt)}</Text>
      </View>
    </View>
  );

  const renderReminderInfo = () => {
    if (!item.isReminderActive || !item.reminderDate) return null;

    const now = new Date();
    const diffTime = item.reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusText = '';
    let statusColor = '#4CAF50';
    
    if (diffDays <= 0) {
      statusText = 'Overdue';
      statusColor = '#F44336';
    } else if (diffDays === 1) {
      statusText = 'Due Tomorrow';
      statusColor = '#FF9800';
    } else if (diffDays <= 7) {
      statusText = `Due in ${diffDays} days`;
      statusColor = '#FFC107';
    } else {
      statusText = 'Upcoming';
      statusColor = '#4CAF50';
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminder</Text>
        
        <View style={[styles.reminderCard, { borderLeftColor: statusColor }]}>
          <View style={styles.reminderHeader}>
            <Ionicons name="notifications" size={20} color={statusColor} />
            <Text style={[styles.reminderStatus, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.reminderDate}>{formatDate(item.reminderDate)}</Text>
        </View>
      </View>
    );
  };

  const renderAttachments = () => {
    if (!item.attachments || item.attachments.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attachments ({item.attachments.length})</Text>
        
        <View style={styles.attachmentsGrid}>
          {item.attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              {attachment.type === 'photo' ? (
                <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
              ) : (
                <View style={styles.attachmentPlaceholder}>
                  <Ionicons name="document" size={24} color="#666" />
                </View>
              )}
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.fileName}
              </Text>
              {attachment.extractedText && (
                <Text style={styles.extractedText} numberOfLines={2}>
                  {attachment.extractedText}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCategorySpecificInfo = () => {
    // This would render specific fields based on the category type
    // For now, we'll show a placeholder
    const specificFields = Object.entries(item).filter(([key, value]) => 
      !['id', 'title', 'description', 'category', 'createdAt', 'updatedAt', 
        'reminderDate', 'isReminderActive', 'attachments', 'tags'].includes(key) &&
      value !== undefined && value !== null
    );

    if (specificFields.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details</Text>
        
        {specificFields.map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
            <Text style={styles.value}>
              {value instanceof Date ? formatDate(value) : String(value)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderBasicInfo()}
        {renderReminderInfo()}
        {renderAttachments()}
        {renderCategorySpecificInfo()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  deleteButton: {
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  reminderCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reminderStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reminderDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  attachmentItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  attachmentImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  attachmentPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  extractedText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
});

export default ItemDetailScreen;