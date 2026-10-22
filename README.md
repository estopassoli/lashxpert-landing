# Formação LashXpert

Landing page responsiva da Formação LashXpert, com inscrição pelo WhatsApp.

## Visualização local

```sh
python3 -m http.server 3003
```

Abra http://localhost:3003.

## Publicação

Site estático. Em produção roda no cluster (Dokploy) pelo `Dockerfile`: nginx servindo esta pasta, com as fotos de `media/` reduzidas para web no build. Push na `main` publica.

Os dois botões de inscrição direcionam para o WhatsApp configurado no HTML. Os resultados incorporados dependem da disponibilidade do Instagram.

A integração anterior de CRM e suas credenciais não fazem parte deste repositório.
