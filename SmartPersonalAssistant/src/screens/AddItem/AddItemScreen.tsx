import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

import { RootStackParamList, CategoryType, AnyItem, Attachment } from '../../types';
import { CATEGORY_CONFIGS, CATEGORY_ORDER } from '../../constants/categories';
import { databaseService } from '../../services/database';
import CategorySelector from '../../components/forms/CategorySelector';
import VoiceInputButton from '../../components/forms/VoiceInputButton';
import ImagePreview from '../../components/forms/ImagePreview';

type AddItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddItem'>;
type AddItemScreenRouteProp = RouteProp<RootStackParamList, 'AddItem'>;

const AddItemScreen: React.FC = () => {
  const navigation = useNavigation<AddItemScreenNavigationProp>();
  const route = useRoute<AddItemScreenRouteProp>();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    route.params?.category || null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [isReminderActive, setIsReminderActive] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are needed to capture and select images.'
      );
    }
  };

  const handleCameraCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'photo',
          fileName: `photo_${Date.now()}.jpg`,
        };
        
        setAttachments(prev => [...prev, attachment]);
        
        // TODO: Add OCR text extraction here
        // const extractedText = await extractTextFromImage(asset.uri);
        // attachment.extractedText = extractedText;
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'photo',
          fileName: `image_${Date.now()}.jpg`,
        };
        
        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleVoiceInput = (transcript: string) => {
    if (title.trim() === '') {
      setTitle(transcript);
    } else {
      setDescription(description + (description ? ' ' : '') + transcript);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const item: AnyItem = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory,
        createdAt: now,
        updatedAt: now,
        reminderDate: reminderDate || undefined,
        isReminderActive,
        attachments,
      } as AnyItem;

      await databaseService.insertItem(item);
      
      Alert.alert('Success', 'Item saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Add New Item</Text>
      <TouchableOpacity onPress={handleSave} disabled={isLoading}>
        <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
          {isLoading ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategorySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category</Text>
      <TouchableOpacity 
        style={styles.categoryButton} 
        onPress={() => setShowCategoryModal(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_CONFIGS[selectedCategory].color + '20' }]}>
              <Ionicons 
                name={CATEGORY_CONFIGS[selectedCategory].icon as any} 
                size={20} 
                color={CATEGORY_CONFIGS[selectedCategory].color} 
              />
            </View>
            <Text style={styles.categoryText}>{CATEGORY_CONFIGS[selectedCategory].title}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select Category</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title *</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, styles.flexInput]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            maxLength={100}
          />
          <VoiceInputButton onTranscript={handleVoiceInput} />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description (optional)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderAttachmentsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Attachments</Text>
      
      <View style={styles.attachmentButtons}>
        <TouchableOpacity style={styles.attachmentButton} onPress={handleCameraCapture}>
          <Ionicons name="camera" size={20} color="#2196F3" />
          <Text style={styles.attachmentButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentButton} onPress={handleImagePicker}>
          <Ionicons name="image" size={20} color="#2196F3" />
          <Text style={styles.attachmentButtonText}>Choose Image</Text>
        </TouchableOpacity>
      </View>

      {attachments.length > 0 && (
        <View style={styles.attachmentsList}>
          {attachments.map((attachment) => (
            <ImagePreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(attachment.id)}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderReminderSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reminder</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Set Reminder</Text>
        <Switch
          value={isReminderActive}
          onValueChange={setIsReminderActive}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isReminderActive ? '#2196F3' : '#f4f3f4'}
        />
      </View>

      {isReminderActive && (
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.dateButtonText}>
            {reminderDate ? reminderDate.toLocaleDateString() : 'Select Date'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCategorySection()}
        {renderBasicInfoSection()}
        {renderAttachmentsSection()}
        {renderReminderSection()}
      </ScrollView>

      <CategorySelector
        visible={showCategoryModal}
        selectedCategory={selectedCategory}
        onSelect={(category) => {
          setSelectedCategory(category);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />
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
  saveButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flexInput: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  attachmentButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default AddItemScreen;