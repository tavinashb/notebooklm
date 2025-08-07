import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, AnyItem, CategoryType } from '../../types';
import { CATEGORY_CONFIGS, CATEGORY_ORDER } from '../../constants/categories';
import { databaseService } from '../../services/database';
import { SampleDataService } from '../../services/sampleData';
import CategoryCard from '../../components/common/CategoryCard';
import ReminderCard from '../../components/common/ReminderCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [upcomingReminders, setUpcomingReminders] = useState<AnyItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<CategoryType, number>>({} as Record<CategoryType, number>);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await databaseService.init();
      await SampleDataService.generateSampleData();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please try again.');
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load upcoming reminders
      const reminders = await databaseService.getUpcomingReminders(7);
      setUpcomingReminders(reminders);

      // Load category counts
      const counts: Record<CategoryType, number> = {} as Record<CategoryType, number>;
      for (const category of CATEGORY_ORDER) {
        const items = await databaseService.getItemsByCategory(category);
        counts[category] = items.length;
      }
      setCategoryCounts(counts);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: CategoryType) => {
    navigation.navigate('Category', { category });
  };

  const handleReminderPress = (item: AnyItem) => {
    navigation.navigate('ItemDetail', { item });
  };

  const handleAddItemPress = () => {
    navigation.navigate('AddItem', {});
  };

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>Smart Personal Assistant</Text>
      <Text style={styles.welcomeSubtitle}>
        Keep track of everything important in one place
      </Text>
    </View>
  );

  const renderQuickStats = () => {
    const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    const activeReminders = upcomingReminders.length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="folder-outline" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="notifications-outline" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{activeReminders}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>
    );
  };

  const renderUpcomingReminders = () => {
    if (upcomingReminders.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {upcomingReminders.slice(0, 5).map((item) => (
            <ReminderCard
              key={item.id}
              item={item}
              onPress={() => handleReminderPress(item)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryGrid = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="grid-outline" size={20} color="#666" />
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <View style={styles.categoryGrid}>
        {CATEGORY_ORDER.map((categoryType) => {
          const config = CATEGORY_CONFIGS[categoryType];
          const count = categoryCounts[categoryType] || 0;
          
          return (
            <CategoryCard
              key={categoryType}
              config={config}
              count={count}
              onPress={() => handleCategoryPress(categoryType)}
            />
          );
        })}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleAddItemPress}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.quickActionText}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeSection()}
        {renderQuickStats()}
        {renderUpcomingReminders()}
        {renderCategoryGrid()}
        {renderQuickActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickActions: {
    padding: 15,
    paddingBottom: 30,
  },
  quickActionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;