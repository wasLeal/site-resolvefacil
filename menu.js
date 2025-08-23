// ==================================================================
// ARQUIVO MESTRE DO MENU - EDITE APENAS AQUI
// ==================================================================

// 1. LISTA ÚNICA DE LINKS DO SITE
const navLinks = [
    { href: 'https://www.resolvefacil.online', text: 'Início' },
    { href: 'https://www.resolvefacil.online/quemsomos.html', text: 'Quem Somos' },
    { href: 'https://www.resolvefacil.online/servicos.html', text: 'Serviços' },
    { href: 'https://www.resolvefacil.online/design-servicos.html', text: 'Design' },
    { href: 'https://www.resolvefacil.online/loja.html', text: 'Loja' },
    { href: 'https://www.resolvefacil.online/faq.html', text: 'FAQ' },
    { href: 'https://www.resolvefacil.online/blog.html', text: 'Blog' }
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

    // --- ADIÇÃO: Constrói o Rodapé ---
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        footerContainer.innerHTML = `
            © 2025 ResolveFácil • Atendimento humanizado • Todos os direitos reservados
            <a href="https://www.resolvefacil.online/politica-de-privacidade.html">Política de Privacidade</a>
        `;
    }
});