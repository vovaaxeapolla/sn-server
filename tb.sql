CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(128),
    password VARCHAR(32),
    activation_link TEXT,
    is_activated BOOLEAN,
    nickname VARCHAR(16)
);

CREATE TABLE refresh_tokens (
    user_id INTEGER,
    refresh_token TEXT
);

CREATE TABLE personal_info (
    user_id INTEGER,
    fullname VARCHAR(64),
    avatar VARCHAR(128) DEFAULT 'default.png'
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER,
    text TEXT,
    date INTEGER
);

CREATE TABLE posts_images (
    post_id INTEGER,
    value VARCHAR(128)
);

CREATE TABLE comments (
    author_id INTEGER,
    post_id INTEGER,
    text VARCHAR(128),
    date INTEGER
);

CREATE TABLE followers (
    follower INTEGER,
    account INTEGER
);

CREATE TABLE dialogs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(32)
);

CREATE TABLE chaters (
    dialog_id INTEGER,
    user_id INTEGER
);

CREATE TABLE messages (
    author_id INTEGER,
    dialog_id INTEGER,
    date INTEGER,
    text TEXT
);

CREATE TABLE online(
    user_id INTEGER,
    online BOOLEAN
);