// ==================================================================
// RODAPÉ DO PROJETO SECUNDÁRIO (GERADORES)
// Com inteligência para ocultar o link na página de Política,
// alinhamento à esquerda no modo celular e logo com texto lado a lado
// ==================================================================

function carregarRodape() {
    
    // O endereço da sua "casa" oficial (substitui o basePath do projeto original)
    const sitePrincipal = 'https://www.resolvefacil.online/';

    // --- LÓGICA DO BOTÃO VOLTAR (Adaptada para os geradores) ---
    const acaoVoltar = `if(window.history.length > 1 || document.referrer) { window.history.back(); } else { window.location.href='${sitePrincipal}loja.html'; }`;

    // GARANTIR QUE OS ÍCONES CARREGUEM (FontAwesome)
    if (!document.querySelector("link[href*='font-awesome']")) {
        const faLink = document.createElement("link");
        faLink.rel = "stylesheet";
        faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
        document.head.appendChild(faLink);
    }

    // ESTILOS CSS EXCLUSIVOS (Copiados fielmente do projeto original)
    const styleHTML = `
        <style>
            /* --- ESTILOS DO BOTÃO VOLTAR --- */
            .rf-back-container {
                text-align: center;
                padding: 30px 20px 0px 20px;
                background-color: transparent;
                display: none; 
            }
            .rf-btn-voltar {
                background-color: transparent;
                color: var(--secondary-bg, #3e5a6a);
                border: 2px solid var(--secondary-bg, #3e5a6a);
                padding: 10px 25px;
                border-radius: 8px;
                font-size: 1.05em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                font-family: Arial, sans-serif;
            }
            .rf-btn-voltar:hover {
                background-color: var(--secondary-bg, #3e5a6a);
                color: white;
                transform: translateX(-5px);
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }

            /* --- ESTILOS DO RODAPÉ --- */
            .rf-footer-wrapper {
                background-color: var(--primary-bg);
                color: var(--text-color);
                margin-top: 40px;
                border-top: 4px solid var(--highlight);
                font-family: Arial, sans-serif;
            }
            .rf-footer-container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 40px 20px 20px 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 40px;
            }
            .rf-footer-col h4 {
                color: #ffffff;
                font-size: 1.2em;
                margin-bottom: 20px;
                border-bottom: 2px solid var(--secondary-bg);
                padding-bottom: 10px;
                display: inline-block;
            }
            .rf-footer-col p {
                font-size: 0.95em;
                line-height: 1.6;
                opacity: 0.85;
                margin-bottom: 15px;
            }
            .rf-footer-brand {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            .rf-footer-brand img {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin: 0;
            }
            .rf-footer-brand h4 {
                margin: 0;
                padding: 0;
                border: none;
                font-size: 1.4em;
            }
            .rf-footer-links {
                list-style: none;
                padding: 0;
            }
            .rf-footer-links li {
                margin-bottom: 12px;
            }
            .rf-footer-links a {
                color: var(--text-color);
                text-decoration: none;
                transition: color 0.3s, padding-left 0.3s;
                display: inline-block;
            }
            .rf-footer-links a:hover {
                color: var(--highlight);
                padding-left: 5px;
            }
            .rf-contact-list {
                list-style: none;
                padding: 0;
            }
            .rf-contact-list li {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                margin-bottom: 15px;
                font-size: 0.95em;
                opacity: 0.85;
            }
            .rf-contact-list i {
                color: var(--highlight);
                margin-top: 4px;
            }
            
            /* --- ESTILOS DA SEÇÃO DE REDES SOCIAIS (100% CENTRALIZADA SEMPRE) --- */
            .rf-social-center-section {
                text-align: center;
                padding: 10px 20px 40px 20px;
                max-width: 1000px;
                margin: 0 auto;
            }
            .rf-social-center-section h4 {
                color: #ffffff;
                font-size: 1.2em;
                margin-bottom: 15px;
                border-bottom: 2px solid var(--secondary-bg);
                padding-bottom: 10px;
                display: inline-block;
            }
            .rf-social-center-section p {
                font-size: 0.95em;
                line-height: 1.6;
                opacity: 0.85;
                margin-bottom: 15px;
            }
            .rf-social-flex {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 10px;
            }
            .rf-social-flex a {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background-color: var(--secondary-bg);
                border-radius: 50%;
                color: white;
                text-decoration: none;
                font-size: 1.2em;
                transition: background-color 0.3s, transform 0.3s;
            }
            .rf-social-flex a:hover {
                background-color: var(--highlight);
                transform: scale(1.1) translateY(-3px);
            }

            /* --- RODAPÉ INFERIOR --- */
            .rf-footer-bottom {
                background-color: #00223b; 
                padding: 30px 20px 20px 20px;
                text-align: center;
                position: relative;
                margin-top: 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            .rf-scroll-top-btn {
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--secondary-bg);
                color: white;
                border: 2px solid var(--highlight);
                padding: 10px 25px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                font-size: 0.85em;
                text-transform: uppercase;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .rf-scroll-top-btn:hover {
                background-color: var(--highlight);
                transform: translateX(-50%) translateY(-3px);
                box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            }
            .rf-bottom-text {
                font-size: 0.85em;
                opacity: 0.7;
                margin-bottom: 5px;
            }
            .rf-bottom-links a {
                color: var(--highlight);
                text-decoration: none;
                font-weight: bold;
                font-size: 0.85em;
                transition: opacity 0.3s;
            }
            .rf-bottom-links a:hover {
                opacity: 0.8;
                text-decoration: underline;
            }
            
            /* =========================================================
               AJUSTES EXCLUSIVOS PARA CELULAR (TUDO À ESQUERDA)
            ========================================================= */
            @media (max-width: 768px) {
                .rf-footer-container {
                    grid-template-columns: 1fr;
                    text-align: left; /* Tira do centro e joga para esquerda */
                }
                .rf-footer-col h4 {
                    display: inline-block;
                }
                .rf-contact-list li {
                    justify-content: flex-start; /* Alinha os ícones de Fale Conosco na esquerda */
                }
                .rf-footer-brand {
                    justify-content: flex-start; /* Garante alinhamento à esquerda da logo com o texto */
                }
            }
        </style>
    `;

    // HTML DO RODAPÉ (Idêntico ao original, usando sitePrincipal nas URLs)
    const footerHTML = `
        <div class="rf-back-container" id="dynamic-back-button">
            <button onclick="${acaoVoltar}" class="rf-btn-voltar">
                <i class="fas fa-arrow-left"></i> Voltar
            </button>
        </div>

        <div class="rf-footer-wrapper">
            <div class="rf-footer-container">
                
                <div class="rf-footer-col">
                    <div class="rf-footer-brand">
                        <img src="${sitePrincipal}favicon.png" alt="ResolveFácil Logo" onerror="this.style.display='none'">
                        <h4>ResolveFácil</h4>
                    </div>
                    <p>Descomplique sua vida com agilidade e segurança. Serviços online, documentos e design gráfico diretamente pelo WhatsApp.</p>
                    <p><strong>Atendimento humanizado</strong> que faz a diferença.</p>
                </div>

                <div class="rf-footer-col">
                    <h4>Navegação Rápida</h4>
                    <ul class="rf-footer-links">
                        <li><a href="${sitePrincipal}index.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> Início</a></li>
                        <li><a href="${sitePrincipal}quemsomos.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> Quem Somos</a></li>
                        <li><a href="${sitePrincipal}servicos.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> Serviços</a></li>
                        <li><a href="${sitePrincipal}loja.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> Loja</a></li>
                        <li><a href="${sitePrincipal}faq.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> FAQ</a></li>
                        <li><a href="${sitePrincipal}blog.html"><i class="fas fa-chevron-right" style="font-size:0.8em; margin-right:5px; color:var(--highlight)"></i> Blog</a></li>
                    </ul>
                </div>

                <div class="rf-footer-col">
                    <h4>Fale Conosco</h4>
                    <ul class="rf-contact-list">
                        <li>
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Atendimento 100% Online<br>Para todo o Brasil</span>
                        </li>
                        <li>
                            <i class="fab fa-whatsapp"></i>
                            <span>(92) 99602-9888</span>
                        </li>
                        <li>
                            <i class="fas fa-clock"></i>
                            <span>Segunda a Sábado<br>Suporte Rápido e Seguro</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="rf-social-center-section">
                <h4>Conecte-se</h4>
                <p>Acompanhe nosso trabalho e novidades nas redes sociais:</p>
                <div class="rf-social-flex">
                    <a href="https://www.instagram.com/resolvefacil.online" target="_blank" aria-label="Instagram">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61578208932996" target="_blank" aria-label="Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.youtube.com/@resolvefacil.online" target="_blank" aria-label="YouTube">
                        <i class="fab fa-youtube"></i>
                    </a>
                    <a href="https://wa.me/5592996029888?text=Ol%C3%A1%2C%20estou%20vindo%20atrav%C3%A9s%20do%20Site!%20Gostaria%20de%20um%20atendimento." target="_blank" aria-label="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>

            <div class="rf-footer-bottom">
                <button id="scrollToTopBtn" class="rf-scroll-top-btn">
                    Voltar ao Topo <i class="fas fa-arrow-up"></i>
                </button>
                <p class="rf-bottom-text">
                    &copy; ${new Date().getFullYear()} ResolveFácil • Soluções Digitais. Todos os direitos reservados.
                </p>
                
                ${window.location.pathname.toLowerCase().includes('politica-de-privacidade') ? '' : `
                <p class="rf-bottom-links">
                    <a href="${sitePrincipal}politica-de-privacidade.html">Política de Privacidade</a>
                </p>
                `}
            </div>
        </div>
    `;

    // PROCURA A ÂNCORA E INJETA TUDO
    const container = document.getElementById('footer-container');
    
    if (container) {
        container.innerHTML = styleHTML + footerHTML;
    } else {
        document.body.insertAdjacentHTML('beforeend', styleHTML + footerHTML);
    }

    // ATIVA O BOTÃO "VOLTAR AO TOPO"
    setTimeout(() => {
        const scrollToTopBtn = document.getElementById("scrollToTopBtn");
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener("click", () => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });
        }

        // Garante que o botão de voltar sempre apareça nos geradores
        const backBtnContainer = document.getElementById('dynamic-back-button');
        if (backBtnContainer) {
            backBtnContainer.style.display = 'block'; 
        }

    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarRodape);
} else {
    carregarRodape();
}