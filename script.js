let menus = [];
let cantidades = {};
let menusFiltrados = [];

const menusContainer = document.getElementById('menus-container');
const totalGeneralElem = document.getElementById('total-general');
const diaSelect = document.getElementById('dia');

const SHEET_URL = 'https://opensheet.vercel.app/1-Z2o52z9KlhxB-QC6-49Dw5uYJ8vhf8EESMFVYstXf8/Hoja1';
const CBU = '0000003100000000123456';
const ALIAS = 'viandaz.banco';

// Detectar día actual, cargar menús y bloquear días anteriores
document.addEventListener('DOMContentLoaded', () => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const diaActual = diasSemana[hoy.getDay()];

    if (diaSelect) {
        diaSelect.value = diaActual;

        // Bloquear días anteriores
        const opciones = diaSelect.options;
        for (let i = 0; i < opciones.length; i++) {
            const valor = opciones[i].value;
            if (diasSemana.indexOf(valor) < diasSemana.indexOf(diaActual)) {
                opciones[i].disabled = true;
            }
        }
    }

    fetch(SHEET_URL)
        .then(response => response.json())
        .then(data => {
            menus = data;
            renderMenus(diaActual);
        })
        .catch(error => console.error('Error cargando menús:', error));
});

if (diaSelect) {
    diaSelect.addEventListener('change', () => {
        renderMenus(diaSelect.value);
    });
}

function renderMenus(diaSeleccionado) {
    menusContainer.innerHTML = '';
    cantidades = {};

    menusFiltrados = menus.filter(menu => menu.dia === diaSeleccionado);

    menusFiltrados.forEach(menu => {
        cantidades[menu.menu_id] = 0;

        const menuDiv = document.createElement('div');
        menuDiv.classList.add('menu');

        menuDiv.innerHTML = `
            <h2>${menu.nombre}</h2>
            <img src="${menu.imagen_url}" alt="${menu.nombre}">
            <p>${menu.descripcion}</p>
            <p class="precio-menu">Precio unitario: $${menu.precio}</p>
            <div class="cantidad-control">
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', -1)">-</button>
                <span id="cantidad-menu${menu.menu_id}">0</span>
                <button type="button" onclick="cambiarCantidad('${menu.menu_id}', 1)">+</button>
            </div>
            ${menu.nombre.toLowerCase().includes('ensalada') ? `
              <textarea id="nota-menu${menu.menu_id}" placeholder="Notas para el pedido (opcional)"></textarea>
            ` : ''}
        `;

        menusContainer.appendChild(menuDiv);
    });

    actualizarTotalGeneral();
}

function cambiarCantidad(menuId, cambio) {
    cantidades[menuId] = Math.max(0, cantidades[menuId] + cambio);
    document.getElementById('cantidad-menu' + menuId).innerText = cantidades[menuId];
    actualizarTotalGeneral();
}

function actualizarTotalGeneral() {
    let total = 0;
    for (const id in cantidades) {
        const menu = menus.find(m => m.menu_id === id);
        const precio = parseFloat(menu?.precio || 0);
        total += cantidades[id] * precio;
    }
    totalGeneralElem.innerText = `Total General: $${total}`;
}

const form = document.getElementById('pedido-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const dia = diaSelect.value;
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    // const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const metodoPagoInput = document.querySelector('input[name="metodo_pago"]:checked');
    const metodo_pago = metodoPagoInput ? metodoPagoInput.value : '';

    if (!metodo_pago) {
        alert('Por favor seleccioná un método de pago.');
        return;
    }

    const botonSubmit = form.querySelector('button[type="submit"]');
    botonSubmit.disabled = true;
    botonSubmit.innerText = 'Enviando...';

    const menu1 = cantidades[menusFiltrados[0]?.menu_id] || 0;
    const menu2 = cantidades[menusFiltrados[1]?.menu_id] || 0;
    const menu3 = cantidades[menusFiltrados[2]?.menu_id] || 0;

    const menuConNota = menusFiltrados.find(menu => menu.nombre.toLowerCase().includes('ensalada'));
    const nota_menu = document.getElementById(`nota-menu${menuConNota?.menu_id}`)?.value || '';

    // Calcular total
    let total = 0;
    for (const id in cantidades) {
        const menu = menus.find(m => m.menu_id === id);
        const precio = parseFloat(menu?.precio || 0);
        total += cantidades[id] * precio;
    }

    const pedido = {
        dia,
        nombre,
        direccion,
        telefono,
        metodo_pago,
        menu1,
        menu2,
        menu3,
        nota_menu,
        clave: 'FRA_Viandaz_2024@secure_key#1',
        total
    };

   fetch('https://script.google.com/macros/s/AKfycbxz0-oqsfdRKea1AGk1bnsukFEgJDuwtjXLxpVbj1bVzkl3tQkHIaegyg9mwA_Ol7y9/exec', {
    method: 'POST',
    body: new URLSearchParams(pedido)
})
.then(response => response.text())
.then(result => {
    botonSubmit.disabled = false;
    botonSubmit.innerText = 'Enviar Pedido';

    if (result.trim() === 'PEDIDOS CERRADOS') {
        alert('Los pedidos para hoy ya están cerrados. Podés pedir para otro día.');
    } else {
        if (metodo_pago === 'Transferencia') {
            mostrarDatosTransferencia();
        } else {
            mostrarModalGracias();
        }

        form.reset();
    }

    // Siempre ejecutar esto al final
    if (diaSelect && diaSelect.value) {
        renderMenus(diaSelect.value);
    }
    actualizarTotalGeneral();
})
.catch(error => {
    console.error('Error al enviar el pedido:', error);
    alert('Hubo un error al enviar el pedido. Intentá nuevamente.');

    botonSubmit.disabled = false;
    botonSubmit.innerText = 'Enviar Pedido';

    if (diaSelect && diaSelect.value) {
        renderMenus(diaSelect.value);
    }
    actualizarTotalGeneral();
});

.catch(error => {
    console.error('Error al enviar el pedido:', error);
    alert('Hubo un error al enviar el pedido. Intentá nuevamente.');
    botonSubmit.disabled = false;
    botonSubmit.innerText = 'Enviar Pedido';
});
.catch(error => {
    alert('Error al enviar el pedido: ' + error.message);
});

    .catch(error => {
        botonSubmit.disabled = false;
        botonSubmit.innerText = 'Enviar Pedido';
        alert('Error al enviar el pedido.');
        console.error('Error:', error);
    });
});

function mostrarDatosTransferencia() {
    const modal = document.getElementById('modal-transferencia');
    modal.style.display = 'block';
}

function cerrarModal() {
    const modal = document.getElementById('modal-transferencia');
    modal.style.display = 'none';
    mostrarModalGracias();
}

function copiarCBU() {
    const cbuText = document.getElementById('cbu-text').innerText;
    navigator.clipboard.writeText(cbuText).then(() => {
        alert('¡CBU copiado al portapapeles!');
    }).catch(err => {
        alert('Error al copiar el CBU.');
    });
}

function mostrarModalGracias() {
    const modal = document.getElementById('modal-gracias');
    modal.style.display = 'block';
}

function cerrarModalGracias() {
    const modal = document.getElementById('modal-gracias');
    modal.style.display = 'none';
}
