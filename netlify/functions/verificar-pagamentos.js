// Arquivo: netlify/functions/verificar-pagamentos.js (VERSÃO DEFINITIVA CORRIGIDA)

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO INICIADO (Versão Final) ---");

    try {
        // Busca pagamentos APROVADOS criados nos últimos 15 minutos.
        const date = new Date();
        date.setMinutes(date.getMinutes() - 15);
        const searchDate = date.toISOString();

        const searchResponse = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&status=approved&begin_date=${searchDate}`, {
            headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
        });

        if (!searchResponse.ok) {
            console.error("Erro ao buscar pagamentos no MP:", await searchResponse.text());
            throw new Error("Falha ao buscar pagamentos no Mercado Pago.");
        }

        const searchResult = await searchResponse.json();
        const pagamentosAprovados = searchResult.results || [];

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo aprovado encontrado. Encerrando.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        console.log(`Encontrados ${pagamentosAprovados.length} pagamentos aprovados para processar.`);
        
        // ATENÇÃO: Esta versão ainda pode reenviar e-mails para pagamentos já processados.
        // A solução ideal no futuro é usar uma planilha para marcar os IDs já enviados.

        for (const pagamento of pagamentosAprovados) {
            const paymentId = pagamento.id;
            const customerEmail = pagamento.payer.email;
            
            if (!customerEmail) {
                console.warn(`Pagamento ${paymentId} aprovado, mas sem e-mail do cliente. Pulando.`);
                continue;
            }

            console.log(`Processando ID: ${paymentId} para o e-mail: ${customerEmail}`);
            
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

        return { statusCode: 200, body: "Processamento do Guardião concluído. Verifique os logs para detalhes." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO:", error);
        return { statusCode: 500, body: "Erro no Guardião. Verifique os logs." };
    }
};