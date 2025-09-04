// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO FINAL PARA ASAAS)

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO ASAAS INICIADO ---");

    try {
        const searchResponse = await fetch(`https://sandbox.asaas.com/api/v3/payments?status=RECEIVED`, {
            headers: { 
                'access_token': process.env.ASAAS_API_KEY
            }
        });

        if (!searchResponse.ok) {
            console.error("Erro ao buscar pagamentos na Asaas:", await searchResponse.text());
            throw new Error("Falha ao buscar pagamentos na Asaas.");
        }

        const searchResult = await searchResponse.json();
        const pagamentosAprovados = searchResult.data || [];

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo aprovado encontrado. Encerrando.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos aprovados para processar.`);

        for (const pagamento of pagamentosAprovados) {
            const paymentId = pagamento.id;
            const customerId = pagamento.customer;
            
            const customerResponse = await fetch(`https://sandbox.asaas.com/api/v3/customers/${customerId}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });

            if (!customerResponse.ok) {
                console.warn(`Não foi possível buscar os dados do cliente para o pagamento ${paymentId}. Pulando.`);
                continue;
            }

            const cliente = await customerResponse.json();
            const customerEmail = cliente.email;
            
            if (!customerEmail) {
                console.warn(`Pagamento ${paymentId} aprovado, mas sem e-mail do cliente. Pulando.`);
                continue;
            }

            console.log(`Processando Pagamento Asaas ID: ${paymentId} para o e-mail: ${customerEmail}`);
            
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
                console.error(`A Brevo REJEITOU o envio para ${customerEmail}. Status: ${brevoResponse.status}`, errorBody);
            } else {
                console.log(`--- SUCESSO! E-mail de entrega para ${customerEmail} enviado pela Brevo. ---`);
            }
        }

        return { statusCode: 200, body: "Processamento do Guardião Asaas concluído." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO ASAAS:", error);
        return { statusCode: 500, body: "Erro no Guardião Asaas." };
    }
};