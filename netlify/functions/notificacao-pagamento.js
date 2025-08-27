const fetch = require('node-fetch');

async function processarPagamento(event) {
    console.log("--- INICIANDO PROCESSAMENTO DE NOTIFICAÇÃO ---");
    
    try {
        const body = JSON.parse(event.body);

        if (body.type === 'payment') {
            const paymentId = body.data.id;
            console.log(`Evento 'payment' recebido. Verificando status do Pagamento ID: ${paymentId}`);

            const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!paymentResponse.ok) {
                throw new Error(`Falha ao buscar detalhes do pagamento ${paymentId}`);
            }
            
            const payment = await paymentResponse.json();
            console.log(`Status atual do pagamento: ${payment.status}`);

            if (payment.status === 'approved') {
                const customerEmail = payment.payer.email;
                console.log(`PAGAMENTO APROVADO! E-mail do cliente: ${customerEmail}`);

                if (!customerEmail) {
                    throw new Error(`Pagamento ${paymentId} aprovado, mas sem e-mail do comprador.`);
                }
                
                const brevoPayload = {
                    sender: { name: "ResolveFácil", email: "resolvefacil70@gmail.com" },
                    to: [{ email: customerEmail }],
                    subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                    htmlContent: `<p>Olá! Seu pagamento foi aprovado com sucesso.</p><p>Clique no link abaixo para acessar seu Gerador de Currículo Profissional:</p><p><a href="https://resolvefacil-curriculos.netlify.app/curriculo-pago.html">Acessar Produto</a></p><p>Obrigado pela sua compra!</p>`
                };

                // --- DIAGNÓSTICO AVANÇADO BREVO ---
                console.log("1. Preparando para enviar para a Brevo. Corpo da requisição:", JSON.stringify(brevoPayload, null, 2));
                
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify(brevoPayload)
                });

                console.log("2. Brevo respondeu com status:", brevoResponse.status);
                const responseBody = await brevoResponse.text();
                console.log("3. Corpo da resposta da Brevo:", responseBody);
                // --- FIM DO DIAGNÓSTICO AVANÇADO ---

                if (!brevoResponse.ok) {
                    throw new Error('Falha no envio do e-mail via Brevo. Veja o log acima para detalhes.');
                }
                
                console.log(`--- SUCESSO! E-mail de entrega enviado para ${customerEmail}. ---`);
            } else {
                console.log(`Pagamento ainda não foi aprovado. Status atual: ${payment.status}.`);
            }
        } else {
            console.log(`Webhook de tipo '${body.type}' ignorado.`);
        }
    } catch (error) {
        console.error('ERRO CRÍTICO NO PROCESSAMENTO:', error);
    } finally {
        console.log("--- FIM DO PROCESSAMENTO ---");
    }
}

exports.handler = async function(event) {
    processarPagamento(event);
    return {
        statusCode: 200,
        body: 'Webhook recebido.'
    };
};