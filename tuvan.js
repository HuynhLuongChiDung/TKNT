// Thêm vào cuối file script.js
document.addEventListener('DOMContentLoaded', function() {
  // Xử lý form tư vấn nếu có trên trang
  const consultForm = document.getElementById('consultForm');
  if (consultForm) {
    consultForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Lấy dữ liệu từ form
      const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        note: document.getElementById('note').value
      };
      
      // Ở đây bạn có thể gửi dữ liệu đến server hoặc hiển thị thông báo
      console.log('Form data:', formData);
      alert('Cảm ơn bạn đã đăng ký tư vấn! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
      
      // Reset form sau khi gửi
      consultForm.reset();
    });
  }
});