// ==================================================================
// MENU DO PROJETO SECUNDÁRIO (GERADORES)
// Todos os links apontam de volta para o site oficial!
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Domínio principal oficial para garantir que o cliente volte para a "casa" certa
    const mainSite = 'https://www.resolvefacil.online/';

    // 1. LISTA ÚNICA DE LINKS (Apontando para o domínio principal)
    const navLinks = [
        { href: mainSite + 'index.html', text: 'Início' },
        { href: mainSite + 'quemsomos.html', text: 'Quem Somos' },
        { href: mainSite + 'servicos.html', text: 'Serviços' },
        { href: mainSite + 'loja.html', text: 'Loja' },
        { href: mainSite + 'faq.html', text: 'FAQ' },
        { href: mainSite + 'blog.html', text: 'Blog' }
    ];

    // --- 2. Constrói o Menu Desktop ---
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        let desktopNavHTML = '<nav><ul>';
        navLinks.forEach(link => {
            desktopNavHTML += `<li><a href="${link.href}">${link.text}</a></li>`;
        });
        desktopNavHTML += '</ul></nav>';
        menuContainer.innerHTML = desktopNavHTML;
    }

    // --- 3. Constrói o Menu Mobile ---
    const mobileNavContainer = document.getElementById('mobile-nav');
    if (mobileNavContainer) {
        // Limpa o conteúdo existente para evitar duplicatas ao navegar
        mobileNavContainer.innerHTML = '';
        navLinks.forEach(link => {
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.textContent = link.text;
            mobileNavContainer.appendChild(mobileLink);
        });
    }

    // --- 4. Ativa o botão Hambúrguer ---
    const hamburger = document.getElementById('hamburger');
    if (hamburger && mobileNavContainer) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNavContainer.classList.toggle('show');
        });
    }
});