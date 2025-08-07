import * as SQLite from 'expo-sqlite';
import { AnyItem, CategoryType, Reminder, ServiceRecord } from '../types';

const DATABASE_NAME = 'smart_assistant.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Main items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        reminder_date INTEGER,
        is_reminder_active INTEGER DEFAULT 0,
        tags TEXT,
        data TEXT NOT NULL
      );
    `);

    // Attachments table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        extracted_text TEXT,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);

    // Service records table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        date INTEGER NOT NULL,
        description TEXT NOT NULL,
        cost REAL,
        service_provider TEXT,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);

    // Reminders table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        scheduled_date INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        frequency TEXT,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
      CREATE INDEX IF NOT EXISTS idx_items_reminder_date ON items (reminder_date);
      CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date ON reminders (scheduled_date);
    `);
  }

  async insertItem(item: AnyItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const { attachments, ...itemData } = item;
    
    await this.db.runAsync(
      `INSERT INTO items (id, title, description, category, created_at, updated_at, 
       reminder_date, is_reminder_active, tags, data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.title,
        item.description || null,
        item.category,
        item.createdAt.getTime(),
        item.updatedAt.getTime(),
        item.reminderDate?.getTime() || null,
        item.isReminderActive ? 1 : 0,
        item.tags ? JSON.stringify(item.tags) : null,
        JSON.stringify(itemData)
      ]
    );

    // Insert attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await this.db.runAsync(
          `INSERT INTO attachments (id, item_id, uri, type, file_name, extracted_text)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            attachment.id,
            item.id,
            attachment.uri,
            attachment.type,
            attachment.fileName,
            attachment.extractedText || null
          ]
        );
      }
    }
  }

  async updateItem(item: AnyItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const { attachments, ...itemData } = item;
    
    await this.db.runAsync(
      `UPDATE items SET title = ?, description = ?, updated_at = ?, 
       reminder_date = ?, is_reminder_active = ?, tags = ?, data = ?
       WHERE id = ?`,
      [
        item.title,
        item.description || null,
        item.updatedAt.getTime(),
        item.reminderDate?.getTime() || null,
        item.isReminderActive ? 1 : 0,
        item.tags ? JSON.stringify(item.tags) : null,
        JSON.stringify(itemData),
        item.id
      ]
    );
  }

  async deleteItem(itemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
  }

  async getItemsByCategory(category: CategoryType): Promise<AnyItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM items WHERE category = ? ORDER BY updated_at DESC',
      [category]
    );

    const items: AnyItem[] = [];
    for (const row of result as any[]) {
      const item = this.parseItemFromRow(row);
      if (item) {
        // Load attachments
        item.attachments = await this.getAttachmentsByItemId(item.id);
        items.push(item);
      }
    }

    return items;
  }

  async getAllItems(): Promise<AnyItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM items ORDER BY updated_at DESC'
    );

    const items: AnyItem[] = [];
    for (const row of result as any[]) {
      const item = this.parseItemFromRow(row);
      if (item) {
        item.attachments = await this.getAttachmentsByItemId(item.id);
        items.push(item);
      }
    }

    return items;
  }

  async getItemById(itemId: string): Promise<AnyItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM items WHERE id = ?',
      [itemId]
    );

    if (!result) return null;

    const item = this.parseItemFromRow(result as any);
    if (item) {
      item.attachments = await this.getAttachmentsByItemId(item.id);
    }

    return item;
  }

  async getUpcomingReminders(days: number = 7): Promise<AnyItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const result = await this.db.getAllAsync(
      `SELECT * FROM items 
       WHERE is_reminder_active = 1 
       AND reminder_date IS NOT NULL 
       AND reminder_date <= ? 
       ORDER BY reminder_date ASC`,
      [endDate.getTime()]
    );

    const items: AnyItem[] = [];
    for (const row of result as any[]) {
      const item = this.parseItemFromRow(row);
      if (item) {
        item.attachments = await this.getAttachmentsByItemId(item.id);
        items.push(item);
      }
    }

    return items;
  }

  private parseItemFromRow(row: any): AnyItem | null {
    try {
      const baseData = {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        reminderDate: row.reminder_date ? new Date(row.reminder_date) : undefined,
        isReminderActive: row.is_reminder_active === 1,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
      };

      const specificData = JSON.parse(row.data);
      return { ...baseData, ...specificData } as AnyItem;
    } catch (error) {
      console.error('Error parsing item from row:', error);
      return null;
    }
  }

  private async getAttachmentsByItemId(itemId: string) {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(
      'SELECT * FROM attachments WHERE item_id = ?',
      [itemId]
    );

    return result.map((row: any) => ({
      id: row.id,
      uri: row.uri,
      type: row.type,
      fileName: row.file_name,
      extractedText: row.extracted_text,
    }));
  }

  async insertServiceRecord(itemId: string, record: ServiceRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO service_records (id, item_id, date, description, cost, service_provider)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        itemId,
        record.date.getTime(),
        record.description,
        record.cost || null,
        record.serviceProvider || null
      ]
    );
  }

  async getServiceRecordsByItemId(itemId: string): Promise<ServiceRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM service_records WHERE item_id = ? ORDER BY date DESC',
      [itemId]
    );

    return result.map((row: any) => ({
      id: row.id,
      date: new Date(row.date),
      description: row.description,
      cost: row.cost,
      serviceProvider: row.service_provider,
    }));
  }

  async insertReminder(reminder: Reminder): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO reminders (id, item_id, title, message, scheduled_date, is_active, frequency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reminder.id,
        reminder.itemId,
        reminder.title,
        reminder.message,
        reminder.scheduledDate.getTime(),
        reminder.isActive ? 1 : 0,
        reminder.frequency || null
      ]
    );
  }

  async getActiveReminders(): Promise<Reminder[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM reminders WHERE is_active = 1 ORDER BY scheduled_date ASC'
    );

    return result.map((row: any) => ({
      id: row.id,
      itemId: row.item_id,
      title: row.title,
      message: row.message,
      scheduledDate: new Date(row.scheduled_date),
      isActive: row.is_active === 1,
      frequency: row.frequency,
    }));
  }

  async searchItems(query: string): Promise<AnyItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM items 
       WHERE title LIKE ? OR description LIKE ? OR data LIKE ?
       ORDER BY updated_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    const items: AnyItem[] = [];
    for (const row of result as any[]) {
      const item = this.parseItemFromRow(row);
      if (item) {
        item.attachments = await this.getAttachmentsByItemId(item.id);
        items.push(item);
      }
    }

    return items;
  }
}

export const databaseService = new DatabaseService();