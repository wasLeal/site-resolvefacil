// Arquivo: /netlify/functions/notificacao-pagamento.js (VERSÃO DE DIAGNÓSTICO)
const fetch = require('node-fetch');

async function processarDiagnostico(event) {
    console.log("--- INÍCIO DA EXECUÇÃO DA FUNÇÃO DE DIAGNÓSTICO ---");
    
    try {
        const body = JSON.parse(event.body);
        console.log("1. CORPO DO WEBHOOK RECEBIDO:", JSON.stringify(body, null, 2));

        const tipoEvento = body.type;
        console.log("2. TIPO DE EVENTO IDENTIFICADO:", tipoEvento);

        let paymentId = null;

        if (tipoEvento === 'payment') {
            paymentId = body.data.id;
            console.log("3. Evento 'payment' detectado. ID do Pagamento extraído diretamente:", paymentId);
        } else if (tipoEvento === 'merchant_order') {
            const orderId = body.data.id;
            console.log("3. Evento 'merchant_order' detectado. ID do Pedido:", orderId);
            console.log("4. Buscando detalhes do Pedido no Mercado Pago...");

            const orderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });
            const order = await orderResponse.json();
            console.log("5. Resposta do Pedido recebida:", JSON.stringify(order, null, 2));

            if (order.payments && order.payments.length > 0) {
                const paymentInfo = order.payments.find(p => p.status === 'approved');
                if (paymentInfo) {
                    paymentId = paymentInfo.id;
                    console.log("6. ID do Pagamento encontrado dentro do Pedido:", paymentId);
                } else {
                    console.log("6. Pedido encontrado, mas nenhum pagamento APROVADO associado.");
                }
            } else {
                console.log("6. Pedido encontrado, mas sem array de pagamentos.");
            }
        }

        if (paymentId) {
            console.log("7. Buscando detalhes completos do Pagamento ID:", paymentId);
            const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });
            const payment = await paymentResponse.json();
            console.log("8. Resposta do Pagamento recebida:", JSON.stringify(payment, null, 2));

            const status = payment.status;
            const customerEmail = payment.payer ? payment.payer.email : "N/A";
            
            console.log("--- RESULTADOS FINAIS DO DIAGNÓSTICO ---");
            console.log("Status do Pagamento:", status);
            console.log("E-mail do Comprador Encontrado:", customerEmail);
            console.log("------------------------------------------");

            if (status === 'approved' && customerEmail !== "N/A") {
                console.log("DIAGNÓSTICO: Sucesso! O e-mail foi encontrado e o pagamento está aprovado. O envio real pela Brevo está desativado nesta versão.");
            } else {
                console.log("DIAGNÓSTICO: Falha! Não foi possível obter todos os dados necessários.");
            }
        } else {
            console.log("7. Nenhum ID de pagamento processável foi encontrado. Fim do diagnóstico para este evento.");
        }

    } catch (error) {
        console.error('ERRO CRÍTICO DURANTE O DIAGNÓSTICO:', error);
    } finally {
        console.log("--- FIM DA EXECUÇÃO DA FUNÇÃO DE DIAGNÓSTICO ---");
    }
}

exports.handler = async function(event) {
    processarDiagnostico(event);
    return {
        statusCode: 200,
        body: 'Webhook de diagnóstico recebido.'
    };
};