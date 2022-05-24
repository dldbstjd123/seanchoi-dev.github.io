const KEY = 'AIzaSyAR92f5jYyCpeME_-k2venYrHXEbSDb7MY';
const menuMap = {
  'name': 0,
  'description': 1,
  'img': 2,
  'rate': 3,
  'category': 4,
  'subcategory': 5,
  'ingredients': 6,
}
const calcStar = (n) => {
  const cal = Math.round(n*10/5)*.5;
  return cal.toString().replace('.', '-');
}
const buildCard = (data) => {
  let recommend = '';
  if(parseFloat(data[menuMap['rate']]) >= 4.5) {
    recommend = `<div class="recommend-label position-absolute"><button><img src="/lib/images/star.png"></button></div>`;
  }
  const html = 
  `<div class="${data[menuMap['category']]}-card card col-4 m-3 px-0 position-relative">
    <div class="category-label position-absolute"><button>${data[menuMap['category']]}</button></div>
    ${recommend}
    <img src="${data[menuMap['img']]}" class="card-img-top" alt="${data[menuMap['name']]}">
    <div class="card-body">
      <h6 class="subcategory-label">${data[menuMap['subcategory']]}</h6>
      <h5 class="card-title">${data[menuMap['name']]}</h5>
      <p class="card-text">${data[menuMap['description']]}</p>
      <div class="list-group-item d-flex justify-content-between">
        <span class="a-icon a-star-medium-${calcStar(data[menuMap['rate']])}"></span>
        <span>${data[menuMap['rate']].length === 1 ? data[menuMap['rate']]+'.0': data[menuMap['rate']]}</span>
      </div>
    </div>
    <div class="card-body">
      <a href="#" class="card-link">Card link</a>
      <a href="#" class="card-link">Another link</a>
    </div>
  </div>`;
  return html;
}

const buildCategory = (menu) => {
  Object.entries(menu).forEach((category, index) => {
    const menuContainer = document.querySelector('.menu-container');
    const categoryDiv = document.createElement('div');
    categoryDiv.classList.add('category', 'row', 'justify-content-center');
    categoryDiv.id = category[0];
    let cards = '';
    category[1].forEach(d => {
      cards += buildCard(d)
    });
    categoryDiv.innerHTML = cards;
    menuContainer.append(categoryDiv);
  });
}
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
}


init();