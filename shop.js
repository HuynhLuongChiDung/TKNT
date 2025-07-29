document.addEventListener('DOMContentLoaded', function() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  if (window.location.pathname.includes('favorites.html') && !JSON.parse(localStorage.getItem('currentUser'))) {
    window.location.href = 'login.html?redirect=favorites.html';
    return;
  }

  updateCartUI();
  updateFavoritesUI();

  window.addToCart = function(id, name, price) {
    if (!JSON.parse(localStorage.getItem('currentUser'))) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showNotification('Đã thêm vào giỏ hàng!');
  };

  window.removeFromCart = function(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
      cart[index].quantity -= 1;
      if (cart[index].quantity === 0) {
        cart.splice(index, 1);
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartUI();
      showNotification('Đã xóa sản phẩm khỏi giỏ hàng!');
    }
  };

  window.toggleFavorite = function(id, name, price, image) {
    if (!JSON.parse(localStorage.getItem('currentUser'))) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    const existingFavorite = favorites.find(item => item.id === id);
    if (existingFavorite) {
      const index = favorites.findIndex(item => item.id === id);
      favorites.splice(index, 1);
    } else {
      favorites.push({ id, name, price, image });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesUI();
    showNotification(existingFavorite ? 'Đã xóa khỏi yêu thích!' : 'Đã thêm vào yêu thích!');
  };

  function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    if (window.location.pathname.includes('shop.html')) {
      const cartItems = document.getElementById('cartItems');
      const cartTotal = document.getElementById('cartTotal');
      const checkoutBtn = document.getElementById('checkoutBtn');

      if (cartItems && cartTotal && checkoutBtn) {
        cartItems.style.opacity = '0';
        setTimeout(() => {
          cartItems.innerHTML = '';
          let total = 0;
          cart.forEach(item => {
            total += item.price * item.quantity;
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
              <span>${item.name} x${item.quantity}</span>
              <span>${(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
              <button onclick="removeFromCart(${item.id})">Xóa</button>
            `;
            cartItems.appendChild(itemElement);
          });

          cartTotal.textContent = total.toLocaleString('vi-VN') + '₫';
          checkoutBtn.disabled = cart.length === 0;
          cartItems.style.transition = 'opacity 0.3s';
          cartItems.style.opacity = '1';
        }, 300);
      }
    }
  }

  function updateFavoritesUI() {
    const favoriteCount = document.getElementById('favoriteCount');
    const productCards = document.querySelectorAll('.product-card');
    const favoriteItems = document.getElementById('favoriteItems');
    const noFavorites = document.getElementById('noFavorites');

    if (favoriteCount) {
      favoriteCount.textContent = favorites.length;
    }

    if (productCards) {
      productCards.forEach(card => {
        const id = parseInt(card.dataset.id);
        const favoriteBtn = card.querySelector('.favorite-btn');
        if (favoriteBtn) {
          if (favorites.some(item => item.id === id)) {
            favoriteBtn.classList.add('favorited');
          } else {
            favoriteBtn.classList.remove('favorited');
          }
        }
      });
    }

    if (favoriteItems && noFavorites) {
      favoriteItems.innerHTML = '';
      if (favorites.length === 0) {
        noFavorites.style.display = 'block';
      } else {
        noFavorites.style.display = 'none';
        favorites.forEach(item => {
          const imageSrc = item.image || 'images/placeholder.jpg';
          const itemElement = document.createElement('div');
          itemElement.className = 'product-card';
          itemElement.dataset.id = item.id;
          itemElement.innerHTML = `
            <button class="favorite-btn favorited" onclick="toggleFavorite(${item.id}, '${item.name}', ${item.price}, '${imageSrc}')">❤️</button>
            <img src="${imageSrc}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
            <h3>${item.name}</h3>
            <p>${item.price.toLocaleString('vi-VN')}₫</p>
            <button onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Thêm vào giỏ</button>
          `;
          favoriteItems.appendChild(itemElement);
        });
      }
    }
  }

  const stripe = Stripe('pk_test_51N4f3H2e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function() {
      if (!JSON.parse(localStorage.getItem('currentUser'))) {
        window.location.href = 'login.html?redirect=shop.html';
        return;
      }

      try {
        const response = await fetch('https://your-backend.com/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart })
        });
        const session = await response.json();
        stripe.redirectToCheckout({ sessionId: session.id });
      } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Lỗi khi xử lý thanh toán!', true);
      }
    });
  }

  window.showNotification = function(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:10px 20px; background:${isError ? '#e74c3c' : '#1c8e52'}; color:white; border-radius:5px; opacity:0; transition:opacity 0.3s; z-index:1000;`;
    document.body.appendChild(notification);
    setTimeout(() => notification.style.opacity = '1', 10);
    setTimeout(() => notification.style.opacity = '0', 2500);
    setTimeout(() => notification.remove(), 2800);
  };
});