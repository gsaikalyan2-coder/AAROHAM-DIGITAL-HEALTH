-- Aaroham PostgreSQL Database Initialization Schema

CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    ABHA_id VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    age INTEGER,
    home_state VARCHAR(50),
    current_address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_group VARCHAR(5),
    employer_name VARCHAR(100),
    employer_phone_number VARCHAR(15),
    is_vaccinated BOOLEAN DEFAULT FALSE,
    spoken_language VARCHAR(50),
    previous_health_issues TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    specialisation VARCHAR(100),
    hospital_name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    visit_date DATE DEFAULT CURRENT_DATE,
    symptoms TEXT,
    diagnosis TEXT NOT NULL,
    prescriptions TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(100) NOT NULL,
    dose_number VARCHAR(20),
    administered_on DATE DEFAULT CURRENT_DATE,
    next_due_on DATE,
    hospital_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Complete',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_reports (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    test_name VARCHAR(100) NOT NULL,
    result VARCHAR(100),
    notes TEXT,
    test_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS government_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    department VARCHAR(100) DEFAULT 'Kerala Health Services Department',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    content TEXT NOT NULL,
    sources VARCHAR(255) DEFAULT 'Aaroham Healthcare Knowledge Base',
    created_at TIMESTAMP DEFAULT NOW()
);

