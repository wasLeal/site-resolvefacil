// Importa as ferramentas necessárias
const fetch = require('node-fetch');
const crypto = require('crypto');

// --- FUNÇÃO DE PROCESSAMENTO PESADO ---
// Esta função faz todo o trabalho de verificar o pagamento e enviar o e-mail.
// Ela será chamada em segundo plano, DEPOIS que já respondemos ao Mercado Pago.
async function processarPagamento(body, headers) {
    console.log("Iniciando processamento assíncrono do pagamento...");

    try {
        // 1. Validação da Assinatura (Segurança em primeiro lugar)
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const signatureHeader = headers['x-signature'];
        const signatureParts = signatureHeader.split(',');
        const tsPart = signatureParts.find(part => part.trim().startsWith('ts='));
        const hashPart = signatureParts.find(part => part.trim().startsWith('v1='));
        
        if (!tsPart || !hashPart) {
            console.error("Assinatura inválida no processamento assíncrono.");
            return; // Encerra se a assinatura for inválida
        }

        const ts = tsPart.split('=')[1];
        const receivedHash = hashPart.split('=')[1];
        const manifest = `id:${body.id};request-id:${headers['x-request-id']};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const expectedHash = hmac.digest('hex');

        if (receivedHash !== expectedHash) {
            console.error("Falha na verificação da assinatura no processamento assíncrono.");
            return; // Encerra se a assinatura não bater
        }
        console.log("Assinatura verificada com sucesso no processamento assíncrono.");

        // 2. Processa apenas se for um Pedido Comercial
        if (body.topic === 'merchant_order') {
            const orderId = body.id;
            console.log(`Processando Pedido Comercial ID: ${orderId}`);

            // 3. Busca os Detalhes do Pedido na API do Mercado Pago
            const orderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!orderResponse.ok) {
                throw new Error(`Falha ao buscar detalhes do pedido ${orderId}`);
            }

            const order = await orderResponse.json();

            // 4. Verifica se o Pedido está PAGO
            if (order.order_status === 'paid') {
                console.log(`Pedido PAGO. Buscando detalhes do pagamento para encontrar o e-mail.`);
                
                // Pega o ID do pagamento mais recente e aprovado
                const paymentInfo = order.payments.find(p => p.status === 'approved');
                if (!paymentInfo) {
                    console.log(`Pedido ${orderId} pago, mas nenhum pagamento aprovado encontrado. Ação adiada.`);
                    return;
                }
                const paymentId = paymentInfo.id;
                
                // 5. Busca os Detalhes do Pagamento para pegar o e-mail REAL
                const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
                });

                if (!paymentResponse.ok) {
                    throw new Error(`Falha ao buscar detalhes do pagamento ${paymentId}`);
                }
                const payment = await paymentResponse.json();

                const customerEmail = payment.payer.email;
                const customerName = payment.payer.first_name || 'Cliente';
                
                // 6. Envia o E-mail de Entrega via Brevo
                const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";
                const emailSubject = "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil";
                const senderEmail = "resolvefacil70@gmail.com";
                const senderName = "ResolveFácil";

                // ... (código do corpo do e-mail permanece o mesmo) ...

                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: senderName, email: senderEmail },
                        to: [{ email: customerEmail, name: customerName }],
                        subject: emailSubject,
                        htmlContent: `...` // Corpo do e-mail aqui
                    })
                });

                if (!brevoResponse.ok) {
                    const errorBody = await brevoResponse.text();
                    console.error(`Falha ao enviar e-mail pela Brevo: ${brevoResponse.statusText}`, errorBody);
                } else {
                    console.log(`E-mail de entrega enviado com sucesso para ${customerEmail}.`);
                }

            } else {
                console.log(`Pedido ${orderId} ainda não foi pago (status: ${order.order_status}). Nenhuma ação necessária.`);
            }
        }
    } catch (error) {
        console.error('ERRO INESPERADO NO PROCESSAMENTO ASSÍNCRONO:', error);
    }
}


// --- FUNÇÃO PRINCIPAL (HANDLER) ---
// Esta é a função que recebe o webhook. Ela é rápida e leve.
exports.handler = async function(event) {
    // 1. Responde Imediatamente para o Mercado Pago
    // Este é o passo mais importante. Garantimos que o Mercado Pago receba "OK" em menos de 1 segundo.
    Promise.resolve().then(() => {
        const body = JSON.parse(event.body);
        processarPagamento(body, event.headers);
    });

    // 2. Retorna a resposta de sucesso
    return {
        statusCode: 200,
        body: 'Webhook recebido. Processamento iniciado em segundo plano.'
    };
};