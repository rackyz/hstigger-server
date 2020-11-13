FROM node:12.18-alpine
ENV NODE_ENV=production
ENV LANG en_US.UTF-8
COPY ["package.json","package-lock.json*","./"]
# RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN npm install --production --silent
COPY . .
EXPOSE 6001
CMD ["npm", "start"]