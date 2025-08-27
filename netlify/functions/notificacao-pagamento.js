// Arquivo: /netlify/functions/notificacao-pagamento.js
// Local: Projeto "resolvefacil-curriculos"

const fetch = require('node-fetch');
const crypto = require('crypto');

// --- FUNÇÃO DE PROCESSAMENTO PESADO ---
async function processarNotificacao(event) {
    const body = JSON.parse(event.body);
    console.log("Iniciando processamento em segundo plano para o webhook...");

    try {
        // Validação da assinatura (não incluída aqui para simplificar, mas importante em produção)
        console.log("Webhook recebido, tipo:", body.type);

        // --- CORREÇÃO IMPORTANTE: Agora escutamos o 'merchant_order' ---
        if (body.type === 'merchant_order') {
            const orderId = body.data.id;
            console.log(`Evento 'merchant_order' recebido. Processando Pedido ID: ${orderId}`);

            // 1. Busca os Detalhes do Pedido na API do Mercado Pago
            const orderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!orderResponse.ok) {
                throw new Error(`Falha ao buscar detalhes do pedido ${orderId}`);
            }
            const order = await orderResponse.json();

            // 2. Verifica se o Pedido está PAGO e FECHADO
            if (order.status === 'closed' && order.order_status === 'paid') {
                console.log(`Pedido PAGO. Buscando detalhes do pagamento para encontrar o e-mail.`);
                
                // Pega o ID do pagamento mais recente e aprovado
                const paymentInfo = order.payments.find(p => p.status === 'approved');
                if (!paymentInfo) {
                    throw new Error(`Pedido ${orderId} pago, mas nenhum pagamento aprovado encontrado.`);
                }
                const paymentId = paymentInfo.id;
                
                // 3. Busca os Detalhes do Pagamento para pegar o e-mail REAL
                const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
                });

                if (!paymentResponse.ok) {
                    throw new Error(`Falha ao buscar detalhes do pagamento ${paymentId}`);
                }
                const payment = await paymentResponse.json();

                const customerEmail = payment.payer.email;
                if (!customerEmail) {
                    throw new Error(`Pagamento ${paymentId} aprovado, mas sem e-mail do comprador.`);
                }
                
                // 4. Envia o E-mail de Entrega via Brevo
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
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
                console.log(`Pedido ${orderId} ainda não foi pago (status: ${order.order_status}). Nenhuma ação necessária.`);
            }
        } else {
            console.log(`Webhook de tipo '${body.type}' recebido e ignorado.`);
        }
    } catch (error) {
        console.error('ERRO CRÍTICO NO PROCESSAMENTO DO WEBHOOK:', error);
    }
}

// --- FUNÇÃO PRINCIPAL (HANDLER) ---
exports.handler = async function(event) {
    processarNotificacao(event);
    return {
        statusCode: 200,
        body: 'Webhook recebido. Processamento em segundo plano iniciado.'
    };
};