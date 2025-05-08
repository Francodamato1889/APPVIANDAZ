let menus = [];
let cantidades = {};

const menusContainer = document.getElementById('menus-container');
const totalGeneralElem = document.getElementById('total-general');
const diaSelect = document.getElementById('dia');

const SHEET_URL = 'https://opensheet.vercel.app/1-Z2o52z9KlhxB-QC6-49Dw5uYJ8vhf8EESMFVYstXf8/Hoja1';

const CBU = '0000003100000000123456';
const ALIAS = 'viandaz.banco';

// Detectar día actual y seleccionarlo por defecto
document.addEventListener('DOMContentLoaded', () => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const diaActual = diasSemana[hoy.getDay()];

    if (diaSelect) {
        diaSelect.value = diaActual;
    }

    fetch(SHEET_URL)
        .then(response => response.json())
        .then(data => {
            menus = data;
            renderMenus(diaActual);
        })
        .catch(error => console.error('Error cargando menús:', error));
});

// Cambiar día manualmente
if (diaSelect) {
    diaSelect.addEventListener('change', () => {
        renderMenus(diaSelect.value);
    });
}

function renderMenus(diaSeleccionado) {
    menusContainer.innerHTML = '';
    cantidades = {};

    const filtrados = menus.filter(menu => menu.dia === diaSeleccionado);

    filtrados.forEach(menu => {
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

    const dia = diaSelect.value;
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

    fetch('https://script.google.com/macros/s/AKfycbz5QC3kqsUgz2b53Q-YbD1o3bJwM2ifnZp-EAAtBU7aOQ1DJfzpIErAWSzovnrYtphJ/exec', {
        method: 'POST',
        body: new URLSearchParams(pedido)
    })
    .then(response => response.text())
    .then(result => {
        alert('¡Pedido enviado!');

        if (metodo_pago === 'Transferencia') {
            mostrarDatosTransferencia();
        }

        form.reset();
        renderMenus(diaSelect.value);
        actualizarTotalGeneral();
    })
    .catch(error => {
        alert('Error al enviar el pedido.');
        console.error('Error:', error);
    });
});

// Modal de transferencia
function mostrarDatosTransferencia() {
    const modal = document.getElementById('modal-transferencia');
    modal.style.display = 'block';
}

function cerrarModal() {
    const modal = document.getElementById('modal-transferencia');
    modal.style.display = 'none';
}

function copiarCBU() {
    const cbuText = document.getElementById('cbu-text').innerText;
    navigator.clipboard.writeText(cbuText).then(() => {
        alert('¡CBU copiado al portapapeles!');
    }).catch(err => {
        alert('Error al copiar el CBU.');
    });
}

