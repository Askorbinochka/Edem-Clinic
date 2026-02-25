// --- ЛОГІКА МОДАЛЬНОГО ВІКНА --- (Залишається без змін)
function toggleModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    const display = modal.style.display === 'flex' ? 'none' : 'flex';
    modal.style.display = display;

    if (display === 'flex') {
        document.getElementById('adminPass').focus();
        document.getElementById('errorMsg').style.display = 'none';
        document.getElementById('adminPass').value = '';
    }
}

function verifyPassword() {
    const pass = document.getElementById('adminPass').value;
    if (pass === "12345678") {
        sessionStorage.setItem('isAdmin', 'true');
        window.location.href = "admin.html";
    } else {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.style.display = 'block';
        document.getElementById('adminPass').value = '';
    }
}

document.getElementById('adminPass')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') verifyPassword();
});

window.onclick = function (event) {
    const modal = document.getElementById('adminModal');
    if (event.target == modal) toggleModal();
}

// --- ПЕРЕВІРКА ТЕЛЕФОНУ ---
const phoneInput = document.getElementById('user_phone');
if (phoneInput) {
    phoneInput.addEventListener('focus', function () {
        if (this.value === "") this.value = "+380";
    });
    phoneInput.addEventListener('input', function (e) {
        this.value = this.value.replace(/[^\d+]/g, '');
    });
}

// --- АНІМАЦІЇ ПРИ СКРОЛІ ---
const reveal = () => {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
        let windowHeight = window.innerHeight;
        let elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) el.classList.add("active");
    });
};
window.addEventListener("scroll", reveal);
window.addEventListener("load", reveal);

// --- РОБОТА З ВІДГУКАМИ (FIREBASE) ---
const renderStars = (count) => "★".repeat(count) + "☆".repeat(5 - count);

function displayApprovedReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    // Слухаємо зміни в Firebase в реальному часі
    db.ref('reviews').orderByChild('status').equalTo('approved').on('value', (snapshot) => {
        container.innerHTML = ''; // Очищуємо перед оновленням
        const data = snapshot.val();
        
        if (data) {
            // Перетворюємо об'єкт у масив та сортуємо за часом (нові зверху)
            Object.values(data).reverse().forEach(rev => {
                const card = document.createElement('div');
                card.className = 'review-card reveal active'; // додаємо класи для анімації
                card.innerHTML = `
                    <div class="stars">${renderStars(rev.rating || 5)}</div>
                    <p class="review-text">"${rev.text}"</p>
                    <strong>— ${rev.name}</strong>
                `;
                container.appendChild(card);
            });
        }
    });
}

// Відправка форми відгуку у Firebase
const revForm = document.getElementById('revForm');
if (revForm) {
    revForm.onsubmit = (e) => {
        e.preventDefault();
        const newReview = {
            name: document.getElementById('revName').value,
            text: document.getElementById('revText').value,
            rating: parseInt(document.querySelector('input[name="rating"]:checked')?.value || 5),
            status: 'pending',
            timestamp: Date.now()
        };

        db.ref('reviews').push(newReview).then(() => {
            alert('Дякуємо! Ваш відгук з’явиться після модерації.');
            e.target.reset();
        }).catch(err => alert('Помилка: ' + err.message));
    };
}

// --- ЗАПИС НА ПРИЙОМ У FIREBASE ---
const appForm = document.getElementById('appForm');
if (appForm) {
    appForm.onsubmit = (e) => {
        e.preventDefault();
        
        const doctor = document.getElementById('doctorSelect').value; // Отримуємо лікаря

        const newApp = {
            name: e.target.querySelector('input[type="text"]').value,
            phone: phoneInput.value,
            doctor: doctor, // Додаємо лікаря в об'єкт
            date: new Date().toLocaleString('uk-UA'),
            timestamp: Date.now()
        };

        db.ref('appointments').push(newApp).then(() => {
            alert('Дякуємо! Ви записані до лікаря ' + doctor + '. Ми вам зателефонуємо.');
            e.target.reset();
        }).catch(err => alert('Помилка: ' + err.message));
    };
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    displayApprovedReviews();
    
    // Мобільне меню
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
            });
        });
    }
});