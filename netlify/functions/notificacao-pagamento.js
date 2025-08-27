// Arquivo: /netlify/functions/notificacao-pagamento.js
// Local: Projeto "resolvefacil-curriculos"

const fetch = require('node-fetch');
const crypto = require('crypto');

// --- FUNÇÃO DE PROCESSAMENTO PESADO ---
// Esta função faz todo o trabalho de verificar o pagamento e enviar o e-mail.
// Ela é chamada pela função principal, mas a resposta para o Mercado Pago não espera por ela.
async function processarNotificacao(event) {
    const body = JSON.parse(event.body);
    console.log("Iniciando processamento em segundo plano para o webhook...");

    try {
        // 1. Validação da Assinatura de Segurança
        // Este passo é crucial para garantir que a notificação é genuína do Mercado Pago.
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const signatureHeader = event.headers['x-signature'];
        if (!secret || !signatureHeader) {
            console.error("Configuração de segurança faltando (SECRET ou assinatura).");
            return;
        }

        const signatureParts = signatureHeader.split(',');
        const tsPart = signatureParts.find(part => part.trim().startsWith('ts='));
        const hashPart = signatureParts.find(part => part.trim().startsWith('v1='));
        
        if (!tsPart || !hashPart) {
            console.error("Formato da assinatura inválido.");
            return;
        }

        const ts = tsPart.split('=')[1];
        const receivedHash = hashPart.split('=')[1];
        const manifest = `id:${body.data.id};request-id:${event.headers['x-request-id']};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        if (receivedHash !== hmac) {
            console.warn("Assinatura do webhook inválida. A notificação foi rejeitada.");
            return;
        }
        console.log("Assinatura do webhook verificada com sucesso.");

        // 2. Processa apenas se for um evento de Pagamento (que é o que a nossa API cria)
        if (body.type === 'payment') {
            const paymentId = body.data.id;
            console.log(`Processando Pagamento ID: ${paymentId}`);

            // 3. Busca os Detalhes do Pagamento na API do Mercado Pago
            const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!paymentResponse.ok) {
                throw new Error(`Falha ao buscar detalhes do pagamento ${paymentId}`);
            }
            const payment = await paymentResponse.json();

            // 4. Verifica se o Pagamento está APROVADO
            if (payment.status === 'approved') {
                console.log(`Pagamento APROVADO. Preparando para enviar e-mail.`);
                
                const customerEmail = payment.payer.email;
                if (!customerEmail) {
                    throw new Error(`Pagamento ${paymentId} aprovado, mas sem e-mail do comprador.`);
                }
                
                // 5. Envia o E-mail de Entrega via Brevo
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 
                        'api-key': process.env.BREVO_API_KEY, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        sender: { name: "ResolveFácil", email: "resolvefacil70@gmail.com" },
                        to: [{ email: customerEmail }],
                        subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                        htmlContent: `<p>Olá! Seu pagamento foi aprovado com sucesso.</p><p>Clique no link abaixo para acessar seu Gerador de Currículo Profissional:</p><p><a href="https://resolvefacil-curriculos.netlify.app/curriculo-pago.html">Acessar Produto</a></p><p>Obrigado pela sua compra!</p>`
                    })
                });

                if (!brevoResponse.ok) {
                    const errorBody = await brevoResponse.text();
                    console.error(`Falha ao enviar e-mail pela Brevo: ${brevoResponse.status}`, errorBody);
                    throw new Error('Falha no envio do e-mail via Brevo.');
                }
                
                console.log(`E-mail de entrega enviado com sucesso para ${customerEmail}.`);

            } else {
                console.log(`Pagamento ${paymentId} não foi aprovado (status: ${payment.status}). Nenhuma ação necessária.`);
            }
        }
    } catch (error) {
        console.error('ERRO CRÍTICO NO PROCESSAMENTO DO WEBHOOK:', error);
    }
}

// --- FUNÇÃO PRINCIPAL (HANDLER) ---
// Esta é a função que o Mercado Pago chama. Ela é super rápida.
exports.handler = async function(event) {
    // 1. Inicia o trabalho pesado em segundo plano, MAS NÃO ESPERA ele terminar.
    // A função `processarNotificacao` começa a rodar, e o código continua imediatamente para a próxima linha.
    processarNotificacao(event);

    // 2. Retorna a resposta de sucesso IMEDIATAMENTE para o Mercado Pago.
    // Isso acontece em milissegundos, resolvendo nosso problema de timeout.
    return {
        statusCode: 200,
        body: 'Webhook recebido. Processamento em segundo plano iniciado.'
    };
};