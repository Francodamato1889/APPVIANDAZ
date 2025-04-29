let menus = [];
let cantidades = {};

const menusContainer = document.getElementById('menus-container');

// ⚡ USAMOS TU ID real de Sheets
const SHEET_URL = 'https://opensheet.vercel.app/1-Z2o52z9KlhxB-QC6-49Dw5uYJ8vhf8EESMFVYstXf8/Hoja1';

fetch(SHEET_URL)
    .then(response => response.json())
    .then(data => {
        menus = data;
        renderMenus();
    })
    .catch(error => console.error('Error cargando menús:', error));

function renderMenus() {
    menusContainer.innerHTML = ''; // Limpiamos para no duplicar
    menus.forEach(menu => {
        cantidades[menu.menu_id] = 0; // Inicializamos cantidad en 0

        const menuDiv = document.createElement('div');
        menuDiv.classList.add('menu');

        menuDiv.innerHTML = `
            <h2>${menu.nombre}</h2>
            <img src="${menu.imagen_url}" alt="${menu.nombre}" style="width:150px;height:150px;">
            <p>${menu.descripcion}</p>
            <div class="cantidad-control">
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', -1)">-</button>
                <span id="cantidad-menu${menu.menu_id}">0</span>
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', 1)">+</button>
            </div>
        `;

        menusContainer.appendChild(menuDiv);
    });
}

function cambiarCantidad(menuId, cambio) {
    cantidades[menuId] = Math.max(0, cantidades[menuId] + cambio);
    document.getElementById('cantidad-menu' + menuId).innerText = cantidades[menuId];
}

const form = document.getElementById('pedido-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const dia = document.getElementById('dia').value;
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;

    const pedido = {
        dia,
        nombre,
        direccion,
        email,
        telefono,
        pedido: JSON.stringify(cantidades)
    };

    fetch('https://script.google.com/macros/s/AKfycbyttDPJiPzCkLDmpDO2a47j6vW4_wAFH9GsAnGe5I5UzNk8bGe1a3xLEuFWzZJ-hkwu/exec', {
        method: 'POST',
        body: new URLSearchParams(pedido)
    })
    .then(response => response.text())
    .then(result => {
        console.log("Pedido enviado:", result);
        alert('¡Pedido enviado!');
        form.reset();
        menusContainer.innerHTML = '';
        fetch(SHEET_URL)
            .then(response => response.json())
            .then(data => {
                menus = data;
                renderMenus();
            });
    })
    .catch(error => {
        alert('Error al enviar el pedido.');
        console.error('Error:', error);
    });
});
