# Site estático servido pelo nginx. As fotos do repositório vêm na resolução da câmera
# (até 6720 px, 20 MB); no build elas são reduzidas para web com o mesmo nome e proporção,
# então o HTML não muda e os originais continuam no repositório.
FROM alpine:3.20 AS media
RUN apk add --no-cache imagemagick imagemagick-jpeg imagemagick-webp
WORKDIR /site
COPY . .
RUN rm -rf .git Dockerfile nginx.conf README.md \
 && for f in media/*.jpg media/*.jpeg; do \
      magick "$f" -auto-orient -resize '2400x2400>' -strip -sampling-factor 4:2:0 \
        -interlace JPEG -quality 82 "$f"; \
    done \
 && for f in media/*.png; do magick "$f" -resize '2400x2400>' -strip "$f"; done \
 && ls -la media

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=media /site /usr/share/nginx/html
EXPOSE 80
