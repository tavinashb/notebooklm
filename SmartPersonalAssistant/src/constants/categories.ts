import { CategoryConfig, CategoryType } from '../types';

export const CATEGORY_CONFIGS: Record<CategoryType, CategoryConfig> = {
  appliances: {
    type: 'appliances',
    title: 'Appliances',
    icon: 'home-outline',
    color: '#4CAF50',
    description: 'Track appliances, warranties, and service records'
  },
  vehicles: {
    type: 'vehicles',
    title: 'Vehicles',
    icon: 'car-outline',
    color: '#2196F3',
    description: 'Manage vehicle documents, insurance, and maintenance'
  },
  school: {
    type: 'school',
    title: 'School',
    icon: 'school-outline',
    color: '#FF9800',
    description: 'Track school fees, documents, and important dates'
  },
  insurance: {
    type: 'insurance',
    title: 'Insurance',
    icon: 'shield-checkmark-outline',
    color: '#9C27B0',
    description: 'Monitor insurance policies and renewal dates'
  },
  vaccination: {
    type: 'vaccination',
    title: 'Vaccination',
    icon: 'medical-outline',
    color: '#F44336',
    description: "Keep track of children's vaccination schedule"
  },
  money: {
    type: 'money',
    title: 'Money Tracking',
    icon: 'cash-outline',
    color: '#4CAF50',
    description: 'Track money borrowed and lent'
  },
  dates: {
    type: 'dates',
    title: 'Important Dates',
    icon: 'calendar-outline',
    color: '#E91E63',
    description: 'Remember birthdays, anniversaries, and events'
  },
  contacts: {
    type: 'contacts',
    title: 'Important Contacts',
    icon: 'people-outline',
    color: '#607D8B',
    description: 'Store important contact information'
  }
};

export const CATEGORY_ORDER: CategoryType[] = [
  'appliances',
  'vehicles',
  'school',
  'insurance',
  'vaccination',
  'money',
  'dates',
  'contacts'
];