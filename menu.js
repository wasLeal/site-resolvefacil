// ==================================================================
// ARQUIVO MESTRE DO MENU - EDITE APENAS AQUI
// ==================================================================

// 1. LISTA ÚNICA DE LINKS DO SITE
// Para adicionar, remover ou alterar um link, mexa apenas aqui.
// CORREÇÃO: Links alterados para serem relativos à raiz (iniciando com "/")
// Isso garante que o menu funcione em qualquer página, inclusive dentro de subpastas.
const navLinks = [
    { href: '/index.html', text: 'Início' },
    { href: '/quemsomos.html', text: 'Quem Somos' },
    { href: '/servicos.html', text: 'Serviços' },
    { href: '/design-servicos.html', text: 'Design' },
    { href: '/produtos-digitais.html', text: 'Loja' },
    { href: '/faq.html', text: 'FAQ' },
    { href: '/blog.html', text: 'Blog' }
];

// ==================================================================
// O CÓDIGO ABAIXO USA A LISTA ACIMA PARA CONSTRUIR OS MENUS
// Não precisa mais mexer aqui.
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Constrói o Menu Desktop ---
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        let desktopNavHTML = '<nav><ul>';
        navLinks.forEach(link => {
            desktopNavHTML += `<li><a href="${link.href}">${link.text}</a></li>`;
        });
        desktopNavHTML += '</ul></nav>';
        menuContainer.innerHTML = desktopNavHTML;
    }

    // --- Constrói o Menu Mobile ---
    const mobileNavContainer = document.getElementById('mobile-nav');
    if (mobileNavContainer) {
        // Limpa o conteúdo existente para evitar duplicatas
        mobileNavContainer.innerHTML = '';
        navLinks.forEach(link => {
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.textContent = link.text;
            mobileNavContainer.appendChild(mobileLink);
        });
    }

    // --- Ativa o botão Hambúrguer ---
    const hamburger = document.getElementById('hamburger');
    if (hamburger && mobileNavContainer) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNavContainer.classList.toggle('show');
        });
    }
});