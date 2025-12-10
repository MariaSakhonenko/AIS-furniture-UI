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
          id: 'client001', 
          username: 'client', 
          password: 'client123', 
          role: 'client',
          name: 'Клиент Тестовый',
          email: 'client@test.com'
        },
        { 
          id: 'designer001', 
          username: 'designer', 
          password: 'designer123', 
          role: 'designer',
          name: 'Дизайнер Петров',
          email: 'designer@furniture.com'
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
    
    return { success: false, message: 'Неверное имя пользователя или пароль' };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    return { success: true };
  }

  register(userData) {
    const users = JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    
    if (users.some(u => u.username === userData.username)) {
      return { success: false, message: 'Пользователь с таким именем уже существует' };
    }
    
    const newUser = {
      id: 'user' + Date.now(),
      ...userData,
      role: userData.role || 'client'
    };
    
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    return { success: true, user: newUser };
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
