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
                console.log('Pedido PAGO. Buscando detalhes do pagamento para encontrar o e-mail.');

                const paymentId = order.payments[0]?.id;
                if (!paymentId) throw new Error(`Nenhum ID de pagamento encontrado para o pedido ${orderId}`);
                
                const mpPaymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
                });

                if (!mpPaymentResponse.ok) throw new Error(`Falha ao buscar detalhes do pagamento no MP: ${mpPaymentResponse.statusText}`);

                const paymentDetails = await mpPaymentResponse.json();
                const customerEmail = paymentDetails.payer.email;
                
                // --- A "CÂMERA ESCONDIDA" ESTÁ AQUI ---
                console.log('--------------------------------------------------');
                console.log('--- DADO CRÍTICO PARA ANÁLISE ---');
                console.log('O e-mail exato recebido do Mercado Pago foi:', customerEmail);
                console.log('--- FIM DO DADO CRÍTICO ---');
                console.log('--------------------------------------------------');
                
                // O código de envio de e-mail foi intencionalmente desativado para este teste.
                console.log('Teste de diagnóstico concluído. O envio real do e-mail foi pulado.');

            } else {
                console.log(`Pedido ${orderId} ainda não foi pago (status: ${order.order_status}). Nenhuma ação necessária.`);
            }
        }

        return { statusCode: 200, body: 'Webhook diagnostic processed.' };

    } catch (error) {
        console.error('ERRO INESPERADO NA EXECUÇÃO DA FUNÇÃO:', error);
        return { statusCode: 500, body: 'Internal Server Error.' };
    }
};