// Arquivo: /netlify/functions/criar-pagamento.js (Versão de Teste 'Sala Branca')

exports.handler = async function(event) {
    // O único objetivo deste código é testar se a função está viva e logando.
    console.log("------------------------------------");
    console.log("INÍCIO DO TESTE 'SALA BRANCA'");
    console.log("FUNÇÃO 'criar-pagamento' FOI ACIONADA!");
    console.log("HORÁRIO DO TESTE:", new Date().toISOString());
    console.log("SE VOCÊ ESTÁ VENDO ISSO, A FUNÇÃO ESTÁ FUNCIONANDO.");
    console.log("FIM DO TESTE 'SALA BRANCA'");
    console.log("------------------------------------");

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*', // Totalmente aberto apenas para este teste
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "Teste 'Sala Branca' bem-sucedido! A função está viva e os logs funcionam." })
    };
};