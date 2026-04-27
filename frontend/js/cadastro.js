document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value
    };

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }

    if (formData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }

    try {
        // integrar com o backend depois
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.name,
                email: formData.email,
                password: formData.password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = 'index.html';
        } else {
            alert('Erro: ' + result.message);
        }

    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro ao conectar com o servidor');
    }
});

// Validação em tempo real da confirmação de senha
document.getElementById('confirm-password').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#ef4444';
    } else {
        this.style.borderColor = '#10b981';
    }
});