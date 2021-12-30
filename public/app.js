const toCurrency = price => {
    return new Intl.NumberFormat('ru-RU', {
        currency: 'rub',
        style: 'currency'
    }).format(price);
}

const toDate = date => {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date));
}

document.querySelectorAll('.price').forEach(el => {
    el.textContent = toCurrency(el.textContent);
});

document.querySelectorAll('.customDate').forEach(el => {
    el.textContent = toDate(el.textContent);
});

const $cart = document.querySelector('#cart');

if ($cart) {
    $cart.addEventListener('click', event => {
        if (event.target.classList.contains('js-remove')) {
            const id = event.target.dataset.id;
            const csrf = event.target.dataset.csrf;

            console.log(csrf);

            fetch(`/cart/remove/${id}`, {
                method: 'post',
                headers: {
                    'X-XSRF-TOKEN': csrf
                }
            })
                .then(res => res.json())
                .then(cart => {
                    if (cart.courses.length) {
                        const html = cart.courses.map(el => {
                            return `
                                <tr>
                                    <td><img class="courseImg" src="${el.img}" alt="${el.title}"></td>
                                    <td>${el.title}</td>
                                    <td>${el.count}</td>
                                    <td>
                                        <button class="btn btn-small js-remove" data-id="${el._id}">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                        $cart.querySelector('tbody').innerHTML = html;
                        $cart.querySelector('.price').textContent = toCurrency(cart.price);
                    } else {
                        $cart.innerHTML = '<p>Cart is empty</p>'
                    }
                    console.log(cart);
                })
        }
    });
}

M.Tabs.init(document.querySelectorAll('.tabs'));

const changeImage = (inputSelector, previewSelector) => {
    const inputFile = document.querySelector(inputSelector);
    const preview = document.querySelector(previewSelector);
    const defaultPreview = preview.src;
    inputFile.addEventListener('change', (data) => {
        if (inputFile.files[0]) {
            preview.src = URL.createObjectURL(inputFile.files[0]);
        } else {
            preview.src = defaultPreview;
        }
    });
};

const profile = document.querySelector('.profile');

if (profile) {
    changeImage('.profile form input[type="file"]', '.profile img.avatar');
}

const addCourse = document.querySelector('.addCourse');

if (addCourse) {
    changeImage('.addCourse form input[type="file"]', '.addCourse img.preview');
}

const courseEdit = document.querySelector('.courseEdit');

if (courseEdit) {
    changeImage('.courseEdit form input[type="file"]', '.courseEdit img.preview');
}