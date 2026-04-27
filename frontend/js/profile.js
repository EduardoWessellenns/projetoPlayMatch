// profile.js - VERSAO COMPLETA COM BANCO DE DADOS
const API_BASE_URL = 'http://localhost:3000/api';

// Estado global
let userProfile = null;
let isEditMode = false;
let selectedAvatarFile = null;
let originalData = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupAvatarEvents();
});

// Verificar status de autenticação
function checkAuthStatus() {
    const token = localStorage.getItem('fitmatch_token');
    const userData = localStorage.getItem('fitmatch_user');
    
    if (token && userData) {
        // Usuário está logado - carregar perfil
        userProfile = JSON.parse(userData);
        loadUserProfile();
    } else {
        // Usuário não está logado - redirecionar para login
        showMessage('Você precisa estar logado para acessar esta página.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// Configurar eventos da foto de perfil
function setupAvatarEvents() {
    const avatarInput = document.getElementById('avatarInput');
    
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                showMessage('Por favor, selecione uma imagem válida.', 'error');
                return;
            }
            
            // Validar tamanho do arquivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('A imagem deve ter no máximo 5MB.', 'error');
                return;
            }
            
            selectedAvatarFile = file;
            previewAvatar(file);
            showMessage('Foto selecionada. Clique em "Salvar Alterações" para confirmar.', 'success');
        }
    });
}

// Carregar perfil do usuário
async function loadUserProfile() {
    try {
        // Se já temos os dados no localStorage, usar eles
        if (userProfile) {
            updateProfileDisplay(userProfile);
            return;
        }
        
        // Se não, buscar da API
        const token = localStorage.getItem('fitmatch_token');
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                userProfile = result.data;
                updateProfileDisplay(userProfile);
                // Atualizar localStorage
                localStorage.setItem('fitmatch_user', JSON.stringify(userProfile));
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Usar dados do localStorage como fallback
        const userData = localStorage.getItem('fitmatch_user');
        if (userData) {
            userProfile = JSON.parse(userData);
            updateProfileDisplay(userProfile);
        }
    }
}

// Atualizar interface com dados do usuário
function updateProfileDisplay(userData) {
    document.getElementById('name').value = userData.name || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('userName').textContent = userData.name || 'Usuário';
    
    // Avatar
    updateAvatarDisplay(userData.avatar_url, userData.name);
    
    // Estatísticas
    document.getElementById('matchesPlayed').textContent = userData.matches_played || 0;
    document.getElementById('matchesCreated').textContent = userData.matches_created || 0;
    
    // Data de registro
    if (userData.member_since) {
        const date = new Date(userData.member_since);
        document.getElementById('memberSince').textContent = date.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('memberSince').textContent = '-';
    }
}

// Atualizar exibição do avatar
function updateAvatarDisplay(avatarUrl, userName) {
    const avatarPreviewContent = document.getElementById('avatarPreviewContent');
    const avatarDisplayContent = document.getElementById('avatarDisplayContent');
    
    if (avatarUrl) {
        avatarPreviewContent.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        avatarDisplayContent.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        // Usar inicial do nome
        const initial = userName ? userName.charAt(0).toUpperCase() : 'U';
        avatarPreviewContent.textContent = initial;
        avatarDisplayContent.textContent = initial;
    }
}

// Pré-visualizar avatar
function previewAvatar(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const avatarPreviewContent = document.getElementById('avatarPreviewContent');
        const avatarDisplayContent = document.getElementById('avatarDisplayContent');
        
        avatarPreviewContent.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
        avatarDisplayContent.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
    };
    
    reader.readAsDataURL(file);
}

// Alternar modo de edição
function toggleEditMode() {
    isEditMode = !isEditMode;
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const avatarSection = document.getElementById('avatarSection');
    
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (isEditMode) {
        // Entrar no modo edição
        nameInput.readOnly = false;
        emailInput.readOnly = false;
        avatarSection.style.display = 'block';
        
        // Salvar dados originais
        originalData = {
            name: nameInput.value,
            email: emailInput.value
        };
        
        // Mostrar/ocultar botões
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        
        showMessage('Modo de edição ativado. Você pode alterar sua foto de perfil.', 'success');
    } else {
        exitEditMode();
    }
}

// Sair do modo de edição
function exitEditMode() {
    isEditMode = false;
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const avatarSection = document.getElementById('avatarSection');
    
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    nameInput.readOnly = true;
    emailInput.readOnly = true;
    avatarSection.style.display = 'none';
    
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

// Cancelar edição
function cancelEdit() {
    // Restaurar dados originais
    document.getElementById('name').value = originalData.name;
    document.getElementById('email').value = originalData.email;
    
    // Restaurar avatar original
    updateAvatarDisplay(userProfile?.avatar_url, userProfile?.name);
    
    selectedAvatarFile = null;
    exitEditMode();
    showMessage('Edição cancelada. Alterações não salvas.', 'error');
}

// Salvar perfil no banco de dados
async function saveProfile() {
    try {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        
        const newName = nameInput.value.trim();
        const newEmail = emailInput.value.trim();
        
        // Validações básicas
        if (!newName || !newEmail) {
            showMessage('Preencha todos os campos', 'error');
            return;
        }
        
        if (!isValidEmail(newEmail)) {
            showMessage('E-mail inválido', 'error');
            return;
        }

        // Mostrar loading
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.textContent = 'Salvando...';
        saveBtn.disabled = true;

        // Atualizar no banco de dados
        const success = await updateUserProfile({
            name: newName,
            email: newEmail
        });

        if (success) {
            // Atualizar dados locais
            userProfile.name = newName;
            userProfile.email = newEmail;
            
            // Atualizar localStorage
            localStorage.setItem('fitmatch_user', JSON.stringify(userProfile));
            
            // Atualizar interface
            document.getElementById('userName').textContent = newName;
            document.getElementById('userAvatarDisplay').textContent = newName.charAt(0).toUpperCase();
            
            showMessage('Perfil atualizado com sucesso!', 'success');
            exitEditMode();
            
        } else {
            throw new Error('Falha ao salvar no banco de dados');
        }
        
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        showMessage('Erro ao salvar alterações', 'error');
    } finally {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.textContent = '💾 Salvar Alterações';
        saveBtn.disabled = false;
    }
}

// Atualizar perfil no banco de dados
async function updateUserProfile(updatedData) {
    try {
        const token = localStorage.getItem('fitmatch_token');
        const userId = userProfile.id;
        
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id: userId,
                name: updatedData.name,
                email: updatedData.email
            })
        });

        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }

        const result = await response.json();
        return result.success;
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return false;
    }
}

// Remover avatar
function removeAvatar() {
    if (confirm('Tem certeza que deseja remover sua foto de perfil?')) {
        selectedAvatarFile = null;
        const avatarPreviewContent = document.getElementById('avatarPreviewContent');
        const avatarDisplayContent = document.getElementById('avatarDisplayContent');
        const initial = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U';
        
        avatarPreviewContent.textContent = initial;
        avatarDisplayContent.textContent = initial;
        
        showMessage('Foto removida. Clique em "Salvar Alterações" para confirmar.', 'success');
    }
}

// Validar e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Logout
function logout() {
    if (confirm('Tem certeza que deseja sair da sua conta?')) {
        // Limpar dados
        localStorage.removeItem('fitmatch_token');
        localStorage.removeItem('fitmatch_user');
        
        showMessage('Saindo da conta...', 'success');
        
        // Redirecionar para login
        setTimeout(() => {
            window.location.href = 'login.html?logout=true';
        }, 1000);
    }
}

// Mostrar mensagens
function showMessage(text, type) {
    const messageElement = document.getElementById('profileMessage');
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}