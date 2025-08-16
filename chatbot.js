// DIRETIVA DE ATUALIZAÇÃO - IMPORTANTE:
// Nenhuma atualização futura tem autoridade para apagar ou remover conhecimento e correções anteriores.
// A base de conhecimento (SERVICE_INFO) e as correções de bugs (scroll, performance, etc.) devem ser sempre preservadas e expandidas, nunca substituídas por uma versão inferior.
// A remoção de código funcional só é permitida se for para corrigir um erro comprovado.
// Assinado: Washington Leal, Fundador.

// Versão Final Otimizada e Corrigida - 10/08/2025 v2
// CORREÇÃO DE USABILIDADE: Teclado do celular não abre mais automaticamente.

document.addEventListener('DOMContentLoaded', function() {

    // --- OTIMIZAÇÃO DE PERFORMANCE ---
    if (!document.getElementById('chatbot-modal')) {
        // 1. CRIAÇÃO DA ESTRUTURA HTML DO CHATBOT
        const chatbotHTML = `
            <div class="chatbot-fab" id="chatbot-fab">
                <i class="fas fa-headset"></i>
            </div>
            <div class="chatbot-modal" id="chatbot-modal">
                <div class="chatbot-header">
                    <h2>Júnior | ResolveFácil</h2>
                    <span class="chatbot-close-btn" id="chatbot-close-btn">&times;</span>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chatbot-typing-indicator" id="chatbot-typing-indicator" style="display: none;">
                        <p>Júnior está digitando...</p>
                        <div class="chatbot-loading">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
                <div class="chatbot-input-container">
                    <button id="chatbot-clear-history-btn" class="chatbot-action-btn-clear" title="Nova Conversa">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <textarea id="chatbot-input" class="chatbot-input" placeholder="Digite sua mensagem..." rows="1"></textarea>
                    <button id="chatbot-send-btn" class="chatbot-action-btn-send" title="Enviar">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // 2. CRIAÇÃO DOS ESTILOS CSS DO CHATBOT
        const chatbotCSS = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
            .chatbot-fab {
                position: fixed;
                bottom: 25px;
                right: 25px;
                background-color: #011a66;
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 28px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                transition: transform 0.3s ease, background-color 0.3s ease, opacity 0.5s;
                opacity: 0;
                transform: scale(0.8);
                z-index: 1000;
            }
            .chatbot-fab.show-fab {
                opacity: 1;
                transform: scale(1);
            }
            .chatbot-fab:hover {
                background-color: #003459;
                transform: scale(1.1);
            }
            .chatbot-fab i { line-height: 1; }
            .chatbot-fab span { display: none; }
            .chatbot-modal {
                display: none;
                position: fixed;
                z-index: 1001;
                right: 25px;
                bottom: 100px;
                width: 90%;
                max-width: 400px;
                height: 80vh;
                max-height: 700px;
                background-color: #ffffff;
                border-radius: 15px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                flex-direction: column;
                font-family: 'Inter', sans-serif;
                overflow: hidden;
                border: 1px solid #E0E0E0;
            }
            @media (max-width: 480px) {
                .chatbot-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 0;
                }
                .chatbot-fab {
                    width: 50px;
                    height: 50px;
                    font-size: 24px;
                    border: 2px solid white;
                }
            }
            .chatbot-header {
                background-color: #f7f7f7;
                padding: 15px 20px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }
            .chatbot-header h2 {
                font-size: 1.1em;
                color: #333;
                font-weight: 700;
                margin: 0;
                flex-grow: 1;
            }
            .chatbot-header::before {
                content: '';
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #011a66;
                background-image: url('https://i.imgur.com/wylgNkZ.png');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.1);
                flex-shrink: 0;
            }
            .chatbot-close-btn {
                font-size: 24px;
                color: #888;
                cursor: pointer;
                transition: color 0.2s;
                font-weight: 300;
            }
            .chatbot-close-btn:hover { color: #333; }
            .chatbot-messages {
                flex-grow: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background-color: #fff;
            }
            .chatbot-message {
                padding: 10px 15px;
                border-radius: 18px;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.5;
                font-size: 0.95em;
            }
            .chatbot-message.user {
                background-color: #011a66;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .chatbot-message.bot {
                background-color: #f1f1f1;
                color: #333;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }
            .chatbot-message strong { font-weight: 700; }
            .chatbot-message a {
                color: #003459;
                font-weight: bold;
                text-decoration: underline;
            }
            .chatbot-input-container {
                padding: 10px 15px;
                border-top: 1px solid #e0e0e0;
                background-color: #f7f7f7;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
            }
            .chatbot-input {
                flex-grow: 1;
                border: 1px solid #ccc;
                border-radius: 20px;
                padding: 10px 15px;
                font-size: 1em;
                font-family: 'Inter', sans-serif;
                resize: none;
                max-height: 80px;
                overflow-y: auto;
            }
            .chatbot-input:focus {
                outline: none;
                border-color: #011a66;
                box-shadow: 0 0 0 2px rgba(1, 26, 102, 0.2);
            }
            .chatbot-action-btn-send {
                background-color: #011a66;
                color: white;
                border: none;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                font-size: 18px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                transition: background-color 0.2s;
                flex-shrink: 0;
            }
            .chatbot-action-btn-send:hover { background-color: #003459; }
            .chatbot-action-btn-clear {
                background: none;
                border: none;
                color: #777;
                cursor: pointer;
                font-size: 18px;
                padding: 10px;
                transition: color 0.2s;
            }
            .chatbot-action-btn-clear:hover { color: #333; }
            .chatbot-typing-indicator {
                align-self: flex-start;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .chatbot-typing-indicator p {
                margin: 0;
                font-size: 0.85em;
                color: #888;
                font-style: italic;
            }
            .chatbot-loading {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .chatbot-loading span {
                width: 7px;
                height: 7px;
                background-color: #aaa;
                border-radius: 50%;
                animation: typing-animation 1.4s infinite ease-in-out both;
            }
            .chatbot-loading span:nth-child(1) { animation-delay: 0s; }
            .chatbot-loading span:nth-child(2) { animation-delay: 0.2s; }
            .chatbot-loading span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing-animation {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        const styleSheet = document.createElement("style");
        styleSheet.innerText = chatbotCSS;
        document.head.appendChild(styleSheet);
    }


    // 4. LÓGICA DO CHATBOT (EXECUTA EM TODAS AS PÁGINAS)
    const chatbotFab = document.getElementById('chatbot-fab');
    const chatbotModal = document.getElementById('chatbot-modal');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const chatbotTypingIndicator = document.getElementById('chatbot-typing-indicator');
    const chatbotClearHistoryBtn = document.getElementById('chatbot-clear-history-btn');

    const CHAT_HISTORY_KEY = 'resolvefacil_chat_history';
    const WHATSAPP_NUMBER = '5592996029888';

    let chatHistory = [];
    let serviceInfo = '';

    async function fetchKnowledgeBase() {
        if (sessionStorage.getItem('knowledgeBase')) {
            return sessionStorage.getItem('knowledgeBase');
        } else {
            try {
                const response = await fetch('knowledge.txt');
                if (!response.ok) throw new Error('Network response was not ok');
                const text = await response.text();
                sessionStorage.setItem('knowledgeBase', text);
                return text;
            } catch (error) {
                console.error('Falha ao buscar a base de conhecimento:', error);
                return 'Erro: não foi possível carregar as informações do assistente.';
            }
        }
    }

    function loadChatHistory() {
        const currentMessages = chatbotMessages.querySelectorAll('.chatbot-message');
        currentMessages.forEach(message => message.remove());
        
        const storedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (storedHistory) {
            try {
                chatHistory = JSON.parse(storedHistory);
                const filteredHistory = chatHistory.filter(msg => !(msg.role === "user" && msg.parts[0].text.startsWith("Você é o Júnior")));
                filteredHistory.forEach(msg => {
                    if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                        if (msg.role === "user") displayMessage(msg.parts[0].text, "user");
                        else if (msg.role === "model") displayMessage(msg.parts[0].text, "bot");
                    }
                });
            } catch (e) {
                console.error("Erro ao carregar histórico do chat:", e);
                chatHistory = [];
            }
        }
        if (chatHistory.length === 0) {
            const initialBotMessage = "Olá! Sou o Júnior, o tira dúvidas da ResolveFácil. Como posso ajudar você a **DESCOMPLICAR SEU DIA HOJE?**";
            displayMessage(initialBotMessage, "bot");
            chatHistory.push({ role: "model", parts: [{ text: initialBotMessage }] });
            saveChatHistory();
        }
    }

    function saveChatHistory() {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    }

    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chatbot-message', sender);
        function formatarResposta(texto) {
            let textoFormatado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            textoFormatado = textoFormatado.replace(/\n/g, '<br>');
            return textoFormatado;
        }
        messageElement.innerHTML = formatarResposta(message);
        
        chatbotMessages.insertBefore(messageElement, chatbotTypingIndicator);

        setTimeout(() => {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }, 100);
    }

    async function callGeminiAPI(prompt) {
        chatbotTypingIndicator.style.display = 'flex';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        if (!serviceInfo) serviceInfo = await fetchKnowledgeBase();
        const apiHistory = [
            { role: "user", parts: [{ text: serviceInfo }] },
            ...chatHistory.filter(msg => !(msg.role === "user" && msg.parts[0].text.startsWith("Você é o Júnior"))),
            { role: "user", parts: [{ text: prompt }] }
        ];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        saveChatHistory();

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC81X7S-_8vdznyCjDxALq6fRBibaHWVTk`;
        
        const payload = { 
            contents: apiHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95
            }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Body:", errorBody);
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result && result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts) {
                const botResponse = result.candidates[0].content.parts[0].text;
                displayMessage(botResponse, "bot");
                chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
                saveChatHistory();
            } else {
                console.error("Resposta da API inválida:", result);
                throw new Error("Resposta da API inválida.");
            }

        } catch (error) {
            console.error('Erro ao chamar a API:', error);
            const whatsappMessage = encodeURIComponent(`Olá! Estou com uma dúvida sobre a ResolveFácil que o Júnior não conseguiu responder. Poderia me ajudar? (Vindo do chat do site)`);
            displayMessage(`Desculpe, houve um erro de conexão. Por favor, tente novamente mais tarde ou <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}" target="_blank">clique aqui para falar com um atendente humano no WhatsApp</a>.`, "bot");
        } finally {
            chatbotTypingIndicator.style.display = 'none';
        }
    }

    async function initializeChatbot() {
        serviceInfo = await fetchKnowledgeBase();
        
        chatbotMessages.appendChild(chatbotTypingIndicator);
        
        loadChatHistory();

        chatbotFab.addEventListener('click', () => {
            chatbotModal.style.display = 'flex';
            // A linha chatbotInput.focus() foi removida daqui para corrigir o problema do teclado.
        });

        chatbotCloseBtn.addEventListener('click', () => {
            chatbotModal.style.display = 'none';
        });

        chatbotClearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem(CHAT_HISTORY_KEY);
            chatHistory = [];
            loadChatHistory();
        });

        function handleSend() {
            const userMessage = chatbotInput.value.trim();
            if (userMessage) {
                displayMessage(userMessage, "user");
                chatbotInput.value = '';
                chatbotInput.style.height = 'auto';
                callGeminiAPI(userMessage);
            }
        }

        chatbotSendBtn.addEventListener('click', handleSend);

        chatbotInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
            }
        });

        chatbotInput.addEventListener('input', () => {
            chatbotInput.style.height = 'auto';
            chatbotInput.style.height = chatbotInput.scrollHeight + 'px';
        });

        setTimeout(() => {
            if (chatbotFab) {
                chatbotFab.classList.add('show-fab');
            }
        }, 1000);
    }

    initializeChatbot();
});
