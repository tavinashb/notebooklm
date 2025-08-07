import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryType } from '../../types';
import { CATEGORY_CONFIGS, CATEGORY_ORDER } from '../../constants/categories';

interface CategorySelectorProps {
  visible: boolean;
  selectedCategory: CategoryType | null;
  onSelect: (category: CategoryType) => void;
  onClose: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  visible,
  selectedCategory,
  onSelect,
  onClose,
}) => {
  const renderCategoryItem = (categoryType: CategoryType) => {
    const config = CATEGORY_CONFIGS[categoryType];
    const isSelected = selectedCategory === categoryType;

    return (
      <TouchableOpacity
        key={categoryType}
        style={[styles.categoryItem, isSelected && styles.selectedItem]}
        onPress={() => onSelect(categoryType)}
      >
        <View style={styles.categoryContent}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon as any} size={24} color={config.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.categoryTitle}>{config.title}</Text>
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {config.description}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Category</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.categoriesList}>
            {CATEGORY_ORDER.map(renderCategoryItem)}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  categoriesList: {
    padding: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default CategorySelector;