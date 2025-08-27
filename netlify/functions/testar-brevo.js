// Arquivo: /netlify/functions/testar-brevo.js

exports.handler = async function(event, context) {
    console.log("--- INICIANDO TESTE ISOLADO DA BREVO ---");

    try {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            const errorMsg = "ERRO GRAVE: A variável de ambiente BREVO_API_KEY não foi encontrada!";
            console.error(errorMsg);
            return { statusCode: 500, body: errorMsg };
        }
        console.log("Variável BREVO_API_KEY encontrada.");

        // E-mail de destino para o teste, conforme solicitado.
        const emailDeTeste = "martinspedronon@gmail.com"; 

        const brevoPayload = {
            sender: { name: "Teste ResolveFácil", email: "resolvefacil70@gmail.com" },
            to: [{ email: emailDeTeste }],
            subject: "Teste de Conexão Direta - ResolveFácil",
            htmlContent: "<p>Este é um teste para verificar se a função Netlify consegue se comunicar com a Brevo.</p>"
        };

        console.log("Enviando payload para Brevo:", JSON.stringify(brevoPayload, null, 2));

        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(brevoPayload)
        });

        console.log("Brevo respondeu com status:", brevoResponse.status);
        const responseBody = await brevoResponse.text();
        console.log("Corpo da resposta da Brevo:", responseBody);

        if (!brevoResponse.ok) {
            throw new Error(`Brevo retornou um erro: ${responseBody}`);
        }

        console.log("--- TESTE BEM-SUCEDIDO ---");
        return {
            statusCode: 200,
            body: `Teste concluído com sucesso! Resposta da Brevo: ${responseBody}`
        };

    } catch (error) {
        console.error("ERRO CRÍTICO NO TESTE DA BREVO:", error);
        return {
            statusCode: 500,
            body: `Ocorreu um erro: ${error.message}`
        };
    }
};