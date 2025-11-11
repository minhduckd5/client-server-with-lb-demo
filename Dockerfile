version: "3.8"
services:

    server1:
        image: server1
        build:
            context: ./server
            dockerfile: Dockerfile
        container_name: ${SERVER_HOST_1}
        restart: always
        ports:
            - ${SERVER_PORT_1}:${SERVER_PORT_1}
        volumes:
            - server-v-node-modules:/server/node_modules
        environment:
            - SERVER_HOST: ${SERVER_HOST_1}
            - SERVER_PORT: ${SERVER_PORT_1}
            - DB_HOST: ${PG_HOST}
            - DB_PORT: ${PG_PORT}
            - DB_USER: ${PG_USER}
            - DB_PASSWORD: ${PG_PASSWORD}
            - DB_NAME: ${PG_DATABASE}
        depends_on:
        #     - server2
        #     - server3
        - postgres
    
    server2:
        image: server2
        build:
            context: ./server
            dockerfile: Dockerfile
        container_name: ${SERVER_HOST_2}
        restart: always
        ports:
            - ${SERVER_PORT_2}:${SERVER_PORT_2}
        volumes:
            - server-v-node-modules:/server/node_modules
        environment:
            - SERVER_HOST: ${SERVER_HOST_2}
            - SERVER_PORT: ${SERVER_PORT_2}
            - DB_HOST: ${PG_HOST}
            - DB_PORT: ${PG_PORT}
            - DB_USER: ${PG_USER}
            - DB_PASSWORD: ${PG_PASSWORD}
            - DB_NAME: ${PG_DATABASE}
        depends_on:
        #     - server1
        #     - server3
        - postgres
        
    server3:
        image: server3
        build:
            context: ./server
            dockerfile: Dockerfile
        container_name: ${SERVER_HOST_3}
        restart: always
        ports:
            - ${SERVER_PORT_3}:${SERVER_PORT_3}
        volumes:
            - server-v-node-modules:/server/node_modules
        environment:
            - SERVER_HOST: ${SERVER_HOST_3}
            - SERVER_PORT: ${SERVER_PORT_3}
            - DB_HOST: ${PG_HOST}
            - DB_PORT: ${PG_PORT}
            - DB_USER: ${PG_USER}
            - DB_PASSWORD: ${PG_PASSWORD}
            - DB_NAME: ${PG_DATABASE}
        depends_on:
        #     - server1
        #     - server2
        - postgres

    
    reverse-proxy:
        image: reverse-proxy
        build:
            context: ./reverse-proxy
            dockerfile: Dockerfile
        container_name: ${NGINX_HOST}
        restart: always
        env_file:
            - .env
        ports:
            - ${NGINX_PORT}:${NGINX_PORT}
        volumes:
            - ./nginx/default.conf.template:/etc/nginx/templates/default.conf.template
        depends_on:
            - server1
            - server2
            - server3
    
    # PostgreSQL Database
    postgres:
        image: postgres:15-alpine
        container_name: postgres
        restart: always
        environment:
            POSTGRES_DB: ${PG_DATABASE}
            POSTGRES_USER: ${PG_USER}
            POSTGRES_PASSWORD: ${PG_PASSWORD}
        ports:
            - ${PG_PORT}:${PG_PORT}
        volumes:
            - postgres-data:/var/lib/postgresql/data
volumes:
    server-v-node-modules:
        name: "server-v-node-modules"
    postgres-data:
        name: "postgres-data"