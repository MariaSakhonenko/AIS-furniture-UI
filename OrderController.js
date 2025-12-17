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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    window.addEventListener('beforeunload', () => {
      this.saveOrdersToStorage();
    });
  }

  handleLogin(form) {
    const formData = new FormData(form);
    const username = formData.get('email');
    const password = formData.get('password');
    
    const result = this.authController.login(username, password);
    
    if (result.success) {
      this.orderView.showNotification('Успешный вход!', 'success');
      this.orderView.setUser(result.user);
      this.updateUI();
      this.showPage('home');
      form.reset();
    } else {
      this.orderView.showNotification(result.message, 'error');
    }
  }

  handleLogout() {
    this.authController.logout();
    this.orderView.setUser(null);
    this.orderView.showNotification('Вы вышли из системы', 'info');
    this.updateUI();
    this.showPage('home');
  }

  handleAddOrder(form) {
    if (!this.authController.isAuthenticated()) {
      this.orderView.showNotification('Требуется авторизация', 'error');
      this.showPage('login');
      return;
    }
    
    const formData = new FormData(form);
    const user = this.authController.getUserInfo();
    
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
      this.orderView.showNotification('Заказ успешно добавлен!', 'success');
      form.reset();
      this.showPage('orders');
      this.renderOrders();
    } else {
      this.orderView.showNotification('Ошибка при добавлении заказа', 'error');
    }
  }

  handleDeleteOrder(orderId) {
    if (!this.authController.hasRole('admin')) {
      this.orderView.showNotification('Только администратор может удалять заказы', 'error');
      return;
    }
    
    if (confirm(`Удалить заказ #${orderId}?`)) {
      if (this.orderCollection.removeOrder(orderId)) {
        this.saveOrdersToStorage();
        this.orderView.showNotification('Заказ удален', 'success');
        this.renderOrders();
      }
    }
  }

  handleEditOrder(orderId) {
    if (!this.authController.hasRole('admin') && !this.authController.hasRole('designer')) {
      this.orderView.showNotification('Недостаточно прав для редактирования', 'error');
      return;
    }
    
    const order = this.orderCollection.getOrder(orderId);
    if (!order) return;
    
    const newStatus = prompt('Введите новый статус (в очереди/в работе/завершен):', order.status);
    if (newStatus && ['в очереди', 'в работе', 'завершен'].includes(newStatus)) {
      if (this.orderCollection.editOrder(orderId, { status: newStatus })) {
        this.saveOrdersToStorage();
        this.orderView.showNotification('Статус заказа обновлен', 'success');
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
      alert(`Заказ #${order.id}\nСтатус: ${order.status}\nКлиент: ${order.clientName}\nСтоимость: ${order.cost} BYN`);
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
          <h3>Заказ #${order.id} — текущий статус</h3>
          <ul class="meta">
            <li><strong>Статус:</strong> ${order.status}</li>
            <li><strong>Стоимость:</strong> ${order.cost} BYN</li>
            <li><strong>Предоплата:</strong> ${order.prepaymentPercent}%</li>
            <li><strong>Материалы:</strong> ${order.material}</li>
            <li><strong>Дата создания:</strong> ${order.createdAt.toLocaleDateString()}</li>
            ${order.status === 'завершен' ? `<li><strong>Заказ завершен!</strong></li>` : ''}
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
  
  const searchText = formData.get('q');
  const status = formData.get('status');
  
  if (searchText && searchText.trim() !== '') {
    this.currentFilters.author = searchText.trim();
  }
  
  if (status && status !== 'Все') {
    this.currentFilters.status = status;
  }
  
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
    const prevBtn = document.querySelector('.prev-page');
    const nextBtn = document.querySelector('.next-page');
    if (prevBtn) prevBtn.disabled = this.currentPage === 0;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages - 1;
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
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
      const submitBtn = orderForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = !this.authController.isAuthenticated();
        submitBtn.title = this.authController.isAuthenticated() ? '' : 'Требуется авторизация';
      }
    }
  }
}
