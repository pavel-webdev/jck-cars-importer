function getCurrencyDisplay(currency, price) {
    const formattedPrice = price.toLocaleString();
    
    switch(currency) {
        case 'JPY':
            return `¥${formattedPrice} JPY`;
        case 'CNY':
            return `¥${formattedPrice} CNY`; 
        case 'KRW':
            return `₩${formattedPrice} KRW`;
        default:
            return `$${formattedPrice} USD`;
    }
}


document.addEventListener('DOMContentLoaded', ()=>{

  function getUser() {
    return JSON.parse(localStorage.getItem('jck_user') || 'null');
  }
  
  function updateAuthNav() {
    const loginBtn = document.getElementById('loginBtn');
    const user = getUser();
    if(!loginBtn) return;
    if(user) {
      loginBtn.textContent = 'Профиль';
      loginBtn.href = '/dashboard';
    } else {
      loginBtn.textContent = 'Вход';
      loginBtn.href = '/auth';
    }
  }

  updateAuthNav();

  // Загружаем машины из БД
  loadVehicles();

// Активная навигация - упрощенная версия
document.querySelectorAll('.nav a').forEach(a => { 
    try { 
        const linkHref = a.getAttribute('href');
        const currentUrl = window.location.href;
        
        console.log('Сравниваем:', linkHref, 'с', currentUrl);
        
        // Убираем класс active у всех
        a.classList.remove('active');
        
        // Простая проверка: содержится ли href ссылки в текущем URL
        if (currentUrl.includes(linkHref) && linkHref !== '/') {
            a.classList.add('active');
        }
        // Для главной страницы
        else if (linkHref === '/' && (currentUrl.endsWith('/') || currentUrl.includes('/index'))) {
            a.classList.add('active');
        }
        // Для случаев когда ссылка без слеша, а URL со слешем
        else if (currentUrl.includes(linkHref + '/') && linkHref !== '/') {
            a.classList.add('active');
        }
        
    } catch(e) {
        console.error('Error checking active nav:', e);
    }
});

  // Слушатели фильтров
  const filterIds = ['search','filterCountry','filterFrom','filterTo','filterMin','filterMax','sortBy','filterModel'];
  filterIds.forEach(id=>{
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener('change', applyFilters);
      if (id !== 'filterCountry' && id !== 'sortBy') {
        el.addEventListener('input', applyFilters);
      }
    }
  });

  // Отдельный слушатель для бренда с обновлением моделей
  const brandSel = document.getElementById('filterBrand');
  if(brandSel) {
    brandSel.addEventListener('change', function() { 
      const b = this.value; 
      const modelSel = document.getElementById('filterModel');
      modelSel.innerHTML = '<option value="">Все модели</option>'; 
      if(window.modelsByBrand && window.modelsByBrand[b]) {
        window.modelsByBrand[b].forEach(m=>{ 
          const o = document.createElement('option'); 
          o.value = m; 
          o.textContent = m; 
          modelSel.appendChild(o); 
        }); 
      }
      applyFilters(); 
    });
  }

  // Анимации появления
  const observer = new IntersectionObserver(entries=>{ 
    entries.forEach(entry=>{ 
      if(entry.isIntersecting){ 
        entry.target.classList.add('show'); 
      } 
    }); 
  }, {threshold:0.15});
  
  document.querySelectorAll('.appear').forEach(el=>observer.observe(el));

  // Валютный виджет
  if (typeof loadCurrencyWidget === 'function') {
    loadCurrencyWidget();
    setInterval(loadCurrencyWidget, 10*60*1000);
  }

  // Адаптивность каталога
  fixCatalogLayout();

  // Инициализация формы помощи
  initHelpForm();
});

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С БД ====================

async function loadVehicles() {
  try {
    const response = await fetch('vehicles.php');
    const data = await response.json();
    
    if (data.success) {
      window.vehicles = data.vehicles;
      console.log('Машины загружены из БД:', window.vehicles);
      
      // Инициализируем модели по брендам для фильтров
      initBrandsModels();
      
      // Инициализируем карусель если есть на странице
      if (document.getElementById('popularTrack')) {
        initCarousel();
      }
      
      // Рендерим каталог если есть на странице
      if (document.getElementById('carList')) {
        renderCatalog(window.vehicles);
      }
      
      console.log('Машины загружены из БД:', window.vehicles.length);
    } else {
      console.error('Ошибка загрузки машин:', data.message);
      window.vehicles = [];
    }
  } catch (error) {
    console.error('Ошибка сети:', error);
    window.vehicles = [];
  }
}

function initBrandsModels() {
  window.modelsByBrand = {};
  window.vehicles.forEach(v => {
    if (!window.modelsByBrand[v.brand]) {
      window.modelsByBrand[v.brand] = [];
    }
    if (!window.modelsByBrand[v.brand].includes(v.model)) {
      window.modelsByBrand[v.brand].push(v.model);
    }
  });

  // Сортируем бренды по алфавиту
  const brandSel = document.getElementById('filterBrand');
  if (brandSel) {
    const brands = Array.from(new Set(window.vehicles.map(v => v.brand)));
    brands.sort(); // Сортировка по алфавиту
    
    brandSel.innerHTML = '<option value="">Все марки</option>';
    brands.forEach(b => { 
      const o = document.createElement('option'); 
      o.value = b; 
      o.textContent = b; 
      brandSel.appendChild(o); 
    });
  }

  // Сортируем модели внутри каждого бренда
  Object.keys(window.modelsByBrand).forEach(brand => {
    window.modelsByBrand[brand].sort(); // Сортировка моделей по алфавиту
  });
}

// Карусель с 3 машинами на десктопе и 1 на мобильном
let currentCarouselIndex = 0;
let carouselSlides = [];

function initCarousel() {
  const track = document.getElementById('popularTrack');
  const indicators = document.getElementById('carouselIndicators');
  
  if (!track || !window.vehicles || window.vehicles.length === 0) return;
  
  const itemsPerSlide = window.innerWidth <= 768 ? 1 : 3;
  carouselSlides = [];
  
  for (let i = 0; i < window.vehicles.length; i += itemsPerSlide) {
    carouselSlides.push(window.vehicles.slice(i, i + itemsPerSlide));
  }
  
  currentCarouselIndex = 0;
  
  track.innerHTML = carouselSlides.map((slide, slideIndex) => `
    <div class="carousel-item">
      <div class="cars-slide">
        ${slide.map(v => `
          <div class="car-card">
            <img src="${v.image_path}" alt="${v.title}" onerror="this.style.display='none'">
            <div class="car-info">
              <strong>${v.title}</strong>
              <div class="small">${v.year} • ${v.brand} • ${v.engine}L</div>
            </div>
            <div class="car-details">
              <div class="badge">${getCurrencyDisplay(v.currency, v.price)}</div>
              <button class="btn" onclick="openDetails(${v.id})">Подробнее</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  updateCarousel();
}

function updateCarousel() {
  const track = document.getElementById('popularTrack');
  if (!track) return;
  
  const offset = -currentCarouselIndex * 100;
  track.style.transform = `translateX(${offset}%)`;
}

function carouselNext() {
  if (carouselSlides.length === 0) return;
  
  currentCarouselIndex++;
  if (currentCarouselIndex >= carouselSlides.length) {
    currentCarouselIndex = 0;
  }
  updateCarousel();
}

function carouselPrev() {
  if (carouselSlides.length === 0) return;
  
  currentCarouselIndex--;
  if (currentCarouselIndex < 0) {
    currentCarouselIndex = carouselSlides.length - 1;
  }
  updateCarousel();
}

function goToSlide(index) {
  if (index >= 0 && index < carouselSlides.length) {
    currentCarouselIndex = index;
    updateCarousel();
  }
}

// Переинициализируем при изменении размера
function handleResize() {
  if (document.getElementById('popularTrack') && window.vehicles) {
    initCarousel();
  }
}

window.addEventListener('resize', handleResize);

// ==================== КАТАЛОГ И ФИЛЬТРЫ ====================

function renderCatalog(items){
  const listEl = document.getElementById('carList'); 
  if(!listEl) return;
  
  if (!items || items.length === 0) {
    listEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
        <h3 style="color: var(--accent); margin-bottom: 16px;">🚗 Машины не найдены</h3>
        <p class="small-muted" style="margin-bottom: 20px;">Попробуйте изменить параметры фильтра или</p>
        <button class="cta" onclick="resetFilters()">Показать все машины</button>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = items.map(v => `
    <div class="card vehicle appear">
      <img src="${v.image_path}" alt="${v.title}" onerror="this.style.display='none'">
      <div style="margin-top:8px">
        <strong>${v.title}</strong>
        <div class="small">${v.year} • ${v.brand} • ${v.model} • ${v.engine}L</div>
        ${v.horsepower ? `<div class="small">🐎 ${v.horsepower} л.с.</div>` : ''}
        ${v.mileage ? `<div class="small">🛣️ ${v.mileage.toLocaleString()} км</div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <div class="badge">
          ${getCurrencyDisplay(v.currency, v.price)}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" onclick="openDetails(${v.id})">Подробнее</button>
        </div>
      </div>
    </div>
  `).join('');
}

function applyFilters(){
  if (!window.vehicles) {
    console.log('Машины не загружены');
    return;
  }
  
  const q = (document.getElementById('search')?.value || '').toLowerCase();
  const country = document.getElementById('filterCountry')?.value || '';
  const brand = document.getElementById('filterBrand')?.value || '';
  const model = document.getElementById('filterModel')?.value || '';
  const fromY = parseInt(document.getElementById('filterFrom')?.value) || 0;
  const toY = parseInt(document.getElementById('filterTo')?.value) || 9999;
  const minP = parseFloat(document.getElementById('filterMin')?.value) || 0;
  const maxP = parseFloat(document.getElementById('filterMax')?.value) || 999999999;
  
  console.log('Всего машин в базе:', window.vehicles.length);
  console.log('Применяемые фильтры:', { q, country, brand, model, fromY, toY, minP, maxP });
  
  let items = window.vehicles.filter(v => {
    // Проверяем все условия фильтрации с отладкой
    const matchesSearch = !q || 
                         v.title.toLowerCase().includes(q) || 
                         v.brand.toLowerCase().includes(q) || 
                         v.model.toLowerCase().includes(q);
    
    const matchesCountry = !country || v.country === country;
    const matchesBrand = !brand || v.brand === brand;
    const matchesModel = !model || v.model === model;
    const matchesYear = v.year >= fromY && v.year <= toY;
    const matchesPrice = parseFloat(v.price) >= minP && parseFloat(v.price) <= maxP;
    
    const passesAll = matchesSearch && matchesCountry && matchesBrand && 
                     matchesModel && matchesYear && matchesPrice;
    
    if (!passesAll) {
      console.log('Машина не прошла фильтры:', v.title, {
        matchesSearch, matchesCountry, matchesBrand, 
        matchesModel, matchesYear, matchesPrice
      });
    }
    
    return passesAll;
  });
  
  console.log('Найдено машин после фильтрации:', items.length);
  
  const sort = document.getElementById('sortBy')?.value || '';
  if(sort === 'price-asc') items.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
  if(sort === 'price-desc') items.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
  
  renderCatalog(items);
}

// Функция сброса фильтров
function resetFilters() {
  console.log('Сброс фильтров');
  
  document.getElementById('filterCountry').value = '';
  document.getElementById('filterBrand').value = '';
  document.getElementById('filterModel').value = '';
  document.getElementById('filterFrom').value = '';
  document.getElementById('filterTo').value = '';
  document.getElementById('filterMin').value = '';
  document.getElementById('filterMax').value = '';
  document.getElementById('sortBy').value = '';
  document.getElementById('search').value = '';
  
  // Обновляем модели
  const modelSel = document.getElementById('filterModel');
  if (modelSel) {
    modelSel.innerHTML = '<option value="">Все модели</option>';
  }
  
  // Принудительно показываем все машины
  renderCatalog(window.vehicles);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function fixCatalogLayout() {
  const catalogContainer = document.querySelector('.container > div[style*="display:flex"]');
  const carList = document.getElementById('carList');
  
  if (window.innerWidth <= 968 && catalogContainer && carList) {
    catalogContainer.style.display = 'flex';
    catalogContainer.style.flexDirection = 'column';
    catalogContainer.style.gap = '20px';
    catalogContainer.style.alignItems = 'stretch';
    
    const aside = catalogContainer.querySelector('aside');
    const section = catalogContainer.querySelector('section');
    
    if (aside) {
      aside.style.width = '100%';
      aside.style.maxWidth = '100%';
    }
    
    if (section) {
      section.style.width = '100%';
    }
    
    carList.style.display = 'grid';
    carList.style.gridTemplateColumns = window.innerWidth <= 480 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))';
    carList.style.gap = window.innerWidth <= 480 ? '12px' : '16px';
  }
}

function openDetails(id){
  const v = window.vehicles.find(x => x.id === id); 
  if(!v) return;
  
  const modal = document.getElementById('modalDetail'); 
  if(!modal) return;
  
  modal.querySelector('.panel-title').textContent = v.title;

  let additionalImages = '';
  let allImages = [v.image_path]; // Главное изображение первым
  let additionalImagesOnly = []; // Только дополнительные изображения (без главного)

  try {
    const images = JSON.parse(v.images_json || '[]');
    if (images.length > 0) {
      // Фильтруем дубликаты - убираем главное изображение из списка дополнительных
      additionalImagesOnly = images.filter(img => img !== v.image_path);
      allImages = [v.image_path, ...additionalImagesOnly]; // Объединяем без дубликатов
    }
  } catch(e) {
    console.error('Error parsing images JSON:', e);
  }
  
  // Создаем миниатюры для галереи только если есть дополнительные фото
  if (additionalImagesOnly.length > 0) {
    additionalImages = `
      <div style="margin-top: 20px;">
        <h4 style="color: var(--accent); margin-bottom:12px;">Дополнительные фото</h4>
        <div class="image-gallery">
          ${additionalImagesOnly.map((img, index) => `
            <img src="${img}" class="gallery-thumb" 
                 onclick="openGallery(${id}, ${index + 1})" 
                 onerror="this.style.display='none'"
                 alt="Фото ${index + 2}">
          `).join('')}
        </div>
        <p class="small-muted">💡 Нажмите на фото для просмотра в галерее</p>
      </div>
    `;
  }
  
  modal.querySelector('.panel-body').innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-start">
      <div style="flex:1;min-width:300px">
        <img src="${v.image_path}" 
             class="gallery-thumb" 
             style="width:100%;height:auto;max-height:300px;cursor:pointer" 
             onclick="openGallery(${id}, 0)"
             onerror="this.style.display='none'"
             alt="${v.title}">
      </div>
      <div style="flex:1;min-width:250px">
        <p><strong>Бренд:</strong> ${v.brand}</p>
        <p><strong>Модель:</strong> ${v.model}</p>
        <p><strong>Год:</strong> ${v.year}</p>
        <p><strong>Двигатель:</strong> ${v.engine} L</p>
        ${v.horsepower ? `<p><strong>Мощность:</strong> ${v.horsepower} л.с.</p>` : ''}
        ${v.mileage ? `<p><strong>Пробег:</strong> ${v.mileage.toLocaleString()} км</p>` : ''}
        <p><strong>Страна:</strong> ${v.country}</p>
        <p><strong>Цена:</strong> ${getCurrencyDisplay(v.currency, v.price)}</p>
      </div>
    </div>
    ${additionalImages}
  `;
  
  modal.classList.add('open');
}

// Новая функция для открытия галереи
function openGallery(vehicleId, startIndex) {
  const v = window.vehicles.find(x => x.id === vehicleId);
  if (!v) return;
  
  // Собираем все изображения без дубликатов
  let allImages = [v.image_path];
  try {
    const images = JSON.parse(v.images_json || '[]');
    if (images.length > 0) {
      // Фильтруем дубликаты - убираем главное изображение из списка дополнительных
      const additionalImagesOnly = images.filter(img => img !== v.image_path);
      allImages = [v.image_path, ...additionalImagesOnly];
    }
  } catch(e) {
    console.error('Error parsing images JSON:', e);
  }
  
  // Фильтруем невалидные изображения
  allImages = allImages.filter(img => img && img.trim() !== '');
  
  if (allImages.length === 0) return;
  
  // Создаем или находим модальное окно галереи
  let galleryModal = document.getElementById('galleryModal');
  if (!galleryModal) {
    galleryModal = document.createElement('div');
    galleryModal.id = 'galleryModal';
    galleryModal.className = 'gallery-modal';
    galleryModal.innerHTML = `
      <div class="gallery-close" onclick="closeGallery()">✕</div>
      <div class="gallery-counter"></div>
      <button class="gallery-btn gallery-prev" onclick="changeGalleryImage(-1)">‹</button>
      <button class="gallery-btn gallery-next" onclick="changeGalleryImage(1)">›</button>
      <div class="gallery-modal-content">
        <img class="gallery-modal-img" src="" alt="">
      </div>
      <div class="gallery-thumbnails"></div>
    `;
    document.body.appendChild(galleryModal);
  }
  
  // Сохраняем данные галереи в глобальной переменной
  window.currentGallery = {
    images: allImages,
    currentIndex: startIndex
  };
  
  // Обновляем галерею
  updateGallery();
  
  // Показываем галерею
  setTimeout(() => {
    galleryModal.classList.add('active');
  }, 10);
}

function updateGallery() {
  if (!window.currentGallery) return;
  
  const gallery = window.currentGallery;
  const modal = document.getElementById('galleryModal');
  if (!modal) return;
  
  const img = modal.querySelector('.gallery-modal-img');
  const counter = modal.querySelector('.gallery-counter');
  const thumbnails = modal.querySelector('.gallery-thumbnails');
  
  // Устанавливаем текущее изображение
  img.src = gallery.images[gallery.currentIndex];
  
  // Обновляем счетчик
  counter.textContent = `${gallery.currentIndex + 1} / ${gallery.images.length}`;
  
  // Создаем миниатюры
  thumbnails.innerHTML = gallery.images.map((img, index) => `
    <img src="${img}" 
         class="gallery-thumbnail ${index === gallery.currentIndex ? 'active' : ''}"
         onclick="goToGalleryImage(${index})"
         alt="Миниатюра ${index + 1}">
  `).join('');
}

function changeGalleryImage(direction) {
  if (!window.currentGallery) return;
  
  const gallery = window.currentGallery;
  gallery.currentIndex += direction;
  
  // Зацикливание
  if (gallery.currentIndex < 0) {
    gallery.currentIndex = gallery.images.length - 1;
  } else if (gallery.currentIndex >= gallery.images.length) {
    gallery.currentIndex = 0;
  }
  
  updateGallery();
}

function goToGalleryImage(index) {
  if (!window.currentGallery) return;
  
  window.currentGallery.currentIndex = index;
  updateGallery();
}

function closeGallery() {
  const galleryModal = document.getElementById('galleryModal');
  if (galleryModal) {
    galleryModal.classList.remove('active');
    // Даем время для анимации перед скрытием
    setTimeout(() => {
      if (galleryModal.parentNode) {
        // galleryModal.parentNode.removeChild(galleryModal);
        window.currentGallery = null;
      }
    }, 300);
  }
}

// Закрытие галереи по клику на фон
document.addEventListener('click', function(e) {
  const galleryModal = document.getElementById('galleryModal');
  if (galleryModal && e.target === galleryModal) {
    closeGallery();
  }
});

// Закрытие по ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeGallery();
  }
});

function closeModal(){ 
  const modal = document.getElementById('modalDetail'); 
  if(modal) modal.classList.remove('open'); 
}

// Закрытие модального окна карточки товара по клику на фон
document.addEventListener('click', function(e) {
  const modal = document.getElementById('modalDetail');
  if (modal && modal.classList.contains('open') && e.target === modal) {
    closeModal();
  }
});

// Закрытие по ESC для модального окна карточки
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modalDetail');
    if (modal && modal.classList.contains('open')) {
      closeModal();
    }
  }
});

function addToCart(id){
  const item = window.vehicles.find(v => v.id === id); 
  if(!item) return;
  
  const cart = JSON.parse(localStorage.getItem('jck_cart') || '[]'); 
  cart.push(item);
  localStorage.setItem('jck_cart', JSON.stringify(cart)); 
  
  alert(`"${item.title}" добавлен в корзину!`);
}

// Адаптация при изменении размера
window.addEventListener('resize', () => {
  if (document.getElementById('popularTrack')) {
    initCarousel();
  }
  fixCatalogLayout();
});

// ==================== ОБРАБОТКА ФОРМЫ КОНСУЛЬТАЦИИ ====================

function initHelpForm() {
    const helpForm = document.getElementById('helpForm');
    if (!helpForm) return;
    
    helpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Показываем загрузку
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('send_contact.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.text();
            
            if (result === 'success') {
                alert('Заявка отправлена! Наш менеджер свяжется с вами в ближайшее время.');
                helpForm.reset();
            } else {
                alert('Ошибка: ' + result);
            }
        } catch (error) {
            alert('Ошибка сети. Попробуйте еще раз.');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

