// Importa as ferramentas necessárias para a função
const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const signatureHeader = event.headers['x-signature'];
        const requestId = event.headers['x-request-id'];

        if (!process.env.BREVO_API_KEY || !process.env.MERCADO_PAGO_ACCESS_TOKEN || !secret || !signatureHeader) {
            console.error('Configuração faltando: Chaves de API ou cabeçalho de assinatura ausentes.');
            return { statusCode: 500, body: 'Configuration error.' };
        }

        const signatureParts = signatureHeader.split(',');
        const tsPart = signatureParts.find(part => part.trim().startsWith('ts='));
        const hashPart = signatureParts.find(part => part.trim().startsWith('v1='));

        if (!tsPart || !hashPart) {
            return { statusCode: 401, body: 'Invalid signature format.' };
        }
        
        const ts = tsPart.split('=')[1];
        const receivedHash = hashPart.split('=')[1];
        const body = JSON.parse(event.body);
        
        const template = `id:${body.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
        
        if (hmac !== receivedHash) {
            console.warn('Assinatura inválida. Rejeitando.');
            return { statusCode: 401, body: 'Invalid signature.' };
        }
        
        console.log('Assinatura do Webhook verificada com sucesso!');

        if (body.type && body.type.includes('merchant_order')) {
            const orderId = body.id;
            console.log(`Processando Pedido Comercial ID: ${orderId}`);

            const mpOrderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!mpOrderResponse.ok) throw new Error(`Falha ao buscar pedido no MP: ${mpOrderResponse.statusText}`);
            
            const order = await mpOrderResponse.json();
            console.log('Detalhes do pedido recebidos. Status:', order.order_status);
            
            if (order.status === 'closed' && order.order_status === 'paid') {
                console.log('Pedido PAGO. Buscando detalhes do pagamento para encontrar o e-mail do cliente.');

                const paymentId = order.payments[0]?.id;
                if (!paymentId) throw new Error(`Nenhum ID de pagamento encontrado para o pedido ${orderId}`);
                
                const mpPaymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
                });

                if (!mpPaymentResponse.ok) throw new Error(`Falha ao buscar detalhes do pagamento no MP: ${mpPaymentResponse.statusText}`);

                const paymentDetails = await mpPaymentResponse.json();
                const rawEmailFromPayer = paymentDetails.payer.email;
                
                if (!rawEmailFromPayer) throw new Error(`E-mail do cliente não encontrado para o pagamento ${paymentId}`);

                // --- LÓGICA DO TESTE DE RELATÓRIO ---
                // Em vez de enviar para o cliente, enviamos um relatório para você.
                const seuEmail = "resolvefacil70@gmail.com";
                const relatorioSubject = "Relatório de Webhook - Pagamento Recebido";
                const relatorioHtmlContent = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Relatório de Teste de Webhook - ResolveFácil</h2>
                        <p>Olá, Washington!</p>
                        <p>Uma notificação de pagamento para o pedido <strong>${orderId}</strong> foi recebida e processada com sucesso.</p>
                        <p>O objetivo deste teste era capturar o e-mail exato que o Mercado Pago nos forneceu para o comprador.</p>
                        <hr>
                        <p><strong>E-mail do comprador (exatamente como foi recebido):</strong></p>
                        <pre style="background-color:#f4f4f4; padding: 10px; border-radius: 4px; font-family: monospace;">${rawEmailFromPayer}</pre>
                        <hr>
                        <p>Com esta informação, poderemos fazer o ajuste final no código de produção.</p>
                    </div>
                `;

                console.log(`Enviando e-mail de relatório para: ${seuEmail}`);
                
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: "Sistema ResolveFácil", email: "resolvefacil70@gmail.com" },
                        to: [{ email: seuEmail, name: "Washington Leal" }],
                        subject: relatorioSubject,
                        htmlContent: relatorioHtmlContent
                    })
                });

                if (!brevoResponse.ok) {
                    const errorBody = await brevoResponse.text();
                    console.error(`Falha ao enviar e-mail de RELATÓRIO pela Brevo: ${brevoResponse.statusText}`, errorBody);
                    throw new Error('Falha ao enviar e-mail de RELATÓRIO via Brevo.');
                }
                console.log(`E-mail de RELATÓRIO enviado com sucesso para ${seuEmail}.`);
            } else {
                console.log(`Pedido ${orderId} ainda não foi pago (status: ${order.order_status}). Nenhuma ação necessária.`);
            }
        }
        return { statusCode: 200, body: 'Webhook processed.' };
    } catch (error) {
        console.error('ERRO INESPERADO NA EXECUÇÃO DA FUNÇÃO:', error);
        return { statusCode: 500, body: 'Internal Server Error.' };
    }
};