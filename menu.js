// ==================================================================
// MENU DO PROJETO SECUNDÁRIO (GERADORES)
// Todos os links apontam de volta para o site oficial!
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Domínio principal
    const mainSite = 'https://www.resolvefacil.online/';

    // Lista de Links apontando para a casa oficial
    const navLinks = [
        { href: mainSite + 'index.html', text: 'Início' },
        { href: mainSite + 'quemsomos.html', text: 'Quem Somos' },
        { href: mainSite + 'servicos.html', text: 'Serviços' },
        { href: mainSite + 'loja.html', text: 'Loja' },
        { href: mainSite + 'faq.html', text: 'FAQ' },
        { href: mainSite + 'blog.html', text: 'Blog' }
    ];

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