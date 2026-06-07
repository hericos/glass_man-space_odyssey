Ao iniciar o jogo, obtenha o nome do jogador e cadastre no endpoint:
POST https://n8n.grupodailydeals.tech/webhook-test/novo-jogador
{ "name": "JOGADOR" }
no retorno, guarde o "id"

No fim do jogo envie a pontuação do jogador para o endpoint:
POST https://n8n.grupodailydeals.tech/webhook/salvar-pontuacao
{ "name": "JOGADOR", "userId": "ID", "points": PONTUACAO }

Depois disso mostre o ranking dos TOP 10 consultando o endpoint:
GET https://n8n.grupodailydeals.tech/webhook/ranking
a resposta virá no padrão de lista com os campos (necessários):
{ "points": "PONTUACAO", "userId": "ID", "name": "JOGADOR"	}

liste na tela, na ordem decrescente.
