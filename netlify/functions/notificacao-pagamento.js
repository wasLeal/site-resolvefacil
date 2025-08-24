// Importa as ferramentas necessárias para a função
const fetch = require('node-fetch');
const crypto = require('crypto');

// A função principal que a Netlify irá executar quando for chamada
exports.handler = async function(event) {
    console.log('--- INICIANDO EXECUÇÃO DA FUNÇÃO ---');

    // 1. Verificação de segurança inicial
    if (event.httpMethod !== 'POST') {
        console.log('Método não permitido. Encerrando.');
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log('Função recebida via POST. Verificando variáveis de ambiente...');
        
        // Verificação se as chaves existem no "cofre" da Netlify
        const brevoKeyExists = !!process.env.BREVO_API_KEY;
        const mpTokenExists = !!process.env.MERCADO_PAGO_ACCESS_TOKEN;
        const mpSecretExists = !!process.env.MERCADO_PAGO_WEBHOOK_SECRET;

        console.log(`Chave Brevo existe? ${brevoKeyExists}`);
        console.log(`Chave Access Token MP existe? ${mpTokenExists}`);
        console.log(`Chave Webhook Secret MP existe? ${mpSecretExists}`);

        if (!brevoKeyExists || !mpTokenExists || !mpSecretExists) {
            console.error('ERRO FATAL: Uma ou mais variáveis de ambiente estão faltando.');
            return { statusCode: 500, body: 'Missing environment variables.' };
        }

        console.log('Todas as chaves foram encontradas. Verificando assinatura do Webhook...');
        
        // 2. VERIFICAÇÃO DE ASSINATURA (A nossa "senha secreta" para evitar fraudes)
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const signature = event.headers['x-signature'];
        const requestId = event.headers['x-request-id'];
        const ts = event.headers['x-request-timestamp'];

        console.log('Cabeçalhos recebidos:', JSON.stringify(event.headers, null, 2));

        if (!signature) {
            console.warn('Cabeçalho x-signature está faltando. Rejeitando.');
            return { statusCode: 401, body: 'Signature missing.' };
        }

        const body = JSON.parse(event.body);
        console.log('Corpo da notificação recebida:', JSON.stringify(body, null, 2));
        
        const template = `id:${body.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
        const receivedHash = signature.split(',v1=')[1];

        if (hmac !== receivedHash) {
            console.warn('Assinatura inválida. A requisição pode ser uma fraude. Rejeitando.');
            return { statusCode: 401, body: 'Invalid signature.' };
        }
        
        console.log('Assinatura do Webhook verificada com sucesso!');

        // 3. PROCESSA A NOTIFICAÇÃO
        if (body.type === 'merchant_order') {
            const orderId = body.data.id;
            console.log(`Processando Pedido Comercial ID: ${orderId}`);

            // 4. PEDE OS DETALHES DA COMPRA AO MERCADO PAGO
            console.log('Buscando detalhes do pedido no Mercado Pago...');
            const mpResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
                }
            });

            if (!mpResponse.ok) {
                console.error('Falha ao buscar pedido no Mercado Pago:', mpResponse.status, mpResponse.statusText);
                throw new Error(`Failed to fetch Mercado Pago order: ${mpResponse.statusText}`);
            }

            const order = await mpResponse.json();
            console.log('Detalhes do pedido recebidos com sucesso. Status do pedido:', order.order_status);
            
            // 5. VERIFICA SE O PAGAMENTO FOI APROVADO
            if (order.status === 'closed' && order.order_status === 'paid') {
                console.log('Pedido PAGO. Preparando para enviar e-mail de entrega.');
                
                const customerEmail = order.payer.email;
                const customerName = order.payer.nickname || 'Cliente';
                const linkDoProduto = "https://resolvefacil-curriculos.netlify.app/curriculo-pago.html";

                console.log(`Enviando e-mail para: ${customerEmail}`);
                
                // 6. ENVIA O E-MAIL DE ENTREGA PELA BREVO
                const emailSubject = "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil";
                const senderEmail = "resolvefacil70@gmail.com";
                const senderName = "ResolveFácil";

                const emailHtmlContent = `...`; // (O conteúdo do e-mail é o mesmo da versão anterior)

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
                    throw new Error('Failed to send email via Brevo.');
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