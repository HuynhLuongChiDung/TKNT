document.addEventListener('DOMContentLoaded', function() {
  // Kiểm tra trạng thái đăng nhập trên tất cả các trang
  checkAuthStatus();
});

function checkAuthStatus() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userSection = document.getElementById('userSection');
  const loginLink = document.getElementById('loginLink');
  
  if (currentUser && userSection) {
    // Hiển thị thông tin người dùng đã đăng nhập
    userSection.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <span class="user-name">${currentUser.name.split(' ')[0]}</span>
        <button id="logoutBtn" class="logout-btn">Đăng xuất</button>
      </div>
    `;
    
    // Xử lý đăng xuất
    document.getElementById('logoutBtn').addEventListener('click', function() {
      localStorage.removeItem('currentUser');
      // Cập nhật lại giao diện sau khi đăng xuất
      checkAuthStatus();
      window.location.href = 'index.html';
    });
  } else if (loginLink) {
    // Thêm redirect URL khi click đăng nhập
    const currentPage = window.location.pathname.split('/').pop();
    loginLink.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
  }
  
  // Thêm style cho user info nếu chưa có
  if (!document.querySelector('style[data-user-info]')) {
    const style = document.createElement('style');
    style.dataset.userInfo = true;
    style.textContent = `
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
      }
      
      .user-avatar {
        width: 32px;
        height: 32px;
        background-color: #1c8e52;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .user-name {
        font-size: 14px;
        color: #333;
      }
      
      .logout-btn {
        background: none;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .logout-btn:hover {
        background: #f5f5f5;
      }
    `;
    document.head.appendChild(style);
  }
}

// Cho phép hàm có thể được gọi từ bên ngoài
window.checkAuthStatus = checkAuthStatus;