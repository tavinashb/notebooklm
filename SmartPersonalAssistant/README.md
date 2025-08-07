# Smart Personal Assistant

A comprehensive React Native mobile application for organizing personal life tasks, reminders, and records. This app serves as a centralized hub for tracking important information across multiple categories.

## 🎯 Features

### Core Functionality
- **Centralized Organization**: Keep track of everything important in one place
- **Smart Reminders**: Never miss important payment or renewal dates
- **Multi-Input Methods**: Add information via camera, voice input, or manual entry
- **Local Storage**: Secure SQLite database for offline functionality
- **Category-Based Organization**: 8 predefined categories for different types of data

### Supported Categories
1. **Appliances** - Purchase receipts, warranty, AMC, service records
2. **Vehicles** - PUC, insurance, service, tire rotation, RSA, documents  
3. **School** - Fee reminders, documents, important dates
4. **Insurance/Mediclaim** - Policy details, payment reminders
5. **Kids' Vaccination** - Vaccination schedule and records
6. **Money Tracking** - Track money borrowed and lent
7. **Important Dates** - Birthdays, anniversaries, events
8. **Important Contacts** - Emergency and important contact information

### Key Features
- 📱 **Modern UI/UX** - Clean, intuitive interface with Material Design principles
- 📸 **Camera Integration** - Capture receipts and documents directly
- 🎤 **Voice Input** - Dictate entries using voice-to-text (simulated)
- 🔔 **Smart Reminders** - Color-coded urgency system for upcoming dates
- 📊 **Dashboard View** - Quick overview with statistics and upcoming reminders
- 🔍 **Search & Filter** - Find items quickly across categories
- 📎 **Attachment Support** - Store photos and documents with items
- 🏷️ **Category-Specific Fields** - Tailored data fields for each category type

## 🛠️ Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **Database**: SQLite (expo-sqlite)
- **UI Components**: React Native + Expo Vector Icons
- **Image Handling**: Expo Image Picker + Camera
- **Storage**: Local SQLite with planned cloud sync support

## 📱 App Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   └── forms/           # Form-specific components
├── screens/
│   ├── Home/            # Dashboard screen
│   ├── AddItem/         # Add new item screen
│   ├── Category/        # Category listing screen
│   ├── ItemDetail/      # Item detail view
│   └── Settings/        # App settings
├── services/
│   ├── database.ts      # SQLite database service
│   └── sampleData.ts    # Sample data generation
├── types/               # TypeScript type definitions
├── constants/           # App constants and configurations
├── utils/               # Utility functions
└── navigation/          # Navigation configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartPersonalAssistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## 📋 Usage Guide

### Adding Items
1. Tap the "+" button or "Add Item" from the dashboard
2. Select a category from the list
3. Fill in the basic information (title, description)
4. Optionally add photos using the camera or gallery
5. Use voice input for quick text entry
6. Set reminders for important dates
7. Save the item

### Managing Categories
- Each category has its own dedicated screen
- View all items within a category
- Items are sorted by most recently updated
- Tap any item to view full details

### Reminders System
- Color-coded urgency levels:
  - 🔴 Red: Overdue items
  - 🟠 Orange: Due within 3 days
  - 🟡 Yellow: Due within 7 days
  - 🟢 Green: Future items
- Dashboard shows upcoming reminders
- Automatic date calculations for due dates

### Sample Data
The app comes pre-loaded with sample data to demonstrate functionality:
- Sample items across all categories
- Various reminder dates for testing
- Different types of attachments and data fields

## 🔧 Configuration

### Database Schema
The app uses SQLite with the following main tables:
- `items` - Main item storage with category-specific data as JSON
- `attachments` - File attachments linked to items  
- `service_records` - Service history for appliances/vehicles
- `reminders` - Reminder scheduling and management

### Customization
- **Categories**: Modify `src/constants/categories.ts` to add/edit categories
- **Colors**: Update color schemes in category configurations
- **Icons**: Change icons using Expo Vector Icons
- **Sample Data**: Modify `src/services/sampleData.ts` for custom demo data

## 🔮 Future Enhancements

### Planned Features
- **Cloud Sync** - Backup and sync across devices
- **OCR Integration** - Extract text from photos automatically
- **Real Voice Input** - Implement actual speech-to-text
- **Push Notifications** - System notifications for reminders
- **Export/Import** - Data backup and restore functionality
- **Search Enhancement** - Advanced search and filtering
- **Categories Customization** - User-defined categories
- **Multi-language Support** - Localization for different languages

### Technical Improvements
- **Performance Optimization** - Large dataset handling
- **Offline Sync** - Better offline/online data synchronization
- **Security** - Data encryption for sensitive information
- **Analytics** - Usage analytics and insights
- **Testing** - Comprehensive unit and integration tests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support or questions, please open an issue in the repository.

---

**Smart Personal Assistant** - Your personal organization companion 🎯