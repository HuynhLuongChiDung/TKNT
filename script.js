// Modal ảnh chi tiết
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImage");
const closeBtn = document.querySelector(".close");

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const imgSrc = card.querySelector("img").src;
    modalImg.src = imgSrc;
    modal.style.display = "flex";
  });
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Tìm kiếm theo từ khóa
document.getElementById("searchInput").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const cards = document.querySelectorAll(".category-card");
  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    card.style.display = name.includes(keyword) ? "block" : "none";
  });
});
