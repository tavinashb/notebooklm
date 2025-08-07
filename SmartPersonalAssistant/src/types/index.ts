// Base types
export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  category: CategoryType;
  createdAt: Date;
  updatedAt: Date;
  reminderDate?: Date;
  isReminderActive: boolean;
  attachments?: Attachment[];
  tags?: string[];
}

export interface Attachment {
  id: string;
  uri: string;
  type: 'photo' | 'document' | 'voice';
  fileName: string;
  extractedText?: string;
}

// Category types
export type CategoryType = 
  | 'appliances' 
  | 'vehicles' 
  | 'school' 
  | 'insurance' 
  | 'vaccination' 
  | 'money' 
  | 'dates' 
  | 'contacts';

// Specific item types
export interface ApplianceItem extends BaseItem {
  category: 'appliances';
  brand?: string;
  model?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  amcExpiry?: Date;
  serviceHistory?: ServiceRecord[];
}

export interface VehicleItem extends BaseItem {
  category: 'vehicles';
  vehicleNumber?: string;
  make?: string;
  model?: string;
  pucExpiry?: Date;
  insuranceExpiry?: Date;
  serviceHistory?: ServiceRecord[];
}

export interface SchoolItem extends BaseItem {
  category: 'school';
  studentName?: string;
  class?: string;
  feeAmount?: number;
  feeDueDate?: Date;
  documentType?: 'fee_receipt' | 'report_card' | 'certificate' | 'other';
}

export interface InsuranceItem extends BaseItem {
  category: 'insurance';
  policyNumber?: string;
  provider?: string;
  policyType?: 'health' | 'life' | 'vehicle' | 'home' | 'other';
  premiumAmount?: number;
  renewalDate?: Date;
}

export interface VaccinationItem extends BaseItem {
  category: 'vaccination';
  childName?: string;
  vaccineName?: string;
  dueDate?: Date;
  completedDate?: Date;
  doctorName?: string;
  isCompleted: boolean;
}

export interface MoneyItem extends BaseItem {
  category: 'money';
  personName: string;
  amount: number;
  type: 'owed_to_me' | 'i_owe';
  dueDate?: Date;
  isSettled: boolean;
}

export interface ImportantDateItem extends BaseItem {
  category: 'dates';
  eventType: 'birthday' | 'anniversary' | 'school_event' | 'other';
  eventDate: Date;
  personName?: string;
  isRecurring: boolean;
}

export interface ContactItem extends BaseItem {
  category: 'contacts';
  contactName: string;
  phoneNumbers: string[];
  emails?: string[];
  address?: string;
  relationship?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ServiceRecord {
  id: string;
  date: Date;
  description: string;
  cost?: number;
  serviceProvider?: string;
}

// Union type for all items
export type AnyItem = 
  | ApplianceItem 
  | VehicleItem 
  | SchoolItem 
  | InsuranceItem 
  | VaccinationItem 
  | MoneyItem 
  | ImportantDateItem 
  | ContactItem;

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Add: undefined;
  Settings: undefined;
  AddItem: { category?: CategoryType };
  Category: { category: CategoryType };
  ItemDetail: { item: AnyItem };
};

// Category configuration
export interface CategoryConfig {
  type: CategoryType;
  title: string;
  icon: string;
  color: string;
  description: string;
}

// Reminder types
export interface Reminder {
  id: string;
  itemId: string;
  title: string;
  message: string;
  scheduledDate: Date;
  isActive: boolean;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Voice input types
export interface VoiceResult {
  transcript: string;
  confidence: number;
}

// OCR types
export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}