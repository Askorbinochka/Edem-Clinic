
// Функція для відкриття та закриття вікна входу в адмін-панель
function toggleModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    const isFlex = modal.style.display === 'flex';
    modal.style.display = isFlex ? 'none' : 'flex';

    if (!isFlex) {
        const emailInput = document.getElementById('adminEmail');
        if (emailInput) emailInput.focus();
        
        document.getElementById('errorMsg').style.display = 'none';
        document.getElementById('adminPass').value = '';
        if (emailInput) emailInput.value = '';
    }
}

// Перевірка логіна та пароля через Firebase
function verifyPassword() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('errorMsg');

    if(!email || !pass) {
        if (errorMsg) {
            errorMsg.innerText = "Заповніть всі поля";
            errorMsg.style.display = 'block';
        }
        return;
    }

    // Авторизація через Firebase 
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
            window.location.href = "admin.html";
        })
        .catch((error) => {
            if (errorMsg) {
                errorMsg.innerText = "Невірний логін або пароль";
                errorMsg.style.display = 'block';
            }
            console.error("Auth Error:", error.message);
        });
}
document.querySelectorAll('#adminEmail, #adminPass').forEach(input => {
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyPassword();
    });
});

// Закриваю модальне вікно, якщо клікнути десь поза ним (на темний фон)
window.onclick = (event) => {
    const modal = document.getElementById('adminModal');
    if (event.target == modal) toggleModal();
};

// автоматично додаю +380 і дозволяю лише цифри
const phoneInput = document.getElementById('user_phone');
if (phoneInput) {
    phoneInput.addEventListener('focus', function() {
        if (this.value === "") this.value = "+380";
    });
    phoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^\d+]/g, '');
        if (this.value.length > 13) this.value = this.value.slice(0, 13);
    });
}

// Функція для появи елементів 
const reveal = () => {
    document.querySelectorAll(".reveal").forEach(el => {
        let windowHeight = window.innerHeight;
        let elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) el.classList.add("active");
    });
};
window.addEventListener("scroll", reveal);

// Виводжу на сайт тільки ті відгуки, які я схвалила 
function displayApprovedReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    db.ref('reviews').orderByChild('status').equalTo('approved').on('value', (snapshot) => {
        container.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.values(data).reverse().forEach(rev => {
                container.innerHTML += `
                    <div class="review-card reveal">
                        <div class="stars">${"★".repeat(rev.rating || 5)}${"☆".repeat(5 - (rev.rating || 5))}</div>
                        <p class="review-text">"${rev.text}"</p>
                        <strong>— ${rev.name}</strong>
                    </div>`;
            });
            reveal(); 
        }
    });
}

// Завантажую список лікарів з бази 
function loadDoctorsOnMain() {
    const grid = document.querySelector('.doctors-grid');
    const select = document.getElementById('doctorSelect');
    if (!grid) return;

    db.ref('doctors').on('value', (snapshot) => {
        const data = snapshot.val();
        grid.innerHTML = '';
        if (select) select.innerHTML = '<option value="" disabled selected>Оберіть лікаря</option>';

        if (data) {
            Object.values(data).forEach(doc => {
                grid.innerHTML += `
                    <div class="doctor-card reveal">
                        <div class="experience-tag">${doc.exp}</div>
                        <div class="doctor-img-box">
                            <img src="${doc.img}" class="doctor-img" alt="${doc.name}">
                            <div class="doctor-info-glass">
                                <h4>${doc.name}</h4>
                                <p>${doc.role}</p>
                            </div>
                        </div>
                    </div>`;
                if (select) {
                    let opt = new Option(doc.name, doc.name);
                    select.add(opt);
                }
            });
            reveal();
        }
    });
}

// Динамічно підтягую ціни з бази даних
function loadPricesOnMain() {
    const priceContainer = document.getElementById('priceListContainer'); 
    if (!priceContainer) return;

    db.ref('prices').on('value', (snapshot) => {
        const data = snapshot.val();
        priceContainer.innerHTML = ''; 
        
        if (data) {
            Object.values(data).forEach(item => {
                priceContainer.innerHTML += `
                    <div class="price-item reveal">
                        <div class="price-name">${item.name}</div>
                        <div class="price-value">${item.price}</div>
                    </div>`;
            });
            reveal();
        }
    });
}

// Обробка форми відгуків
document.getElementById('revForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newReview = {
        name: document.getElementById('revName').value,
        text: document.getElementById('revText').value,
        rating: parseInt(document.querySelector('input[name="rating"]:checked')?.value || 5),
        status: 'pending',
        timestamp: Date.now()
    };
    db.ref('reviews').push(newReview).then(() => {
        alert('Дякуємо! Відгук з’явиться після модерації.');
        e.target.reset();
    });
});

// Обробка форми запису на прийом
document.getElementById('appForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const doctor = document.getElementById('doctorSelect').value;
    const nameInput = e.target.querySelector('input[type="text"]');
    
    if(!doctor) return alert('Будь ласка, оберіть лікаря');

    const newApp = {
        name: nameInput.value,
        phone: document.getElementById('user_phone').value,
        doctor: doctor,
        date: new Date().toLocaleString('uk-UA'),
        timestamp: Date.now()
    };
    db.ref('appointments').push(newApp).then(() => {
        alert('Записано до лікаря ' + doctor + '. Ми вам зателефонуємо!');
        e.target.reset();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    displayApprovedReviews();
    loadDoctorsOnMain();
    loadPricesOnMain();
    
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menuToggle && navList) {
        menuToggle.onclick = () => navList.classList.toggle('active');
    
        navList.querySelectorAll('a').forEach(link => {
            link.onclick = () => navList.classList.remove('active');
        });
    }
});
