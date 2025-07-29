document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const formTitle = document.getElementById('formTitle');

  // Chuyển đổi giữa form đăng nhập và đăng ký
  switchToRegister.addEventListener('click', function(e) {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    formTitle.textContent = 'Đăng ký tài khoản';
  });

  switchToLogin.addEventListener('click', function(e) {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    formTitle.textContent = 'Đăng nhập';
  });

  // Xử lý đăng nhập
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Lấy dữ liệu từ localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Lưu thông tin user đã đăng nhập
      localStorage.setItem('currentUser', JSON.stringify(user));
      showNotification('Đăng nhập thành công!');

      // Cập nhật giao diện ngay lập tức
      if (typeof checkAuthStatus === 'function') {
        checkAuthStatus();
      }

      // Chuyển hướng dựa trên redirect hoặc về index
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || 'index.html';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      showNotification('Email hoặc mật khẩu không đúng!', true);
    }
  });

  // Xử lý đăng ký
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Kiểm tra mật khẩu trùng khớp
    if (password !== confirmPassword) {
      showNotification('Mật khẩu không trùng khớp!', true);
      return;
    }

    // Kiểm tra email đã tồn tại chưa
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(u => u.email === email);

    if (userExists) {
      showNotification('Email đã được đăng ký!', true);
      return;
    }

    // Tạo user mới
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      joinDate: new Date().toISOString()
    };

    // Lưu vào localStorage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Thông báo và chuyển về form đăng nhập
    showNotification('Đăng ký thành công!');
    registerForm.reset();

    setTimeout(() => {
      registerForm.style.display = 'none';
      loginForm.style.display = 'flex';
      formTitle.textContent = 'Đăng nhập';
    }, 1500);
  });

  // Hiển thị thông báo
  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Kiểm tra nếu đã đăng nhập thì chuyển hướng
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && window.location.pathname.includes('login.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'index.html';
    window.location.href = redirectUrl;
  }
});