// netlify/functions/notificacao-pagamento.js

exports.handler = async function(event, context) {
  // 1. Verifica se a requisição é um POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // 2. Pega os dados que o Mercado Pago enviou
    const data = JSON.parse(event.body);

    // 3. Imprime os dados no log da nossa função Netlify
    // (Isso é para a gente poder ver o que recebemos)
    console.log('Notificação do Mercado Pago recebida:');
    console.log(JSON.stringify(data, null, 2));

    // 4. Responde para o Mercado Pago que recebemos com sucesso
    // (Isso é MUITO importante para que eles não fiquem tentando enviar de novo)
    return {
      statusCode: 200,
      body: 'Notificação recebida com sucesso.',
    };

  } catch (error) {
    // Se algo der errado, avisa no log e retorna um erro
    console.error('Erro ao processar notificação:', error);
    return {
      statusCode: 500,
      body: 'Erro interno no servidor.',
    };
  }
};