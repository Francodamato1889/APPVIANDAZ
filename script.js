let menus = [];
let cantidades = {};

const menusContainer = document.getElementById('menus-container');
const totalGeneralElem = document.getElementById('total-general');

const SHEET_URL = 'https://opensheet.vercel.app/1-Z2o52z9KlhxB-QC6-49Dw5uYJ8vhf8EESMFVYstXf8/Hoja1';

// URL de MercadoPago (cambiá por tu URL real de pago)
const MERCADOPAGO_URL = 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=12345-67890'; 

// Datos bancarios
const CBU = '0000003100000000123456';
const ALIAS = 'viandaz.banco';

fetch(SHEET_URL)
    .then(response => response.json())
    .then(data => {
        menus = data;
        renderMenus();
    })
    .catch(error => console.error('Error cargando menús:', error));

function renderMenus() {
    menusContainer.innerHTML = '';
    cantidades = {};

    menus.forEach(menu => {
        cantidades[menu.menu_id] = 0;

        const menuDiv = document.createElement('div');
        menuDiv.classList.add('menu');

        menuDiv.innerHTML = `
            <h2>${menu.nombre}</h2>
            <img src="${menu.imagen_url}" alt="${menu.nombre}">
            <p>${menu.descripcion}</p>
            <div class="cantidad-control">
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', -1)">-</button>
                <span id="cantidad-menu${menu.menu_id}">0</span>
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', 1)">+</button>
            </div>
            <p id="precio-menu${menu.menu_id}" class="precio-menu">$0</p>
        `;

        menusContainer.appendChild(menuDiv);
    });

    actualizarTotalGeneral();
}

function cambiarCantidad(menuId, cambio) {
    cantidades[menuId] = Math.max(0, cantidades[menuId] + cambio);
    document.getElementById('cantidad-menu' + menuId).innerText = cantidades[menuId];

    const precioTotal = cantidades[menuId] * 3800;
    document.getElementById('precio-menu' + menuId).innerText = `$${precioTotal}`;

    actualizarTotalGeneral();
}

function actualizarTotalGeneral() {
    let total = 0;
    for (const id in cantidades) {
        total += cantidades[id] * 3800;
    }
    totalGeneralElem.innerText = `Total General: $${total}`;
}

const form = document.getElementById('pedido-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const dia = document.getElementById('dia').value;
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;

    const metodoPagoInput = document.querySelector('input[name="metodo_pago"]:checked');
    const metodo_pago = metodoPagoInput ? metodoPagoInput.value : '';

    if (!metodo_pago) {
        alert('Por favor seleccioná un método de pago.');
        return;
    }

    const pedido = {
        dia,
        nombre,
        direccion,
        email,
        telefono,
        metodo_pago,
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

        // Ahora manejamos el método de pago
        if (metodo_pago === 'Transferencia') {
            mostrarDatosTransferencia();
        } else if (metodo_pago === 'MercadoPago') {
            window.location.href = MERCADOPAGO_URL;
        }

        form.reset();
        renderMenus();
        actualizarTotalGeneral();
    })
    .catch(error => {
        alert('Error al enviar el pedido.');
        console.error('Error:', error);
    });
});

function mostrarDatosTransferencia() {
    alert(`Datos para Transferencia Bancaria:\n\nCBU: ${CBU}\nAlias: ${ALIAS}`);
}

