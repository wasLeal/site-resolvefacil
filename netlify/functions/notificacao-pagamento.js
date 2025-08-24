// Importa as ferramentas necessárias para a função
const fetch = require('node-fetch');
const crypto = require('crypto');

// A função principal que a Netlify irá executar quando for chamada
exports.handler = async function(event) {
    // 1. Verificação de segurança: só aceitamos o método POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. VERIFICAÇÃO DE ASSINATURA (A nossa "senha secreta" para evitar fraudes)
        // Pega os segredos do "cofre" da Netlify (Environment Variables)
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        
        // Pega os dados de segurança que o Mercado Pago envia junto com a notificação
        const signature = event.headers['x-signature'];
        const requestId = event.headers['x-request-id'];
        const ts = event.headers['x-request-timestamp'];

        if (!signature || !secret) {
            console.warn('Webhook signature or secret is missing.');
            return { statusCode: 401, body: 'Invalid signature.' };
        }

        const body = JSON.parse(event.body);
        
        // Cria uma assinatura local usando o segredo para comparar com a que recebemos
        const template = `id:${body.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
        const receivedHash = signature.split(',v1=')[1];

        // Se as assinaturas não baterem, é uma requisição inválida. Paramos aqui.
        if (hmac !== receivedHash) {
            console.warn('Invalid webhook signature. Request rejected.');
            return { statusCode: 401, body: 'Invalid signature.' };
        }
        
        console.log('Webhook signature verified successfully.');

        // 3. PROCESSA A NOTIFICAÇÃO
        // Só agimos se for uma notificação de "Pedido Comercial"
        if (body.type === 'merchant_order') {
            const orderId = body.data.id;
            console.log(`Processing Merchant Order ID: ${orderId}`);

            // 4. PEDE OS DETALHES COMPLETOS DA COMPRA AO MERCADO PAGO
            const mpResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
                }
            });

            if (!mpResponse.ok) {
                throw new Error(`Failed to fetch Mercado Pago order: ${mpResponse.statusText}`);
            }

            const order = await mpResponse.json();
            
            // 5. VERIFICA SE O PAGAMENTO FOI APROVADO
            if (order.status === 'closed' && order.order_status === 'paid') {
                console.log('Order status is paid. Preparing to send email.');
                
                const customerEmail = order.payer.email;
                const customerName = order.payer.nickname || 'Cliente';
                const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";

                // 6. ENVIA O E-MAIL DE ENTREGA PELA BREVO
                const emailSubject = "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil";
                const senderEmail = "resolvefacil70@gmail.com";
                const senderName = "ResolveFácil";

                const emailHtmlContent = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #003459;">Olá, ${customerName}!</h2>
                        <p>Muito obrigado por sua compra na ResolveFácil!</p>
                        <p>Seu pagamento foi confirmado com sucesso e seu acesso ao <strong>Gerador de Currículo Profissional</strong> já está liberado.</p>
                        <p>Para começar a criar seu currículo agora mesmo, clique no botão abaixo:</p>
                        <p style="text-align: center; margin: 25px 0;">
                            <a href="${linkDoProduto}" style="background-color: #003459; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                ACESSAR MEU PRODUTO
                            </a>
                        </p>
                        <p>Qualquer dúvida, basta responder a este e-mail.</p>
                        <p>Atenciosamente,<br>Equipe ResolveFácil</p>
                    </div>
                `;

                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: senderName, email: senderEmail },
                        to: [{ email: customerEmail, name: customerName }],
                        subject: emailSubject,
                        htmlContent: emailHtmlContent
                    })
                });

                if (!brevoResponse.ok) {
                    const errorBody = await brevoResponse.text();
                    console.error(`Failed to send email via Brevo: ${brevoResponse.statusText}`, errorBody);
                    throw new Error('Failed to send email via Brevo.');
                }

                console.log(`Delivery email sent successfully to ${customerEmail}.`);
            } else {
                console.log(`Order ${orderId} is not yet paid (status: ${order.order_status}). No action taken.`);
            }
        }

        // Responde ao Mercado Pago que recebemos a notificação com sucesso.
        return { statusCode: 200, body: 'Webhook processed.' };

    } catch (error) {
        console.error('Error processing webhook:', error);
        return { statusCode: 500, body: 'Internal Server Error.' };
    }
};