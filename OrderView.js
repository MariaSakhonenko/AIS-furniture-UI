class OrderView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentUser = { name: 'Администратор', role: 'admin' };
  }

  displayOrders(orders) {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    orders.forEach(order => {
      const orderElement = this._createOrderElement(order);
      this.container.appendChild(orderElement);
    });
  }

  _createOrderElement(order) {
    const div = document.createElement('article');
    div.className = 'card order';
    div.dataset.id = order.id;
    
    const statusClass = order.status === 'завершен' ? 'success' : 
                       order.status === 'в работе' ? 'warning' : '';
    
    div.innerHTML = `
      <header>
        <h3>Заказ #${order.id}</h3>
        <span class="status badge ${statusClass}">${order.status}</span>
      </header>
      <ul class="meta">
        <li><strong>Клиент:</strong> ${order.clientName}</li>
        <li><strong>Вид:</strong> ${order.furnitureType}</li>
        <li><strong>Материалы:</strong> ${order.material}</li>
        <li><strong>Размеры:</strong> ${order.size}</li>
        <li><strong>Количество:</strong> ${order.quantity}</li>
        <li><strong>Стоимость:</strong> ${order.cost} BYN</li>
        <li><strong>Статус оплаты:</strong> ${order.prepaymentPercent}% предоплаты</li>
        <li><strong>Дата создания:</strong> ${order.createdAt.toLocaleDateString()}</li>
      </ul>
      <div class="card-actions">
        <button class="btn view-btn" data-id="${order.id}">Подробнее</button>
        ${this._getActionButtons(order)}
      </div>
    `;
    
    return div;
  }

  _getActionButtons(order) {
    if (!this.currentUser) return '';
    
    let buttons = '';
    
    if (this.currentUser.role === 'admin') {
      buttons += `
        <button class="btn edit-btn" data-id="${order.id}">Редактировать</button>
        <button class="btn danger delete-btn" data-id="${order.id}">Удалить</button>
      `;
    }
    
    if (order.status === 'в работе') {
      buttons += `<button class="btn complete-btn" data-id="${order.id}">Завершить</button>`;
    }
    
    return buttons;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; 
      padding: 12px 20px; border-radius: 8px; 
      background: ${type === 'success' ? '#243a32' : '#3b3224'}; 
      color: ${type === 'success' ? '#a6e9c7' : '#ffe3a6'}; 
      z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  setUser(user) {
    this.currentUser = user;
  }
}
