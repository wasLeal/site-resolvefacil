// Importa as ferramentas necessárias para a função
const fetch = require('node-fetch');
const crypto = require('crypto');

// A função principal que a Netlify irá executar quando for chamada
exports.handler = async function(event) {
    console.log('--- INICIANDO EXECUÇÃO DA FUNÇÃO ---');

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log('Verificando variáveis de ambiente...');
        if (!process.env.BREVO_API_KEY || !process.env.MERCADO_PAGO_ACCESS_TOKEN || !process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
            console.error('ERRO FATAL: Uma ou mais variáveis de ambiente estão faltando.');
            return { statusCode: 500, body: 'Missing environment variables.' };
        }
        console.log('Variáveis de ambiente OK. Verificando assinatura do Webhook...');
        
        // --- VERIFICAÇÃO DE ASSINATURA CORRIGIDA ---
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const signatureHeader = event.headers['x-signature'];
        const requestId = event.headers['x-request-id'];

        if (!signatureHeader) {
            console.warn('Cabeçalho x-signature está faltando.');
            return { statusCode: 401, body: 'Signature missing.' };
        }

        // CORREÇÃO: Extrai o timestamp (ts) e o hash (v1) do cabeçalho
        const signatureParts = signatureHeader.split(',');
        const tsPart = signatureParts.find(part => part.trim().startsWith('ts='));
        const hashPart = signatureParts.find(part => part.trim().startsWith('v1='));

        if (!tsPart || !hashPart) {
            console.warn('Formato da assinatura inválido.');
            return { statusCode: 401, body: 'Invalid signature format.' };
        }
        
        const ts = tsPart.split('=')[1];
        const receivedHash = hashPart.split('=')[1];
        const body = JSON.parse(event.body);
        
        console.log('Corpo da notificação recebida:', JSON.stringify(body, null, 2));

        const template = `id:${body.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
        
        if (hmac !== receivedHash) {
            console.warn('Assinatura inválida. A requisição pode ser uma fraude. Rejeitando.');
            return { statusCode: 401, body: 'Invalid signature.' };
        }
        
        console.log('Assinatura do Webhook verificada com sucesso!');

        // --- PROCESSAMENTO DA NOTIFICAÇÃO (sem alterações) ---
        if (body.type === 'merchant_order') {
            const orderId = body.data.id;
            console.log(`Processando Pedido Comercial ID: ${orderId}`);

            const mpResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
            });

            if (!mpResponse.ok) throw new Error(`Falha ao buscar pedido no MP: ${mpResponse.statusText}`);
            
            const order = await mpResponse.json();
            console.log('Detalhes do pedido recebidos. Status:', order.order_status);
            
            if (order.status === 'closed' && order.order_status === 'paid') {
                console.log('Pedido PAGO. Preparando para enviar e-mail.');
                
                const customerEmail = order.payer.email;
                const customerName = order.payer.nickname || 'Cliente';
                const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";
                const emailSubject = "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil";
                const senderEmail = "resolvefacil70@gmail.com";
                const senderName = "ResolveFácil";

                const emailHtmlContent = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #003459;">Olá, ${customerName}!</h2>
                        <p>Muito obrigado por sua compra na ResolveFácil!</p>
                        <p>Seu pagamento foi confirmado com sucesso e seu acesso ao <strong>Gerador de Currículo Profissional</strong> já está liberado.</p>
                        <p style="text-align: center; margin: 25px 0;">
                            <a href="${linkDoProduto}" style="background-color: #003459; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">ACESSAR MEU PRODUTO</a>
                        </p>
                        <p>Qualquer dúvida, basta responder a este e-mail.</p>
                        <p>Atenciosamente,<br>Equipe ResolveFácil</p>
                    </div>`;

                console.log(`Enviando e-mail para: ${customerEmail}`);
                
                const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: { name: senderName, email: senderEmail },
                        to: [{ email: customerEmail, name: customerName }],
                        subject: emailSubject,
                        htmlContent: emailHtmlContent
                    })
                });

                if (!brevoResponse.ok) {
                    const errorBody = await brevoResponse.text();
                    console.error(`Falha ao enviar e-mail pela Brevo: ${brevoResponse.statusText}`, errorBody);
                    throw new Error('Falha ao enviar e-mail via Brevo.');
                }
                console.log(`E-mail de entrega enviado com sucesso para ${customerEmail}.`);
            } else {
                console.log(`Pedido ${orderId} ainda não foi pago (status: ${order.order_status}). Nenhuma ação necessária.`);
            }
        }

        console.log('--- EXECUÇÃO DA FUNÇÃO CONCLUÍDA COM SUCESSO ---');
        return { statusCode: 200, body: 'Webhook processed.' };

    } catch (error) {
        console.error('--- ERRO INESPERADO NA EXECUÇÃO DA FUNÇÃO ---:', error);
        return { statusCode: 500, body: 'Internal Server Error.' };
    }
};