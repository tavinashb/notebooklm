import { 
  AnyItem, 
  ApplianceItem, 
  VehicleItem, 
  SchoolItem, 
  InsuranceItem, 
  VaccinationItem, 
  MoneyItem, 
  ImportantDateItem, 
  ContactItem 
} from '../types';
import { databaseService } from './database';

export class SampleDataService {
  static async generateSampleData(): Promise<void> {
    try {
      // Check if data already exists
      const existingItems = await databaseService.getAllItems();
      if (existingItems.length > 0) {
        console.log('Sample data already exists');
        return;
      }

      const sampleItems: AnyItem[] = [
        // Appliances
        {
          id: 'app1',
          title: 'Samsung Refrigerator',
          description: 'Double door refrigerator with warranty until March 2025',
          category: 'appliances',
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15'),
          reminderDate: new Date('2025-03-15'),
          isReminderActive: true,
          brand: 'Samsung',
          model: 'RT28T3083S8',
          purchaseDate: new Date('2023-01-15'),
          warrantyExpiry: new Date('2025-03-15'),
          amcExpiry: new Date('2024-12-15'),
          serviceHistory: [],
        } as ApplianceItem,

        {
          id: 'app2',
          title: 'LG Washing Machine',
          description: 'Front load washing machine',
          category: 'appliances',
          createdAt: new Date('2023-06-20'),
          updatedAt: new Date('2023-06-20'),
          reminderDate: new Date('2024-06-20'),
          isReminderActive: true,
          brand: 'LG',
          model: 'FHM1207ZDL',
          purchaseDate: new Date('2023-06-20'),
          warrantyExpiry: new Date('2024-06-20'),
        } as ApplianceItem,

        // Vehicles
        {
          id: 'veh1',
          title: 'Honda City',
          description: 'Personal car with comprehensive insurance',
          category: 'vehicles',
          createdAt: new Date('2022-03-10'),
          updatedAt: new Date('2024-01-10'),
          reminderDate: new Date('2024-12-15'),
          isReminderActive: true,
          vehicleNumber: 'KA01AB1234',
          make: 'Honda',
          model: 'City',
          pucExpiry: new Date('2024-12-15'),
          insuranceExpiry: new Date('2024-11-20'),
          serviceHistory: [],
        } as VehicleItem,

        // School
        {
          id: 'sch1',
          title: 'Annual School Fee',
          description: 'Annual fee payment for Grade 8',
          category: 'school',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05'),
          reminderDate: new Date('2024-03-31'),
          isReminderActive: true,
          studentName: 'Alex Johnson',
          class: 'Grade 8',
          feeAmount: 25000,
          feeDueDate: new Date('2024-03-31'),
          documentType: 'fee_receipt',
        } as SchoolItem,

        // Insurance
        {
          id: 'ins1',
          title: 'Health Insurance',
          description: 'Family health insurance policy',
          category: 'insurance',
          createdAt: new Date('2023-04-01'),
          updatedAt: new Date('2023-04-01'),
          reminderDate: new Date('2024-03-25'),
          isReminderActive: true,
          policyNumber: 'HLT123456789',
          provider: 'Star Health',
          policyType: 'health',
          premiumAmount: 15000,
          renewalDate: new Date('2024-03-31'),
        } as InsuranceItem,

        // Vaccination
        {
          id: 'vac1',
          title: 'MMR Vaccine',
          description: 'Second dose of MMR vaccine',
          category: 'vaccination',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          reminderDate: new Date('2024-02-28'),
          isReminderActive: true,
          childName: 'Emma Johnson',
          vaccineName: 'MMR',
          dueDate: new Date('2024-02-28'),
          doctorName: 'Dr. Smith',
          isCompleted: false,
        } as VaccinationItem,

        // Money
        {
          id: 'mon1',
          title: 'Loan to John',
          description: 'Personal loan given to John for emergency',
          category: 'money',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-01'),
          reminderDate: new Date('2024-02-29'),
          isReminderActive: true,
          personName: 'John Smith',
          amount: 5000,
          type: 'owed_to_me',
          dueDate: new Date('2024-02-29'),
          isSettled: false,
        } as MoneyItem,

        {
          id: 'mon2',
          title: 'Credit Card Payment',
          description: 'Monthly credit card payment due',
          category: 'money',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          reminderDate: new Date('2024-02-15'),
          isReminderActive: true,
          personName: 'HDFC Bank',
          amount: 8500,
          type: 'i_owe',
          dueDate: new Date('2024-02-15'),
          isSettled: false,
        } as MoneyItem,

        // Important Dates
        {
          id: 'date1',
          title: "Mom's Birthday",
          description: 'Remember to wish mom and plan celebration',
          category: 'dates',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          reminderDate: new Date('2024-03-15'),
          isReminderActive: true,
          eventType: 'birthday',
          eventDate: new Date('2024-03-15'),
          personName: 'Mom',
          isRecurring: true,
        } as ImportantDateItem,

        {
          id: 'date2',
          title: 'Wedding Anniversary',
          description: 'Our 10th wedding anniversary',
          category: 'dates',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          reminderDate: new Date('2024-06-20'),
          isReminderActive: true,
          eventType: 'anniversary',
          eventDate: new Date('2024-06-20'),
          personName: 'Us',
          isRecurring: true,
        } as ImportantDateItem,

        // Contacts
        {
          id: 'con1',
          title: 'Family Doctor',
          description: 'Primary care physician for the family',
          category: 'contacts',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          isReminderActive: false,
          contactName: 'Dr. Sarah Wilson',
          phoneNumbers: ['+1-555-0123', '+1-555-0124'],
          emails: ['dr.wilson@healthcare.com'],
          address: '123 Medical Center, Downtown',
          relationship: 'Doctor',
          importance: 'high',
        } as ContactItem,

        {
          id: 'con2',
          title: 'Emergency Contact',
          description: 'Brother - emergency contact',
          category: 'contacts',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          isReminderActive: false,
          contactName: 'Michael Johnson',
          phoneNumbers: ['+1-555-0199'],
          emails: ['michael.johnson@email.com'],
          relationship: 'Brother',
          importance: 'high',
        } as ContactItem,
      ];

      // Insert all sample items
      for (const item of sampleItems) {
        await databaseService.insertItem(item);
      }

      console.log('Sample data generated successfully');
    } catch (error) {
      console.error('Failed to generate sample data:', error);
    }
  }
}