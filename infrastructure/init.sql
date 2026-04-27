-- script de initializacion de la base de datos

-- directores, coordinadores, estudiantes, evaluadores, administradores...
CREATE TABLE IF NOT EXISTS actor (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_full_name (full_name)
);

-- entidad de proyectos principal
CREATE TABLE IF NOT EXISTS project (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    context TEXT NOT NULL,
    status ENUM('proposed', 'under_review', 'approved', 'assigned', 'in_progress', 'closed', 'rejected') NOT NULL DEFAULT 'proposed',
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    estimated_cost DECIMAL(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_created_at (created_at)
);

-- escuelas/facultades envueltas en proyectos
CREATE TABLE IF NOT EXISTS project_school (
    project_id INTEGER NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, school_name),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    INDEX idx_school_name (school_name)
);

-- perosna natural
CREATE TABLE IF NOT EXISTS project_natural_proposer (
    project_id INTEGER PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    id_number VARCHAR(50) NOT NULL UNIQUE,
    age INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    INDEX idx_id_number (id_number),
    INDEX idx_email (email)
);

-- persona jutridica
CREATE TABLE IF NOT EXISTS project_legal_proposer (
    project_id INTEGER PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    nit VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    contact_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    INDEX idx_tax_id (tax_id),
    INDEX idx_email (email)
);

-- assign actors to projects with specific roles
CREATE TABLE IF NOT EXISTS project_actor_assignment (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    role ENUM('director', 'coordinator', 'student', 'evaluator', 'administrator') NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_actor (project_id, actor_id),
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actor(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_actor_id (actor_id),
    INDEX idx_role (role)
);

-- observaciones
CREATE TABLE IF NOT EXISTS project_observation (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_created_at (created_at)
);

-- etapa del proyecto
CREATE TABLE IF NOT EXISTS project_status_history (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    previous_status ENUM('proposed', 'under_review', 'approved', 'assigned', 'in_progress', 'closed', 'rejected'),
    next_status ENUM('proposed', 'under_review', 'approved', 'assigned', 'in_progress', 'closed', 'rejected') NOT NULL,
    description TEXT,
    author_actor_id INTEGER,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    FOREIGN KEY (author_actor_id) REFERENCES actor(id) ON DELETE SET NULL,
    INDEX idx_project_id (project_id),
    INDEX idx_next_status (next_status),
    INDEX idx_changed_at (changed_at)
);
