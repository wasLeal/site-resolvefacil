// ==================================================================
// MENU DO PROJETO SECUNDÁRIO (GERADORES)
// Todos os links apontam de volta para o site oficial!
// Com inteligência de página ativa e cor do chatbot no mobile
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Domínio principal oficial para garantir que o cliente volte para a "casa" certa
    const mainSite = 'https://www.resolvefacil.online/';

    // 2. VERIFICA O CAMINHO DA PÁGINA ATUAL
    const currentPathname = window.location.pathname.toLowerCase();
    let currentPage = currentPathname.split('/').pop();
    if (currentPage === '' || currentPage === '/') currentPage = 'index.html';

    // Inteligência extra: Se estiver numa página de gerador, vamos manter a aba "Loja" acesa!
    const isGerador = currentPage.includes('curriculo') || currentPage.includes('contrato');

    // 3. INJETA OS ESTILOS CENTRALIZADOS DO MENU
    const menuStyles = `
        <style>
            /* --- COR DE FUNDO DO MENU MOBILE (Cor do Chatbot #011a66) --- */
            .mobile-nav {
                background-color: #011a66 !important;
            }

            /* --- MARCAÇÃO DA PÁGINA ATIVA (Âmbar + Tracinho) --- */
            #menu-container nav a.active-link,
            .mobile-nav a.active-link {
                color: var(--highlight, #ff6600) !important;
                border-bottom: 2px solid var(--highlight, #ff6600);
                padding-bottom: 3px;
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', menuStyles);

    // 4. LISTA ÚNICA DE LINKS (Com a propriedade 'file' para a inteligência visual)
    const navLinks = [
        { href: mainSite + 'index.html', text: 'Início', file: 'index.html' },
        { href: mainSite + 'quemsomos.html', text: 'Quem Somos', file: 'quemsomos.html' },
        { href: mainSite + 'servicos.html', text: 'Serviços', file: 'servicos.html' },
        { href: mainSite + 'loja.html', text: 'Loja', file: 'loja.html' },
        { href: mainSite + 'faq.html', text: 'FAQ', file: 'faq.html' },
        { href: mainSite + 'blog.html', text: 'Blog', file: 'blog.html' }
    ];

    // --- 5. Constrói o Menu Desktop ---
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        let desktopNavHTML = '<nav><ul>';
        navLinks.forEach(link => {
            let isActiveClass = '';
            
            // Ativa o link se for a página exata OU se for um gerador e o link for o da "Loja"
            if (currentPage === link.file || (isGerador && link.file === 'loja.html')) {
                isActiveClass = 'active-link';
            }

            desktopNavHTML += `<li><a href="${link.href}" class="${isActiveClass}">${link.text}</a></li>`;
        });
        desktopNavHTML += '</ul></nav>';
        menuContainer.innerHTML = desktopNavHTML;
    }

    // --- 6. Constrói o Menu Mobile ---
    const mobileNavContainer = document.getElementById('mobile-nav');
    if (mobileNavContainer) {
        // Limpa o conteúdo existente para evitar duplicatas ao navegar
        mobileNavContainer.innerHTML = '';
        navLinks.forEach(link => {
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.textContent = link.text;
            
            // Aplica a mesma inteligência visual no menu do celular
            if (currentPage === link.file || (isGerador && link.file === 'loja.html')) {
                mobileLink.classList.add('active-link');
            }

            mobileNavContainer.appendChild(mobileLink);
        });
    }

    // --- 7. Ativa o botão Hambúrguer ---
    const hamburger = document.getElementById('hamburger');
    if (hamburger && mobileNavContainer) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNavContainer.classList.toggle('show');
        });
    }
});