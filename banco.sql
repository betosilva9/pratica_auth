CREATE DATABASE pratica-auth; 

USE pratica-auth;

CREATE TABLE usuarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produtos (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco NUMERIC(10,2) NOT NULL CHECK (preco>=0),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuarios_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    total NUMERIC (10,2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pedidos_usuarios,
    FOREIGN KEY (usuarios_id),
    REFERENCES usuarios(id),

    CONSTRAINT check_status_pedido
    CHECK (status  IN(
        'PENDENTE',
        'PREPARANDO',
        'SAIU_PARA_ENTREGA',
        'ENTREGUE',
        'CANCELADO',
    ))
);

CREATE TABLE intens_pedidos(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedidos INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),

    CONSTRAINT fk_item_pedidos,
    FOREIGN KEY (pedidos_id),
    REFERENCES pedidos(id),
    ON DELETE CASCADE,
    
    CONSTRAINT fk_item_produtos,
    FOREIGN KEY (produto_id),
    REFERENCES produto(id),

    CONSTRAINT item_prduto_unico
    UNIQUE (pedido_id , produto_id),
);