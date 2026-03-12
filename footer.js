// ==================================================================
// RODAPÉ DO PROJETO SECUNDÁRIO (GERADORES) - VERSÃO SEGURA
// Design idêntico ao original, apontando para o site principal.
// ==================================================================

function carregarRodape() {
    
    // O endereço da sua "casa" oficial
    const sitePrincipal = 'https://www.resolvefacil.online/';

    // Lógica inteligente do botão Voltar
    const acaoVoltar = `if(window.history.length > 1 || document.referrer) { window.history.back(); } else { window.location.href='${sitePrincipal}loja.html'; }`;

    // Garante que os ícones do FontAwesome funcionem
    if (!document.querySelector("link[href*='font-awesome']")) {
        const faLink = document.createElement("link");
        faLink.rel = "stylesheet";
        faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
        document.head.appendChild(faLink);
    }

    const styleHTML = `
        <style>
            .rf-back-container { text-align: center; padding: 30px 20px 0px 20px; background-color: transparent; }
            .rf-btn-voltar { background-color: transparent; color: var(--secondary-bg, #3e5a6a); border: 2px solid var(--secondary-bg, #3e5a6a); padding: 10px 25px; border-radius: 8px; font-size: 1.05em; font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 10px; font-family: Arial, sans-serif; }
            .rf-btn-voltar:hover { background-color: var(--secondary-bg, #3e5a6a); color: white; transform: translateX(-5px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .rf-footer-wrapper { background-color: var(--primary-bg, #003459); color: var(--text-color, #f2f2ed); margin-top: 40px; border-top: 4px solid var(--highlight, #ff6600); font-family: Arial, sans-serif; }
            .rf-footer-container { max-width: 1000px; margin: 0 auto; padding: 40px 20px 20px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 40px; }
            .rf-footer-col h4 { color: #ffffff; font-size: 1.2em; margin-bottom: 20px; border-bottom: 2px solid var(--secondary-bg, #3e5a6a); padding-bottom: 10px; display: inline-block; }
            .rf-footer-col p { font-size: 0.95em; line-height: 1.6; opacity: 0.85; margin-bottom: 15px; }
            .rf-footer-logo { width: 60px; height: 60px; border-radius: 50%; margin-bottom: 15px; }
            .rf-footer-links { list-style: none; padding: 0; }
            .rf-footer-links li { margin-bottom: 12px; }
            .rf-footer-links a { color: var(--text-color, #f2f2ed); text-decoration: none; transition: color 0.3s, padding-left 0.3s; display: inline-block; }
            .rf-footer-links a:hover { color: var(--highlight, #ff6600); padding-left: 5px; }
            .rf-contact-list { list-style: none; padding: 0; }
            .rf-contact-list li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; font-size: 0.95em; opacity: 0.85; }
            .rf-contact-list i { color: var(--highlight, #ff6600); margin-top: 4px; }
            .rf-social-center-section { text-align: center; padding: 10px 20px 40px 20px; max-width: 1000px; margin: 0 auto; }
            .rf-social-center-section h4 { color: #ffffff; font-size: 1.2em; margin-bottom: 15px; border-bottom: 2px solid var(--secondary-bg, #3e5a6a); padding-bottom: 10px; display: inline-block; }
            .rf-social-flex { display: flex; justify-content: center; gap: 15px; margin-top: 10px; }
            .rf-social-flex a { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: var(--secondary-bg, #3e5a6a); border-radius: 50%; color: white; text-decoration: none; font-size: 1.2em; transition: background-color 0.3s, transform 0.3s; }
            .rf-social-flex a:hover { background-color: var(--highlight, #ff6600); transform: scale(1.1) translateY(-3px); }
            .rf-footer-bottom { background-color: #00223b; padding: 30px 20px 20px 20px; text-align: center; position: relative; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
            .rf-scroll-top-btn { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background-color: var(--secondary-bg, #3e5a6a); color: white; border: 2px solid var(--highlight, #ff6600); padding: 10px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; font-size: 0.85em; text-transform: uppercase; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            .rf-scroll-top-btn:hover { background-color: var(--highlight, #ff6600); transform: translateX(-50%) translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.4); }
            @media (max-width: 768px) { .rf-footer-container { grid-template-columns: 1fr; text-align: center; } .rf-contact-list li { justify-content: center; } .rf-footer-logo { margin: 0 auto 15px auto; } }
        </style>
    `;

    const footerHTML = `
        <div class="rf-back-container">
            <button onclick="${acaoVoltar}" class="rf-btn-voltar">
                <i class="fas fa-arrow-left"></i> Voltar para a Loja
            </button>
        </div>
        <div class="rf-footer-wrapper">
            <div class="rf-footer-container">
                <div class="rf-footer-col">
                    <img src="${sitePrincipal}favicon.png" alt="Logo" class="rf-footer-logo">
                    <h4>ResolveFácil</h4>
                    <p>Descomplique sua vida com agilidade e segurança. Serviços online, documentos e design gráfico diretamente pelo WhatsApp.</p>
                </div>
                <div class="rf-footer-col">
                    <h4>Navegação Rápida</h4>
                    <ul class="rf-footer-links">
                        <li><a href="${sitePrincipal}index.html">Início</a></li>
                        <li><a href="${sitePrincipal}quemsomos.html">Quem Somos</a></li>
                        <li><a href="${sitePrincipal}servicos.html">Serviços</a></li>
                        <li><a href="${sitePrincipal}loja.html">Loja</a></li>
                        <li><a href="${sitePrincipal}blog.html">Blog</a></li>
                    </ul>
                </div>
                <div class="rf-footer-col">
                    <h4>Fale Conosco</h4>
                    <ul class="rf-contact-list">
                        <li><i class="fas fa-map-marker-alt"></i><span>Atendimento 100% Online<br>Para todo o Brasil</span></li>
                        <li><i class="fab fa-whatsapp"></i><span>(92) 99602-9888</span></li>
                    </ul>
                </div>
            </div>
            <div class="rf-social-center-section">
                <h4>Conecte-se</h4>
                <div class="rf-social-flex">
                    <a href="https://www.instagram.com/resolvefacil.online" target="_blank"><i class="fab fa-instagram"></i></a>
                    <a href="https://www.facebook.com/profile.php?id=61578208932996" target="_blank"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://wa.me/5592996029888" target="_blank"><i class="fab fa-whatsapp"></i></a>
                </div>
            </div>
            <div class="rf-footer-bottom">
                <button id="scrollToTopBtn" class="rf-scroll-top-btn">Voltar ao Topo <i class="fas fa-arrow-up"></i></button>
                <p>&copy; ${new Date().getFullYear()} ResolveFácil • Todos os direitos reservados.</p>
                <p><a href="${sitePrincipal}politica-de-privacidade.html" style="color:var(--highlight); text-decoration:none; font-weight:bold;">Política de Privacidade</a></p>
            </div>
        </div>
    `;

    const container = document.getElementById('footer-container');
    if (container) {
        container.innerHTML = styleHTML + footerHTML;
        document.getElementById('scrollToTopBtn').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Inicializa a função
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarRodape);
} else {
    carregarRodape();
}