CREATE TYPE match_status AS ENUM (
    'agendada',
    'em_andamento',
    'concluida',
    'cancelada'
);

CREATE TYPE participant_role AS ENUM (
    'jogador',
    'arbitro',
    'reserva'
);

CREATE TYPE participant_status AS ENUM (
    'confirmado',
    'pendente',
    'recusado'
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    sport_id INTEGER NOT NULL,
    organizer_id INTEGER NOT NULL,
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    match_date TIMESTAMP,
    location VARCHAR(255),
    max_players INTEGER,
    status match_status,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sport
        FOREIGN KEY(sport_id)
        REFERENCES sports(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE match_participants (
    match_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role participant_role,
    status participant_status,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (match_id, user_id),

    CONSTRAINT fk_match
        FOREIGN KEY(match_id)
        REFERENCES matches(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);