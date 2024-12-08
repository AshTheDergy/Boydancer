FROM node:20-alpine AS deps
WORKDIR /deps
COPY package.json package-lock.json /deps/
RUN npm i

FROM node:20-alpine
RUN apk add ffmpeg python3 py3-pip
RUN python3 -m pip install spotify-web-downloader --break-system-packages
WORKDIR /app
COPY . .
COPY --from=deps /deps/node_modules /app/node_modules
ENV SPOTIFY_COOKIES=/app/files/Spotify/cookies.txt
ENV WIDEVINE_DEVICE_FILE=/app/files/Spotify/device.wvd
ENV SPOTIFY_AAC_EXECUTABLE=/usr/bin/spotify-web-downloader
ENV FFMPEG_EXECUTABLE=/usr/bin/ffmpeg
ENTRYPOINT ["node", "."]
