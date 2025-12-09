class OrderCollection {
  constructor(orders = []) {
    this._orders = [...orders];
    this._sortOrdersById();
  }

  _sortOrdersById() {
    this._orders.sort((a, b) => a.id.localeCompare(b.id));
  }

  _validateOrder(order) {
    if (!order) return false;
    
    const requiredFields = ['id', 'description', 'createdAt', 'author'];
    for (const field of requiredFields) {
      if (!order[field]) return false;
    }
    
    if (order.description.length > 200) return false;
    if (!order.author.trim()) return false;
    if (!(order.createdAt instanceof Date)) return false;
    
    return true;
  }

  getOrders(skip = 0, top = 10, filterConfig = {}) {
    let filteredOrders = [...this._orders];
    
    if (filterConfig.author) {
      filteredOrders = filteredOrders.filter(order => 
        order.author.toLowerCase().includes(filterConfig.author.toLowerCase())
      );
    }
    
    if (filterConfig.status && filterConfig.status !== 'Все') {
      filteredOrders = filteredOrders.filter(order => 
        order.status === filterConfig.status
      );
    }
    
    if (filterConfig.furnitureType && filterConfig.furnitureType !== 'Все') {
      filteredOrders = filteredOrders.filter(order => 
        order.furnitureType === filterConfig.furnitureType
      );
    }
    
    if (filterConfig.minCost !== undefined) {
      filteredOrders = filteredOrders.filter(order => 
        order.cost >= filterConfig.minCost
      );
    }
    
    if (filterConfig.maxCost !== undefined) {
      filteredOrders = filteredOrders.filter(order => 
        order.cost <= filterConfig.maxCost
      );
    }
    
    filteredOrders.sort((a, b) => b.createdAt - a.createdAt);
    
    return filteredOrders.slice(skip, skip + top);
  }

  getOrder(id) {
    return this._orders.find(order => order.id === id);
  }

  addOrder(order) {
    if (!this._validateOrder(order)) return false;
    if (this.getOrder(order.id)) return false;
    
    this._orders.push(order);
    this._sortOrdersById();
    return true;
  }

  editOrder(id, updates) {
    const index = this._orders.findIndex(order => order.id === id);
    if (index === -1) return false;
    
    const orderToUpdate = { ...this._orders[index] };
    
    delete updates.id;
    delete updates.author;
    delete updates.createdAt;
    
    Object.assign(orderToUpdate, updates);
    
    if (!this._validateOrder(orderToUpdate)) return false;
    
    this._orders[index] = orderToUpdate;
    return true;
  }

  removeOrder(id) {
    const initialLength = this._orders.length;
    this._orders = this._orders.filter(order => order.id !== id);
    return this._orders.length !== initialLength;
  }

  addAll(orders) {
    const invalidOrders = [];
    
    orders.forEach(order => {
      if (!this._validateOrder(order) || this.getOrder(order.id)) {
        invalidOrders.push(order);
      } else {
        this._orders.push(order);
      }
    });
    
    this._sortOrdersById();
    return invalidOrders;
  }

  clear() {
    this._orders = [];
  }

  getStatistics() {
    const stats = {
      totalOrders: this._orders.length,
      totalCost: this._orders.reduce((sum, order) => sum + order.cost, 0),
      byStatus: {},
      byMaterial: {},
      byType: {}
    };
    
    this._orders.forEach(order => {
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      stats.byMaterial[order.material] = (stats.byMaterial[order.material] || 0) + 1;
      stats.byType[order.furnitureType] = (stats.byType[order.furnitureType] || 0) + 1;
    });
    
    return stats;
  }
}
