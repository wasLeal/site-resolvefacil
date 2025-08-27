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
                const errorText = await paymentResponse.text();
                console.error("Erro ao buscar detalhes do pagamento:", errorText);
                throw new Error(`Falha ao buscar detalhes do pagamento ${paymentId}`);
            }
            
            const payment = await paymentResponse.json();
            console.log(`Status atual do pagamento: ${payment.status}`);

            // A LÓGICA VENCEDORA: SÓ AGE SE O PAGAMENTO ESTIVER APROVADO
            if (payment.status === 'approved') {
                const customerEmail = payment.payer.email;
                console.log(`PAGAMENTO APROVADO! E-mail do cliente: ${customerEmail}`);

                if (!customerEmail) {
                    throw new Error(`Pagamento ${paymentId} aprovado, mas sem e-mail do comprador.`);
                }
                
                console.log("Enviando e-mail de entrega pela Brevo...");
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
                
                console.log(`--- SUCESSO! E-mail de entrega enviado para ${customerEmail}. ---`);
            } else {
                console.log(`Pagamento ainda não foi aprovado. Nenhuma ação necessária por enquanto.`);
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