let orderCollection;
let orderView;

document.addEventListener('DOMContentLoaded', () => {
  orderCollection = new OrderCollection(ordersData);
  orderView = new OrderView('orders-list-container');
  
  initializeNavigation();
  initializeOrdersSection();
  initializeOrderForm();
  initializeStatusForm();
  initializeAdminSection();
  
  showPage('home');
  renderOrders();
});

function initializeNavigation() {
  document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('href').substring(1);
      showPage(pageId);
    });
  });
}

function initializeOrdersSection() {
  const searchInput = document.getElementById('q');
  const statusSelect = document.getElementById('status');
  const sortSelect = document.getElementById('sort');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filterConfig = { author: e.target.value };
      const filteredOrders = orderCollection.getOrders(0, 10, filterConfig);
      orderView.displayOrders(filteredOrders);
    });
  }
  
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      const filterConfig = { status: e.target.value };
      const filteredOrders = orderCollection.getOrders(0, 10, filterConfig);
      orderView.displayOrders(filteredOrders);
    });
  }
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      renderOrders();
    });
  }
  
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const orderId = e.target.dataset.id;
      if (confirm(`Удалить заказ #${orderId}?`)) {
        removeOrder(orderId);
      }
    }
    
    if (e.target.classList.contains('edit-btn')) {
      const orderId = e.target.dataset.id;
      const order = orderCollection.getOrder(orderId);
      if (order) {
        showEditForm(order);
      }
    }
    
    if (e.target.classList.contains('complete-btn')) {
      const orderId = e.target.dataset.id;
      editOrder(orderId, { status: 'завершен' });
    }
  });
}

function initializeOrderForm() {
  const form = document.getElementById('order-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const orderData = {
        id: `ORD-${Date.now()}`,
        description: formData.get('client-name') + ' - ' + formData.get('furniture-type'),
        createdAt: new Date(),
        author: formData.get('client-name'),
        clientName: formData.get('client-name'),
        clientAddress: formData.get('client-address'),
        clientPhone: formData.get('client-phone'),
        furnitureType: formData.get('furniture-type'),
        material: `${formData.get('wood-type') || ''}, ${formData.get('hardware-type') || ''}`,
        size: `${formData.get('size-w') || 0}x${formData.get('size-h') || 0}x${formData.get('size-d') || 0}см`,
        quantity: parseInt(formData.get('quantity') || 1),
        cost: parseInt(formData.get('install-cost') || 0) + 1000,
        status: 'в очереди',
        paymentMethod: formData.get('pay') || 'наличные',
        prepaymentPercent: parseInt(formData.get('prepay') || 30),
        installCost: parseInt(formData.get('install-cost') || 0)
      };
      
      if (addOrder(orderData)) {
        form.reset();
        showPage('orders');
      }
    });
  }
}

function initializeStatusForm() {
  const form = document.querySelector('#order-status form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const orderId = form.querySelector('#order-id').value;
      const order = orderCollection.getOrder(orderId);
      
      if (order) {
        const statusView = document.querySelector('.status-view');
        if (statusView) {
          statusView.innerHTML = `
            <h3>Заказ #${order.id} — текущий статус</h3>
            <ul class="meta">
              <li><strong>Статус:</strong> ${order.status}</li>
              <li><strong>Стоимость:</strong> ${order.cost} BYN</li>
              <li><strong>Предоплата:</strong> ${order.prepaymentPercent}%</li>
              <li><strong>Материалы:</strong> ${order.material}</li>
            </ul>
          `;
        }
      } else {
        orderView.showNotification('Заказ не найден', 'error');
      }
    });
  }
}

function initializeAdminSection() {
  const createUserForm = document.querySelector('#admin form');
  if (createUserForm) {
    createUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      orderView.showNotification('Пользователь добавлен (заглушка)', 'success');
      createUserForm.reset();
    });
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = 'block';
  }
}

function renderOrders() {
  const orders = orderCollection.getOrders(0, 10);
  orderView.displayOrders(orders);
}

function showEditForm(order) {
  const newStatus = prompt('Введите новый статус (в очереди/в работе/завершен):', order.status);
  if (newStatus && ['в очереди', 'в работе', 'завершен'].includes(newStatus)) {
    editOrder(order.id, { status: newStatus });
  }
}

function addOrder(orderData) {
  if (orderCollection.addOrder(orderData)) {
    orderView.showNotification('Заказ успешно добавлен', 'success');
    renderOrders();
    return true;
  } else {
    orderView.showNotification('Ошибка при добавлении заказа', 'error');
    return false;
  }
}

function editOrder(id, updates) {
  if (orderCollection.editOrder(id, updates)) {
    orderView.showNotification('Заказ обновлен', 'success');
    renderOrders();
    return true;
  } else {
    orderView.showNotification('Ошибка при обновлении заказа', 'error');
    return false;
  }
}

function removeOrder(id) {
  if (orderCollection.removeOrder(id)) {
    orderView.showNotification('Заказ удален', 'success');
    renderOrders();
    return true;
  } else {
    orderView.showNotification('Заказ не найден', 'error');
    return false;
  }
}

function getOrder(id) {
  return orderCollection.getOrder(id);
}

function getStats() {
  return orderCollection.getStatistics();
}

window.app = {
  addOrder,
  editOrder,
  removeOrder,
  getOrder,
  getStats,
  orderCollection,
  orderView
};
