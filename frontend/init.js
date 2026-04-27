// Inicialização da aplicação - Limpar dados ao carregar
document.addEventListener('DOMContentLoaded', function() {
  // Se estamos na página inicial, limpar dados de sessão
  if (window.location.pathname.includes('index.html') || 
      window.location.pathname === '/' || 
      window.location.pathname.endsWith('/frontend/')) {
    
    console.log('Iniciando aplicação - limpando sessões anteriores...');
    
    // Limpar dados de autenticação
    localStorage.removeItem('fitmatch_token');
    localStorage.removeItem('fitmatch_user');
    
    // Limpar todos os perfis de usuário
    Object.keys(localStorage).forEach(key => {
      if (key.includes('fitmatch')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Aplicação iniciada sem usuário logado');
  }
});