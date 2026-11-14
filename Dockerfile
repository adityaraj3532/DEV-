# Dev Computer website + backend. No runtime npm dependencies; the built site in frontend/dist is served as-is.
FROM node:24-alpine
WORKDIR /app
COPY frontend/serve.mjs ./
COPY frontend/server ./server
COPY frontend/dist ./dist
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 DATA_DIR=/data TRUST_PROXY=1
# Customer accounts, sessions, activity and the admin key live here: mount a persistent volume.
VOLUME /data
EXPOSE 8080
USER node
CMD ["node","serve.mjs"]
