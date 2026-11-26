# Formação LashXpert

Landing page responsiva da Formação LashXpert, com oito trilhas de conhecimento, suporte individual, benefícios da formação e opções de pagamento.

## Visualização local

```sh
python3 -m http.server 3003
```

Abra http://localhost:3003.

## Publicação

Site estático. Em produção roda no cluster (Dokploy) pelo `Dockerfile`: nginx servindo esta pasta, com as fotos de `media/` reduzidas para web no build. Push na `main` publica.

O botão “Quero entrar para a formação” leva à seção de benefícios. A opção de Pix parcelado abre o checkout configurado no HTML; o botão do cartão permanece desabilitado até a configuração de seu checkout.

O design atual usa `refined.css`, e os carrosséis das trilhas usam `trilhas.js`. As imagens e a fonte estão incluídas em `media/` e `fonts/`.

A integração anterior de CRM e suas credenciais não fazem parte deste repositório.
