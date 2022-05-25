const KEY = 'AIzaSyAR92f5jYyCpeME_-k2venYrHXEbSDb7MY';
const menuMap = {
  'name': 0,
  'description': 1,
  'img': 2,
  'rate': 3,
  'category': 4,
  'subcategory': 5,
}
const spaceRemover = name => name.replace(' ','');
const uniq = a => [...new Set(a)];

const searchRun = (search) => {
  const searchContainer = document.querySelector('.search-result');
  const menuContainer = document.querySelector('.menu-container');
  if(!search) {
    searchContainer.classList.add('hidden');
    menuContainer.classList.remove('hidden');
    searchContainer.innerHTML = '';
    return;
  }
  const searchResultsIDs = [];
  searchWords = searchinput.value.trim().split(' ');
  searchContainer.innerHTML = '';
  const row = document.createElement('div');
  row.classList.add('row', 'justify-content-center');
  const cardsEl = document.querySelectorAll('.card');
  cardsEl.forEach((card) => {
    uniq(searchWords).forEach((sWord) => {
      if(card.textContent.includes(sWord)) searchResultsIDs.push(card.id);
    });
  });
  uniq(searchResultsIDs).forEach(id => {
    row.append(document.getElementById(id).cloneNode(true));
  });
  if(searchWords.includes('추천')) {
    const rcmbtns = document.querySelectorAll('.btn[data-searchvalue=추천]');
    rcmbtns.forEach((btn)=>{
      row.append(btn.closest('.card').cloneNode(true));
    });
    
  }
  if(!row.innerHTML) {
    row.innerHTML = `<div class="text-center">검색 결과 없음</div>`;
  }
  const categoryHeader = document.createElement('div');
  categoryHeader.classList.add('category-header', 'border-bottom');
  categoryHeader.innerHTML = '<h2>검색 결과</h2>';
  searchContainer.append(categoryHeader);
  searchContainer.append(row);
  searchContainer.classList.remove('hidden');
  menuContainer.classList.add('hidden');
  searchEventInit();
};

const calcStar = (n) => {
  const cal = Math.round(n*10/5)*.5;
  return cal.toString().replace('.', '-');
};

const buildCard = (data) => {
  let tags = [data[menuMap['category']]];
  let ingredients = '';
  for(i=6; i<data.length; i++) {
    const ingredient = spaceRemover(data[i]);
    ingredients += `<div class="btn btn-secondary search-tag mx-1 mb-1" data-searchvalue="${ingredient}">${ingredient}</div>`;
    tags.push(ingredient);
  }
  let favorite = '';
  if(parseFloat(data[menuMap['rate']]) >= 4.5) {
    favorite = `<div class="favorite-label position-absolute"><div class="btn search-tag" data-searchvalue="추천"><img src="/lib/images/star.png"></div></div>`;
    tags.push('추천');
  }
  const html = 
  `<div id="${spaceRemover(data[menuMap['name']])}" class="${data[menuMap['category']]}-card card col-11 col-md-5 col-lg-3 col-xl-2 m-3 px-0 position-relative" data-tags="${tags}">
    <div class="object-fit-container card-img-top" style="background-image: url(${data[menuMap['img']]||'/lib/images/default-food-image.jpeg'})">
      <div class="category-label position-absolute"><div class="btn search-tag" data-searchvalue="${data[menuMap['category']]}">${data[menuMap['category']]}</div></div>
      ${favorite}
    </div>
    <div class="card-body">
      <h6 class="subcategory-label fz-2 text-decoration-underline">${data[menuMap['subcategory']]||''}</h6>
      <h5 class="card-title">${data[menuMap['name']]}</h5>
      <p class="card-text text-secondary">${data[menuMap['description']]}</p>
      <div class="list-group-item d-flex justify-content-between">
        <span class="a-icon a-star-medium-${calcStar(data[menuMap['rate']])}"></span>
        <span>${data[menuMap['rate']].length === 1 ? data[menuMap['rate']]+'.0': data[menuMap['rate']]}</span>
      </div>
    </div>
    <div class="ingredients card-body pt-0">
      ${ingredients}
    </div>
  </div>`;
  return html;
};

const buildCategory = (menu) => {
  Object.entries(menu).forEach((category) => {
    const menuContainer = document.querySelector('.menu-container');
    const categoryDiv = document.createElement('div');
    categoryDiv.classList.add('category', category[0], 'mb-5');
    categoryDiv.id = category[0];

    const categoryHeader = document.createElement('div');
    categoryHeader.classList.add('category-header', 'border-bottom');
    categoryHeader.innerHTML = `<h2>${category[0]}</h2>`;

    const cardsEl = document.createElement('div');
    cardsEl.classList.add('cards', 'scrolling-wrapper');
    
    let cards = '';
    category[1].forEach(d => {
      cards += buildCard(d);
    });
    cardsEl.innerHTML = cards;

    categoryDiv.append(categoryHeader);
    categoryDiv.append(cardsEl);
    menuContainer.append(categoryDiv);
  });
};

const searchEventInit = () => {
  const searchInput = document.getElementById('searchinput');
  let timeout = null;
  searchInput.addEventListener('keyup', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        searchRun(searchInput.value);
      }, 100);
  });
  const searchEl = document.querySelectorAll('.search-tag');
  searchEl.forEach((el) => {
    el.addEventListener('click', () => {
      searchInput.value = el.dataset.searchvalue;
      searchRun(searchInput.value);
    });
  });
};


const init = async () => {
  const menu = {};
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1SaUGu_DNEL6qHEAn_MkYMf62zKpq5RwHFYmJavIlcxg/values/Sheet1?key=${KEY}`);
  const data = await res.json();
  data.values.forEach((d, index) => {
    if(index === 0) {
      return;
    }
    if(!menu[d[menuMap['category']]]) {
      menu[d[menuMap['category']]] = [];
    }
    menu[d[menuMap['category']]].push(d);
  });
  buildCategory(menu);
  searchEventInit();
};

init();