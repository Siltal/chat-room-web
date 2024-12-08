create table if not exists `groups`
(
    group_id          int auto_increment
        primary key,
    group_name        varchar(100)                        not null,
    group_description text                                null,
    created_by        int                                 null,
    created_at        timestamp default CURRENT_TIMESTAMP null
);

create table if not exists private_chats
(
    chat_id    int auto_increment
        primary key,
    user1_id   int                                 null,
    user2_id   int                                 null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    constraint user1_id
        unique (user1_id, user2_id)
);

create table if not exists users
(
    user_id       int auto_increment
        primary key,
    username      varchar(50)                         not null,
    password_hash varchar(255)                        not null,
    email         varchar(100)                        null,
    avatar_url    varchar(255)                        null,
    created_at    timestamp default CURRENT_TIMESTAMP null,
    updated_at    timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
);

create table if not exists group_members
(
    group_id  int                                 not null,
    user_id   int                                 not null,
    joined_at timestamp default CURRENT_TIMESTAMP null,
    primary key (group_id, user_id),
    constraint group_members_ibfk_1
        foreign key (group_id) references `groups` (group_id)
            on delete cascade,
    constraint group_members_ibfk_2
        foreign key (user_id) references users (user_id)
            on delete cascade
);

create index user_id
    on group_members (user_id);

create table if not exists group_messages
(
    message_id int auto_increment
        primary key,
    group_id   int                                 null,
    sender_id  int                                 null,
    message    text                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    constraint group_messages_ibfk_1
        foreign key (group_id) references `groups` (group_id)
            on delete cascade,
    constraint group_messages_ibfk_2
        foreign key (sender_id) references users (user_id)
            on delete cascade
);

create index group_id
    on group_messages (group_id);

create index sender_id
    on group_messages (sender_id);

create table if not exists posts
(
    post_id    int auto_increment
        primary key,
    user_id    int                                 null,
    content    text                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    constraint posts_ibfk_1
        foreign key (user_id) references users (user_id)
            on delete cascade
);

create table if not exists comments
(
    comment_id int auto_increment
        primary key,
    post_id    int                                 null,
    user_id    int                                 null,
    content    text                                null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    constraint comments_ibfk_1
        foreign key (post_id) references posts (post_id)
            on delete cascade,
    constraint comments_ibfk_2
        foreign key (user_id) references users (user_id)
            on delete cascade
);

create index post_id
    on comments (post_id);

create index user_id
    on comments (user_id);

create index user_id
    on posts (user_id);

create table if not exists private_messages
(
    message_id  int auto_increment
        primary key,
    chat_id     int                                 null,
    sender_id   int                                 null,
    receiver_id int                                 null,
    message     text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP null,
    constraint private_messages_ibfk_1
        foreign key (chat_id) references private_chats (chat_id)
            on delete cascade,
    constraint private_messages_ibfk_2
        foreign key (sender_id) references users (user_id)
            on delete cascade,
    constraint private_messages_ibfk_3
        foreign key (receiver_id) references users (user_id)
            on delete cascade
);

create index chat_id
    on private_messages (chat_id);

create index receiver_id
    on private_messages (receiver_id);

create index sender_id
    on private_messages (sender_id);


