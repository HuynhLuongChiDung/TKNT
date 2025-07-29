document.addEventListener('DOMContentLoaded', function() {
  // Xử lý form tư vấn
  const consultForm = document.getElementById('consultForm');
  
  if (consultForm) {
    consultForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Lấy dữ liệu từ form
      const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        note: document.getElementById('note').value.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Kiểm tra dữ liệu bắt buộc
      if (!formData.name || !formData.phone || !formData.email || !formData.service || !formData.date || !formData.time) {
        showNotification('Vui lòng điền đầy đủ các trường bắt buộc!', true);
        return;
      }
      
      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showNotification('Email không hợp lệ! Vui lòng nhập lại.', true);
        return;
      }
      
      // Kiểm tra số điện thoại (ít nhất 10 số)
      const phoneRegex = /^\d{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        showNotification('Số điện thoại phải có ít nhất 10 chữ số!', true);
        return;
      }
      
      // Lưu vào localStorage
      const consultations = JSON.parse(localStorage.getItem('consultations')) || [];
      formData.id = Date.now();
      
      // Thêm thông tin user nếu đã đăng nhập
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        formData.userId = currentUser.id;
      }
      
      consultations.push(formData);
      localStorage.setItem('consultations', JSON.stringify(consultations));
      
      // Hiển thị thông báo thành công
      showNotification('Đăng ký tư vấn thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      
      // Reset form
      consultForm.reset();
    });
  }
  
  // Hiển thị thông báo
  function showNotification(message, isError = false) {
    // Tạo thông báo nếu chưa có
    let notification = document.querySelector('.notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
      
      // Thêm style cho notification
      const style = document.createElement('style');
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          background: #1c8e52;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
          max-width: 90%;
          text-align: center;
        }
        .notification.error {
          background: #e74c3c;
        }
        .notification.show {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Cập nhật nội dung và class
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''}`;
    
    // Hiệu ứng hiển thị
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.textContent = '';
      }, 300);
    }, 3000);
  }
});