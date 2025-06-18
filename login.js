document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault(); // Ngăn reload trang

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Giả lập tài khoản đúng
  if (email === "admin@example.com" && password === "123456") {
    alert("Đăng nhập thành công!");
    window.location.href = "index.html"; // Chuyển về trang chủ
  } else {
    alert("Sai email hoặc mật khẩu!");
  }
});
