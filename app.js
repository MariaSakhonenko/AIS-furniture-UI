class StorageManager {
  constructor(storageKey = 'furnitureOrders') {
    this.storageKey = storageKey;
  }

  saveOrders(orders) {
    try {
      const serialized = JSON.stringify(orders, (key, value) => {
        if (key === 'createdAt' && value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      return false;
    }
  }

  loadOrders() {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) return [];
      
      return JSON.parse(serialized, (key, value) => {
        if (key === 'createdAt' && typeof value === 'string') {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      return [];
    }
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }

  hasData() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

class AuthController {
  constructor() {
    this.currentUser = null;
    this.usersKey = 'furnitureUsers';
    this.initDefaultUsers();
    this.loadCurrentUser();
  }

  initDefaultUsers() {
  if (!localStorage.getItem(this.usersKey)) {
    const defaultUsers = [
      { 
        id: 'admin001', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin',
        name: 'Администратор',
        email: 'admin@furniture.com'
      },
      { 
        id: 'designer001', 
        username: 'designer', 
        password: 'design123', 
        role: 'designer',
        name: 'Дизайнер Петров',
        email: 'designer@furniture.com'
      },
      { 
        id: 'client001', 
        username: 'client', 
        password: 'client123', 
        role: 'client',
        name: 'Клиент Иванов',
        email: 'client@example.com'
      }
    ];
    localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
  }
}

  loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  saveCurrentUser() {
    if (this.currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  login(username, password) {
    const users = JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.currentUser = { ...user };
      delete this.currentUser.password;
      this.saveCurrentUser();
      return { success: true, user: this.currentUser };
    }
    
    return { success: false, message: 'Неверные данные' };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    return { success: true };
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  getUserInfo() {
    return this.currentUser;
  }
}

class OrderController {
  constructor(orderCollection, orderView, storageManager, authController) {
    this.orderCollection = orderCollection;
    this.orderView = orderView;
    this.storageManager = storageManager;
    this.authController = authController;
    
    this.currentPage = 0;
    this.pageSize = 10;
    this.currentFilters = {};
    
    this.init();
  }

  init() {
    this.loadOrdersFromStorage();
    this.setupEventListeners();
    this.updateUI();
  }

  loadOrdersFromStorage() {
    const storedOrders = this.storageManager.loadOrders();
    
    if (storedOrders.length === 0) {
      this.orderCollection = new OrderCollection(ordersData);
      this.storageManager.saveOrders(ordersData);
    } else {
      this.orderCollection = new OrderCollection(storedOrders);
    }
  }

  saveOrdersToStorage() {
    return this.storageManager.saveOrders(this.orderCollection._orders);
  }

  setupEventListeners() {
    document.querySelectorAll('.site-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('href').substring(1);
        this.showPage(pageId);
      });
    });

    const loginForm = document.querySelector('#login form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e.target);
      });
    }

    const orderForm = document.querySelector('#order-form form');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddOrder(e.target);
      });
    }

    const statusForm = document.querySelector('#order-status form');
    if (statusForm) {
      statusForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCheckStatus(e.target);
      });
    }

    const filterForm = document.querySelector('.filters');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFilter(e.target);
      });
      
      filterForm.addEventListener('reset', () => {
        this.currentFilters = {};
        this.currentPage = 0;
        this.renderOrders();
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('prev-page')) {
        e.preventDefault();
        this.prevPage();
      } else if (e.target.classList.contains('next-page')) {
        e.preventDefault();
        this.nextPage();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const orderId = e.target.dataset.id;
        this.handleDeleteOrder(orderId);
      }
      
      if (e.target.classList.contains('edit-btn')) {
        const orderId = e.target.dataset.id;
        this.handleEditOrder(orderId);
      }
      
      if (e.target.classList.contains('complete-btn')) {
        const orderId = e.target.dataset.id;
        this.handleCompleteOrder(orderId);
      }
      
      if (e.target.classList.contains('view-btn')) {
        const orderId = e.target.dataset.id;
        this.handleViewOrder(orderId);
      }
    });

    window.addEventListener('beforeunload', () => {
      this.saveOrdersToStorage();
    });
  }

  handleLogin(form) {
  const usernameInput = form.querySelector('input[name="username"]');
  const passwordInput = form.querySelector('input[name="password"]');
  
  if (!usernameInput || !passwordInput) {
    this.orderView.showNotification('Ошибка формы', 'error');
    return;
  }
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  const result = this.authController.login(username, password);
  
  if (result.success) {
    this.orderView.showNotification('Успешный вход!', 'success');
    this.orderView.setUser(result.user);
    this.updateUI();
    this.showPage('home');
    form.reset();
  } else {
    this.orderView.showNotification('Неверный логин или пароль', 'error');
  }
}
  handleLogout() {
    this.authController.logout();
    this.orderView.setUser(null);
    this.orderView.showNotification('Вы вышли', 'info');
    this.updateUI();
    this.showPage('home');
  }

  handleAddOrder(form) {
        
    const formData = new FormData(form);
    const user = this.authController.getUserInfo() || {
    name: formData.get('client-name') || 'Гость' };
    
    const orderData = {
      id: `ORD-${Date.now()}`,
      description: formData.get('custom-desc') || formData.get('furniture-type'),
      createdAt: new Date(),
      author: user.name,
      photoLink: '',
      clientName: formData.get('client-name'),
      clientAddress: formData.get('client-address'),
      clientPhone: formData.get('client-phone'),
      furnitureType: formData.get('furniture-type'),
      material: `${formData.get('wood-type') || ''}, ${formData.get('hardware-type') || ''}`.trim(),
      size: `${formData.get('size-w') || 0}x${formData.get('size-h') || 0}x${formData.get('size-d') || 0}см`,
      quantity: parseInt(formData.get('quantity') || 1),
      cost: parseInt(formData.get('install-cost') || 0) + 500,
      status: 'в очереди',
      paymentMethod: formData.get('pay') || 'наличные',
      prepaymentPercent: parseInt(formData.get('prepay') || 30),
      installCost: parseInt(formData.get('install-cost') || 0)
    };
    
    if (this.orderCollection.addOrder(orderData)) {
      this.saveOrdersToStorage();
      this.orderView.showNotification('Заказ добавлен!', 'success');
      form.reset();
      this.showPage('orders');
      this.renderOrders();
    } else {
      this.orderView.showNotification('Ошибка', 'error');
    }
  }

  handleDeleteOrder(orderId) {
        
    if (confirm(`Удалить заказ #${orderId}?`)) {
      if (this.orderCollection.removeOrder(orderId)) {
        this.saveOrdersToStorage();
        this.orderView.showNotification('Заказ удален', 'success');
        this.renderOrders();
      }
    }
  }

  handleEditOrder(orderId) {
   
    const order = this.orderCollection.getOrder(orderId);
    if (!order) return;
    
    const newStatus = prompt('Новый статус:', order.status);
    if (newStatus && ['в очереди', 'в работе', 'завершен'].includes(newStatus)) {
      if (this.orderCollection.editOrder(orderId, { status: newStatus })) {
        this.saveOrdersToStorage();
        this.orderView.showNotification('Статус обновлен', 'success');
        this.renderOrders();
      }
    }
  }

  handleCompleteOrder(orderId) {
    if (this.orderCollection.editOrder(orderId, { status: 'завершен' })) {
      this.saveOrdersToStorage();
      this.orderView.showNotification('Заказ завершен', 'success');
      this.renderOrders();
    }
  }

  handleViewOrder(orderId) {
    const order = this.orderCollection.getOrder(orderId);
    if (order) {
      alert(`Заказ #${order.id}\nСтатус: ${order.status}\nКлиент: ${order.clientName}`);
    }
  }

  handleCheckStatus(form) {
    const formData = new FormData(form);
    const orderId = formData.get('order-id');
    const order = this.orderCollection.getOrder(orderId);
    
    if (order) {
      const statusView = document.querySelector('#order-status .status-view');
      if (statusView) {
        statusView.innerHTML = `
          <h3>Заказ #${order.id}</h3>
          <ul class="meta">
            <li><strong>Статус:</strong> ${order.status}</li>
            <li><strong>Стоимость:</strong> ${order.cost} BYN</li>
            <li><strong>Предоплата:</strong> ${order.prepaymentPercent}%</li>
            <li><strong>Дата:</strong> ${order.createdAt.toLocaleDateString()}</li>
          </ul>
        `;
      }
    } else {
      this.orderView.showNotification('Заказ не найден', 'error');
    }
  }

  handleFilter(form) {
    const formData = new FormData(form);
    this.currentFilters = {};
    
    const author = formData.get('q');
    const status = formData.get('status');
    
    if (author) this.currentFilters.author = author;
    if (status && status !== 'Все') this.currentFilters.status = status;
    
    this.currentPage = 0;
    this.renderOrders();
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.renderOrders();
    }
  }

  nextPage() {
    const orders = this.orderCollection.getOrders(
      (this.currentPage + 1) * this.pageSize,
      this.pageSize,
      this.currentFilters
    );
    
    if (orders.length > 0) {
      this.currentPage++;
      this.renderOrders();
    }
  }

  renderOrders() {
    const orders = this.orderCollection.getOrders(
      this.currentPage * this.pageSize,
      this.pageSize,
      this.currentFilters
    );
    
    this.orderView.displayOrders(orders);
    this.updatePagination();
  }

  updatePagination() {
    const totalOrders = this.orderCollection.getOrders(0, 1000000, this.currentFilters).length;
    const totalPages = Math.ceil(totalOrders / this.pageSize);
    
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
      pageInfo.textContent = `Стр. ${this.currentPage + 1} из ${totalPages || 1}`;
    }
  }

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = 'block';
      
      if (pageId === 'orders') {
        this.currentPage = 0;
        this.renderOrders();
      }
    }
  }

  updateUI() {
    const user = this.authController.getUserInfo();
    
    const adminLink = document.querySelector('a[href="#admin"]');
    if (adminLink) {
      adminLink.style.display = this.authController.hasRole('admin') ? 'block' : 'none';
    }
    
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
      userGreeting.textContent = user ? `Привет, ${user.name}` : '';
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = this.authController.isAuthenticated() ? 'block' : 'none';
    }
    
    const loginLink = document.querySelector('a[href="#login"]');
    if (loginLink) {
      loginLink.style.display = this.authController.isAuthenticated() ? 'none' : 'block';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const storageManager = new StorageManager();
  const authController = new AuthController();
  
  let initialOrders = storageManager.loadOrders();
  if (initialOrders.length === 0) {
    initialOrders = ordersData;
    storageManager.saveOrders(initialOrders);
  }
  
  const orderCollection = new OrderCollection(initialOrders);
  const orderView = new OrderView('orders-list-container');
  
  const currentUser = authController.getUserInfo();
  if (currentUser) {
    orderView.setUser(currentUser);
  }
  
  const orderController = new OrderController(
    orderCollection,
    orderView,
    storageManager,
    authController
  );
  
  window.app = {
    orderController,
    orderCollection,
    orderView,
    storageManager,
    authController,
    
    addOrder: (orderData) => {
      if (orderCollection.addOrder(orderData)) {
        storageManager.saveOrders(orderCollection._orders);
        orderView.showNotification('Заказ добавлен', 'success');
        orderController.renderOrders();
        return true;
      }
      return false;
    },
    
    editOrder: (id, updates) => {
      if (orderCollection.editOrder(id, updates)) {
        storageManager.saveOrders(orderCollection._orders);
        orderView.showNotification('Заказ обновлен', 'success');
        orderController.renderOrders();
        return true;
      }
      return false;
    },
    
    removeOrder: (id) => {
      if (orderCollection.removeOrder(id)) {
        storageManager.saveOrders(orderCollection._orders);
        orderView.showNotification('Заказ удален', 'success');
        orderController.renderOrders();
        return true;
      }
      return false;
    },
    
    getOrder: (id) => orderCollection.getOrder(id),
    getStats: () => orderCollection.getStatistics(),
    login: (username, password) => authController.login(username, password),
    logout: () => authController.logout(),
    clearStorage: () => {
      storageManager.clear();
      orderCollection.clear();
      orderView.showNotification('Хранилище очищено', 'info');
    }
  };
  
  orderController.showPage('home');
});
