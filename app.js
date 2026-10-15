// CONFIGURACIÓN SUPABASE - Reemplaza con tus credenciales
const SUPABASE_URL = 'https://arkmkrpswnqmpndgnstm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya21rcnBzd25xbXBuZGduc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODM1NDMsImV4cCI6MjEwNjQ1OTU0M30.5SlpnLH99pmRm3ZaurHfcz2w4dsDOb_wLR1JwLFjEVk';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadPeople();
    renderTable();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('personForm').addEventListener('submit', handleSubmit);
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

async function loadPeople() {
    try {
        const { data, error } = await supabaseClient
            .from('personas')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        window.people = data || [];
        renderTable();
    } catch (err) {
        console.error('Error cargando datos:', err);
        alert('Error al cargar los datos: ' + err.message);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const person = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        cedula: formData.get('cedula'),
        genero: formData.get('genero'),
        edad: parseInt(formData.get('edad'))
    };
    
    try {
        if (editingId) {
            const { error } = await supabaseClient
                .from('personas')
                .update(person)
                .eq('id', editingId);
            
            if (error) throw error;
            editingId = null;
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Guardar';
        } else {
            const { error } = await supabaseClient
                .from('personas')
                .insert([person]);
            
            if (error) throw error;
        }
        
        await loadPeople();
        e.target.reset();
    } catch (err) {
        console.error('Error guardando:', err);
        alert('Error al guardar: ' + err.message);
    }
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const id = parseInt(document.getElementById('editId').value);
    const person = {
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        cedula: formData.get('cedula'),
        genero: formData.get('genero'),
        edad: parseInt(formData.get('edad'))
    };
    
    try {
        const { error } = await supabaseClient
            .from('personas')
            .update(person)
            .eq('id', id);
        
        if (error) throw error;
        
        await loadPeople();
        closeModals();
    } catch (err) {
        console.error('Error actualizando:', err);
        alert('Error al actualizar: ' + err.message);
    }
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    (window.people || []).forEach(person => {
        const row = document.createElement('tr');
        const generoText = getGeneroText(person.genero);
        
        row.innerHTML = `
            <td>${escapeHtml(person.nombre)}</td>
            <td>${escapeHtml(person.apellido)}</td>
            <td>${escapeHtml(person.cedula)}</td>
            <td>${generoText}</td>
            <td>${person.edad}</td>
            <td class="actions-cell">
                <button class="action-btn btn-view" onclick="viewPerson(${person.id})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn btn-edit" onclick="editPerson(${person.id})" title="Modificar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deletePerson(${person.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewPerson(id) {
    const person = (window.people || []).find(p => p.id === id);
    if (!person) return;
    
    const generoText = getGeneroText(person.genero);
    document.getElementById('viewContent').innerHTML = `
        <div class="view-item">
            <div class="view-label">Nombre</div>
            <div class="view-value">${escapeHtml(person.nombre)}</div>
        </div>
        <div class="view-item">
            <div class="view-label">Apellido</div>
            <div class="view-value">${escapeHtml(person.apellido)}</div>
        </div>
        <div class="view-item">
            <div class="view-label">Cédula</div>
            <div class="view-value">${escapeHtml(person.cedula)}</div>
        </div>
        <div class="view-item">
            <div class="view-label">Género</div>
            <div class="view-value">${generoText}</div>
        </div>
        <div class="view-item">
            <div class="view-label">Edad</div>
            <div class="view-value">${person.edad}</div>
        </div>
    `;
    document.getElementById('viewModal').classList.add('show');
}

function editPerson(id) {
    const person = (window.people || []).find(p => p.id === id);
    if (!person) return;
    
    document.getElementById('editId').value = person.id;
    document.getElementById('editNombre').value = person.nombre;
    document.getElementById('editApellido').value = person.apellido;
    document.getElementById('editCedula').value = person.cedula;
    document.getElementById('editGenero').value = person.genero;
    document.getElementById('editEdad').value = person.edad;
    
    document.getElementById('editModal').classList.add('show');
}

async function deletePerson(id) {
    if (!confirm('¿Está seguro de que desea eliminar este registro?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('personas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadPeople();
    } catch (err) {
        console.error('Error eliminando:', err);
        alert('Error al eliminar: ' + err.message);
    }
}

function closeModals() {
    document.getElementById('viewModal').classList.remove('show');
    document.getElementById('editModal').classList.remove('show');
    document.getElementById('calcModal').classList.remove('show');
}

function getGeneroText(genero) {
    const generos = {
        'M': 'Masculino',
        'F': 'Femenino',
        'O': 'Otro'
    };
    return generos[genero] || genero;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Calculadora
document.getElementById('calcToggle').addEventListener('click', () => {
    document.getElementById('calcModal').classList.add('show');
});

document.querySelectorAll('#calcModal .close').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

document.querySelectorAll('#calcModal .btn-calc').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const display = document.getElementById('calcDisplay');
        let current = display.textContent;

        if (action === 'clear') {
            display.textContent = '0';
        } else if (action === 'delete') {
            display.textContent = current.length > 1 ? current.slice(0, -1) : '0';
        } else if (action === '=') {
            try {
                const expression = current.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                display.textContent = eval(expression).toString();
            } catch {
                display.textContent = 'Error';
            }
        } else if (action === '.') {
            if (!current.includes('.')) {
                display.textContent = current + '.';
            }
        } else {
            display.textContent = current === '0' ? btn.textContent : current + btn.textContent;
        }
    });
});