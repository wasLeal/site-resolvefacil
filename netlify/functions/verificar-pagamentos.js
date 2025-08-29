const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    console.log("--- GUARDIÃO INICIADO --- Buscando pagamentos aprovados recentes...");

    try {
        // Busca pagamentos criados nos últimos 10 minutos
        const date = new Date();
        date.setMinutes(date.getMinutes() - 10);
        const searchDate = date.toISOString();

        const searchResponse = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&begin_date=${searchDate}`, {
            headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
        });

        if (!searchResponse.ok) {
            throw new Error("Falha ao buscar pagamentos no Mercado Pago.");
        }

        const searchResult = await searchResponse.json();
        const pagamentos = searchResult.results || [];

        console.log(`Encontrados ${pagamentos.length} pagamentos recentes.`);

        // Filtra apenas os pagamentos aprovados
        const pagamentosAprovados = pagamentos.filter(p => p.status === 'approved');

        if (pagamentosAprovados.length === 0) {
            console.log("Nenhum pagamento novo aprovado encontrado. Encerrando.");
            return { statusCode: 200, body: "Nenhum pagamento novo." };
        }

        for (const pagamento of pagamentosAprovados) {
            const paymentId = pagamento.id;
            const customerEmail = pagamento.payer.email;
            
            console.log(`Processando pagamento APROVADO ID: ${paymentId} para o e-mail: ${customerEmail}`);
            
            // Lógica de envio para Brevo (exatamente a mesma que já funciona)
            await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: { name: "ResolveFácil", email: "resolvefacil70@gmail.com" },
                    to: [{ email: customerEmail }],
                    subject: "Seu Acesso ao Gerador de Currículo Profissional | ResolveFácil",
                    htmlContent: `<p>Olá! Seu pagamento foi aprovado com sucesso.</p><p>Clique no link abaixo para acessar seu Gerador de Currículo Profissional:</p><p><a href="https://resolvefacil-curriculos.netlify.app/curriculo-pago.html">Acessar Produto</a></p><p>Obrigado pela sua compra!</p>`
                })
            });

            console.log(`E-mail de entrega enviado para ${customerEmail}.`);
        }

        return { statusCode: 200, body: "Processamento do Guardião concluído." };

    } catch (error) {
        console.error("ERRO CRÍTICO NO GUARDIÃO:", error);
        return { statusCode: 500, body: "Erro no Guardião." };
    }
};