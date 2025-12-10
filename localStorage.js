class StorageManager {
  constructor(storageKey = 'furnitureOrders') {
    this.storageKey = storageKey;
  }

  saveOrders(orders) {
    try {
      const serialized = JSON.stringify(orders, this._replacer);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
      return false;
    }
  }

  loadOrders() {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) return [];
      
      return JSON.parse(serialized, this._reviver);
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error);
      return [];
    }
  }

  _replacer(key, value) {
    if (key === 'createdAt' && value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }

  _reviver(key, value) {
    if (key === 'createdAt' && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }

  hasData() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  getStorageInfo() {
    const data = localStorage.getItem(this.storageKey);
    return {
      hasData: data !== null,
      size: data ? new Blob([data]).size : 0,
      itemCount: data ? JSON.parse(data).length : 0
    };
  }
}
