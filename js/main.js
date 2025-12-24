document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".nav-bar button");
  const sections = document.querySelectorAll(".container, .past-books-section");

  function hideAllSections() {
    sections.forEach(section => {
      section.classList.remove("active");
      section.style.display = ""; // 🔥 CRITICAL: clear inline display overrides
    });
  }

  buttons.forEach(button => {
    const targetId = button.dataset.target;

    // Home button = hard reset
    if (targetId === "home") {
      button.addEventListener("click", () => {
        location.reload();
      });
      return;
    }

    button.addEventListener("click", () => {
      hideAllSections();

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });
});
