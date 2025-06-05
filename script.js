let menus = [];
let cantidades = {};
let menusFiltrados = [];

const menusContainer = document.getElementById('menus-container');
const totalGeneralElem = document.getElementById('total-general');
const diaSelect = document.getElementById('dia');

const SHEET_URL = 'https://opensheet.vercel.app/1uwkEv32liiVWZ-zhf9YOTJQK6DtaMpKkybqaf5Q66HY/Hoja1';
const CBU = '3300000620000325756024';
const ALIAS = 'carlosalbertoschmidt';

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
        `;

        menusContainer.appendChild(menuDiv);
    });

    // Campo de nota general (al final de todos los menús)
    const notaDiv = document.createElement('div');
    notaDiv.innerHTML = `
        <label for="nota-general"><strong>Notas para el pedido (opcional):</strong></label><br>
        <textarea id="nota-general" placeholder="Ej: Sin cebolla, entregar antes de las 13hs..." rows="3" style="width:100%; margin-top:8px;"></textarea>
    `;
    menusContainer.appendChild(notaDiv);

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

    // Nota general
    const nota_menu = document.getElementById('nota-general')?.value || '';

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

    fetch('https://script.google.com/macros/s/AKfycbzZHPu_P54LwalLI1Wrs6SW6NRB6o5LRVUNRl7JRPghLBxHykgmSoBfZpKH0iRzu1o/exec', {
        method: 'POST',
        body: new URLSearchParams(pedido)
    })
    .then(response => response.text())
    .then(result => {
        botonSubmit.disabled = false;
        botonSubmit.innerText = 'Enviar Pedido';

        console.log("Respuesta del servidor:", result);

        if (result.includes('cerró')) {
            alert('Los pedidos para hoy ya están cerrados. Podés pedir para otro día.');
            return;
        }

        if (metodo_pago === 'Transferencia') {
            mostrarDatosTransferencia();
        } else {
            mostrarModalGracias();
        }

        form.reset();
        renderMenus(diaSelect.value);
        actualizarTotalGeneral();
    })
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

